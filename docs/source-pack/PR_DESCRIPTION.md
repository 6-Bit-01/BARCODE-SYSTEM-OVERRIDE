# Finish the recovered model artwork and live HUD

PR #46 preserved five prepared sprite atlases but did not connect the replacement artwork or new HUD to the game. This continues the already-approved saved v5 implementation on merged #46.

- Install twelve complete recovered clips (547 drawings), calibrated feet and both new city layers through immutable asset URLs.
- Activate the illustrated health/sampler/combo/Amp/score/lore/boss HUD and matching effect destinations.
- Preserve fixed collision bodies, action timing, all existing mechanics, intro and #45 cat/FX/pointer/pulse work.
- Retain the original boss walk/flourish and traffic animations: their final new exports were not saved. Three Firewall flame poses still need continuity review. No artwork has been regenerated.

Validation: full npm test including the actual manifest/atlas/runtime integration check; all-JavaScript syntax; six production-world Canvas scenes using current sprites, scenery and HUD. Native diagnostics explicitly adapt Makko's sprite boundary and do not certify host playback, audible timing or feel.

Only production files are published. Raw model uploads and historical/rejected art remain in the saved source-pack recovery material. Base/rollback: f3bf9ed294a2bd69fe3a7dccc02a1c50b9241db2. Art pin: a4c1b7cf6fec0a083a4812ae1ea76edef45a5911.

One combined draft; owner Makko review in docs/source-pack/ACCEPTANCE.md is required before merge. CONTINUE_HERE.md records the exact continuation; Stage C follows acceptance of this art/HUD pass.
