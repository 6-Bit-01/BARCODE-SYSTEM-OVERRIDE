# The Cache Line — lane music and road proof

**Historical first proof.** Its two-lock lane runner and far-right-only gate were replaced by the chase slice in `CACHE_LINE_BLUEPRINT.md` and `CACHE_LINE_CHASE_SLICE.md`. The synchronized profile, separate save adapter and campaign award boundary remain relevant; the controls and Makko route below describe the earlier revision.

September 23, 2026. Review branch `agent/cache-road-music-proof` from merged PR #92 (`45a742b4b3bdb765f60ce2b5539658f7fcd06312`). This is a bounded interactive proof for Cache Back's Level 2, following the owner's request that a road lane add or remove song parts and a lock carry parts into another lane. It does not declare the stage, music or writing accepted.

## What is playable

The post-clear Level 1 handoff now starts **The Cache Line** with Enter/click or controller A. Key `3`, the second click target or controller Y still opens the old Level 3 architecture test, explicitly labeled as such. The old Level 3 checkpoint remains separate.

Cache steers among four road lanes while traffic and blockades approach. Each lane has a compatible part of the same temporary 120 BPM song: Bass, Break, Harmony, Lead. A quiet carrier is always audible. Press E / mapped Inspect (default RB) to lock or release the current part. Up to two parts stay locked in order; locking a third replaces the oldest, and the current lane also plays. Steering affects the car immediately; mix changes occur on the next transport beat with a short gain fade. All five sources start together and run continuously. There is no tap-timing judgment and no stem starts/seeks for a lane change.

Space / mapped Jump (default A) spends a Cache dash. Two adjacent traffic near misses refill it. Dash briefly increases speed and lets Cache pass one road hazard without a hit. Three integrity points, two road checkpoints and a far-right original-tape gate make the interaction playable. A wrong gate lane loops Cache back with a readable cue. The delivery stretch briefly reveals all four compatible parts; this is Cache's temporary song payoff, not the finale Full Mix.

The proof clear screen points toward Mac's distribution blockade. No `stem.bass`, Level 2 completion, result, lore record, final character art or authored cutscene is awarded. Voice and the Level 1 save remain intact. Exit preview stores an independent road checkpoint within that Level 1 handoff; title Continue restores the Level 2 preview directly. Retry uses the last road marker, while replay after clear starts the proof again. Pause/settings and Exit preview remain in the shared menu.

## Temporary audio and replacement contract

`tools/build-cache-road-proof-audio.py` generated five mono 22,050 Hz PCM WAV files under `assets/audio/cache-road-proof-*.wav`. All are exactly 352,800 samples (16 seconds, eight bars at 120 BPM); they share one start, length and progression. Peak of the five parts at the specified full-mix gains is below 0.5 in the generated PCM. The profile is `level-02.proof` and marked unverified. Its tempo, roles, sounds and mix gains are scratch treatment, not the Level 2 song spec or Level 1 values.

When authored audio arrives, require aligned exports, loop seam listening, gain/loudness review and an updated song-owned profile. The lane mixer owns gain only; the existing AudioSystem and MusicTransport retain source, pause, resume and restart ownership. Dynamic music Off in the general settings still leaves this lane arrangement working because it is gameplay interaction, not optional Level 1 arrangement color. Fallback assets show a warning; their timbre/alignment does not count as an accepted mix.

## Verification and review limit

`npm run check:cache-road-proof` loads the production adapter, director, audio scheduler and lifecycle in a host-stubbed VM. It checks exact WAV alignment/distinct content, five shared source anchors with no restart on mix change, queued beat transition, two-lock FIFO/release, collision and gate logic, checkpoint, title label, pause/resume, Level 1 return and absence of Bass/Level 2 completion. `npm run check:broadcast-slum-proof`, `npm test`, `npm run check:syntax:all` and `git diff --check` pass at the review branch before publication. A local Canvas raster inspection covers a road gate frame; it does not establish Makko camera, gamepad or audible feel.

Owner review should listen to one lane, lock it, change lanes, lock a second, replace/release, pause/resume and cross the 16-second loop several times. Then fail/retry, use title Continue, exit to Level 1 and reopen the old Level 3 test. Record whether the music changes are musically distinct and smooth, whether traffic gives enough anticipation, whether the car and gate read at actual scale, and whether the stage should be longer or change its route. The next implementation step is an authored Level 2 song/visual pass and full scene/cutscene treatment after that feedback; Mac's brawler still needs a separate move and boss design.
