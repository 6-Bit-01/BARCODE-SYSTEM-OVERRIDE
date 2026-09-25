# Cache Road staggered roadside flow

The owner reviewed merged #127 and asked for less paired scheduling,
inconsistent intervals/setbacks, vivid first appearance, proportionate
overscanned city paintings, sidewalks and exterior ground panels. This pass
uses independent seeded left/right addresses with occasional pairs and no
site alpha fade. Three new transparent city paintings keep uniform source
aspect and share the bounded road bearing. Four editable surface tiles
project under the locations and continue through the open stretches.

Inspect `CACHE_ROAD_ROADSIDE_FLOW_PASS.md`, four review frames and the
first/third-lap continuous draws. The production draw/asset checks, full
repository suite and syntax gate passed locally; the hosted browser check
is the remaining CI gate because local Chromium is unavailable. Owner
Makko appearance, audio, controller feel and performance acceptance remain
open. Gameplay/music/saves are unchanged and the adrenaline/power-up list
remains in `CACHE_ROAD_COHESION_AUDIT.md`.

# Historical: Cache Road roadside camera overhaul

Updated after owner review of draft #127: the previously horizontal clip
made distant building bottoms appear over disconnected terrain. The current
revision masks buildings, parcels, open lot and low filler behind a curved
roadside crest; roofs and trees emerge first and the full scene clears as it
passes outward. Each seeded site now has its own lateral setback, with its
ground stretched to remain attached and the sidewalk left open. Review the
four-stage sequence and third-lap frames in
`CACHE_ROAD_ROADSIDE_CAMERA_OVERHAUL.md`.

The owner rejected merged #126 after showing the actual game frame: parking
cars looked stranded off the road, the park and distant roofs sat awkwardly
against the visible horizon, the city layers scrolled independently, and
sites swelled too quickly. This correction removes decorative parked cars,
uses the road's depth directly for whole-site scale, reveals them through the
city-bottom crest, renders the complete oblique park with its gate roadward,
and pans all three city layers from one bounded camera bearing. The
underlying site list, exterior sidewalk, road, lights, lane traffic, music,
controls and saves remain as before.

Inspect `CACHE_ROAD_ROADSIDE_CAMERA_OVERHAUL.md` and its staged frames, then
watch the continuous drive at normal size. Focused production geometry and
full repository checks belong to the exact revision receipt. Scripted draws
are not Makko play, audio/controller judgment or owner acceptance. The
adrenaline and defensive/offensive/traffic/environment/song/lane power-up
plan remains in `CACHE_ROAD_COHESION_AUDIT.md`.

# Historical: Cache Road horizon emergence and projected locales

After merged #125, the owner found repeated/overlapping places, a parking
ground slab rising above the horizon, orientation problems and mismatched
generated cars. This pass uses one seeded site row and a projected horizon
lip: roofs appear first, full sites clear it as they approach, then grow and
pass beyond the sidewalk. Parking and park ground follow the road bend;
parking cars reuse actual game art, while park foliage comes from the existing
painting. The generated candidates are discarded. Road gameplay and music
remain unchanged.

Review `CACHE_ROAD_HORIZON_LOCALES.md` and the top acceptance route. Production
draw assertions, full repository checks, staged native frames across two
laps, and a 32-second continuous render passed locally. Makko visual/audio/
controller judgment remains pending.

# Historical: Cache Road exterior lot placement and facing

Merged #124 established larger individual places on a curved road. This
follow-up positions both place rows and their small landscape filler outside
the outer sidewalk edge, puts parcel foundations beyond the walkway and
mirrors the existing painted fronts toward traffic. The streetlights keep
their size. No new art or music files are needed.

Review the opening market and house, later garage and open lots, bends and
near edge passage in `CACHE_ROAD_SETBACK_FACING.md` and `ACCEPTANCE.md`.
The production draw test checks the rendered sidewalk clearance and facing;
native scenes and a continuous drive are visual previews, not Makko owner
acceptance. Preserve music, controls, traffic, pads, song bars, HUD and saves.

# Historical: Level 1 completion shortcut and Level 3 DEV menu

The owner needs a quick route to the provisional Level 3 combat preview and a development menu there. This draft builds on merged #89, `c0d061407378831ae90fcac49985a29c3c5ea037`; the Cache Line remains Level 2 in story order.

- The Level 1 DEV panel adds **Complete Level 1** for an immediate saved Cache Back handoff and Voice unlock. An artificial clear awards no bonus and does not enter best results or difficulty challenges.
- The session-only, canvas-native `DEV 3` panel offers relay checkpoint jumps, node/relay bypass, health refill, scatter, defender clear, preview reset and **Complete Preview**. A proof clear saves `proof-clear` but grants no Drums key, Level 3 completion or later story scene.
- Unlock with Shift+F1 or the lower-left launcher in each level. Console commands after unlock: `DEBUG.level1.completeLevel()` and `DEBUG.level3.completeProof()`. The existing input, frame, pause, save and audio owners remain in charge.

See `BROADCAST_SLUM_PROOF.md`, the top of `ACCEPTANCE.md` and seven `review-broadcast-slum/` captures. `npm test`, `npm run check:syntax:all` and `git diff --check` passed locally. The generated source receipt identifies the committed head. Hosted Makko input/audio/feel review remains for the owner; keep this draft unmerged until acceptance.
