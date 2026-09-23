# Cache Road — full song arrangement review

The owner supplied the full section grid: four-bar intro, then four cycles of a
16-bar verse and an eight-bar chorus. Each verse's A/B labels mark its two
eight-bar halves. At the provisional 128 BPM transport, the five aligned MP3s
decode to 187.5 seconds: 100 bars. The last chorus is bars 93–100.

| Round | Verse | Chorus |
| --- | --- | --- |
| 1 | 5–20 | 21–28 |
| 2 | 29–44 | 45–52 |
| 3 | 53–68 | 69–76 |
| 4 | 77–92 | 93–100 |

The owner archive `BARCODE_Cache_Road_MP3_Layers.zip` maps ContraDrums to
Pressure (always on), ContraBass to Drive, ContraHarmonies1 to Flow,
ContraHarmonies2 to Breakaway, and ContraFX to Undercurrent. All five sources
start at one transport anchor. The four displayed road bands are Drive, Flow,
Breakaway and Undercurrent. The future gang vocal is not in this package.

The car's band during a four-bar road strip votes for the next strip; locks add
parts at that boundary. Pressure and Drive carry the groove, with one audible
section-appropriate colour in normal verse and chorus play. In each verse's
first eight bars Breakaway is effectively silent, so Flow remains the colour
regardless of the chosen band; locks on other bands carry into the next half
where those recordings have content. The intro has only Pressure and Drive in
the recorded arrangement.
Releases and steering do not alter a phrase in progress. A 0.38-second crossfade
at a four-bar boundary changes only sources that join or leave. The full five
source mix peaks below 0 dBFS in an FFmpeg stereo decode at the profile levels;
this does not substitute for listening in Makko.

The road proof now uses the shared music clock for its four rounds and final
exit. Speed still advances the road and affects traffic; the final gate is
placed ahead when the fourth chorus begins. The result waits until the end of
the 100-bar source. Markers at the next three verse starts save the exact bar
and road position. Retry restarts all five sources together at the saved bar.
Older proof checkpoints remain valid; an old Drums lock becomes the always-on
Pressure and refunds its charge. No Level 2 completion or Bass Key is awarded.

The Node production-contract check simulates the 187.5-second run and the
final Echo split. The MP3s were decoded and mixed with FFmpeg; a live Chromium
test could not run in the current workspace because there is no Chrome binary.
Makko listening, full physical-controller feel, and the section-to-road pace
remain owner review items after the merged PR is imported.
