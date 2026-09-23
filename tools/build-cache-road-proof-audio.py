"""Generate the five aligned, temporary WAV parts for the Cache road proof.

Run from the repository root. The 8-bar 120 BPM phrase is exactly 16 seconds
at 22050 Hz. Parts share a downbeat, progression and sample count; replacing
these with authored music requires checking alignment and actual loop seams.
"""
from pathlib import Path
import wave

import numpy as np

RATE = 22050
SECONDS = 16
SAMPLES = RATE * SECONDS
BEAT = RATE // 2
OUT = Path(__file__).resolve().parents[1] / 'assets' / 'audio'
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(902)


def tone(freq, duration, kind='sine'):
    n = max(1, int(duration * RATE))
    t = np.arange(n) / RATE
    phase = 2 * np.pi * freq * t
    if kind == 'saw':
        v = 2 * ((freq * t) % 1) - 1
        v = 0.7 * v + 0.3 * np.sin(phase)
    else:
        v = np.sin(phase) + 0.25 * np.sin(2 * phase)
    return v


def add(buf, start, sound, volume, attack=0.006, release=0.045):
    start = int(start)
    count = min(len(sound), len(buf) - start)
    if count <= 0:
        return
    env = np.ones(count)
    a, r = min(count, int(attack * RATE)), min(count, int(release * RATE))
    if a:
        env[:a] *= np.linspace(0, 1, a)
    if r:
        env[-r:] *= np.linspace(1, 0, r)
    buf[start:start + count] += sound[:count] * env * volume


parts = {name: np.zeros(SAMPLES, dtype=np.float64)
         for name in ('bed', 'bass', 'break', 'harmony', 'lead')}
roots = [55.0, 43.65, 65.41, 49.0]  # Am, F, C, G
chords = [(220.0, 261.63, 329.63), (174.61, 220.0, 261.63),
          (196.0, 261.63, 329.63), (196.0, 246.94, 293.66)]

for bar in range(8):
    root = roots[bar % 4]
    start = bar * BEAT * 4
    # The constant carrier is deliberately quiet even with every lane locked.
    for k in range(4):
        offset = start + k * BEAT
        add(parts['bed'], offset, tone(root / 2, 0.39), 0.12, release=0.14)
        add(parts['bed'], offset, tone(880, 0.05), 0.015)
    for k, degree in enumerate((1, 1.5, 2, 1.5, 1, 1.5, 2.5, 2)):
        f = root * degree
        add(parts['bass'], start + k * BEAT // 2, tone(f, 0.22, 'saw'), 0.23,
            attack=0.004, release=0.095)
    for k in range(8):
        offset = start + k * BEAT // 2
        # Kick, noise snare and hiss hats form a distinct break lane.
        if k in (0, 3, 4, 6):
            n = int(0.17 * RATE)
            t = np.arange(n) / RATE
            kick = np.sin(2 * np.pi * (58 * t + 80 * t * np.exp(-t * 36))) * np.exp(-t * 28)
            add(parts['break'], offset, kick, 0.68, release=0.03)
        if k in (2, 6):
            n = int(0.11 * RATE)
            snare = rng.normal(0, 1, n) * np.exp(-np.arange(n) / RATE * 34)
            add(parts['break'], offset, snare, 0.15, release=0.025)
        n = int(0.045 * RATE)
        hat = rng.normal(0, 1, n) * np.exp(-np.arange(n) / RATE * 105)
        add(parts['break'], offset, hat, 0.035, release=0.012)
    for k, frequency in enumerate(chords[bar % 4]):
        add(parts['harmony'], start, tone(frequency, 1.82), 0.095, attack=0.09, release=0.28)
        add(parts['harmony'], start + 2 * BEAT, tone(frequency, 1.8), 0.075,
            attack=0.09, release=0.28)
    notes = (0, 2, 3, 2, 4, 3, 2, 0) if bar % 2 == 0 else (3, 4, 5, 4, 3, 2, 1, 0)
    scale = (0, 2, 3, 5, 7, 8)
    for k, degree in enumerate(notes):
        frequency = 220 * 2 ** (scale[degree] / 12)
        add(parts['lead'], start + k * BEAT // 2, tone(frequency, 0.18), 0.13,
            attack=0.012, release=0.06)

for name, buf in parts.items():
    buf -= np.mean(buf)
    buf = np.tanh(buf * 1.35)
    # The final 5 ms overlaps the next bar-zero decay without a discontinuity.
    edge = 110
    buf[:edge] *= np.linspace(0, 1, edge)
    buf[-edge:] *= np.linspace(1, 0, edge)
    pcm = (np.clip(buf, -1, 1) * 32767).astype('<i2')
    path = OUT / f'cache-road-proof-{name}.wav'
    with wave.open(str(path), 'wb') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(RATE)
        wav.writeframes(pcm.tobytes())
    print(f'{path.relative_to(OUT.parent.parent)}: {len(pcm)} samples')
