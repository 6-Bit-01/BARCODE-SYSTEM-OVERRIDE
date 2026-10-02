#!/usr/bin/env python3
"""Pack the three original ImageGen sheets into exact-pixel uniform atlases."""
import hashlib, json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'assets/cache-road/beat-system'
LAYOUTS = {'hardware': (4, 2), 'energy': (4, 3), 'timing': (4, 2)}
# Authored rows have different heights. Split in the transparent gutters,
# retaining whole gates/runways instead of slicing them at an assumed grid.
ROW_EDGES = {'energy': [0, 375, 737, 1086], 'timing': [0, 550, 887]}
digest = lambda b: hashlib.sha256(b).hexdigest()
result = {}
for kind, (columns, rows) in LAYOUTS.items():
    source_path = ART / (kind + '-source.png')
    source = Image.open(source_path).convert('RGBA')
    w, h = source.size
    row_edges = ROW_EDGES.get(kind, [round(row*h/rows) for row in range(rows+1)])
    assert row_edges[0] == 0 and row_edges[-1] == h
    cw, ch = (w + columns - 1) // columns, max(b-a for a,b in zip(row_edges,row_edges[1:]))
    atlas = Image.new('RGBA', (cw * columns, ch * rows))
    frames = []
    for frame in range(columns * rows):
        col, row = frame % columns, frame // columns
        box = (round(col*w/columns), row_edges[row],
               round((col+1)*w/columns), row_edges[row+1])
        original = source.crop(box)
        cel = Image.new('RGBA', (cw, ch))
        cel.paste(original, (0, 0))
        atlas.paste(cel, (col*cw, row*ch))
        assert cel.crop((0, 0, original.width, original.height)).tobytes() == original.tobytes()
        bounds = cel.getchannel('A').getbbox()
        visible = cel.getchannel('A').point(lambda a: 255 if a >= 8 else 0).getbbox()
        frames.append({'frame': frame, 'sourceCrop': list(box),
            'sourcePixelsSha256': digest(original.tobytes()),
            'cellPixelsSha256': digest(cel.tobytes()),
            'padding': [cw-original.width, ch-original.height],
            'alphaBounds': list(bounds), 'visibleBounds': list(visible)})
    target = ART / (kind + '-atlas.webp')
    atlas.save(target, 'WEBP', lossless=True, exact=True, quality=100, method=6)
    decoded = Image.open(target).convert('RGBA')
    assert decoded.size == atlas.size and decoded.tobytes() == atlas.tobytes(), kind + ' encoding changed RGBA pixels'
    crops = {}
    if kind in ('timing', 'energy'):
        for f in frames:
            x0,y0,x1,y1 = f['visibleBounds']
            crops[str(f['frame'])] = [x0,y0,x1-x0,y1-y0]
    result[kind] = {'source': str(source_path.relative_to(ROOT)),
        'sourceSha256': digest(source_path.read_bytes()), 'sourceSize': [w,h],
        'atlas': str(target.relative_to(ROOT)), 'atlasSha256': digest(target.read_bytes()),
        'atlasSize': list(atlas.size), 'cellSize': [cw,ch], 'columns': columns,
        'rows': rows, 'frames': frames, 'frameCrops': crops,
        'sourceRowEdges': row_edges,
        'process': 'Lossless crops at authored row gutters, uniform transparent padding, exact RGBA; no color/alpha changes or resampling.'}
(ART / 'packing.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({k:{'size':v['atlasSize'],'cell':v['cellSize'],'frameCrops':v['frameCrops']} for k,v in result.items()}, indent=2))
