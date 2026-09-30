# Completed Cache Road handoff

Base: merged PR #154, `a1aeeddfa6d3cc385b413bf41330849c974c1398`.
Its eight-scene bridge and full prior CI passed. This bounded follow-up on
`agent/cache-completed-handoff` repairs saved-road handoff behavior; it does
not promote the road proof into authored Level 2.

## Reproduced defect and contract

Direct Continue started road music before restoring the saved road state.
That could play a completed result, or start a playable checkpoint before
its saved bar supplied the source offset. Re-entering a nested `road-clear`
through the bridge also lost its terminal status. Both entry paths now
reconstruct completion from the checkpoint identity.

Restore road state before deciding playback. A completed result stays visible
and silent, including after shared-loop updates; only an explicit **Retry**
starts a new drive. A playable checkpoint starts the existing transport once
at its restored bar. The focused bar-76 case resumes at **142.5 seconds**;
deliberate Retry resets progress/bar/score and starts once at zero; duplicate
Retry is rejected. Story reading and Ready remain silent. Direct restoration
of a clear also stops any existing road transport/engine.

Terminal screens now own controller input separately from driving. A held
Retry/Exit button arriving at the result boundary must be released before a
fresh press acts; it cannot immediately replay or leave the result. Menu
pauses the result, and resume retains that release requirement. Driving
bindings and keyboard/development-test contracts stay unchanged.

Audio preparation is retained for the existing synchronous Retry path.
Silent completed Continue is therefore not an offline or audio-independent
entry route. Legacy v1/v2 one-lap clears normalize to bar 100 only when
constructing terminal state, so later v4 checkpoint writes remain valid.
Playable legacy migration stays unchanged. Keep failed preparation retryable
and existing asynchronous cancellation protection intact.

## Preserved scope and validation

Keep the existing `level-02` save identity and `level-02.proof` music profile,
Voice, Level 1 results, road checkpoint facts, bridge script/art, driving
bindings, music grid, sound and driving rules. There is no Bass, durable Level 2 clear,
new lore/module, Mac stage or automatic replay award.

Focused lifecycle/bridge and road-proof checks pass restore ordering, one
source start at the saved offset, silent completed results and explicit Retry.
An earned 100-bar clear survives exit and nested re-entry with its saved
statistics intact and no simulation advance/music start. Legacy v1/v2/v3
terminal roundtrips remain valid; Voice stays the sole earned key and Level 2
completion/Bass remain absent. All four clear/fail × Retry/Exit controller
cases pass held/release/fresh-press checks, including pause-menu resume.
Final combined regression, syntax and Chromium/CI results for this repair
are pending; the PR and generated receipt record their exact
revision and outcomes. Prior #154 success does not validate this new diff.
Makko/device behavior remains a separate review.

The next authored Level 2 scope—campaign completion/Bass, four optional
records and the delivery-to-Mac outro—remains a separate proposed pass.
Its exact content and reward/migration contract are separate; this repair
does not implement that broader work.
