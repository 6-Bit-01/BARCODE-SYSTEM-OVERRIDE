# Level 1 playtest improvements — approved scope

Base/rollback: merged #54, `8b0a8b2af005408d137421bd3f241a080ea23627`.
One combined PR on `agent/level1-playtest-improvements`; implementation is complete for review and has not passed owner Makko acceptance.

1. Separate dialogue advance from next-scene actions, including keyboard, controller and pointer. Preserve deliberate S/B whole-intro skip and input ownership.
2. Recognizable heart-emblem health capsule, matching carrier marker and existing health-bar feedback. Owner correction: no text labels on these pickups.
3. Correct player/enemy side overlap independently of damage cooldown; preserve descending ordinary stomp and readable recovery. Check walls, crowds, platforms, hack guard and hijack expiry.
4. Author facade attachments and add building-mounted emitter/panel hardware, sidewalk bases and local barrier contact/crossing effects. Preserve unlock/collapse mechanics and cover the playable vertical range.
5. Lower the shared street walking plane about 34 world pixels; align actors, feet, collisions, lift, spawns, boss and shadows.
6. Add a permanent Objectives heading and improve tutorial/action attention with restrained competing prompts.
7. Connected upper routes across all four encounters, single-jump access/return paths, platform-aware hostiles/allies, rewards and warned world-space traffic hazards. Keep 20 mission defeats, three-bar health, two-hit lift, 16-hit Jammer and boss checkpoint. Reuse existing aerial enemies initially; a genuinely new enemy design remains optional.
8. Visible shared hack keypad with pointer/touch and controller navigation; retain direct numeric typing, both puzzles, 40% hostile slowdown and eight-second hijack. Account for slower navigation without shortening memorization. Full touch movement controls are separate.
9. Give the climbable utility box a perspective-correct top/side and contact shadow.
10. Repair Firewall backward walking, frame-to-frame speed changes, duplicate integration and animation/facing stability without regenerating accepted artwork.

Additional small improvements from the approved proposal may include instant-text preference, recent crew dialogue in pause, and a delayed last-enemy direction hint. Preserve cue IDs, saves, lore/discovery facts and independent music transport.

Build order: contact/walking plane and Firewall; controls/health/objectives; connected upper routes; barrier/traffic presentation; production-code checks and native/browser review. Existing automated checks do not prove hosted Makko feel, gamepad hardware or audio. Before merge the owner imports the exact review head into a fresh preview and checks the full novice/controller route. After merge, import the actual main merge SHA and repeat that route, recording SHA, PASS/FAIL and a clip for failures.
