#!/usr/bin/env python3
"""Register and pace one existing complete-body stride; no generated poses."""
import argparse
import copy
import hashlib
import io
import json
import statistics
import subprocess
from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
CLIP = '6_bit_walk_walk'
SOURCE_REVISION = 'a4c1b7cf6fec0a083a4812ae1ea76edef45a5911'
SOURCE_HASH = '65e919b8ad1858e28ed118ab417ef0941bde12aac3e03de025e34b9e1183f54c'


def visible_bounds(frame):
    return frame.getchannel('A').point(lambda a: 255 if a >= 128 else 0).getbbox()


def waist_center(frame):
    mask = frame.getchannel('A')
    centers = []
    for y in range(164, 201):
        runs, start = [], None
        for x in range(frame.width + 1):
            solid = x < frame.width and mask.getpixel((x, y)) >= 128
            if solid and start is None:
                start = x
            if not solid and start is not None:
                runs.append((start, x - 1)); start = None
        left, right = max(runs, key=lambda run: run[1] - run[0])
        if right - left >= 12:
            centers.append((left + right) / 2)
    return statistics.median(centers)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', help='Optional copy of the immutable original walk atlas')
    args = parser.parse_args()
    calibration_path = ROOT / 'assets/sprites-v3/calibration.json'
    calibration = json.loads(calibration_path.read_text())
    record = calibration[CLIP]
    atlas_path = ROOT / 'assets/sprites-v3/prepared' / (CLIP + '.webp')
    if record.get('motionPolish', {}).get('version') == 1:
        assert hashlib.sha256(atlas_path.read_bytes()).hexdigest() == record['sha256']
        print('Walk polish already current'); return
    data = Path(args.source).read_bytes() if args.source else subprocess.check_output(
        ['git', 'show', SOURCE_REVISION + ':assets/sprites-v3/prepared/' + CLIP + '.webp'], cwd=ROOT)
    assert hashlib.sha256(data).hexdigest() == SOURCE_HASH, 'Unexpected original drawing source'
    source = Image.open(io.BytesIO(data)).convert('RGBA')
    width, height, columns, anchor = record['width'], record['height'], record['columns'], record['anchorY']
    sequence = list(range(12)) * 4
    frames = [source.crop((i % columns * width, i // columns * height,
                           (i % columns + 1) * width, (i // columns + 1) * height)) for i in range(12)]
    tops = [visible_bounds(frame)[1] for frame in frames]
    waist = [waist_center(frame) for frame in frames]
    cleaned, transforms = [], []
    for i, frame in enumerate(frames):
        top = sum(tops[(i + j) % 12] * weight for j, weight in zip(range(-2, 3), [1, 2, 3, 2, 1])) / 9
        scale = (anchor - top) / (anchor - tops[i])
        scaled = frame.convert('RGBa').resize((round(width * scale), round(height * scale)), Image.Resampling.LANCZOS).convert('RGBA')
        dx = round(record['anchorX'] - waist[i] * scale)
        dy = anchor - (visible_bounds(scaled)[3] - 1)
        registered = Image.new('RGBA', (width, height))
        registered.alpha_composite(scaled, (dx, dy))
        assert visible_bounds(registered)[3] - 1 == anchor
        cleaned.append(registered)
        transforms.append({'sourceFrame': i, 'waistX': waist[i], 'scale': scale, 'translate': [dx, dy]})
    # Near-duplicate drawings receive less time; larger stride changes receive
    # more. The complete existing four-second / 48-slot contract is retained.
    motion = []
    for i, frame in enumerate(cleaned):
        difference = ImageChops.difference(frame.getchannel('A'), cleaned[(i + 1) % 12].getchannel('A')).crop((0, 155, width, height))
        motion.append(sum(value * count for value, count in enumerate(difference.histogram())))
    durations = [value / sum(motion) * 1000 for value in motion]
    for _ in range(30):
        durations = [max(45, min(135, value)) for value in durations]
        free = [i for i, value in enumerate(durations) if 45 < value < 135]
        if abs(sum(durations) - 1000) < 1e-8: break
        adjustment = (1000 - sum(durations)) / len(free)
        for i in free: durations[i] += adjustment
    assert abs(sum(durations) - 1000) < 1e-6
    # Store the twelve drawings once. Forty-eight frame keys reference these
    # cells, preserving the host clock while reducing decoding/storage work.
    output = Image.new('RGBA', (columns * width, 2 * height))
    for index, frame in enumerate(cleaned):
        output.alpha_composite(frame, (index % columns * width, index // columns * height))
    original_registration = copy.deepcopy(record['registration'])
    record['registration'] = []
    metadata_path = atlas_path.with_suffix('.json')
    metadata = json.loads(metadata_path.read_text())
    for destination, source_index in enumerate(sequence):
        row = copy.deepcopy(original_registration[source_index])
        row.update({'frame': destination, 'motionRegistration': transforms[source_index]})
        record['registration'].append(row)
        entry = list(metadata['frames'].values())[destination]
        entry['duration'] = durations[source_index]
        entry['frame'] = {'x': source_index % columns * width, 'y': source_index // columns * height, 'w': width, 'h': height}
    output.save(atlas_path, format='WEBP', lossless=True, quality=100, method=6, exact=True)
    record['headRows'] = [visible_bounds(cleaned[i])[1] for i in sequence]
    record['footRows'] = [anchor] * len(sequence)
    record['atlasFrameIndices'] = sequence
    record['atlasSize'] = list(output.size)
    metadata['meta']['size'] = {'w': output.width, 'h': output.height}
    record['previousSmoothing'] = record.pop('smoothing')
    record['sha256'] = hashlib.sha256(atlas_path.read_bytes()).hexdigest()
    record['motionPolish'] = {'version': 1, 'method': 'registered-single-stride-no-frame-blending',
        'sourceRevision': SOURCE_REVISION, 'sourceSha256': SOURCE_HASH, 'sequence': sequence,
        'uniquePoses': 12, 'strideDurationMs': 1000, 'frameDurationsMs': durations,
        'sourceWaistSpanPx': max(waist) - min(waist),
        'registeredWaistSpanPx': max(t['waistX'] * t['scale'] + t['translate'][0] for t in transforms) - min(t['waistX'] * t['scale'] + t['translate'][0] for t in transforms),
        'preserves': ['design', 'wholeBodyPoses', 'frameSlots', 'fourSecondClip', 'anchor', 'gameplayBody', 'movementSpeed']}
    metadata_path.write_text(json.dumps(metadata, indent=2) + '\n')
    calibration_path.write_text(json.dumps(calibration, indent=2) + '\n')
    print(json.dumps({'clip': CLIP, 'bytes': atlas_path.stat().st_size, **record['motionPolish']}, indent=2))


if __name__ == '__main__':
    main()
