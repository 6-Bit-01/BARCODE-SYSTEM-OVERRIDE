# Broadcast Slum: story, scenes and production guide

October 5, 2026. **Documentation and proposed writing only.**
The four-scene Level 2 ending and eight-scene Level 1-to-2 bridge remain unchanged in runtime.
The first two hero concepts were rejected by the owner: Cache's cockpit geometry was impossible and Mac used the wrong character model. Corrected v2 concepts are available and require new owner art review. Dialogue choices, cameos, 9 Bit intrusions and Level 3 gameplay remain proposed and are not installed.
The shipped Level 2 clear, Bass key and saves retain their existing behavior.

## Direction and authority

The owner asks us to plan the wider story while building Level 3: purposeful cameos,
dialogue choices, fourth-wall breaks, 9 Bit hacks, references and assets identified in advance.
The Level 2-to-3 cutscene must contain **at least seven scenes**; this proposal uses eight.
The final scene before each of the two requested solo chapters must show its hero heading into action:
Cache Back for Level 2 and Mac Modem for Level 3, with poses distinct from 6 Bit's finale.
These are owner requirements. The exact eight scenes, dialogue, choices and placements below are new proposals.

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
Its last page, `cache-line`, shows the car from behind rather than a visible Cache hero pose.
Retain this bridge's story and final dialogue; propose a targeted final-image replacement.

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
The exact writing below is proposed except where explicitly marked as retained dialogue.

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

**Image/action:** Kave works at a Kaveman Radio music-review desk in the venue neighborhood.
The submission queue is full; local monitoring works while the outbound feed is held.
This adapts his public artist/reviewer role into fiction, without asserting real venue ownership.
Kave is artist/reviewer support, never an enforcement enemy or required access credential.

- **KAVE:** "The review queue's full. Nothing's reaching the listeners."
- **CACHE BACK / COMMS:** "It got here whole. Somebody's keeping it here."

**Choice `delivery-question`:** the player selects Cache's follow-up.

- **"Who's waiting?"** → **KAVE:** "Artists waiting for a play. Listeners waiting for a voice."
- **"What got blocked?"** → **KAVE:** "The outbound feed. Local monitoring works; distribution doesn't."

**Common reconvergence — MAC MODEM / COMMS:** "Then we open it back up, piece by piece."
Both answers express Cache's priorities; neither withholds the route or changes the chapter's result.

### 4. THE HOLD IS LOCAL — `held`

**Image/action:** DJ and Mac's established studio comparison, Cache linked from the receiver.
Reuse `assets/cache-ending/ending-03-held.webp`; a readable routing overlay locates the street hold.
Any added receiver/relay/gate labels are authored display evidence, separate from image pixels.

- **DJ FLOPPYDISC / COMMS:** "The original arrived. The distribution hold is still there."
- **CACHE BACK / COMMS:** "Then being delivered isn't enough. They're stopping it here."

Both lines are retained. The next step is distribution enforcement, not identifying its ultimate author.

### 5. A NOTE IN THE MARGIN — `margin-note`

**Image/action:** Mac's ordinary caption receives a hand-pasted comic annotation:
`AUTHORISED PUNCHING CONSULTANT`. A hand crosses the illustrated border, then withdraws.
This is a visible presentation prank; real speaker labels, controls, scores and saves remain accurate.

- **MAC MODEM:** "Who edited my subtitle?"
- **9 BIT:** "You. Outside the panel. Still think 'delivered' means 'heard'?"

9 Bit addresses the player. His known identity is not treated as a new secret reveal.
**Choice `frame-reply`:** the player may answer him directly.

- **"I'm listening."** → **9 BIT:** "Then listen to what isn't there."
- **"Let the crew work."** → **9 BIT:** "Fair. They know the streets. You know the frame."

Both answers return to Scene 6. No trust meter, punitive branch or new completion requirement is proposed.

### 6. KEEP THE RECORD STRAIGHT — `record-straight`

**Image/action:** Cache's preserved cassette and DJ's comparison lanes share a composition.
Original, cleaned copy and present interruption are visibly separated; 9 Bit does not overwrite the tape.
This can use current model/reference elements, but needs a deliberate new storytelling image.

- **CACHE BACK / COMMS:** "That wasn't on the tape."
- **DJ FLOPPYDISC:** "Then keep it separate. Record the interruption. Don't call it proof."

The crew recognizes a performed intrusion without accepting every claim made by its speaker.
The original recording remains original; there is no new memory or separation verdict here.

### 7. STREET ACCESS — `street-access`

**Image/action:** Retain `assets/cache-ending/ending-04-street-access.webp`:
Mac reaches the street-access gate and finds his opening. Kave remains an offscreen comms voice.
Do not turn this retained setup into a new montage, move the crew to the venue, or grant access via a guest.

- **MAC MODEM / COMMS:** "The hold points to street enforcement. I'll find a way through."
- **KAVE / COMMS:** "I'll keep the queue moving and the local line open."

Mac's line is retained. Kave's proposed reply ties the cameo to his review desk and a later distribution payoff.

### 8. GET IT HEARD — `get-it-heard`

**Image/action:** Mac visibly heads into Broadcast Slum. Low three-quarter composition;
one foot crosses the threshold, torso moving forward, one open hand drives the barrier aside,
and the other arm is ready for the fight. The street is the destination, not a conquered boss arena.
Preserve his ginger beard, two side braids, MODEM cap, face markings and burgundy/red costume.

- **6 BIT / COMMS:** "Cache got it here. Mac, get it heard."
- **MAC MODEM:** "Open the channel."

6 Bit's sendoff is retained from the old fourth scene. Mac's reply is proposed.
The image is a distinct physical commitment pose, not a copy of 6 Bit's posture with a different head.
This guide does not create a working Level 3 entry: the existing finish/results behavior remains until integration.

## Cache Back's separate final hero scene

Target only the final Level 1-to-2 page, keeping `cache-line` identity and its dialogue:

- **6 BIT / COMMS:** "We're on the line."
- **CACHE BACK:** "Then let's make some noise."

Replace the proposed rear-car-only composition with an interior view from the empty front passenger seat toward Cache in the left driver seat and the forward windshield.
Cache is unmistakably visible: shoulders leaning forward, one hand on the wheel,
the other finishing a radio press; the original cassette is secured in the dashboard.
The yellow car's headlights and open road pull the composition toward the mission.
He stays seated after Scene 7's ignition; do not make him get out and enter the car again.
His concentrated driver pose differs from Mac's forward barrier-opening stride and 6 Bit's existing finale.
Compare all three finals together before accepting artwork; honor portrait crops and dialogue-safe space.

## Level 3: story woven through play

Only Mac is playable in this solo chapter; the other three original crew members remain connected support voices.
The accepted genre is the redesigned street brawler, not the rejected run-and-gun technical preview.
The encounters, section titles and exact dialogue below are proposals for a new design.

| Section | Playable action | Story evidence and consequence |
| --- | --- | --- |
| Access frontage | Mac breaks the first enforcement formation and physically opens the approach. | Cache's delivery is valid; local enforcement is preventing it from being heard. |
| Venue neighborhood / review desk | Mac protects the distribution equipment and restores the desk's outbound feed. | Submissions finally reach listeners; this normal authored route gate follows Mac's physical work, not Kave's approval or a guest credential. |
| Relay market | Work through varied street groups and access countermeasures between fights. | Obtain the enforcement order; optionally inspect service/testimony details without requiring a cameo task. |
| Distribution checkpoint | Defeat an original fictional enforcement encounter and dismantle its control apparatus. | The street channel opens. Boss identity, moves and phases need their own authored gameplay design. |
| Distribution log | Mac opens and preserves the actual recovered log. | Partition 09 and a damaged separation record routed to an arena feed lead to DJ's Level 4. |

Drums follows the actual authored Level 3 clear under the campaign owner, never reading a panel or picking an answer.
No art card, prototype enemy or visible log alone can stand in for completion of the new stage.

## Cameos with setup, return and payoff

The included names and exclusions follow the active cameo inventory, not historical aliases.
Supporting characters get individual scene purposes, references and credits before visible portrayal.

| Presence | Level 3 placement | Level 5 return / Level 6 payoff |
| --- | --- | --- |
| Kave | Bridge music-review/radio desk; outbound-feed restoration and safe post-fight conversation. | Artist/reviewer community presence in the recovered competition; queue and feed testimony can corroborate the distribution hold. |
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

## Dialogue agency that earns its space

The two bridge choices change what the player asks and how characters respond, then reconverge.
During Level 3, put conversations in safe areas after the fight, with explicit conversation entry/exit.
At Kave's review desk, propose **"Ask about the people"** versus **"Ask about the order"**:
one reveals local impact, the other provides extra enforcement testimony; both preserve the common objective.
Mac's responses should show his concern or practical focus, not a cosmetic yes/no prompt with identical replies.
At the log, propose **"Compare the original"** versus **"Trace the arena route"** as inspection order,
then show both mandatory findings before the handoff. Neither route chooses to delete evidence.
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
No fake crash, OS/account access, corrupted-save scare, hidden binding change or suppressed real danger cue.
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
The `cache-line` bridge ID and existing final cues remain stable despite a proposed replacement image.
New optional choice IDs are `delivery-question` and `frame-reply`; missing old-save fields mean no answer yet.
Validate migration/resume, explicit skip, both replies and replay separately when implementation begins.

## Production handoff

Use the linked asset manifest to verify available model references before requesting specific missing photos.
[KAVE_REFERENCE_RESEARCH.md](KAVE_REFERENCE_RESEARCH.md) records his verified public account chain,
inspected public images and artist/music-review basis: [official reference hub](https://linktr.ee/kavemanbrown),
[own YouTube channel](https://www.youtube.com/@KaveManBrown) and
[Kaveman Radio playlist](https://open.spotify.com/playlist/6fGMpNWTr1oGVt6DHh8viH).
The inspected wide-brim performance look is a proposal, not a locked model or costume.
Select his look and a detailed frontal/three-quarter reference before producing likeness art;
the fictional review desk, submission queue and neighborhood setting do not imply real venue ownership.
Mac and Cache use their established supplied models; obtain extra pose angles only if current references cannot support the shot.
Record each art card's scene/asset ID, source references, size, safe text space, crop, status and credit.
Keep new hero images as versioned siblings; preserve original illustration bytes until a reviewed integration selects replacements.
Compare the two proposed hero finales with 6 Bit's existing image and review all eight scenes as one sequence.
Script review, reference collection, image generation, runtime integration and publication are distinct production states.
The rejected first hero concepts and their full prompts/reference hashes remain documented in review-level3-story/generation-provenance.json; they are not selected runtime art. Mac's correction uses his actual supplied models; Cache's correction resolves the shot from inside the cabin. Both v2 replacements are generated, with exact prompts, reference order and file hashes recorded; they await new owner art review. The eight-scene script, choices and Level 3 remain a production draft.
