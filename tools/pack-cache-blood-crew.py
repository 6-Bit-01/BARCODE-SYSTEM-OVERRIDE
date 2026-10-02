#!/usr/bin/env python3
"""Noncreative, exact RGBA extraction/repacking of image_gen originals."""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def pack(asset, key, source, runtime, columns, rows, cell_size, anchors):
    src = Image.open(ROOT/source).convert('RGBA')
    cw,ch = cell_size
    out = Image.new('RGBA', (cw*columns,ch*rows))
    cells = []
    for frame in range(columns*rows):
        c,r = frame%columns,frame//columns
        x0,y0 = c*src.width//columns,r*src.height//rows
        x1,y1 = (c+1)*src.width//columns,(r+1)*src.height//rows
        crop = src.crop((x0,y0,x1,y1))
        ix,iy = (cw-crop.width)//2,(ch-crop.height)//2
        out.paste(crop,(c*cw+ix,r*ch+iy))
        bounds = crop.getchannel('A').getbbox()
        cells.append({'frame':frame,'sourceRect':[x0,y0,crop.width,crop.height],
                      'insert':[ix,iy],'anchor':anchors[frame],
                      'opaqueBounds':[bounds[0]+ix,bounds[1]+iy,bounds[2]+ix,bounds[3]+iy]})
    target = ROOT/runtime
    target.parent.mkdir(parents=True,exist_ok=True)
    out.save(target,format='WEBP',lossless=True,exact=True)
    decoded = Image.open(target).convert('RGBA')
    assert decoded.tobytes()==out.tobytes(), 'RGBA must survive exact WebP export'
    return {'asset':asset,'key':key,'generatedOriginal':source,'runtime':runtime,
            'size':list(out.size),'sourceSize':list(src.size),'mode':'RGBA',
            'columns':columns,'rows':rows,'frames':columns*rows,'cellSize':list(cell_size),
            'registrationAnchor':[.5,1] if rows==2 else [.5,.5], 'cells':cells,
            'sha256':{'source':digest(ROOT/source),'runtime':digest(target)},
            'bytes':{'encoded':target.stat().st_size,'decodedRGBA':out.width*out.height*4}}

assets = [pack('blood-splatter-atlas','cacheBloodSplatter',
    'assets/cache-road/blood/sources/blood-splatter-atlas.png',
    'assets/cache-road/blood/blood-splatter-atlas.webp',3,2,(576,512),
    [[.5,.86]]*3+[[.5,.55]]*3),
    pack('crew-callout-portraits','cacheCrewCallouts',
    'assets/cache-road/blood/sources/crew-callout-portraits.png',
    'assets/cache-road/blood/crew-callout-portraits.webp',3,1,(768,768),[[.5,.5]]*3)]
metadata={'version':1,'generatedAt':'2026-10-02',
          'method':'Built-in image_gen; originals unchanged; exact rectangular extraction and transparent padding; no resampling, recoloring, alpha editing or creative compositing; exact lossless WebP.',
          'assets':assets}
(ROOT/'assets/cache-road/blood/atlas-metadata.json').write_text(json.dumps(metadata,indent=2)+'\n')
print(json.dumps({'assets':[{k:a[k] for k in ('key','runtime','size','bytes')} for a in assets]}))
