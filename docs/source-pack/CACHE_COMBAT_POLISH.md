# Combat polish follow-up

Owner request, October 1, 2026: improve the liked combat chase from merged #169
(`8e9287917bd3f377116d28b0b0c336d03fa2857f`). One enemy targeted/shot at a time;
smoother movement, stronger ram contact, bullet/contact artwork and worthwhile
synchronization. R1 Attack, L1 Turbo, R2 Defend, L2 Disrupt remain unchanged.
Face buttons remain data pieces and never become selectable combat skills.

A friendly projectile holds its target identity until it resolves. The player
cannot start another attack while it is in flight; the reticle stays on that
one enemy. Collision matches that target, not array order. Projectile takedowns
and reflected bullets cannot cascade damage into a second enemy. Physical
melee/ram destruction retains the existing bounded wreck-chain rule.

Physical Turbo now catches approaching/recovering chassis as well as incoming
commitments. A swept rear-contact crossing causes one ram per enemy per boost;
queued next-ONE Turbo alone gives no damage/immunity. Neutral foes do not simply
match the boosted speed. New checkpoints clear the transient ram ledger and
old v4 checkpoints remain compatible. Ordinary hits still return to first gear.
Hostile lateral follow and player visual lane follow use exponential smoothing.

Each active musical part adds 25% attack power and reduces skill recharge by
10%. Four active parts give 2x power, 40% shorter skill recharge, 1.5-second
ammo refill instead of 4.5 seconds, and the retained lower tracking footprint.
Accurate actual pads immediately refund 250ms of skill cooldown (500ms perfect).
Pad points multiply with the active stack, and takedown stack points remain.
All skills work at zero synchronization; rhythm improves the chase rather than
replacing conflict. The fixed HUD explicitly reports power, ammo refill and the
single shot in flight. Current captures, not future queued data, supply power.

One new shared 1448x1086 RGBA atlas supplies twelve projectile/contact cells.
Exact generated PNG/prompt and lossless WebP metadata remain in source; runtime
loads only the WebP. Immutable asset revision is
`3500643aeebacedd8c679cb3db54ea842e13be32`, with bundled fallback. Extra decoded
memory is 5.999 MiB. Projectile paint follows allegiance/travel direction;
bounded muzzle/contact/ram/disrupt effects follow actual controller events.
Reduced Motion omits transient contact animation; Flashes Off selects residue
instead of bright bursts. Physical projectile threats remain visible.

One main-draw combat pose is reused by the world, boss and skill HUD. Primitive
actor/shot/stat views no longer serialize through JSON. Road collision address
queries compute their pose once per actor. These reduce repeated CPU work;
measured painter timings remain observational, not a device FPS claim.

Regression collision fixtures are deliberately arranged and labelled. Complete
production-input races do not inject health, progress, resources, captures or
victory. Compare scripted synchronized and ignored-pad runs, examine authored
native previews, then require hosted Chromium and both final-head CI events.
Exact results/revision belong in the current receipt/export. Preserve #169
historical evidence unchanged. Makko/controller/audio/comfort/fun and physical
device pacing require fresh owner evidence and are not inferred from approval.
