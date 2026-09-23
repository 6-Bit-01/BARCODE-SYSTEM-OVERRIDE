# Broadcast Slum architecture proof — transmitter encounter, September 23, 2026

Base/rollback: merged PR #90, `568c646a3f67cf4ebca4faebd81752534c67ee6f`. Review branch: `agent/broadcast-slum-boss-pass`. The owner's second playtest found the working preview far too easy and visually basic. This pass tests whether Level 1's shared input, RAF, audio, pause, save, and return architecture can support a more demanding run-and-gun encounter. It is **one contained architecture preview**, not a finished Level 3 or a substitute for The Cache Line, which remains Level 2 in story order.

## Current encounter and story boundary

- Camera framing now gives 6 Bit, rooftops, threats, and the transmitter room to read. The route still has two node/relay checkpoints, but adds two shield units whose front armor rejects shots except during their marked charge, and two hovering interceptors that require elevation and fire warned angled shots. Gunners, patrols and flanking runners retain their separate behaviors. Relay counter surges still pressure both street and roof positions. Holding fire and jumping remain immediate; temporary scatter chips are optional help.
- After both relays, the final transmitter locks the uplink. Entering its arena restores four signal units and writes `proof-boss`. Its upper power feed is reachable from the rooftop or a jump, and its lower feed from street level. The armored core opens for a bounded counterfire window when both feeds fall and after each boss attack. At half core health the attack cycle speeds up and a marked interceptor can join. The boss telegraphs a two-lane sweep, an aimed fan and a fixed-position vertical column; each has a movement answer. The uplink stays shut until the transmitter is disabled, then the player must reach it to end the preview.
- Signage connects Cache Back's preserved payload to the distribution blockade and the reconstruction route. The win card labels **PARTITION 09 / damaged separation index** as a working story beat. This is a glimpse of the campaign plan, not a durable lore unlock or a final scene. It does not claim the initiator of the separation, recruit Kave as an enemy, or resolve 9 Bit. No Drums key, Level 3 completion, score, or later story result is awarded.
- Saves use preview version 2 with a boss-entry checkpoint. Existing version-1 relay and clear saves still load; an earlier `proof-clear` explicitly says it predates the transmitter and offers replay. Death at the boss restarts the boss attempt rather than the whole route. Pause, Exit, title Continue and Level 1 audio/Voice return remain owned by their existing systems.

## Current development controls

From Cache Back, enter the preview and press Shift+F1 or click DEV 3. **Go Transmitter** or `DEBUG.level3.gotoBoss()` opens a fresh arena checkpoint. **Complete Preview** or `DEBUG.level3.completeProof()` explicitly skips the encounter to `proof-clear`; it also marks the boss defeated inside the provisional save, with no campaign award. Go Relay 1/2, Break Current Node, Disable Current Relay, Refill Signal, Give Scatter, Clear Defenders and Reset Preview remain available. These controls are session-only. Level 1's DEV completion command still creates its actual Cache Back handoff and earned Voice.

## Verification and owner playtest

`npm test`, `npm run check:syntax:all`, and eleven native Canvas captures in `review-broadcast-slum/` cover the shared adapter, five defense behaviors, directional armor, boss weak points, shutter timing, three warned attacks, phase shift, boss reload, old-save migration, no campaign awards and Level 1 audio return. Native rendering verifies code paths and presentation layout; hosted Makko feel, actual audio and physical-controller behavior still need the owner to play the exact draft head.

In a duplicate Makko preview, use DEV 3 to reach the transmitter and play it without Complete Preview. Break the high feed from the roof, low feed from the street, then counterfire after its attacks. Try each warning by dodging and by deliberately staying in the marked danger. Restart once at `proof-boss`, pause during a warning, exit and resume to verify Level 1 audio/Voice. Then test the shield and airborne enemy on the preceding route. Report where the challenge still feels trivial, unfair or too visually plain; that review informs the later authored level and art pass. The preview remains unmerged until that owner acceptance.

---

## Earlier proof and debug history

The current debug addition builds on merged PR #89 at `c0d061407378831ae90fcac49985a29c3c5ea037`; branch `agent/level3-debug-menu`. The combat encounter below came from that merged PR. The new controls are described under Development controls.

Base/rollback: merged PR #88, `b32a67831acc296c1cb1887ad579bbc04ac44cb1`. Branch: `agent/broadcast-slum-combat-pass`. The owner's first playtest found the prototype functional but too easy and basic. This pass adds a small combat sequence within the existing, clearly labeled Level 3 development preview. The Cache Line remains Level 2 in story order. The preview remains reachable from the saved Cache Back handoff; it awards no Drums key, Level 3 completion or later story result.

## Encounter

- Both blocking relays start shielded. A visible link leads to a roof node on a reachable one-way platform. Street fire sparks on the shield; break the node from the roof, then shoot the relay core. The second node and core take more hits.
- Three elevated gunners lead aimed, warned fire. A street patrol shoots and two faster runners close on the player; these replace the six identical defenders. Relay damage at a fixed threshold triggers a short warned counter surge: the core shields, a two-lane volley launches, and one runner telegraphs behind the player. If the player holds a roof position, a marked shot targets that height as well, making a jump or drop useful. The core reopens after the surge. Normal music-phrase volleys remain warned and jumpable.
- Each roof has a temporary scatter pickup. The existing hold-to-fire control shoots a three-way fan for 11.5 seconds; movement and fire remain immediate. Hit sparks, muzzle flash, shield links, spawn markers and objective text make the new states legible. Geometry and art are still code-native development placeholders.
- Relay clears remain the two durable objective checkpoints. Death/reload reconstructs defenders, nodes and pickups for the next objective; an already cleared relay and its node stay off. Existing version-1 preview saves still restore. Exit returns to the preserved Level 1 intermission and its audio profile. Voice and all Level 1 facts survive.

## Development controls

Start Level 1, click its lower-left **DEV** button or press Shift+F1 (Ctrl+Shift+D and backquote also toggle the panel), then choose **Complete Level 1**. The console equivalent after unlocking is `DEBUG.level1.completeLevel()`. This uses the campaign's actual Level 1 completion/handoff save, so Cache Back opens and Voice/Level 1 completion are present. The shortcut adds no artificial clear bonus, best result or difficulty challenge record. It changes the save, so use a duplicate preview if you want an untouched playthrough.

Enter Broadcast Slum from Cache Back, then click **DEV 3** or press Shift+F1. The Level 3 panel offers Go Relay 1/2, Break Current Node, Disable Current Relay, Refill Signal, Give Scatter, Clear Defenders, Complete Preview and Reset Preview. Console equivalents include `DEBUG.level3.gotoRelay(2)`, `DEBUG.level3.clearRelay()`, `DEBUG.level3.refill()` and `DEBUG.level3.completeProof()`. Jump/reset and relay disable overwrite the preview checkpoint; a node break alone is transient until its relay is cleared. **Complete Preview** writes `proof-clear` and shows the existing replay/return card. It does not set a Level 3 campaign result or award Drums. The panels unlock separately per page session and use the game canvas inside the embed/fullscreen; pause owns input while open.

## Music and boundaries

The preview retains the first proof's two locally generated, independent four-bar 108 BPM temporary WAV stems and its MusicTransport phrase grid. The audio-fallback notice and bounded timer still cover degraded hosts. These are technical placeholders rather than an approved later-level song. The protected Level 1 sources, 146 BPM judgment, synchronized restart methods and gameplay are unchanged. Existing action input, single RAF, audio, pause and save owners remain in charge.

## Verification and hosted review

`npm test` exercises the production adapter: actual routed move/jump/fire, a reachable roof and scatter fan, a street-level shield rejection, node/core destruction, counter shielding/volley/runner warning and marked roof shot with a drop response, differentiated gunner and runner behavior, phrase warning and full-speed jump dodge, checkpoint reload and old-save inference, campaign facts, preview-to-Level-1 audio lifecycle, actual Level 1 debug handoff/reward boundaries and Level 3 menu/checkpoint/clear actions. `npm run check:syntax:all` parses all JavaScript. Seven native production-draw captures in `review-broadcast-slum/` show approach, roof node, phrase warning, counter surge, clear, pause and the DEV menu. These checks establish implementation behavior, not hosted Makko feel, audio loading or physical-controller input.

In a duplicate Makko preview, start from Cache Back and traverse both node/relay pairs; try the scatter fan from the roof. Walk into the first shield and confirm the visual hint; climb and break its node. At the counter threshold, jump or drop below the marked roof shot, dodge the street lanes if below, and watch the runner behind. Compare the two relay encounters, enemy aim and pacing: report whether the route now requires useful movement without feeling unfair. Pause during a warning, reload from relay one, Exit preview and listen for one Level 1 music return. Confirm Voice remains, Drums/Level 3 completion remain absent. Record imported SHA, keyboard/controller, PASS/FAIL and a short warning/reload clip. This owner review gates merge.

Next: use this tested genre proof to guide authored art, deeper combat pacing and the actual Level 2 road/story route. Later songs and the remaining genres remain on the campaign plan.
