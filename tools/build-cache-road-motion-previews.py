#!/usr/bin/env python3
"""Crops repeatable motion reviews from the production Cache Road draw video."""

import subprocess
import sys
import json
import math
from pathlib import Path

from PIL import Image


def freight_follow(movie, folder):
    width, height = 680, 520
    process = subprocess.Popen([
        "ffmpeg", "-loglevel", "error", "-i", str(movie), "-t", "1.2",
        "-vf", "fps=12",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1",
    ], stdout=subprocess.PIPE)
    frame_bytes = 1280 * 720 * 3
    frames = []
    for index in range(14):
        frame = process.stdout.read(frame_bytes)
        if len(frame) != frame_bytes:
            raise RuntimeError("Incomplete preview frame")
        progress = 3020 + index * 54 / 12
        depth = max(0,min(1,1-(3095-progress+80)/520))
        half = 80 + 800*depth
        bend = math.sin(progress/190+(1-depth)*1.2)*(1-depth)*124
        center = (960+bend+half*.75)*2/3
        anchor = (400+depth*depth*680)*2/3
        truck_height = (30+depth*149)*2/3
        top = round(anchor-truck_height*.58-130)
        left = round(center-170)
        scene = Image.frombytes("RGB",(1280,720),frame)
        frames.append(scene.crop((left,top,left+340,top+260)).resize(
            (width,height),Image.Resampling.LANCZOS))
    if process.wait() != 0 or not frames:
        raise RuntimeError("Could not decode Cache Road preview")
    frames[0].save(folder / "Freight-Bounce-Loop.webp", save_all=True,
                   append_images=frames[1:], duration=83,
                   loop=0, quality=82, method=5)


def car_follow(movie, folder):
    track = json.loads((folder / "Cache-Road-Motion-Track.json").read_text())
    fps, centers = track["fps"], track["carCenters"]
    decoder = subprocess.Popen([
        "ffmpeg", "-loglevel", "error", "-i", str(movie), "-f", "rawvideo",
        "-pix_fmt", "rgb24", "pipe:1",
    ], stdout=subprocess.PIPE)
    output = folder / "Cache-Car-Motion-Closeup.mp4"
    encoder = subprocess.Popen([
        "ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
        "-s", "960x660", "-r", str(fps), "-i", "pipe:0", "-an", "-c:v", "libx264",
        "-threads", "2", "-preset", "veryfast", "-crf", "19", "-pix_fmt",
        "yuv420p", "-movflags", "+faststart", str(output),
    ], stdin=subprocess.PIPE)
    frame_bytes = 1280 * 720 * 3
    frames = []
    last_sample = -1
    for index, center in enumerate(centers):
        data = decoder.stdout.read(frame_bytes)
        if len(data) != frame_bytes:
            raise RuntimeError(f"Incomplete production frame {index}")
        scene = Image.frombytes("RGB", (1280,720), data)
        left = round(center - 160)
        close = scene.crop((left,415,left+320,635)).resize((960,660),Image.Resampling.LANCZOS)
        encoder.stdin.write(close.tobytes())
        sample = index * 12 // fps
        if sample != last_sample:
            frames.append(close.resize((720,495),Image.Resampling.LANCZOS))
            last_sample = sample
    encoder.stdin.close()
    if decoder.wait() != 0 or encoder.wait() != 0:
        raise RuntimeError("Could not render the moving car crop")
    frames[0].save(folder / "Cache-Car-Motion-Loop.webp", save_all=True,
                   append_images=frames[1:], duration=83, loop=0, quality=82, method=5)


def main():
    folder = Path(sys.argv[1] if len(sys.argv) > 1 else
                  "docs/source-pack/review-cache-road-mirror")
    movie = folder / "Cache-Road-Mirror-Preview.mp4"
    if not movie.is_file():
        raise FileNotFoundError(movie)
    # The car and freight are at stable scripted positions in this review.
    # The source movie itself comes from tools/render-cache-road-mirror.cjs.
    car_follow(movie, folder)
    freight_follow(movie, folder)
    print("Car and freight motion previews rendered from production draw.")


if __name__ == "__main__":
    main()
