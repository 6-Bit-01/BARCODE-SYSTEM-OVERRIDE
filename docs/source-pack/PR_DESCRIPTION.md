# Add the crew handoff and complete the Level 1 controls/readability pass

The whole-campaign plan is merged in #38. Level 1 still lacked a controller Rhythm Mode binding and complete menu/terminal navigation; crowd steering could override committed attacks, and the boss could advertise a spent stomp. Story presentation also needed a concrete example tied to the actual mission.

This combined pass adds the existing-art tutorial-to-street crew link and optional panel-margin setup/results callback; standard-pad routing through title, intro, tutorial, both hacks, pause/archive/calibration and results; protected crowd commitments including reinforcements; shared boss stomp eligibility; a consolidated HUD; restrained follow camera under cinematic priority; and saved, separate manual input/visual timing offsets.

Base/rollback: merged #38, `0d1882f6b6eebf6fc5704d8a3270f2a6b1fb7354`. No new runtime art URLs, dependencies or music. The original prologue, three authored lore records/IDs, movement kit, mission quota, lift, Jammer, damage/timing windows and boss balance remain. The optional caption discovery is run-only; campaign services and later levels are Stage C onward.

Validation includes the full production suite and all-file syntax plus focused scene/music isolation, real controller puzzle input, saved-offset/camera/crowd/stomp checks and visually inspected native Canvas layouts. See the generated export receipt for exact tested revision/results, STORY_CONTROLS_PASS for the complete controller map and ACCEPTANCE for the Makko route. The baseline update records new script owners/indices; existing menu coordinate assertions now match the added row, and objective layout is checked through production drawing.

Makko acceptance is pending. In particular, check browser audio activation, controller tutorial flow, direct hack-digit ergonomics within the existing four-second window, live HUD/camera feel, calibration, and the full mission/Jammer/boss/retry/restart route. This draft does not merge or deploy the gameplay changes. After acceptance: Stage C campaign adapter, compatible save extension and independent second-song mixer proof.
