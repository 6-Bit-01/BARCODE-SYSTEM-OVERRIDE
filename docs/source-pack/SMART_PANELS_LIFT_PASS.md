# Smart panels and elevator front rails

Base/rollback: merged #77, `78f67f4750a2d12f8a2063c895d06d5b9952d700`. Review branch: `agent/tutorial-play-space`. Exact published head, PR and verification outcomes are recorded in the generated source receipt.

## Changes

The screenshot's 1120-wide bottom Stomp card hid the street when the camera followed a jump. Practice now uses one 564 × 158 card below the top HUD, relocating if an actor occupies it. Actual movement, airborne play or Rhythm Combat suspends the large story panel. Hidden dialogue cannot type, consume Continue or spend the closing hold/fade time; reading resumes when play settles. Task credit, twenty original bubbles and the sole progression owner remain. Calm tutorial dialogue also relocates if its reading area is occupied. Lore uses a smaller 900-wide panel, and both lore and inspection relocate or wait during action without spending hidden reading time. Mission objectives, lift/wave/collection prompts and combat feedback avoid actors; secondary prompts give reading panels priority. Brief Hack Ready and Rhythm Mode notices hide if their fixed area is occupied.

The hack panel was hard-coded at x=1110 regardless of its target. A shared presentation helper projects actor bounds through the renderer's captured camera/zoom/shake matrix. It chooses a clear bounded location below health/score/lore, prioritizing the locked target and player while also protecting other enemies and the boss, and retains that location while clear. It tries the full terminal before 88% and 76% layouts. If side panels cannot clear every actor, it uses a short 1040 × 360 six-column keypad, with the same digits, Erase, Submit and Cancel. Controller navigation follows the visible row shape. If every readable layout is occupied, the panel waits with its scan/deadline and numeric input frozen; Escape remains available, and the world continues. Normal puzzle budgets are unchanged. Drawn keys and pointer Cancel use the same translated/scaled coordinates; physical mappings and puzzle time are unchanged. The result briefly retains its target reference for placement, then existing result cleanup releases it.

The illustrated lift has front posts and a front lip. Its existing 619 × 640 image now uses complementary even-odd clipping paths for rear and front pixels. The original roof and deck surfaces remain behind passengers; front posts, crossbar, lip and powered details draw afterward. Below-floor actors draw before both cabin layers; roof riders stay above the roof's top plane. Actors still draw once and rendering never assigns support. No image bytes, collider, dimensions, clock or gameplay tuning changed.

## Evidence

- `check-tutorial-flow.js`: real keyboard/PlayStation/Xbox flow at 30/60/120 Hz, hidden typing/input/final timing, early credit and unchanged final handoff.
- `check-street-depth.js`: actual text bounds plus 24 camera/zoom/target-side cases; stable and moved layouts, actual drawn keypad rectangles versus pointer hits, Submit/Cancel, result clearance and reset.
- `check-level-01-impact.js`: retained lore/inspection reading time and hidden input during action; clear placement over a raised camera.
- `check-solid-ledges.js` and `check-level-finale.js`: actual lift movement/support, one actor draw, rear/passenger/front ordering, roof/underpass, drop/crush and power lifecycle.
- `review-smart-panels/`: sixteen native stills using production drawing and bundled artwork. They cover calm/hidden/resumed story, elevated and airborne Stomp practice, both hack-target sides, the result, ground/floor/roof/underpass rails, lore, inspection, hidden inspection and a crowded six-enemy hack. Generate with `SMART_PANEL_REVIEW=1 node tools/render-level1-rebuild.cjs docs/source-pack/review-smart-panels`.

Required complete suite, all-JavaScript syntax and CI status belong to the generated receipt. Native renders and simulated input checks are not owner Makko or physical-controller acceptance. No dependencies or new artwork were introduced. The next step is the focused route in ACCEPTANCE.md, then owner merge and export of the actual merged revision.
