#!/usr/bin/env python3
"""Verify Cache Road's supplied recording grid, not a synthetic click track.

Requires Python 3, ffmpeg and ffprobe; no Python packages. The owner supplies
the meter/form. Sample counts, onset periodicity and repeated phrase attacks
independently check that the shipped recordings support that interpretation.
"""
import argparse
from array import array
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
ROLES = ("pressure", "drive", "flow", "breakaway", "undercurrent")
RATE = 44100
BPM = 128
BEAT = 60 / BPM
BAR = BEAT * 4
BARS = 100
EXPECTED_FRAMES = 8268750
SECTIONS = [("Intro", 0, 4)]
for cycle in range(4):
    start = 4 + cycle * 24
    SECTIONS.extend([(f"Verse {cycle + 1} A", start, start + 8),
                     (f"Verse {cycle + 1} B", start + 8, start + 16),
                     (f"Chorus {cycle + 1}", start + 16, start + 24)])


def run(*args):
    return subprocess.check_output(args)


def floats(data):
    result = array("f")
    result.frombytes(data)
    if sys.byteorder != "little":
        result.byteswap()
    return result


def rms_db(values):
    return round(10 * math.log10(sum(x * x for x in values) / len(values) + 1e-20), 3)


def correlation(a, b):
    denom = math.sqrt(sum(x * x for x in a) * sum(x * x for x in b))
    return sum(x * y for x, y in zip(a, b)) / denom if denom else 0


def attack_match(audio, template, at, rate):
    """Find phase around an expected address without moving the live grid.

    The 8 kHz verification decode keeps the check small. Search resolution is
    0.5 ms; the separate audit also checked native-rate section entrances.
    """
    candidates = []
    for shift in range(-80, 81, 4):
        if at + shift < 0:
            continue
        score = correlation(template, audio[at + shift:at + shift + len(template)])
        candidates.append((score, shift))
    score, shift = max(candidates)
    return {"offsetMs": shift / rate * 1000, "correlation": round(score, 6)}


def onset_periods(audio):
    # 1 ms RMS bins. Search a broad 0.25–2.25 s interval without selecting
    # only windows around the expected quarter note. This groove's strongest
    # repeat is a bar, not its loudest individual backbeat.
    hop, sample_rate = 8, 8000
    env = [math.sqrt(sum(x * x for x in audio[i:i + hop]) / hop)
           for i in range(0, min(len(audio), 30 * sample_rate) - hop + 1, hop)]
    flux = [max(0, now - prev) for prev, now in zip([0] + env[:-1], env)]
    total = sum(x * x for x in flux)

    def score(lag):
        return sum(a * b for a, b in zip(flux[:-lag], flux[lag:])) / total

    all_lags = [(score(lag), lag) for lag in range(250, 2251)]
    strongest, lag = max(all_lags)
    quarter_score, quarter_lag = max((value, at) for value, at in all_lags
                                    if 0.45 <= at * .001 <= .49)
    phrase_score, phrase_lag = max((score(at), at) for at in range(7450, 7551))
    return {"strongestPeriodSec": lag * .001,
            "strongestCorrelation": round(strongest, 6),
            "quarterPeriodSec": quarter_lag * .001,
            "quarterCorrelation": round(quarter_score, 6),
            "fourBarPeriodSec": phrase_lag * .001,
            "fourBarCorrelation": round(phrase_score, 6),
            "resolutionMs": 1}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", type=Path, help="Save complete measurements here")
    args = parser.parse_args()
    profile = (ROOT / "src/engine/cache-road-proof-profile.js").read_text()
    for pattern in [r"quarterBpm:\s*128\b", r"beatsPerBar:\s*4\b",
                    r"beatUnit:\s*4\b", r"gridOriginTrackSec:\s*0\b",
                    r"offsetSec:\s*0\b"]:
        assert re.search(pattern, profile), f"Recording audit and profile disagree: {pattern}"

    report = {"schema": "cache-road-song-grid-v1", "quarterBpm": BPM,
              "beatsPerBar": 4, "beatDurationSec": BEAT,
              "barDurationSec": BAR, "gridOriginTrackSec": 0,
              "bars": BARS, "durationSec": BARS * BAR,
              "lastDownbeatSec": 99 * BAR, "lastQuarterBeatSec": 399 * BEAT,
              "sections": [{"name": name, "firstBar": a + 1, "lastBar": b,
                            "startSec": a * BAR, "endSec": b * BAR}
                           for name, a, b in SECTIONS], "sources": {}}
    pressure = None
    for role in ROLES:
        path = ROOT / "assets/audio" / f"cache-{role}.mp3"
        probe = json.loads(run("ffprobe", "-v", "error", "-read_intervals", "0%+#1",
                               "-show_packets", "-show_streams", "-show_format",
                               "-of", "json", str(path)))
        stream = probe["streams"][0]
        rate, channels = int(stream["sample_rate"]), int(stream["channels"])
        assert rate == RATE and channels == 2, (role, rate, channels)
        raw = run("ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-")
        frames = len(raw) // (channels * 4)
        assert len(raw) % (channels * 4) == 0 and frames == EXPECTED_FRAMES, (role, frames)
        pcm = floats(raw)
        del raw
        levels = {}
        for name, a, b in SECTIONS:
            first, last = round(a * BAR * rate) * channels, round(b * BAR * rate) * channels
            levels[name] = rms_db(pcm[first:last])
        first_audible = next(i // channels for i, value in enumerate(pcm) if abs(value) > .005)
        skip = probe["packets"][0].get("side_data_list", [{}])[0].get("skip_samples", 0)
        report["sources"][role] = {"sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "sampleRate": rate, "channels": channels, "decodedFrames": frames,
            "decodedDurationSec": frames / rate,
            "containerDurationSec": float(probe["format"]["duration"]),
            "containerStartTimeSec": float(probe["format"]["start_time"]),
            "encoderSkipSamples": skip, "firstAbove005Sample": first_audible,
            "sectionStereoRmsDbfs": levels}
        del pcm
        if role == "pressure":
            pressure = floats(run("ffmpeg", "-v", "error", "-i", str(path),
                                  "-ac", "1", "-ar", "8000", "-f", "f32le", "-"))

    assert EXPECTED_FRAMES / RATE == BARS * BAR
    periods = onset_periods(pressure)
    assert abs(periods["strongestPeriodSec"] - BAR) <= .004, periods
    assert abs(periods["quarterPeriodSec"] - BEAT) <= .004, periods
    assert abs(periods["fourBarPeriodSec"] - 4 * BAR) <= .004, periods
    report["onsetPeriodicity"] = periods

    # Preserve timbre: chorus kicks have a different envelope, so use their
    # own first chorus as a template. One strongest-peak detector would give
    # a spurious several-millisecond 'tempo correction' at each chorus.
    matches = []
    for name, start, end in SECTIONS:
        for bar in range(start, end):
            if bar == 0:
                continue
            # Compare each position in the repeating four-bar pattern with
            # its corresponding template, including the song's final bar.
            reference_bar = (20 if name.startswith("Chorus") else 0) + bar % 4
            template_at = round(reference_bar * BAR * 8000)
            template = pressure[template_at:template_at + 800]
            match = attack_match(pressure, template, round(bar * BAR * 8000), 8000)
            assert abs(match["offsetMs"]) <= .5 and match["correlation"] > .97, (name, bar, match)
            matches.append({"bar": bar + 1, "timeSec": bar * BAR, **match})
    report["repeatedBarAttacks"] = matches
    report["maxRepeatedAttackOffsetMs"] = max(abs(row["offsetMs"]) for row in matches)
    report["minimumRepeatedAttackCorrelation"] = min(row["correlation"] for row in matches)
    # The owner's first/second verse halves are audible across all four
    # rounds. This checks the declared map, not an inferred lane-availability
    # mask; quiet recordings must stay selectable.
    levels = report["sources"]["breakaway"]["sectionStereoRmsDbfs"]
    for cycle in range(1, 5):
        assert levels[f"Verse {cycle} B"] - levels[f"Verse {cycle} A"] > 15, levels
    if args.json:
        args.json.parent.mkdir(parents=True, exist_ok=True)
        args.json.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"ok": True, "sources": len(ROLES), "decodedFramesPerSource": EXPECTED_FRAMES,
                      "quarterBpm": BPM, "originSec": 0, "bars": BARS,
                      "durationSec": BARS * BAR, "repeatedBarAttacks": len(matches),
                      "maximumAttackDriftMs": report["maxRepeatedAttackOffsetMs"],
                      "minimumAttackCorrelation": report["minimumRepeatedAttackCorrelation"],
                      "onsetPeriodicity": periods}, indent=2))


if __name__ == "__main__":
    main()
