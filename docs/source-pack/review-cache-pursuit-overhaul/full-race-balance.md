# Cache Line full-race balance study

Deterministic controller study; these are not human success rates, browser sound judgments, or Makko/device acceptance.

The controller uses delayed production-visible observations and actual gamepad input. All road travel, captures, collisions, abilities, showdown/gate checks and checkpoint retries run through production code at 50 updates/second. No immunity or gameplay state is injected. Gears 1 and 3 engage using the normal first-bar queued gear input. The recovering profile skips every fifth offered action, has more timing error, and skips Brace before deliberately staying in visible convoy lanes until one unprotected contact probes recovery.

Fresh version-3 races break the enforcement rig’s three systems and continue through the full 100-bar recording. They do not require the retired final Echo split. The missed-boss case deliberately skirts all six attacks too narrowly to counter, then completes through the real checkpoint retry.

| Driver | Difficulty | Gear | Result | Bar | Hits | Retries | Captures | Best chain | Push / Brace | Echo | Rig breaks | Integrity |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| practiced | relaxed | 1 | clear | 100 | 0 | 0 | 62/63 | 8 | 0 / 0 | 8 | 3 | 4 |
| practiced | relaxed | 2 | clear | 100 | 0 | 0 | 63/63 | 8 | 0 / 0 | 6 | 3 | 4 |
| practiced | relaxed | 3 | clear | 100 | 0 | 0 | 63/63 | 8 | 0 / 0 | 6 | 3 | 4 |
| practiced | standard | 1 | clear | 100 | 0 | 0 | 62/63 | 8 | 0 / 0 | 9 | 3 | 3 |
| practiced | standard | 2 | clear | 100 | 0 | 0 | 63/63 | 8 | 0 / 0 | 7 | 3 | 3 |
| practiced | standard | 3 | clear | 100 | 0 | 0 | 63/63 | 8 | 0 / 0 | 7 | 3 | 3 |
| practiced | overclocked | 1 | clear | 100 | 0 | 0 | 62/63 | 8 | 0 / 0 | 9 | 3 | 3 |
| practiced | overclocked | 2 | clear | 100 | 0 | 0 | 63/63 | 8 | 0 / 0 | 7 | 3 | 3 |
| practiced | overclocked | 3 | clear | 100 | 0 | 0 | 63/63 | 8 | 0 / 0 | 8 | 3 | 3 |
| recovering | relaxed | 1 | clear | 100 | 1 | 0 | 44/63 | 4 | 2 / 0 | 9 | 3 | 3 |
| recovering | relaxed | 2 | clear | 100 | 1 | 0 | 41/63 | 4 | 0 / 0 | 6 | 3 | 3 |
| recovering | relaxed | 3 | clear | 100 | 1 | 0 | 43/63 | 4 | 0 / 0 | 7 | 3 | 3 |
| recovering | standard | 1 | clear | 100 | 1 | 0 | 43/63 | 4 | 1 / 0 | 9 | 3 | 2 |
| recovering | standard | 2 | clear | 100 | 1 | 0 | 46/63 | 4 | 0 / 0 | 7 | 3 | 2 |
| recovering | standard | 3 | clear | 100 | 1 | 0 | 43/63 | 4 | 1 / 0 | 8 | 3 | 2 |
| recovering | overclocked | 1 | clear | 100 | 1 | 0 | 47/63 | 4 | 1 / 0 | 8 | 3 | 2 |
| recovering | overclocked | 2 | clear | 100 | 1 | 0 | 47/63 | 4 | 1 / 0 | 7 | 3 | 2 |
| recovering | overclocked | 3 | clear | 100 | 1 | 0 | 47/63 | 4 | 1 / 0 | 8 | 3 | 2 |
| practiced + gear changes | standard | 2 | clear | 100 | 0 | 0 | 63/63 | 8 | 0 / 0 | 7 | 3 | 3 |
| practiced + missed boss | standard | 3 | clear | 100 | 0 | 1 | 43/78 | 8 | 0 / 0 | 0 | 3 | 3 |
| practiced + ram route | standard | 2 | clear | 100 | 0 | 0 | 59/63 | 8 | 9 / 0 | 7 | 3 | 3 |
| practiced + two early hits | standard | 2 | clear | 100 | 2 | 0 | 60/63 | 8 | 0 / 0 | 7 | 3 | 1 |
| practiced / -150 ms | standard | 2 | clear | 100 | 0 | 0 | 63/63 | 8 | 0 / 0 | 7 | 3 | 3 |
| practiced / 150 ms | standard | 2 | clear | 100 | 0 | 0 | 35/63 | 3 | 0 / 0 | 6 | 3 | 3 |
| practiced / -240 ms | standard | 2 | clear | 100 | 0 | 0 | 0/63 | 0 | 0 / 0 | 6 | 3 | 3 |
| practiced / 240 ms | standard | 2 | clear | 100 | 0 | 0 | 0/63 | 0 | 0 / 0 | 6 | 3 | 3 |

Completed: 26/26. Exact events, failures, checkpoints and recovery durations are in the companion JSON.

The 60-second opening budget comes from the earlier encounter pass: a 55-second start failed before the first checkpoint after two real hits. This pass repeats that probe against the denser chart; its current result is recorded in the table and JSON. Later verse checkpoints retain their established timer budget.

Recovery samples below include an actual unprotected collision. Time to the next capture includes further timing mistakes, skipped inputs and driving around traffic; it is not a forced recovery delay.

| Difficulty | Gear | Hit bar | Parts before → retained | Next capture |
| --- | ---: | ---: | ---: | ---: |
| relaxed | 1 | 53.739 | 4 → 3 | 2.36 s |
| relaxed | 2 | 48.213 | 2 → 1 | 1.56 s |
| relaxed | 3 | 51.36 | 2 → 1 | 1.28 s |
| standard | 1 | 48.565 | 2 → 1 | 0.86 s |
| standard | 2 | 30.208 | 2 → 1 | 1.46 s |
| standard | 3 | 49.355 | 2 → 1 | 3.08 s |
| overclocked | 1 | 30.56 | 2 → 1 | 0.78 s |
| overclocked | 2 | 30.208 | 2 → 1 | 1.46 s |
| overclocked | 3 | 29.355 | 2 → 1 | 3.1 s |

| Driver / timing bias | Difficulty | Gear | Full stack | Longest full stack | Civilian passes | Longest pass gap | Longest civilian-free view | Part entrances / exits |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| practiced | relaxed | 1 | 12.9% | 5.62 s | 15 | 55.46 s | 55.46 s | drive: 9/8; flow: 8/7; breakaway: 11/10; undercurrent: 10/9 |
| practiced | relaxed | 2 | 14.8% | 5.6 s | 15 | 59.6 s | 59.6 s | drive: 9/8; flow: 7/6; breakaway: 12/11; undercurrent: 10/9 |
| practiced | relaxed | 3 | 11.9% | 5.62 s | 15 | 61.2 s | 61.2 s | drive: 9/8; flow: 7/6; breakaway: 9/8; undercurrent: 10/9 |
| practiced | standard | 1 | 9.9% | 5.62 s | 46 | 47.7 s | 47.7 s | drive: 7/6; flow: 6/5; breakaway: 10/9; undercurrent: 7/6 |
| practiced | standard | 2 | 9.9% | 5.62 s | 48 | 51.72 s | 51.72 s | drive: 7/6; flow: 9/8; breakaway: 10/9; undercurrent: 8/7 |
| practiced | standard | 3 | 13% | 11.24 s | 48 | 53.7 s | 53.7 s | drive: 7/6; flow: 6/5; breakaway: 7/6; undercurrent: 7/6 |
| practiced | overclocked | 1 | 4.9% | 5.6 s | 68 | 47.7 s | 47.7 s | drive: 6/5; flow: 7/6; breakaway: 9/8; undercurrent: 7/6 |
| practiced | overclocked | 2 | 4% | 5.58 s | 107 | 51.72 s | 51.72 s | drive: 4/3; flow: 6/5; breakaway: 7/6; undercurrent: 5/4 |
| practiced | overclocked | 3 | 6.9% | 5.58 s | 107 | 53.7 s | 53.7 s | drive: 4/3; flow: 7/6; breakaway: 9/8; undercurrent: 5/4 |
| recovering | relaxed | 1 | 1.7% | 1.78 s | 15 | 55.2 s | 55.2 s | drive: 6/6; flow: 7/6; breakaway: 12/11; undercurrent: 8/7 |
| recovering | relaxed | 2 | 4% | 3.76 s | 15 | 59.6 s | 59.6 s | drive: 6/5; flow: 11/10; breakaway: 9/8; undercurrent: 5/4 |
| recovering | relaxed | 3 | 5% | 3.76 s | 15 | 61.2 s | 61.2 s | drive: 6/5; flow: 7/6; breakaway: 12/11; undercurrent: 5/4 |
| recovering | standard | 1 | 2% | 3.76 s | 46 | 47.7 s | 47.7 s | drive: 4/3; flow: 10/9; breakaway: 12/11; undercurrent: 5/4 |
| recovering | standard | 2 | 6.9% | 5.6 s | 48 | 51.72 s | 51.72 s | drive: 4/3; flow: 8/7; breakaway: 10/9; undercurrent: 6/5 |
| recovering | standard | 3 | 4% | 3.76 s | 48 | 53.7 s | 53.7 s | drive: 5/4; flow: 8/7; breakaway: 10/9; undercurrent: 3/2 |
| recovering | overclocked | 1 | 2% | 3.76 s | 64 | 47.7 s | 47.7 s | drive: 3/2; flow: 8/7; breakaway: 10/9; undercurrent: 4/3 |
| recovering | overclocked | 2 | 0% | 0 s | 107 | 51.72 s | 51.72 s | drive: 2/2; flow: 7/6; breakaway: 9/8; undercurrent: 3/2 |
| recovering | overclocked | 3 | 5% | 5.56 s | 107 | 53.7 s | 53.7 s | drive: 4/3; flow: 8/7; breakaway: 9/8; undercurrent: 3/2 |
| practiced | standard | 2 | 10.9% | 11.24 s | 47 | 53.7 s | 53.7 s | drive: 7/6; flow: 8/7; breakaway: 7/6; undercurrent: 7/6 |
| practiced | standard | 3 | 2.4% | 5.62 s | 48 | 98.7 s | 98.7 s | drive: 4/4; flow: 4/4; breakaway: 6/6; undercurrent: 5/5 |
| practiced | standard | 2 | 7.9% | 3.76 s | 48 | 52.36 s | 52.36 s | drive: 6/5; flow: 9/8; breakaway: 9/8; undercurrent: 7/6 |
| practiced | standard | 2 | 9.9% | 5.62 s | 48 | 51.72 s | 51.72 s | drive: 6/5; flow: 9/8; breakaway: 10/9; undercurrent: 7/6 |
| practiced / -150 ms | standard | 2 | 10% | 5.62 s | 48 | 51.72 s | 51.72 s | drive: 7/6; flow: 6/5; breakaway: 10/9; undercurrent: 8/7 |
| practiced / 150 ms | standard | 2 | 0.9% | 1.72 s | 48 | 51.72 s | 51.72 s | drive: 5/4; flow: 9/8; breakaway: 8/7; undercurrent: 6/5 |
| practiced / -240 ms | standard | 2 | 0% | 0 s | 48 | 51.52 s | 51.52 s | drive: 0/0; flow: 0/0; breakaway: 0/0; undercurrent: 0/0 |
| practiced / 240 ms | standard | 2 | 0% | 0 s | 48 | 51.52 s | 51.52 s | drive: 0/0; flow: 0/0; breakaway: 0/0; undercurrent: 0/0 |

The four timing probes use fixed -150/+150/-240/+240 ms intent (the 50 Hz gamepad polling adds bounded input delay recorded per press) and actual inputs: the inner pair exercises both newly accepted edges, and the outer pair must remain misses. Mix targets come from the production MusicDirector through the real shared loop; mock Web Audio gain nodes record target transitions, not listening quality. Civilian gaps include the intro and final runway.

Reproduce with `node tools/check-cache-road-races.cjs --write`. The default check runs the same races without rewriting artifacts. `--profile=practiced --difficulty=standard --gear=3` isolates one run. `--observe` reports failed routes without asserting full completion, for tuning.
