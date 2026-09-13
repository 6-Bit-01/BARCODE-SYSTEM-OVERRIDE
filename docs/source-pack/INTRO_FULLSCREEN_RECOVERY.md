# Intro black-screen recovery

Base and rollback: merged #41, `897b750cf64bafe3d50746cd7c8c19379ef4fbf6`. Branch: `agent/intro-fullscreen-recovery`. This is the continuation of the owner's broken-intro report, not a new story/art pass. The generated source receipt and GitHub PR identify the exact published revision.

## Confirmed cause

The production Start handler synchronously requests fullscreen. FullscreenManager selected `#gameCanvas`. RuntimeLifecycle then set that canvas to `display:none` while awaiting the intro. CutsceneSystem appended its DOM overlay to `document.fullscreenElement`, which could still be the hidden canvas. HTML canvas children are fallback content, so even restoring the canvas display would not make those DOM panels render normally. If fullscreen settled after the intro was mounted in the body, the canvas fullscreen tree excluded the overlay instead.

The previous intro VM fixture had no fullscreen manager or fullscreen tree. It verified drawing calls and the hidden gameplay canvas, but not whether the drawn intro was visible. The added ancestry check fails on merged #41 with `presentation is not inside a hidden element`.

## Repair

- Fullscreen the document root, which contains the title, intro, gameplay canvas and retry UI throughout startup.
- Mount the intro in the stable body container. Do not mount UI as canvas fallback children or choose its parent based on when an asynchronous fullscreen request finishes.
- Keep #41's eight approved images, authored speech/comms placement, loading fallback, one acquired context, independent S/B holds, tutorial dialogue/objective IDs, and audio handoff. No gameplay, new art, asset URL or npm dependency changes.

## Verification

`tools/check-intro.js` now loads the production fullscreen manager and checks requests settling both before and after intro creation, denied fullscreen, exit/re-entry, visible DOM ancestry, clicks and keyboard skip, and the real tutorial handoff. Existing checks still cover all eight panels, context budget, image failure/cancellation, controller ownership, real tutorial chapters, mission start at zero and audio scheduling.

`tools/check-intro-browser.cjs` uses Node 22's built-in DevTools/WebSocket access and an installed Chromium. It loads the production page markup/styles, exact Start adapter, fullscreen, intro, tutorial and lifecycle code. It verifies native fullscreen, rendered/clickable canvas bounds, decoded bundled artwork and nonblack pixels, pointer and keyboard advancement, resize, visible initialization failure/retry, early skip release, and normal/skipped tutorial entry. Screenshots and `result.json` are uploaded by CI. External image requests are deliberately blocked to exercise the existing local fallback without a network dependency. Initializer, gameplay loop and audible audio are explicit omitted boundaries; this is not a Makko emulator.

The full existing `npm test` and `npm run check:syntax:all` pass locally. Local Chromium installation timed out; CI browser results must be read before reporting a browser PASS. Owner Makko acceptance remains pending. Use the top ACCEPTANCE route; do not merge or call the owner's game fixed until that host review.

The attached v3/v4 packs were inspected as historical audit inputs; they predate the approved replacement intro. Recent conversations, #38–#41 and current source-pack guidance control this repair. HUD/rhythm/attack variety remains the next authorized milestone after intro recovery.
