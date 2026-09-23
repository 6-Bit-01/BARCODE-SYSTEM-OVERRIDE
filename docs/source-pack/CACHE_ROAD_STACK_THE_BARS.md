# Cache Road — Stack the Bars review

The owner accepted a faster lane mechanic after hearing the merged five-stem
100-bar song. A traffic hit should sound like an obvious musical miss: a brief
cut, warp and power dip, then recovery on the same clock. This is the playable
review implementation for that direction; Makko listening and controller feel
are pending.

| Action | Rule | Visible and audible result |
| --- | --- | --- |
| Center in an available lane for 0.5 s | Catch on the next beat, once per visit | Its recorded part rises in 0.22 s and remains for two bars. Leaving does not release it. |
| E / RB in the centered lane | Spend 50% meter, arm the next beat | Seal that part for four bars; a second seal can renew it. |
| Move to another lane | Catch a different part while prior bars remain | Distinct caught parts give x1–x4. Pressure is the permanent pulse and does not count. |
| Finish a clean bar | Award 100 × stack | Refill 10% seal meter. |
| Pass traffic closely | Award 50 × stack | Refill 25% seal meter and 28% Echo; two near misses prepare Turbo. |
| Hit traffic | Keep prior score; lose current stack | A 0.62 s music-bus stutter and pitched digital tear interrupt the signal. The old speed, time and integrity penalties still apply. |

The four lower lane cards display the current four-bar strip and their remaining
recorded bars. Glowing cells lie in the corresponding road lane. The current
strip bar has a white outline; expired bars drain. The top HUD shows score and
live stack. Intro Flow enters at bar 5. Breakaway and Undercurrent first enter
at bar 13 and re-enter at the second eight bars of each later verse. Before an
entrance, those lanes say the exact arrival bar, and E does not spend a charge.

Space/A remains the driving Turbo. H/Y remains Buffer Echo for the rival and
original exit. E/RB is the deliberate musical seal. Pressure stays at 0.60;
Drive idles at 0.10 until caught at 0.19; Flow idles at 0.18 in verses/choruses
until caught at 0.55. Breakaway and Undercurrent rise to 0.50 and 0.62 when
caught in sections that contain them. Sources always start together, never seek
on steering or collision, and fade down over 0.38 s after expiry.

The production check uses the real transport and road update to reach x4 with
actual steer input, and also checks four caught parts, score, a hit/reset, full
100-bar run, final Echo gate and v1–v3 save migration. The browser check decodes
the five actual MP3s, confirms the intro Drive catch and bus recovery, and
repeats the missing-local-asset delivery path. Six native review frames show
section arrivals, live bar tape, Echo and a collision. These checks establish
timing and visible/audio code paths, not whether the authored mix, glitch
texture, traffic balance or control feel are fun in Makko.

Checkpoint v4 stores score, best stack and clean bars. Active timed captures
reset at a checkpoint/retry; old indefinite locks are refunded into the seal
meter. The title, Level 1 Voice/return, separate Level 3 preview and no Bass
Key/Level 2 completion boundary remain intact.
