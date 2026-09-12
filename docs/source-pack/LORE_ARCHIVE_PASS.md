# Authored lore and archive pass

Base and rollback: merged PR #36, `58b6abe6179ce6b7e8996c4d4099c9eff674f35f`. Review branch: `agent/level1-lore-archive`. One combined draft; the generated source manifest identifies the exact published revision. Owner Makko acceptance remains pending.

## Owner-approved result

Implement the pause archive and improve the actual current lore using established BARCODE and 6 Bit context. Three complete records replace the placeholder lines. They are new in-game writing, not quotations of historical people, performances or documents. Full text is in LEVEL_01_LORE.md and the runtime catalog.

| ID | Author and title | Purpose |
|---|---|---|
| lore.l01.01 | Cache Back — Four Names on the Tape | Restore the original crew's authorship; connect protected memories to Cache Back's established identity/recovery history. |
| lore.l01.02 | DJ Floppydisc — The Other Side of Silence | Make the unresolved phase-inverted waveform concrete through a musician's technical observation. |
| lore.l01.03 | Mac Modem — A Whole Block on Mute | Explain the Jammer as interference across the neighborhood, with purposeful urgency and a reason to restore the signal. |

Each has three paragraphs, an in-world source label and a concise 6 Bit response. The original four keep distinct voices. Later exposition is not inserted into these opening records.

## Source audit

- **BARCODE Bible — Internal Guide, April 2026, Updated**, pages 1–3: the collective's foundational identities, BARCODE preceding the Network, core/soft-canon distinction and preservation of the artists' voices.
- **BARCODE Bible — Internal Guide, April 2026, Scrubbed Algorhythms**, pages 6–10: 6 Bit's personable, sharp voice; Floppydisc's measured musical/technical identity; Cache Back's archive/recovery identity; Mac Modem's purposeful disruption. These are voice constraints, not licenses to invent historical achievements.
- **BARCODE World Overview**, complete text: crew/context continuity and the distinction between the later corporate imitation arc and this game's 9 Bit origin. That arc is not imported as the game premise.
- **Current LORE_AND_CAST / owner continuity**: Cache Back arose from clearing callembini's laptop cache, initially believed he was callembini, and became distinct. Mac Modem's virus metaphor is character-specific. The simulation creator and final resolution remain unresolved.
- **Attached Source Pack v4, data/lore-plan.json**: the retained three Level 1 purposes are protected memory, an unnamed inverted waveform and the Jammer's environmental reach. Current merged geometry and defeat unlocks supersede older draft placement/timing details.

Confirmed facts anchor the writing; the tape label, isolated channel report, carrier trace and six speaking passages/replies are newly authored fiction for this game. The records do not name an unresolved creator, invent real-world songs/events, assign guest lore, or expose the private collection purpose. Existing prologue/title/tutorial wording is unchanged, including its existing 9 Bit references. Later campaign reveal order and outcome logic remain outside this pass.

## Implementation and compatibility

`BARCODE.LoreRecords` is the single immutable catalog. The existing `lore.l01.01`–`.03` saved IDs display the revised content automatically. No schema, reward or placement migration is needed. The collection system remains responsible for unlocks and one-time run awards; the archive only reads. Empty entries hide titles and content. Reset Settings, boss retry and full run reset cannot erase discoveries.

P → Lore archive supports existing keyboard/pointer ownership. Esc returns to pause, P/Resume resumes through the audio lifecycle, and held menu actions remain blocked until release. No new event listeners, timers, animation loops or audio sources. Save failure is explicit and retains session records. Full record text fits the reader at the production layout without scrolling.

Collection notices show a short excerpt and the archive route. Distinct rapid pickups queue, use elapsed gameplay time, freeze during pause/suppressed gameplay and clear on full reset. The contradictory random lore pool is removed. Existing pickup artwork/flight, traffic, target previews, Amp geometry/charges, combat, music and locked prologue remain.

## Validation and review

`npm run check:level-01-lore-archive` exercises production catalog, collection, input, pause and lifecycle owners against explicit host/storage/Canvas boundaries. It covers saved/blocked storage, old saves, unrecovered content, input release, scaled pointers, repeated drawing without state mutation, queued notices, reset and failed audio resume. It is part of npm test. Required full-suite/all-file syntax results are in the export receipt.

`node tools/render-level-01-lore-archive.cjs` optionally renders six native Canvas diagnostics and checks text bounds with measured fonts. It adds no game/CI dependency and does not claim live Makko rendering or audio. The baseline refresh is scoped to the added catalog/check script, resulting script indices. Existing asset/ownership findings remain visible.

Use ACCEPTANCE for the five-step Makko route and voice review. Do not merge on Node/Canvas checks alone. After acceptance and merge, export/import the actual main merge revision and repeat archive/save/pause checks.
