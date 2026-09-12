# Draft PR: responsive combat and visible rhythm feedback

The owner reports unreliable-feeling contact and barely visible Rhythm Mode/background effects. This completes selected items 1–8 together and makes the existing district visibly react to musical performance.

- Stable player/enemy body contact, separate source-calibrated head sensors and swept ordinary stomps; correct enemy feet through both Makko anchor conventions.
- Quick taps retain their capture-time judgment. The gameplay loop stops dropping valid display callbacks; trails, particle shrink and zoom follow elapsed time, with offscreen drawing culled.
- Visible R entry/stance and attack radius, lightning to actual damaged targets, distinct guard/empty beats, directional material breakup and five/ten-hit barcode/echo accents.
- Existing jump frames follow physics phases; Firewall poses follow committed attack/recovery. Short differentiated sounds share the existing SFX bus with capped, cleaned-up voices.
- Beat equalizers and curb illumination make the existing scenery respond during R. Earlier encounter/Jammer restoration and retry/reset behavior remain.

Validation: `npm test`, `npm run check:syntax:all`, and `git diff --check` pass. The new production-code check covers timestamped taps, rising/contact versus swept falling stomps, source anchors, 30/60/120/144 Hz scheduling, FX cleanup and audio voice ownership. Actual-art Canvas comparisons are included in `docs/source-pack/verification`; they use a boundary sprite renderer and are not Makko screenshots. No hardware FPS or live audible-timing claim.

No runtime sprite/music URLs, intro, dependencies, mission counts, hack rewards, single-jump controls, boss balance or Jammer/lift hit requirements changed. Collision geometry, presentation intensity and sound balance require owner playtesting. Preserve the existing Makko-before-merge gate. Base/rollback: merged PR #32, `97198270dabd9b917d58f6499c2d0668d186eb12`.

Playtest: the six focused steps at the top of `docs/source-pack/ACCEPTANCE.md`, with emphasis on contact fairness, R visibility, hit/guard/empty distinctions, musical readability, the lift/hack/Jammer transition, and boss pause/retry/restart.
