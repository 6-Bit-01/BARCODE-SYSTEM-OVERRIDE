# Comic broadcast — first reviewable checkpoint

Base: merged PR #37, `38732933713c4f9ec22666e49b728a0626a85f25`.
Branch: `agent/level1-comic-broadcast`. Exact checkpoint and publication status are generated in SOURCE_MANIFEST.json.

## Owner direction and this piece

The owner requested stronger BARCODE identity, Comix Zone-like panel play, Metal Gear-like short crew calls, more community cameos and a possible later mobile adaptation. After correcting the cameo roster and asking about story/intro/art scope, the owner accepted the recommendation to storyboard the opening through the first restored block and build one representative comic/crew moment with existing assets: “Lets proceed.”

This checkpoint delivers that storyboard, a real first-gate-clear scene, a browser scene preview and an exact small art brief. It establishes a direction for the larger pass; it does not claim all six proposed improvements are finished. Keep one combined development branch and eventual draft rather than splitting each small effect into its own PR. Intro images/captions are unchanged in this first prototype; their recut below is ready for writing/visual review.

## Corrected cast decision

Remove Mind Fanatic / M1ND_FANATIC, Emerald / EMRLD, Crowline and W3T TDDY from the active game cameo plan, including the old guaranteed-ally requirement. Include Cliff, Sheila, Studio Rats, WittyF0x, Kave, SKELLA and Dr3wBaby. Latest owner spelling controls. Retain the other unremoved candidates: Chris / Mister N1CE, LoST M4RBLES, D34D1TE_ASH, OREAGANOMIX and H3LLCAT. Miss Bit and BNL-01 remain available supporting voices; only the original four are playable.

Cliff's maintenance mishaps, Sheila's practical management voice and silhouette-only appearance, and fleeting cat-like Studio Rat anomalies come from existing BARCODE character guidance. The four community names' proposed sign/channel/venue uses are creative pitches, not invented biographies. This checkpoint implements only the short Cliff/Sheila exchange; the other requested inclusions remain explicitly queued below.

## Opening storyboard — copy draft

The immediate goal is to restore a district's signal and open the route to its Jammer. Keep crew history and the simulation premise; develop the larger antagonist/creator questions through the later campaign. The collected lore already supports protected memories, unresolved opposing waveforms and environmental control. Preserve those record IDs and keep the secret collection-to-ending connection out of player instructions.

The current prologue has 11 image slots, nine unique images and 12 captions. Its final caption is unreachable; the tutorial already names 9 Bit. A future recut should use one scene record per image/caption group and deliberately decide the extra caption's purpose. No automatic new 9 Bit appearance is proposed.

| Beat | Existing image / treatment | Proposed copy / action | Purpose |
|---|---|---|---|
| 1. Last good signal | SO1 control room, close on working monitors; same archive frame used later for calls. | 6 Bit: “We had a show to finish.” | Begin with a shared purpose and people behind the equipment. |
| 2. Interruption | SO2 interference, then a brief SO5 signal tear. | Status: “BARCODE NETWORK — SIGNAL LOST.” | One clear disruption; avoid a long succession of generic warnings. |
| 3. Someone answers | SO3 6 Bit among monitors; then SO7 DJ Floppydisc transmission. | 6 Bit: “I've got sound. Who's still on?” DJ Floppydisc: “Carrier's there. Something's sitting on it.” | Give the lead agency and the crew distinct voices. |
| 4. A route and a reason | SO8 monitor cluster shown as one communication layout. Highlight/crop each speaker's existing screen instead of repeating the full image as three slides. | Mac Modem: “Signs, gates, speakers. Whole district's on mute.” Cache Back: “Our memories are still in there. Keep what you find.” Miss Bit: “Start with Dead Air. Open a route to the Jammer.” | Connect the crew, the three existing records and the playable mission without explaining optional ending rules. |
| 5. 6 Bit takes the frame | SO10 tower. A small caption sits across the route into the next scene. | Caption: “AWAIT FURTHER INSTRUCTIONS.” 6 Bit: “You just gave me some.” The caption slides out as the playable view takes over. | Establish one restrained fourth-wall beat and transition into the actual district. |

This is draft dialogue, not a claim that these lines are established wider BARCODE canon. SO4/SO6 remain usable inserts or archived alternatives. No asset deletion is needed. Preserve the image-advance/skip and music-start lifecycle when implementing the recut. Tutorial copy can then use the same voices while retaining exact H/R/Space teaching and objectives.

## Playable scene — Signal Alley caption repair

Trigger: the actual completion of encounter 1 opens its gate and calls `BroadcastComic.queueFirstBlock`. Clearing/restoring other zones, direct Jammer restoration, rendering or repeated callbacks cannot replay it. A full run reset permits one new showing.

After the existing clear cue, a small **ACCESS RESTRICTED** stamp remains over a communication panel:

1. **6 BIT:** “Cliff. I cleared the block. Why is the caption still here?”
2. **CLIFF:** “Hang on. It's on a separate circuit.”
3. The stamp detaches, taking the upper-right frame corner with it. **SHEILA:** “Cliff. The caption. Not the whole frame.”
4. **6 BIT:** “Leave it. I like the view.”

The resolved strip reads **SIGNAL ALLEY / OPEN**. The real gate has already opened; the comic does not delay it or change the world state. No new portrait, voice, player pose or remote asset is needed for this proof. Sheila is represented by text only.

The scene uses the existing update/draw loop, no extra timers/listeners/audio, and 12.55 seconds of safe reading time including its lead-in/out. Movement remains live. Rhythm Mode, hacking, tutorial, pickup/record notices, active or pending enemies, pause, death, cinematics and a player overlapping the panel hide it and stop its reading clock. It resumes at a safe interval. Reduced flashes removes the quick rotation/fragments; no full-screen flash or additional shake is added. Full restart and level teardown clear it.

`tools/preview-comic-broadcast.html` runs the same production scene module with explicit scene-state fixtures and the existing street art. It is a presentation preview, not a replacement engine or a live Makko playthrough. The native Canvas verification image checks the real draw method against the existing street art.

## Small art brief after this proof

| Asset | Exact first use | Proposed export | Needed to run this checkpoint? |
|---|---|---|---|
| Studio Rat sheet | One cat-like anomaly peeks from a service opening, then retreats. No elaborate mythology. | Transparent 64×64 cells; peek 4 frames and retreat 4 frames; ground anchor bottom center; green/purple reflected light only. First placement determines final on-screen scale. | No; needed for the later sighting. |
| Community sign/ident sheet | WittyF0x hidden-channel signature, Kave venue notice, SKELLA station/sample label, Dr3wBaby poster/decal. | Four separately exported transparent 256×128 graphics, designed to stay legible at about half size. Use available reference graphics before new likeness work. | No; next cameo checkpoint. |
| Cliff call portrait | Optional readable close-up if the text/monitor presentation needs a face. | One transparent 256×256 bust using an established Cliff reference; one pose initially. | No. |
| Sheila call treatment | Practical intercom presence. | Existing text/waveform; optional silhouette graphic only. | No. |
| Intro bridge / 6 Bit reaction | Only a shot the approved storyboard cannot express with existing images/action frames. | Determine dimensions/pose from that shot; preserve canonical face, cap, glasses and makeup. | No new panel demonstrated as necessary yet. |

These are production briefs, not newly generated art or a large asset order. Current city, traffic, enemies, boss, music and player sprite sets remain usable.

## Larger pass retained

1. Clearer HUD/camera and the three reproduced repairs: missing gamepad Rhythm Mode binding, committed Swooper crowd redirection, unavailable boss-stomp prompt.
2. Comic impact presentation.
3. Two or three authored fourth-wall moments; this checkpoint proves the first.
4. Short contextual crew transmissions and reviewed intro connection.
5. Interactive community details, the corrected full cameo list, a Studio Rat and one small secret.
6. Completion/archive access, optional cleared-district exploration and returning-player entry with complete controls.

Musical soundcheck/loop review, a new optional interaction and the bounded mobile proof remain follow-ons. Migration remains deferred. The first scene proof does not silently drop the remaining selection or claim a complete mobile version.

## Verification and handoff

`npm run check:level-01-broadcast-comic` checks the real progression clear path, duplicate events, elapsed timing at 30/60/120/144 FPS, UI/input/threat priority, player overlap, gameplay/music isolation, reset and draw purity. Existing complete tests plus all-file syntax remain required; the generated receipt records actual results.

Makko acceptance: clear Signal Alley, exit Rhythm Mode to read the call, watch the detached caption, then move toward the next encounter and verify the call yields immediately. Pause/resume mid-line, try reduced flashes, collect a nearby record, restart and confirm one scene per fresh run. Check the tone as well as legibility. This review checkpoint has no owner Makko acceptance yet. Rollback is the merged PR #37 base above.
