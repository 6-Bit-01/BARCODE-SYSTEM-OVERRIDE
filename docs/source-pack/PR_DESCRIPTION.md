# Solid awnings, rideable elevator roof and enemy pancakes

Awnings currently allow upward passage, the cabin roof can be entered from the sides, and the elevator cannot flatten enemies beneath it. This implements the owner's combined collision and smush request.

- Bonk against visible awning/roof/step undersides with responsive, harmless feedback.
- Block all sides of the elevator roof; carry the player, enemies, drone and boss while they stand/walk on it.
- Route boss movement around the hard roof and preserve safe rooftop exits/checkpoint pursuit.
- Visibly pancake enemies beneath the descending floor, preserving single defeat/score/repair credit.
- Move the existing Tower middle step outward so the solid-underside upper route remains reachable.

Validation: full `npm test`, all-JavaScript syntax gate, production collision/crush cases at 30/60/120 Hz, and native scene/sprite review. See `SOLID_LEDGES_SMUSH_PASS.md` and `review-solid-ledges/solid-ledges-smush.mp4`. Exact results/revision are recorded in the generated source-pack receipt. Owner Makko acceptance is pending; keep this combined PR as a draft.
