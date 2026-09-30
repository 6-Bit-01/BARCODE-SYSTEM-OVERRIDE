# Cache Road — digital dashboard and source-facing correction

September 29, 2026 (owner timezone). Base: merged PR #152,
`37717ca56188dbc708596a6d4cbb8e0aa320f27b`.
The owner requested a custom 1980s digital-dashboard HUD with MPH, gear and
useful visual information, using fewer words. The same request identifies a
building design from a screenshot that must appear on the left only.

## Instruments show the live game

The dashboard combines a painted instrument bezel with crisp static SVG
digit and icon atlases. The bezel contains no baked game values: the renderer
fills the instruments from the current state. Phosphor digits, warning lights
and segmented meters carry information that previously relied on more text.
Ordinary Canvas fallbacks keep the same readings usable while art loads.

| Instrument | Actual source |
| --- | --- |
| MPH | `round(speed * 5.2 / 1.609344)` |
| Current/queued gear | Committed gear and pending buffered shift |
| Remaining time | Current run timer |
| Integrity | Remaining three-point integrity state |
| Score/multiplier | Current earned score and multiplier |
| Action and button | Announced action plus the current mapped input |
| ONE/approach | Existing target/current lane and countdown; ONE is the hot cue |
| Turbo | Charge/draft, ready, queued or active state |
| Echo | Available charge or active remaining duration |
| Brace/Push lamps | Actual armed defensive/action state |
| Lane expiry/NEXT | Four lane glyphs with live retained bars and queued entries |

The MPH conversion preserves the old speed calibration and changes only
the displayed unit. It does not change movement, gearing or rewards. No
invented RPM, fuel, temperature or other unmodeled telemetry is added.
Button labels must follow keyboard/controller mapping rather than assume a
specific pad. Current gear and a queued request remain visually distinct.
The remaining timer uses ceiling seconds in MM:SS and turns red below eight
seconds. Three integrity lamps show real health. The right instrument keeps
the existing action sprite and catch burst; center lane glyphs keep their
matching identities. Short contextual guidance remains where symbols alone
would be ambiguous, including `ECHO LEFT | ORIGINAL RIGHT` at the final exit.
An active lane with a queued refresh retains both its expiry reading and the
small amber NEXT indicator, rather than replacing one with the other.

## Preserve the approved road and rearview

The dashboard replaces the instruments within the existing top 164-pixel
band of the 1920×1080 source canvas. Its redesigned panels stay in that band,
preserving the road aperture below it and the existing mirror face/crop,
glass and exact `blur(2.3px)` reflection. Keep the
rear-tire timing line, beat-ONE targets, verified 128 BPM / 4/4 transport,
buffered gears, lamps, living sidelines and chip SFX behavior.

The screenshot identifies `cachePlaceSubstation`, the long fenced source at
`assets/cache-road/roadside/places/substation.webp`, shown on the right at
address 2939. The source was already documented as LEFT. An explicit
`PLACE_BANK_RULES` contract now permits it only on the left, unmirrored.
Right-side sites at 2939, 3913 and 12944 use the existing approved
`capacitorExchange` variant instead, preserving the original 680-unit-wide
footprint reservation. The nearby residential row keeps its correct bank.

This is a source-facing correction, separate from the prior clearance pass.
The serialized landscape and satellite layout are unchanged: 139 modular
cards, all 48 core art keys, 25 street sockets and 17 satellites remain.
The owner's latest facing direction takes precedence over an inventory
count if a source is wrongly tagged; no key-count exception is needed here.
The earlier clearance rules remain in force for legal placements.

## Delivery and review contract

New dashboard source/runtime artwork lives in
`assets/cache-road/hud/digital-dashboard/`; the glyph/icon atlases are static
artwork sampled by live state, not new animation sets. A reproducible asset
builder retains their definitions. The immutable art revision is
`dd1b3e9adc174da39e4b228c45079526c9c6a36a`. `cacheDashBezel`, `cacheDashDigits`
and `cacheDashIcons` each register one static frame. The digit atlas has
12×3 cells at 64×112; the icon atlas has 8×3 cells at 64×64. Both offer mint,
amber and red. The original ImageGen bezel remains unmodified; runtime crop,
alpha bounds and exact source provenance are in that folder's
`ASSET_PROVENANCE.md`. The real-browser delivery gate covers 51 assets:
48 animated/stateful sheets plus these three static HUD entries. It requires
published-versus-bundled byte parity and the production remote loader with
fallback disabled. Normal runtime still retains its bounded local fallback.

Focused checks must cover truthful speed/gear/time/resource readings, mapped
buttons, urgency/expiry states, containment in the top band, unchanged road
aperture/mirror and the identified building's bank restriction. Full regression, all-file
syntax and Chromium rendering/audio remain merge gates. The PR and generated
source-pack receipt record the tested revision and actual outcomes.
The existing road proof and focused dashboard checker pass 38 production
draws, including queued G1, active-plus-queued lane refresh and final-exit
guidance. Seven native scenarios form the visual review. In the cruise frame,
the alphabetic HUD word count falls from 36 to 16 (56% fewer); this is a
count for that frame, not a claim about every state or player readability.
All-file syntax and targeted production checks pass. Full regression and
final-head Chromium/CI remain merge gates, with their exact results recorded
in the PR and generated source-pack receipt. Focused checks do not establish
Makko acceptance.

`tools/check-cache-road-bank-art.cjs` passes 12 actual main/rear observations
across the three retained left sources and three right replacements. The
clearance check still passes its 10 seeded routes and 1,162 audited cards;
default counts and the complete serialized landscape/satellites are unchanged.

Current review media is under `review-cache-digital-dashboard/`:

- `Dashboard-Drive.webp`, `Dashboard-States.webp` and
  `Dashboard-Before-After.webp` show the new instruments in context.
- `Dashboard-Review.json` records the visual scenarios and measurements.
- `Left-Only-Substation-Before-After.webp` shows the source-bank correction.
- `Bank-Art-Review.json` records source identification, hashes and bank
  verification from native Canvas draws, not a browser or Makko capture.
- `Drive-Review.mp4` and `Drive-Review.json` provide the moving review and
  its exact capture scope.

The pack retains the current drive and stills, the approved
layered-city baseline and #151's `Chip-SFX-Audition.mp3`. The retained audition
is historical audio evidence; this HUD pass does not claim a new soundtrack
or new SFX. The drive metadata identifies whether it is scripted visual
inspection or an input-driven run; focused dashboard counts do not imply a
new gameplay-score or audio-validation result.

Owner Makko readability, display size/controller feel and device performance
remain the final playtest. Automated state checks and footage establish
implementation behavior, not subjective acceptance.
