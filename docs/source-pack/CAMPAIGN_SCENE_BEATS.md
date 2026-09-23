# Campaign scene beats and 9 Bit intrusions — September 23 working design

`CAMPAIGN_REDESIGN.md` records the owner's selected genre order, Sheila correction and 9 Bit's player-aware presence. The owner also wants him to occasionally prank the crew and player, including a saved-game button that dodges a click. This sheet is a **draft presentation treatment**, not approved final dialogue, art or a runtime checklist. Keep the existing eight-page opening and three written Level 1 records intact. All later scene lengths, visuals and exact words require gameplay context and owner review.

## Scene grammar

Most chapters need an in-play clue, a short clear-to-next-channel bridge and a visible next objective. Let the player advance one dialogue cue, skip a previously viewed scene, pause and replay major scenes in a future archive. Give each bridge a real artifact and a change in character understanding. Do not explain all plot in a lore card after a boss. Scene text sits on actual images or authored screens, not over targets during combat. Reduced effects keep the same information legible.

| Beat | Visible/in-play evidence | Crew response and immediate objective | Later payoff |
|---|---|---|---|
| Opening → L1 (implemented) | Live crew broadcast; false `NO BROADCAST DETECTED`; request to discard audio | 6 Bit chooses to restore Dead Air District | The original tape and contradictory recovery label matter throughout |
| L1 clear → L2 | Jammer restoration makes an outgoing connection possible; Cache holds the original | Cache takes it down the transit line while DJ keeps both traces | A copy that looks cleaner will be proven incomplete |
| L2 clear → L3 | Two delivered versions disagree; a distribution stamp blocks the original | Mac chooses the street access route | Brawler stage enforces the label on actual community channels |
| L3 clear → L4 | Mac opens a log: Partition 09 and a damaged separation file assigned to an arena feed | DJ enters to isolate channels, not to delete one | The opposed-waveform observation from L1 becomes direct evidence |
| L4 clear → L5 | DJ separates the traces; an initiator field is missing; a surviving index points to a Sheila/Corporate Satan competition none of the four remembers | Crew views/enters the recovered event, suspicious of its gaps | The nightmare is evidence to test, not unquestionable footage |
| L5 gym result → L6 | Sheila defeats Corporate Satan with the player's use of the four husks; no transfer of his gym or rank. A clearer view shows the four had no agency and now have no memory | Present-day crew demands independent verification; Sheila must face the question rather than becoming a new boss by default | RPG chapter checks recordings, access logs and community recollections |
| L6 clear → L7 | Verified evidence and current danger identify a core route; six guaranteed keys form an access path | All four prepare and commit to assault | The finale tests what they learned and preserves a pre-boss save |
| L7 result → credits | The fight stops the immediate harm; the crew/player act on the full record | Authored resolution and a deliberate last broadcast | A chosen ending, not a random collection counter on the screen |

## The forgotten competition: five scene turns

1. **Entry after Level 4.** The recovered index opens a colorful trainer interface. `TRAINER: SHEILA` appears with a silhouette; four BARCODE slots appear below her. Present-day crew comments on not remembering this. The player participates in the reconstructed encounter, but whether their inputs only reenact a past outcome or affected it is still a story decision.
2. **Early comic rhythm.** Other trainers, community members and goofy bureaucratic rules make the sector lively. A Studio Cat can cross a card or carry a completely wrong trainer badge. The four battle effectively but give little or no self-directed response; avoid having them banter like willing competitors inside this past event.
3. **Missing agency.** A command continues after the UI says it ended. A community witness reacts to an unresponsive crew member. The present-day crew notices a discrepancy between the recorded bodies and their remembered selves. Humor drains away at this discovery.
4. **Corporate Satan's gym.** Other trainers lead up to the Gym Leader. His balls contain original fictional humans, AI and entities. Sheila uses the four husks and the player's actions to defeat him. Her actions are the central uncomfortable fact; do not invent an ownership transfer, succession, or a post-victory promotion for her.
5. **After the win.** The competition ends and present-day versions of the four can speak again. They cannot remember fighting. A damaged angle or signal track suggests the memory has been curated. Sheila's exact knowledge and any 9 Bit alteration remain disputed until Level 6 compares independent records.

Use real community members as meaningful trainers, residents, guides and witnesses with individual scene cards. Mr. Nice Guy, LostMarbles, Shadowspit and Hellcat are explicit additions; Kave, SKELLA, Dr3wBaby, WittyF0x and other active unexcluded names also receive planned appearances. Friendly battles need not make their opponents villains. The previous exclusions remain exclusions. Credits, exact names, likenesses, music and voice are resolved per contribution; a person is not silently turned into one of Corporate Satan's units.

## Fourth-wall occurrence plan

9 Bit's intrusion feels like a hand crossing a comic panel: a visual or voice emerges from a place thought to be outside the scene. Keep the interface *truthful*. His words can lie or plead; the actual menu action, score, save and clear facts cannot.

| Occurrence ID (draft) | Condition and scope | Dramatic function | Must remain usable |
|---|---|---|---|
| `ghost.title.saved` | Valid campaign save, sparse authored occurrence; never assumed on a fresh profile | Unexpectedly addresses the returning player, sometimes tugging the selected save tile away after a click while trying to dissuade Continue | Same save selected, a fixed reachable tile after one dodge, second pointer click/keyboard/controller confirm, settings, Back, save loading |
| `ghost.game_over` | Selected deaths with context; not every death, and no required clue depends on dying | He notices repetition and speaks from behind the ordinary failure screen | Immediate retry, pause/menu, accessibility and no punishment for skipping |
| `ghost.level_end` | Selected cleared chapters, not a replacement for results | He questions what the system called a complete or clean result | True score, keys, lore, checkpoint, next level and exit |
| `ghost.final_end` | Authored finale end/credits response, after the real decision | He acknowledges the consequence without stealing the crew's last word | Ending outcome, credits, replay and saved final state |

Early hints should be interpretable as a strange presence, not a false hidden-name reveal: 9 Bit is already depicted/named in title/tutorial. Later scenes can identify what he changed and why, after corroboration. Avoid a repeating jump scare, a pretend crash, fake OS/account access, save-corruption scare or a forced Start lockout. If a title or results scene is skipped, essential facts remain on the normal story path. The only existing fourth-wall discovery is the optional opening `egg.comic.gutter`; the occurrences here are unimplemented.

## Occasional pranks with a story arc

The joke is that 9 Bit can put a hand into the *presentation*: cards, captions, labels and frame edges. His early tricks are funny and a little rude; later the same gesture makes the player wonder which recovered labels can be trusted. He cannot secretly rewrite a completed objective, a save slot, a controller binding or a genuine danger cue. Each authored event needs a crew reaction or a later payoff, not just a random glitch filter.

| Moment (candidate) | What he does | Reaction / purpose |
|---|---|---|
| Saved title after a new chapter clear | On the first pointer activation of an existing selected save, a drawn hand pulls that tile sideways for a brief beat; he comments on the player's eagerness. It settles in its original hit area and will not dodge a second time on that visit. | A direct joke with the returning player, followed by his uneasy attempt to talk them out of resuming. The actual slot and Continue action never change. |
| Early crew intermission | He changes a *nonessential* speaker tag or sticks a handwritten annotation onto a crew caption. Mac catches it and talks back; Cache notes that the original recording did not contain that line. | Establishes his personality and the difference between a performed interruption and authentic evidence. Draft gag: Mac asks, “Who edited my subtitle?” |
| DJ's Level 4 signal work | A tiny unwanted channel label dances across DJ's mixing display. DJ cuts its audio, but the graphic folds over the damaged separation index. | The recurring joke becomes a useful clue to look beneath a label, while DJ still earns the actual separation reveal. Do not let 9 Bit supply the missing initiator. |
| Level 5 competition | A playful trainer card gag can appear early. Once the four are shown to be unresponsive, his pranks stop during their lack of agency. | The absence matters: this is not the moment to laugh at Sheila controlling them. Whether he witnessed or changed that past event remains unproved. |
| Game-over or results after L5 | A pencil mark/handprint briefly crosses the *border* of Retry or a clean-result stamp, then withdraws. He may challenge the system's wording without editing the score or the Retry target. | Turns the earlier visual trick into suspicion about the report; Level 6 checks the claim against independent records. |
| Level 6/7 payoff | The same panel-peel gesture exposes an obscured field or opens a frame edge during a crew encounter. The content is still evidence to test. | His power is legible because the player has seen the small tricks before. The crew, rather than the gag, chooses what to do with the truth. |

**Saved-title interaction contract for a first prototype:** only a valid, already selected campaign save is eligible; a fresh game and empty slot never receive this gag. At most one pointer dodge per eligible visit, with no cursor capture or click-through to another slot. The card visibly returns and remains at its normal target; a second click starts the selected save. Keyboard/controller confirm can continue without chasing it, Back/Escape can dismiss the effect, and settings remain reachable. Reduced Motion keeps the same joke as a stationary hand/caption and lets the first activation continue. No fake save deletion, changed slot identity, corrupted filename, loading failure or repeated dodges. Choose a sparse authored trigger and an optional cosmetic seen flag when implementation is designed; do not introduce a new campaign gate.

For a cutscene prank, pause cue progression while the crew reacts, then return to the genuine speaker/caption. For a menu prank, the owning menu handles the input and returns to its normal hit testing and focus immediately. Actual accessibility labels announce the real action. Test mouse, touch, keyboard, controller, reduced motion and save reload before shipping any moving target. No required lore depends on a prank firing.

## Humor and evidence checks for scripts

- An absurd trainer rule or bureaucratic label can be funny; the four being used without agency is not a throwaway gag. 6 Bit remains observant, sharp and occasionally irritated. Sheila can be dry and controlling without giving away the entire reveal in the opening.
- Keep Corporate Satan's Gym defeat separate from 9 Bit's original creation. A villain in Level 5 is not automatically the creator, separation initiator or final boss.
- Distinguish three layers in every Level 5/6 cutscene: what the reconstructed memory **shows**, what someone **claims**, and what a second source **confirms**. Never let a stylized nightmare silently settle the historic facts.
- For each 9 Bit intrusion, write a trigger/state table, cue-by-cue script, skippable version, replay rule and resource/input ownership before implementation. Playtest surprise and readability on the actual title, results and controller routes.
