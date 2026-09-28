"""Rebuild the exact projected street decals and isolated four-frame light sheets.

These vector details are authored in road-space; the painted PNG masters are
imported separately by import-cache-road-district-art.py.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'assets/cache-road/world'
DECALS = ROOT / 'decals'
AMBIENT = ROOT / 'ambient'
DECALS.mkdir(parents=True, exist_ok=True)
AMBIENT.mkdir(parents=True, exist_ok=True)

def svg(w, h, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
            f'viewBox="0 0 {w} {h}">{body}</svg>')

# The transparent 256×64 image covers one projected street segment. All
# pigment stays inset so its edge never paints a false street boundary.
details = {
    'crosswalk': ''.join(f'<path d="M{x} 10h12l-4 44h-12z" fill="#b6bcb3" opacity=".72"/>'
                         for x in (25, 56, 87, 118, 149, 180, 211)),
    'stop-line': '<path d="M18 25Q128 22 238 26v8Q128 31 18 34z" fill="#c0b9a3" opacity=".76"/>',
    'drainage': '<path d="M35 7l186 2v10L35 17z" fill="#111c23" stroke="#77838a" stroke-width="2"/>'
                + ''.join(f'<path d="M{x} 8v11" stroke="#64747a" stroke-width="3"/>'
                          for x in range(42, 217, 12)),
    'loading-bay': '<path d="M27 9h29m-29 0v46h29m144-46h29v46h-29" fill="none" '
                   'stroke="#c99f68" stroke-width="5" opacity=".8"/>',
    'service-stencil': '<path d="M57 14l19 36h-11l-5-10H44l-5 10H29l19-36zm-5 10l-5 9h10z" '
                       'fill="#c4a675" opacity=".76"/><path d="M103 42h102" '
                       'stroke="#c4a675" stroke-width="5" opacity=".68"/>',
    'wet-repair-patch': '<path d="M32 17l46-7 37 4 39-5 61 12-8 29-42 2-30-5-39 7-58-6z" '
                        'fill="#121c25" opacity=".62" stroke="#69767d" stroke-width="2"/>'
                        '<path d="M63 29l45-4 33 7 44-4" fill="none" stroke="#75949d" '
                        'stroke-width="2" opacity=".45"/>',
}
for name, body in details.items():
    (DECALS / f'{name}.svg').write_text(svg(256, 64, body))

# Four independently rendered frames: a practical glow changes intensity,
# while the plate itself stays opaque and fixed to its world address.
palette = {
    'market': ('#e6ad63', 'sign'),
    'homes': ('#edc786', 'window'),
    'workshop': ('#a8dbb0', 'fan'),
    'greenhouse': ('#9bd87f', 'window'),
    'data': ('#dba880', 'sign'),
    'transit': ('#e4c177', 'fan'),
}
for family, (color, kind) in palette.items():
    frames=[]
    for i, opacity in enumerate((.25,.43,.58,.34)):
        cx=i*128+64
        if kind=='fan':
            shape=(f'<circle cx="{cx}" cy="64" r="19" fill="none" stroke="{color}" '
                   f'stroke-width="3" opacity="{opacity}"/>'
                   f'<path d="M{cx} 65l-9-15m9 15l16-4m-16 4l-7 15" '
                   f'stroke="{color}" stroke-width="4" opacity="{opacity}"/>')
        elif kind=='window':
            shape=(f'<path d="M{cx-18} 49h36v29h-36z" fill="{color}" opacity="{opacity}"/>'
                   f'<path d="M{cx} 49v29m-18-14h36" stroke="#23343b" stroke-width="2"/>')
        else:
            shape=(f'<path d="M{cx-24} 52h48v22h-48z" fill="{color}" opacity="{opacity}"/>'
                   f'<path d="M{cx-14} 63h28" stroke="#f5dfa8" stroke-width="3" '
                   f'opacity="{opacity}"/>')
        frames.append(shape)
    (AMBIENT / f'{family}-practicals.svg').write_text(svg(512, 128, ''.join(frames)))

print('Six graph street decals and six four-frame practical-light sheets')
