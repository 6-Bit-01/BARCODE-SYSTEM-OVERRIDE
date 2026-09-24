# Cache Road — Choose a Part for the Next Bar

## Owner playtest and rule

Merged #109 tied a part to a narrow traffic pass. That made its arrival depend on a split-second crossing, and a cut could be credited to the traffic lane instead of the player's choice. The owner found it random, difficult to plan and difficult to earn near misses. This revision removes traffic from the music decision. Existing lane names and all five owner recordings stay in place.

| Action | Result |
| --- | --- |
| Center in a lane for 0.5 seconds | Its part is chosen for the **next bar**, shown in the header and faintly on the road. A preview enters on the next beat while centered. |
| Hold another lane before the bar starts | The latest hold replaces the choice. A dodge after choosing leaves the choice intact. |
| Next bar begins | That one part starts on the song clock and lasts through the current four-bar section. At most one part is added by holding per bar; choices must be renewed across sections. |
| E/RB | Immediately keeps the current lane for the current remainder and the following four bars, once per four-bar section. It cannot be spammed to fill the stack. |
| Pass near traffic | Scores and charges the existing abilities; a close cut charges more. Neither action changes the selected music. An adjacent pass now tolerates 0.3 lane of drift and shows a near-miss message. A paired-gate hit still cancels all pass rewards at that crossing. |
| Hit traffic | Erases active, queued and chosen parts, drops the music bus briefly, then returns on a beat with drums alone until a new choice enters or E/RB is used. |

The half-second timer restarts at each bar line. Staying in one lane for another half second deliberately chooses it again; dodging just after the line does not silently renew it. Without E/RB, reaching x4 requires four different choices across four consecutive bar boundaries, so x4 lasts at most the last bar of that section. E/RB can add a part early or carry it across a section; a planned x4 is still possible. The road paint for a chosen part is lighter than paint for a playing one. The soundtrack's recorded loudness is unchanged, and every supplied part is selectable throughout its recording.

Zone remains a separate driving reward: cuts, passes, drafts and clean bars fill its meter. If a chosen or E/RB-carried part enters at a four-bar boundary with sufficient meter, the existing four-bar speed and time bonus starts once. Turbo, Echo, traffic, 100-bar song, final exit, checkpoint compatibility and campaign award boundaries are unchanged.

## Verification and limits

The production check covers choosing and replacing a lane before a downbeat, dodging after a choice and just after a last-bar downbeat, one added part per bar, a brief reachable x4 with E/RB, a close cut that charges Zone without silently carrying music, an adjacent pass with steering drift, a paired-gate hit, audio dropout, the whole 100-bar song, Echo exit and old saves. Local logic and CI browser decoding verify mechanics and MP3 paths. They cannot judge whether the timing and sound feel right in merged Makko with a physical controller.
