# Boss fairness, rhythm lift and Studio Rat event

Base/rollback: merged PR #68, `84f7471fce9bb9300cd7c6f7165a86787054ace9`.
Review branch: `agent/boss-fairness-level-rewards`. One combined draft; owner Makko acceptance is pending. The generated source receipt identifies the exact review commit and checks.

## Reported failures and repairs

The boss rhythm test compared the attack radius with the boss's center. A 260-unit pulse could reach his body while his center was 300 units away and still return `out-of-range`. Target brackets and damage now share nearest-body distance using the existing stable world-space hull, on the street and all rooftops. Musical guard/recovery windows and one hit per successful beat remain.

Ordinary descending stomps allow 14 units past the head plane and a 26-unit half-foot reach; boss stomps allow 12 and 26. Rising or side-only contact cannot become a stomp. Ordinary side contact separates the original bodies but gives a shallow 5-unit horizontal/8-unit upper graze an 85 ms escape interval. Deep contact and sustained pressure still hurt. Rebound, landing-to-rearm and anti-bounce rules remain.

Foreground traffic was explicitly gated off during boss combat. It now keeps its existing WATCH OUT warnings and player contact, and independently tests the boss. The boss has an 8-unit horizontal/6-unit vertical inset and must overlap a car for 40 ms; narrow grazes can escape. A proper collision deals one damage even during his musical guard. A car can hit both actors once each. Retry clears traffic so the next approach has its normal warning. Original art, speed, scale, random altitude/direction, bob, 15% foreground chance and three-second approach are unchanged. Distant traffic remains scenery.

## Elevator and note

The cabin is 196 units wide, expanded around its original x=2506 center (left edge x=2408). This preserves the transfer to Firewall canopy at y=358; street stop remains y=856. Whole-cabin artwork provides a roof, frame and a deep floor whose center is the player foot line. Two beats still power it. The nearest central Jammer slot shifts from x=2000 to x=1980 to retain the full attack-clearance margin around the wider lift; all five safe slots and the established central band remain.

The owner's final correction is included: the back drive is one fixed strip covering the complete travel plus cabin height, drawn behind the cabin. Cable teeth and motors animate on the existing lift clock while charged/moving, reverse on return, stop when unpowered, and follow pause/reset. The nearby label counters camera zoom and reads RHYTHM LIFT / RHYTHM MODE with the two charge indicators. Cliff's maintenance note is now at x=2366, beside the street entrance.

## Difficulty and eventual rewards

An existing-canvas menu appears before the first gameplay frame. Keyboard, pointer and controller selection lock for the level, including boss checkpoint retries. A full level restart permits a new choice. Future level owners can register their own genre-specific profiles.

Provisional Level 1 tuning:

| Choice | Health | Hostile time scale | Hidden completion value |
| --- | ---: | ---: | ---: |
| Relaxed | 4 | 0.86 | 1 |
| Standard | 3 | 1.00 | 2 |
| Overclocked | 3 | 1.12 | 3 |

Player traversal, lift, vehicles, music and beat judgment clocks do not change. The saved value is awarded on level completion, keeping only the best completed value for each level so replay cannot farm the total. These values and final reward evaluation are absent from player-facing UI. Album delivery, exact thresholds and final unlocks remain undecided; this pass does not invent them. Names and tuning are working choices for owner playtesting.

## Studio Rats

Studio Rats are tuxedo cats. Level 1's cat remains on Cache's upper route, away from the elevator. Twelve complete poses provide a look toward the viewer, blink/paw gesture, pounce and backward tug. The 6.2-second one-time event picks a visible eligible ordinary enemy, follows its position, uses its real defeat transaction once and drags its presentation off screen. Allies, protected entrances, drones and rebooting enemies are excluded. A cleared area gets a comic-border gag instead.

Existing discovery saves retain their one-time credit and may see the expanded event once through a versioned marker. Persistent Studio Rat IDs exist for all seven levels, separate from the 28 lore records and per-level difficulty completions. Only Level 1 is playable here; later genres still need their own authored encounters. Save merging preserves discoveries and the best per-level results across concurrent tabs.

## Assets and validation

Immutable asset ancestor: `f92f076b237632c7001641690505560fe9075da6`. Original generated RGBA sources, prepared WebP assets and hashes are in `assets/finale`; registration uses `tools/build-level1-finale-assets.py`. Whole poses are cropped and scaled with shared foot registration, without a character-part rig. Existing cast, boss and city artwork are retained. Three cached images are added; no new canvas, timer, listener or animation-loop owner is introduced for the event/mechanism.

`tools/check-level-finale.js` exercises production body-edge rhythm at three heights, descending/side forgiveness, locked selection and boss retry, save merging and seven rat facts, single defeat credit, boss narrow-window traffic exposure, and full-shaft/charge/return/pause behavior. `tools/check-environment-runtime.js` runs 18 real frame-loop routes: training, mission and boss at 30/60/120 fps with natural cars from both sides. Existing route checks cover the enlarged lift's actual upper handoff and return. Updated old assertions describe the new cabin floor and intentional 6.2-second event; no contact/route assertion was removed.

Required `npm test` and `npm run check:syntax:all` results belong to the generated receipt. The inventory changes add the difficulty owner and finale check, shift script indices and update source line references. This is an intentional script-graph change, not a blanket baseline reset.

Native evidence: `verification/finale-lift-bottom.webp`, `finale-lift-top.webp`, `finale-cat-event.webp`, `finale-difficulty.webp` and `finale-review.mp4`. Reproduce with `FINALE_REVIEW=1 node tools/render-level1-rebuild.cjs /absolute/output/path`. Production owners/art are used with a native Canvas/Makko sprite boundary adapter. This does not certify hosted Makko rendering, controller hardware, audio synchronization or gameplay feel.

The temporary outage note is historical: work resumed intact and its two original failures were resolved. Preserve PR #68's facade mounts, tutorial Objectives, fixed-scale animated background and heavier rain, permanent terminal depth, central Jammer, faint roof lines, Cross jump/beat, Down+Jump descent, H practice/hijack, 20 mission defeats, 16 Jammer hits, boss upper pursuit, checkpoint and music.
