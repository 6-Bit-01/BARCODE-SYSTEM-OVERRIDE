# Cache Line full-race balance study

Deterministic controller study; these are not human success rates, browser sound judgments, or Makko/device acceptance.

The controller uses delayed production-visible observations and actual gamepad input. All road travel, captures, collisions, abilities, gate checks and checkpoint retries run through production code at 50 updates/second. No immunity or gameplay state is injected. Gears 1 and 3 engage using the normal first-bar queued gear input. The recovering profile skips every fifth offered action, has more timing error, and skips Brace before deliberately staying in visible convoy lanes until one unprotected contact probes recovery.

| Driver | Difficulty | Gear | Result | Bar | Hits | Retries | Captures | Best chain | Push / Brace | Echo | Integrity |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| practiced | relaxed | 1 | clear | 100 | 0 | 0 | 57/57 | 8 | 0 / 0 | 5 | 4 |
| practiced | relaxed | 2 | clear | 100 | 0 | 0 | 54/54 | 8 | 0 / 0 | 3 | 4 |
| practiced | relaxed | 3 | clear | 100 | 0 | 0 | 57/57 | 8 | 0 / 0 | 3 | 4 |
| practiced | standard | 1 | clear | 100 | 0 | 0 | 50/52 | 8 | 0 / 1 | 7 | 3 |
| practiced | standard | 2 | clear | 100 | 0 | 0 | 56/56 | 8 | 0 / 0 | 5 | 3 |
| practiced | standard | 3 | clear | 100 | 0 | 0 | 57/57 | 8 | 0 / 0 | 4 | 3 |
| practiced | overclocked | 1 | clear | 100 | 0 | 0 | 53/55 | 8 | 0 / 0 | 7 | 3 |
| practiced | overclocked | 2 | clear | 100 | 0 | 0 | 52/56 | 8 | 0 / 0 | 5 | 3 |
| practiced | overclocked | 3 | clear | 100 | 0 | 0 | 56/56 | 8 | 0 / 0 | 5 | 3 |
| recovering | relaxed | 1 | clear | 100 | 1 | 0 | 44/57 | 4 | 0 / 1 | 6 | 3 |
| recovering | relaxed | 2 | clear | 100 | 1 | 0 | 42/54 | 4 | 0 / 2 | 3 | 3 |
| recovering | relaxed | 3 | clear | 100 | 1 | 0 | 43/57 | 4 | 0 / 1 | 3 | 3 |
| recovering | standard | 1 | clear | 100 | 1 | 0 | 40/54 | 4 | 0 / 1 | 7 | 2 |
| recovering | standard | 2 | clear | 100 | 1 | 0 | 39/56 | 4 | 0 / 2 | 4 | 2 |
| recovering | standard | 3 | clear | 100 | 1 | 0 | 42/57 | 4 | 0 / 1 | 4 | 2 |
| recovering | overclocked | 1 | clear | 100 | 1 | 0 | 40/54 | 4 | 0 / 1 | 7 | 2 |
| recovering | overclocked | 2 | clear | 100 | 1 | 0 | 42/57 | 4 | 0 / 1 | 4 | 2 |
| recovering | overclocked | 3 | clear | 100 | 1 | 0 | 44/56 | 4 | 0 / 1 | 4 | 2 |
| practiced + gear changes | standard | 2 | clear | 100 | 0 | 0 | 51/54 | 8 | 0 / 0 | 4 | 3 |
| practiced + missed exit | standard | 3 | clear | 100 | 0 | 1 | 63/64 | 8 | 0 / 0 | 4 | 3 |
| practiced + ram route | standard | 2 | clear | 100 | 0 | 0 | 54/56 | 8 | 5 / 0 | 5 | 3 |

Completed: 21/21. Exact events, failures, checkpoints and recovery durations are in the companion JSON.

Recovery samples below include an actual unprotected collision. Time to the next capture includes further timing mistakes, skipped inputs and driving around traffic; it is not a forced recovery delay.

| Difficulty | Gear | Hit bar | Parts before → retained | Next capture |
| --- | ---: | ---: | ---: | ---: |
| relaxed | 1 | 39.829 | 4 → 3 | 2.12 s |
| relaxed | 2 | 36.523 | 4 → 3 | 0.86 s |
| relaxed | 3 | 43.36 | 2 → 1 | 4.98 s |
| standard | 1 | 37.824 | 3 → 2 | 13.38 s |
| standard | 2 | 34.517 | 3 → 2 | 12.18 s |
| standard | 3 | 35.36 | 3 → 2 | 3.16 s |
| overclocked | 1 | 37.824 | 3 → 2 | 13.38 s |
| overclocked | 2 | 33.472 | 4 → 3 | 6.66 s |
| overclocked | 3 | 32.363 | 4 → 3 | 1.26 s |

Reproduce with `node tools/check-cache-road-races.cjs --write`. The default check runs the same races without rewriting artifacts. `--profile=practiced --difficulty=standard --gear=3` isolates one run. `--observe` reports failed routes without asserting full completion, for tuning.
