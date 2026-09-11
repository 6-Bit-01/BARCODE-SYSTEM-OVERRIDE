# Stronger Level 1 Overhaul — Proposed, Not Yet Implemented

Requested September 11 after the PR #29 playtest, including effects and inexpensive improvements. Current implementation scope is only the separately documented Jammer transition repair. Preserve approved artwork, locked intro, controls, ordinary lethal stomps, lift, mission/Jammer counts, hack access/reward, musical clock and campaign direction.

## Recommended next playable milestone

Make transitions, animation and musical combat feel intentionally connected across the whole level. Use existing assets first. The proposal below can be implemented in two reviewable passes: animation/mode transitions, then presentation/hack clarity and environmental reactions. Do not wait for a giant combined rewrite to make improvements playable.

### Animation direction

Centralize animation transitions within the existing player/enemy owners. Current player code includes special cases to restart walk clips, detect a stuck rhythm clip and restart jumps. Replace those incrementally with explicit enter/loop/exit rules, consistent foot anchors and explicit interruption rules. Preserve existing calibrated geometry. Map jump takeoff/rise/apex/fall/landing to appropriate existing frames where they exist; request only genuinely missing poses after inspecting the clips. Avoid stretching sprites or inventing frames that alter the silhouette.

Align windup, impact and recovery with the visible attack poses. Musical input judgment must still happen on the input timestamp; presentation must not delay or rescore a successful input. Hit reactions should not restart locomotion unnecessarily. A small contact shadow and grounded landing burst can improve spatial readability without new sheets.

### Rhythm direction

Propose an unmistakable planted performance stance on entry, with an explicit exit before traversal; this is a proposed movement-policy change requiring approval, not part of the Jammer bug fix. Grounded entry, airborne behavior, damage interruption and interaction with boss rebounds/lift must be settled together. R remains a real mode; Down retains judged damage. Music/transport never resets when entering/exiting the mode.

Use a compact beat ring at the feet to show approach to the beat and current mode state. Existing nearby beat markers and EARLY/LATE feedback are the starting point, not missing features to re-add. Escalate visual/audio texture on combo milestones rather than increasing arbitrary damage or clutter. Separate perfect contact, good timing without contact, guard and miss in silhouette/motion as well as color. Timing calibration is a useful follow-on, with one authoritative judgment and a separately labeled visual offset.

### Hacking direction

Keep the short puzzle, availability rules, hostile slowdown and one-health-bar success reward. Give the panel a compact boot/scan/input/result progression with clearer remaining time, entered digits and failure reason. Let the world remain readable behind it. A scan passing over the district and a repair pulse visibly returning to the health bar make success tangible. Failure should close cleanly with a brief interrupted-transmission effect.

The current mode suspension/restoration path should use the same transition rules as rhythm/cinematics so a delayed completion cannot restore an invalid stance. New sabotage rewards, enemy shutdowns or extra puzzle families are optional later design proposals, not authorized by visual polish.

### Effects with strong payoff and modest implementation cost

- Target-local slash/wave or radial impact, a short white/cyan hit flash and a few directional shards for real contact. Guard produces a smaller deflection; misses never produce a successful-hit burst.
- Brief attack/stomp afterimages triggered only by meaningful events, not permanent trails. Prefer crisp offset sprite draws to heavy blur.
- Distinct landing dust/electrical fragments and a contact shadow beneath the player to make platform height and ground contact easier to read.
- Combo milestones with short barcode-shaped bursts; exploit existing square/triangle particles and bounded lifetimes.
- A single restoration wave at Jammer destruction, followed by reduced interference and calmer district lighting. Place overlays over the fixed scenery without redrawing the approved city art.
- Selected signs/windows pulse on musical boundaries; keep this subtle during boss telegraphs and avoid whole-screen flashes on every beat.
- Enemy defeats fragment outward along impact direction; major enemies get a stronger effect while ordinary kills remain quick.
- Fragment pickup briefly assembles into a readable data symbol and travels to its counter; authored lore text remains a separate approval.
- Lift charge pulses travel visibly into the platform, making its two-hit power mechanic easier to understand.
- Camera impact decays quickly, with intensity based on the event; avoid shaking rhythm cues or hiding pulse warnings.

## Inexpensive usability improvements

Mode entry/exit indicators; clear boss approach cue after camera return; checkpoint/retry label; pause screen listing current controls; shorter repeated tutorial text after a deliberate full retry only if approved; music/effects volume and reduced shake/flashes; concise result statistics once definitions and reset behavior are agreed. Retain the established quick boss retry.

## Timing and performance rules

Music transport is the continuous clock. Hostile slowdown, animation, UI feedback and cinematic control have separate responsibilities under the existing update coordinator. Any impact hold must affect visual presentation only, or otherwise be explicitly synchronized; never pause or drift the rhythm judgment. Use existing frame updates and bounded effect pools, skip offscreen decoration and reduce expensive full-canvas blur. No additional RAF, uncontrolled timers or duplicated audio sources.

## Asset and milestone plan

Existing clips, Canvas primitives, current particles and current audio cues support most of the first pass. Distinct dedicated anticipation/landing/recovery poses or newly composed hack stingers need a small asset request after a playable implementation exposes the exact gap. Standalone migration remains the next infrastructure milestone and should preserve an accepted gameplay baseline; this proposal does not authorize engine/runtime replacement.
