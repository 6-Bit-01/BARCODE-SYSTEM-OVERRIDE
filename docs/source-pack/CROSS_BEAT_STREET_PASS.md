# Cross beats, hack popup and street polish

Approved continuation based on merged PR #63 (`c6dc0116d08a70ca2c97edddb9404bd87e62906a`), branch `agent/cross-beat-hack-popup`. One draft, not accepted in Makko. The exact reviewed commit and PR are generated in SOURCE_MANIFEST/test-evidence, not guessed here.

## Controls

| Control (default DualSense) | Result |
| --- | --- |
| Cross (×) outside Rhythm Mode | Normal variable-height jump |
| Cross (×) inside Rhythm Mode | One beat attack per press |
| Down + Cross on a platform | Fall through that support; exit Rhythm Mode if needed |
| Triangle | Hack / release ally |
| L1 / Circle | Toggle Rhythm Mode / contextual exit |
| R1 | Inspect |
| Create / Options | Crew dialogue / pause settings |

Holding Cross across a stance switch cannot create a new jump or attack. Existing default Cross-jump/Square-beat saves migrate to the new default without resetting deadzone, label preference or vibration; saved version-2 custom layouts retain Square if deliberately chosen. Jump and beat are the only actions allowed to share a gameplay button. Contextual menus, keypad and dialogue ownership stay unchanged. Down is D-pad down, positive left-stick Y, keyboard Down or S. Keyboard jump remains Space/W/Up and keyboard beat remains Down. Down alone is not a drop. Dropping consumes the jump edge and clears its buffer/coyote time; only the departed surface is ignored, capped at one second or body clearance, and the street cannot be dropped through. Holding the chord does not repeatedly fall through stacked platforms. Paused, disabled and cinematic play cannot start descent.

## Hack notice

The former persistent multi-state panel is replaced by `[mapped hack key] HACK READY` in the top gap, clear of the health/rhythm/Amp stack. It appears only when the same authoritative hacking gates report a grounded, unlocked, charged action with a valid target. It holds 1,800 ms, fades over 600 ms and disappears. Staying ready does not repeat the notice; becoming unavailable for at least a second rearms it, as do use/cooldown/link states. Starting the terminal or losing readiness hides it immediately. Pause freezes its clock; reset clears it. The existing ten-second cooldown, 1.5-second lost-target cooldown and eight-second ally life are unchanged. The world ally countdown remains; there is no permanent HUD recharge/NO TARGET panel.

## World presentation

Owner continuation: relocate the rhythm lift to x=2440, y=856→358 at the middle-right Firewall canopy, with `destinationSurfaceId` owning both the landing and boss pursuit target. The single illustrated terminal moves to x=690, top y=650, on the left; its established collider ID stays stable. The terminal-to-first-awning entry route and lift-to-canopy transfer pass at 30/60/120Hz. Upper routes still connect across the district. Right-half Jammer spawn candidates move to 3100/3520/3820 to keep all three random positions clear of the relocated lift's full attack range; the three left-half slots stay unchanged. No extra box or elevator is added.


The back sky now covers the inverse viewport, including camera height, zoom and shake, instead of exposing the black clear beyond a fixed rectangle. The foreground building source still excludes its opaque top export seam. No roof/collider coordinates moved.

The Jammer was applying old foot offsets to already registered artwork, and its 48 drawings also change the housing outline. The new presentation draws the existing complete first pose through the shared raster cache, fixed to the original sidewalk anchor. Screen light and slow transmission arcs provide motion without shifting the body. The fallback loses the legacy foot offset too. Health, 16 on-beat hits, aim bounds, mission quota (20), destruction and music ownership remain. Its health/title/control guidance is above the dish; the control label follows the selected mapping.

Generated asphalt: `assets/wet-street/rain-blacktop.webp`, with the full prompt and tool provenance in that folder's README. Built-in ImageGen; no new Jammer art. Asset ancestor `6e1c8a4eb58252e1491dedc7878630dbab14929a`. The Jammer source is pinned to the current base. Road texture fills only below y=890, clipped to the view, with alternating horizontal tiles to match edge pixels; no per-frame filters or new canvas owners. The existing sidewalk, rails, collision, original car behavior and three-second WATCH OUT warnings remain.

## Validation and limits

`check-level-01-story-controls.js` exercises production input and player updates: shared Cross contexts, held transitions, remaps and saved-layout migration, real hack popup lifecycle, D-pad/stick/keyboard/Rhythm-Mode drops at 30/60/120Hz, lower-platform landing, no held repeat, solid street, pause and reset, moving lift release, full sky coverage at zoom 0.4/0.6/1/1.25 and camera 0/-1040, fixed Jammer body through its previous loop. Existing full regression and syntax gates are required before publication. The generated final receipt contains actual outcomes and GitHub CI.

Native review uses production Canvas rendering and bundled artwork with adapted image/Makko boundaries. `HACK_POPUP_REVIEW=1 node tools/render-level1-rebuild.cjs <output>` produces the settings and ready/fading/cleared scenes. `SCENE_POLISH_REVIEW=1` produces street/Jammer and roof/zoom scenes plus four seconds of the stable Jammer; `STILLS_ONLY=1` skips video. Verification WebPs are retained in this pack. These are not physical-controller, audio or hosted Makko captures. Earlier #62 automated checks did not prove its controls worked; the owner failure remains recorded. v64's 367 exported source files matched the merged #63 tree before this update; its original manifest and receipt are preserved unchanged in the history record.

## Owner Makko route before merge

1. Re-import this draft. In playable training and the street, hold Cross for the normal full jump. R1 must inspect. Create must advance speech without stealing movement.
2. L1 enters Rhythm Mode. Cross hits beats; Square does not under defaults. Hold Cross while toggling/using Circle to leave, then release and repress: no phantom beat or jump. Try a custom remap and reload.
3. Approach a target while charged: the top HACK READY notice appears and fades. Hack, cancel/recharge and approach again. Airborne, no-target and cooldown should leave the playfield clear. Pause/resume must not replay the notice.
4. Jump from street onto the left terminal and then the first awning. Ride the relocated middle-right lift to Firewall canopy, step off and let it return; try the boss pursuing you there. Stand on Tower roof over its awning. Down + Cross drops to the awning; holding does not pass through it too. Release and repeat to descend again. Try D-pad, stick, keyboard and lift; street stays solid.
5. Travel from street to highest roof at normal and wide zoom: inspect the top edge and camera motion. Inspect wet asphalt at both ends of the world and the old car warning heights/directions.
6. At the Jammer, inspect its steady housing, signal motion, readable label, correct 16-hit progression and the normal boss handoff. Complete/retry/restart to check state reset.

Rollback is merged #63. Next milestone is owner playtest acceptance and any concrete corrections, then merge/rebuild from the actual merged SHA. No acceptance is inferred from passing checks.
