# Music, Art and Production

**Campaign art direction update (September 23):** `CAMPAIGN_REDESIGN.md` supersedes the old later-stage asset mapping below. After Cache's road proof, Mac's brawler needs close-range silhouettes/contact states; DJ's top-down arena needs readable multidirectional attacks/pickups; Level 5 needs a trainer-party/Gym visual proof and the four husk states; Level 6 needs first-person RPG investigation/crew interaction; Level 7 needs a DOOM-style all-four assault and authored 9 Bit finale. Do not order the old Contra full-stage or main Tetris/Dr. Mario puzzle assets. Level 1 artwork/song remain the live baseline; later songs and exact assets remain unproduced.

Current production sequence is in `ASSET_AND_PLATFORM_PLAN.md`: a representative story/panel sequence using current assets, followed by only the missing scene-specific art; no mass redraw or engine/mobile migration. The attached historical intro and Level 1 contact sheets were inspected for the September 12 continuation, without implying a fresh host availability audit.

## Independent songs

Each level owns an explicit song profile: source IDs, gains/roles, timing metadata or a deliberate no-grid choice, sections/cues, loop/end policy and any judgment rules. Unknown data stays unknown. Level 1's compatibility values are preserved for its current build; 146 BPM, 4/4, source names, judgment windows and 211-second restart must not become defaults for future songs.

Current runtime supports fixed-grid and no-grid transport. Tempo/meter maps and cue interpretation need actual implementation before use. The adaptive mixer still references Level 1 stem names; repair it to resolve profile-owned roles before the next song. Existing Level 1 stem-length differences need verified exports or explicit loop data during later audio polish.

Rhythm timing keeps running in the background when Level 1's R interface is locked/hidden/inactive. Normal game pause is distinct and freezes the appropriate lifecycle state. R remains actual combat mode; successful judgment is required for Down attack damage. Other levels choose section cues, adaptive arrangement, optional bonuses or no input judgment as appropriate.

The finale Full Mix is a separate compatible arrangement (or an approved premix with bounded alternatives). Its six symbolic keys do not authorize mixing unrelated level songs together. Confirm sample rate, decoded length, timing/loop alignment and loudness for finale layers.

Consider visual timing aids, calibration, reduced flashes/shake and shape-plus-color cues. Final assist behavior must preserve approved action rules and be deliberately designed, not silently change attack eligibility.

## Existing artwork

Reuse approved title/prologue, Level 1 skyline and street frontage, flying traffic, 6 Bit/enemy/boss animations, Jammer, fragments, particles and UI where fit. Current platform/foot geometry follows later repairs; historical v4 dimensions/contact sheets identify source assets but do not override current placement.

The visual language combines damaged public-access television, obsolete hardware, VHS, underground hip-hop and 16-bit grime. Improve silhouette/foreground contrast, platform edges and attack anticipation before adding more effects. Bound shake/flash/particles and preserve legibility in full combat.

Use the approved character export/reference directly. 6 Bit's cap, hair, glasses, eye/makeup design and white facial markings must remain consistent; never substitute a skull mask or combine him with DJ Floppydisc. Sheila stays a silhouette when shown. Intro images remain the live baseline while the newly approved story/intro prototype explores selective changes; exact replacement scenes/art require concrete review.

Historical references included here carry their original audit dates. The exact snapshot's sprite/audio manifests are implementation authority. No new remote availability or dimensions audit is implied by copying an old contact sheet.

## Responsibilities and asset cycle

Makko handles the owner's sprite-animation/export and visual testing workflow. Codex implements mechanics, procedural geometry/UI, manifests, integration and tests. Image creation tools can support new bitmap props, textures, portraits and concept sheets when actually needed. Do not assume Makko already supplies road rendering, raycasting, a campaign/save system or the RPG loop.

Prototype first; then request an asset with a stable ID, dimensions, on-screen size, anchor/contact line, animation names/frame needs, palette, transparent bounds, purpose and a reference. Keep exports and provenance. Integrate one bounded group and verify it in the duplicate Makko project before large production expansion.

| Stage | Initial asset approach |
|---|---|
| Level 1 | Reuse current boss/art; code-native telegraphs; request only missing readable action/contact states |
| Racing | Rear-view vehicle states, small traffic set, road/horizon/sign kit after renderer proof |
| Mac beat 'em up | Readable contact/throw/counter silhouettes and a small opponent set after close-range control proof |
| DJ top-down arena | Code-native arena and shape-plus-color threats first; prove multidirectional aim, pickup readability and DJ reaction states |
| Sheila trainer chapter | Four crew party/husk states and a small Sample set; prove one settlement, other trainer encounters and Corporate Satan Gym loop |
| First-person RPG | Four crew interaction states, investigation space and readable dialogue/evidence UI after navigation/party proof |
| DOOM finale | Reuse proven first-person technology, extend core assault threats and team roles, then produce approved 9 Bit/ending assets |

Do not place a large art order based on old speculative counts. Confirm the playable camera/scale/interaction and request the smallest set that makes the next milestone reviewable.
