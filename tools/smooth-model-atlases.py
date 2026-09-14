#!/usr/bin/env python3
"""Apply a restrained temporal anti-flicker pass to installed sprite atlases.

The pass blends complete registered frames in premultiplied RGBA space. It does
not add frames, change timing, alter cell geometry, or move authored anchors.
"""

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
CALIBRATION = ROOT / "assets/sprites-v3/calibration.json"
PREPARED = ROOT / "assets/sprites-v3/prepared"
VERSION = 1
CENTER_WEIGHT = 0.82
NEIGHBOR_WEIGHT = 0.09
NON_LOOPING_MARKERS = ("_jump_", "_attack_")


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def frame_cells(atlas, record):
    width, height = record["width"], record["height"]
    columns = record["columns"]
    return [
        atlas.crop(((index % columns) * width, (index // columns) * height,
                    (index % columns + 1) * width, (index // columns + 1) * height))
        for index in range(record["frames"])
    ]


def temporal_blend(frames, looping):
    premultiplied = [frame.convert("RGBa") for frame in frames]
    smoothed = []
    last = len(frames) - 1
    for index, current in enumerate(premultiplied):
        previous = premultiplied[index - 1 if index else (last if looping else 0)]
        following = premultiplied[index + 1 if index < last else (0 if looping else last)]
        neighbors = Image.blend(previous, following, 0.5)
        smoothed.append(Image.blend(current, neighbors, 1 - CENTER_WEIGHT).convert("RGBA"))
    return smoothed


def rebuild_atlas(source, record, frames):
    output = Image.new("RGBA", source.size, (0, 0, 0, 0))
    width, height = record["width"], record["height"]
    columns = record["columns"]
    for index, frame in enumerate(frames):
        output.alpha_composite(frame, ((index % columns) * width, (index // columns) * height))
    return output


def run(force=False):
    calibration = json.loads(CALIBRATION.read_text())
    changed = []
    for clip, record in calibration.items():
        atlas_path = PREPARED / f"{clip}.webp"
        current_hash = sha256(atlas_path)
        previous_pass = record.get("smoothing")
        if previous_pass and previous_pass.get("version") == VERSION and record.get("sha256") == current_hash and not force:
            continue
        with Image.open(atlas_path) as image:
            source = image.convert("RGBA")
        looping = not any(marker in clip for marker in NON_LOOPING_MARKERS)
        frames = temporal_blend(frame_cells(source, record), looping)
        output = rebuild_atlas(source, record, frames)
        temporary = atlas_path.with_suffix(".webp.tmp")
        output.save(temporary, format="WEBP", lossless=True, quality=100, method=6, exact=True)
        temporary.replace(atlas_path)
        output_hash = sha256(atlas_path)
        record["sha256"] = output_hash
        record["smoothing"] = {
            "version": VERSION,
            "method": "premultiplied-rgba-temporal-3-tap",
            "weights": [NEIGHBOR_WEIGHT, CENTER_WEIGHT, NEIGHBOR_WEIGHT],
            "edgePolicy": "wrap" if looping else "clamp",
            "inputSha256": current_hash,
        }
        changed.append({"clip": clip, "frames": record["frames"], "sha256": output_hash})
    CALIBRATION.write_text(json.dumps(calibration, indent=2) + "\n")
    return changed


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--force", action="store_true", help="reapply even when this version is recorded")
    args = parser.parse_args()
    print(json.dumps({"version": VERSION, "changed": run(args.force)}, indent=2))
