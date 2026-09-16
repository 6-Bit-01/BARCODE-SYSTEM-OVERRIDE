# Active pass recovery — boss fairness, level difficulty, lift and Studio Rat

**INCOMPLETE WORK. This branch checkpoint contains this recovery note only. It is not a reviewed gameplay build and is not ready for a PR or merge.** Recover the existing local edits before doing new implementation. Do not mistake this note or passing checks on unchanged main code for completion of the pass.

## Verified base and current artifact

- Repository: 6-Bit-01/BARCODE-SYSTEM-OVERRIDE.
- Main/base: merged PR #68, `84f7471fce9bb9300cd7c6f7165a86787054ace9`; tree `4e7f00bed415ea65b8f6e09f4ccaa42b1ee5fe45`.
- Local implementation branch: `agent/boss-fairness-level-rewards` in `/workspace/scratch/6ec3b2eafe76/game`.
- Maintained source pack: `BARCODE-System-Override-Source-Pack-v5.zip`, Library ID `libfile_da4c75ea80948191af40513500fcddbd`, version **72**. SHA256 `2b03a2a14e7403ea3edda506aab107f3ea07b870a5936dbcca92e34da38d0fea`. It still accurately exports the merged #68 base, not these unfinished changes.
- Recovered pack is at `/workspace/scratch/6ec3b2eafe76/current-pack/System Override/BARCODE-System-Override-Source-Pack-v5.zip`.
- The uploaded v2/v3/v4 packs are historical, not the current implementation.

## Owner requests, including newest steering

1. Boss rhythm attacks are not damaging on buildings or ground. Repair the actual transaction and range.
2. Slightly more forgiving top/side contact; the game currently feels too difficult.
3. Difficulty selected only at the beginning of each level, with different genre-specific tuning and hidden values that contribute to eventual end-game rewards. Album download/easter egg are possibilities, not a chosen reward or threshold.
4. Restore original foreground car hazards during boss combat. They affect player AND boss. Boss gets only a tiny allowance to escape narrow windows. Preserve original car art, size, speed, altitude, probability and warning time.
5. A somewhat larger, clearly recognizable 3D elevator with roof, centered standing depth and readable short rhythm-power text. Move Cliff's note alongside it.
6. **Newest correction: the back drive/bar must span the whole elevator travel. The carriage renders over it. Animate the mechanism while powered.** The back mechanism must not ride up and down inside the cabin.
7. Restore the Studio Rat in each level with end-game discovery/bonus facts and dynamic fourth-wall animation, possibly dragging a random enemy off screen.
8. Suggest other final improvements.
9. Existing push/draft preparation authorization persists. Owner Makko acceptance is not established by tests, prior merges or this checkpoint. No new merge authorization should be inferred.

## Recovered prior decisions

Personal Context was searched for the exact cat/reward/lift constraints. Studio Rats are tuxedo CATS, never rodents. There are seven proposed Studio Rat sightings, with a separate all-Rats backstage payoff; discoveries are separate from the 28 lore records and secret ending evaluation. The Level 1 cat was deliberately moved to the upper Cache route, x=1680 / foot y=330, and made one-time. Old saves hide its former event after discovery. Preserve that credit; do not clear old discoveries to make it visible.

Keep original whole-body character animation, 20 mission defeats, 16-hit Jammer, two-hit lift, ordinary lethal stomps, hijack/practice, terminal/walking strip, fixed-scale animated background/rain, warnings, roof routes, boss art/music/retry and recently fitted holograms. No Runway account.

## Confirmed diagnosis

- A production-rig reproduction with boss at x=2700 and player at x=2400, both on street or both on Firewall canopy, produced an on-beat attack radius of 260 and distance to the boss BODY of 240.6, yet returned `bossReason: out-of-range` and left health at 10. Boss range used its center instead of the intersected body. Recovery/guard phases still exist intentionally.
- `SpaceShipSystem.trafficDamageEnabled()` explicitly excluded `isBossCombatLive()`. That also hides WATCH OUT, since warnings use the same gate.
- Cliff's note was still at x=865 / y=492, the old elevator location.
- Existing elevator was a 132-unit-wide thin deck. Text was drawn at tiny world-space sizes.
- Existing Studio Rat was hidden by `hasEgg`, on the upper route, with a 3.6-second four-frame walk-away.

## Local implementation already written before the outage

These files were changed locally, **not yet committed or published as code**:

- `src/game/sector1-progression.js`: closest-point-to-boss-hull rhythm range; descending stomp tolerance 12px and half-foot reach 26px; traffic may damage through musical guard; lift width 196 (x=2440 unchanged); completeLevel records difficulty once; boss retry resets car runtime. Replaced drawSignalLift with a full-height fixed textured drive from top stop minus cabin roof height to bottom+18, then the moving cabin. Cable teeth and two motors use lift.driveTimeMs; direction reverses on return; clock advances only under charge/motion and resets with lift. Cabin height258, foot anchor0.795. Label counter-scales for zoom: RHYTHM LIFT / RHYTHM MODE • n/2 BEATS. Cliff's note is x2366,y856.
- `src/game/enemies.js`: descending stomp tolerance14px and half-foot26px; initially used a small player hurt inset for both damage contact and crowd geometry. **This needs the correction below** to retain full physical separation.
- `src/engine/spaceships.js`: remove boss-combat exclusion; add projected boss body with 8px horizontal / 6px vertical inset, separate per-car boss latch and swept exposure. Boss damage requires 40ms actual overlap; player still uses original hazard transaction. Track previousBossBody and reset with other contact state. Main update checks both independently. No car motion/spawn/art changes.
- NEW `src/game/level-difficulty.js`: canvas-based level-entry choice on existing frame/input owners. Provisional options Relaxed (4 health, .86 hostile scale, hidden value1), Standard (3,1,2), Overclocked (3,1.12,3). Owner has not separately approved these exact names/numbers. Choice locks on confirm; only beginLevel can reopen; boss checkpoint retry does not. Generic per-level profile registration allows future genres to provide other tuning. No final reward/threshold invented. Hidden completed results keep best single value per level, no repeat farming.
- `src/game/lore-collection.js`: accepts seven Studio Rat IDs; event-version2 fact allows the new animation once while preserving existing egg credit. recordLevelChallenge and getRewardFacts; merge unique completions, best challenges and rat events alongside lore during concurrent-tab saves. Needs new focused persistence validation.
- `index.html`: load new level-difficulty after lore-collection.
- `src/core/runtime-lifecycle.js`: beginLevel at whole-level start/restart; stop difficulty UI during teardown.
- `src/core/loop.js`: difficulty input/render-only path on existing RAF before game updates. No new canvas/RAF.
- `src/core/input.js`: difficulty keyboard/mouse/controller ownership before gameplay; confirm must not leak a jump or tutorial Space.
- `src/game/update-coordinator.js`: level-owned hostile scale multiplies existing tactical delta. Music and car speeds unchanged.
- `src/engine/presentation-assets.js`: new liftCabin, liftTrack and studioCatEvent entries. **Their roots are presently empty for local/native use; pin to an immutable published asset ancestor before Makko handoff.**
- `src/game/level-01-stage-fx.js`: Cliff note relocation; new cat look/pounce/backward-tug sequence, 6.2 seconds. Can inspect the cat during an encounter, other details still wait for clearing. Nearby eligible ordinary enemy selected (no drone/hijacked/rebooting/protected enemy); at grab, real takeDamage/recordDefeat once, then presentation-only dragged sprite reference. If no suitable target, it drags a comic-border strip. New full-body poses. Existing egg credit retained, event version recorded once. Need test interruption, live victim changes, no duplicate quota/save credit, all seven IDs.
- NEW `tools/build-level1-finale-assets.py`: crops/registers complete generated cabin, fixed mechanism texture, 12 whole-body cat poses. No separated body-part animation.

## New art already generated and inspected

Built-in imagegen was used; each image was shown in the conversation. Preserve these outputs, do not regenerate by default.

1. Original open scaffold cabin WITH internal back drive:
   `/workspace/scratch/6ec3b2eafe76/generated_images/exec-e9d2824b-3480-49eb-9ee6-7efae7b37e14.png`
2. Twelve whole-body tuxedo cat poses (look at viewer, blink/paw, pounce, backward tug), 1448x1086:
   `/workspace/scratch/6ec3b2eafe76/generated_images/exec-424c80d3-8750-4958-a2e2-b0a08441bb12.png`
3. Corrected identical cabin with central back drive REMOVED so the fixed shaft renders behind:
   `/workspace/scratch/6ec3b2eafe76/generated_images/exec-6c7f2f22-23e9-429d-b776-d8f21cb7f36b.png`

Copied project sources:
- `assets/finale/sources/lift-mechanism-source.png`
- `assets/finale/sources/lift-cabin-source.png`
- `assets/finale/sources/studio-cat-poses-source.png`

Builder ran successfully and produced:
- `assets/finale/lift-cabin.webp`
- `assets/finale/lift-track.webp`
- `assets/finale/studio-cat-event.webp`

Source alpha below8 is removed only to exclude stray transparent specks. Cabin cropped to alpha bounds and max640. Track crop is (570,375,742,630) resized86x128. Cat source column boundaries [0,374,724,1094,1448], row boundaries [0,426,754,1086], whole-pose bounds, ONE shared scale, 384px cells with paw baseline348; prepared atlas1536x1152. Verify each pose for clipping/registration and actual in-game scale.

## Actual validation so far

Passed after the local edits:
- `node tools/check-level-01-boss.js`
- `node tools/check-level-01-responsive-combat.js`
- `node tools/check-upper-route.js`
- `node tools/check-level-01-discovery.js`

Outstanding failures:
1. `tools/check-level-01-impact.js:92` still expects ratAge=null at3617ms. New event is6200ms. Update its old3601 step to6201; retain all one-time/ownership/save assertions.
2. `tools/check-rail-traffic-correction.js:65`: “no repeated clamped overlap.” Small hurt inset was also used for physical crowd resolution and leaves slight overlap. **Do not weaken the no-overlap assertion.** Restore original full-hull overlap checks for initial/crowd separation. Measure graze using hasHarmfulBodyContact BEFORE separation. On an outer graze allow85ms of brief contact, but sustained pressure still damages; reset graze start if >150ms since prior overlap. Deep body hits retain their existing transaction. This preserves geometry while softening damage.

The tool call applying these two corrections failed at its first file read with “exec-server transport closed.” It then returned repeated `409 Conflict, environment_offline: Environment is not connected`. **The last correction patch was not verified as applied. Inspect before applying.** No successful full npm test or full syntax check has run on this unfinished pass.

## Next concrete steps

1. Reconnect/recover the existing workspace; inspect git diff/status. Merge this note-only remote checkpoint fast-forward if appropriate; do not overwrite the local edits. If maintenance removed files, recover the generated assets and conversation's exact successful patches, not a new art pass.
2. Apply/verify the two corrections above. Add focused production tests for body-edge boss rhythm hits on street/roofs, safe descending top grazes vs real side hits, cars warning and hitting BOTH actors at30/60/120Hz, boss narrow-window allowance, pause/retry latches, level-entry input/lock and per-level save union/max-once facts, full drive strip and powered motor lifecycle, cat one-time defeat transaction.
3. Use existing native render tool `tools/render-level1-rebuild.cjs` and `render-cat-chaos.cjs` asset adapter; add scoped finale review. Render cabin bottom/mid/top at actual zoom with actor foot in floor center and fixed back strip behind it, readable labels and nearby Cliff note; render cat phases and difficulty screen. Inspect actual images and a short motion preview. Do not claim native host adaptation is Makko acceptance.
4. Review save parsing/unknown content, cat target changing/dying before grab, reset/stop behavior, and honest final reward status.
5. Update AGENTS/CONTINUE_HERE/current state/decisions/changelog/acceptance/pass docs to newest owner request. Preserve prior v72 manifest/receipt as history.
6. Publish immutable asset ancestor, pin all three new runtime URLs, verify exact delivery. Keep one combined draft for actual implementation; don't make a PR for this note-only checkpoint.
7. Run required npm test and npm run check:syntax:all on exact final code revision; regenerate baseline inventory only for explained additions/line shifts, never to hide a behavioral failure. Check CI.
8. Update SAME maintained v5 identity guarded at version72 (or fresh current version if someone updated it), with truthful review/merge status and exact receipt. Do not overwrite historical v2/v3/v4.
9. Respond to the owner's request for final improvement ideas: potential compact boss counter cue, short discovery acknowledgement and clear elevator charge feedback. These are suggestions, not an excuse to restart broad work or invent final album rewards.

## Outage boundary

The workspace went offline during this pass. GitHub remained accessible. This document was saved directly through GitHub to preserve continuity; it does NOT contain or publish the modified gameplay or binary assets. Main and the canonical v72 pack remain the last verified build. The user's latest elevator correction is explicit and must survive the next turn.
