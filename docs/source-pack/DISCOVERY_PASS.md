# Level 1 discovery, targeting and traffic

Owner-approved follow-up to merged PR #35, base/rollback `c346e16e24c00b46611e6328d6f0fd6158cf315a`. Branch: `agent/level1-discovery-traffic`.

## Scope

1. Fix the three Lost Data fragments arriving too late: authored encounter progression unlocks them, without collection cooldowns or a one-at-a-time limit. Preserve rooftop exploration and the lift route. Record stable fragment IDs with durable, unique collection for future campaign use; repeated level runs cannot inflate the total.
2. Repair the rooftop Signal Amp collection geometry and explain its existing three-use ordinary-enemy range bonus.
3. Add read-only rhythm target brackets using the authoritative target/range rules, including the Amp bonus and guarded boss distinction. Previewing never spends charges or damages targets.
4. Recover animation from the three existing traffic GIFs through compact derived sheets and elapsed-time playback, preserving the original artwork and current travel behavior.

The owner confirms lore collection affects the eventual ending and is part of a secret test. Do not reveal that relationship in gameplay prompts, public demo copy or release notes. Exact ending thresholds/resolution are still unapproved: persist facts, never invent a final ending rule. The old random lore pool is not approved canon; any new display copy is provisional for owner review.

Migration/hosting experiments are deferred. This is one combined follow-up with saved checkpoints, one draft PR, the same updated v5 source pack, and owner Makko acceptance before merge. Preserve the approved movement, contact, animation, music, tutorial, lift, mission and boss contracts.

## Checkpoints

- Scope/diagnosis: confirmed timer and one-fragment limits; Amp checks feet 42px below its center against a 36px radius.
- Collection and Amp: implemented. Production checks cover fast 4/9/14-defeat unlocks, three simultaneous records, any pickup order, actual roof/body geometry at 30/60/120/144 FPS, single rewards, durable IDs, reload/replay, blocked storage, backup recovery and future-version preservation. Existing polish and menu checks also pass. The active HUD reports save failure; missing or corrupt main storage recovers a valid backup.
- Target preview and traffic animation: implemented. Pure previews match the next real successful hit, including combo growth, without mutating charges or attack state. Boss guard/open cues use the real phase; Amp cannot extend boss or Jammer range. All 325 original frames retain their durations and full-canvas proportions in three shared atlases. Fallback, pause/reset/dispose and 30/60/120/144 FPS playback checks pass.
- Full validation: `npm test`, `npm run check:syntax:all`, the responsive-combat suite with `MAKKO_ENGINE_PATH` set to the downloaded actual runtime, and inspected native Canvas diagnostics passed. Publish one combined draft and refresh v5 with the exact remote revision; generated manifest/receipt carry publication status. Makko acceptance is pending.

## Remaining boundaries

The three deterministic records use provisional copy for owner review, following the v4 Level 1 content purposes. The save stores unique discovery facts, not a full campaign resume or a final ending calculation. It preserves unrelated existing progress/settings, verifies promotion, recovers a complete backup, and refuses to overwrite incompatible versions. Sequential writes from different tabs merge discoveries; this is not a claim of atomic simultaneous-tab coordination. Storage is browser/origin-specific; validate the actual Makko host across reload. A blocked save keeps session facts and displays an archive warning.

The existing lore overlay still displays discoveries on collection. A persistent reading menu and final approved canon are useful next work. Migration remains deferred.
