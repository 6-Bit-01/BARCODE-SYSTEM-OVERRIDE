# Cache Road animation pass

The moving art keeps the approved road and city composition. These are transparent
painted frame sheets registered to the original art's alpha footprint and foot
contact. The static source WebPs remain alongside the new sheets for comparison.
The 23 sheets and seven companion painted cues/effects load first from the
published #142 merge `88623df039cad868a8c9565a23209a2f5b557c47`.
The shared loader falls back once to the matching bundled path. This fixes
the original relative-only requests, which could retry the same absent file
in a hosted import. The static source art remains bundled.

| Family | Sheets | Cels | What changes |
| --- | ---: | ---: | --- |
| Cache center, left, right, hit; freight, courier, rival, audit, sweeper, trike, shuttle | 11 | 8 each | Tape reels, scanner light, signal chase, brush, lamps, reflected glints, or impact sparks |
| Left and right lamp, left and right crossing signal, wayfinding, data kiosk, vendor cart, utility cabinet | 8 | 3 each | Practical light, display, cloth, or small indicator activity |
| Surge, Push, Brace, Refill | 4 | 8 each | Charge, impact, fragments, recovery |

## Playback and contact

- Car frames use the 4×2 atlas at a travel-dependent cadence. Hit plays once
  through its eight cels during the 650 ms collision recovery. The same car
  cel supplies both planted tire masks and the independently sprung body.
- Roadside fixtures use a 3×1 atlas at 310 ms per cel. World address offsets
  keep nearby objects out of sync. The rearview samples the same prop cel.
- Action symbols idle on quiet cels. The safe fourth-beat window uses a
  charged cel, and a successful catch plays the full eight-cel response in
  the HUD over the painted burst. The button and timing rules are unchanged.
- Reduced Motion selects cel zero for vehicles, fixtures, and action symbols.
- Existing nonluminous crates, racks, bins, benches, planter, barricade,
  and individual pedestrian cutouts retain their static paintings.

The sheets were made with built-in ImageGen from the existing transparent
paintings. Each prompt held the source silhouette and contact fixed while
specifying the appropriate light/cloth/brush/action motion; the output cels
were technically registered, packed to the source aspect and encoded as WebP.

## Review

- [Eight-second live draw](review-cache-animation/Animation-Drive.mp4) shows
  the road, roadside props, moving traffic, mirror and four scripted action
  responses at 12 fps. The scripted responses demonstrate art playback;
  they are not a recorded controller or audio judgment.
- [Vehicle frame board](review-cache-animation/Vehicle-Frames.webp) and
  [prop and action frame board](review-cache-animation/Props-and-Actions.webp)
  expose every cel at larger scale.

Regenerate a full-resolution animation draw with:

```bash
CACHE_REVIEW_ANIMATION=1 CACHE_REVIEW_CONTINUOUS=1 \
  CACHE_REVIEW_FPS=15 CACHE_REVIEW_SECONDS=8 \
  node tools/render-cache-road-mirror.cjs output/cache-animation
```

`node tools/check-presentation-assets.js` verifies local atlas paths and
source rectangles. `node tools/check-cache-road-proof.cjs` verifies painted
frame advancement, car mask consistency, action playback, world prop phases,
and Reduced Motion. Makko still needs the owner's moving-art, input, music
and device frame pacing review.
