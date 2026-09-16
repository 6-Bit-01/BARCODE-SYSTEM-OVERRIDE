# Controller repair and approaching-car warnings

The owner rejected the live controller result of merged #62 and requested an illustrated, flashing red WATCH OUT indicator, beginning three seconds before an approaching foreground car, pointing off either edge at that car's height. This pass is on `agent/controller-jump-traffic-warning`, based on merged #62, `af8019a1e7755195c4e6e2cddf1e3d3f9f82002a`.

## Reproduction and correction

The old playable-training branch intercepts Cross to advance dialogue, calls resetActionEdges and consumes the frame. This clears movement and suppresses jump. It separately calls player.jump on right bumper, but the mapped jump-held action remains false; the full physics update immediately queues a jump cut. Reproduction at 60Hz: Cross rise 0px; held RB rise 54.8113px. The prior tests checked only that the bumper left the ground, missing the broken flight.

Remove those overrides. Cross/A now uses the same mapped jump press, hold and release through training and the street. Create/View (standard button 8, already excluded from gameplay remaps) advances playable crew speech and does not clear gameplay input. Default R1/RB inspects; inspection remains inactive during training. Menus still use Cross/A confirm. Opening cinematic controls stay unchanged. Tutorial and settings prompts explain the distinction. The beat-attack feedback now displays the active Rhythm Mode binding instead of always saying R.

No movement speed, jump impulse, gravity, musical timing or attack rule changes. Held Cross rises about 286px at 60Hz, equal to held keyboard jump. Short taps preserve existing variable-height behavior. Saved remaps remain respected.

## Warning art and timing

Asset: `assets/traffic-warning/watch-out.webp`, prepared from one built-in image-generation result. `PROMPT.md` retains the exact prompt and `watch-out.json` the atlas rectangles. The generated alpha is retained. Mechanical preparation crops/downsamples the label and arrow separately. Runtime reverses only the arrow for right arrivals; lettering never reverses. Immutable asset ancestor: `27c23b7042a903006f79683f01518f9b5eec49fb`.

Car creation, random selection, artwork, speed (4,350 render units/second), original scale/altitude, bob and three-second queued launch are preserved. The warning calculates time to the viewport from queued time plus remaining offscreen flight. It starts when entry is at most 3,000ms away and continues until the leading opaque artwork reaches the viewport. The collision box is inset and is deliberately not the visibility boundary.

The arrow uses the actual scene matrix (including zoom/impact/shake) and vertical camera, following the car's flight line. Cars retain their existing horizontal render layer. A partly clipped car uses its visible hull slice; a flight entirely outside the view does not create a misleading warning on another floor. Only the label may move below health/rhythm/objectives; a thin red connector leads back to the unchanged arrow height. The artwork pulses twice per second between full and dim visibility, so WATCH OUT stays readable. The asset-failure path retains a red text/arrow warning.

Pause freezes the pending arrival and warning clock. Reset/dispose clears pending warnings through the existing car owner. No additional timer/RAF. Warnings use existing hazard eligibility (not tutorials, boss combat, cinematics or results). Changing the camera during the lead-in recomputes visibility and entry against the new view; no car is slowed or moved to force a timer.

## Evidence and limits

- Story-controls harness now runs actual input followed by the full production update coordinator, checking complete keyboard/Cross/remapped trajectories, tap/hold behavior and landing at 30/60/120Hz. It proves RB no longer jumps and speech advancement preserves movement/held jump.
- Traffic harness keeps all 80 archived-original property/motion comparisons and collision/protection checks. Eighteen fixed-camera approaches cover both directions, three zooms and three frame rates: a three-second lead within one frame, correct height, no early disappearance, pause/camera/reset and image-failure handling. It verifies that only the arrow reverses.
- Native production Canvas previews and an 8.4-second two-direction approach video are in `verification/traffic-warning-left.webp`, `verification/traffic-warning-right.webp`, and `verification/traffic-warning-both-sides.mp4`. Regenerate with `TRAFFIC_WARNING_REVIEW=1 node tools/render-level1-rebuild.cjs /absolute/review-directory`.
- Full npm/syntax/CI outcomes are in the generated exact-revision receipt. Native fixtures and synthetic gamepads are not physical DualSense or hosted Makko acceptance.
- Canonical version 62 source bytes matched all 359 files in merged #62. Its merge receipt is retained in `verification/pr62-merged-history.json`, with the owner's later failed controller playtest explicitly recorded.

## Owner review before merge

1. Import the exact new draft SHA. From the opening into playable crew training, hold Cross/A: verify a full jump. Release early: verify the normal short jump. R1/RB must not jump. Hold movement and press Create/View to advance dialogue: no stop. Repeat after training and with a shoulder remap.
2. Check Square/X beat attack, L1/LB Rhythm Mode, Triangle/Y hack, Circle/B back/exit, Options/Start pause, menu confirmation, intro advance/skip and both hack keypads. Check the hack recharge HUD from #62 still works.
3. Observe incoming foreground cars on both sides. WATCH OUT should flash for three seconds before visible entry, with its arrow at that car's height. Move the camera vertically and change zoom; confirm the cue tracks the projected flight and does not point to another floor. Pause during a warning, resume and reset. Confirm the cue ends on entry, with the same original car motion.
4. Keep the draft unmerged until the owner records the tested SHA and acceptance. After merge, import actual main SHA and repeat the focused route. This repair has no claimed hosted acceptance yet.

Rollback is the base SHA above; that restores the known failed controller behavior and older subtle car warnings. The merged walk, upper routes, hack meter and historical evidence remain preserved.
