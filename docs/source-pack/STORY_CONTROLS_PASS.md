# Stage B — crew handoff and Level 1 controls

## Review boundary

Base and rollback: merged PR #38, `0d1882f6b6eebf6fc5704d8a3270f2a6b1fb7354`. The owner said “Merged. Lets proceed” after the whole-campaign plan. This implements Stage B as one combined review on `agent/level1-story-controls`. The generated manifest/receipt identifies the exact exported head and PR. Owner Makko acceptance is pending; automatic checks do not certify controller hardware, browser audio activation or gameplay feel.

## Playable changes

| Area | Implemented behavior |
|---|---|
| Crew link | Four skippable panels between the completed tutorial and the first mission encounter. The original four establish the street/Jammer objective. Cliff and Sheila speak by intercom; Sheila receives no new portrait. Existing SO6/SO8/SO10 art is reused without changing its URLs or the original prologue. |
| Panel setup | On panel 3, the caption crosses the margin. Left Arrow / D-pad Left inspects it and gets a Studio Rats response. Inspecting it adds a small completion-screen callback. Stable reserved ID: `egg.comic.gutter`. This is a run-only prototype; later L4/L7 payoffs and campaign persistence belong to Stage C onward. |
| Scene ownership | The existing gameplay update/render/input owners drive the scene. World simulation and game-time cooldowns freeze; the audio transport and hidden rhythm continue. Space/Enter/A advances, Esc/B skips, P/Start uses normal pause. Held inputs are consumed at handoff. Reset/stop clears scene state. |
| Controller | Standard-mapped browser pads gain the missing Rhythm Mode action, tutorial jump/advance separation, title/intro navigation, both hack puzzles, pause/archive/calibration and boss retry/results routes. The title uses its existing animation owner; intro polling is owned and disposed by CutsceneSystem. Gameplay and paused menus use the existing RAF. |
| Attack commitments | Crowd steering cannot overwrite Swooper warning/dive/recovery motion or committed Corrupted/Firewall brace/attack/recovery, including Jammer reinforcements. Horizontal body separation remains. |
| Boss cue | HUD and world counter text read the same cycle/rearm eligibility used by stomp damage. Landing cannot advertise an already spent stomp in that cycle. Damage, phase durations and pulse balance are unchanged. |
| HUD | A top band groups health/mode/lore, the current unfinished objective, score/Amp, and a compact rhythm/combo strip. Completed objectives and the old oversized duplicate rhythm panels no longer crowd the view. Encounter announcements sit below the strip. Terminal music updates moved out of drawing into the existing update owner. |
| Camera | Horizontal follow uses a 90px dead zone, velocity-based lookahead capped at 160px, and elapsed-time easing. Existing world-edge limits and vertical/zoom behavior remain. Boss camera override wins; retry/reset repositions the camera. Ground drawing no longer overwrites the chosen projection. |
| Calibration | Pause → Timing calibration saves independent input compensation and visual beat delay, each −200…+200ms in 5ms UI steps. Keyboard, pointer and pad can adjust, reset, return or resume to test. This is manual calibration, not automatic hardware measurement. |

## Controller map

A/B/X/Y refer to the standard south/east/west/north face positions; PlayStation equivalents are Cross/Circle/Square/Triangle. LB/RB are shoulder buttons; View is the back/select position; R3 is right-stick press. Arbitrary nonstandard mappings are not certified.

| Context | Controls |
|---|---|
| Title | A or Start activates START SYSTEM; existing browser/host audio activation requirements still apply. |
| Original prologue | A advances after the existing minimum display time. Hold B for five seconds to skip all; release cancels the hold. |
| Street | Stick / D-pad moves; A or RB jumps; B enters/exits Rhythm Mode; X attacks; Y hacks; Start pauses. |
| Tutorial | A exclusively advances dialogue. RB jumps. B and Y preserve the chapter locks. |
| Crew link | A continues; B skips; D-pad Left inspects panel 3; Start pauses. |
| Hack digits | D-pad Up=8, Down=2, Left=4, Right=6; A=1, B=3, X=7, Y=9; LB=5, RB=0. View erases; Start submits; R3 disconnects. The full legend is visible during the scan and answer. No answers are revealed and the four-second answer window is unchanged. |
| Pause/settings | D-pad or stick navigates/adjusts; A selects; B backs out or resumes; Start resumes. |
| Lore/calibration | D-pad selects/adjusts; A selects; B returns to pause; Start resumes. |
| Loss/results | A retries/rematches the boss when a checkpoint exists, otherwise restarts Level 1. X always requests the full Level 1 restart. |

The direct digit layout avoids spending the short answer window moving a cursor. Its ergonomics are deliberately a focused owner review item. Source tests prove input reachability, ownership and unchanged puzzle/reward rules, not that a particular controller or player can comfortably enter every sequence in time.

## Timing semantics

Positive **input compensation** subtracts that many milliseconds from the captured physical tap before judgment, compensating consistently late input. Negative compensates consistently early input. The existing profile calibration offset and the saved user value are applied once by MusicTransport; capture-time judgment is retained and windows are not widened.

Positive **visual beat delay** displays the rhythm HUD and player beat rings later; negative displays them sooner. It does not alter the soundtrack, beat-boundary events, boss/enemy timing, scoring, target eligibility or scenery clock. Defaults and Reset timing return both to zero. Old settings files load with zero offsets; blocked storage applies values for the session and reports that they could not save. Calibration does not touch lore saves.

## Validation and Makko route

The existing production suite remains required. `check:level-01-story-controls` adds consequential checks for the scene/music boundary, tutorial controller ownership, two real generated hack puzzles and one-bar rewards, pause/archive/calibration routing, captured input offsets/persistence, follow camera/cinematic priority, committed crowd writes through EnemyManager, and boss stomp/retry behavior. The obsolete objective-height assertion is replaced by a production draw check for current-objective visibility and reserved HUD bounds. Two existing menu pointer positions and the default resume index reflect the added calibration row; their ownership/save assertions remain.

The baseline inventory intentionally adds the two runtime modules and updates inline-script indices/declaration lines. It does not excuse a new missing asset or duplicate runtime owner. No package/runtime dependencies are added. Existing host-provided Makko engine, external assets and two missing legacy whoosh paths remain recorded technical debt.

Native Canvas diagnostics in `verification/stage-b-*.webp` show the four-panel composition, HUD geometry, pause/calibration and controller terminal. They were rendered from production drawing code and inspected for text bounds. The HUD view uses host fixture graphics, not a live Makko sprite/asset load. Reproduce with `node tools/render-level-01-story-controls.cjs /path/to/existing-prologue-images` using the current SO6/SO8/SO10 files. No new game art is included.

Makko route before merge:

1. Import the supplied exact revision into a duplicate project. Check title audio activation, prologue A/hold-B, controller disconnect/reconnect and keyboard fallback.
2. Complete the tutorial: A advances without jumping; RB meets jump tasks; B/Y respect chapter locks. Read/skip the crew link, inspect panel 3, and pause/resume while it is open. Verify continuous music and one mission start.
3. Use both hacks with keyboard and controller, including correction, cancel, timeout and one-bar success. Check the direct-digit layout comfortably supports the unchanged answer window.
4. Check top-band readability at the actual desktop size, normal/Amp target brackets, lift/roofs and camera reversals/world ends. Keep an eye on crowd attack warnings and fixed dive lanes.
5. Adjust positive/negative timing offsets; test in play, reopen and reload, then reset. Verify input vs visual effects are distinct and the song never seeks/restarts because of a setting.
6. Complete 20 mission defeats, the 16-hit Jammer, the full existing entrance and boss combat. Check a spent stomp cycle does not show an available stomp, boss world position remains fixed through the camera, lose/retry and win/rematch work, and full restart preserves recovered lore. Check the optional caption callback on results.

Record revision, Makko project/origin, browser/controller and PASS/FAIL. No merge is performed by this pass. If accepted, Stage C is the campaign adapter, extension of the existing save, required-key/optional-module/results/intermission facts and a second-song role-aware mixer proof. Levels 2–7, ending evaluation, later cameos, mobile and standalone migration are not added here.
