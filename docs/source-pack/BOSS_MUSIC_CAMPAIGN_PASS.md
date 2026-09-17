# Boss, music arrangement and campaign foundation

Owner approval: “Alright, let's do it. You can take a look at the sync but if its not broken, don't fix it.” Base/rollback: merged #81, `a75f33f2321a9e96f3a8fa7677dbf61e586bdb1e`. Branch: `agent/boss-music-campaign`.

## Musical synchronization is the baseline

No change to source files/URLs, start offsets, initial gains, playback speed, native-loop flags, 146 BPM grid, 4/4 meter, calibration/judgment windows, 211-second detection, restart callback scheduling, transport, or audio pause/resume. Comments in the older code describe a one-second restart wait, but its callbacks supply no delay: actual scheduling does not implement that stated wait. The earlier review's audible-gap implication was therefore not established. Unequal decoded lengths remain known legacy debt, not permission to replace working synchronization.

`docs/technical/music-sync-baseline.json` captures the base profile and hashes of nine protected audio methods and the complete transport. The production regression compares original versus dynamic mixing over three full restarts and a pause/resume. It requires identical source schedules and transport samples. This proves retained software behavior, not audible alignment in Makko or musical quality.

The new frame-owned MusicDirector changes gains, an FX-only low-pass filter and a quiet, bounded echo send. Foundation transients remain clean. No new source, interval, RAF or beat authority. Ordinary arrangement changes wait for bars; rhythm/hack/boss/counter/victory changes wait for beats. Phrase variants cycle through four bounded treatments. Boss pressure exists independently of ordinary enemy counts. Combo milestones and successful hacks can accent the colour layer, at most once per four beats. Cutscene/pause/stop ownership is retained and effect graphs disconnect on stop/rebind.

Pause → Dynamic music supplies a saved A/B switch. Off restores the legacy Level 1 mix including rhythm without enemies. Each profile owns source roles and state levels. A separate 92 BPM, three-beat, differently named source fixture proves independence; it is a technical test, not a newly authored Level 2 song. Actual later songs and their musical metadata are still required.

## Boss pressure and readability

Keep ten health, damage, warned pulses, single-jump traversal, safe rebounds, stomp rearming, rooftop pursuit, traffic and retry. Recovery lasts six fresh beats on Relaxed, three on Standard, two on Overclocked. Music boundaries remain authoritative and are not sped up by difficulty or hacking. Silent hosts retain a finite recovery.

The familiar single pulse teaches the first cycle. The double pulse follows as before. Later eligible cycles add a fixed, clearly outlined signal-slam column. It does not track the player after the warning. Move outside the marked column; airborne overlap inside the column can still hurt. Narrow supports retain pulses. Standard uses every third eligible cycle; Overclocked alternates later slam cycles; Relaxed reserves it for low health. The displayed attack name/instruction uses the selected pattern. Damage matches the visible column and latches once. No unmarked landing attack is added to traversal.

Ideal on-beat attacks in the production rig take 4 openings on Standard and 5 on Overclocked at 30/60/120Hz, versus the previous 2. Relaxed takes 2 with six available hits in its first opening. The rig protects the player to isolate damage opportunity; hosted difficulty/feel still needs owner testing.

Existing atmospheric suppression now includes boss attack areas and nearby rain/sign sweeps. Population, scenery assets and car behavior remain. Warning/damage SFX receive voice priority; enemy proximity sound briefly yields to critical cues. The music clock is unaffected.

## Campaign data and handoff

Keep the existing save identity and schema, lore IDs, Studio Rat facts and hidden challenge values. Extend save merging with unlocked levels, item IDs and best/latest/fastest results by level and difficulty. Save encounter-start, Jammer-start and boss-start checkpoints; resume reconstructs authoritative level owners and retains the chosen difficulty, score, run statistics, discoveries, Amp charges and sky caches. Mid-encounter reload returns to that encounter's saved start. No live object references are serialized.

The title's Continue Saved button (C / Triangle / Y, or pointer) skips the intro and tutorial and uses the existing lifecycle to start Level 1 music once and restore the checkpoint. A fresh browser session starts the existing song normally; no persisted audio offset or seek is invented. Terminal resume reconstructs results/intermission without granting a second clear. Boss resume requests its artwork and retains normal frame-owned readiness polling, including delayed host loads, because reload skips the cinematic preload interval.

Run facts: active gameplay time, accepted damage, boss retries, judged attempts, accurate/perfect inputs, connected attacks, best combo and per-run lore. The killing rhythm hit is included. Existing kill/collectible points remain. A full clear grants 1,000 points, up to 600 for perfect attacks that connect relative to judged attempts, and 500 for a damage-free/no-retry run. Boss practice grants no repeat completion bonus and cannot replace full-run records. Grades and album/finale thresholds are deliberately not invented.

First clear awards `stem.voice` once and unlocks the Level 2 campaign fact. Results offer Continue Broadcast alongside the existing rematch/restart controls. The new short Cache Back transmission identifies the recovered Voice key and upcoming Cache Line. It truthfully states that the next playable sector is coming. The handoff can be resumed after reopening. Six later playable levels, authored second-song assets, optional-module challenges and final narrative resolution remain later work.

Ending contract: preserve unique lore/egg/item IDs, completed levels, per-level difficulty bests and result records. Future ending evaluation reads those facts separately; no ending threshold or collection-purpose hint appears in player UI. Keep a revisitable pre-finale checkpoint when that level is built. Optional modules must not become mandatory clear gates. The eventual Full Mix is its own compatible arrangement.

## Integration and evidence

Two intentional script-graph additions: MusicDirector after the Level 1 profile, Campaign after LoreCollection/LevelDifficulty. They use existing update/input/lifecycle/draw owners. Inventory changes may include those modules, shifted script indices, new declared functions and changed line locations; existing baseline exceptions remain intact. The boss regression now explicitly selects a double-pulse cycle so its old double-pulse assertion does not accidentally select the newly added slam.

Focused production checks cover protected audio timing, three loops, pause/resume, A/B routing/cleanup, a differently named/tempo/meter profile, checkpoint reconstruction, delayed boss-art readiness, lifecycle terminal resume, no duplicate awards, concurrent saves, full boss transactions and slam geometry at 30/60/120Hz. Existing menu/archive/controller tests follow the added Dynamic music row. Native captures are generated with `BOSS_MUSIC_REVIEW=1 node tools/render-level1-rebuild.cjs docs/source-pack/review-boss-music-campaign`. They stage the production idle/attack sheets and illustrative result statistics. Canvas and audio host services are adapted; neither these nor CI establish physical-controller, audible or hosted Makko acceptance.

Full-suite/syntax/CI results and exact reviewed revision belong to the generated receipt. Keep the draft unmerged pending the owner's Makko review. Publish one combined draft and refresh the maintained v5 archive.
