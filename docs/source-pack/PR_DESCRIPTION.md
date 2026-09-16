Enemies are physically supported by the elevator roof, but its later draw covers their feet and lower bodies. Split the existing enemy render around the cabin so roof actors draw over it, including airborne approaches/departures. Other enemies retain their previous depth, culling and single draw.

The existing landing height, collisions, platform positions, four approved static bonks and all previous gameplay remain. Four native artwork previews show the corrected foot placement with the player inside the cabin. Focused production checks cover every enemy type on rising/returning lifts, transition depth and culling; existing roof physics checks cover player/enemies/boss at 30/60/120 Hz. Full local and CI results belong to the generated receipt.

The owner also asked for tutorial recommendations. TUTORIAL_FLOW_PROPOSAL.md documents the current timing/readability mismatches and a concrete 25-to-20-bubble proposal preserving the story. That proposal does not modify tutorial runtime.

Base/rollback: merged #73, 8fc2f8ea838d1dc901b97c7b7c93581459451ddf. No new runtime art or dependencies. Keep this draft for owner Makko review using ACCEPTANCE.md.
