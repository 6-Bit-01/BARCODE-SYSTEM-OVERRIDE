# Selected animation, mode and effects pass; district follow-on

## Conversation anchor

The owner said **“Proceed with the next pass.”** The immediate implementation commitment was:

> I’ll build the next pass around smoother animation transitions, a consistent Rhythm Mode stance, clearer hacking presentation, and the first five effects improvements we discussed.

Before the usage interruption, progress reports described those systems/effects as implemented, with final verification and the draft PR/ZIP handoff remaining. PR #31 subsequently published the work and merged as `b9d7ac46f1a3f6eaaf09d28b2508cfd8105ba045`.

The earlier twelve-item combat recommendation selected **1–5, 8 and 9** for PR #29. That is a different selection. The five effects in this pass are enumerated below; they are not the five main headings of the larger overhaul proposal.

The current owner instruction is to check the PR against what was selected and continue that plan. The original recommendation also explicitly sequenced the next step:

> My next-pass priority would be animation transitions, rhythm stance consistency, hacking presentation, and the first five inexpensive additions. Then build the district-restoration payoff.

After rejecting a separate PR for the small stomp omission, the owner expects meaningful progress in the established sequence. This combined build implements district restoration and includes that correction. No standalone stomp PR was published.

## Item-by-item code check

| Selected item | PR #31 implementation | Verification / follow-up |
|---|---|---|
| Animation transitions | Same-clip requests retain progress, new jumps restart once, delayed rhythm-restart callback removed. Sprite scales/foot anchors retained. | Production animation transition checks; live Makko appearance remains pending. |
| Rhythm stance | Grounded entry plants 6 Bit; R/Escape releases traversal. Lift support and forced rebounds remain; foot ring uses the music clock. | Stance/input/rebound checks at 30/60/120 FPS, lift and cinematic handoff. |
| Hacking presentation | Connect/read/input phases, large codes, countdown, repair/failure feedback. Existing slowdown, health reward and stun retained. Damage cannot restore the suspended stance. | Input/lifecycle checks and the preceding Canvas inspection; live readability remains pending. |
| Effect 1: contact shadows | Street/roof/lift support in `Player.getContactShadow`. | Lift contact check; manual roof/street check retained. |
| Effect 2: landing sparks and heavier stomps | Landing sparks were connected. **The dedicated heavier stomp burst had no live callers.** | This follow-up connects the short burst to successful ordinary/boss head stomps at actual contact. Guarded boss landings keep the smaller effect. |
| Effect 3: attack afterimages | Brief sprite echoes on successful timed attacks and stomp rebounds. Damage/retry clear them. | `startPrimaryAttackAnimation`, `stompRebound`, `drawSprite` and retry cleanup. |
| Effect 4: lift energy | Accepted charges transfer energy into the two-hit lift. | Charge/support and effect expiry/reset checks. |
| Effect 5: musical signs | Five overlays follow the approved foreground transform, sample the existing transport and dim during the boss. | Foreground-coordinate and clock-ownership checks. |

## Follow-up and evidence

Base/rollback: merged PR #31, `b9d7ac46f1a3f6eaaf09d28b2508cfd8105ba045`. Branch: `agent/level1-district-restoration`. The generated manifest identifies the exact published revision and PR.

The district follow-on stabilizes eleven foreground displays by encounter, eases their interference at the existing Jammer milestones, and sends one outward wave from the destroyed Jammer through the existing cinematic. The lights stay recovered on boss retry and reset on a full level restart. The foreground draw transform anchors every overlay, including during camera pan/zoom; the existing frame update owns pause and effect lifetime. No artwork, audio sources or dependencies are added.

Ordinary lethal stomp damage, cyan counter eligibility, rebound physics, invulnerability, mission credit, art and music timing are unchanged. The burst uses existing particles and their frame update; no new timers or dependencies. The targeted live-stomp assertion failed on PR #31 before the correction and passes afterward. Boss checks verify one burst on a successful counter and no second success burst on a guarded repeat. Required full-suite/syntax results are recorded in the archive receipt. Automated checks do not establish Makko graphics/audio/feel acceptance.

## Playtest and post-merge deployment

1. Import `agent/level1-district-restoration` into the duplicate Makko project at the archive/PR revision.
2. Clear the four encounters normally. Their nearby screens should stabilize independently; return through earlier areas and confirm they stay recovered. The quota remains twenty enemies.
3. Hit the Jammer sixteen times. After hits four/eight/twelve the district interference should weaken. Destruction exits Rhythm Mode and sends one wave along the street and through displays. Pause/resume during the wave. Lights and the wave must stay attached to the scenery during camera pan/zoom, then settle before combat.
4. Lose/retry and win/rematch: the district stays restored without replaying the wave. Restart the level: corruption and encounter progress reset.
5. Land on the street and a roof, then stomp an ordinary enemy: small landing sparks, larger burst at head contact, one defeat and the same rebound. Stomp the boss in cyan and guarded windows; only the successful counter gets the heavy burst and damage.
6. Check grounded R entry/exit, two-hit lift support, hack success/failure/damage interruption and continuous music. Judge whether the district changes read clearly without covering enemy warnings.

Record revision, PASS/FAIL and any position/readability/damage/timing discrepancy. Capture the same storefront before/after a clear, and a short video of the Jammer wave and camera handoff. Leave the follow-up unmerged until owner acceptance. After acceptance and merge, import GitHub `main` into the main Makko project, refresh/run it and repeat steps 2–6. The current Makko workflow has no separate shell/server deployment.

The broader proposal and campaign ideas remain in their existing documents. This check does not silently change their later scheduling.
