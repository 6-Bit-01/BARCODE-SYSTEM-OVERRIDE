# Cache Road: phrase commit system

## Song grid and player loop

The five already-supplied 187.5-second MP3s run continuously on one 128 BPM transport. Four intro bars lead to four cycles of Verse A (8 bars), Verse B (8 bars) and Chorus (8 bars). Every four-bar phrase begins on a shared song boundary. Pressure drums remain on; Drive/bass is the quiet floor, and Flow/harmony remains a quiet floor after the intro. Breakaway/harmony and Undercurrent/FX have no useful recording in the intro or each Verse A.

| Action | Sound and road | Score |
| --- | --- | --- |
| Settle in a lane for 0.5 s | **Automatically arm its next aligned four bars at no meter cost.** Its road surface lights ahead and plays from that phrase's first beat. If currently recorded, the part also previews on the next beat while centered. | Each distinct active committed lane adds one multiplier part, up to x4; preview alone does not. |
| Stay centered for 1.5 s total | Automatically carry that planned start to eight bars when its recording exists throughout, spending 25% carry charge. | Same lane still counts once; the extra four bars are the benefit. |
| Move and settle in another lane | The first part plays through its committed phrase while another colored road band joins it. Leaving a lane ends only its live preview. A visit commits once; camping cannot automatically rearm every future phrase. | Each completed clean bar earns 100 × active distinct lanes; a near miss earns 50 × active distinct lanes. |
| Hit traffic | Existing 0.62 s cut/warp and speed, time and integrity loss; current and armed phrases break, score earned remains. The car blinks and thin side edges flash without a road-covering panel or hit text. | Multiplier returns to x1. |

The carry meter begins at 100%. Each clean bar restores 10%, and a near miss restores 25%; existing freight draft and corner rewards still charge it. Four-bar commitments are free and easy to stack; an eight-bar carry costs 25%, plus the time spent holding one lane instead of collecting another. Carrying all four for eight bars uses the whole opening meter and more dwell time. Turbo (Space/A) remains speed and dodge; Buffer Echo (H/Y) remains the decoy/final exit. **No music-lock button is required.** A sparse lane can be armed early if its **target** phrase has audio: settling in Flow during intro bar 3 commits verse bars 1–4 (song bars 5–8); staying centered carries it through verse bar 8. Breakaway and Undercurrent cannot be committed for verse A or across a chorus-to-verse-A transition; an unavailable target spends nothing.

## Road language

The next twelve song bars are projected onto the drivable surface: one full-width band per lane and bar. A queued phrase has a colored translucent surface ahead; an active phrase is brighter and advances toward the car as the song plays. The start of each four-bar phrase is a stronger cross-road line with its song bar number; the eight-bar verse halves and choruses get labels at their entrance. Traffic renders above the music surface. The bottom cards show the exact armed/playing bar range, eight-cell span and preview state. The top HUD names the current and upcoming section. This keeps the time window legible in road space while hazards remain visible.

## Simulation and review

The production road/transport test automatically armed Drive, Flow, Breakaway and Undercurrent with actual steering at song seconds **17.43 / 18.38 / 19.68 / 20.98**; all four activate at the Verse B boundary at **22.5 s**. The test also covers the intro-bar-3 → verse-bar-1 example, eight-bar extension, sparse-target refusal, score, collision reset, final 100-bar run, Echo exit and v1–v4 save migration. Real Chromium decodes and mixes all five local MP3s, retries their pinned published copies with local 404s, and recovers the music bus after a collision. Native frames in `review-cache-road-sections/` show armed intro, active stack, final Echo and an unobstructed collision frame.

Balance remains a Makko listening/controller test: the 0.5-second settle plus beat wait, 1.5-second carry choice, 25% carry cost, full-lane highlight contrast near traffic and x4 sustain rate are review candidates. No new music files, album reward, Level 2 completion or campaign fact is introduced.
