#!/usr/bin/env python3
"""Lossless fixed-grid packing only; never repaint or edit generated alpha."""
import argparse
import hashlib
import json
import math
from pathlib import Path
import shutil
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'level1-signal-art'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def pack(source, stem):
    source = Path(source).resolve()
    copied = OUT / f'{stem}-source.png'
    if source != copied:
        shutil.copyfile(source, copied)
    with Image.open(copied) as original:
        image = original.convert('RGBA')
    width, height = image.size
    cell_w, cell_h = math.ceil(width / 4), math.ceil(height / 2)
    atlas = Image.new('RGBA', (cell_w * 4, cell_h * 2), (0, 0, 0, 0))
    frames = []
    for index in range(8):
        row, column = divmod(index, 4)
        box = (round(column * width / 4), round(row * height / 2),
               round((column + 1) * width / 4), round((row + 1) * height / 2))
        crop = image.crop(box)
        # Center the at-most-one-pixel size difference; no resampling/masking.
        pad_x, pad_y = (cell_w - crop.width) // 2, (cell_h - crop.height) // 2
        atlas.paste(crop, (column * cell_w + pad_x, row * cell_h + pad_y))
        frames.append({'frame': index, 'sourceCrop': list(box), 'padding': [pad_x, pad_y],
                       'sourcePixelsSha256': hashlib.sha256(crop.tobytes()).hexdigest(),
                       'alphaBounds': crop.getchannel('A').getbbox()})
    target = OUT / f'{stem}-atlas.webp'
    atlas.save(target, 'WEBP', lossless=True, quality=100, method=6, exact=True)
    decoded = Image.open(target).convert('RGBA')
    if decoded.tobytes() != atlas.tobytes():
        raise RuntimeError('Lossless WebP did not preserve the complete RGBA atlas')
    for frame in frames:
        row, column = divmod(frame['frame'], 4)
        source_crop = image.crop(frame['sourceCrop'])
        px, py = frame['padding']
        delivered = decoded.crop((column * cell_w + px, row * cell_h + py,
                                  column * cell_w + px + source_crop.width,
                                  row * cell_h + py + source_crop.height))
        if delivered.tobytes() != source_crop.tobytes():
            raise RuntimeError('Packing changed a source cell')
    return {'source': copied.relative_to(ROOT).as_posix(), 'sourceSha256': sha(copied),
            'atlas': target.relative_to(ROOT).as_posix(), 'atlasSha256': sha(target),
            'sourceSize': [width, height], 'atlasSize': list(atlas.size),
            'cellSize': [cell_w, cell_h], 'columns': 4, 'rows': 2, 'frames': frames,
            'process': 'Fixed-grid crops, transparent padding <=1px, lossless WebP; every source RGBA pixel preserved.'}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--signal')
    parser.add_argument('--amp')
    args = parser.parse_args()
    if not args.signal and not args.amp:
        parser.error('Supply --signal or --amp')
    OUT.mkdir(parents=True, exist_ok=True)
    receipt_path = OUT / 'packing.json'
    receipt = json.loads(receipt_path.read_text()) if receipt_path.exists() else {}
    if args.signal:
        receipt['signal'] = pack(args.signal, 'signal-discharge')
    if args.amp:
        receipt['amp'] = pack(args.amp, 'signal-amp')
    receipt_path.write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps(receipt, separators=(',', ':')))


if __name__ == '__main__':
    main()
