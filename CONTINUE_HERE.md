# Continue here — Makko sprite loading

Updated September 14, 2026. Read this before the source-pack history.

- Repository: 6-Bit-01/BARCODE-SYSTEM-OVERRIDE.
- Base/rollback: merged PR #47, `8f09568eeb9726f7b80fb43e1ecb3f6e4672bea2`.
- Current repair branch: `agent/fix-makko-sprite-loading`; its PR identifies the exact published head and CI results.
- Owner report: new background works, but Makko still uses old player/enemy sprites. Merging #47 did not constitute acceptance of that behavior.
- Cause: active startup accepted any loaded Makko registry and requested the host-owned relative manifest; the player could already hold an old clone. The previous model-art check inspected unused legacy startup code.
- Done: load the immutable manifest from the #47 merge, check all twelve replacement clip URLs before reusing a registry, and rebind the pre-Start player. Clear the sprite timeout and allow sixty seconds for cold downloads. No artwork, action clocks, gameplay, HUD or city layers were changed.
- Verification: active-startup regression covers cold, old, mixed and current registries, concurrent calls, player rebinding and timeout disposal. Actual saved Makko SDK diagnostic loads decoded atlas bytes and draws all twelve clips plus production player/enemy owners; see docs/source-pack/verification/makko-model-runtime.json and .webp. The source receipt and PR record full-suite/CI outcomes.
- Art remains pinned to `a4c1b7cf6fec0a083a4812ae1ea76edef45a5911`. Original boss walk/flourish and traffic remain; missing final exports and Firewall flame-continuity review are unchanged.
- Next: owner Makko import/playtest using the top route in docs/source-pack/ACCEPTANCE.md after current-head CI. Never auto-merge or restart art production.
