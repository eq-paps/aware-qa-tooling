#!/usr/bin/env python3
"""
Script to bulk-remove all cameras from the Equature Aware app.
"""

import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:3000/app/api/cameras"


def list_cameras() -> list:
    req = urllib.request.Request(f"{BASE_URL}/list", method="GET")
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())
        return result.get("data", result) if isinstance(result, dict) else result


def delete_camera(camera_id: str) -> None:
    req = urllib.request.Request(f"{BASE_URL}/{camera_id}", method="DELETE")
    with urllib.request.urlopen(req) as resp:
        resp.read()


def main():
    print("=== Equature Aware Camera Bulk-Remove Tool ===")
    print()

    print("Fetching camera list...")
    try:
        cameras = list_cameras()
    except Exception as e:
        print(f"Failed to fetch cameras: {e}")
        return

    cameras = cameras if isinstance(cameras, list) else []

    if not cameras:
        print("No cameras found.")
        return

    print(f"Found {len(cameras)} camera(s):")
    for c in cameras:
        print(f"  {c['name']}  (id: {c['camera_id']})")

    print()
    confirm = input("Remove all of the above cameras? [y/N] ").strip().lower()
    if confirm != "y":
        print("Aborted.")
        return

    print()
    success, failed = 0, []

    for c in cameras:
        try:
            delete_camera(c["camera_id"])
            print(f"  ✓ Removed {c['name']}  (id: {c['camera_id']})")
            success += 1
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            print(f"  ✗ Failed {c['name']}: HTTP {e.code} – {body[:120]}")
            failed.append(c["name"])
        except Exception as e:
            print(f"  ✗ Failed {c['name']}: {e}")
            failed.append(c["name"])

    print(f"\nDone. {success}/{len(cameras)} cameras removed successfully.")
    if failed:
        print(f"Failed cameras: {failed}")


if __name__ == "__main__":
    main()
