# Write the three Level 1 lore records and add a persistent pause archive

PR #36 made all three fragments available and saved their identities, but their text was still provisional and there was no way to reread a recovered entry. This follow-up implements the owner's request to improve the actual BARCODE lore and make it readable after collection.

- Adds complete records by Cache Back, DJ Floppydisc and Mac Modem, with distinct voices and brief 6 Bit responses. They develop original-four history, the unresolved inverted waveform and the Jammer's effect on the neighborhood. LEVEL_01_LORE contains the exact copy and LORE_ARCHIVE_PASS traces the established canon.
- Adds P → Lore archive using the existing persistent IDs. Previous saves display the expanded text automatically; unrecovered titles/content stay hidden. Reading cannot unlock records or award score.
- Uses the existing pause/input/audio owners for keyboard and scaled-pointer navigation. Esc returns to pause; P/Resume returns to play. Saving failures remain visible without losing session records.
- Queues rapid pickup notices, freezes them during paused/suppressed gameplay and clears them on full reset. Removes the contradictory legacy random lore pool. Collection notices and the reader share one catalog.

The 4/9/14 defeat unlocks, collection geometry, 500-point run reward, existing save schema and original prologue remain. No changed game assets, asset URLs, dependency, combat balance or music transport.

Validation: the source receipt records `npm test` (including the new production archive regression) and `npm run check:syntax:all` against the exact revision. Targeted checks cover existing/blocked saves, hidden unrecovered content, scaled pointers, pause/input ownership, repeated drawing without progression changes, rapid collection/reset and failed audio resume. Six native Canvas diagnostics verify complete text fit and drawing. These checks do not replace live Makko rendering, hosted storage, audible audio or voice review.

Makko acceptance before merge:

1. On the same project/origin as PR #36, open P → Lore archive. Existing discoveries should show the revised text without recollection. Unrecovered entries hide their titles and contents.
2. Read all recovered entries using arrows/Tab/Enter and pointer clicks. Review crew voices and 6 Bit replies. Esc returns to pause; P/Resume resumes. No held menu action should become a jump/attack, and world/music remain paused while reading.
3. Take a fast route and collect the three placements after 4/9/14 defeats. Collect two quickly; their notices should queue and both records should be immediately readable. Check one reward per record per run.
4. Reload, boss-retry and full-restart; durable discoveries remain and stale notices do not carry over. Reset Settings must not erase lore. If saving is blocked, the archive explains the session-only state.
5. Smoke-test opening/landing/contact/SFX, tutorial locks, lift, rooftop Amp prompt/pickup/charges, target brackets/traffic, Jammer cinematic and boss lose/retry/win. Record SHA, project/origin, device and PASS/FAIL.

Base/rollback: `58b6abe6179ce6b7e8996c4d4099c9eff674f35f` (merged PR #36). The generated manifest/receipt identify the exact published head and PR. Keep this draft until owner acceptance; after merge, import the actual main merge revision and repeat the archive/save/pause checks.
