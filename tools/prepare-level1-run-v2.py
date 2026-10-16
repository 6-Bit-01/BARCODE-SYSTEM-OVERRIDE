#!/usr/bin/env python3
"""Pack reviewed run cels by measured pelvis, preserving every native RGBA pixel.

The registration input names exact source crops and anatomical landmarks.
This is crop/padding/metadata work only: no resampling, paint or limb assembly.
"""
import argparse
import hashlib
import json
import math
import statistics
from pathlib import Path
from PIL import Image
import numpy as np
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
CLIP = '6_bit_run_run'

def sha(data): return hashlib.sha256(data).hexdigest()

def bounds(image):
    return image.getchannel('A').point(lambda a: 255 if a >= 128 else 0).getbbox()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--registration', required=True)
    args = parser.parse_args()
    registration_path = Path(args.registration).resolve()
    spec = json.loads(registration_path.read_text())
    assert len(spec['frames']) >= 8
    out = ROOT / 'assets/level1-run-v2'
    out.mkdir(parents=True, exist_ok=True)
    sources, images = [], []
    for index, source in enumerate(spec['sources']):
        file = (registration_path.parent / source['file']).resolve()
        data = file.read_bytes()
        assert sha(data) == source['sha256'], 'source provenance must match reviewed image'
        name = f'6_bit_run_source_{index}.png'
        (out / name).write_bytes(data)
        sources.append({'file': name, 'sha256': sha(data)})
        images.append(Image.open(file).convert('RGBA'))
    masks = {}
    for source_index,image in enumerate(images):
        pixels = np.array(image)
        labels,_ = ndimage.label(pixels[:,:,3]>=64)
        groups = [(label,b) for label,b in enumerate(ndimage.find_objects(labels),1)
                  if b is not None and np.sum(labels[b]==label)>10000]
        groups.sort(key=lambda q:(int((q[1][0].start+q[1][0].stop)/2/(image.height/3)),q[1][1].start))
        nearest = ndimage.distance_transform_edt(~np.isin(labels,[label for label,_ in groups]),return_distances=False,return_indices=True)
        masks[source_index] = (pixels,labels[tuple(nearest)],[label for label,_ in groups])
    cels = []
    for r in spec['frames']:
        pixels,assigned,labels = masks[r['source']]
        pixels=pixels.copy();pixels[assigned!=labels[r['silhouette']]]=0
        cels.append(Image.fromarray(pixels,'RGBA').crop(r['crop']))
    opaque = [bounds(image) for image in cels]
    assert all(opaque), 'complete nonempty character cels'
    walk = json.loads((ROOT / 'assets/sprites-v3/calibration.json').read_text())['6_bit_walk_walk']
    target_height = statistics.median([(b-a) * walk['scale'] for a,b in zip(walk['headRows'],walk['footRows'])])
    source_height = statistics.median([b[3]-b[1]-1 for b in opaque])
    scale = target_height / source_height
    # The two authored contacts determine leg length. Knee flexion in other
    # frames must not independently drag the pelvis/head down to the floor.
    contacts = spec['contactFrames']
    leg_height = statistics.mean([opaque[i][3]-1-spec['frames'][i]['pelvis'][1] for i in contacts])
    width = math.ceil((max(image.width for image in cels) + 96)/64)*64
    height = math.ceil((max(image.height for image in cels) + 128)/64)*64
    ax, ay = width // 2, height - 64
    atlas = Image.new('RGBA',(width*4,height*3))
    frames, rows, hashes,scales,ground_rows,head_columns = {}, [], [],[],[],[]
    for i,(image,item,solid) in enumerate(zip(cels,spec['frames'],opaque)):
        px,py = item['pelvis']
        hip_y = ay-leg_height + round(item['bobWorldY']/scale)
        dx,dy = round(ax-px),round(hip_y-py)
        all_bounds = image.getchannel('A').getbbox()
        crop = image.crop(all_bounds)
        x,y = all_bounds[0]+dx,all_bounds[1]+dy
        assert x >= 0 and y >= 0 and x+crop.width<=width and y+crop.height<=height, f'cel {i}: whole silhouette fits'
        packed = Image.new('RGBA',(width,height)); packed.paste(crop,(x,y))
        assert packed.crop((x,y,x+crop.width,y+crop.height)).tobytes() == crop.tobytes(), 'native pixels preserved'
        atlas.paste(packed,(i%4*width,i//4*height))
        hashes.append(sha(packed.tobytes()))
        frame_scale = target_height/(solid[3]-solid[1]-1)
        scales.append(frame_scale)
        ground_rows.append(solid[3]-1+dy+item['flightLiftWorld']/frame_scale)
        head_columns.append(item['capCrown'][0]+dx)
        row = {'frame':i,'sourceCell':item['silhouette'],'phase':item['phase'],'leadingLeg':item['leadingLeg'],
            'source':item['source'],'sourceCrop':item['crop'],'translate':[dx,dy],
            'pelvis':[px+dx,py+dy], 'bobWorldY':item['bobWorldY'],'flightLiftWorld':item['flightLiftWorld'],
            'headRow':solid[1]+dy, 'visibleFootRow':solid[3]-1+dy}
        for landmark in ['nearSole','farSole','nearFist','farFist','capCrown']:
            row[landmark] = [item[landmark][0]+dx,item[landmark][1]+dy] if item[landmark] else None
        rows.append(row)
        frames[f'{CLIP}_{i:03}.png'] = {'frame':{'x':i%4*width,'y':i//4*height,'w':width,'h':height},
            'rotated':False,'trimmed':False,'spriteSourceSize':{'x':0,'y':0,'w':width,'h':height},
            'sourceSize':{'w':width,'h':height},'duration':item['durationMs']}
    anchor = {'x':ax,'y':ay,'normalized':{'x':ax/width,'y':ay/height},'strategy':'pelvis-registered-gait-ground'}
    atlas_file = out / f'{CLIP}.webp'
    atlas.save(atlas_file,'WEBP',lossless=True,quality=100,method=6,exact=True)
    meta = {'frames':frames,'meta':{'image':f'{CLIP}.webp','format':'RGBA8888','size':{'w':atlas.width,'h':atlas.height},
        'scale':1,'anchor':anchor,'frameTags':[{'name':'default','from':0,'to':len(cels)-1,'direction':'forward'}]}}
    (out/f'{CLIP}.json').write_text(json.dumps(meta,indent=2)+'\n')
    stored_spec = dict(spec)
    stored_spec['sources'] = [dict(s) for s in sources]
    stored_registration = (json.dumps(stored_spec,indent=2)+'\n').encode()
    head_reference = statistics.median([(r['capCrown'][0]-r['pelvis'][0])*s for r,s in zip(rows,scales)])
    # Share the source's small lean variance between crown and pelvis rather
    # than freeze one landmark and make the other swing abruptly at wrap.
    reference_weight = 0.6
    head_offsets = [head_reference+(1-reference_weight)*((r['capCrown'][0]-r['pelvis'][0])*s-head_reference)
                    for r,s in zip(rows,scales)]
    cal = {'version':2,'clip':CLIP,'method':'reviewed-alternating-gait-native-crop-pad-pelvis-registration',
        'sources':sources,'sha256':sha(atlas_file.read_bytes()),'frames':len(cels),'uniquePoses':len(set(hashes)),
        'width':width,'height':height,'columns':4,'atlasSize':list(atlas.size),'anchorX':ax,'anchorY':ay,
        'renderScale':scale,'targetMedianBodyHeight':target_height,'sourceMedianBodyHeight':source_height,
        'frameDurationsMs':[r['durationMs'] for r in spec['frames']], 'gaitDurationMs':600,'groundSpeed':450,'pelvisToGroundSource':leg_height,
        'contactFrames':contacts,'contactStartsMs':[sum(r['durationMs'] for r in spec['frames'][:i]) for i in contacts],
        'frameScales':scales,'footRows':ground_rows,'headColumns':head_columns,
        'headOffsetXWorld':head_reference,'headOffsetsXWorld':head_offsets,'torsoReferenceWeight':reference_weight,
        'presentationRegistration':{'method':'measured-uniform-body-height-cap-column-true-boot-contact',
            'scaleRatio':max(scales)/min(scales),'preservesPixels':True,'usesNoFrameBlend':True},
        'registration':rows,'frameRgbaSha256':hashes,
        'sourceRegistrationSha256':sha(stored_registration),
        'preserves':['all-earlier-raster-bytes','native-complete-cels','run-controls-and-speed','collision-body','shared-simulation-clock']}
    assert cal['uniquePoses']==len(cels)
    assert sum(cal['frameDurationsMs'])==600
    (out/'calibration.json').write_text(json.dumps(cal,indent=2)+'\n')
    (out/'source-registration.json').write_bytes(stored_registration)
    print(json.dumps({'atlas':str(atlas_file.relative_to(ROOT)),'sha256':cal['sha256'],'bytes':atlas_file.stat().st_size,
                      'scale':scale,'cell':[width,height],'anchor':anchor},indent=2))

if __name__=='__main__': main()
