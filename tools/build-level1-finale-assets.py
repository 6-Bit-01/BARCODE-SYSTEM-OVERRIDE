"""Register whole generated assets; retain alpha, never assemble character parts."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / 'assets/finale'

def source(name):
    image = Image.open(ROOT / 'sources' / name).convert('RGBA')
    # Discard only nearly transparent generation specks beyond the artwork.
    alpha = image.getchannel('A').point(lambda value: 0 if value < 8 else value)
    image.putalpha(alpha)
    return image

cabin = source('lift-cabin-source.png')
cabin = cabin.crop(cabin.getbbox())
cabin.thumbnail((640, 640), Image.Resampling.LANCZOS)
cabin.save(ROOT / 'lift-cabin.webp', quality=94, method=6)

original = source('lift-mechanism-source.png')
# Parallel metal, cable and central spine. The renderer repeats this stationary
# strip over the full shaft and animates its drive teeth using the lift clock.
track = original.crop((570, 375, 742, 630))
track.resize((86, 128), Image.Resampling.LANCZOS).save(ROOT / 'lift-track.webp', quality=94, method=6)

cats = source('studio-cat-poses-source.png')
# Authored cell bounds follow each complete pose, including extended paws and
# tails. The generated sheet's spacing is not a uniform grid.
boxes = [(23,95,370,393),(395,99,707,394),(745,99,1064,395),(1098,111,1419,393),
         (15,471,386,709),(403,459,701,710),(715,476,1113,681),(1120,472,1445,714),
         (23,778,378,1035),(385,779,746,1033),(743,775,1109,1035),(1109,769,1434,1034)]
poses = [cats.crop(box) for box in boxes]
# One scale across all complete poses, with a shared floor registration.
scale = min(350 / max(p.width for p in poses), 320 / max(p.height for p in poses))
sheet = Image.new('RGBA', (1536, 1152))
for i, pose in enumerate(poses):
    pose = pose.resize((round(pose.width * scale), round(pose.height * scale)), Image.Resampling.LANCZOS)
    sheet.alpha_composite(pose, ((i % 4) * 384 + (384-pose.width)//2, (i//4)*384 + 348-pose.height))
sheet.save(ROOT / 'studio-cat-event.webp', quality=94, method=6)
print('Prepared complete cabin, repeatable drive strip and 12 whole-body cat poses.')
