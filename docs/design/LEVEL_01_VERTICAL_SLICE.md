# Level 01 Vertical Slice

## Authority and current milestone

Level 1 is centered on 6 Bit. Its side-scrolling platforming and rhythm combat use the existing approved city, street frontage, flying traffic, sprite animations and music. The owner approved finishing the boss encounter on September 11, 2026. The current source-pack decision register supersedes the contradictory PR-004–PR-008 plans previously collected in this file.

The verified merged baseline is PR #25, commit `7788ebfab4d6231c18229bef9571d6b97b676764`. That baseline stops at `boss_ready`; the boss cannot deal or receive damage. The current branch extends that endpoint to combat, defeat, retry and Level 1 completion. See the source archive's generated manifest for its exact revision and `docs/source-pack/ACCEPTANCE.md` for verification status. A code implementation is not a Makko pass.

## Preserved play contract

- Left/Right or A/D move; opposing directions cancel. Space/Up/W jump. Preserve the single-jump kit, buffer, variable height and ledge forgiveness.
- Active tutorial Space belongs only to tutorial advance. H/R access unlocks at their tutorial steps. Background rhythm timing continues while R is hidden or inactive.
- `R` toggles actual Rhythm Combat Mode; Down Arrow deals damage only after a successful rhythm judgment with that mode active. Ordinary movement remains immediate. Passive landing stomp remains lethal for ordinary enemies; it is not Down-key fast-fall.
- H uses the existing short puzzle and health reward, including existing grounded/mode restrictions.
- Retain normal enemy damage and feedback, the two-hit Signal Lift, authored rooftops, Signal Amp and three Level 1 fragment locations.

## Mission and boss transition

The 20-enemy post-tutorial objective is intentional. Four authored groups supply 4, 5, 5 and 6 mission enemies; tutorial defeats do not count. Existing encounter gates and paced spawns support that route.

At 20 mission defeats, the Broadcast Jammer appears once in the world half opposite the player. The Jammer is an environmental object owned by `BARCODE.JammerEnvironment`; it has 16 health and accepts exactly one damage per successful rhythm attack. H and passive stomp do not damage it.

Jammer destruction preserves the freeze, enemy purge, rightward camera pan, boss walk-in, flourish, camera return and control handoff. The existing boss presentation is the art basis for this milestone. Its generic gameplay label does not decide its final story identity or make it 9 Bit.

## Boss encounter direction

Use readable ground pressure, a clear jump/stomp opportunity, and rhythm counter windows built from the skills taught in the level. Telegraph before damage, show recovery, then combine understood patterns as pressure rises. Damaging a boss through an intended stomp opening does not change the lethal ordinary-enemy stomp rule.

Retry should return the player to a fair boss checkpoint without repeating the twenty-enemy route or entrance movie. Winning should end Level 1 clearly, preserve the result for the current session, and offer an honest endpoint while later campaign levels remain unimplemented. Do not claim that a persistent campaign save or Level 2 exists because the victory screen is present.

Tuning values, animation selections and exact controls are implementation details recorded by the branch and handoff, not final balance approval. Check win, loss, pause, retry, stale attacks, repeat completion and full restart.

## Follow-on improvements

- Give each encounter group a distinct teaching purpose while keeping all twenty enemies.
- Use selected beat/phrase telegraphs so music is legible in enemy behavior; do not quantize normal movement.
- Distinguish timing miss, successful timing without a target, and damage dealt.
- Consider Jammer presentation escalation after 4/8/12/16 hits; this is an approved direction for a later polish pass, not a claim that it exists now.
- Compare visible enemy contact with damage geometry before tuning margins. The audit identified possible sprite-offset/scale disagreement; Makko reproduction is still needed.
- Author the three Level 1 lore texts against the 28-piece plan; random legacy strings cannot supply final canon.

## Art and production

Preserve the current foreground/platform calibration and the approved background, foreground and three flying-car assets. The older source pack's aspect-ratio warning is historical audit context, not permission to reapply old geometry over the later roof/contact repairs. Reproduce any remaining defect in the current build first.

The style is damaged public-access television, VHS, obsolete computing, underground hip-hop and 16-bit grime. Prefer clear platform edges, bounded effects, telegraphs and contrast adjustments around the approved art. Request new animation only after the playable encounter proves exactly what it needs.

Historical changes in PR #8 established the single active enemy owner and authoritative defeat event in `EnemyManager`; those ownership decisions remain. Its non-destructible Jammer concept was superseded by the later explicit mission approval. The old PR-009 prose that excluded stomp was likewise superseded by the passive-stomp decision. Never reinstate these old restrictions from an archive.
