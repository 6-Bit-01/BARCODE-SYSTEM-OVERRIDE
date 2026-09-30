#!/usr/bin/env python3
"""Build static VFD glyph and warning-lamp artwork, never baked game values."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/cache-road/hud/digital-dashboard'
COLORS = ['#b6ffdd', '#ffd17a', '#ff7770']
SEGMENTS = {
    'a': '12,6 50,6 56,12 50,18 12,18 6,12',
    'b': '57,15 62,21 62,47 56,53 50,47 50,21',
    'c': '56,59 62,65 62,91 56,97 50,91 50,65',
    'd': '12,94 50,94 56,100 50,106 12,106 6,100',
    'e': '5,59 11,65 11,91 5,97 0,91 0,65',
    'f': '5,15 11,21 11,47 5,53 0,47 0,21',
    'g': '12,50 50,50 56,56 50,62 12,62 6,56',
}
DIGITS = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg',
          'acdefg', 'abc', 'abcdefg', 'abcdfg', 'g', '']
ICONS = [
    '<path d="M12 31l5-14h30l5 14v18H12Z M16 29h32 M19 21h26 M16 36h8m16 0h8 M17 49v6m30-6v6"/>',
    '<circle cx="32" cy="32" r="22"/><path d="M32 16v17l12 8 M32 9v4m23 19h-4M32 55v-4M9 32h4"/>',
    '<path d="M35 7L14 36h16l-3 21 24-31H34Z" fill="currentColor" stroke="none"/>',
    '<path d="M8 25l4-11h25l4 11v19H8Z M12 25h25 M20 35l4-11h26l6 11v19H20Z M24 35h28 M24 43h7m13 0h8 M25 54v4m25-4v4"/>',
    '<path d="M32 8l20 8v16c0 11-9 20-20 25C21 52 12 43 12 32V16Z M22 31l7 7 14-16"/>',
    '<path d="M12 16l16 16-16 16 M32 16l16 16-16 16 M8 57h45"/>',
    '<rect x="7" y="15" width="50" height="35" rx="5"/><circle cx="22" cy="29" r="6"/><circle cx="43" cy="29" r="6"/><path d="M21 43l3-7h17l4 7Z M10 20h4m36 0h4"/>',
    '<path d="M9 17h33l13 15-13 15H9 M33 20l11 12-11 12 M16 25v14m9-14v14"/>',
]


def svg(width, height, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
            f'viewBox="0 0 {width} {height}">\n{body}\n</svg>\n')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    digits = []
    for row, color in enumerate(COLORS):
        for col, lit in enumerate(DIGITS):
            digits.append(f'<g transform="translate({col * 64} {row * 112})">')
            for name, points in SEGMENTS.items():
                active = name in lit
                fill = color if active else '#1b302a'
                stroke = '#e4fff2' if active else '#253d35'
                digits.append(f'<polygon points="{points}" fill="{fill}" stroke="{stroke}" '
                              f'stroke-width="0.65" opacity="{1 if active else 0.62}"/>')
            digits.append('</g>')
    (OUT / 'vfd-digits.svg').write_text(svg(768, 336, '\n'.join(digits)))
    icons = []
    for row, color in enumerate(COLORS):
        for col, icon in enumerate(ICONS):
            icons.append(f'<g transform="translate({col * 64} {row * 64})" '
                         f'color="{color}" stroke="{color}" fill="none" stroke-width="3.3" '
                         f'stroke-linecap="round" stroke-linejoin="round">{icon}</g>')
    (OUT / 'instrument-icons.svg').write_text(svg(512, 192, '\n'.join(icons)))
    print('Built static 12-glyph / 8-icon atlases in three phosphor colors.')


if __name__ == '__main__':
    main()
