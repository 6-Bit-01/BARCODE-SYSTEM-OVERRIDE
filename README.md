# BARCODE: System Override

A BARCODE simulation built around seven distinct retro game genres and the original four: 6 Bit, DJ Floppydisc, Cache Back and Mac Modem.

## Current state

The active work is [combat-chase PR #169](https://github.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/pull/169)
on `agent/cache-combat-chase`, starting
from merged [PR #168](https://github.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/pull/168)
at `de003813dac96022e1ad19327ec827c3d1bac159`, retained as rollback.
Fresh Cache Line runs use version 4: fight hostile vehicles, defend committed
attacks, disrupt tracking and damage an enforcement rig through three systems.
Rhythm synchronization provides advantages and earned score during the chase.

| Default controller input | Function | Keyboard |
| --- | --- | --- |
| A / Cross | Synchronization piece A | K |
| B / Circle | Synchronization piece B | L |
| X / Square | Synchronization piece X | J |
| Y / Triangle | Synchronization piece Y | I |
| R1 / RB | Attack | F |
| L1 / LB | Turbo | Space |
| R2 / RT | Defend | G |
| L2 / LT | Disrupt | V |

The face pieces retain the same lane chart, music, timing, captures, extensions
and arrangement. All four active means optimum speed and power with the lowest
tracking footprint. Combat skills recharge independently and work without
synchronization; Turbo preserves its next-ONE launch. Historical version-1–3
saves retain their rules. The delivered-original ending requires real rig
defeat and the complete original song.

R2 Defend opens a timed guard that stops one incoming hostile contact,
projectile or ordinary traffic collision. A combat counter acts on its real
source; blocking ordinary traffic consumes the guard without inventing enemy
damage or a takedown. The skill HUD distinguishes an available guard from a
successful counter, and fresh prompts present the face inputs as sync pieces.

The playable mechanics checkpoint at
[`668d57d6`](https://github.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/commit/668d57d662a99701383b683cccc0663a8249dc31)
passes production combat/input/guidance and integration race/save checks with
existing art. Its [original source-hashed receipt](docs/source-pack/review-cache-combat-chase/combat-integration-mechanics-checkpoint.json)
remains separate from subsequent art and behavior changes.

Authored combat art is now complete: four immutable atlases at
`12af86c0641456cc443ff7f42db013e565088b13` provide hostile bikes/chassis,
separated rider and wreck components, and destruction effects. See the
[art notes](assets/cache-road/combat/README.md) and
[extraction, anchors and hashes](assets/cache-road/combat/atlas-metadata.json).
Full local regression, all-file syntax and all nine production combat races
pass on the final frozen source. Hosted browser gates and both exact final-head
CI events remain publication gates; their results belong in the PR/export receipt.
Makko/controller/audio, comfort, balance/fun and device performance
remain owner review. See [the approved combat plan](docs/source-pack/CACHE_COMBAT_CHASE.md),
[CURRENT_STATE.md](docs/source-pack/CURRENT_STATE.md) and
[the acceptance route](docs/source-pack/ACCEPTANCE.md) for scope and evidence;
the historical mechanics checkpoint remains separate, and automated evidence
does not establish owner acceptance.

## Historical development preview description

Read [CURRENT_STATE.md](docs/source-pack/CURRENT_STATE.md) and [the acceptance route](docs/source-pack/ACCEPTANCE.md) for the active review. Level 1 and its Cache Back handoff are playable. A clearly labeled Broadcast Slum development preview starts from that handoff; merged #89 added roof shield nodes, counter surges, varied defenders and temporary scatter. The current review adds debug access to both levels. The Cache Line remains Level 2 in story order.

The preview grants no later campaign completion or Drums key. Its owner Makko/audio/controller feel review is pending. The Cache Line and later story routes remain planned.

For a quick test route, start Level 1 and open its `DEV` panel at the lower left (or press Shift+F1). Choose **Complete Level 1**, then enter the Broadcast Slum preview from Cache Back. Console command after unlocking: `DEBUG.level1.completeLevel()`. In the preview, open `DEV 3` (or Shift+F1) for relay checkpoints, recovery and **Complete Preview**; console command: `DEBUG.level3.completeProof()`. The Level 1 shortcut grants the handoff and Voice without a best result or challenge record. The preview clear grants no Drums or Level 3 campaign completion.

## Runtime and checks

The browser entrypoint is `index.html`, loading namespaced/global JavaScript without a bundler. Makko supplies `/lib/MakkoEngine.min.js`, which is not in Git. External artwork/audio remain host dependencies; the repository is not a standalone offline build.

```bash
npm ci
npm test
npm run check:syntax:all
```

The dependency-free suite exercises production logic through explicit host boundaries and audits source/lifecycle/input/combat/music/discovery behavior. All JavaScript, including inactive files, must parse for Makko. Automated checks do not establish live rendering, audio synchronization, control feel or supported-device performance.

## Development and source pack

Read [AGENTS.md](AGENTS.md) and [project instructions](docs/source-pack/PROJECT_INSTRUCTIONS.md). The [Cache Road opening](docs/source-pack/CACHE_ROAD_AUTHORED_OPENING.md) teaches its delivery goal and controls during the drive. The owner imports merged, CI-checked changes into Makko to test gameplay. Preserve the current mechanics and discoveries. Production logic checks and layout diagnostics do not replace that gameplay review.

The maintained [v5 source pack](docs/source-pack/README.md) exports an exact committed tree through `tools/build-source-pack.py`; CI publishes a revision-named archive artifact. [The update protocol](docs/source-pack/UPDATE_PROTOCOL.md) governs the current downloadable archive and merge receipts. Attached v2–v4 packs and old audit reports are provenance, not current implementation commands. Historical technical records remain under `docs/technical/` and `docs/archive/`.
