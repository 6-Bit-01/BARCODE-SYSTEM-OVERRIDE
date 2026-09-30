# Cache Line full-race balance study

Deterministic controller study; these are not human success rates, browser sound judgments, or Makko/device acceptance.

The controller uses delayed production-visible observations and actual gamepad input. All road travel, captures, collisions, abilities, gate checks and checkpoint retries run through production code at 50 updates/second. No immunity or gameplay state is injected. Gears 1 and 3 engage using the normal first-bar queued gear input. The recovering profile skips every fifth offered action, has more timing error, and skips Brace before deliberately staying in visible convoy lanes until one unprotected contact probes recovery.

| Driver | Difficulty | Gear | Result | Bar | Hits | Retries | Captures | Best chain | Push / Brace | Echo | Integrity |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| practiced | relaxed | 1 | clear | 100 | 0 | 0 | 56/57 | 8 | 0 / 1 | 5 | 4 |
| practiced | relaxed | 2 | clear | 100 | 0 | 0 | 56/56 | 8 | 0 / 0 | 5 | 4 |
| practiced | relaxed | 3 | clear | 100 | 0 | 0 | 57/57 | 8 | 0 / 0 | 6 | 4 |
| practiced | standard | 1 | clear | 100 | 0 | 0 | 55/55 | 8 | 0 / 1 | 6 | 3 |
| practiced | standard | 2 | clear | 100 | 0 | 0 | 56/57 | 8 | 0 / 0 | 6 | 3 |
| practiced | standard | 3 | clear | 100 | 0 | 0 | 57/57 | 8 | 1 / 1 | 6 | 3 |
| practiced | overclocked | 1 | clear | 100 | 1 | 0 | 55/57 | 8 | 0 / 1 | 7 | 2 |
| practiced | overclocked | 2 | clear | 100 | 0 | 0 | 57/57 | 8 | 0 / 0 | 6 | 3 |
| practiced | overclocked | 3 | clear | 100 | 0 | 0 | 57/57 | 8 | 0 / 0 | 7 | 3 |
| recovering | relaxed | 1 | clear | 100 | 1 | 0 | 40/57 | 4 | 2 / 1 | 5 | 3 |
| recovering | relaxed | 2 | clear | 100 | 1 | 0 | 37/56 | 4 | 0 / 0 | 5 | 3 |
| recovering | relaxed | 3 | clear | 100 | 1 | 0 | 39/57 | 4 | 1 / 0 | 5 | 3 |
| recovering | standard | 1 | clear | 100 | 1 | 0 | 35/52 | 4 | 1 / 1 | 7 | 2 |
| recovering | standard | 2 | clear | 100 | 1 | 0 | 42/57 | 4 | 0 / 0 | 6 | 2 |
| recovering | standard | 3 | clear | 100 | 1 | 0 | 38/57 | 4 | 1 / 1 | 6 | 2 |
| recovering | overclocked | 1 | clear | 100 | 1 | 0 | 42/57 | 4 | 0 / 1 | 6 | 2 |
| recovering | overclocked | 2 | clear | 100 | 1 | 0 | 42/57 | 4 | 0 / 0 | 6 | 2 |
| recovering | overclocked | 3 | clear | 100 | 1 | 0 | 42/57 | 4 | 0 / 0 | 7 | 2 |
| practiced + gear changes | standard | 2 | clear | 100 | 0 | 0 | 53/54 | 8 | 0 / 1 | 6 | 3 |
| practiced + missed exit | standard | 3 | clear | 100 | 0 | 1 | 63/64 | 8 | 1 / 1 | 6 | 3 |
| practiced + ram route | standard | 2 | clear | 100 | 0 | 0 | 55/57 | 8 | 8 / 0 | 6 | 3 |
| practiced + two early hits | standard | 2 | clear | 100 | 2 | 0 | 54/57 | 8 | 0 / 0 | 6 | 1 |
| practiced / -150 ms | standard | 2 | clear | 100 | 0 | 0 | 56/57 | 8 | 0 / 0 | 6 | 3 |
| practiced / 150 ms | standard | 2 | clear | 100 | 0 | 0 | 30/57 | 3 | 0 / 0 | 5 | 3 |
| practiced / -240 ms | standard | 2 | clear | 100 | 0 | 0 | 0/57 | 0 | 0 / 0 | 5 | 3 |
| practiced / 240 ms | standard | 2 | clear | 100 | 0 | 0 | 0/57 | 0 | 0 / 0 | 5 | 3 |

Completed: 26/26. Exact events, failures, checkpoints and recovery durations are in the companion JSON.

The 60-second opening budget comes from the earlier encounter pass: a 55-second start failed before the first checkpoint after two real hits. This pass repeats that probe against the denser chart; its current result is recorded in the table and JSON. Later verse checkpoints retain their established timer budget.

Recovery samples below include an actual unprotected collision. Time to the next capture includes further timing mistakes, skipped inputs and driving around traffic; it is not a forced recovery delay.

| Difficulty | Gear | Hit bar | Parts before → retained | Next capture |
| --- | ---: | ---: | ---: | ---: |
| relaxed | 1 | 53.739 | 4 → 3 | 2.36 s |
| relaxed | 2 | 52.213 | 2 → 1 | 1.4 s |
| relaxed | 3 | 51.36 | 2 → 1 | 1.28 s |
| standard | 1 | 48.565 | 2 → 1 | 0.86 s |
| standard | 2 | 30.208 | 2 → 1 | 1.46 s |
| standard | 3 | 49.355 | 2 → 1 | 3.08 s |
| overclocked | 1 | 30.421 | 2 → 1 | 1.04 s |
| overclocked | 2 | 28.213 | 2 → 1 | 1.46 s |
| overclocked | 3 | 28.363 | 2 → 1 | 1.14 s |

| Driver / timing bias | Difficulty | Gear | Full stack | Longest full stack | Civilian passes | Longest pass gap | Longest civilian-free view | Part entrances / exits |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| practiced | relaxed | 1 | 9.9% | 5.62 s | 19 | 25.2 s | 25.2 s | drive: 8/7; flow: 6/5; breakaway: 11/11; undercurrent: 8/8 |
| practiced | relaxed | 2 | 10.9% | 5.62 s | 18 | 29.6 s | 29.6 s | drive: 7/7; flow: 10/10; breakaway: 8/7; undercurrent: 8/7 |
| practiced | relaxed | 3 | 5% | 3.76 s | 18 | 31.22 s | 31.22 s | drive: 7/7; flow: 7/7; breakaway: 7/6; undercurrent: 8/7 |
| practiced | standard | 1 | 3% | 5.6 s | 60 | 21.44 s | 21.44 s | drive: 6/5; flow: 6/5; breakaway: 8/8; undercurrent: 6/6 |
| practiced | standard | 2 | 0% | 0 s | 60 | 25.86 s | 25.86 s | drive: 5/4; flow: 7/6; breakaway: 7/7; undercurrent: 5/5 |
| practiced | standard | 3 | 0% | 0 s | 60 | 27.46 s | 27.46 s | drive: 6/5; flow: 7/6; breakaway: 8/8; undercurrent: 6/6 |
| practiced | overclocked | 1 | 0% | 0 s | 90 | 19.8 s | 16.14 s | drive: 4/3; flow: 6/5; breakaway: 7/7; undercurrent: 5/5 |
| practiced | overclocked | 2 | 0% | 0 s | 135 | 23.46 s | 23.46 s | drive: 5/4; flow: 6/5; breakaway: 7/7; undercurrent: 5/5 |
| practiced | overclocked | 3 | 0% | 0 s | 137 | 25.58 s | 25.58 s | drive: 5/5; flow: 6/5; breakaway: 7/6; undercurrent: 5/5 |
| recovering | relaxed | 1 | 2.7% | 1.86 s | 19 | 25.2 s | 25.2 s | drive: 3/3; flow: 9/8; breakaway: 9/8; undercurrent: 7/7 |
| recovering | relaxed | 2 | 2% | 3.76 s | 18 | 29.6 s | 29.6 s | drive: 4/4; flow: 9/9; breakaway: 10/9; undercurrent: 4/4 |
| recovering | relaxed | 3 | 1% | 1.88 s | 18 | 31.2 s | 31.2 s | drive: 5/5; flow: 7/7; breakaway: 10/9; undercurrent: 6/5 |
| recovering | standard | 1 | 0% | 0 s | 59 | 21.44 s | 21.44 s | drive: 0/0; flow: 10/9; breakaway: 9/8; undercurrent: 1/1 |
| recovering | standard | 2 | 0% | 0 s | 60 | 25.86 s | 25.86 s | drive: 4/3; flow: 7/6; breakaway: 7/7; undercurrent: 3/3 |
| recovering | standard | 3 | 0% | 0 s | 60 | 27.46 s | 27.46 s | drive: 3/2; flow: 8/7; breakaway: 8/8; undercurrent: 4/4 |
| recovering | overclocked | 1 | 0% | 0 s | 82 | 19.8 s | 16.14 s | drive: 4/3; flow: 6/5; breakaway: 8/8; undercurrent: 3/3 |
| recovering | overclocked | 2 | 0% | 0 s | 135 | 23.46 s | 23.46 s | drive: 5/4; flow: 6/5; breakaway: 7/7; undercurrent: 2/2 |
| recovering | overclocked | 3 | 0% | 0 s | 137 | 25.58 s | 25.58 s | drive: 4/4; flow: 6/5; breakaway: 7/6; undercurrent: 3/3 |
| practiced | standard | 2 | 4% | 5.62 s | 60 | 25.86 s | 25.86 s | drive: 6/5; flow: 7/6; breakaway: 7/7; undercurrent: 6/6 |
| practiced | standard | 3 | 0% | 0 s | 66 | 27.58 s | 27.58 s | drive: 7/6; flow: 8/7; breakaway: 9/9; undercurrent: 7/7 |
| practiced | standard | 2 | 0% | 0 s | 60 | 25.86 s | 25.86 s | drive: 5/4; flow: 8/7; breakaway: 7/7; undercurrent: 5/5 |
| practiced | standard | 2 | 0% | 0 s | 60 | 25.86 s | 25.86 s | drive: 5/4; flow: 7/6; breakaway: 7/7; undercurrent: 4/4 |
| practiced / -150 ms | standard | 2 | 0% | 0 s | 60 | 25.86 s | 25.86 s | drive: 5/4; flow: 7/6; breakaway: 6/6; undercurrent: 5/5 |
| practiced / 150 ms | standard | 2 | 0% | 0 s | 60 | 25.28 s | 25.28 s | drive: 2/2; flow: 11/10; breakaway: 9/9; undercurrent: 3/3 |
| practiced / -240 ms | standard | 2 | 0% | 0 s | 60 | 25.28 s | 25.28 s | drive: 0/0; flow: 0/0; breakaway: 0/0; undercurrent: 0/0 |
| practiced / 240 ms | standard | 2 | 0% | 0 s | 60 | 25.28 s | 25.28 s | drive: 0/0; flow: 0/0; breakaway: 0/0; undercurrent: 0/0 |

The four timing probes use fixed -150/+150/-240/+240 ms intent (the 50 Hz gamepad polling adds bounded input delay recorded per press) and actual inputs: the inner pair exercises both newly accepted edges, and the outer pair must remain misses. Mix targets come from the production MusicDirector through the real shared loop; mock Web Audio gain nodes record target transitions, not listening quality. Civilian gaps include the intro and final runway.

Reproduce with `node tools/check-cache-road-races.cjs --write`. The default check runs the same races without rewriting artifacts. `--profile=practiced --difficulty=standard --gear=3` isolates one run. `--observe` reports failed routes without asserting full completion, for tuning.
