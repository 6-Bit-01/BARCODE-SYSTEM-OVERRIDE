# Broadcast Slum combat follow-up — September 23, 2026

Base/rollback: merged PR #88, `b32a67831acc296c1cb1887ad579bbc04ac44cb1`. Branch: `agent/broadcast-slum-combat-pass`. The owner's first playtest found the prototype functional but too easy and basic. This pass adds a small combat sequence within the existing, clearly labeled Level 3 development preview. The Cache Line remains Level 2 in story order. The preview remains reachable from the saved Cache Back handoff; it awards no Drums key, Level 3 completion or later story result.

## Encounter

- Both blocking relays start shielded. A visible link leads to a roof node on a reachable one-way platform. Street fire sparks on the shield; break the node from the roof, then shoot the relay core. The second node and core take more hits.
- Three elevated gunners lead aimed, warned fire. A street patrol shoots and two faster runners close on the player; these replace the six identical defenders. Relay damage at a fixed threshold triggers a short warned counter surge: the core shields, a two-lane volley launches, and one runner telegraphs behind the player. If the player holds a roof position, a marked shot targets that height as well, making a jump or drop useful. The core reopens after the surge. Normal music-phrase volleys remain warned and jumpable.
- Each roof has a temporary scatter pickup. The existing hold-to-fire control shoots a three-way fan for 11.5 seconds; movement and fire remain immediate. Hit sparks, muzzle flash, shield links, spawn markers and objective text make the new states legible. Geometry and art are still code-native development placeholders.
- Relay clears remain the two durable objective checkpoints. Death/reload reconstructs defenders, nodes and pickups for the next objective; an already cleared relay and its node stay off. Existing version-1 preview saves still restore. Exit returns to the preserved Level 1 intermission and its audio profile. Voice and all Level 1 facts survive.

## Music and boundaries

The preview retains the first proof's two locally generated, independent four-bar 108 BPM temporary WAV stems and its MusicTransport phrase grid. The audio-fallback notice and bounded timer still cover degraded hosts. These are technical placeholders rather than an approved later-level song. The protected Level 1 sources, 146 BPM judgment, synchronized restart methods and gameplay are unchanged. Existing action input, single RAF, audio, pause and save owners remain in charge.

## Verification and hosted review

`npm test` exercises the production adapter: actual routed move/jump/fire, a reachable roof and scatter fan, a street-level shield rejection, node/core destruction, counter shielding/volley/runner warning and marked roof shot with a drop response, differentiated gunner and runner behavior, phrase warning and full-speed jump dodge, checkpoint reload and old-save inference, campaign facts, and preview-to-Level-1 audio lifecycle. `npm run check:syntax:all` parses all JavaScript. Six native production-draw captures in `review-broadcast-slum/` show approach, roof node, phrase warning, counter surge, clear and pause. These checks establish implementation behavior, not hosted Makko feel, audio loading or physical-controller input.

In a duplicate Makko preview, start from Cache Back and traverse both node/relay pairs; try the scatter fan from the roof. Walk into the first shield and confirm the visual hint; climb and break its node. At the counter threshold, jump or drop below the marked roof shot, dodge the street lanes if below, and watch the runner behind. Compare the two relay encounters, enemy aim and pacing: report whether the route now requires useful movement without feeling unfair. Pause during a warning, reload from relay one, Exit preview and listen for one Level 1 music return. Confirm Voice remains, Drums/Level 3 completion remain absent. Record imported SHA, keyboard/controller, PASS/FAIL and a short warning/reload clip. This owner review gates merge.

Next: use this tested genre proof to guide authored art, deeper combat pacing and the actual Level 2 road/story route. Later songs and the remaining genres remain on the campaign plan.
