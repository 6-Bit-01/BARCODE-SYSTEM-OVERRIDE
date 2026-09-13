# Actual opening overhaul

Originally implemented in merged PR #40. Current repair base/rollback: `a747b58411650146bdc003a529d0470167d275db`; branch `agent/intro-makko-repair`. `INTRO_REPAIR.md` records the context/asset repair and the owner's scene-placed dialogue styling request. The opening script below is retained. `INTRO_TO_LEVEL_01.md` supplies its rewritten tutorial continuation. The source manifest identifies the exported head and PR.

The eight pages below implement the five beats from CAMPAIGN_STORY_MAP: active crew broadcast → specific failure/contradictory report → different responses → 6 Bit chooses action → restore Dead Air District. This is concrete new game writing/presentation for owner review, not a claim of previously approved exact dialogue. The title/tutorial's existing 9 Bit disclosure and later origin/motive questions remain intact. The original four carry the prologue. With the subsequently supplied models, Cliff appears in one background maintenance cameo on page 2; other characters remain offscreen or obscured. INTRO_ART_DIRECTION.md records the current model authority and eight new scene assets.

[Eight-page contact sheet](verification/intro-contact.webp) · [Skip progress](verification/intro-skip.webp) · [Reduced effects / inspection](verification/intro-reduced-effects.webp)

## Implemented script

### 1. LEAVE THE ROOM NOISE IN — O1

On-screen caption: **BARCODE / ON AIR**

**DJ FLOPPYDISC:** One more pass. Leave the room noise in.

**6 BIT:** That's the part that proves somebody's here.

[Full page 1](verification/intro-01.webp)

### 2. KEEP THE TAKE — O1

On-screen caption: **DEAD AIR DISTRICT / LIVE**

**MAC MODEM:** Street relays are open. You're reaching the whole district.

**CACHE BACK:** Rolling. Names, mistakes, everything. This one stays.

[Full page 2](verification/intro-02.webp)

### 3. THEN THE RETURN GOES QUIET — O2

On-screen caption: **NO BROADCAST DETECTED**

**DJ FLOPPYDISC:** We were on the air a second ago.

**6 BIT:** Then your detector needs a new job.

[Full page 3](verification/intro-03.webp)

### 4. SAVE THE PART IT WANTS GONE — O3

On-screen caption: **RECOVERY REQUEST: DISCARD UNREADABLE AUDIO**

**CACHE BACK:** It wants a clean copy. I've locked the original.

**MAC MODEM:** The outside route is still there. I'm getting you access.

[Full page 4](verification/intro-04.webp)

### 5. LISTEN UNDER THE STATIC — O3

On-screen caption: **CREW CHANNEL / STILL OPEN**

**DJ FLOPPYDISC:** There's still something under that noise. Don't wipe it.

**6 BIT:** Keep listening. Tell me when it changes.

[Full page 5](verification/intro-05.webp)

### 6. 6 BIT HAS OTHER PLANS — O4

On-screen caption: **PLEASE WAIT FOR AUTOMATIC RECOVERY**

**6 BIT:** Automatic recovery can wait. I'm going outside.

**MAC MODEM:** Good. I can open the way. I can't walk it for you.

[Full page 6](verification/intro-06.webp)

### 7. START WITH THIS DISTRICT — O5

On-screen caption: **TOWER UPLINK / BLOCKED**

**MAC MODEM:** The interference runs toward the tower. Street level is jammed.

**6 BIT:** Then we get the neighborhood talking first. The tower can hear us coming.

[Full page 7](verification/intro-07.webp)

### 8. DEAD AIR DISTRICT — O5

On-screen caption: **RESTORE THE LOCAL SIGNAL. FIND THE JAMMER.**

**CACHE BACK:** We are still here, 6. Keep us on the line.

**6 BIT:** All four of us. Leave it open.

[Full page 8](verification/intro-08.webp)

## Presentation and controls

The eight wide scenes follow the supplied 6 Bit, Cache, Cliff, DJ and Mac models. In the current repair each illustration fills the image area, with manually positioned comic speech balloons and distinct offscreen comms cards. White/cyan/yellow/red tabs identify the original four. The flat return and paired surviving traces are visible in the artwork itself; duplicate side crops and the separate synthetic scope panel are removed. On page 6, the recovery order slides left as 6 Bit refuses it; reduced effects show the same displaced endpoint. The final page leads into the existing fade and the rewritten crew-channel tutorial in INTRO_TO_LEVEL_01.md. Commit-pinned public copies of the eight WebPs are tried before their bundled relative fallback; no obsolete character art is used. The soundtrack/audio handoff remains intact.

Space, Enter, click or controller A advances after a 250ms repeat guard. Pages wait for the reader; there is no automatic movie-length timer. S and controller B independently skip the whole opening after a continuous five-second hold. Releasing one input cancels only its own hold. Blur/hidden tabs cancel all unattended holds. The controller poll no longer clears keyboard S. Advance and skip inputs are consumed before the tutorial gains control.

Left Arrow / D-pad Left on page 6 inspects the displaced caption and reveals the margin note: **“WAIT” IS NOT A PLAN.** The existing results callback reads this run-only `egg.comic.gutter` fact. Fresh-run/stop resets it; no new lore save, collection threshold or ending outcome is introduced. It seeds later mapped L4/L7 panel callbacks without claiming those later levels are implemented.

## Ownership, validation and limits

CutsceneSystem owns rendering, a single 50ms control/presentation poll, image requests, transition guards and the existing four-second intro-song fade. No gameplay RAF runs before the opening finishes. Slow/missing art has a readable fallback and cannot block skipping; loading callbacks/timeouts cancel on exit. Stopping during initialization settles the opening promise and cannot later start a stale tutorial or loop. The unrelated signal-integrity animation RAF and orphan twelfth subtitle are removed. All eight script entries are reachable.

`npm run check:intro` executes the production opening, InputManager/GamepadUI and RuntimeLifecycle with explicit browser/image/clock/audio boundary fixtures. It covers the reported S regression, keyboard repeat, A/B, overlapping holds, release/focus/disconnect, all eight pages, discovery reset, direct tutorial-to-mission handoff, single music startup and stale cleanup. The full required suite and all-file syntax are also required; exact results are exported in the receipt. Native Canvas renders exercise the same CutsceneSystem → IntroSequence drawing and check page/dialogue bounds. They do not prove physical-controller feel, browser audio permission or Makko rendering.

Follow ACCEPTANCE for owner review before merge. No HUD/combat changes belong to this opening correction: the owner's order is intro first, then a separate HUD/rhythm/attack-variety follow-up, then campaign/save/mixer services.
