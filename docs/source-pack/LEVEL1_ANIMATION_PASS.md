# Level 1 walk-in and animation pass

October 2 owner request, based on merged #174 at
`b4de6cc624d77dcc030e70818c2fb05e25bc2240`.

The opening now uses the same registered walking artwork and 300-unit/second
gait as ordinary play. The complete sprite starts beyond the actual inverse
left viewport and reaches the original x=200 street spawn in about 1.06 seconds
at opening zoom. Simulation delta owns this movement. Pause and difficulty
selection freeze it; gameplay inputs cannot interrupt it or earn tutorial
credit. Fresh starts/restarts replay it, while checkpoint restores and tutorial
deaths use ordinary spawns. Previously completed tutorials start the mission
and write its initial checkpoint only after arrival.

The sprite audit identified actual frame-zero/frozen routes separately from
construction variants and deliberate combat poses. Existing canonical PNG/WebP
bytes, calibrated feet, source frame durations and model identities are retained.
No new artwork, playback timer, RAF, listener or Canvas owner is introduced.

| Presentation | Deliberate cadence and visible change |
| --- | --- |
| 6 Bit idle | Native clip at 0.85×; foot-pinned 2.3-second breath and 3.4-second weight shift |
| 6 Bit walking | One-second sixteen-pose stride at normal speed; cadence follows actual velocity |
| Rhythm performance | Existing gestures fit two quarter beats of the live song tempo |
| Jump, hack and landing | Existing physical/session phase selection; combat and landing durations remain authoritative |
| Virus / Corrupted / Firewall | Distinct 1.4× / 1.1× / 0.9× idle policy; Corrupted walks follow velocity, Firewall keeps its registered distance stride |
| Committed enemy/drone poses | Corrupted warning uses native idle movement; drone engines retain a faster four-cel loop during held warning/fire bodies |
| Boss | Slower 0.8× idle; walk cadence follows cinematic/combat approach speed; leaps/flourishes keep physical phase ownership |
| Jammer | All 48 registered native cels at 0.72×, approximately 5.5 seconds per loop, with visible transmission accents |
| HUD portrait | Shoulder-anchored breath/weight motion with condition-specific 1.6–3.4-second cadence; neutral blink retains the selected face |
| Flying traffic | Three craft at 28.75/20/25 effective FPS; foreground motor loops run 20% faster |
| Terminal / platform hardware | Continuous waveform and display scan; distinct embedded lamp/front scans by construction variant |
| Gate / lift | Active, cleared and standby hardware each keep slower/faster local status cycles without moving their supports |
| Repairs / Amp / sky caches | Stronger bob, heartbeat and glyph activity; collected receivers keep a slower status loop |
| Studio Cat | Readable 4.2-second look/blink/paw take with anchored breathing; original one-time pounce and reward retained |
| Inspection props / atmosphere | Separate maintenance scans, route pulses, paper flutter, cable drift, signs, steam, windows and pavement reflections |

Platform facade frames are different constructions; gate frames are powered/off
states. They are not cycled as interchangeable animation cels. Moving details
remain on their painted machinery or fabric. Large architecture and collision
geometry stay registered, with local displays/reflections providing activity.

Reduced Motion disables added decorative breathing/transforms and retains
semantic movement/combat cues. Reduced Motion and Flashes Off steady optional
light, portrait, scenery and machine effects. Pause freezes shared presentation
clocks, and repeated drawing cannot advance animation or mutate gameplay.

`npm run check:level1-animation` combines actual entrance/lifecycle checks,
Jammer/atmospheric checks and native Canvas production rendering with prepared
RGBA cels. Native review distinguishes cel changes from code-drawn local motion
and records source hashes. The public Makko playback fixture and controlled
Canvas/input hosts do not establish owner Makko import, listening, controller
comfort, human success rate or device FPS. Full regression, all-file syntax and
both exact final-head CI events remain the publication gates under existing
authority. The generated source receipt records actual tested/merged revisions
and final results; historical captures retain their original hashes.
