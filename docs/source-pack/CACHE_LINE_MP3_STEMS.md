# Cache Line — owner stems in MP3

September 23, 2026. The owner supplied `ContraHarmony(1).zip` with four aligned WAV exports and asked for MP3s before the Cache Road draft merges. This review revision uses the MP3 conversions in `level-02.proof`; the source filenames are provenance, not an assignment of the abandoned Contra preview to the campaign.

| Supplied file | Road band | Shipped asset | SHA-256 of MP3 |
| --- | --- | --- | --- |
| `ContraBass.wav` | Bass | `assets/audio/cache-bass.mp3` | `4f7f18d65c2dee61e63e4bc5ead9183b6779de720144ae7f7afa09d1f83890c7` |
| `ContraDrums.wav` | Drums | `assets/audio/cache-drums.mp3` | `64667685712c4aa8bfebe583c61a1f10d2ea7661cd6d189381a2fd9afe819c3d` |
| `ContraHarmony.wav` | Harmony | `assets/audio/cache-harmony.mp3` | `b561be09bfbf60ee2dfca10e3ba73bf33e9ceeded7b0439d92516f0734187537` |
| `ContraFX.wav` | FX | `assets/audio/cache-fx.mp3` | `31ff39951e402f4469ca0d4e4eae7a5c7a776104372b6e888fbea394c65bb21f` |

Each source WAV is 44.1 kHz, 16-bit stereo, 8,268,750 frames (187.5 seconds). Convert without trimming or per-part normalization using FFmpeg/libmp3lame at 160 kbps stereo, 44.1 kHz, with the Xing/LAME gapless header. For example: `ffmpeg -i ContraBass.wav -c:a libmp3lame -b:a 160k -ar 44100 -ac 2 -write_xing 1 cache-bass.mp3`. Each resulting MP3 is 3,751,228 bytes; the four total 15,004,912 bytes versus 132,306,568 bytes of source WAVs (about 89% less transfer). FFmpeg decoding returns 8,268,750 frames for every MP3. The container reports 187.533 seconds including encoder delay/padding, while gapless decoding produces 187.5 seconds. Keep their matching start and length together.

The fixed grid is provisionally 128 quarter beats/minute (187.5 seconds equals 100 four-beat bars, corroborated by drum onset spacing); confirm tempo against the composition on the host. The existing audio owner loads the four MP3s concurrently with a 30-second per-part budget and schedules all decoded parts at one audio timestamp. Steering selects a part, and locks retain selected parts across bands; changing volume never seeks or restarts a stem. No separate generated bed remains. The provisional band gains are Bass 0.28, Drums 0.62, Harmony 0.52 and FX 0.64; the maximum summed peak measured from the source PCM at these gains was about 0.91. Level 1 audio/profile timing and the Level 3 architecture route stay separate. No Bass Key or Level 2 completion is granted.

`npm run check:cache-road-proof` verifies the four asset references, MP3 content, parallel preparation, one synchronous start, beat-queued mix and existing chase/save/progression behavior. `ffprobe` and FFmpeg verify encoding and equal decoded frame counts. The browser's decoder, network load on Makko, exact loop seam, loudness, timbre, gamepad mapping and the authored intent of the `Contra*` names need owner listening/play review. Test the four solo bands and combined mix, lock/release, pause/resume, at least one full 187.5-second loop, the Echo split and return to Level 1 before merge. Keep the original WAV uploads available for a future higher-quality revision.
