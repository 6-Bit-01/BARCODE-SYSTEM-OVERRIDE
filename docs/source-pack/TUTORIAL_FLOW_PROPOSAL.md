# Tutorial flow proposal

> Status update, September 17: the owner approved this plan in **Finish The Job**. Its original implementation is recovered and included in the combined draft. See `FINISH_THE_JOB_RECOVERY.md`; the proposal-only status below describes the earlier PR #74 milestone.

Status: recommendation for discussion, not implemented. Audited against merged PR #73 (`8fc2f8ea838d1dc901b97c7b7c93581459451ddf`); the accompanying elevator fix does not change tutorial code.

Recommend **25 authored chapter bubbles → 20**, five fewer. Keep the studio take, Dead Air District, Jammer, tower and 9 Bit story beats, and all four existing voices. Count the chapter definitions, including objective-wait lines; actual displayed counts currently vary because completed objectives can skip lines.

## What currently creates confusion

| Current source behavior | Consequence |
| --- | --- |
| Movement/jump objectives literally say Arrow Keys and Up Arrow. Other prompts use the controller binding helper. | Controller players receive conflicting labels. |
| Objective/action text is 16 px on the 1920-wide canvas, is drawn without wrapping in a 400-unit panel, and fades to 60% while dialogue types. | Required controls can be small, dim or overflow, particularly in a smaller preview. |
| Objectives activate at chapter entry, before the corresponding spoken instructions. Tutorial enemies spawn at chapter entry and a 1.5-second callback releases them; update recovery can also settle them. | Actions and threats can get ahead of the explanation. Reading speed does not determine readiness. |
| Rhythm's objective-wait line starts “Five in a row” before completion. Completing the combo automatically exits Rhythm Mode. | It can sound like unearned praise, and players do not practice leaving the stationary stance. |
| Hacking dialogue says to answer before a timer expires; the practice answer phase is deliberately untimed. Practice can succeed without an enemy. | The lesson describes different behavior from the one being demonstrated. |
| Required lines and controller controls use different input owners. During an active hack, the keypad owns input. | Extra crew lines should not require Continue while a puzzle owns that button. |
| The fully typed final line has a mandatory 10-second hold plus 2-second fade. | The mission can feel stalled after the player is ready. |

Sources: `src/game/tutorial.js` chapter definitions, draw/update, completion and input methods; `src/game/hacking.js` availability/start, presentation and success; `src/core/input.js`, `src/core/action-input.js` and `src/core/gamepad-ui.js` action ownership and mappings; `src/game/ui-manager.js` objective/hack layout.

## Proposed sequence and exact cuts

| Lesson | Current → proposed | Teaching sequence and consolidation |
| --- | --- | --- |
| Arrival / movement | 5 → 4 | Keep Cache's studio-take reassurance, Mac's district setup and 6 Bit's response. Combine “Check your footing” with movement coaching. Show Move first, then Jump; confirm an actual action. |
| Stomping | 4 → 3 | Keep the enemy warning and signal-health explanation. Combine “Jump and land on them” with “Clear these three.” Activate the demonstration after the instruction is readable and acknowledged. Keep a live 0/3 counter. |
| Rhythm | 5 → 4 | Keep the surviving-beat story bridge and stance instruction. Combine the beat and five-hit explanation. Turn the existing “Five in a row” wait line into earned feedback, followed by an objective to exit the stance deliberately. |
| Hacking | 5 → 4 | Keep the code/uplink story setup. Teach Open/Read, then Enter when the real terminal changes phase. Follow success with the twelve-second ally explanation. Remove the generic “Finish this access check” wait bubble; relocate repair instructions to the first repair encounter. |
| Mission handoff | 6 → 5 | Combine Mac's twenty-signals and Jammer explanation. Keep Cache's original-recording request, 6 Bit's district/tower/9 Bit goal, DJ's beat support and Cache's closing line. |
| **Total** | **25 → 20** | Five fewer bubbles without removing a story beat or speaker. |

## Dialogue outline: twenty bubbles

Controls below live in the adjacent action card and use the actual current binding. Spoken lines explain purpose, danger and story. Example wording is provisional and retains existing canon.

| # | Speaker / moment | Suggested line |
| --- | --- | --- |
| 1 | Cache / arrival | Still with you, 6. The original studio take is safe. |
| 2 | Mac / arrival | You're in Dead Air District. The street relays are jammed; the tower uplink is blocked. |
| 3 | 6 Bit / arrival | Then we start down here. Keep talking me through it. |
| 4 | Mac / movement practice | Check your footing. Move around, then give me a clean jump. I'll watch the route. |
| 5 | Mac / before enemies activate | Three corrupted signals ahead. Those viruses are between you and the next block. |
| 6 | Cache / health cue | Watch your signal strength at the top-left. Lose it all and we lose your connection. |
| 7 | Mac / stomp practice | Land on them from above. Keep clear of their sides. Clear all three. |
| 8 | DJ / rhythm setup | That is your footing. Now listen: the beat survived the interference. |
| 9 | DJ / stance entry | Plant your feet and enter Rhythm Combat. You'll hold your position while you play. |
| 10 | DJ / after stance opens | Hit the beat to send an attack. Build five clean hits in a row; a miss restarts the count. |
| 11 | DJ / only after five hits | Five clean hits. Now leave the stance so you can move again. |
| 12 | Mac / hack setup | Their commands are just code. I'll open a practice uplink so you can learn to rewrite them. |
| 13 | Mac / before opening the practice terminal | Open the uplink. Watch the signal before entering anything. |
| 14 | Mac / when the answer phase opens | Now reconstruct what you saw. This practice answer has no time limit. |
| 15 | Cache / after practice success | You're through. Out there, a successful hack turns an enemy into an ally for twelve seconds. Watch that countdown. |
| 16 | Mac / mission handoff | Twenty corrupted signals remain. Clear the blocks so we can locate the Broadcast Jammer, then break it to restore the local signal. |
| 17 | Cache / mission handoff | If a lost recording surfaces, keep it. We need the originals, not a cleaned-up replacement. |
| 18 | 6 Bit / mission handoff | The district first. Then the tower. And we find 9 Bit. |
| 19 | DJ / mission handoff | I'll keep the beat underneath you. You handle the street. |
| 20 | Cache / mission start | Channel stays open, 6. Bring the neighborhood back. |

## Controls and objectives

Use one stable action card throughout training and the district. It contains a short verb-led objective, a prominent button/key badge, and observable progress. Examples: **Jump — [mapped jump]**; **Stomp viruses — 1/3**; **Tap on the beat — 3/5**; **Leave Rhythm Combat — [mapped rhythm mode]**. In Rhythm Mode the shared Cross/A badge must explicitly say Beat; outside it, Jump. Show the active device and saved remaps, with simple readable text and an opaque background. Avoid shrinking text to fit; wrap or expand the panel. Keep the action fully bright while speech types, and check its real displayed size at the smallest supported preview.

Make each coaching beat follow explain → try → acknowledge. Start its objective at the explanation, transition from actual gameplay events, and retain credit if the player already demonstrated the action. Feedback should acknowledge what happened without replaying instructions. Keep one chapter transition owner, cancel pending transitions on reset/pause/exit, and preserve the exclusive tutorial Continue input. A press can reveal the rest of a typing line; require a fresh press to advance, so it never consumes multiple lines or also jumps.

When the puzzle owns input, its Read/Input labels and keypad hints lead. The short phase-specific crew line can appear without an extra Continue requirement, and must fit outside the terminal. Keep the practice answer untimed and say so. At the first real hackable enemy, show a contextual target/control cue; after success, draw attention to the friendly marker and twelve-second bar. Teach early release there. Point out repairs when the first marked cell/carrier appears. These are concise contextual objective cues, not extra blocking dialogue bubbles.

After the closing story line is readable, a deliberate Continue starts the mission immediately. Retain automatic dismissal as an optional fallback, with no compulsory twelve-second wait. The first mission objective is Reach/Clear the current block; locating/breaking the Jammer becomes current only when its prerequisite is satisfied. Keep recent crew dialogue accessible from the existing pause review.

## Review before implementation acceptance

Walk the full proposed sequence with keyboard, PlayStation labels, Xbox labels and a remapped controller. Include fast completion before speech catches up, slow reading, early button presses, a combo miss, practice-hack failure/retry, pause during transitions and the final handoff. Verify 20 authored main-flow bubbles, no unearned praise, no untaught hostile activation, readable controls without overflow, one transition per event and no input consumed by two owners. Confirm the story beats and speakers with the owner. This proposal does not change mission quotas, rhythm scoring, hack rewards, bindings, level geometry or the four-circle bonk scope.
