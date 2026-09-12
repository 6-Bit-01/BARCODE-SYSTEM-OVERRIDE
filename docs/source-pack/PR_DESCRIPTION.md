# Fix Level 1 discoveries and Amp pickup; add target previews and animated traffic

Fast runs could finish before all three lore fragments appeared: a 20-second initial wait, a minute-long collection cooldown and a one-active-fragment limit delayed the authored placements. The rooftop Signal Amp also checked the player's feet against a radius smaller than the gap between its center and the roof, preventing a normal walking pickup.

This combined follow-up to merged PR #35:

- Unlocks the three records at 4/9/14 mission defeats and keeps them available together. Stable identities and verified persistent storage preserve unique discoveries across reload/replay; run score and collection remain separate. Backup recovery and a visible save-failure status protect against silent loss. The three deterministic text entries are provisional for owner review.
- Repairs Amp pickup using real player-body/roof geometry and explains the existing three-charge ordinary-enemy range bonus.
- Shows read-only rhythm target brackets using the next successful hit's actual reach, including combo growth and Amp extension. Boss guard/open and fixed Jammer range remain distinct. Previewing never spends charges or attacks.
- Plays all 325 original traffic frames from three shared lossless WebP sheets, about 3 MB total. Authored durations, source framing, existing movement and original-art fallback remain; pause freezes animation.

Existing movement, tutorial locks, contact/SFX repairs, twenty-defeat mission, two-hit lift, sixteen-hit Jammer, cinematic and boss balance remain. No new game or CI dependency is required.

Validation: `npm test`, `npm run check:syntax:all`, and responsive-combat checks using the actual downloaded Makko animation classes passed. Added production checks cover fast progression, collection order/reload/replay, storage failure/recovery, real roof contact, preview/attack agreement, traffic timing across four display rates, fallback and lifecycle. Native Canvas diagnostics were inspected. These checks do not establish live Makko delivery, hosted persistence, audible mix or hardware performance.

Makko acceptance before merge:

1. Play a fast run. Explore the left awning, middle roof and upper route using the lift; all three records should be available after 14 mission defeats, with no collection cooldown. Test different pickup orders and one reward per record.
2. Reload on the same host, replay, retry the boss and full-restart. Saved unique records persist; run counters reset only for the full restart. Review the three provisional text entries.
3. Walk across the relay roof to collect the Amp. Confirm the explanation, three charge pips and extended ordinary-enemy reach. Misses, empty swings and boss/Jammer-only hits must not spend charges.
4. Compare R target brackets with actual on-beat hits: normal reach, violet Amp-only reach and boss guarded/open states. Check that preview/pause spends nothing and R-off hides it.
5. Watch animation in all three traffic types and test pause/resume. `spaceShipSystem.getDiagnostics().animatedTypes` should be 3; static fallback is not an animation PASS.
6. Smoke-test opening/landing/contact/audio, tutorial locks, lift/Jammer/cinematic, boss lose/retry and win/rematch, full restart and saved pause controls. Record exact SHA, Makko project/origin, device and PASS/FAIL.

Base/rollback: `c346e16e24c00b46611e6328d6f0fd6158cf315a`. The generated manifest/receipt identify the published head and PR. Keep this as a draft until owner acceptance; after merge, import the actual main merge revision and repeat the focused checks.
