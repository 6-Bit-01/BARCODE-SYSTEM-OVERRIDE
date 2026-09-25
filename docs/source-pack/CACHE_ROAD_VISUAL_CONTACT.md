# Cache Road visual contact — September 25, 2026

Base: merged #117, `8923d3eea3fc5fe8cd8944ef50f3578ccaf0d785`.
The owner wants visual work before the next mechanics tune. This pass handles
the first two items in `CACHE_ROAD_COHESION_AUDIT.md`.

| Scene | Correction | Production check |
| --- | --- | --- |
| Blacktop | Source rows remain adjacent from far to near, but the source offset now decreases as road progress rises. The existing wrap blend stays. | A fixed output band reads an earlier source row ten road units later; native video shows surface detail approaching the driver. |
| Flying traffic | `ship-1` is painted nose-right, `ship-3` nose-left; flip now depends on atlas and travel. Reduced Motion holds travel, bob, bank and frame. | Five rendered ships face their actual direction; focused draw assertions cover direction and still frames. |
| Painted traffic | Rear tire masks and shadows use contact positions measured separately from each recovered art pose, since the bumper/exhaust often hangs below the wheels. The chassis still has its independent sway, freight travel and collision recoil. Tread, spray and turning rim now follow the corrected wheel bounds. | Six scripted production scenes and Cache/freight motion crops were viewed. [Enlarged before/after contact draw](review-cache-road-visual/Contact-Before-After.webp) uses identical production state. |

After #118 merged, its automated review found that the raised outer front
tire in each turn pose had been given a rear-tire shadow height. The follow-up
uses opaque painted bounds at the selected mask locations: `cacheCarRight`
left outer tire ends about `.31h` above the anchor while its right rear ends
about `.125h`; `cacheCarLeft` uses `.17h` left rear and `.275h` right outer.
The upper mask follows each raised outer wheel as well. The straight and
freight positions were already aligned. Focused assertions now cover both
turn poses, and the [turn contact comparison](review-cache-road-visual/Turn-Contact-Before-After.webp)
uses the same scripted Turbo state before and after the follow-up.

The renderer is `node tools/render-cache-road-mirror.cjs <output-folder>`;
`python3 tools/build-cache-road-motion-previews.py <output-folder>` builds
the moving crops. These are native production `draw()` calls with scripted
state, not controller play, browser audio or Makko footage. The existing
focused proof tests blacktop sample motion, each ship's facing, shadow
positions and Reduced Motion; full repository gates are recorded with the PR.

An exploratory use of the Level 1 storefront strip on the viaduct side deck
looked like a floating isolated cutout at road scale and was removed before
this review. The subsequent `CACHE_ROAD_VISUAL_WORLD.md` pass supplies
connected diagonal locations over a continuous side street and painted
frontage, plus illustrated traffic. The adrenaline playtest and power-up
implementation remain on the audit list.
The five owner MP3s, sparse pads, four face actions, two bumpers, lane names,
traffic behavior, save format, final Echo exit and no-award boundary are
unchanged. Owner visual and listening acceptance requires a merged Makko run.
