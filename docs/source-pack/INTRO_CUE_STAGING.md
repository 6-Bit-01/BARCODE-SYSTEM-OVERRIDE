# Opening cue staging and screen integration

The owner confirms the #42 images appear and requests correct timing for each speech bubble/caption, Space advancing one cue, system text on the illustrated screens, and anatomically correct DJ Floppydisc hands. Base/rollback is merged #42, `f1831f95c187bdd5afd9c8231d2a7a10ac262671`. Branch `agent/intro-cue-staging` combines these changes in one draft. The generated source manifest identifies the final review head/PR; Makko acceptance remains pending.

## Reading order

Seconds below are active reading time after the scene's art is ready. Each title/art appears at 0. Earlier cues stay visible. Manual advancement reveals the next cue immediately and restarts its reading interval. The final cue holds indefinitely until the player advances to the next scene.

| Page | Automatic reveal order |
|---|---|
| 1 — Leave the room noise in | ON AIR at 0.85s; DJ at 2.35s; 6 Bit at 6.65s |
| 2 — Keep the take | Mac at 0.85s; LIVE at 5.55s; Cache at 6.85s |
| 3 — Then the return goes quiet | NO BROADCAST DETECTED at 1.10s; DJ at 3.20s; 6 Bit at 6.60s |
| 4 — Save the part it wants gone | Recovery request at 0.90s; Cache at 3.30s; Mac at 7.60s |
| 5 — Listen under the static | CREW CHANNEL / STILL OPEN at 1.00s; DJ at 2.80s; 6 Bit at 7.50s |
| 6 — 6 Bit has other plans | Automatic-recovery screen at 0.90s; 6 Bit at 3.10s; displaced caption at 7.70s; Mac at 9.10s |
| 7 — Start with this district | Blocked uplink caption at 1.40s; Mac at 3.10s; 6 Bit at 7.80s |
| 8 — Dead Air District | Cache at 1.00s; 6 Bit at 5.40s; local-signal objective caption at 8.90s |

Space, Enter, click and controller A reveal one cue. A fresh press after the last cue turns the page. Key repeat and held controller A cannot consume later cues. S and controller B retain independent continuous five-second whole-intro skips. Loading, hidden tabs, blur and an active skip hold pause the reading clock; resuming does not catch up or rush unread lines. The existing poll owns all timing and teardown. No new per-cue timers, event owners or contexts are created. The accessible transcript exposes only revealed dialogue/readouts.

## Screen placement and art

The readouts on pages 1/2/3/5/6 are drawn within authored monitor-glass quadrilaterals in the original 1862×845 image coordinates. Text follows the screen's angle, clips at the glass and uses restrained phosphor/scanline treatment. The full image retains its aspect ratio, so the same transform stays aligned through window/fullscreen resize. Small screens use shortened labels; the accessible transcript retains the full message. Pages 4/7/8 lack a useful display and place their captions in the lower page margin. Page 6's intentional fourth-wall caption appears only after the spoken refusal; its optional inspection remains run-only.

Only `intro-05-listen.webp` changes: a targeted built-in imagegen edit corrects the left hand turning the knob, with opposing thumb/index, three curled fingers and an aligned wrist. Preserve DJ's supplied model, other hand, equipment, two traces and full composition. The original and correction prompts/source hashes remain in `assets/intro/art-manifest.json`. The corrected WebP is 511,500 bytes, SHA-256 `f3d428cde3c2c77ae9911284ef69dd74daba50ec4603f7a5c31e62328f3b38ab`.

The immutable public asset checkpoint is `8180996dfc81630e0509a6ae3f0b0ec5db2934a6`, an ancestor of this same review branch. All eight URLs were requested and compared against bundled bytes, including HTTP status, WebP signature and permissive CORS; see `verification/intro-asset-delivery.json`. The seven other runtime images are byte-identical to #42. The hosted pin intentionally changes so Makko receives the corrected hand.

## Verification and limits

`tools/check-intro.js` exercises the production cue clock, timing boundaries, one-cue input, manual deadline reset, repeat prevention, blur/visibility/loading pauses, caption availability, fullscreen ownership, context budget and cleanup. Normal and skipped openings still reach the actual tutorial and one mission. `tools/check-intro-browser.cjs` runs native Chromium with the production DOM/CSS and owners, trusted Space/click/Enter input, automatic first readout, staged screenshots, fullscreen/resize/retry and tutorial handoff. It retains explicit initializer/gameplay-loop/audio boundaries and does not certify Makko sprites or audible audio.

`tools/render-intro.cjs` renders all final pages and staged sheets for pages 3/5/6 through the production renderer with decoded local art, checking dialogue text and page bounds. These committed images are native Canvas diagnostics. The full suite and all-file syntax are required; exact outcomes and tested SHA belong to the generated receipt and CI, not an assumed future result. The current ACCEPTANCE route covers the owner's actual Makko reading/visual/control test before merge.

No gameplay, tutorial script, music, save/canon or playable-cast changes. HUD/rhythm presentation and attack variety follow intro acceptance; campaign services remain later work.
