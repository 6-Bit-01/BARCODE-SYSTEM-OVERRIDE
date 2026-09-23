# The Cache Line — visibility and pace pass

September 23, 2026. Base/rollback: merged PR #94 at `0852ff0bf23d5ae52816f59f7131db93c0741777`. The owner played the chase slice and found it slow and hard to parse with rectangular stand-in art. This pass makes that same encounter easier to judge. It does not settle final vehicle/city art, the soundtrack or the complete chapter.

## Changes to judge

- Auto acceleration now reaches a 54-unit cruise from a 44-unit start; brake targets 23, turbo 75, and lateral steering is 2.5 bands per second before curve push. Cruise is roughly one fifth quicker than the previous 44-unit target. The HUD's derived speed rises from about 229 to 281 km/h at cruise. Checkpoint distances, warning distances and Echo duration are unchanged, so warnings occupy less real time; the first high-speed playtest must judge whether that remains fair. Time refills and nearby retry remain.
- The projected road has four colored signal surfaces, a stronger shoulder, frequent studs and roadside posts, and restrained speed streaks that disappear under Reduced Motion. Section palettes distinguish Rainline, Service Loop, Mirror Viaduct and Causeway without pretending to be authored environment art.
- Cache has a cassette-reel rear silhouette; its Buffer Echo is a translucent replay of the same shape. Freight, vans, sweepers, audit traffic, roadblocks and the wider Clean Copy have separate silhouettes, lights and warnings. Passed hazards stop drawing beneath the player. Sweeper merge arrows and audit target marks sit on the projected road. The far-right exit carries an on-road label; the Echo instruction remains a separate cue.
- The HUD makes speed, window, integrity, Echo/lock charge, turbo and live/locked music bands readable at a glance. The save format remains v2; its allowed speed range covers the new turbo cap while v1 and older v2 checkpoints still restore.

## Preserved boundary and evidence

The five aligned temporary 120 BPM sources, music transport, single input/frame/audio owner, pause lifecycle, Level 1 Voice/return, separate Level 3 architecture test and no Bass/Level 2 completion/result/lore are unchanged. Four native Canvas captures in `review-cache-line/` show representative states, and the production harness includes observed one-second cruise/turbo distance. Native stills do not prove motion, host timing, physical controls, sound or fun. Use the newest `ACCEPTANCE.md` route in Makko and compare actual handling against merged #94. If the warning window is too short at the faster pace, tune it from that feedback before expanding the stage.

Full authored road and vehicle art, composed music, direct-path scenes and developed Clean Copy phases remain future production work. The working creative direction is still `CACHE_LINE_BLUEPRINT.md`.
