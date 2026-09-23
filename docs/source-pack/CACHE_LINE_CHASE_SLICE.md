# The Cache Line — chase slice review

September 23, 2026. This follow-up on the draft Level 2 proof implements the working direction in `CACHE_LINE_BLUEPRINT.md`. It is still a **technical and feel review**, not the authored Level 2 or a campaign completion. The first `CACHE_ROAD_MUSIC_PROOF.md` remains as history.

## Changed play

- Steering moves continuously across four musical bands; the car accelerates on release of Down/S and brakes while held. Curves push a fast car outward. Speed affects time to checkpoints. Turbo gives a short acceleration, while drafting freight and two clean passes restore it. Collisions cost speed, time and one of three integrity points.
- Traffic includes freight to draft, roadblocks, vans, a visible merging sweeper and a targeting audit car. A target is committed in advance. Near misses and correctly held fast corners recharge the music lock and Echo meter.
- Three paid locks plus the current band can play all four aligned parts. Lock charge starts ready for one capture and must be earned for later parts. The final stretch no longer forces an all-four mix; the song still uses one uninterrupted transport, with mix gain changes on beats. A denser mix recovers more time at checkpoints and produces more frequent rival commitments.
- H / mapped Interact (default Y) sends a Buffer Echo that replays recently recorded steering from the present position. The Clean Copy rival takes a warned line and can retarget to the Echo once; Cache can steer away. The original exit requires a visible split from an active Echo while Cache takes the marked right route. A wrong attempt loops to a short approach with an explanation, time and a full Echo meter. The boss checkpoint and failure retry also refill Echo so the mechanic can be learned.
- The delivery card honestly says the original was delivered but marked unverified, and points to Mac's distribution blockade. No Bass, Level 2 result/lore or durable clear is awarded. The original Level 3 test is unaffected.
- Pause instructions now match the drive, and four native review frames under `review-cache-line/` show the approach, traffic, Echo split and proof result. These are procedural temporary visuals, not approved character, vehicle or cinematic assets.

## Save and audio boundaries

Level 2 proof checkpoints now write `proofVersion: 2`, including position, speed, timer and ability charge. Existing valid `proofVersion: 1` checkpoints still restore, with safe defaults for the new fields. Level 1 return/Voice and the independent old Level 3 checkpoint remain intact. The existing profile and all five temporary aligned 120 BPM WAVs are unchanged; this slice does not claim an authored soundtrack, mastered transition or acceptance on speakers. Pause, title Continue and exit use the existing owners.

## Validation and owner play route

The production-state harness checks continuous steering/brake and collision speed loss; paid three-lock/full-band mixing without an automatic finish mix; beat-aligned gain changes without source restart; expiry/retry; locked rival target, a decoy redirect and a divergent Echo gate; legacy v1/v2 save validation; Level 1 exit, pause and Level 3 separation; no Bass or Level 2 completion. Run `npm run check:cache-road-proof`, `npm run check:syntax:all`, `npm test`, and the native capture tool `node tools/render-cache-line-slice.cjs`. Exact exit results and draft revision belong to the review receipt or PR.

For Makko, reach Cache from the saved Level 1 handoff. In the first stretch, hold left/right through a curve, brake then accelerate, draft behind a freight vehicle and pass it, take a clean near miss and turbo. Lock one band, earn two more locks and drive through the fourth; hear the full arrangement without a music restart. Try different density and checkpoint time. Enter the Mirror Viaduct: watch the rival's marked line, dodge it, send an Echo and visibly split away. At the original exit, send Echo from a left band and steer to the far right. Fail the gate once and retry with the restored Echo. Lose and reload at a road marker; pause/exit/reopen and verify the Level 1 handoff and separate Level 3 test. Report whether the steering, warning time, car/road scale and audio *feel fun* on keyboard and physical controller.

The full chapter still needs authored multi-section road/branch art, real Cache vehicle animation, composed stems with a deliberate arrangement arc, comparative recording audio, cutscenes, optional cameos/lore and a developed rival race. One gate trick in procedural visuals must not be accepted as a finished boss. Hosted Makko, physical controls, audible mix and fun remain unverified until owner review.
