# Finish The Job — recovered plan and completed implementation

The owner supplied the [complete shared conversation](https://chatgpt.com/share/6aab45a3-02cc-83e8-a465-d90391ee8c13) on September 17, 2026. It contains explicit approval of the twenty-bubble tutorial, followed by the platform/art, lift, terminal, sound, portrait, awning and rhythm requests. Earlier recovery notes incorrectly called the tutorial unapproved/unimplemented and the platform artwork missing. Those status claims are superseded.

Base and rollback: merged PR #75, `48ec019a6037a3bf3910614eb5bae3c0c58d4130`. Review branch: `agent/finish-job-recovered`. The generated source receipt supplies the exact final published head, PR URL and validation results. Keep this one combined draft available for owner Makko review before assistant merge.

## What was recovered

The original tutorial implementation survived in local commit `8f2ebec4fca30edc97b0c108aa8e2e1c41aa5165`. Its saved feedback work included the five platform designs, six portrait drawings, pickup chime, beat colors and unfinished solid-awning routing. These were recovered and integrated over current main; they were not regenerated from a summary.

The four compact WebP sheets and their manifest already exist at immutable asset revision `dce79e888592023b85abe0eac2572f76b66e51ac`. Runtime uses that pin through the shared presentation cache. Local copies, hashes and provenance are in `assets/feedback-polish/`.

## Approved scope and resulting behavior

| Request | Implemented behavior |
| --- | --- |
| Twenty-bubble tutorial | Four movement, three stomp, four rhythm, four hack and five mission bubbles. Cache, Mac, DJ and 6 Bit retain the recording, district, tower, Jammer and 9 Bit story beats. |
| Early and out-of-order actions | Movement and jumping count in either order. Task credit updates immediately; unread story requires acknowledgement. Already-earned coaching can be skipped. Future rhythm/hack actions retain their unlock requirements. |
| Enemy timing | Acknowledging the stomp explanation starts the three-enemy entrance once. No independent timer releases enemies while the briefing is unread. Tutorial kills remain outside the twenty mission defeats. |
| Rhythm teaching | Five clean hits stay credited after a later miss. The player deliberately leaves Rhythm Mode. One lesson owner coordinates task completion and story progression. |
| Hack teaching | Captions and objectives track the real Read/Input/success/failure phases and return to unread story. Practice answers are untimed; failed attempts preserve unrelated progress. Twelve-second allies and repairs get contextual teaching. |
| Readable controls | Larger badges use actual keyboard, PlayStation or Xbox bindings. The shared primary control says Jump or Beat for its current action. The final Continue starts the mission without a compulsory countdown. |
| Five platform designs | Keep the three facade designs plus the two opposite side-braced designs. All nine small platforms use an appropriate wall attachment or roof hanger. Their deck coordinates and collision widths stay unchanged. |
| Lift power | Preserve #75's two-hit launch and exact five simulation seconds from the last accepted charge, including occupied return, rooftop-seam recharge, descent reversal and pause handling. |
| Terminal | Preserve the corrected x=498, y=638 placement, left of the striped awning and clear of the doorway. Its painted waveform jitters for 320 ms every 4.2 seconds; reduced flashes keeps it still. |
| Health pickup sound | Actual healing plays one cached, soft, rising digital major-key chime through the existing bounded SFX bus. Full health and restored checkpoints do not replay it. |
| HUD expressions | Neutral, hurt, good streak, charging, low health, and relief/victory frames follow gameplay state. Damage and healing reactions expire on simulation time and clear on reset. |
| Solid awnings | All five named awnings block side/upward entry and support the player, ordinary enemies, drones and boss, including moving-roof handoffs. Ordinary roofs/steps retain one-way tops, with only the two previously circled small-step underside bonks. |
| Beat result color | The actual judged beat changes cyan/lime/red for perfect/excellent/miss as it crosses the action line, with a check/cross cue as well as color. Calibration and transport restarts retain the correct beat association. |

The five solid awnings are `signal-awning`, `cache-awning`, `firewall-canopy`, `tower-awning` and `broadcast-awning`. The two small underside bonks remain `cache-maintenance-step` and `firewall-low-step`. This scope follows the owner's later explicit request to make awnings like the elevator; it does not restore the rejected blanket collision rule for ordinary platforms.

## Why the ledges began affecting the boss

Previously the static underside checks applied to the player. The unfinished pass made awning slabs solid for every actor, like the elevator roof, but reused a 310-unit elevator probe for the boss. His actual tallest normal walking body is about 232 units. That extra invisible height incorrectly made clear street and some landings appear blocked. Terrain clearance now derives from his existing body presentation metrics; the art and combat hitbox do not change. His original 180-unit-per-second street approach remains covered by regression checks. The small platforms themselves did not become new solid obstacles.

The recovered pass also had a concrete descent bug: the boss jumped from too far inside an awning and immediately landed back on it, repeatedly trying the same route at 30 FPS. He now walks to the departure edge and clears the slab before descending. Route selection accounts for overhead awnings and the lift approach, using the existing upper route where needed.

The corrected body fits beneath the street awnings. Higher routes still check real overhead clearance, and pursuit can use existing ranged attacks from valid footing. Tests verify street pursuit and a real pulse hit at the far side of the street. Warning/recovery timings, health and attack damage remain. A rising cabin also moves a passenger toward the canopy's clear edge instead of trapping them beneath it or losing their ride.

## Verification and review evidence

Run the required `npm test` and `npm run check:syntax:all`; their actual completion and the exported revision are recorded in the generated receipt. The baseline inventory intentionally adds the new checks and follows changed source line locations. Loaded-script order and baseline exceptions are unchanged.

Focused production-module checks cover:

- Tutorial early/out-of-order actions, unread story, single enemy entrance, missed beats after completion, early hack/failure/retry, pause/reset and keyboard/PlayStation/Xbox boundaries at 30/60/120 FPS.
- All five awnings, six actor types, normal upper routes, moving lift-to-canopy transfers, boss roof pursuit and street pursuit at 30/60/120 FPS, the original street approach speed, a real far-street pulse hit, and cabin riders clearing the fixed canopy.
- Existing five-second lift behavior, roof rendering, pancakes, deliberate drops and victory input protection.
- Real damage/healing portrait events, calibrated beat-result association/reset, and cached, finite, bounded pickup audio through the existing volume control.

`review-tutorial-flow/` contains twelve current native renders of the production tutorial/HUD/terminal states. `review-feedback-polish/` contains all nine mounted platforms, the terminal's still/glitch states, six portrait frames and three beat outcomes. Regenerate with:

```sh
TUTORIAL_FLOW_REVIEW=1 node tools/render-level1-rebuild.cjs docs/source-pack/review-tutorial-flow
FEEDBACK_POLISH_REVIEW=1 node tools/render-level1-rebuild.cjs docs/source-pack/review-feedback-polish
```

These checks adapt image, audio and device boundaries; they are not a hosted Makko playtest, physical-controller acceptance or an assessment of speaker/headphone sound. Follow the newest route in `ACCEPTANCE.md` on the exact published head. After owner acceptance and merge, import the actual new main SHA and repeat it.

## Related recommendations — not implemented in this pass

1. Let the lift's existing power lamps visibly drain during the five-second window, with a restrained near-expiry cue. This would make the now-automatic occupied return easier to anticipate without adding another instruction box.
2. Offer an optional practice replay from the pause menu that returns to the same run. The coordinated tutorial now provides useful isolated lessons; exposing replay would help returning players without restarting their campaign progress.
3. Add a short sound audition control beside the existing SFX volume setting. The new pickup chime and established combat cues could be judged at the player's chosen level without waiting for a pickup or a fight.

Earlier work is already present: twelve-second allies, protected victory controls, deliberate platform drops, roof enemy visibility, Studio Rat returns, rooftop rewards and the corrected intro. Do not repackage those as unfinished features. Broader campaign services/Stage C remain after Level 1 acceptance; no new level identity, character reveal or balance change is approved here.
