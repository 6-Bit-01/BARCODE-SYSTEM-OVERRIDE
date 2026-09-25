# Cache Road cohesion audit — September 24, 2026

This follows merged PR #116 (`5c246b217397848b6dc8f24b5b1d20b94890ee79`).
The four face actions, two bumpers, lane names, five owner MP3s and fixed road
pads are the current playable prototype. The owner has **not** accepted its
pad pace, music balance or Makko feel. The crew vocal has no supplied recording.

## What the repeated drives showed

The production road update, collision handling, input actions and shared music
transport were driven in 25 ms steps with authored pad and traffic goals. A
native production renderer drew the road before and after a catch, at freight
and at the three-lane block. These were scripted control runs and native draws,
not human Makko play or an audio listening verdict. The simple avoidance driver
knows the authored chart, so its success is an upper bound for a new player.

| Route | Result | Pads | Peak parts | Four-part time | Contact |
| --- | --- | ---: | ---: | ---: | ---: |
| Stay near center, no pad actions | Failed at 18.4 s / bar 9 | 0 | 1 | 0 s | 3 |
| Hold brake, seek pads and gaps | Tape ended at 187.5 s / bar 100, 4,322 road units | 16 | 3 | 0 s | 0 |
| Hold throttle, seek pads and gaps | Lost signal at 144.8 s / bar 77 | 31 | 4 | 79.7 s | 3 |
| Cruise, seek pads and gaps | Lost signal at 171.6 s / bar 91 | 33 | 4 | 88.9 s | 3 |

The existing focused proof also steers through both planned four-pad runs
without damage, reaches four parts, tests both protected contacts, completes
the full 100-bar song with an explicit invulnerability fixture, and exercises
the final Echo gate and old saves. That full-song fixture establishes the
clock and exit path; it is not a fair-driving completion claim.

Three balance observations follow from those routes. Permanent braking
cannot deliver the original before the tape ends; slow speed needs a visible
short-term purpose and a readable pace warning. Good pad seeking can maintain
four parts for much of a run under the current eight/sixteen-bar holds, so
the full-stack payoff needs a shorter, authored high-pressure phase rather
than an almost permanent bonus. A late failure remains possible after a
long successful stack; retries, warning readability and earned defenses need
the next playtest. Twelve-bar and eight-bar consecutive hold trials reduced
four-part time but did not by themselves solve that structural issue. The
eight/sixteen-bar trial stays unchanged pending owner listening.

The caught-pad review found a separate concrete defect: a marking disappeared
up to 55 units before the car passed over its fixed position. The current
focused patch leaves the marking painted until it passes behind the car; the
caught state still prevents repeat rewards. The small top-right HUD now shows
an armed Push timer and Brace charge while active, so the two contact actions
do not disappear into an old transient message. These changes do not adjust
traffic collision, music gains, stem bytes, hold lengths or the save format.

## Working game loop

Read an upcoming traffic gap and a sparse safe pad as part of one road scene.
Choose lane and speed, press its face action on a beat, and let that success
add a recorded lane part over always-on Pressure drums. Spend Turbo or Echo
to survive a meaningful threat; use Push or Brace when contact is worth the
risk. A successful route raises music density, sky energy and driving stakes.
A hit breaks the earned mix audibly; a clear new pad starts recovery. A four-
part peak should lead into a distinct short road event and, once an aligned
recording exists, a crew-vocal phrase. Missing a pad remains harmless. Road
markings stay below opaque traffic and never form a constant floating stream.

## Seven-part plan and current status

1. **Road/contact — visual pass prepared:** road texture approaches the car,
   shadows follow individual tire contact, and gray ships face travel.
   Inspect in merged Makko after the native motion review.
2. **Vehicle rig — visual pass prepared:** recovered tire pixels remain on
   the road while Cache Back/freight chassis move on their shocks and a hit
   jolts the body. Art-specific contact, tread and rim alignment is in
   `CACHE_ROAD_VISUAL_CONTACT.md`; owner motion judgment remains.
3. **Traffic:** illustrated, animated scan/sweeper vehicles and at least two
   more distinct traffic vehicles. Give each a readable path and consequence.
4. **Roadside kit:** layered sidewalks, pedestrians, varied buildings,
   storefront moments and street props at believable scales and depths.
5. **Passing scenes:** curate the order and parallax of roadside episodes so
   they build a journey instead of an endlessly repeated backdrop.
6. **Adrenaline playtest:** tune pad spacing/hold duration, audio response,
   pace warning, x3/x4 pressure, defenses and retry through actual driving.
   Validate with sound and a physical controller in Makko after a merge.
7. **Enemies/routes:** expand audits, rival, evasion and route choices once the
   basic loop has a satisfying rhythm. Keep the original-recording delivery
   and the final Echo exit clear.

The art from #112–114 is in the repository. This visual pass addresses items
1–2; items 3–5 still need dedicated new art and composition. Reduced Motion
now holds decorative ship travel and frames, while plume review remains.
Earlier lane-renewal and resume-order notes need fresh reproduction against
the current pulse rule before any repair.

## Power-up list to develop within the existing six buttons

The four face buttons remain Surge, Push, Brace and Refill. Left bumper is
Turbo; right bumper is Buffer Echo. New power-ups should change these tools
or the road they act upon, not require more buttons or a pickup barrage.

| Interaction | Candidate payoff | What must be visible/audible |
| --- | --- | --- |
| Defense | Brace banks one clear impact; a stronger rare charge could protect a captured phrase. | A persistent charge on the car/HUD, a different contact sound, and the stack staying audible. |
| Offense | Push physically shoves a committed traffic vehicle aside or disrupts a sweeper. | That vehicle changes position/state before passing; its sound and gap match the result. |
| Traffic | A well-timed freight draft or Echo can alter a scan's target or open a short crossing gap. | A readable threat line, decoy/traffic reaction and a recoverable route. |
| Environment | A roadside relay can energize signs, light a safe service route or change a planned hazard. | The actual location reacts with depth and parallax; no screen-covering effect. |
| Song | An earned phrase latch or impact save holds one recorded lane part for a bounded number of bars. | Beat-aligned addition/release and a clear part-duration indication. |
| Lanes | A rare cross-lane move can carry one part while steering into the next lane's challenge. | One road-projected connection and a real earned transition, never a free lane sweep. |

For every candidate, author its placement relative to traffic and song form,
test whether it changes a decision, and keep a harmless miss. Existing Push
currently protects a contact but does not yet visibly shove a vehicle; that
traffic interaction is unfinished. Avoid promising crew vocals until a sixth
aligned owner recording is available. Keep the current four-bar intro, four
16-bar verses and four eight-bar choruses intact.
