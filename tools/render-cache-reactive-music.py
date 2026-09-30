#!/usr/bin/env python3
"""Music-only native audition of production Cache catches and gain ramps.

This applies AudioSystem's piecewise-linear cancel-and-hold gain behavior to
the five aligned MP3 recordings. It is a reproducible native listening aid;
the Chromium check separately renders the same trace with real Web Audio/SFX.
"""
import hashlib
import json
import math
import subprocess
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/source-pack/review-cache-drive-feedback"
RATE = 44100
ROLES = ("pressure", "drive", "flow", "breakaway", "undercurrent")


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(command, **options):
    return subprocess.run(command, cwd=ROOT, check=True, capture_output=True, **options).stdout


def decode(path, seconds=None):
    command = ["ffmpeg", "-v", "error", "-i", str(path)]
    if seconds is not None:
        command += ["-t", str(seconds)]
    raw = run(command + ["-ar", str(RATE), "-ac", "2", "-f", "f32le", "pipe:1"])
    return np.frombuffer(raw, dtype="<f4").reshape(-1, 2)


def envelope(events, samples):
    """Hold the actual value at every new event, including interrupted ramps."""
    result = np.zeros(samples, dtype=np.float64)
    previous_at, previous_from, previous_target, previous_duration = 0.0, 0.0, 0.0, 0.0
    for index, event in enumerate(events):
        at, target, duration = event["at"], event["volume"], event["duration"]
        elapsed = at - previous_at
        amount = min(1.0, max(0.0, elapsed / previous_duration)) if previous_duration else 1.0
        held = previous_from + (previous_target - previous_from) * amount
        stop = events[index + 1]["at"] if index + 1 < len(events) else samples / RATE
        lo = max(0, min(samples, math.ceil(at * RATE - 1e-8)))
        hi = max(lo, min(samples, math.ceil(stop * RATE - 1e-8)))
        t = np.arange(lo, hi, dtype=np.float64) / RATE
        progress = np.clip((t - at) / duration, 0.0, 1.0) if duration else np.ones(hi - lo)
        result[lo:hi] = held + (target - held) * progress
        previous_at, previous_from, previous_target, previous_duration = at, held, target, duration
    return result


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    trace = json.loads(run(["node", "-e",
        'process.stdout.write(JSON.stringify(require("./tools/check-cache-road-music-reactivity.cjs").auditionTrace()))'
    ], text=True))
    samples = round(trace["seconds"] * RATE)
    mix = np.zeros((samples, 2), dtype=np.float64)
    sources, envelopes = [], {}
    for role in ROLES:
        source_id = "cache-" + role
        path = ROOT / "assets/audio" / (source_id + ".mp3")
        pcm = decode(path, trace["seconds"])
        if pcm.shape != mix.shape or not np.isfinite(pcm).all():
            raise AssertionError(f"Incomplete/non-finite aligned source: {source_id}")
        events = sorted((event for event in trace["mixEvents"] if event["sourceId"] == source_id),
                        key=lambda event: event["at"])
        if not events or events[0]["at"] < 0:
            raise AssertionError(f"Source has no valid gain events: {source_id}")
        gain = envelope(events, samples)
        envelopes[role] = gain
        mix += pcm * gain[:, None]
        sources.append({"id": source_id, "path": str(path.relative_to(ROOT)), "sha256": sha256(path),
                        "decodedSamples": len(pcm), "startSeconds": 0, "gainEvents": events})
    # The production master music bus is .8. Only the finite review edge has
    # a 60-ms fade, so exporting this excerpt does not end with a hard cut.
    mix *= .8
    edge_samples = round(.06 * RATE)
    mix[-edge_samples:] *= np.linspace(1, 0, edge_samples)[:, None]
    peak = float(np.abs(mix).max())
    if not np.isfinite(mix).all() or peak >= 1:
        raise AssertionError(f"Native audition clips or is non-finite: {peak}")
    assert float(envelopes["pressure"][math.ceil(.11 * RATE):].min()) > .59999
    losses = [event for event in trace["mixEvents"] if event["at"] > 0 and
              event["sourceId"] in ("cache-breakaway", "cache-undercurrent") and event["volume"] == 0]
    assert len(losses) >= 3, "Audition must include real whole-part exits"
    target = OUTPUT / "Reactive-Music-Audition.mp3"
    run(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(RATE), "-ac", "2",
         "-i", "pipe:0", "-c:a", "libmp3lame", "-b:a", "192k", "-write_xing", "1",
         "-metadata", "title=Cache Line - native production music-control audition",
         "-metadata", "comment=Music only; production gain trace; Web Audio and SFX checked separately in Chromium",
         str(target)], input=mix.astype("<f4").tobytes())
    encoded = decode(target)
    encoded_peak = float(np.abs(encoded).max())
    if encoded_peak >= 1 or not np.isfinite(encoded).all() or target.stat().st_size >= 2 * 1024 * 1024:
        raise AssertionError("Encoded audition clips, is non-finite or exceeds 2 MiB")
    trace_path = OUTPUT / "Reactive-Music-Trace.json"
    trace_path.write_text(json.dumps(trace, indent=2) + "\n")
    checks = {"method": "Native offline music-only audition: five FFmpeg-decoded aligned MP3s plus production piecewise-linear gain trace",
              "limitations": "Not a browser/device recording. Gameplay SFX and engine are omitted; real Web Audio renders the same trace separately in Chromium.",
              "tool": str(Path(__file__).relative_to(ROOT)), "seconds": trace["seconds"],
              "sampleRate": RATE, "channels": 2, "musicBusGain": .8, "reviewEdgeFadeMs": 60,
              "sources": sources, "productionEvents": trace["events"], "gainEventCount": len(trace["mixEvents"]),
              "wholePartExits": losses, "drumsContinuousAfterAttack": True,
              "pcmPeak": peak, "pcmRms": float(np.sqrt(np.mean(mix * mix))),
              "encodedPeak": encoded_peak, "clippedSamples": int(np.count_nonzero(np.abs(encoded) >= 1)),
              "output": {"path": str(target.relative_to(ROOT)), "bytes": target.stat().st_size, "sha256": sha256(target)},
              "traceSha256": sha256(trace_path),
              "productionSourceHashes": {file: sha256(ROOT / file) for file in [
                  "src/engine/cache-road-proof-profile.js", "src/engine/music-director.js",
                  "src/engine/audio.js", "src/game/cache-road-proof.js",
                  "tools/check-cache-road-music-reactivity.cjs"]}}
    (OUTPUT / "Reactive-Music-Native-Checks.json").write_text(json.dumps(checks, indent=2) + "\n")
    print(json.dumps({"path": str(target.relative_to(ROOT)), "bytes": target.stat().st_size,
                      "pcmPeak": peak, "encodedPeak": encoded_peak, "gainEvents": len(trace["mixEvents"]),
                      "wholePartExits": len(losses), "sha256": checks["output"]["sha256"]}, indent=2))


if __name__ == "__main__":
    main()
