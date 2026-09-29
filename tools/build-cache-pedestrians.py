#!/usr/bin/env python3
"""Register painted Cache Road travel cels to the original cutout footprints.

The PNGs in world/sources/animation are the editable generated art. This
script only separates, sizes and packs their cels; it does not paint frames.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/cache-road/world/sources/animation'
OUTPUT = ROOT / 'assets/cache-road/world/props/animation'
PROPS = ROOT / 'assets/cache-road/world/props'
HEIGHT = 384

# name: source grid, original silhouette, output grid
SHEETS = {
    'walker-courier': (4, 2, 'walker-courier-toward.webp', 4, 2),
    'walker-mechanic': (4, 2, 'walker-mechanic-toward.webp', 4, 2),
    'walker-market-worker': (4, 2, 'walker-market-worker-toward.webp', 4, 2),
    'walker-student': (4, 2, 'walker-student-toward.webp', 4, 2),
    'walker-gardener': (4, 2, 'walker-gardener-toward.webp', 4, 2),
    'walker-resident': (4, 2, 'walker-resident-toward.webp', 4, 2),
    'person-bicycle-courier': (2, 2, 'person-bicycle-courier.webp', 2, 2),
    'person-skateboarder': (2, 2, 'person-skateboarder.webp', 2, 2),
    'person-crate-carrier': (4, 2, 'person-crate-carrier.webp', 4, 2),
}


def register(name, spec):
    columns, rows, reference_name, out_columns, out_rows = spec
    original = Image.open(PROPS / reference_name)
    width = round(HEIGHT * original.width / original.height)
    source = Image.open(SOURCE / (name + '-source.png')).convert('RGBA')
    cels = []
    for row in range(rows):
        for col in range(columns):
            box = tuple(round(v) for v in (
                col * source.width / columns, row * source.height / rows,
                (col + 1) * source.width / columns,
                (row + 1) * source.height / rows,
            ))
            cel = source.crop(box)
            alpha = cel.getchannel('A').point(lambda value: 255 if value > 112 else 0)
            bounds = alpha.getbbox()
            if bounds is None:
                raise ValueError(f'{name}: empty cel {row * columns + col}')
            bounds = (max(0, bounds[0] - 3), max(0, bounds[1] - 3),
                      min(cel.width, bounds[2] + 3), min(cel.height, bounds[3] + 3))
            cels.append(cel.crop(bounds))
    scale = min((width - 24) / max(cel.width for cel in cels),
                (HEIGHT - 22) / max(cel.height for cel in cels))
    sheet = Image.new('RGBA', (width * out_columns, HEIGHT * out_rows))
    for index, cel in enumerate(cels):
        size = (max(1, round(cel.width * scale)), max(1, round(cel.height * scale)))
        cel = cel.resize(size, Image.Resampling.LANCZOS)
        x = (index % out_columns) * width + (width - cel.width) // 2
        y = (index // out_columns) * HEIGHT + HEIGHT - 11 - cel.height
        sheet.alpha_composite(cel, (x, y))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    target = OUTPUT / (name + '-frames.webp')
    sheet.save(target, 'WEBP', lossless=False, quality=86, method=6)
    print(name, f'{len(cels)} cels', sheet.size, target.stat().st_size)


if __name__ == '__main__':
    for name, spec in SHEETS.items():
        register(name, spec)
