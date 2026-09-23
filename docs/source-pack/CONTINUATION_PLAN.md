# Campaign continuation — September 12, 2026

**September 23 owner revision:** This document's old current-work and genre-proof order is historical. Read `CAMPAIGN_REDESIGN.md` and the newest `DECISION_REGISTER.md` first. Level 3 is now Mac/Streets of Rage, Level 4 DJ/Super Smash TV, Level 5 Sheila's forgotten competition with the four as mindless husks, Level 6 an all-four first-person RPG, and Level 7 an all-four DOOM assault. 9 Bit's player-aware saved-title, game-over and results intrusions are selected direction. The Contra preview merged in #91 but only proved shared architecture; the owner rejected its gameplay feel as the final stage direction. No new genre or cutscene implementation is implied by this document update.

## Latest owner follow-up — cats, FX, arrow, boss attack and size

PR #44 is already merged at `4b207c5570a6bccd86b95c702c11e1e6606bbf01`. Continue from the combined `agent/level1-cat-chaos-assets` review governed by `CAT_CHAOS_ASSET_PASS.md`. All five newest requests are implemented together: Studio Rats are cats, a generated walk asset, a reusable objective arrow, animated boss pulse art, chaotic event-seeded FX, and modest boss/walk size increases. Do not revive a literal rodent, redo #44 or jump ahead to campaign work while this current presentation pass is being reviewed. Owner Makko acceptance precedes merge; Stage C remains the following milestone.

## Latest implementation — impact/discovery after merged #43

The ten-item owner-approved Level 1 impact/discovery pass is implemented together for draft review in `LEVEL_01_IMPACT_PASS.md`. It includes the previously outstanding compact predictive HUD, threshold attacks, physical/musical scenery, four encounter identities, boss/Jammer payoff and first optional crew discoveries. The corrected intro is retained. Current order: review this exact combined PR in Makko, merge only after owner acceptance, then Stage C campaign services. Earlier paragraphs saying HUD/attack variety or intro repair is still the next implementation are historical.

## Current stage update

Stage A is merged as PR #38, Stage B as #39 and the eight-scene opening as #40. The owner reported that the opening failed in Makko and required better scene-placed text and a coherent first-level continuation. INTRO_REPAIR.md is the current combined repair, based on merged #40. Latest order: finish this intro repair, then revise the disliked HUD/rhythm presentation and add meaningful attack variety, then Stage C. The four original controls/camera/calibration/crowd/counter items in the historical table below were implemented in #39 and must not be redone. HUD/attack variety remains outstanding. Merge status is not a Makko acceptance result.


## The actual handoff

Start from main at **38732933713c4f9ec22666e49b728a0626a85f25**, merged PR #37. This pass completes the campaign planning and instruction reconciliation requested after that merge. It changes development documents, not the playable build. New scene and Easter-egg treatments below are working designs for review, not quotations of a lost transcript or claims of shipped content.

The owner asked to review the source, prior ideas, GitHub and missed details; approved the broader improvement direction; corrected the cameos; then explicitly required mapping the **whole story** before developing isolated intro material. The last visible instruction adds Easter eggs referencing the game's inspirations and says to proceed. The current request asks to continue carefully and explain everything needed for implementation.

Evidence used:

- Live GitHub main/tree, merged #37 and its successful static-validation check; no open PRs at the starting check.
- Current repository v5 guidance, runtime, tests and source-pack documents, including the selected-pass, polish, discovery and lore/archive records.
- Locally inspected attached v2/v3/v4 packs and their original art contact sheets. These are historical design/provenance inputs, not a rollback target.
- Visible project conversation excerpts containing the newest cast, story and Easter-egg instructions.
- Retrieved summaries of BARCODE-System-Override-Next-Pass-Review-2026-09-12.md. Its complete text and the complete last-chat transcript were not available; no later completed campaign map or published PR was found. Do not assert verbatim recovery of its numbered recommendation list.

## Already implemented — retain, do not schedule again

| Area | Verified implementation checkpoint |
|---|---|
| Finishable Level 1 | Four authored encounters, twenty mission defeats, two-hit lift, sixteen-hit environmental Jammer, cinematic, musical boss, loss/retry and completion |
| Combat and animation | Stable bodies/swept ordinary stomps, timestamped taps, elapsed-time presentation, Makko public animation API repair and restored rhythm/action SFX |
| Musical performance | Grounded R stance and explicit exit, continuous hidden timing, attack/guard/miss feedback, combo and selected scenery response |
| Level polish | Accepted-hit health/source feedback, attack warnings, Amp charge feedback, barcode gates, storefront equalizers, curb lights, atmosphere and fragment flights |
| Settings/results | Saved audio/effect preferences, pause controls and results using real run totals |
| Discovery | Three authored placements unlocked at 4/9/14 mission defeats, rooftop Amp pickup repair, stable collected IDs and save recovery |
| Presentation follow-ons | Actual-range target brackets and all 325 original traffic frames in three shared WebP sheets |
| Lore | Three complete crew-authored records and persistent P → Lore archive, with queued notices and hidden unrecovered text |

These statements establish source/merge status. They do not certify the owner's currently imported Makko revision, audible mix, device performance or every past playtest. The existing save envelope is real, but full campaign routing/resume and six later playable levels are still absent.

## Current direction and corrections

- Seven distinct genres in a shared BARCODE simulation; only 6 Bit, DJ Floppydisc, Cache Back and Mac Modem are playable.
- 9 Bit comes from the negative parts separated from 6 Bit. He is not a generic external virus; Mac Modem's good-virus metaphor stays character-specific.
- Comix Zone informs panels, captions, impacts and transitions. Metal Gear informs brief crew communications, reveals, callbacks and occasional player-aware surprises. Both serve the campaign's events.
- Include **Cliff, Sheila, Studio Rats, WittyF0x, Kave, SKELLA and Dr3wBaby**. Remove **Mind Fanatic/M1ND_FANATIC, Emerald/EMRLD, Crowline and W3T TDDY** from active plans. The former W3T TDDY Tower-support requirement is retired, not transferred to another guest as a new gate.
- Sheila remains a silhouette if depicted. Cameos never add playable slots. Other retained community ideas remain candidates unless separately approved; the correction is not an instruction to erase every other existing candidate.
- The owner has reopened intro/story development. The old absolute instruction that the intro can never be reconsidered no longer controls planning. Existing art/copy remain the live baseline until the representative replacement sequence is written, demonstrated and reviewed. This pass does not replace them.
- Preserve all current Level 1 mechanics and discoveries. Later presentation can clarify the story without undoing mission, contact, rhythm, lift, boss or audio repairs.
- Collection affects an eventual ending under the owner's direction. Preserve the facts; keep that relationship out of player-facing hints, counters and menus. Exact evaluation and outcomes remain unresolved.

## Implementation sequence

One coherent review unit per stage; adjacent fixes stay together. These are stages, not a mandate for one PR per tiny effect. Existing implementation/draft authority carries forward. Owner Makko review still applies before gameplay changes merge.

| Stage | Concrete deliverable | Completion evidence |
|---|---|---|
| A — Whole-game map and current instructions | This continuation plan; seven-level cause-and-effect story map; all 28 record purposes; corrected cameo and influence-egg registry; asset/platform plan; current README, roadmap and decisions | Check retained constraints, ID/count continuity, source links and absence of excluded active placements; one combined planning draft |
| B — First representative presentation + remaining Level 1 usability | Story-led intro-to-street or clear-to-next-channel prototype with existing art; brief crew comms; comic framing; first connected secret setup. Complete the remaining control/readability changes below in coherent checkpoints | Show readable action, story purpose and later payoff; source tests for consequential input/state changes; focused Makko route. Exact scene/copy/intensity remain reviewable |
| C — Campaign services and second-song proof | Small enter/update/render/pause/resume/exit adapter; extend the existing save identity; stable completion/key/module/lore/secret facts; level results/intermission/channel handoff; independent source-role mixer | Leave/re-enter cleanly, resume progress, retain old discoveries, no duplicated audio/listeners, and a second song with different source names works |
| D — New genre proofs | Preserve the completed Contra architecture experiment as history; prove Cache's road, Mac's brawler, DJ's top-down arena, Sheila's party/Gym loop and first-person RPG/DOOM team roles | One threat, one musical relationship, collision/camera, pause/exit/save-return; establish actual asset sizes before ordering |
| E — Complete the compact campaign | Finish each level's gameplay, story bridge, crew scene, boss/set piece, key/module, authored lore and chosen eggs | Each level is finishable and rewards persist; direct route communicates required plot; secrets enrich it |
| F — Finale and full-game acceptance | Preparation hub, prior-item payoffs, 9 Bit fight, deliberate resolution/collection evaluation, credits/replay; full controller and supported-device pass | Zero-optional-module route can win; final save remains recoverable; check all genre transitions and ending paths without exposing the hidden collection test |

## Historical pre-#39 Level 1 improvement list

| Item | Current source evidence | Implement/check next |
|---|---|---|
| Controller completeness | ActionInput declares rhythm_mode but DEFAULT_GAMEPAD has no binding; current pause/archive handlers are keyboard/pointer based | Add a semantic R action binding and audit title, intro, tutorial, both hack puzzles, pause, archive, retry and results. A binding alone is not full support; consume/release menu input before resuming |
| Committed enemy behavior | applyCrowdBehavior can rewrite Virus/Swooper velocity; existing attack commitment tests do not make every later crowd write harmless | Exclude committed warning/dive/attack states from incompatible crowd steering; preserve the shown aim, separation rules and hostile clock. Reproduce through the production manager before changing it |
| Truthful boss stomp cue | Damage requires canReceiveDamage, stompArmed and stompCycle !== cycle; the visible COUNTER cue currently checks only the first two | Share/read the actual availability result in the cue. Do not change boss balance or re-enable repeat bouncing |
| Desktop HUD | Relevant information exists across UI, rhythm, boss, tutorial and pickup owners | Group essential health/mode/objective/charges/beat cues and remove redundant presentation; keep telegraphs, captions and archive readability at tested sizes |
| Camera | Existing camera/edge-zoom behavior must coexist with boss cinematic ownership | Prototype restrained follow dead zone/look-ahead and measure readability at roofs/world ends. Do not carry the boss with the camera or shift collision geometry |
| Player timing calibration | Profile judgment offset exists; there is no complete user calibration flow | Add a saved, explicit input offset and separately defined visual offset using the current timing authority. Reset cleanly; preserve capture-time judgment and music continuity; do not silently widen scoring windows |

The recovered review does not provide a complete new numbered list. This table records its supported items, checked against code, without pretending these are an exact recovered enumeration. Earlier deferred encounter, pickup, hacking-feature and extra-scenery ideas remain in OVERHAUL_PROPOSAL and RESPONSIVE_COMBAT_PASS; reassess them only when a mapped scene/level needs them. Many of their original benefits have already shipped.

## Platform and asset work

ASSET_AND_PLATFORM_PLAN.md retains the mobile/standalone question without turning it into an engine migration. Prove the actual controls/runtime on one small slice before committing to mobile expansion. No new engine, dependency set, broad art order or portrait/voice/music purchase is part of Stage A.

## Decisions still genuinely open

Working level order, titles, lead assignments and named later bosses; exact puzzle branch and finale combat cadence; simulation creator/initiator; exact later reveal dialogue and final outcomes/collection rules; later songs and verified metadata; final device/controller/touch support target. These do not block writing a complete working map or the existing-art prototype. Resolve each when its concrete design is ready, rather than asking the owner to reapprove retained decisions.

## Immediate next work after this document pass

Use CAMPAIGN_STORY_MAP to script and mock up one representative crew/panel transition tied to the Level 1 objective and a later payoff. Resolve the two source-backed combat cue/commitment issues alongside the first control/readability checkpoint. Keep the campaign map, gameplay changes, exact test evidence and v5 handoff aligned; do not restart the completed polish or skip directly to six untested full levels.
