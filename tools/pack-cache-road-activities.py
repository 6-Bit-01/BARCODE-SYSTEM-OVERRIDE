"""Register generated action cels without changing their painted content.

The generator did not obey an exact grid. Connected silhouettes own their
antialiased fringe; a nearest-component partition avoids cutting the broom
or borrowing a neighbour's boot. Registration uses measured planted contacts,
not the moving hand/tool bounding box. Requires Pillow, NumPy and SciPy.
"""
from pathlib import Path
import json
import sys
import numpy as np
from PIL import Image
from scipy.ndimage import label, find_objects, distance_transform_edt

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/cache-road/world/sources/animation'
TARGET = ROOT / 'assets/cache-road/world/props/animation'
# Original-image registration points: fixed foot/furniture baseline, body x.
# Cleaner cel 4 clips its broom at the generated boundary. The complete
# middle pose supplies the return stroke: out / halfway / in / halfway.
ACTORS = {
    'sweeper': dict(anchors=[[237,608],[864,608],[238,1235],[866,1235]], order=[0,1,2,1]),
    'gardener': dict(anchors=[[276,596],[921,596],[277,1208],[922,1208]]),
    'electrician': dict(anchors=[[332,616],[957,616],[333,1242],[958,1242]]),
    'street-cook': dict(anchors=[[373,598],[960,598],[382,1213],[946,1213]]),
    'waving-resident': dict(anchors=[[222,734],[739,734],[222,1495],[739,1495]]),
    'board-player': dict(anchors=[[311,646],[888,646],[314,1267],[913,1267]]),
    'handheld-player': dict(anchors=[[331,644],[908,644],[332,1291],[909,1291]]),
    'vendor-cart': dict(anchors=[[333,557],[989,557],[333,1157],[989,1157]],prefix='street'),
}

def main():
    manifest = SOURCE/'activity-registration.json'
    result = json.loads(manifest.read_text()) if manifest.exists() else {}
    for name, spec in ACTORS.items():
        if len(sys.argv)>1 and name not in sys.argv[1:]: continue
        prefix = spec.get('prefix','person')
        image = Image.open(SOURCE / f'{prefix}-{name}-activity-source.png').convert('RGBA')
        pixels = np.array(image)
        labels, _ = label(pixels[:,:,3] > 16)
        seeds = np.zeros(labels.shape, dtype=np.uint8)
        for number, box in enumerate(find_objects(labels), 1):
            if box is None: continue
            region = labels[box] == number
            if region.sum() < 30: continue
            cx, cy = (box[1].start+box[1].stop)/2, (box[0].start+box[0].stop)/2
            # Body/planter pieces belong to the same quadrant even when a
            # changing pour no longer connects the planter to the person.
            index = (2 if cy > image.height*.51 else 0) + (1 if cx > image.width*.52 else 0)
            seeds[box][region] = index+1
        distance, nearest = distance_transform_edt(seeds == 0, return_indices=True)
        owner = seeds[tuple(nearest)]
        pixels[:,:,3][distance > 3] = 0
        order = spec.get('order', [0,1,2,3])
        cels = []
        for i in range(4):
            rgba = pixels.copy()
            rgba[:,:,3][owner != i+1] = 0
            cel = Image.fromarray(rgba)
            box = cel.getbbox()
            cels.append((cel.crop(box), box))
        # One scale for the complete animation; hand travel never rescales
        # the body. Ground contacts land exactly on row 380 of every cel.
        max_height = max(spec['anchors'][i][1]-cels[i][1][1] for i in order)
        scale = 370/max_height
        left = max((spec['anchors'][i][0]-cels[i][1][0])*scale for i in order)
        right = max((cels[i][1][2]-spec['anchors'][i][0])*scale for i in order)
        width = int(np.ceil(2*max(left,right)+12)/2)*2
        height, ground = 384, 380
        sheet = Image.new('RGBA',(width*4,height))
        packed = []
        for dest,i in enumerate(order):
            cel,box = cels[i]
            resized = cel.resize((round(cel.width*scale),round(cel.height*scale)),Image.Resampling.LANCZOS)
            x = round(width/2+(box[0]-spec['anchors'][i][0])*scale)
            y = round(ground+(box[1]-spec['anchors'][i][1])*scale)
            assert x >= 0 and y >= 0 and x+resized.width <= width and y+resized.height <= height, (name,i,box,(x,y),resized.size,(width,height))
            sheet.alpha_composite(resized,(dest*width+x,y))
            packed.append(dict(sourceCel=i,sourceBounds=box,registration=spec['anchors'][i],offset=[x,y]))
        output = TARGET / f'{prefix}-{name}-activity-frames.webp'
        sheet.save(output,'WEBP',quality=91,method=6,exact=True)
        result[name] = dict(path=str(output.relative_to(ROOT)),cell=[width,height],ground=ground,
                            scale=scale,cels=packed,bytes=output.stat().st_size)
        print(name, width, height, output.stat().st_size,flush=True)
    manifest.write_text(json.dumps(result,indent=2)+'\n')

if __name__ == '__main__': main()
