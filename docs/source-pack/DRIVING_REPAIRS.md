# Trailing camera and first-gear wreck repair

## Scope and baseline

The owner requests a repair PR before the broader overhaul. Merged PR #166,
`8bcfc39d5b01b6b9ada07facf76d0a70a12cd3c9`, remains the checkpoint/rollback.
The owner explicitly says the old exit will be scrapped; this repair leaves
it untouched rather than adding prompts that the next PR would remove.

## Camera

The same bounded target now feeds an exact critically damped follow with
omega 12 per second, producing a roughly quarter-second trailing response.
Zoom, horizontal/vertical offset and roll advance once in the road update,
using its capped delta. Draw reads the pose without mutating it. There is no
new timer, RAF, input owner or saved camera state. Constant-input response is
independent of frame rate; changing-target tests do not claim exact sampling
invariance. One bounded impact oscillation and a soft pass arc replace rapid
alternating jitter. HUD/rearview, tire-plane pivot, 1.335 zoom ceiling, fine
wind, edge warnings and all four lane destinations remain intact. Paused
transport does not advance the follow. Reduced Motion/Flashes Off clears its
momentum and renders a neutral camera.

## Wreck recovery

Only a genuine unprotected hit selects gear 1. Existing Turbo/grace immunity,
Push and Brace return before the downshift. Clear the pre-crash queued gear,
Surge and Turbo; return the unused queued Turbo charge. Keep the already
announced section/pad addresses fixed. The existing recovery boundary at next
ONE owns the physical eased slowdown to 30 units/second, and recovery takes
priority over new queued shifts or launches on that boundary. Gear 1 remains
selected after the recovery bar; normal subsequent manual shifting works.
There is no instantaneous road jump or hard stop. Existing damage, time,
musical-part loss, save format, story and result behavior remain unchanged.
Legacy saves use the same newly requested wreck penalty on their next actual
hit; earlier validation remains attributed to the earlier rules/revision.

## Validation and acceptance

Production tests exercise steering onset/reversal/settling, equal-duration
follow at 24/30/60/120 updates per second, draw immutability and accessibility
reset. Drive tests distinguish wreck versus four protected contact types,
recovery precedence, persistent gear 1, manual re-acceleration and immutable
announced targets. Full regression/all-file syntax and both final-head CI
runs are gates. Exact exits/revision and native preview belong in the receipt.
Makko comfort/controller/audio/frame pacing acceptance remains unrecorded.
The next PR owns the larger pursuit/combat/finale overhaul.
