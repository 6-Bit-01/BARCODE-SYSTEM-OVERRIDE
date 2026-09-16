# Street depth, one broadcast terminal, and render cost

Base/rollback: merged PR #58, `1c8b54ec5db0e102f64c0ffb15bd4b57c5e5acda`.
Branch: `agent/street-depth-terminal-performance`. Asset ancestor: `1891ebb4e061971362817832e942ef9fbe05d15a`.
Exact review head, PR status and CI are recorded in the generated source-pack receipt.

The owner reports enemies under hologram emitters, too many boxes, and mild lag. This is a scoped correction to that feedback.

## Implemented

- The actual `drawGameEntities` path draws progression scenery before EnemyManager. Enemies and the player now pass over the pavement rails and in front of their building mounts. Gate collision, enemy passage effects and the 650 ms unlock remain. The old native review helper had already drawn those two owners in the opposite order to production, masking this bug; it now calls the actual production coordinator.
- Remove the Firewall and Broadcast utility boxes, including their collision surfaces. Keep exactly one large street prop at the Tower, replacing its generic drawing with a newly generated battered public-access broadcast terminal. The CRT waveform, speakers, chipped mint paint and shallow top/right side match the scene. Its original `tower-utility-unit` surface ID and 160x206 collider stay stable. Thin wall-mounted supports remain; the lift and Tower terminal supply street-to-roof access, and existing connected crowns provide the other route entrances.
- Prebake the four unchanged rail assemblies into two-state WebP sheets (powered/off), retaining the original off-state saturation/brightness. One cached image per visible assembly replaces 13–14 individual module draws. Opening crossfades two states; no extra runtime canvas, context, timer or filter is created. Exact transformed bounds skip offscreen hardware, including cleared gates, and offscreen traversal props. The original small rail assets remain a bounded loading fallback.
- Limit the glowing road stroke and paving marks to the camera's visible horizontal span plus padding. This avoids processing an 8,096-world-pixel blurred line every frame. Movement clocks, enemy AI, traffic geometry/speed/spawning, animation cadence, single jump, health, mission quota, hijack, music and boss rules are unchanged.

## Asset record

`assets/street-hardware/provenance.json` records source, alpha, registration, dimensions, hashes and review status. `geometry.json` records exact gate extents. Runtime uses the immutable asset ancestor above with the existing one-attempt bundled fallback. New content is five images (one terminal plus four paired gate sheets); original rail artwork remains intact.

The terminal was made with built-in OpenAI image generation. Prompt: one battered public-access broadcast terminal / pirate-radio relay kiosk, CRT waveform, speaker cones, worn pale mint metal, dark blue-grey chassis, purple reflected edge light, grime and stickers; broad flat jumpable top; straight front edges and shallow right/up perspective; isolated transparent RGBA; hand-inked side-scrolling game prop with no scenery or projecting antenna. The original generated PNG is retained by the generating ChatGPT turn; its hash is recorded. The optimized runtime export preserves alpha and registers the front lip and feet to the old collider. Owner aesthetic/Makko acceptance is pending.

## Validation and interpretation

Required commands: `npm test` and `npm run check:syntax:all`. The full test suite includes the new production-order/one-prop/no-ghost-collision/culling/filter-budget check. The existing route test now exercises 63 retained production jumps at 30/60/120 Hz; only four obsolete source/destination pairs for the two removed boxes were deleted. Tower ascent, lift, upper routes, original car comparisons, guarded contact, enemy hijack, mission and boss coverage remain.

The baseline inventory's only intentional change is adding `tools/check-street-depth.js` to the non-runtime JavaScript list. It does not change the gameplay baseline or excuse a failure.

`verification/street-hardware-performance.json` compares real before/after gate drawing under the same native Canvas/image adapter at 1920x1080, with six warmup frames and thirty measured frames. First gate: 14 image calls to 1 (median 0.317 to 0.207 ms). All gates cleared: 55 calls to 2 visible cached images (median 0.853 to 0.146 ms). This measures the gate pass only, not total browser FPS. Run-to-run timing varies; operation-count reduction is deterministic for the stated camera. Makko GPU/compositor, device loading and overall play feel need the owner's test.

Native stills inspect the new prop with 6 Bit standing on its registered lip, enemy feet over both powered and cleared rails, and all four gate street/roof placements. They use the production entity order and decoded current assets, with host adapters for images/sprites. They do not certify hosted asset delivery, physical-controller feel or audio. Remote CI, when recorded, separately runs Chromium intro checks.

## Owner Makko route

Import the exact review head into a fresh Makko preview:

1. At Signal Alley, watch enemies cross the pavement emitter. Their boots/body must draw over it. Repeat after a gate powers down; hardware must remain present without popping back in.
2. Proceed through Firewall, Tower and Broadcast. There should be one large jumpable machine: the CRT terminal at the Tower. The removed boxes must not leave invisible platforms. Jump from street to terminal to Tower awning; use the lift and connected roofs for the other upper routes. Check the terminal's feet/top/side against the sidewalk and 6 Bit.
3. Compare scrolling and combat early in the level and after clearing several gates. Check street and rooftop camera positions, pause/resume, original cars, and the usual mission/Jammer/boss/retry/restart flow. Report whether the mild lag is gone, improved, or unchanged and where it remains.

Do not merge this draft until owner Makko acceptance. After acceptance and merge, import the actual new main SHA and repeat the focused checks. To roll back, re-import the base above; do not restore rejected #55 traffic or art.
