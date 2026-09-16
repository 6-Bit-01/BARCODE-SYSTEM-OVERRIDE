# Sustained walk loop and controller review

Base/rollback is merged PR #60 (`5e0de1e16f2e40fd077468a18b0404e067cf634f`). The walk repair is implemented on `agent/walk-loop-repair`; controller changes below are a recommendation, not implemented bindings.

## Diagnosis and repair

The active twelve-pose walk repeats four times in a four-second clip. Its final drawing leaves the arm low and the legs crossing; the jump back to pose zero skips the return swing. The retained original source contains the following four drawings that complete that movement. Sustained production playback preserves its reference correctly; repeatedly restarting the clip was not reproduced.

The repaired selection restores source poses 0–15 from `a4c1b7cf6fec0a083a4812ae1ea76edef45a5911`, SHA-256 `65e919b8ad1858e28ed118ab417ef0941bde12aac3e03de025e34b9e1183f54c`. The existing whole-body registration now runs around that complete cycle. All boots use source baseline 308; registered waist variation stays below one source pixel. The cycle advances evenly every 62.5 ms, replacing the old uneven 45–135 ms holds. There are 16 unique atlas cells and 64 metadata slots, four full one-second strides. The former 48-slot / 12 FPS assertion is intentionally updated; clip duration remains four seconds.

The atlas grows from 493,234 to 647,730 bytes; decoded dimensions remain 2304 × 640. No added per-frame filters, frame blending, body-part rigs, timers, gameplay speed or collision changes. The two generated sprite candidates were rejected and are not installed. The prior artwork and polish provenance remain in Git and calibration history.

The exact art commit is `3e1af42b28521ff02efd7343792a890196493f70`. The manifest is published at `215fde24db9f7493f1ee862e14761eb097db55e9`, and active Makko initialization uses that immutable manifest. A test specifically starts with a registry containing only the stale walk and verifies it gets replaced.

## Verification and limits

- Production Player and SpritePlayback: sixty seconds held at 30/60/120/144 Hz, a direction reversal halfway through, frame wrap, unchanged hitbox, pause/resume and idle/jump/walk transitions. Existing uneven-delta, speed and one-shot tests remain.
- Asset checks: metadata count and timing, atlas bounds/hash, foot registration, model manifest loading and stale registry replacement. Full suite and all-file syntax outcomes are in the generated receipt.
- [Ten-second before/after clip](verification/walk-loop-review.mp4) uses production Player animation/drawing and SpritePlayback with adapted host sprite/image boundaries. Top is base #60, bottom repaired; direction changes after five seconds. Scrolling ground is a diagnostic backdrop, not a recorded Makko level.
- Inspected loop-boundary stills confirm the restored return pose before contact. Native evidence does not establish hosted animation feel, Bluetooth latency or controller acceptance.

Reproduce the native clip after placing the base walk WebP and JSON in a folder as `before.webp` / `before.json`:

```sh
WALK_LOOP_REVIEW=1 WALK_BASELINE=/absolute/base-folder node tools/render-level1-rebuild.cjs /absolute/output-folder
```

## DualSense recommendation — not implemented

| Action | Proposed control |
| --- | --- |
| Move | D-pad or left stick |
| Jump | Cross (✕) |
| Beat attack | Square (□) |
| Hack | Triangle (△) |
| Toggle Rhythm Mode | L1 |
| Inspect / interact with discoveries | R1 |
| Cancel hack/menu or exit Rhythm Mode | Circle (○), contextual |
| Pause | Options |
| Menus / hack keypad | D-pad, Cross confirm, Circle cancel |

The current gameplay map already uses Cross/R1 jump, Square attack, Triangle hack, L1 inspect, Circle Rhythm Mode and Options pause. It also exposes Xbox-labelled prompts and a tutorial that directs players to RB to jump. The recommendation deliberately moves the stance toggle to L1 and inspection to R1; it does not introduce dodging, new attacks or analog changes to movement speed. Keep tutorial dialogue exclusive: Cross advances dialogue; during those locked dialogue steps only, R1 can remain an explicitly labelled jump alternative, with inspection unavailable until dialogue closes.

Before implementation, align controller selection across menus/gameplay, verify browser `mapping === "standard"`, handle unmapped devices explicitly, show PlayStation glyphs, and offer remapping and an adjustable deadzone with hysteresis. A starting stick threshold around 0.20 with release around 0.15 is a proposal to tune on the owner's device. Keep beat attacks as individual button-down events; calibrate rhythm input/audio offset through the existing musical timing owner, not by widening judgment windows globally. Do not bind precise beat hits to analog triggers by default.

Reference for browser mapping semantics: https://www.w3.org/TR/gamepad/ . Physical DualSense / browser / connection-type testing remains necessary; the report has not been blamed on Bluetooth without measurement.

## Owner Makko route

1. Import the exact review head into a fresh preview; confirm new manifest loads without sprite errors.
2. Hold right across a long unobstructed stretch, then left. Watch several one-second stride seams and the four-second metadata wrap.
3. Stop/start, reverse direction, jump while moving, land and continue, then pause/resume mid-stride. Confirm feet, scale and speed remain stable.
4. Compare the native clip, then report whether the walk feels smoother in Makko. Verify the current DualSense bindings independently; the proposed controller layout is not yet installed.
5. Record SHA and PASS/FAIL before merge. After merge, import the actual merge SHA and repeat this short route.

## Source-pack continuity

Canonical version 58 downloaded successfully in this pass. Every exported source byte matches merged #60's tree. Its existing test receipt is preserved at `verification/pr60-review-history.json`; earlier receipts, docs and native evidence remain. The current archive is a review build of this walk pass, not an assertion that PR #60 or this pass received hosted acceptance.
