#!/usr/bin/env python3
"""
Script to bulk-remove all cameras from the Equature Aware app.
"""

import argparse
import json
import sys
import urllib.error
import urllib.request

BASE_URL = "http://localhost:3000/app/api/cameras"


def list_cameras() -> list:
    url = f"{BASE_URL}/list"
    print(f"  GET {url}")
    sys.stdout.flush()
    req = urllib.request.Request(url, method="GET")
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.loads(resp.read())
        return result.get("data", result) if isinstance(result, dict) else result


def delete_camera(camera_id: str) -> bool:
    url = f"{BASE_URL}/delete"
    payload = json.dumps({"camera_id": camera_id}).encode()
    print(f"  POST {url}  camera_id={camera_id}")
    sys.stdout.flush()
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        body = resp.read()
        print(f"  Response: HTTP {resp.status}")
        sys.stdout.flush()
        return True


def main():
    parser = argparse.ArgumentParser(
        description="Bulk-remove cameras from Equature Aware"
    )
    parser.add_argument(
        "-y", "--yes", action="store_true", help="Skip confirmation prompt"
    )
    args = parser.parse_args()

    print("=== Equature Aware Camera Bulk-Remove Tool ===")
    print()

    print("Fetching camera list...")
    sys.stdout.flush()
    try:
        cameras = list_cameras()
    except Exception as e:
        print(f"Failed to fetch cameras: {e}")
        sys.stdout.flush()
        return

    cameras = cameras if isinstance(cameras, list) else []

    if not cameras:
        print("No cameras found.")
        sys.stdout.flush()
        return

    print(f"\nFound {len(cameras)} camera(s):")
    for c in cameras:
        print(f"  {c.get('name', '?')}  (id: {c.get('camera_id', c.get('id', '?'))})")
    sys.stdout.flush()

    print()
    if args.yes:
        confirm = "y"
    else:
        confirm = input("Remove ALL cameras listed above? [y/N] ").strip().lower()

    if confirm != "y":
        print("Aborted.")
        sys.stdout.flush()
        return

    print()
    sys.stdout.flush()
    success, failed = 0, []

    for c in cameras:
        cid = c.get("camera_id", c.get("id"))
        name = c.get("name", "?")
        if not cid:
            print(f"  Skipped {name}: no camera_id field")
            sys.stdout.flush()
            failed.append(name)
            continue
        try:
            delete_camera(cid)
            print(f"  Removed {name}")
            sys.stdout.flush()
            success += 1
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            print(f"  FAILED {name}: HTTP {e.code} - {body[:200]}")
            sys.stdout.flush()
            failed.append(name)
        except Exception as e:
            print(f"  FAILED {name}: {e}")
            sys.stdout.flush()
            failed.append(name)

    print(f"\nDone. {success}/{len(cameras)} cameras removed.")
    if failed:
        print(f"Failed ({len(failed)}): {failed}")
    sys.stdout.flush()


if __name__ == "__main__":
    main()
