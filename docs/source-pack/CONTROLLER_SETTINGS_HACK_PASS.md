# Controller settings and hack availability

Approved by the owner's “let's do the settings pass” request, including a visible refill display. Base/rollback: merged PR #61, `91bc4917462062056ebe2cec7d01b89783d81850`. Branch: `agent/controller-settings-hack-meter`. Exact review head, PR and CI belong to the generated source receipt.

## Default controls

| Action | DualSense | Xbox / standard fallback |
| --- | --- | --- |
| Move | Left stick or D-pad | Left stick or D-pad |
| Jump | Cross | A |
| Beat attack | Square | X |
| Hack / release ally | Triangle | Y |
| Toggle Rhythm Mode | L1 | LB |
| Inspect / collect | R1 | RB |
| Exit Rhythm Mode / contextual back | Circle | B |
| Pause | Options | Start |

Cross no longer doubles as attack. Beat attacks retain their existing Rhythm Mode and timing gates. Circle exits Rhythm Mode but does not enter it. During crew dialogue, confirm advances text and the right bumper jumps; inspection is suspended. Menus use confirm/back and D-pad/stick navigation. Hack keypad uses confirm to select, Square/X to erase and Circle/B to cancel. Intro skip remains a hold, separate from advancing dialogue. Prompts use the active controller's labels.

Pause → Controller settings provides a 10–50% stick deadzone (default 20%), automatic/PlayStation/Xbox prompt labels, vibration toggle, five gameplay remaps and reset. Assigning a used button swaps its old action instead of duplicating it. Circle/B and Options/Start remain reserved for contextual controls. Capture waits for confirm to be released; held captured buttons cannot trigger gameplay on resume. Preferences save in browser storage; a save failure is displayed and current-session controls keep working. Unknown mappings are not guessed: the settings page reports an unrecognized controller. One standard controller stays selected until disconnected; inputs from two pads are never combined. A 5% release margin prevents stick threshold chatter.

## Hack display

The existing Comic HUD renders a compact meter beside Amp and below the expanded Rhythm Mode panel. The same read-only availability function governs both this display and actual hack start.

| State | Display / behavior |
| --- | --- |
| Ready | Full green bar, READY and target in range |
| Recharging | Purple filling bar, remaining seconds |
| Charged without target | Full muted bar, NO TARGET and move near an enemy |
| Airborne | LAND FIRST; underlying charge remains visible |
| Tutorial locked | LOCKED, unlocks during crew training |
| Hacking | HACKING / solve the uplink |
| Active ally | RELEASE, ally countdown and press to release |
| Temporarily unavailable | STANDBY |

The meter does not grant a power or consume charge. Normal cooldown remains 10 seconds; a successful solution whose target was lost retains its 1.5-second retry. An active ally can still be released during cooldown. Ally duration remains eight simulation seconds. Cooldown uses the pre-existing wall clock, so it continues during pause; ally time freezes with simulation. Tutorial bypass and target eligibility are preserved. The display is hidden during cinematics/results; the pause screen owns paused UI.

## Verification

- `npm test`: full production-module regression suite passes, including existing combat, mission, boss, walking, street depth and upper routes.
- `npm run check:syntax:all`: all repository JavaScript passes.
- Story/control harness: saved/corrupt/blocked storage, both label styles, stick threshold/release, remap swaps, actual remapped jump, capture and held-release behavior, standard-device selection/reconnection, no two-pad input merging, both real hack puzzles and all readiness gates.
- Native review: `CONTROLLER_REVIEW=1 node tools/render-level1-rebuild.cjs /absolute/review-directory` renders production menu, remap capture, six real hack states and expanded rhythm layout. Review images are under `verification/controller-settings.webp`, `verification/controller-remap.webp`, `verification/hack-availability.webp` and `verification/hack-rhythm-layout.webp`.
- Synthetic gamepads and native Canvas do not establish physical DualSense feel, browser vibration support, hosted storage or Makko acceptance. CI results are recorded in the exact-head receipt.

## Owner Makko route before merge

1. Import the exact draft head into a fresh preview. Connect the DualSense, press a button, and check Cross jump, Square beat attack, Triangle hack, L1 rhythm, R1 inspect, Circle back/exit and Options pause.
2. Open Controller settings. Adjust deadzone to remove drift; remap jump to a shoulder/trigger, then assign an already-used button and verify both swapped prompts/actions. Hold the assigned button while resuming: no accidental jump/attack. Release and press again. Reset defaults.
3. Check automatic PlayStation labels, forced Xbox labels, vibration off/on when the browser supports it, and preference persistence after reload. Unplug/reconnect in gameplay and pause without phantom input. Check D-pad and stick menu movement.
4. Finish and separately skip the intro. Check crew confirmation/right-bumper jump, both hack keypad practices, pause during hacking, archive, boss retry and restart. No confirm press should leak into movement or combat.
5. Near an eligible enemy, confirm READY. Start/cancel a hack and watch the bar refill and timer reach zero. Move out of range to see NO TARGET, then return. Jump to see LAND FIRST. Solve a live hack, see the ally timer, and release early with Triangle. Check the meter beside Amp with Rhythm Mode on and off.
6. Replay rooftop/boss movement and a long walk to ensure the merged walk repair and upper-route behavior remain intact. Record actual SHA and PASS/FAIL. Merge only after owner acceptance; after merge import the actual main SHA and repeat the focused controls/HUD route.

Rollback to the base SHA above removes this pass while preserving the merged walk and upper-route work. Historical test and archive receipts remain preserved; no fresh Makko acceptance is claimed.
