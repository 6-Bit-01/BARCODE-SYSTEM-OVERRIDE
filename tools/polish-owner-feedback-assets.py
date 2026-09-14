#!/usr/bin/env python3
"""Build the owner-requested idle-loop and boss-flourish clarity repairs.

The player idle keeps the existing 26-frame/12 fps contract, but uses one
coherent drawing take in a forward-and-return loop instead of crossing between
two independently drawn takes.  The retained low-resolution boss flourish is
rebuilt at 2x frame resolution with alpha-safe Lanczos enlargement and a light
RGB sharpen; its 48 frames and durations remain unchanged.
"""

import copy
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
PREPARED = ROOT / "assets/sprites-v3/prepared"
SOURCES = ROOT / "assets/sprites-v3/sources"
CALIBRATION = ROOT / "assets/sprites-v3/calibration.json"
IDLE_CLIP = "6_bit_idle_idle"
ATTACK_CLIP = "sector_1_boss_attack_attack"
IDLE_INPUT_SHA256 = "b965ec3563af031469e8b4375328515b4833603654fd2df64bd6246739ecec89"
ATTACK_IMAGE_SHA256 = "9d29bc01b7224ab1cd376577481ff944cdd2f7e5fc16f2fffa7ebae3795b6c6a"
ATTACK_JSON_SHA256 = "6fa40630f9c310f1a9c0cd557832df44b5c95e2a5c008d22b3cb6312a91b3551"


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save_lossless(image, path):
    temporary = path.with_suffix(path.suffix + ".tmp")
    image.save(temporary, format="WEBP", lossless=True, quality=100, method=6, exact=True)
    temporary.replace(path)


def alpha_rows(frames):
    heads = []
    feet = []
    for frame in frames:
        alpha = frame.getchannel("A")
        bounds = alpha.point(lambda value: 255 if value >= 128 else 0).getbbox()
        if not bounds:
            raise ValueError("Prepared frame has no visible pixels")
        heads.append(bounds[1])
        feet.append(bounds[3] - 1)
    return heads, feet


def polish_idle(calibration):
    atlas_path = PREPARED / f"{IDLE_CLIP}.webp"
    record = calibration[IDLE_CLIP]
    current_hash = sha256(atlas_path)
    if record.get("loopPolish", {}).get("version") == 1 and current_hash == record.get("sha256"):
        return {"clip": IDLE_CLIP, "status": "current", "sha256": current_hash}
    if current_hash != IDLE_INPUT_SHA256:
        raise ValueError(f"Unexpected {IDLE_CLIP} input: {current_hash}")

    with Image.open(atlas_path) as image:
        source = image.convert("RGBA")
    width, height, columns = record["width"], record["height"], record["columns"]
    frames = [source.crop(((index % columns) * width, (index // columns) * height,
                           (index % columns + 1) * width, (index // columns + 1) * height))
              for index in range(record["frames"])]
    # Frames 0–12 are one continuous drawing take. Hold each endpoint for one
    # frame, then reverse the interior. This avoids the take splice, the loop
    # snap, and the sharper 12→13 pose change while retaining 26 frame slots.
    sequence = [0, 0] + list(range(1, 13)) + [12] + list(range(11, 0, -1))
    if len(sequence) != record["frames"]:
        raise ValueError("Idle polish must preserve the 26-frame clock")
    selected = [frames[index] for index in sequence]
    output = Image.new("RGBA", source.size, (0, 0, 0, 0))
    for index, frame in enumerate(selected):
        output.alpha_composite(frame, ((index % columns) * width, (index // columns) * height))
    save_lossless(output, atlas_path)

    original_registration = copy.deepcopy(record["registration"])
    record["registration"] = []
    for destination, source_index in enumerate(sequence):
        registration = copy.deepcopy(original_registration[source_index])
        registration["frame"] = destination
        registration["selectedSourceFrame"] = source_index
        record["registration"].append(registration)
    record["headRows"] = [record["headRows"][index] for index in sequence]
    record["footRows"] = [record["footRows"][index] for index in sequence]
    record["sha256"] = sha256(atlas_path)
    record["loopPolish"] = {
        "version": 1,
        "method": "single-take-forward-return",
        "inputSha256": current_hash,
        "sequence": sequence,
        "removedTransitions": ["12->13", "13->14", "25->0"],
        "preserves": ["frameCount", "fps", "cellGeometry", "anchor", "gameplayBody"],
    }
    return {"clip": IDLE_CLIP, "status": "rebuilt", "sha256": record["sha256"], "sequence": sequence}


def double_geometry(value):
    return value * 2 if isinstance(value, (int, float)) else value


def polish_boss_attack(calibration):
    source_image_path = SOURCES / f"{ATTACK_CLIP}.original.webp"
    source_json_path = SOURCES / f"{ATTACK_CLIP}.original.json"
    if sha256(source_image_path) != ATTACK_IMAGE_SHA256:
        raise ValueError("Unexpected boss flourish source image")
    if sha256(source_json_path) != ATTACK_JSON_SHA256:
        raise ValueError("Unexpected boss flourish source metadata")

    metadata = json.loads(source_json_path.read_text())
    frame_items = list(metadata["frames"].items())
    if len(frame_items) != 48:
        raise ValueError("Boss flourish must retain 48 frames")
    with Image.open(source_image_path) as image:
        source = image.convert("RGBA")

    columns, width, height, factor = 7, 256, 155, 2
    output_width, output_height = columns * width * factor, 7 * height * factor
    output = Image.new("RGBA", (output_width, output_height), (0, 0, 0, 0))
    prepared_frames = []
    prepared_metadata = copy.deepcopy(metadata)
    for index, (key, item) in enumerate(frame_items):
        frame = item["frame"]
        crop = source.crop((frame["x"], frame["y"], frame["x"] + frame["w"], frame["y"] + frame["h"]))
        enlarged = crop.resize((width * factor, height * factor), Image.Resampling.LANCZOS)
        rgb = enlarged.convert("RGB").filter(ImageFilter.UnsharpMask(radius=0.8, percent=105, threshold=2))
        rgb.putalpha(enlarged.getchannel("A"))
        x, y = index % columns * width * factor, index // columns * height * factor
        output.alpha_composite(rgb, (x, y))
        prepared_frames.append(rgb)
        current = prepared_metadata["frames"][key]
        current["frame"] = {"x": x, "y": y, "w": width * factor, "h": height * factor}
        for geometry_key in ("spriteSourceSize", "sourceSize"):
            current[geometry_key] = {name: double_geometry(value) for name, value in current[geometry_key].items()}

    prepared_image_path = PREPARED / f"{ATTACK_CLIP}.webp"
    prepared_json_path = PREPARED / f"{ATTACK_CLIP}.json"
    save_lossless(output, prepared_image_path)
    meta = prepared_metadata["meta"]
    meta["size"] = {"w": output_width, "h": output_height}
    meta["anchor"]["x"] *= factor
    meta["anchor"]["y"] *= factor
    meta["referenceAlignment"]["referenceBounds"] = {"width": width * factor, "height": height * factor}
    meta["referenceAlignment"]["frameBounds"] = {"width": width * factor, "height": height * factor}
    prepared_json_path.write_text(json.dumps(prepared_metadata, indent=2) + "\n")

    heads, _ = alpha_rows(prepared_frames)
    record = {
        "frames": 48,
        "factor": factor,
        "scale": 1,
        "anchorX": 128 * factor,
        "anchorY": 154 * factor,
        "width": width * factor,
        "height": height * factor,
        "columns": columns,
        "footRows": [154 * factor] * 48,
        "headRows": heads,
        "atlasSize": [output_width, output_height],
        "sha256": sha256(prepared_image_path),
        "originalFacing": "unchanged",
        "productionFacing": "unchanged",
        "sourceSignature": ATTACK_IMAGE_SHA256,
        "clarityPolish": {
            "version": 1,
            "method": "alpha-safe-lanczos-2x-rgb-unsharp",
            "inputImageSha256": ATTACK_IMAGE_SHA256,
            "inputMetadataSha256": ATTACK_JSON_SHA256,
            "factor": factor,
            "unsharp": {"radius": 0.8, "percent": 105, "threshold": 2},
            "preserves": ["frameCount", "fps", "durations", "poses", "normalizedAnchor", "gameplayBody"],
        },
    }
    calibration[ATTACK_CLIP] = record
    return {"clip": ATTACK_CLIP, "status": "rebuilt", "sha256": record["sha256"], "atlasSize": record["atlasSize"]}


def main():
    calibration = json.loads(CALIBRATION.read_text())
    results = [polish_idle(calibration), polish_boss_attack(calibration)]
    CALIBRATION.write_text(json.dumps(calibration, indent=2) + "\n")
    print(json.dumps({"version": 1, "results": results}, indent=2))


if __name__ == "__main__":
    main()
