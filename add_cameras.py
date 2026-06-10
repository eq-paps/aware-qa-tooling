#!/usr/bin/env python3
"""
Script to bulk-add cameras to the Equature Aware app.
Each camera gets a unique LT-prefixed name and a sequential RTSP URL.
The stream counter is persisted so subsequent runs pick up where the last left off.
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
import uuid

COUNTER_FILE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), ".camera_counter"
)

BASE_URL = "http://localhost:3000/app/api/cameras"


def load_env() -> dict:
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    env = {}
    try:
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, _, val = line.partition("=")
                env[key.strip()] = val.strip()
    except FileNotFoundError:
        pass
    return env


def read_counter() -> int:
    try:
        with open(COUNTER_FILE) as f:
            return int(f.read().strip())
    except (FileNotFoundError, ValueError):
        return 1


def write_counter(val: int) -> None:
    with open(COUNTER_FILE, "w") as f:
        f.write(str(val))


def generate_name() -> str:
    return f"LT-{uuid.uuid4().hex[:12].upper()}"


def create_camera(
    name: str, ip: str, port: int, stream_num: int, snapshot_url: str
) -> dict:
    rtsp_url = f"rtsp://{ip}:{port}/test-stream-{stream_num}"
    payload = json.dumps(
        {
            "name": name,
            "description": "",
            "username": "a",
            "password": "1",
            "rtspUrl": rtsp_url,
            "snapshotUrl": snapshot_url,
            "ipAddress": ip,
        }
    ).encode()

    req = urllib.request.Request(
        f"{BASE_URL}/create",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def main():
    parser = argparse.ArgumentParser(description="Bulk-add cameras to Equature Aware")
    parser.add_argument("count", nargs="?", type=int, help="Number of cameras to add")
    parser.add_argument(
        "--reset", "-r", type=int, metavar="N", help="Reset the stream counter to N"
    )
    parser.add_argument(
        "--show",
        "-s",
        action="store_true",
        help="Show the current counter value and exit",
    )
    args = parser.parse_args()

    if args.show:
        print(read_counter())
        return

    if args.reset is not None:
        write_counter(args.reset)
        print(f"Counter reset to {args.reset}")
        return

    env = load_env()
    ip = env.get("rtsp_ip", "192.168.5.93")
    port = int(env.get("rtsp_port", "8554"))
    snapshot_port = env.get("snapshot_port", "3456")
    snapshot_url = f"http://{ip}:{snapshot_port}/api/files/snapshot/CityBusline.mp4"

    print("=== Equature Aware Camera Bulk-Add Tool ===")
    print(f"RTSP IP: {ip}:{port}")
    print("Each camera gets an LT-prefixed name and a sequential test-stream URL.")
    print()

    count = args.count
    if count is None:
        while True:
            try:
                count = int(input("How many cameras would you like to add? "))
                if count <= 0:
                    print("Please enter a positive number.")
                    continue
                break
            except ValueError:
                print("Invalid input. Please enter a whole number.")

    stream_num = read_counter()
    print(f"\nStarting stream number: {stream_num}")
    sys.stdout.flush()
    print(f"Adding {count} camera(s)...\n")
    sys.stdout.flush()

    success, failed = 0, []

    for i in range(count):
        current_stream = stream_num + i
        name = generate_name()
        try:
            cam = create_camera(name, ip, port, current_stream, snapshot_url)
            print(
                f"  Created {cam['name']}  (id: {cam['camera_id']})  →  test-stream-{current_stream}"
            )
            sys.stdout.flush()
            success += 1
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            print(f"  Failed camera creation: HTTP {e.code}")
            print(f"    URL: {f'{BASE_URL}/create'}")
            print(f"    Response headers: {dict(e.headers)}")
            print(f"    Body: {body[:500] or '(empty)'}")
            sys.stdout.flush()
            failed.append(body[:500] if body else "(empty)")
        except Exception as e:
            print(f"  Failed camera creation: {e}")
            sys.stdout.flush()
            failed.append(str(e))

    if success > 0:
        write_counter(stream_num + success)
        print(f"\nCounter advanced to: {stream_num + success}")

    print(f"\nDone. {success}/{count} cameras added successfully.")
    if failed:
        print(f"Failed creations: {len(failed)}")


if __name__ == "__main__":
    main()
