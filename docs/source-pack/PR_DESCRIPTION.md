# Repair intro rendering, artwork delivery and Level 1 dialogue

After PR #40, the owner reported a canvas-context limit and missing opening images. The intro repeatedly requested its 2D context and relied on relative image paths. Its new story also fed into old tutorial exposition about an unseen tower collapse, while dialogue remained detached from the pictures.

This combined repair caches the context once, loads verified commit-pinned copies of the same eight approved images with a bounded bundled fallback, and places comic balloons/comms cards within each scene. It rewrites the actual five-chapter tutorial as the continuation of the open crew channel: Cache answers 6 Bit, the crew teaches the existing controls, then establishes the district/Jammer mission. Objective completion uses stable IDs instead of old waiting-line wording.

- Preserve five-second S/B hold ownership, title and music transition, model/cast limits, 9 Bit disclosure boundaries, current Level 1 combat, mission/lift/Jammer/boss behavior and existing lore saves.
- Inspect the eight production layouts in `docs/source-pack/verification/intro-contact.webp`; read the exact continuation in `INTRO_TO_LEVEL_01.md`. These are native Canvas diagnostics, not Makko captures.
- The full required `npm test` and `npm run check:syntax:all` pass. Focused production checks cover a one-call context budget across two minutes, image fallback/timeout/stale cancellation, normal and skipped intros through all real tutorial gates, final hold/fade, and a single mission starting at zero.
- All eight public image endpoints return HTTP 200, image/webp, CORS *, and the exact bundled bytes. `verification/intro-asset-delivery.json` records the checks. Public hosting remains a dependency; actual Makko-origin delivery/CSP is not certified by this result.

Base and rollback: `a747b58411650146bdc003a529d0470167d275db` (merged #40). Read `INTRO_REPAIR.md` for scope, tests and limits. No new image assets or runtime dependencies; the only baseline inventory addition is the public asset host.

Before merge, use the current ACCEPTANCE route in Makko: two minutes on the first page, all eight styled scenes, S/B skip/release/focus behavior, the continuing crew dialogue through training to the mission, audio transition, then the existing gameplay/save smoke checks. Owner Makko acceptance is pending; this draft is ready for that review. HUD/rhythm presentation and meaningful attack variety are the next authorized pass.
