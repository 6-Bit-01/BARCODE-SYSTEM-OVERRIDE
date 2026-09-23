#!/usr/bin/env python3
"""Generate the two deliberately temporary, aligned Broadcast Slum proof stems.

All samples are synthesized here. Four bars at 108 BPM and 22,050 Hz produce
exactly 196,000 samples, so the native loops and transport phrase share a seam.
"""
import math
import random
import struct
import wave
from pathlib import Path

RATE = 22050
FRAMES = 196000
BPM = 108
BEAT = 60 / BPM
ROOTS = (73.416, 87.307, 55.0, 97.999)
OUTPUT = Path(__file__).resolve().parents[1] / "assets" / "audio"


def seam(t):
    return min(1.0, t / 0.015, (FRAMES / RATE - t) / 0.015)


def carrier(t):
    beat = t / BEAT
    root = ROOTS[int(beat // 4) % 4]
    pulse = beat % 1
    envelope = (1 - math.exp(-pulse * 30)) * math.exp(-pulse * 1.7)
    bass = math.sin(2 * math.pi * root * t) + 0.23 * math.sin(4 * math.pi * root * t)
    shimmer = sum(math.sin(2 * math.pi * root * ratio * t) for ratio in (2, 2.4, 3)) / 3
    return seam(t) * (0.28 * envelope * bass + 0.085 * shimmer)


def pressure(t, rng):
    beat = t / BEAT
    pos = beat % 1
    step = int(beat) % 4
    eighth = (beat * 2) % 1
    noise = rng.uniform(-1, 1)
    kick = 0.34 * math.exp(-pos * 20) * math.sin(2 * math.pi * (48 + 68 * math.exp(-pos * 24)) * t) if step in (0, 2) else 0
    snare = 0.17 * math.exp(-pos * 22) * noise if step in (1, 3) else 0
    hat = 0.055 * math.exp(-eighth * 40) * noise
    accent = 0.11 * math.exp(-pos * 9) * math.sin(2 * math.pi * 196 * t) if step == 3 else 0
    return seam(t) * (kick + snare + hat + accent)


def write(name, synth):
    rng = random.Random(603)
    samples = [max(-0.95, min(0.95, synth(i / RATE, rng) if name.endswith("pressure") else synth(i / RATE))) for i in range(FRAMES)]
    with wave.open(str(OUTPUT / f"broadcast-slum-proof-{name}.wav"), "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(RATE)
        out.writeframes(struct.pack(f"<{FRAMES}h", *(round(sample * 32767) for sample in samples)))


if __name__ == "__main__":
    OUTPUT.mkdir(parents=True, exist_ok=True)
    write("carrier", carrier)
    write("pressure", pressure)
