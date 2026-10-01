# Break the Pursuit

## Authorization and checkpoint

The owner approves the broader overhaul after the separate camera/wreck
repair and gives creative freedom to make the game better in one PR.
Merged PR #167, `f385c919bedbf228f8ee5bf1d708ecb57d151178`, is the
checkpoint and rollback. The old finale is explicitly scrapped for fresh
runs. This direction supersedes earlier presentation-only and preserve-exit
limits for this work. It does not establish a new named villain or replace
the original recording, delivery story or Mac handoff.

## Playable arc

Fresh campaigns use encounter version 3. Scouts challenge the courier at
bars 16, 34, 50 and 62. Convoy traffic and the existing earned music abilities
build into a continuous enforcement rig at bar 72. Civilian traffic ends
before its approach; musical offers continue through bars 90–98.

The rig has a scan array, impact drive and pulse core. Six committed attacks
at bars 76, 80, 84, 88, 92 and 96 provide repeated counter openings. Wait for
the lane lock, then make a clean dodge: the attack overloads its own system.
Push, Brace, Turbo contact and a committed Echo deception offer alternative
counters using genuinely earned resources. Marginal escapes avoid damage
but do not earn a counter. Each system breaks once, and a destroyed rig can
neither deal damage nor award another counter.

Delivery requires all three systems broken and the complete 100-bar source
recording. There is no fresh-run Echo-left/right exit gate. A defeat checkpoint
preserves the clear runway; the destroyed rig slows at its actual world
address, the player passes it and it enters the existing rearview. Ignoring
every counter fails normally and retains the production retry route.

## Presentation and foundations

Eight transparent painted rig poses show the scanner, broken scanner,
ram, shattered armor, exposed core, core impact and wreck. Six matching
effect cells provide sparks, armor, debris, skid, exhaust and core burst.
Current runtime uses system-break effects and physical Turbo exhaust;
unused cells are available source art, not additional implemented mechanics.
The two lossless runtime atlases total 3,593,634 bytes. Originals, prompts,
cell geometry and hashes are retained under `assets/cache-road/pursuit/`.
Hosted imports use immutable art ancestor
`c9ec41555ff7c473fb4119eb68a1438cebe4bd37`, with bundled fallback.

The repaired trailing camera remains; it eases wider during committed danger
so the road address remains readable. Rig health and lane cues sit outside
the moving viewport. Reduced Motion suppresses new moving effect paint and
keeps the established neutral camera. Existing crop warnings, steady HUD,
exact rearview blur and shared cutscene controls remain.

Music remains five original synced stems, 100 bars at 128 BPM. Beat ONE,
immutable announced pad locations, next-ONE gear changes, first-gear wreck
recovery, four lanes and the shared input/RAF/audio owners remain. No new
render loop, canvas, input listener or combat button is introduced. Versions
1 and 2 are retained for old saves and keep their historical exit rules;
all nine version-2 charts are hash-checked against merged PR #167.

Boss checkpoints preserve actual system damage, counter attribution and
physical position. Resuming discards a partial attack and waits for the next
complete warning. Invalid damage/counter combinations, forged delivery and
future versions are rejected rather than promoted into a win. Camera and
effect momentum are transient presentation, not saved progress.

## Rendering work

Sorted world indices query only visible street parts, courts, mouths and
mirror streets, preserving source object order and exact geometry. A bounded
per-frame memo shares exact terrain samples between road and mirror. The
equivalence audit covers 2,340 range queries and 26 production front/rear
frames, including locked boss attacks. It returns 8,954 candidates instead
of visiting 282,056 street records (96.8% fewer); 6,051 of 14,195 height
requests are reused (42.6%). These are operation reductions, not FPS claims.
The audit compares geometry, image submissions and native vector/HUD pixels
against the same renderer with its full-scan/uncached path. Its historical
PR #167 comparison is separately attributed.

## Verification and acceptance

The final receipt records the exact tested revision, full regression,
all-file syntax, production-input races, browser results and both CI events.
Focused tests exercise ordinary-steering wins, powered alternatives, missed
opportunities, actual damage/recovery, checkpoint reload and rejection,
legacy charts, painted anchors and rendering equivalence. Browser screenshots
that stage presentation states are labelled separately from earned races.

Owner Makko import, physical controller feel, sound, boss difficulty/fun,
warning clarity, motion comfort and device frame pacing remain pending.
Prior owner observations and revision-attributed tests remain historical;
none is silently upgraded to acceptance of this overhaul. No Makko project
modification or deployment is part of this PR.
