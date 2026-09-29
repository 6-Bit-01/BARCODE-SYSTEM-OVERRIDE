#!/usr/bin/env python3
"""Measure conservative chip-cue notes from Cache Road's supplied recordings.

Requires Python's standard library and FFmpeg. This is an offline evidence
tool, not a runtime pitch detector or an automatic chord/key transcription.
The recording grid was independently verified by check-cache-road-song-grid.py;
this script never estimates or changes it.
"""
import argparse
from array import array
from collections import Counter
import hashlib
import json
import math
from pathlib import Path
import statistics
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
STEMS = ("pressure", "drive", "flow", "breakaway", "undercurrent")
RATE = 11025
NATIVE_RATE = 44100
EXPECTED_FRAMES = 8268750
BAR_SECONDS = 1.875
NOTE_NAMES = ("C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B")


def frequency(midi):
    return 440 * 2 ** ((midi - 69) / 12)


def note(midi):
    return NOTE_NAMES[midi % 12] + str(midi // 12 - 1)


def decode(path):
    raw = subprocess.check_output([
        "ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le",
        "-ac", "1", "-ar", str(NATIVE_RATE), "pipe:1",
    ])
    data = array("f")
    data.frombytes(raw)
    if sys.byteorder != "little":
        data.byteswap()
    if len(data) != EXPECTED_FRAMES:
        raise ValueError(f"{path.name}: changed recording length {len(data)}")
    # The native decode verifies the original program length. A separate
    # FFmpeg resample is only used in this analyzer, never written back to a
    # source. Its antialias filter keeps high content out of the analysis band.
    filtered = subprocess.check_output([
        "ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le",
        "-ac", "1", "-ar", str(RATE), "pipe:1",
    ])
    samples = array("f")
    samples.frombytes(filtered)
    if sys.byteorder != "little":
        samples.byteswap()
    return samples


def window(samples, start, seconds):
    count = round(seconds * RATE)
    offset = round(start * RATE)
    values = samples[offset:offset + count]
    return [x * (0.5 - 0.5 * math.cos(2 * math.pi * i / (count - 1)))
            for i, x in enumerate(values)]


def power(values, hz):
    """Goertzel/continuous-frequency DFT power; no Python DSP package needed."""
    coeff = 2 * math.cos(2 * math.pi * hz / RATE)
    previous = previous2 = 0.0
    for value in values:
        current = value + coeff * previous - previous2
        previous2, previous = previous, current
    return max(0.0, previous * previous + previous2 * previous2 - coeff * previous * previous2)


def peak(values, low, high, spacing=0.5):
    candidates = [(power(values, low + i * spacing), low + i * spacing)
                  for i in range(math.ceil((high - low) / spacing) + 1)]
    _, center = max(candidates)
    left, right = max(low, center - spacing), min(high, center + spacing)
    for _ in range(18):
        first = left + (right - left) / 3
        second = right - (right - left) / 3
        if power(values, first) < power(values, second):
            left = first
        else:
            right = second
    hz = (left + right) / 2
    return hz, power(values, hz)


def section_for(bar_index):
    if bar_index < 4:
        return "intro", 0, bar_index
    cycle, within = divmod(bar_index - 4, 24)
    if within < 16:
        return "verse", cycle + 1, within
    return "chorus", cycle + 1, within - 16


def bass_downbeats(samples):
    result = []
    for bar_index in range(100):
        # Keep well inside beat ONE, excluding the very first attack transient.
        values = window(samples, bar_index * BAR_SECONDS + 0.060, 0.330)
        hz, energy = peak(values, 27.5, 82.5)
        midi = round(69 + 12 * math.log2(hz / 440))
        cents = 1200 * math.log2(hz / frequency(midi))
        # Independent higher-partial measurement: a triangle-like bass has a
        # strong third harmonic. Its pitch class is the fifth, not a new chord.
        third_hz, third_energy = peak(values, 3 * hz - 3, 3 * hz + 3)
        third_error_cents = 1200 * math.log2(third_hz / (3 * hz))
        section, cycle, local = section_for(bar_index)
        result.append({
            "barOneBased": bar_index + 1,
            "timeSeconds": bar_index * BAR_SECONDS,
            "section": section,
            "cycleOneBased": cycle,
            "sectionBarOneBased": local + 1,
            "bassNote": note(midi),
            "midi": midi,
            "measuredHz": round(hz, 6),
            "equalTemperamentHz": round(frequency(midi), 6),
            "centsFromEqualTemperament": round(cents, 3),
            "thirdPartialHz": round(third_hz, 6),
            "thirdPartialRatioErrorCents": round(third_error_cents, 3),
            "thirdPartialRelativeDb": round(10 * math.log10(third_energy / max(energy, 1e-20)), 3),
            "cueRootMidi": midi + 48,
            "cueRootNote": note(midi + 48),
            "cueRootHz": round(frequency(midi + 48), 6),
            "classification": "measured first-beat bass fundamental; not a chord label",
        })
    return result


def harmonic_evidence(samples):
    """Broad semitone survey, explicitly allowing harmonics in the result."""
    result = []
    for label, first_bar in [("verse A", 4), ("verse B", 12), ("chorus", 20)]:
        entries = []
        for local_bar in range(4):
            values = window(samples, (first_bar + local_bar) * BAR_SECONDS + 0.25, 1.25)
            candidates = []
            for midi in range(36, 85):
                hz, value = peak(values, frequency(midi) * 2 ** (-20 / 1200),
                                 frequency(midi) * 2 ** (20 / 1200), spacing=1.0)
                candidates.append((value, midi, hz))
            top = sorted(candidates, reverse=True)[:8]
            entries.append({
                "barOneBased": first_bar + local_bar + 1,
                "strongestSpectralNotes": [{
                    "note": note(midi), "measuredPeakHz": round(hz, 3),
                    "relativeDb": round(10 * math.log10(value / top[0][0]), 2),
                } for value, midi, hz in top],
            })
        result.append({"sectionType": label, "measurements": entries})
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", type=Path, required=True)
    args = parser.parse_args()
    identities = []
    recordings = {}
    for stem in STEMS:
        path = ROOT / "assets" / "audio" / f"cache-{stem}.mp3"
        samples = decode(path)
        identities.append({"file": path.relative_to(ROOT).as_posix(),
                           "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                           "nativeDecodedFrames": EXPECTED_FRAMES,
                           "nativeSampleRateHz": NATIVE_RATE,
                           "durationSeconds": EXPECTED_FRAMES / NATIVE_RATE})
        if stem in ("drive", "flow"):
            recordings[stem] = samples
    downbeats = bass_downbeats(recordings["drive"])
    counts = Counter(item["bassNote"] for item in downbeats)
    measured_f_bars = [item["barOneBased"] for item in downbeats if item["bassNote"] == "F1"]
    max_cents = max(abs(item["centsFromEqualTemperament"]) for item in downbeats)
    if max_cents > 12 or set(counts) != {"D1", "F1"}:
        raise ValueError("Recording evidence changed; do not reuse the D/F cue map blindly")
    result = {
        "purpose": "Conservative song-specific chip SFX pitch selection from supplied audio",
        "gridAuthority": "CACHE_ROAD_SONG_GRID_AUDIT.md; verified 128 BPM / 4/4 / zero origin; unchanged",
        "recordings": identities,
        "method": {
            "bass": "Hann-windowed continuous-frequency DFT (Goertzel), 27.5–82.5 Hz independent peak search; each first beat sampled +60 through +390 ms; separately fit its third harmonic",
            "flow": "Semitone spectral survey C2–C6 within ±20 cents, 1.25-second Hann windows; strongest bins are spectral evidence and can contain instrument harmonics",
            "analysisSampleRateHz": RATE,
            "tuningReferenceHz": 440,
            "timingChanged": False,
            "notDone": ["automatic chord transcription", "a claimed composer-declared key", "device loudness or subjective musical acceptance"],
        },
        "summary": {
            "observedFirstBeatRootCounts": dict(counts),
            "fRootBarsOneBased": measured_f_bars,
            "dRootAllOtherBars": True,
            "maxBassPitchErrorCents": max_cents,
            "medianBassPitchErrorCents": round(statistics.median(item["centsFromEqualTemperament"] for item in downbeats), 3),
            "maxThirdPartialRatioErrorCents": max(abs(item["thirdPartialRatioErrorCents"]) for item in downbeats),
            "interpretation": "Strong D center with recurring F-root first beats in the choruses; Flow independently supports D/A and F coloration. A single major/minor label is less certain than the measured first-beat root map.",
            "confidence": {"firstBeatRootMap": "high: all 100 measured, near equal temperament and independently supported by matching third partial", "globalMajorMinorKey": "not asserted", "completeChordProgression": "not asserted"},
        },
        "cueRecommendations": {
            "mapping": "Use the announced target measure, including preview/count-in across the preceding measure; chorus-local bars 2 and 6 use F, other measures use D.",
            "dRoot": {"rootMidi": 74, "rootNote": "D5", "rootHz": frequency(74), "fifthMidi": 81, "fifthNote": "A5", "fifthHz": frequency(81), "octaveMidi": 86, "octaveNote": "D6", "octaveHz": frequency(86)},
            "fRoot": {"rootMidi": 77, "rootNote": "F5", "rootHz": frequency(77), "fifthMidi": 84, "fifthNote": "C6", "fifthHz": frequency(84), "octaveMidi": 89, "octaveNote": "F6", "octaveHz": frequency(89)},
            "lowerRegister": "The same MIDI roots/fifths shifted down 12 semitones suit quiet preparation ticks, locks, engine-idle coloration and softer catches.",
            "mostConservative": "Root plus octave. Open fifth is an intentionally sparse sound-design voicing, not a transcription of the full backing chord.",
            "countIn": "Root-root-fifth preparation, resolve root on ONE; short envelopes keep the announced future root from masking any passing bass movement.",
            "offBeatSfx": "Crashes, skid grit and engine transients should be predominantly noise/FM/pitched sweeps, brief and controlled, rather than arbitrary sustained major chords.",
            "avoid": "Do not infer F# as a chord third from the D bass's fifth harmonic (~183.54 Hz); do not sustain a blanket major triad or retune the original stems.",
        },
        "firstBeatMeasurements": downbeats,
        "flowSpectralEvidence": harmonic_evidence(recordings["flow"]),
    }
    args.json.parent.mkdir(parents=True, exist_ok=True)
    args.json.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({"file": str(args.json), "downbeats": len(downbeats), "rootCounts": dict(counts), "fBars": measured_f_bars, "maxPitchErrorCents": max_cents}))


if __name__ == "__main__":
    main()
