#!/usr/bin/env python3
"""Technically extract/pad the authored run silhouettes; never resample artwork."""
import argparse
import hashlib
import json
import statistics
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
CLIP = '6_bit_run_run'
WIDTH, HEIGHT, AX, AY = 512, 512, 240, 448
HIP_X = [158, 451, 750, 1071, 174, 453, 764, 1083, 171, 452, 756, 1084]
LIFT = [0, 0, 12, 18, 12, 0, 0, 10, 18, 12, 6, 0]

def sha(data): return hashlib.sha256(data).hexdigest()

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--source', required=True)
    args = p.parse_args()
    out = ROOT / 'assets/level1-run'
    out.mkdir(parents=True, exist_ok=True)
    source = Path(args.source).read_bytes()
    (out / '6_bit_run_source.png').write_bytes(source)
    pixels = np.array(Image.open(args.source).convert('RGBA'))
    labels, _ = ndimage.label(pixels[:, :, 3] >= 64)
    groups = []
    for label, bounds in enumerate(ndimage.find_objects(labels), 1):
        if bounds is not None and np.sum(labels[bounds] == label) > 10000:
            groups.append((label, bounds))
    assert len(groups) == 12, 'exactly twelve complete opaque character silhouettes'
    groups.sort(key=lambda item: (round(item[1][0].start / 418), item[1][1].start))
    opaque = np.isin(labels, [label for label, _ in groups])
    nearest = ndimage.distance_transform_edt(~opaque, return_distances=False, return_indices=True)
    assigned = labels[tuple(nearest)]
    atlas = Image.new('RGBA', (WIDTH * 4, HEIGHT * 3))
    frames, registration, frame_hashes = {}, [], []
    for i, (label, _) in enumerate(groups):
        cell = pixels.copy()
        cell[assigned != label] = 0
        full = Image.fromarray(cell, 'RGBA')
        alpha = full.getchannel('A')
        opaque_bounds = alpha.point(lambda a: 255 if a >= 128 else 0).getbbox()
        bounds = alpha.getbbox()
        assert bounds is not None and opaque_bounds is not None
        dx, dy = AX - HIP_X[i], AY - LIFT[i] - (opaque_bounds[3] - 1)
        crop = full.crop(bounds)
        destination = (bounds[0] + dx, bounds[1] + dy)
        assert destination[0] >= 0 and destination[1] >= 0
        assert destination[0] + crop.width <= WIDTH and destination[1] + crop.height <= HEIGHT
        packed = Image.new('RGBA', (WIDTH, HEIGHT))
        packed.paste(crop, destination)
        # Integer crop/padding retains every source RGBA pixel of this silhouette.
        assert np.array_equal(np.array(packed.crop((*destination, destination[0] + crop.width, destination[1] + crop.height))), np.array(crop))
        atlas.paste(packed, (i % 4 * WIDTH, i // 4 * HEIGHT))
        frame_hashes.append(sha(packed.tobytes()))
        registration.append({'frame': i, 'sourceBounds': list(bounds), 'sourceOpaqueBounds': list(opaque_bounds),
                             'sourceHipX': HIP_X[i], 'translate': [dx, dy], 'hipX': AX,
                             'headRow': opaque_bounds[1] + dy, 'visibleFootRow': AY - LIFT[i], 'flightLiftPx': LIFT[i]})
        frames[f'{CLIP}_{i:03}.png'] = {'frame': {'x': i % 4 * WIDTH, 'y': i // 4 * HEIGHT, 'w': WIDTH, 'h': HEIGHT},
            'rotated': False, 'trimmed': False, 'spriteSourceSize': {'x': 0, 'y': 0, 'w': WIDTH, 'h': HEIGHT},
            'sourceSize': {'w': WIDTH, 'h': HEIGHT}, 'duration': 50}
    anchor = {'x': AX, 'y': AY, 'normalized': {'x': AX / WIDTH, 'y': AY / HEIGHT}, 'strategy': 'registered-hip-ground'}
    atlas_path = out / f'{CLIP}.webp'
    atlas.save(atlas_path, 'WEBP', lossless=True, quality=100, method=6, exact=True)
    meta = {'frames': frames, 'meta': {'image': f'{CLIP}.webp', 'format': 'RGBA8888',
        'size': {'w': atlas.width, 'h': atlas.height}, 'scale': 1, 'anchor': anchor,
        'frameTags': [{'name': 'default', 'from': 0, 'to': 11, 'direction': 'forward'}]}}
    (out / f'{CLIP}.json').write_text(json.dumps(meta, indent=2) + '\n')
    walk = json.loads((ROOT / 'assets/sprites-v3/calibration.json').read_text())['6_bit_walk_walk']
    target_height = statistics.median([(b-a) * walk['scale'] for a,b in zip(walk['headRows'], walk['footRows'])])
    source_height = statistics.median([r['visibleFootRow'] - r['headRow'] for r in registration])
    cal = {'clip': CLIP, 'method': 'nearest-opaque-silhouette-native-integer-crop-pad',
        'sourceSha256': sha(source), 'sha256': sha(atlas_path.read_bytes()), 'frames': 12, 'uniquePoses': len(set(frame_hashes)),
        'width': WIDTH, 'height': HEIGHT, 'columns': 4, 'atlasSize': list(atlas.size), 'anchorX': AX, 'anchorY': AY,
        'renderScale': target_height / source_height, 'targetMedianBodyHeight': target_height,
        'sourceMedianBodyHeight': source_height, 'frameDurationMs': 50, 'gaitDurationMs': 600, 'groundSpeed': 450,
        'footRows': [AY] * 12, 'registration': registration, 'frameRgbaSha256': frame_hashes,
        'preserves': ['original-thirteen-assets', 'native-source-pixels', 'canonical-character-reference', 'collision-body', 'shared-update-clock']}
    assert cal['uniquePoses'] == 12
    (out / 'calibration.json').write_text(json.dumps(cal, indent=2) + '\n')
    print(json.dumps({'path': str(atlas_path.relative_to(ROOT)), 'sha256': cal['sha256'], 'bytes': atlas_path.stat().st_size,
                      'renderScale': cal['renderScale'], 'sourceSha256': cal['sourceSha256']}, indent=2))

if __name__ == '__main__': main()
