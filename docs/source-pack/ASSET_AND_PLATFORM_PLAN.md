# Art, presentation and platform production plan

## Stage B asset status

The representative sequence now reuses existing SO6/SO8/SO10 elements from the loaded prologue. No runtime art, asset URLs, portraits, music or dependencies are added/replaced. Sheila is intercom-only. Code-native panels and a loose caption provide the first prototype; native Canvas layout diagnostics are review evidence rather than new game assets. Browser standard-pad coverage is implemented for Level 1; physical devices, mobile and standalone remain unverified/deferred as described below.


## Existing assets first

The original intro and Level 1 contact sheets in attached v4 were visually inspected for this continuation. They identify a usable control-room/screen/interference/6 Bit/tower sequence and the established skyline, street frontage, three traffic types, fragment, Jammer and title art. These historical sheets are not a current host-availability test, not a complete frame inventory and not proof of every needed crew pose.

The current title art already depicts 9 Bit; the tutorial names him. Story suspense must account for that rather than assume a hidden identity. The old 11-image/12-subtitle mismatch is a source finding to reconcile during the intro script pass, not permission to silently append an old finale line. Current cutscene indexing should be reviewed against the exact chosen script.

The user reopened the intro/story direction after the older art lock. This authorizes developing a replacement treatment and testing selective changes, not a speculative mass replacement of approved art. Current image URLs, sprite calibration and music remain the source baseline until their actual scene change is reviewable.

## Asset work by production stage

| Stage | Reuse/code-native work | Order only after the proof shows a gap |
|---|---|---|
| Representative intro/transition | Existing control-room, crew screens, 6 Bit and tower art; panel masks, framing, caption animation, channel overlays and current sounds | One specific group/interaction shot or expression if existing crops cannot tell the action |
| Level 1 improvements | Existing sprites/props, code-native HUD, aim/counter cues, timing calibration and camera prototype | A needed readable pose or small cameo/rat prop, measured in the actual scene |
| Crew communications | Text/nameplates, current screen art and silhouette treatment | Approved portrait/expression exports when justified; Sheila stays silhouette-only |
| Contra proof | Existing side-view systems, temporary geometry and modular effect/weapon placeholders | Small original enemy/weapon/venue kit after collision, camera and aiming are fixed |
| Road proof | Procedural road, simple traffic geometry, current scenery as references | Rear-view lead vehicle states, small obstacle/sign/horizon kit; current side-view traffic is not assumed suitable |
| Puzzle proof | Canvas grid, shape-plus-color pieces and symbol feedback | Small DJ reaction set and original puzzle objects after branch/rules are settled |
| Sample RPG proof | One settlement/route/battle loop, four placeholders and 6–8 Sample families maximum | Four crew sets and the minimum proven family art; no large creature catalog |
| First-person proof | Raycaster/walls/door/switch/billboard placeholders | Small texture/enemy/door kit, Mac HUD/weapon overlays at proven scale |
| Finale | Reuse first-person renderer, prior props and motif registry | 9 Bit states, final scene and ending assets only after confrontation/resolution design |

Every asset card includes stable ID, purpose and exact scene, dimensions, on-screen size, transparent bounds, anchor/contact line, named animations/frame requirements, palette/reference, supplied contribution/credit and acceptance image. Never make the owner guess what size the renderer needs. Preserve 6 Bit’s established face/cap/glasses/makeup and the distinction from DJ Floppydisc.

## Audio dependencies

Keep the current song/transport and restored SFX working. Before the second gameplay song, change the adaptive mixer to resolve profile-owned source roles and demonstrate it with source names unlike Level 1's. Verify the actual song's metadata or explicitly use no-grid/marker-only behavior; do not inherit 146 BPM, 4/4 or the 211-second Level 1 compatibility loop.

Tempo/meter changes and cue maps are planned capabilities, not automatically supported by the fixed-grid/no-grid implementation. Implement only what the next supplied track needs, including pause, loop/end and return-to-level behavior. Check current unequal stem lengths against actual exports during the audio milestone; do not guess missing samples or silently retime approved music.

The six guaranteed keys map to layers in a separately authored compatible Full Mix arrangement. Later songs are not overlaid. New comms stingers, fake ads, collaborator clips or sample material require actual appropriate assets; visual inclusion of a collaborator does not fabricate an audio contribution.

## Desktop and controller

Current keyboard gameplay is the baseline. Gamepad movement/jump/primary/interact/pause bindings exist, but Rhythm Mode has no default binding and menu/intro/hack/archive navigation needs a complete path audit. Finish semantic actions, release/consumption rules and truthful binding labels before declaring full controller support. Hardware input, vibration, audible timing and game feel require real-device review.

Consolidate the HUD and add measured camera/calibration improvements while preserving current mechanics. Keep display offsets distinct from scored input timing. No new movement power is required to make the game more readable.

## Mobile feasibility retained, migration deferred

The recovered review proposes a small mobile proof before expanding a whole level. The user’s interest does not establish a supported device list, touchscreen design, App Store release or selected replacement engine.

Use one representative slice to test:

- one encounter, simultaneous direction/jump and opposite-direction behavior;
- a roof/lift approach and pickup with readable scale;
- R entry/exit and judged taps without touch events being delayed or duplicated;
- both existing hack puzzle types, including number entry/submit/cancel;
- pause, app-switch/audio suspension/resume and loss of focus;
- archive navigation, readable text, saved settings/discoveries and reload;
- useful frame/memory/loading measurements on an actual target phone.

Reuse the semantic input boundary for a proposed touch layer. An on-screen joystick alone is not a mobile port. If host/runtime constraints or control feel fail the slice, report the demonstrated limit and return to desktop progress; do not start an engine rewrite as an implicit fallback.

Standalone migration was explicitly deferred during the recent gameplay work. Revisit after a preserved accepted baseline and this bounded feasibility result, with concrete host dependency, asset-delivery, input, audio and deployment requirements. The current Git snapshot relies on Makko's engine and external assets and is not an offline product. No current engine/platform recommendation or fresh external pricing/capability research is claimed by this plan.

## Next reviewable visual result

Create one representative crew/panel sequence using existing art with a complete beginning, action, joke/disagreement, exit and mapped later payoff. Compare it with the current intro-to-Level-1 flow. Then request only the exact missing image/pose and proceed with the rest of the script. This makes the new direction visible before committing to a large redraw or production pipeline change.
