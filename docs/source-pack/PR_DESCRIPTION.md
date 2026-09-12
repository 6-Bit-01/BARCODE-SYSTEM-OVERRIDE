# Rewrite the actual opening and fix keyboard/controller intro skipping

PR #39 added a scene after the tutorial but left the repeatedly requested opening untouched. It also broke hold-S skipping: every controller poll cancelled the shared hold whenever B was not down.

This correction replaces the real opening with eight comic pages following the merged five-beat campaign map. The original four make a broadcast, discover that the Network's report conflicts with what they heard, respond in distinct ways, and choose to restore Dead Air District. One displaced recovery caption follows 6 Bit's refusal to wait and seeds the existing run-only results callback. The misplaced post-tutorial crew link is removed; tutorial completion starts the mission directly.

S and B now own independent five-second holds. Release/disconnect cancels only the corresponding source; blur/hidden tabs cancel unattended holds. CutsceneSystem retains the presentation/input/loading lifetime and existing four-second music fade, with repeat guards and cancellation that cannot revive a stopped startup. Missing images do not block reading or skipping. All eight captions are reachable; the unrelated signal-integrity RAF and orphan old subtitle are gone.

Base/rollback: merged #39, `510342ed21692fd85f9b99ef6b29990a5694132d`. Existing art is reused with selected monitor crops; no new runtime art URL, dependency, soundtrack, 9 Bit disclosure or cameo introduction. Prior controls, HUD, rhythm combat, camera, calibration, lore, mission/lift/Jammer/boss behavior remain. The owner's requested HUD/rhythm/attack-variety work follows this intro correction.

The complete script and full-page/contact/skip/reduced-effects views are in INTRO_OVERHAUL.md. Validation uses the production opening, frontend input and lifecycle owners with explicit browser/image/clock/audio fixtures; native Canvas renders check actual drawing/text bounds. The generated receipt identifies the exact full-suite/syntax results and exported head.

Makko acceptance remains pending: read/advance all pages; hold S with/without a controller; test B, release and overlapping holds; inspect page 6; check fullscreen layout, the audible fade, one tutorial/mission entry and the existing Level 1 smoke route. This prepares a review and does not merge or deploy it.
