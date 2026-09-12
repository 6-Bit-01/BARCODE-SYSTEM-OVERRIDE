# Selected responsive combat and visible rhythm pass

Base: merged PR #32, `97198270dabd9b917d58f6499c2d0668d186eb12`, tree `4767e74277d431810c6e1c0fe2a53b649410d5a1`.

The owner reports slight improvement, questionable hitboxes, and rhythm/background effects that were difficult to notice. After the sixteen-item review, the recommended next build was explicitly **items 1–8 together**. The owner then said: “Alright and what about rhythm mode and the visual background effects from before? I didn't really notice them. Let's continue.”

This build covers the eight items below plus a stronger, readable musical response in the existing scenery. This is one combined PR. These numbers refer only to the latest sixteen-item review, not previous proposal numbering.

| Item | Selected work | Verification target |
| --- | --- | --- |
| 1 | Stable body contact, separate attack reach and feet; ordinary swept landing stomps; enemy animation/crowd review. | Same-position pose changes do not change damage bounds; falling crosses a real head plane; rising/side contact cannot become a stomp; existing ordinary lethality and boss separation remain. |
| 2 | Preserve fast taps and their original timing. | Press/release between polls survives once; repeated keydown cannot multiply hits; musical judgment uses capture time; tutorial, terminal, pause and retry retain input ownership. |
| 3 | Repair frame pacing and reduce rendering costs. | 30/60/120/144 Hz timestamps advance consistently; no additional RAF; offscreen FX are not drawn; effect lifetime is frame-rate independent. |
| 4 | Readable attack reach and actual target connections. | Real damage transactions drive target FX; guarded/missed/empty attacks remain distinct; combo, Amp, Jammer and boss ranges retain their rules. |
| 5 | Directional contact flashes, shock rings and material-specific breakup. | Effects occur once at real contact and expire; local visual impact holds do not pause physics, music or input. |
| 6 | Distinct combo milestone bursts and accents. | Five/ten-hit milestones emit once per crossing; effects clear on lifecycle reset; warnings remain visible. |
| 7 | Pose-aware animation and landing recovery. | Existing frames/foot calibration preserved; jump phases follow physics; enemy warning/action/recovery agree; no delayed animation callbacks. |
| 8 | Cohesive action/impact sounds and bounded overlapping playback. | Jump, landing, stomp, damage, guard, lift and pickup cues use existing audio ownership; voices expire; no song/asset replacement. |
| Additional owner request | Visible Rhythm Mode entry and musical storefront/street reactions. | Contrast is apparent at actual game scale; FX remain attached through camera transforms; mode/cinematic/retry/reset behavior remains coherent. |

Preserve the twenty-enemy mission, sixteen-hit Jammer, two-hit lift, single jump, opposite-direction cancellation, H/R tutorial locks, grounded rhythm stance, hack rewards, boss balance, approved art and intro. Continuous music/beat timing remains independent of mode visibility. Normal pause is separate.

The older tests that freeze the animation-dependent player combat hull are superseded by this authorized collision repair; replace those expectations with actual stable-contact behavior rather than removing coverage. Preserve historical test evidence in the archive.

Items 9–16 (camera/HUD redesign, encounter redesign, exploration/pickup/endgame expansion, hacking features, additional scenery content, settings/controller completion, authored lore/saves), stem-loop cleanup and standalone migration are follow-ons. Existing features in those areas remain intact.

Implementation covers every selected row above. Production checks and diagnostic Canvas previews are included; the archive receipt records final required-test results. Owner Makko acceptance is pending. Rollback is the PR #32 baseline above.
