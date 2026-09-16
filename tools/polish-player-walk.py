#!/usr/bin/env python3
"""Restore the complete sixteen-pose stride from the immutable whole-body source."""
import argparse
import copy
import hashlib
import io
import json
import statistics
import subprocess
from pathlib import Path
from PIL import Image

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
    if record.get('motionPolish', {}).get('version') == 2:
        assert hashlib.sha256(atlas_path.read_bytes()).hexdigest() == record['sha256']
        print('Walk polish already current'); return
    data = Path(args.source).read_bytes() if args.source else subprocess.check_output(
        ['git', 'show', SOURCE_REVISION + ':assets/sprites-v3/prepared/' + CLIP + '.webp'], cwd=ROOT)
    assert hashlib.sha256(data).hexdigest() == SOURCE_HASH, 'Unexpected original drawing source'
    source = Image.open(io.BytesIO(data)).convert('RGBA')
    width, height, columns, anchor = record['width'], record['height'], record['columns'], record['anchorY']
    sequence = list(range(16)) * 4
    frames = [source.crop((i % columns * width, i // columns * height,
                           (i % columns + 1) * width, (i // columns + 1) * height)) for i in range(16)]
    tops = [visible_bounds(frame)[1] for frame in frames]
    waist = [waist_center(frame) for frame in frames]
    cleaned, transforms = [], []
    for i, frame in enumerate(frames):
        top = sum(tops[(i + j) % 16] * weight for j, weight in zip(range(-2, 3), [1, 2, 3, 2, 1])) / 9
        scale = (anchor - top) / (anchor - tops[i])
        scaled = frame.convert('RGBa').resize((round(width * scale), round(height * scale)), Image.Resampling.LANCZOS).convert('RGBA')
        dx = round(record['anchorX'] - waist[i] * scale)
        dy = anchor - (visible_bounds(scaled)[3] - 1)
        registered = Image.new('RGBA', (width, height))
        registered.alpha_composite(scaled, (dx, dy))
        assert visible_bounds(registered)[3] - 1 == anchor
        cleaned.append(registered)
        transforms.append({'sourceFrame': i, 'waistX': waist[i], 'scale': scale, 'translate': [dx, dy]})
    # The previous twelve-pose selection ended before the arm/leg return.
    # Restore all sixteen drawings of the first complete stride; a constant
    # 62.5 ms clock avoids the old 45–135 ms stop/start cadence. Four full
    # strides still take four seconds, with no duplicated endpoint.
    durations = [62.5] * 16
    # Each drawing is stored once; the host frame list repeats its atlas cell.
    output = Image.new('RGBA', (columns * width, 2 * height))
    for index, frame in enumerate(cleaned):
        output.alpha_composite(frame, (index % columns * width, index // columns * height))
    source_calibration = json.loads(subprocess.check_output(['git', 'show', SOURCE_REVISION + ':assets/sprites-v3/calibration.json'], cwd=ROOT))
    original_registration = source_calibration[CLIP]['registration']
    record['registration'] = []
    metadata_path = atlas_path.with_suffix('.json')
    metadata = json.loads(metadata_path.read_text())
    template = copy.deepcopy(next(iter(metadata['frames'].values())))
    metadata['frames'] = {}
    for destination, source_index in enumerate(sequence):
        row = copy.deepcopy(original_registration[source_index])
        row.update({'frame': destination, 'motionRegistration': transforms[source_index]})
        record['registration'].append(row)
        entry = copy.deepcopy(template)
        metadata['frames'][f'{CLIP}_{destination:03}.png'] = entry
        entry['duration'] = durations[source_index]
        entry['frame'] = {'x': source_index % columns * width, 'y': source_index // columns * height, 'w': width, 'h': height}
    output.save(atlas_path, format='WEBP', lossless=True, quality=100, method=6, exact=True)
    record['headRows'] = [visible_bounds(cleaned[i])[1] for i in sequence]
    record['footRows'] = [anchor] * len(sequence)
    record['atlasFrameIndices'] = sequence
    record['atlasSize'] = list(output.size)
    metadata['meta']['size'] = {'w': output.width, 'h': output.height}
    record['frames'] = len(sequence)
    metadata['meta']['frameTags'][0]['to'] = len(sequence) - 1
    record['previousMotionPolish'] = record['motionPolish']
    record['sha256'] = hashlib.sha256(atlas_path.read_bytes()).hexdigest()
    record['motionPolish'] = {'version': 2, 'method': 'complete-sixteen-pose-stride-no-frame-blending',
        'sourceRevision': SOURCE_REVISION, 'sourceSha256': SOURCE_HASH, 'sequence': sequence,
        'uniquePoses': 16, 'strideDurationMs': 1000, 'frameDurationsMs': durations,
        'sourceWaistSpanPx': max(waist) - min(waist),
        'registeredWaistSpanPx': max(t['waistX'] * t['scale'] + t['translate'][0] for t in transforms) - min(t['waistX'] * t['scale'] + t['translate'][0] for t in transforms),
        'preserves': ['design', 'wholeBodyPoses', 'fourSecondClip', 'anchor', 'gameplayBody', 'movementSpeed']}
    metadata_path.write_text(json.dumps(metadata, indent=2) + '\n')
    calibration_path.write_text(json.dumps(calibration, indent=2) + '\n')
    print(json.dumps({'clip': CLIP, 'bytes': atlas_path.stat().st_size, **record['motionPolish']}, indent=2))


if __name__ == '__main__':
    main()
