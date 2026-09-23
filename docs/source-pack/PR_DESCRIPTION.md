# Level 1 completion shortcut and Level 3 DEV menu

The owner needs a quick route to the provisional Level 3 combat preview and a development menu there. This draft builds on merged #89, `c0d061407378831ae90fcac49985a29c3c5ea037`; the Cache Line remains Level 2 in story order.

- The Level 1 DEV panel adds **Complete Level 1** for an immediate saved Cache Back handoff and Voice unlock. An artificial clear awards no bonus and does not enter best results or difficulty challenges.
- The session-only, canvas-native `DEV 3` panel offers relay checkpoint jumps, node/relay bypass, health refill, scatter, defender clear, preview reset and **Complete Preview**. A proof clear saves `proof-clear` but grants no Drums key, Level 3 completion or later story scene.
- Unlock with Shift+F1 or the lower-left launcher in each level. Console commands after unlock: `DEBUG.level1.completeLevel()` and `DEBUG.level3.completeProof()`. The existing input, frame, pause, save and audio owners remain in charge.

See `BROADCAST_SLUM_PROOF.md`, the top of `ACCEPTANCE.md` and seven `review-broadcast-slum/` captures. `npm test`, `npm run check:syntax:all` and `git diff --check` passed locally. The generated source receipt identifies the committed head. Hosted Makko input/audio/feel review remains for the owner; keep this draft unmerged until acceptance.
