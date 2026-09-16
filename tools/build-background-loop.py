#!/usr/bin/env python3
"""Bake the existing city/smoke art into a seamless eight-second video asset.

The model-made selection is only a starting mask. Author-controlled chimney
regions exclude the mask's mistaken skyline selections. Architecture is copied
unchanged into every uncompressed frame. Requires numpy/scipy/Pillow/ffmpeg.
"""
from pathlib import Path
import hashlib
import json
import subprocess
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, maximum_filter, map_coordinates

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/world-v3/animated-background'
SOURCE = ROOT / 'assets/world-v3/far-background.webp'
FPS, SECONDS = 24, 8


def main():
    source = np.array(Image.open(SOURCE).convert('RGB'))
    height, width = source.shape[:2]
    yy, xx = np.mgrid[:height, :width].astype(np.float32)
    lx, ly = xx * 2048 / width, yy * 740 / height
    selection = np.array(Image.open(OUT / 'motion-mask-source.png').convert('L').resize((width, height), Image.Resampling.LANCZOS)) / 255.0
    # Most of the smoke is above the roof line. Allow only the actual mouths
    # below that line; distant towers/antennas in the generated mask are rejected.
    allowed = np.clip((250 - ly) / 24, 0, 1)
    mouths = [(246, 298), (407, 303), (552, 308), (738, 309), (826, 309),
              (940, 311), (1192, 305), (1335, 299), (1495, 305), (1604, 315), (1935, 322)]
    for cx, cy in mouths:
        rise = np.clip((cy - ly) / 45, 0, 1)
        plume = np.clip(1 - np.abs(lx - cx - (cy - ly) * .45) / (12 + (cy - ly).clip(0) * .32), 0, 1)
        allowed = np.maximum(allowed, rise * plume)
    selection *= allowed
    # Broaden only the upper cloud boundaries so their ink outlines can billow.
    influence = gaussian_filter(maximum_filter(selection, size=17), sigma=5) * allowed
    influence = np.clip(influence, 0, 1).astype(np.float32)
    influence[ly >= 322] = 0
    Image.fromarray((influence * 255).astype(np.uint8)).save(OUT / 'motion-mask.png')
    encoder = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
        '-s', f'{width}x{height}', '-r', str(FPS), '-i', 'pipe:0', '-an', '-c:v', 'libx264', '-threads', '2',
        '-preset', 'medium', '-crf', '17', '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
        str(OUT / 'far-background-loop.mp4')], stdin=subprocess.PIPE)
    static = influence == 0
    def render(phase):
        phase %= 2 * np.pi
        # All phase terms are periodic over exactly eight seconds. No duplicate
        # endpoint frame, reversal splice, changing camera, rain or new painting.
        dx = influence * (10 * np.sin(phase + yy * .025 + xx * .002) + 3 * np.sin(phase * 2 - yy * .016))
        dy = influence * (5 * np.cos(phase - yy * .03 + xx * .0015) + 2 * np.sin(phase * 2 + xx * .006))
        points = np.array([yy + dy, xx + dx])
        frame = np.stack([map_coordinates(source[:, :, c], points, order=1, mode='reflect', prefilter=False)
                          for c in range(3)], axis=2).astype(np.uint8)
        frame[static] = source[static]
        return frame
    first = render(0)
    assert np.array_equal(first, render(2 * np.pi)), 'loop endpoint differs'
    for frame_index in range(FPS * SECONDS):
        frame = first if not frame_index else render(2 * np.pi * frame_index / (FPS * SECONDS))
        assert np.array_equal(frame[static], source[static]), 'stationary art moved'
        if frame_index in [0, 48, 96, 144]:
            Image.fromarray(frame).save(OUT / f'keyframe-{frame_index // 48}.webp', quality=94)
        encoder.stdin.write(frame.tobytes())
    encoder.stdin.close()
    if encoder.wait():
        raise RuntimeError('Video encoding failed')
    manifest = {'source': 'assets/world-v3/far-background.webp', 'sourceSHA256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
        'contentWidth': width, 'contentHeight': height, 'encodedWidth': width + width % 2, 'encodedHeight': height + height % 2,
        'fps': FPS, 'frames': FPS * SECONDS, 'durationSeconds': SECONDS,
        'asset': 'far-background-loop.mp4', 'sha256': hashlib.sha256((OUT / 'far-background-loop.mp4').read_bytes()).hexdigest(),
        'motion': 'Periodic smoke/cloud deformation selected by model mask and protected chimney regions; exact source pixels outside influence.',
        'verification': {'uncompressedLoopEndpointExact': True, 'uncompressedStationaryPixelsExact': True,
                         'stationaryImageFraction': round(float(np.mean(static)), 4)},
        'runtime': 'Muted video using the existing camera transform; no rain baked into video, so the game owns rain intensity and layering.'}
    (OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(json.dumps(manifest, indent=2))


if __name__ == '__main__':
    main()
