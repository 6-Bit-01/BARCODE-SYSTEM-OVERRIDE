# Shared reading controls and stronger speed presentation

## Owner request — October 1, 2026

The owner reports different dialogue and scene-skip features in later
cutscenes and requests the same layout, functions, behavior and appearance
throughout. The owner also requests painted wind/whoosh/screen assets,
stronger zoom and dynamic camera movement, and a faster visual road without
changing speed or mechanics. This direct implementation request supersedes
the earlier maintenance-only automation scope for this branch.
Base/rollback is merged PR #164, `3e9bfa1c517a618ca7a16e7073aeb17969f0aaab`.

## Common reading contract

All eight opening panels, eight bridge panels and four delivery panels use
`IntroSequence.controls`, `drawControls` and `drawTranscript`: identical
normalized hitboxes, mint outlines, disabled states, lettering and hold meter.
The existing authored pictures, balloon positions, story, cue clocks and
sound cues retain their roles. Opening monitor/gutter cues remain authored
story content; their discovery input is preserved.

| Action | Keyboard | Controller | Behavior |
| --- | --- | --- | --- |
| Dialogue | Space | A | Reveal one authored cue; never change page or launch play |
| Scene | Enter | RB | Available after the last cue; advance one scene |
| Transcript | T | X | Full current-page text; freeze reading/effects and cancel skip |
| Pause/Resume | P | Menu | Same reading overlay; hold position and pause runtime audio |
| Skip | Hold S for five seconds | Hold B for five seconds | Release cancels; go to final reading position only |

The pointer toolbar supplies dialogue, scene, transcript and pause actions.
The skip hint explicitly names the keyboard/controller hold. On the final
page, Scene becomes Enter district, Drive or Finish chapter. It always needs
fresh input after a skip. Repeated/held buttons cannot cross handoffs.
Independent physical skip holds cannot inherit time from one another.
Bridge/ending reading saves and chapter/result/reward schemas remain intact.
Escape/View retains the existing later-chapter return-to-results affordance;
that campaign boundary is not an extra toolbar button. Development shortcuts
remain outside the public toolbar.

Opening reading uses its existing owned DOM and timer because it precedes
runtime startup. Bridge/ending retain the shared Canvas, input, RAF and
runtime lifecycle. Paused bridge/ending input belongs to the reading toolbar,
with the same Resume action as the opening, rather than exposing a different
pause-menu layout. Gameplay pause settings remain available during gameplay.

## Speed presentation

A six-cell transparent painted atlas contains three wind ribbons, a pass
whoosh, suspended mist and a corner pressure slash. Four wind ribbons, two
corner slashes and at most one pass whoosh draw at the viewport edges. The
mist source cell is retained for future art use and is not an extra live
layer. There is no second scene copy, extra blur, particle list, offscreen
canvas or FX timer. Missing art falls back to the bundled identical file.

The camera reads existing speed, steering, Turbo, pass and collision state.
Its maximum zoom is 1.154, with bounded translation/roll; the dashboard,
rearview and timing UI stay outside the camera transform. World-addressed
asphalt glints are denser and longer while using the same progress/projection.
Distance, actual speed, encounter sockets, beat/strike timing, judgment,
collision, difficulty, abilities, rewards, saves and five music sources do
not change. Exact rearview `blur(2.3px)` is retained.

Reduced Motion and flashes-disabled modes remove the new moving paint and
live camera movement. The established start-line static reduced zoom remains.

## Evidence and acceptance

Production-owner checks exercise cue/page separation, final actions,
transcript/pause, held inputs, staggered skip sources and thrown audio-pause
recovery. Pure production render helpers are checked across 60 combinations
for bounded camera/draws, center-lane clipping, Reduced Motion and state
immutability. Existing full races still test every gear/difficulty and actual
damage. Native production scene renders check real text/art clearance.
`review-shared-cutscenes-speed/` contains scripted local visual evidence;
it is not a Makko recording or human playtest. Exact tested head, full suite,
syntax and GitHub CI outcomes belong to the PR/generated receipt.

Makko/browser delivery, physical-controller reading behavior, stronger camera
comfort, audible pause/resume and frame pacing need owner acceptance on the
actual imported build. The earlier partial PR #161/#164 test attribution is
historical and must not be relabeled as acceptance of this branch.
