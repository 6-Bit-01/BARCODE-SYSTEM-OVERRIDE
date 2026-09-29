# Cache Road — recording and downbeat audit

September 29, 2026. This audit checks the five shipped owner recordings before
moving road actions from beat four to **beat one**. It does not use the old
button positions as evidence for the song's timing.

The recording grid is **128 quarter notes/minute, 4/4, origin 0.000000 s**.
One beat is exactly **0.46875 s**; one measure is **1.875 s**. Every first-beat
deadline is therefore `measureIndex * 1.875`, where the index starts at zero.
There is no extra count-in or MP3-delay offset to add. The first measure's
downbeat is at the start of the recording; the final measure's downbeat is
185.625 s, its fourth beat is 187.03125 s, and the recording ends at 187.5 s.

## Evidence and authority

The owner's September 23 arrangement correction specifies a four-bar intro,
then four 16-bar verses and four eight-bar choruses. The A/B labels are the
eight-bar halves of each verse. The recovered correction explicitly says to
use these section lengths rather than mistake pattern labels for sections.
`CACHE_ROAD_FULL_SONG_ARRANGEMENT.md` records this form. Those labels establish
the intended meter and sections; an automatic detector does not establish
them by choosing the loudest drum hit.

The actual MP3s provide independent timing evidence:

- FFmpeg gapless decoding returns **8,268,750 frames at 44,100 Hz** for each
  stereo source: exactly **187.500000 s**, or 400 quarter beats / 100 measures
  at 128 BPM. All five have the same start and sample count.
- An unconstrained search of the Pressure onset envelope from 0.25 to 2.25 s
  finds its strongest repeating interval at **1.875 s**, correlation 0.836.
  Its quarter-note peak is **0.469 s** at 1 ms measurement resolution; its
  four-bar repeat is **7.500 s**, correlation 0.749.
- The decoded Pressure attack begins at the recording's first sample region
  (first absolute sample above 0.005 is sample 1, **0.023 ms**). There is no
  25 ms silence before the music.
- Every subsequent measure's first 100 ms was compared with the same place
  in its four-bar drum pattern, keeping verse and chorus templates separate.
  **99 measured attacks** show **0.0 ms drift** at the reusable check's 0.5 ms
  search resolution; minimum normalized waveform correlation is **0.997418**.
  A separate 44.1 kHz correlation check found all section starts at zero
  sample lag and all measure starts within one sample (0.023 ms, including
  rounding of half-sample measure addresses). This includes the last measure.
- First-verse downbeats at **7.5, 52.5, 97.5 and 142.5 s** repeat at the same
  phase. Chorus downbeats at **37.5, 82.5, 127.5 and 172.5 s** also repeat at
  the same phase. Breakaway's second verse half is over 15 dB louder than its
  first half in all four verses, corroborating the supplied A/B section map.

The chorus kick has a different attack envelope from the verse kick. Its
largest amplitude arrives later even though its grid phase does not move.
Shifting the clock to the largest peak, or to an offbeat/backbeat, would be
a false correction. Timing targets must use the recording grid above.

## Exact section addresses

Bars in this table use the owner's one-based labels. End times are exclusive.
Each verse's second eight-bar half starts 15 seconds after its first half.

| Section | Bars | Start (s) | End (s) |
| --- | ---: | ---: | ---: |
| Intro | 1–4 | 0 | 7.5 |
| Verse 1 | 5–20 | 7.5 | 37.5 |
| Chorus 1 | 21–28 | 37.5 | 52.5 |
| Verse 2 | 29–44 | 52.5 | 82.5 |
| Chorus 2 | 45–52 | 82.5 | 97.5 |
| Verse 3 | 53–68 | 97.5 | 127.5 |
| Chorus 3 | 69–76 | 127.5 | 142.5 |
| Verse 4 | 77–92 | 142.5 | 172.5 |
| Chorus 4 | 93–100 | 172.5 | 187.5 |

## MP3 framing is not musical latency

FFprobe reports a container duration of **187.533061 s** and start time of
**0.025057 s**. The first MP3 packet carries **1,105 skip samples** in its
gapless metadata. FFmpeg removes encoder priming and end padding when
decoding, producing the exact 187.5-second PCM program. These container
values must not be added to `gridOriginTrackSec`, source offsets, or cue
deadlines. Doing so would apply a second, incorrect compensation.

Browser decoding remains a separate check: all five decoded Web Audio
buffers should have the same 187.5-second program length and share one audio
anchor. The road/input output-clock estimate handles device playback latency; the existing
input calibration handles residual controller/display feel. Neither changes
the tempo or moves announced road targets.

## Source identity and repeatable check

| Recording | SHA-256 |
| --- | --- |
| `cache-pressure.mp3` | `e2390841bb9aaac42e1814c8c949a1f7faafe63e286cdb160cc66a28f5c5d696` |
| `cache-drive.mp3` | `da967a6d0dec3adfd4886d0a9dc99f4ee09b49a51f3a70ca429d80c0b9946f34` |
| `cache-flow.mp3` | `2e1aaef56b242c525242b7f8bdb659beb3495207385053aec06c2a0a934a6060` |
| `cache-breakaway.mp3` | `4c40c7f67489d95f6e146bcfb024216863a6d13722c45a97291f0dd59b9f77ed` |
| `cache-undercurrent.mp3` | `9e7c6a4e3278eddd2a8ed5ab5b5c1b4bda40c957e1f18d7658e17bd2ffda9bb4` |

Run `python3 tools/check-cache-road-song-grid.py --json /tmp/Song-Grid-Checks.json`.
The check uses Python's standard library plus FFmpeg/FFprobe. It verifies
the production profile's grid, decodes the real files, measures periodicity
and repeated attacks, and records every measure plus stereo RMS by section.
It does not test a synthetic metronome or merely multiply the runtime's BPM.

This establishes the supplied recording's fixed grid and section map. It
does not certify Makko rendering, output-device latency, controller feel,
or the gameplay's physical contact plane; those need their own checks.
The older document's “provisional 128 BPM” wording is superseded by these
recording measurements. Quiet source sections remain selectable; section
RMS values are evidence, not a reason to restore the rejected availability
masks.
