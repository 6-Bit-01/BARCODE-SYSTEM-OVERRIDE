"""Preserve currently referenced remote originals for the standalone game.

No transformations or replacements: record the exact downloaded bytes and source.
"""
import hashlib
import json
import re
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'assets' / 'standalone'


def main():
    manifest = json.loads((ROOT / 'sprites-manifest.json').read_text(encoding='utf-8'))
    walk = manifest['characters']['sector_1_boss_sector1boss']['animations']['sector_1_boss_walk_walk']
    sources = {
        'sector_1_boss_walk_walk.json': walk['json'],
        'sector_1_boss_walk_walk.webp': walk['image'],
        'level1-foundation.mp3': 'https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/audio-assets/e56876ca-50d1-4b32-bcb9-1e37b7d1f822/2133657a-6dbe-47c0-b4c3-4cb9849b3c58.mp3',
        'level1-bass.mp3': 'https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/audio-assets/e56876ca-50d1-4b32-bcb9-1e37b7d1f822/5089debd-8927-4409-88f1-785be8508686.mp3',
        'level1-fx.mp3': 'https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/audio-assets/e56876ca-50d1-4b32-bcb9-1e37b7d1f822/1e86d080-84ac-45df-b591-5e433ae5ec8f.mp3',
        'title-background.png': 'https://i.postimg.cc/g2pD1DgH/openart-89f2eee5-980d-4652-96af-7a1634e44485.png',
        'lore.png': 'https://i.postimg.cc/2yvHCQhj/Lore.png',
    }
    audio_source = (ROOT / 'src/engine/audio.js').read_text(encoding='utf-8')
    for url in sorted(set(re.findall(r'https://api\.makko\.ai/storage/v1/object/public/audio-assets/[^\s\'"<>]+', audio_source))):
        # Historical whoosh1/2 URLs are fallback attempts; preserve the actual
        # primary whoosh sources and point those fallback attempts at them in build.
        if url.endswith(('/whoosh1.mp3', '/whoosh2.mp3')):
            continue
        sources['audio-' + url.rsplit('/', 1)[1]] = url
    TARGET.mkdir(parents=True, exist_ok=True)
    receipts = []
    for name, url in sources.items():
        target = TARGET / name
        if target.exists():
            data = target.read_bytes()
        else:
            with urlopen(Request(url, headers={'User-Agent': 'BARCODE-Standalone-Asset-Mirror/1.0'}), timeout=60) as response:
                data = response.read()
                mime = response.headers.get_content_type()
                if mime in ('text/html', 'application/xhtml+xml'):
                    raise ValueError(f'{name}: remote response is a page, not artwork/audio')
            if not data:
                raise ValueError(f'{name}: empty response')
            if name.endswith('.json'):
                json.loads(data)
            target.write_bytes(data)
        receipts.append({'path': target.relative_to(ROOT).as_posix(), 'source': url,
                         'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
        print(f'Preserved {name}: {len(data)} bytes', flush=True)
    (TARGET / 'originals.json').write_text(json.dumps(receipts, indent=2) + '\n', encoding='utf-8', newline='\n')


if __name__ == '__main__':
    main()
