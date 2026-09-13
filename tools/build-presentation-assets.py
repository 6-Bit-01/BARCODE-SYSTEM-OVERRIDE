"""Pack generated transparent sprites without changing their artwork.

Usage: python tools/build-presentation-assets.py CAT_PNG ARROW_PNG PULSE_PNG
Originals remain in place; source hashes/crops/anchors are recorded for reuse.
"""
import hashlib
import json
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/presentation'


def pack(path, name, atlas):
    source = Image.open(path).convert('RGBA')
    assert source.getchannel('A').getextrema()[0] == 0, 'Transparent input required'
    cuts = []
    if atlas:
        assert source.width % 2 == 0 and source.height % 2 == 0
        cw, ch = source.width // 2, source.height // 2
        frames = [source.crop((i % 2 * cw, i // 2 * ch, (i % 2 + 1) * cw, (i // 2 + 1) * ch)) for i in range(4)]
        bounds = [im.getchannel('A').point(lambda p: 255 if p >= 96 else 0).getbbox() for im in frames]
        assert all(bounds), 'Every cell must contain artwork'
        left, top = min(b[0] for b in bounds), min(b[1] for b in bounds)
        right, bottom = max(b[2] for b in bounds), max(b[3] for b in bounds)
        scale = min(236 / (right - left), 228 / (bottom - top))
        output = Image.new('RGBA', (512, 512))
        for i, (frame, b) in enumerate(zip(frames, bounds)):
            crop = frame.crop((left, top, right, b[3]))
            crop = crop.resize((round(crop.width * scale), round(crop.height * scale)), Image.Resampling.NEAREST)
            x, y = 128 - crop.width // 2, 240 - crop.height
            output.alpha_composite(crop, (i % 2 * 256 + x, i // 2 * 256 + y))
            cuts.append({'sourceCell': [i % 2 * cw, i // 2 * ch, cw, ch], 'trim': [left, top, right, b[3]], 'opaqueBounds': list(b), 'destination': [x, y, crop.width, crop.height]})
        dimensions = {'columns': 2, 'rows': 2, 'frameWidth': 256, 'frameHeight': 256, 'frameCount': 4, 'anchor': [128, 240]}
    else:
        bounds = source.getchannel('A').point(lambda p: 255 if p >= 96 else 0).getbbox()
        output = source.crop(bounds)
        output = output.resize((320, round(output.height * 320 / output.width)), Image.Resampling.LANCZOS)
        cuts.append({'trim': list(bounds)})
        dimensions = {'columns': 1, 'rows': 1, 'frameWidth': output.width, 'frameHeight': output.height, 'frameCount': 1, 'anchor': [output.width / 2, output.height / 2]}
    dest = OUT / (name + '.webp')
    output.save(dest, lossless=True, method=6)
    return {'path': str(dest.relative_to(ROOT)), 'sourceFile': path.name, 'sourceSHA256': hashlib.sha256(path.read_bytes()).hexdigest(),
            'sourceSize': list(source.size), 'sha256': hashlib.sha256(dest.read_bytes()).hexdigest(), 'bytes': dest.stat().st_size,
            **dimensions, 'packing': cuts, 'method': 'built-in image_gen; alpha-preserving crop/scale/atlas packing only', 'approval': 'owner review pending'}


if __name__ == '__main__':
    assert len(sys.argv) == 4, __doc__
    OUT.mkdir(parents=True, exist_ok=True)
    assets = [pack(Path(p), n, atlas) for p, n, atlas in zip(sys.argv[1:], ['studio-cat', 'direction-arrow', 'boss-pulse'], [True, False, True])]
    (OUT / 'manifest.json').write_text(json.dumps({'assets': assets, 'prompts': 'prompts.json'}, indent=2) + '\n')
    print(json.dumps([{'path': a['path'], 'bytes': a['bytes'], 'frames': a['frameCount']} for a in assets], indent=2))
