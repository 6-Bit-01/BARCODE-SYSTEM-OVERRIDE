# Platform attachment and charge continuation

Base/rollback: merged #74, `ea7a34571f91ba12d05291d6698eb17b389d150f`. Branch: `agent/platform-mounts-charge-timeout`.

The owner's last question concerns a real earlier scope error: #71 made all ledges solid underneath. Merged #73 restored upward passage through unmarked surfaces, and this continuation retains that correction. Static bonks remain exactly `signal-awning`, `tower-awning`, `cache-maintenance-step` and `firewall-low-step`. The elevator roof remains separately solid and rideable.

## Changes

- Nine existing small decks keep their collider IDs, positions and dimensions. Only support drawing changes. Signal high/Cache high use left-mounted triangular arms; Firewall high/Tower middle/Broadcast low use right-mounted arms; Cache maintenance/Tower high retain front brackets with visible bolt plates; Firewall low/Broadcast high use short hangers attached above glass/signs. The Firewall high arm ends before the lift shaft. Hardware is decorative and introduces no hidden collision.
- The lift uses a five-second power deadline from the latest accepted charge, including ascent. Its existing 220-unit speed reaches the roof in about 3.62 seconds. Initial activation remains two hits; a new hit renews an active trip, including the shared roof seam, and can reverse return. Passenger presence does not renew power. Pause and cinematic suppression freeze traversal. An expired unused first hit clears. Return stops at the existing street height.
- The terminal moves from x=560 to x=498; its y=638, 160×206 collider, illustrated footprint, draw order, training availability and jump route remain. The waveform is the original asset, slightly displaced inside a glass-only clip for 320 ms each 4.2 seconds. No new raster asset, asset URL, audio clock, timer or dependency is added.

## Verification

Required `npm test` and `npm run check:syntax:all` results are recorded for the exact committed/published tree in the source-pack receipt. `check-lift-charge-timeout.js` exercises real player/traversal code at 30/60/120 Hz, occupied/empty rides, deadlines, renewal, rooftop seam, return reversal, pause/reset, out-of-range rejection and a frame crossing the deadline. Existing solid-ledge, route, roof-depth and squash tests remain.

`render-platform-mounts.cjs` uses production drawing with bundled art and native host adapters. It captures all nine mounts, terminal doorway/awning clearance and a 4.5-second screen video. Pixel comparison confirms that animation changes only the screen and reduced-flash mode reproduces the original still. Native captures are not Makko/controller acceptance.

The baseline refresh only accounts for the added verification tools and intentional source line/inventory changes; load order and exceptions remain.

## Remaining boundaries

Three proposed replacement platform image designs mentioned by the owner could not be recovered from GitHub, the provided source packs or available image files. The existing deck art is retained; this pass does not claim those three images or a new five-image art kit were integrated. Exact art continuation needs those source images. The twenty-bubble tutorial remains a proposal. No new gameplay/campaign scope is inferred.

Keep the draft for owner review under ACCEPTANCE.md. Rollback to the base above restores this entire continuation while retaining #73's correct bonk scope and #74's enemy render depth.
