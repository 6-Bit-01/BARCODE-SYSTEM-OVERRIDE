# Intro rendering, artwork delivery and Level 1 continuity repair

Base and rollback: merged PR #40, `a747b58411650146bdc003a529d0470167d275db`. Review branch: `agent/intro-makko-repair`. The source manifest identifies the published head and PR. This is one combined repair for the owner's canvas-limit/missing-picture report, mismatched Level 1 dialogue, and request for scene-placed, styled text. It does not claim Makko acceptance.

## Report and repair

| Report / source evidence | Implemented change |
|---|---|
| The new intro requested `canvas.getContext('2d')` on every draw, including the 50 ms input/presentation poll. The owner reported the context-limit error. | Acquire once when creating the canvas; every redraw uses that reference. A rejected/null context shows the readable transcript and working controls without retrying creation. Cleanup releases the reference with its canvas. No guard threshold is raised or disabled. |
| Both screenshot frames said CHANNEL IMAGE UNAVAILABLE. PR #40 only requested relative repository image paths. | Request immutable public copies of the same eight approved WebPs, pinned to the existing merge. If that origin errors or times out, attempt the bundled path once. Both paths are cancellable, stale callbacks cannot settle a replacement load, and failures cannot prevent advancing/skipping. |
| Dialogue sat below reduced-size artwork in identical panels. | Give each scene the full picture area; author balloon positions against that illustration. Cream, ink-bordered speech balloons point toward the visible speaker; offscreen crew use dark receiver cards with the same white/cyan/yellow/red identities. Reading-order markers, cut corners, larger proportional text and compact system stamps replace the detached bottom boxes and duplicate side crops. |
| The opening leaves a live studio for a jammed district, but the old tutorial reboots the story and asserts a catastrophic tower collapse. | Continue the same open crew channel. Cache answers 6 Bit, Mac establishes the local relay problem, DJ teaches rhythm, Mac/Cache cover hacking, then the crew sets the twenty-defeat district/Jammer objective. Remove the unsupported collapse and anonymous guide exposition. |
| Some tutorial completion branches compared the exact old waiting-line text. | Use existing objective IDs and chapter guards, keeping copy changes independent of progression. Preserve all teaching gates, final readable hold/fade, training-count reset and single mission entry. |

## Assets and presentation

The eight image files and character models are unchanged. The approved cast remains the original four plus Cliff's page-2 background cameo; other characters stay offscreen/obscured. `assets/intro/art-manifest.json` retains production provenance. The delivery base is:

`https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/a747b58411650146bdc003a529d0470167d275db/`

`verification/intro-asset-delivery.json` records eight actual public HTTPS responses: HTTP 200, `image/webp`, CORS `*`, WebP signatures and exact byte equality with the bundled files. Public hosting remains a runtime dependency; endpoint verification is not a Makko-origin/CSP result. No new image generation, runtime dependency or alternate character likeness is introduced.

`verification/intro-contact.webp` shows the eight revised production layouts. `intro-01.webp` through `intro-08.webp` provide full-size views; `intro-skip.webp` and `intro-reduced-effects.webp` retain the skip and displaced-caption states. `intro-tutorial-comms.webp` is a strip of the actual tutorial dialogue renderer, not a fabricated gameplay scene. These are native Canvas diagnostics, not Makko captures.

## Story order

Read the full opening in `INTRO_OVERHAUL.md` and the complete rewritten street conversation in `INTRO_TO_LEVEL_01.md`.

1. Broadcast together; the return goes dead; preserve the original, listen, open a route.
2. 6 Bit rejects automatic recovery, heads into Dead Air District, and leaves all four crew channels open.
3. Cache answers on the street. Mac explains the jammed relays and blocked tower uplink, including for players who skipped the pictures.
4. Complete movement/jump, three training defeats, grounded rhythm/five-hit combo and the existing hack check.
5. The crew sets the local task: clear twenty corrupted signals across four blocks, locate and destroy the sixteen-hit Broadcast Jammer, then follow the tower route and existing 9 Bit mission.
6. The final line completes its existing ten-second hold and two-second fade. Training defeats clear; the mission begins once at zero. The existing Jammer cinematic/boss/retry/completion remain.

The title/tutorial's 9 Bit name remains. This repair does not add his origin/motive reveal, resolve the simulation's creator, expose the collection/ending relationship, or rewrite the three persistent lore records.

## Verification and limits

- `node tools/check-intro.js` exercises production CutsceneSystem, input, lifecycle and the real TutorialSystem/HackingSystem: a supplied one-call context budget across two minutes of reading; no retries after a rejected context; bounded remote/bundled failures, timeout and stale-load cancellation; normal/skip paths through all tutorial gates and the final hold/fade into one mission; existing S/B ownership, controller release, audio scheduling and teardown.
- The restrictive context guard is a test boundary, not recovered Makko host instrumentation. No live Makko project was controlled in this session. An optional local Chromium run was unavailable because the browser binary download timed out; no browser PASS is claimed.
- `node tools/render-intro.cjs` decodes the real bundled WebPs, checks all speech text against its measured balloon bounds, checks balloon overlap/image bounds, renders every tutorial line and writes the inspected previews.
- Required `npm test` and `npm run check:syntax:all`, source hashes and publication status are recorded in the export receipt. The baseline inventory change only adds the pinned public asset host; no old findings are removed.

Use the focused current route in ACCEPTANCE before merging this repair. PR #40 being merged did not prove that its Makko opening worked: the owner's subsequent screenshot/error is the reason for this repair.

## Next upgrades, after the intro

The disliked PR #39 HUD is still the current gameplay HUD. The requested revision and genuinely different rhythm threshold attacks are not implemented in this repair. Next: compare the old and current rhythm presentation, simplify essential HUD hierarchy, make target/timing/attack-result feedback clearer, and implement distinct earned attack behaviors and varied phrase patterns while retaining the approved input and damage rules. Numerical thresholds remain tuning choices, not settled lore.

Existing combat/contact/SFX repairs, committed enemy attacks, controller routing, saved calibration, follow camera, traffic/scenery, three authored persistent lore records and finishable Level 1 remain implemented. The whole seven-level map and all 28 lore purposes are documented; the remaining 25 full records and later playable levels are future work. Campaign/save/mixer services follow the HUD/rhythm pass. Migration remains deferred.
