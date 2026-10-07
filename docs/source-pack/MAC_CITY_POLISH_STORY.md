# Mac city polish: story during the fights

October 7, 2026. Implemented for the private Mac chapter; integrated browser playtesting and owner acceptance remain separate.

The eight approved intro scenes, their artwork, the final Mac hero pose and the enclosed Kave studio stay intact. The October 7 owner refinement makes each scene one short cue. Ordinary Kave questions are removed. The sole optional choice, `fourth-wall-question`, belongs to 9 Bit addressing the player from the illustrated margin. Its answers, `get-it-heard` and `keep-receipts`, each produce one brief fourth-wall response and immediately return to the common route. Continue skips the answer without inventing a selection or another speech. With complete text shown immediately by the production wrapper, the common route takes nine advances; either answered route takes nine advances and one answer input. The pure reader retains its optional typewriter mode for other callers.

Six short arrival lines connect each district to Mac's task. Cache keeps the complete recording in focus, DJ preserves the separate copies, and Kave keeps the artists' queue and local monitoring alive. WittyF0x briefly confirms the cleared concourse's canal route. Dr3wBaby asks for usable parts after a real car wreck. These are comms appearances, without new portraits, voices, playable guests or route dependencies.

Kave supplies the existing Link setup; DJ and Kave report the local-signal result. DJ acknowledges a destroyed street fixture actually discharging into enemies. 9 Bit appears during the intro's fourth-wall choice and a short nonblocking rooftop aside explicitly addressing the player and the camera. Gameplay adds no dialogue menus. The relay does not claim that the studio's outbound feed is open. Only the earned six-district/Regent endpoint invites Mac inside to check that feed; one Kave desk cue confirms the first outbound play and protects the separate records. No Partition 09, separation initiator, simulation creator or future ending is invented by this pass.

## Integration contract

`BARCODE.MacStreetStory.gameplayCues(events, snapshot, seenIds = [])` reads the combat owner's drained event batch and current snapshot. It returns a frozen `{ cues, seenIds }`. Each frozen cue has `id`, `speaker`, `text`, `zoneId`, `context` and `priority`.

The helper has 16 authored cue IDs and returns at most two lines, ordered by priority with stable order for the relay pair. It adds seen IDs only for returned lines. The wrapper owns which lines are actually admitted to its bounded existing radio queue and should retain only admitted IDs. Initialize chapter-local seen IDs on a new playthrough, preserve them on ordinary retry, and clear them on full replay/disposal. Retire stale queued lines when leaving their district. There is no persistent save field or additional update, input, audio or timer owner.

| Real combat receipt | Additional snapshot requirement | Result |
| --- | --- | --- |
| `zone-enter` | Matching current district; Mac alive | One arrival per district |
| `zone-cleared` | Current district marked cleared in both zone/city | Sparse concourse or rooftop response |
| `relay-ready` | Cleared Night Market; the market relay actually available and unrestored | Kave's Link prompt |
| `relay-restored` | Cleared Night Market; the market relay actually restored | DJ/Kave local-signal pair; DJ's cue ID is `city.relay.restored.local` |
| `fixture-discharge` | Matching broken terminal/streetlight; actual enemy contact IDs present | One chapter-wide DJ reaction |
| `prop-break` for a car | Matching current-district car actually broken | One chapter-wide Dr3wBaby reaction |
| `boss-phase` 2 or 3 | Matching live Regent and current phase in Broadcast Plaza | Brief escalating crew response |
| `enemy-defeated` for the Regent | Regent down; all six districts and 12 waves complete; desk unlocked and status `desk-ready` | Earned invitation to the enclosed studio |

An event alone cannot overrule an unearned snapshot. Snapshot polling, drawing, story skipping and read-only review cannot produce new narration. Ordinary hits, exposure windows and repeated interruptions do not spam calls.

## Focused verification

`node tools/check-mac-street-story.cjs` exercises the eight single-cue scene identities, both answers and direct bypass of the sole fourth-wall choice, exact nine-input Continue and ten-input answered instant routes, the one-input desk payoff, optional typewriter reveal, advance/skip/reset and host/campaign-owner isolation. It also exercises real public combat movement to the first `zone-enter` receipt, all six arrival gates, clear/relay/destruction/phase/endpoint requirements, immutable choice/cue snapshots, priority selection, retry deduplication and omitted-cue seen-ID protection.

This validates the production story helper and its boundaries. Queue presentation, exact final package, normal-speed chapter play and owner response to the new lines belong to the parent integration and release evidence; the focused story check does not establish them.
