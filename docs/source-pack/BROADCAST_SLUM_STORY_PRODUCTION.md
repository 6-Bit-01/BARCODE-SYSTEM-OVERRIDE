# Broadcast Slum: story, scenes and production guide

October 5, 2026. **Owner-directed expansion: eight intro scenes, Kave's main opening choice, one optional earned studio conversation, and a full city chapter.**
The published campaign still has its four-scene Level 2 ending and eight-scene Level 1-to-2 bridge; a separate private Mac preview is in development.
The owner previously approved the eight-scene script with two opening choices and Mac's corrected v2 hero artwork. Their latest correction retains Kave's main opening question and removes only the extra fourth-wall reply menu; it does not remove dialogue choices altogether. Keep all eight stable scenes and core facts, plus the optional in-person studio conversation after the city endpoint is earned. The brief zero-opening-choice interpretation is superseded. Earlier approvals and retired 9 Bit replies remain recorded in the asset manifest and Git history.
Kave's cowboy treatment and later v3 open street wall/room scale are rejected. His verified real-photo references are found; the new enclosed studio v5 remains an unapproved likeness/room candidate. Cache's cockpit v2 is not selected; rejected walking v3/v4/v5 candidates remain preserved and the v6 whole-pose candidate awaits art review. The penultimate hero replaces the old ignition image, retaining eight bridge panels and the existing final car shot.
The expanded Level 3 requires at least six playable city zones, at least six new alien humanoid enemy types plus a distinct boss, new enemy artwork/animations, and green/purple blood. Runtime/enemy-art integration belongs to the parent task; this document does not establish gameplay acceptance, campaign completion or publication.
The shipped Level 2 clear, Bass key and saves retain their existing behavior.

## Current owner correction: fighting motion and damage presentation

In response to the owner's rejection of the previous Mac/enemy motion, the private branch now implements continuous articulated animation using eight native actors and 126 registered parts: 15 for each ordinary actor and 21 for the Regent. The exact selected rig bank contains 17 files. Mac has jab, cross, finisher, step-strike, air-kick and counter moves, plus a contextual throw. Each ordinary enemy has two distinct tactics, with the Regent retaining its three-phase patterns. Real damage creates Mac's red blood or the alien's green/purple blood; blocks, misses and invulnerable contacts create none.

Focused combat checks pass all 25 groups and the final native animation-math review passes all 14 groups, including interrupted movement handoff, planted recovery and all eight measured registrations. The previous 12 integration groups passed before the final foot-controller correction; the latest complete integrated suite is running. Final strict-package, CI and hosted-browser results for this implementation are pending. Evidence: `project-root/verification/mac-fluid-combat-20261005/combat-foot-controller-final-receipt.json` and `project-root/verification/mac-combat-overhaul-20261005/math-review-native-final/animation-math-receipt.json`.

Visual acceptance requirements for this pass:

- Show deliberate weight shifts through hips, shoulders and connected limbs. Keep the established character proportions and one body scale; avoid floating limbs, stretched crop boxes or sudden body-size changes.
- Walking needs a readable contact, weight transfer and swing. Grounded support feet stay planted through attack recovery; takeoff and landing follow the simulated elevation instead of moving the floor beneath the actor.
- Every move has a readable **windup → impact → recovery**. Motion continues between key positions without snapping, and the apparent strike/contact aligns with its actual active damage phase.
- Give additional Mac attacks distinct silhouettes, reach, commitment and recovery. Reusing the same punch with another name or effect is not sufficient; guard, counter, jump, hit reaction and throw must also have coherent connected motion.
- Vary enemy rhythm and body mechanics: Scuttler's close pressure, Lancer's committed lunge, Spitter's ranged preparation, Guard's braced defense, Stalker's lateral crossing, Mantid's planted pulse and Regent's heavier three-phase threat should be distinguishable in normal play.
- Green/purple alien blood and Mac's own blood appear only when the relevant body actually takes damage. Blocks, misses and invulnerable contacts produce no blood; damage reactions must identify the struck body and direction.
- Keep blood localized and finite, preserve readable attack tells, freeze effects with pause and clear them with retry. Effects do not add a second hit, alter health or substitute for the combat result.

Review these requirements at normal gameplay speed across movement, attack chains, guard/counter, throw, damage and each enemy archetype. A still frame or successful automated route cannot accept motion that pops, slides, floats or has misleading contact. Owner review of the new rig art, animation and combat feel, physical-handset play and hardware FPS remain pending. The earlier `4cf1e1174905fafc1b6ecf3b606bc62a60abe2fb` automated/hosted proofs remain historical for the rejected-motion candidate and do not validate this implementation. No new production publication is claimed.

This is a combat presentation correction. Preserve all eight stable intro IDs, the two Kave choices, the enclosed Kave v5 studio, Cache v6 approach and retained final car image, the current music and the existing story/award boundaries. Mac's approved hero v2 does not approve his current gameplay animations.

## Direction and authority

The owner asks us to plan the wider story while building Level 3: purposeful cameos,
dialogue choices, fourth-wall breaks, 9 Bit hacks, references and assets identified in advance.
The Level 2-to-3 cutscene must contain **at least seven scenes**; this proposal uses eight.
The final scene before each of the two requested solo chapters must show its hero heading into action:
Cache Back for Level 2 and Mac Modem for Level 3, with poses distinct from 6 Bit's finale.
The owner's later correction places Cache's hero panel immediately before the retained car finale; Mac remains the final Level 2-to-3 panel.
These are owner requirements. The eight-scene transition writing and Mac v2 are now approved; future gameplay sections and unreviewed illustrations remain production proposals.

The active campaign authorities are [CAMPAIGN_REDESIGN.md](CAMPAIGN_REDESIGN.md),
[CAMPAIGN_SCENE_BEATS.md](CAMPAIGN_SCENE_BEATS.md) and
[EASTER_EGGS_AND_CAMEOS.md](EASTER_EGGS_AND_CAMEOS.md).
Use the current `src/engine/cache-ending.js` and `src/engine/cache-bridge.js` for shipped dialogue.
Old prototype documents do not override the redesigned seven-level campaign or current delivered state.

The production companions are [STORY_PRODUCTION_ASSETS.json](STORY_PRODUCTION_ASSETS.json)
and [STORY_PRODUCTION_REVIEW.html](STORY_PRODUCTION_REVIEW.html).
The manifest tracks references, illustration needs, reuse and production status.
The review page makes the sequence and art gaps visible; a proposal card is not a completed image.

## What the existing cutscenes already do

The eight-scene Level 1-to-2 bridge restores outgoing access, compares the original with a cleaned copy,
preserves both traces, and puts Cache in the yellow car with the original recording.
Its last page, `cache-line`, shows the car from behind. The owner explicitly wants this final image retained.
Revise the existing penultimate panel into Cache's visible walking-with-keys hero beat; the bridge stays at eight panels.

The current Level 2 ending has four panels: `delivered`, `unverified`, `held`, `street-access`.
Cache's delivered recording is complete; the receiver accepts transfer but holds outbound distribution.
Mac takes the street access route, and 6 Bit says, "Cache got it here. Mac, get it heard."
These facts and the final sendoff remain. Expand their presentation rather than retracting Cache's success.

Reuse the four existing illustrations where their action fits the expanded sequence.
Scenes 1, 2, 4 and 7 preserve their corresponding shipped image/story roles.
Scenes 3, 5, 6 and 8 need new compositions or explicitly approved derivatives.
Scene 7 remains the existing Mac street-gate access setup, with Kave heard over comms.

## Eight-scene Level 2-to-3 storyboard

Each scene has a stable identity separate from its displayed position.
The artwork contains no baked dialogue or critical UI labels; runtime layers supply readable text.
The eight stable scenes retain the previously approved core writing. Kave's optional opening question remains; the fourth-wall address flows directly into the crew's response. Revised placement is reviewable writing, not new lore or gameplay acceptance.

### 1. ORIGINAL DELIVERED — `delivered`

**Image/action:** Cache at the receiver, original cassette protected beside the transfer equipment.
Reuse `assets/cache-ending/ending-01-delivered.webp`; relief follows the earned road clear.
Keep Cache's canonical yellow cap, glasses, lower-face mask and mechanical collar.

- **CACHE BACK:** "Original delivered. Names, room noise, all of it."
- **DJ FLOPPYDISC / COMMS:** "It matches. Nothing missing."

Both lines are retained. This is a genuine delivery result, not a trick or apparent failure.

### 2. DELIVERED / UNVERIFIED — `unverified`

**Image/action:** Transfer is DELIVERED while the separate outbound channel is UNVERIFIED.
Reuse `assets/cache-ending/ending-02-unverified.webp` and its screen-label distinction.

- **CACHE BACK:** "They took the file. Why isn't it going out?"
- **MAC MODEM / COMMS:** "Delivery passed. Distribution says UNVERIFIED."

Both lines are retained. The hold concerns distribution, not a rewritten clear or missing recording.

### 3. KAVE'S DEAD AIR — `kave-dead-air`

**Image/action:** Kave works at a Kaveman Radio music-review desk inside an enclosed broadcast studio in the neighborhood.
Solid walls and visible intact ceiling, a full-height closed door and a small closed glazed window establish believable room scale. Desk, monitors, microphone and seated person have ordinary proportions. The wet street is visible only through the glass; there is no open storefront/serving hatch.
The submission queue is full; local monitoring works while the outbound feed is held.
This adapts his public artist/reviewer role into fiction, without asserting real venue ownership.
Kave is artist/reviewer support, never an enforcement enemy or required access credential.

- **KAVE:** "The review queue's full. Nothing's reaching the listeners."
- **CACHE BACK / COMMS:** "It got here whole. Somebody's keeping it here."

- **KAVE:** "Artists waiting for a play. Listeners waiting for a voice."
- **KAVE:** "The outbound feed. Local monitoring works; distribution doesn't."
- **MAC MODEM / COMMS:** "Then we open it back up, piece by piece."

**Optional opening choice — `delivery-question`:** "Who's waiting?" starts with the artists/listeners reply; "What got blocked?" starts with the local/outbound reply. Each answer then supplies the other core fact before Mac's same rejoin. Explicit Continue supplies both facts in the order above without inventing a selection. The original runtime option IDs `who-is-waiting` and `what-got-blocked` remain stable. This question sets the crew's focus without granting access, changing evidence or awarding progress.

### 4. THE HOLD IS LOCAL — `held`

**Image/action:** The retained image shows Mac physically beside DJ in the studio, earlier than Mac's current street approach.
Reuse `assets/cache-ending/ending-03-held.webp` as an explicitly labelled earlier comparison replay.
An authored **EARLIER / STUDIO COMPARISON** ribbon distinguishes the image's time/location; both live spoken lines remain crew comms.
Reader metadata is `artLocation: studio`, `artTime: earlier-comparison`, `dialogueContext: live-comms`; do not pretend these pixels depict the gate or add invented routing data.

- **DJ FLOPPYDISC / COMMS:** "The original arrived. The distribution hold is still there."
- **CACHE BACK / COMMS:** "Then being delivered isn't enough. They're stopping it here."

Both lines are retained. The next step is distribution enforcement, not identifying its ultimate author.

### 5. A NOTE IN THE MARGIN — `margin-note`

**Image/action:** Mac remains at the current street gate; the image does not return him to the earlier studio.
His ordinary caption receives a hand-pasted comic annotation:
`AUTHORISED PUNCHING CONSULTANT`. A hand crosses the illustrated border, then withdraws.
This is a visible presentation prank; real speaker labels, controls, scores and saves remain accurate.

- **MAC MODEM:** "Who edited my subtitle?"
- **9 BIT:** "You. Outside the panel. Still think 'delivered' means 'heard'?"

9 Bit addresses the player. His known identity is not treated as a new secret reveal.
There is no reply menu: the scene flows directly into the crew's evidence distinction in Scene 6.
`frame-reply` and its two replies remain retired history; no random or hidden default is selected.

### 6. KEEP THE RECORD STRAIGHT — `record-straight`

**Image/action:** Cache's preserved cassette and DJ's comparison lanes share a composition.
Original, cleaned copy and present interruption are visibly separated; 9 Bit does not overwrite the tape.
This can use current model/reference elements, but needs a deliberate new storytelling image.

- **CACHE BACK / COMMS:** "That wasn't on the tape."
- **DJ FLOPPYDISC / COMMS:** "Then keep it separate. Record the interruption. Don't call it proof."

The crew recognizes a performed intrusion without accepting every claim made by its speaker.
Cache remains at the receiver; DJ's comparison-monitor contribution is remote comms, not a relocation to Cache's room.
The original recording remains original; there is no new memory or separation verdict here.

### 7. STREET ACCESS — `street-access`

**Image/action:** Retain `assets/cache-ending/ending-04-street-access.webp`:
Mac reaches the street-access gate and finds his opening. Kave remains an offscreen comms voice.
Do not turn this retained setup into a new montage, move the crew to the venue, or grant access via a guest.

- **MAC MODEM / COMMS:** "The hold points to street enforcement. I'll find a way through."
- **KAVE / COMMS:** "I'll keep the queue moving and the local line open."

Mac's line is retained. Kave's approved reply ties the cameo to his review desk and a later distribution payoff.

### 8. GET IT HEARD — `get-it-heard`

**Image/action:** Mac visibly heads into Broadcast Slum. Low three-quarter composition;
one foot crosses the threshold, torso moving forward, one open hand drives the barrier aside,
and the other arm is ready for the fight. The street is the destination, not a conquered boss arena.
Preserve his ginger beard, two side braids, MODEM cap, face markings and burgundy/red costume.

- **6 BIT / COMMS:** "Cache got it here. Mac, get it heard."
- **MAC MODEM:** "Open the channel."

6 Bit's sendoff is retained from the old fourth scene. Mac's reply and the v2 hero illustration are owner-approved.
The image is a distinct physical commitment pose, not a copy of 6 Bit's posture with a different head.
The private `index.html?preview=mac-firstslice` entry uses this transition; the parent task is expanding its short encounter into the city chapter. The published ending/results and campaign entry are separate. The story reader awards no Drums, lore or full campaign clear.

## Cache Back's penultimate hero scene and preserved finale

The owner supersedes the cockpit-final proposal with a new hero panel: Cache walks toward the current yellow car with his keys, looking ready for the mission. Use his supplied model and established dress, with a distinct confident walking pose. The v6 whole-pose candidate is installed for private art review; rejected v3/v4/v5 and cockpit candidates remain preserved.

Keep eight panels: revise zero-based page 6, retaining the legacy `ignition` identity for resume compatibility, to display **KEYS TO THE LINE** and Cache walking toward the car. Its planned lines are:

- **MAC MODEM / COMMS:** "Route is yours. Keep the original moving."
- **CACHE BACK:** "Keys. Original. Let's go."

The `cache-line` identity remains the final page at zero-based index 7, with its existing rear-car illustration and dialogue:

- **6 BIT / COMMS:** "We're on the line."
- **CACHE BACK:** "Then let's make some noise."

Retain `assets/cache-bridge/bridge-08-cache-line.webp` byte-for-byte as the final car shot. Preserve the yellow body, reels, trim, central emblem, road direction and established curb geometry in the new approach image.
The old ignition illustration remains preserved as an unused original after selection of the new approach candidate. Replace that beat rather than inserting an approach after Cache is already inside. Remove the page-6 ignition sound; any engine ignition belongs at the final car cue, if needed. The original cassette and keys remain with Cache before he reaches the car.
Keep the keys in a physically plausible hand, track the original cassette's custody, and show movement toward the same car rather than an invented replacement vehicle. Compare this approach, Mac's barrier-opening stride and 6 Bit's existing finale; honor portrait crops and dialogue-safe space.

## Scene, character, setting and prop consistency checklist

- Check each character against supplied identity references: face, build, markings, cap/insignia, beard/braids, glasses/mask, collar and costume stay consistent across camera changes. Mac uses the approved v2 model; Kave's final likeness remains open.
- Keep the yellow car's front/rear orientation, door and driver side, wheels, reels, emblem and street direction consistent. Never mirror an illustration simply to solve a composition.
- Track the original cassette, cleaned copy, keys, radio, cables and gate connector from one panel to the next. Record who holds each prop and where it rests; props cannot teleport between hands, vehicle, studio and receiver.
- Maintain scene geography: Cache at the receiver, DJ/studio crew connected over comms, Mac at street access and Kave inside his enclosed broadcast studio. The endpoint conversation places Mac in that studio only after the city route is earned. A cut or inset must explain a new viewpoint without moving a remote speaker into the scene.
- Kave's room has continuous solid walls/ceiling, a normal closed full-height door and small closed glass window; the seated human, desk, chair, monitors and mic remain proportionate. Keep ordinary perspective and physical support/contact for every prop.
- Match practical lights, screen glow, time of day, shadows and camera eyelines. New angles must preserve character scale, physical anatomy, equipment contacts and the direction of travel.
- Review every panel beside its predecessor and successor, including portrait crops. Confirm that added labels are authored overlays and that loading, ignition, approach and departure follow a deliberate timeline.

## Level 3: story woven through play

Only Mac is playable in this solo chapter; the other three original crew members remain connected support voices.
The accepted genre is the redesigned street brawler, not the rejected run-and-gun technical preview.
The owner now requires at least six city zones and six new alien humanoid enemy types plus a distinct boss.
The section titles below are production proposals; the parent runtime/art task owns the final route, enemy designs and animation implementation.

| Section | Playable action | Story evidence and consequence |
| --- | --- | --- |
| Access frontage | Mac breaks the first enforcement formation and physically opens the approach. | Cache's delivery is valid; local enforcement is preventing it from being heard. |
| Relay market | Work through varied street groups and access countermeasures between fights. | Obtain the enforcement order; optionally inspect service/testimony details without requiring a cameo task. |
| Distribution lanes | Break a new alien enforcement group controlling the local route. | The hold is distributed across the city; two early fights do not reopen the entire feed. |
| Transfer yard | Reach and preserve the relay equipment after a distinct enemy encounter. | Maintain the original recording and compare the operational hold with local monitoring. |
| Enforcement checkpoint | Clear a later formation and dismantle its route control. | Establish physical access to the final outbound blockade without guest approval or credentials. |
| Outbound blockade | Fight the distinct alien humanoid boss and release the last city hold. | Only this earned endpoint permits Mac's in-person return to the enclosed Kave studio. |

Use new enemy silhouettes and alien anatomy, not recycled ordinary human guards or community cameos as enemies. At least six types plus the boss need authored movement/attack/hit/death animations and readable attack tells. Their blood is green or purple; Kave and the community remain support characters. The asset agent supplies new enemy art; none of these production requirements is proof that the art or encounters are complete.
After the city endpoint, Kave's studio conversation confirms that the outbound play reaches listeners. The eventual earned distribution log must show Partition 09 and the damaged arena destination in a linear inspection; it does not introduce another question menu.

Drums follows the actual authored Level 3 clear under the campaign owner, never reading a panel or picking an answer.
No art card, prototype enemy or visible log alone can stand in for completion of the new stage.

## Cameos with setup, return and payoff

The included names and exclusions follow the active cameo inventory, not historical aliases.
Supporting characters get individual scene purposes, references and credits before visible portrayal.

| Presence | Level 3 placement | Level 5 return / Level 6 payoff |
| --- | --- | --- |
| Kave | Enclosed broadcast-studio bridge cameo; outbound-feed restoration and optional in-person conversation only after the earned six-zone/boss city endpoint. | Artist/reviewer community presence in the recovered competition; queue and feed testimony can corroborate the distribution hold. |
| Dr3wBaby | Optional service/workshop callback to Cache's route, using an authored repair item or delivery-case marker. | Recovery/venue role; later service records can corroborate the authentic recording's physical journey. |
| WittyF0x | Optional quiet routing observation after a fight; no timed call or route dependency. | A specific competition discrepancy; present testimony compared with other records rather than accepted alone. |
| Cliff | Reuse a maintenance note/marked device where useful, without forcing another identifiable portrait. | His established maintenance detail becomes independently checkable in the control-system investigation. |
| Studio Cat | Steal a loose physical UNVERIFIED paper tag from a crate. Mac: "Fastest appeal I've seen." | A different physical gag later; all Studio Rats appearances are cats, never rodents. |
| SKELLA | No forced Level 3 appearance; preserve the planned Level 4 visual sample-bank/chorus setup. | Individual Level 5 return. Any audible contribution requires an actual supplied/appropriate asset. |
| LostMarbles, Mr. Nice Guy, Shadowspit, Hellcat | Do not crowd all four into this transition merely to list the roster. | Individual trainer, resident, guide or support roles in Level 5; specific later testimony only where authored. |

The full active community roster belongs in individually planned Level 5 appearances.
This table develops a connected subset; it does not erase other retained, unexcluded collaborators.
Excluded Mind Fanatic, Emerald, Crowline, W3T TDDY, Brownout, real-name substitutions and separate Bini egg stay excluded.
Guests are not villains, kill targets, humiliating jokes, Corporate Satan captives or collectible creatures.
Sheila remains silhouette-only; her use of the four as mindless husks is not a friendly trainer choice.

Current authored district IDs are `service-alley`, `night-market`, `transit-concourse`, `relay-canal`, `rooftop-relay` and `broadcast-plaza`: **12 waves, 29 alien foes plus a distinct final boss**. Seven new enemy kinds have dedicated art/animation registrations; backgrounds and Mac attack art are assembled separately. These are private chapter implementation targets, not completed owner playtest or a canonical Drums award.

## Dialogue agency that earns its space

There are **two optional choices total**: Kave's main opening `delivery-question` and `desk-question` inside his studio after the full city endpoint is earned. The 9 Bit moment has no extra reply menu.
Offer **"Ask about the people"** versus **"Ask about the order"**:
one reveals local impact, the other provides extra enforcement testimony; both preserve the common objective.
Mac's responses should show his concern or practical focus, not a cosmetic yes/no prompt with identical replies.
Explicit Continue bypasses the optional question and shows the same local-monitoring/outbound-feed confirmation, without inventing a selection.
The common final line is **MAC MODEM:** "The street hold's broken. Keep both records safe."
The story reader exposes `entryRequirement: city-chapter-endpoint`; the parent gameplay owner must gate its creation. Reading or skipping it cannot satisfy that requirement.
The log presents both mandatory findings linearly; there is no second inspection choice or option to delete evidence.
Do not force a menu mid-combat, add a moral score, or turn guest approval into an access gate.
Later consequential campaign choices remain open for separate authored review; these local choices do not settle them.

## 9 Bit: deliberate intrusion and a larger story arc

| Moment | Proposed occurrence | Setup or later payoff |
| --- | --- | --- |
| Bridge Scene 5 | Hand crosses the panel, adds Mac's nonessential caption and addresses the player. | Moves beyond the opening's optional loose caption without pretending to damage the real browser. |
| Bridge Scene 6 | Crew separates the interruption from both recordings. | Establishes how they evaluate his claims; the joke has a story consequence. |
| Level 3 log | Briefly peel an extra label off the already earned log. "Read what survived. Not what I tell you." | Mac earns the evidence himself; 9 Bit supplies no hidden initiator or unearned key. |
| Level 4 | Recurring unwanted label folds over DJ's damaged index. | DJ isolates the two traces and confirms the separation; 9 Bit's image is not proof of an author. |
| Level 5 | A small early trainer-card prank; stop joking during the four's loss of agency. | The tonal change matters. Who witnessed or altered the event remains disputed. |
| Level 6/7 | Familiar frame-peel gesture becomes legible alongside independently checked records. | His claims, concrete harms and eventual motive are tested; exact confrontation and resolution stay open. |

Keep authored occurrences sparse and state-specific, with a static reduced-effects alternative.
No fake crash, OS/account access, corrupted-save scare, hidden binding change or suppressed real danger cue. Intro Scene 5 retains the player address without demanding a reply.
Any future saved-title dodge follows the active one-dodge input contract; it is not implemented by this document.

## Mandatory understanding and optional records

The direct route must explain authentic delivery, the distribution hold, its community impact,
Mac's physical enforcement breach, Partition 09 and the damaged record's arena destination.
Partition 09 first becomes earned evidence inside Level 3, not an unexplained bridge revelation.
The five stable Level 3 record IDs deepen facts already understandable without collecting them:

| Stable record | Proposed writing purpose |
| --- | --- |
| `lore.l03.01` | Community effect: Kave's full review queue, blocked outbound feed and artists waiting to reach listeners. |
| `lore.l03.02` | Enforcement order: distinguish an operational hold from its unknown ultimate author. |
| `lore.l03.03` | Partition 09 header: preserve what the recovered field actually says. |
| `lore.l03.04` | Mac/crew debate: delivery, being heard, and judging a 9 Bit claim against evidence. |
| `lore.l03.05` | Damaged arena index: DJ's next task is isolation and recovery, not deleting a trace. |

The 28-record counts remain `3 / 4 / 5 / 4 / 5 / 4 / 3`; choices do not award lore automatically.
Do not identify the simulation architect or separation initiator, resolve the familiar pursuer cadence,
declare Sheila created 9 Bit, decide 9 Bit's ultimate plan, or invent an ending/module threshold.
Level 5 remains a forgotten competition involving Sheila and Corporate Satan, not a tournament the crew freely joins.
Level 6 independently verifies disputed memory; the final resolution remains an authored future decision.

## Dialogue UI, skip, replay and save compatibility

Use the existing scene/input/frame/audio owners; this guide adds no runtime owner or control loop.
Keep advance, pause and skip available with keyboard, controller and touch; no auto-advance deadline on choices.
On mobile show two large, readable choice buttons in the dialogue area, at least 44 CSS pixels high,
with stable positions, clear focus and safe-area margins. Both options stay visible without opening More.
Consume the selecting press before advancing the reply; held steering/confirm cannot choose on scene entry.
Choices must not overlap faces, replace combat controls during action, or depend on hover.
Static/reduced-effects presentation conveys the same interruption and dialogue.

Skipping a choice or entire scene must reconverge without requiring a saved answer or any new story gate.
The existing earned chapter facts authorize progression; viewing scenes never awards keys or completion.
Transcripts include the question, both option labels, selected reply and common dialogue.
A future replay archive permits rewatching and trying the other response without changing earned progress.
Only optional cosmetic seen/choice facts may remember presentation; existing completed saves stay completed.

For future integration, introduce stable scene and cue IDs rather than interpreting new order as old page numbers.
Migrate legacy ending version-1 pages explicitly: `0 → delivered`, `1 → unverified`, `2 → held`, `3 → street-access`.
Map title/line cues by meaning: the old fourth-scene Mac line remains in `street-access`;
its old 6 Bit second line moves to `get-it-heard`. Do not resume that cue as Kave's new line.
Preserve completed `done` state and all delivery/key/clear facts; no forced re-clear or replay of unchosen branches.
The eight-panel Cache bridge keeps page 6's `ignition` compatibility identity while changing its display title, illustration and authored Cache line. The `cache-line` bridge ID, page index 7, existing final image and final cues remain stable; no final-page renumbering is needed.
Current optional choice IDs are `delivery-question` and `desk-question`. Only `frame-reply` is retired presentation state; missing fields never force a new answer or retroactive scene. Continue preserves the common route without recording an invented choice.
Validate migration/resume, explicit skip, both replies and replay separately when implementation begins.

## Production handoff

Use the linked asset manifest to verify available model references before requesting specific missing photos.
[KAVE_REFERENCE_RESEARCH.md](KAVE_REFERENCE_RESEARCH.md) records his verified public account chain,
inspected public images and artist/music-review basis: [official reference hub](https://linktr.ee/kavemanbrown),
[own YouTube channel](https://www.youtube.com/@KaveManBrown) and
[Kaveman Radio playlist](https://open.spotify.com/playlist/6fGMpNWTr1oGVt6DHh8viH).
The owner-requested clearer references are found: sharp 990-pixel Linktree selfie, current frontal TikTok and supplementary angles, exact own Instagram no-hat poster/clothing frame and a 1080-pixel duplicate-angle SoundCloud portrait. Ten unchanged reference files retain provenance; caps and duet/background people do not define the cameo.
The cowboy treatment and later v3 open-wall/scale are rejected. New enclosed studio v5 keeps no hat, cropped fade, full rounded beard, casual black hood-down top and geometric pendant; its face and room remain pending owner review. The first enclosed-room v4 is preserved as a framing pass. The fictional studio does not imply real venue ownership.
Mac and Cache use their established supplied models; obtain extra pose angles only if current references cannot support the shot.
Record each art card's scene/asset ID, source references, size, safe text space, crop, status and credit.
Keep new hero images as versioned siblings; preserve original illustration bytes until a reviewed integration selects replacements.
Compare Cache's new approach candidate and the approved Mac v2 with 6 Bit's existing image; review each full transition as a sequence.
Script review, reference collection, image generation, runtime integration and publication are distinct production states.
The rejected v1 concepts and v2 prompts/reference orders/hashes remain in review-level3-story/generation-provenance.json. Mac v2 is approved artwork; Cache cockpit v2 and rejected walking candidates remain historical. Cache v6 and enclosed Kave studio v5 remain unaccepted art candidates. Exact studio v4/v5 prompts, sources and hashes are in review-mac-street-art/studio-correction-provenance.json. The private reader implements the restored Kave opening choice and earned studio choice; expanded gameplay, owner playtest, full campaign integration and publication remain separate states.
