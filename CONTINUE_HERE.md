# Continue here — Level 1 playtest improvements

The current work is the owner-approved combined pass in `docs/source-pack/LEVEL_01_PLAYTEST_PASS.md`, based on merged #54 `8b0a8b2af005408d137421bd3f241a080ea23627`. Preserve the existing merged work. The implementation and local production checks are complete on `agent/level1-playtest-improvements`; owner Makko acceptance is pending. Read the top ACCEPTANCE route and the PR for exact review head/CI. Preserve this combined pass; no older animation or source-pack work needs restarting.

# Continue here — wall sidewalk/street footprint

PR #53 is merged at `685d13d4de1d56c8a39a82077460d894144bd091`; its walk, enemy hijack, repairs and rooftop supports are the current baseline. The owner's new screenshot identifies a visual gap at the wall's base: it stops at the walking line and only projects backward. The focused `agent/barrier-street-footprint` correction extends the same tall translucent wall forward across the sidewalk, down the curb and through the road. Existing gate positions, collisions, unlock conditions and collapse clock remain.

Review the before/after native render and the newest `docs/source-pack/ACCEPTANCE.md` route. Exact published SHA, PR and validation are in the generated source receipt. Test the review head in a fresh Makko preview before merging; after merge import actual new main SHA and repeat the same wall/gate checks. Base/rollback is the merged #53 SHA above. Do not redo earlier artwork or the hijack pass.

## Previous hijack handoff (now merged)

The owner selected enemy hijacking as H's reward. Implementation is complete for review on `agent/enemy-hijack-repairs`. The owner merged walk PR #52 during preparation; current main/base is `66c17d1880f5de933e9b928833e5dd2bfff6a817`, with exactly the same files as the original walk head `b1692f47017459011177fb779639682534c862b7`. The new draft targets main directly. The separately committed hijack work is preserved; keep the completed walk artwork.

Read `docs/source-pack/ENEMY_HIJACK_REPAIR_PASS.md` for the actual mechanics, art, limits, focused Makko route and post-merge deployment. The final published SHA, PR URL and validation evidence belong to the generated receipt. Do not reimplement the pass or mistake source/native checks for hosted Makko approval.

H now has one eight-second ally, an explicit target, safe expiry/release and no health/area-stun success transaction. Two rooftop repairs, one marked carrier and two small physical supports supply recovery and traversal. No cloud stage, traffic hazard or character redraw is bundled.

Owner Makko acceptance is next; #52's merge is already complete and is not hosted test evidence. After accepting and merging the new hijack PR, import the actual new main merge revision and repeat the focused checks. Returning to the current main SHA above removes only this new pass while retaining the merged walk; `ea2921960477e38c74740dda378fcb513a8f1cc1` remains the earlier pre-walk rollback reference.
