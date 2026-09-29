"""Build compact, deterministic SVG cels for facade-mounted activity."""
from pathlib import Path

root = Path(__file__).resolve().parents[1]/'assets/cache-road/world/ambient'
for family in ['market','homes','workshop','greenhouse','data','transit']:
    cels = []
    for i in range(4):
        if family == 'market':
            drift = [0,6,0,-6][i]
            art = f'<g fill="none" stroke-linecap="round"><path d="M49 102 C23 82 {77+drift} 66 51 43 S{61+drift} 23 56 12" stroke="#e5d6b8" stroke-width="9" opacity=".14"/><path d="M65 105 C{90+drift} 84 49 67 68 47 S{63+drift} 24 72 14" stroke="#e9dcc9" stroke-width="4" opacity=".32"/><path d="M47 91 Q{69+drift} 77 49 62" stroke="#f8e8cd" stroke-width="2" opacity=".42"/></g>'
        elif family == 'workshop':
            art = '<circle cx="64" cy="64" r="34" fill="#1d2928" stroke="#8d8a70" stroke-width="3"/><circle cx="64" cy="64" r="29" fill="none" stroke="#3b4843" stroke-width="3"/>'
            art += f'<g transform="rotate({i*30} 64 64)" fill="#a09d7c" opacity=".85">'
            for angle in [0,120,240]:
                art += f'<path transform="rotate({angle} 64 64)" d="M62 64 C39 60 40 38 52 36 Q67 37 65 62Z"/>'
            art += '</g><circle cx="64" cy="64" r="5" fill="#c0b58b"/>'
        elif family == 'homes':
            # Light behind an existing window, with a moving interior shadow.
            art = '<path d="M28 31H100V94H28Z" fill="#ecae50" opacity=".20"/><path d="M31 35H97V89H31Z" fill="#f7d987" opacity=".18"/>'
            art += f'<path d="M{38+i*10} 89V61q5-10 10 0v28" fill="#3e3931" opacity=".28"/><path d="M64 31V94M28 62H100" stroke="#3c4133" stroke-width="4" opacity=".64"/>'
        elif family == 'greenhouse':
            lean = [0,5,0,-5][i]
            art = f'<path d="M62 108Q{50+lean} 77 {61+lean} 26" fill="none" stroke="#749760" stroke-width="3"/>'
            for y,direction in [(39,1),(59,-1),(79,1)]:
                tip = 64+direction*26+lean
                art += f'<path d="M61 {y+14}Q{tip} {y+12} {tip} {y-6}Q{61+lean} {y-2} 61 {y+14}" fill="#80a269" opacity=".74"/>'
        elif family == 'data':
            art = '<path d="M40 20H88V108H40Z" fill="#253936" opacity=".6"/>'
            for row in range(5):
                bright = (row-i)%4 == 0
                art += f'<path d="M46 {31+row*15}H81" stroke="{"#a5e6cf" if bright else "#497566"}" stroke-width="4" opacity="{.9 if bright else .42}"/>'
        else:
            art = '<path d="M14 47H114V81H14Z" fill="#213c40" opacity=".68"/>'
            for n in range(4):
                x = 26+n*22
                art += f'<path d="M{x-5} 55l9 9-9 9" fill="none" stroke="{"#f5cf82" if n==i else "#62958c"}" stroke-width="4" opacity="{.9 if n==i else .35}"/>'
        cels.append(f'<g transform="translate({i*128} 0)">{art}</g>')
    svg = '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="128" viewBox="0 0 512 128">'+''.join(cels)+'</svg>\n'
    (root/f'{family}-practicals.svg').write_text(svg)
