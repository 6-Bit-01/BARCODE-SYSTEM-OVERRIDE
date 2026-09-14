# Make Makko load the published replacement sprites

After merged #47, the background and HUD updates appeared but the player and enemies still used Makko's old sprites. The active initializer accepted any loaded Makko registry and requested the host-owned relative manifest. A player created before Start could also retain an old sprite clone.

- Load the existing immutable manifest from the #47 merge, with its already-published artwork URLs.
- Reuse a loaded registry only when all twelve replacement image/JSON pairs match, then rebind the existing player after loading.
- Give cold atlas downloads sixty seconds and clear the timeout after completion.
- Replace the unused legacy-startup assertion with regressions against the active initializer: cold, old, mixed and current registries; concurrent startup; player rebinding; and timeout cleanup.

The actual saved Makko SDK was also exercised with decoded local atlas bytes: old registry replacement, all twelve clips, and production player/enemy drawing passed. Diagnostic sources and a contact sheet are included. This verifies the SDK boundary but does not certify live host import, browser networking, audio or playtest feel.

No new artwork or gameplay changes. Existing background, HUD, mechanics and deliberately retained boss walk/flourish and traffic remain. Base/rollback: `8f09568eeb9726f7b80fb43e1ecb3f6e4672bea2`. One combined draft; owner Makko review follows the top route in `docs/source-pack/ACCEPTANCE.md` before merge. Full-suite, syntax and current-head GitHub results are recorded on the PR and generated source receipt.
