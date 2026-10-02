# Source Archive Update Protocol

## Update triggers

Update this source pack whenever a development milestone becomes reviewable, the owner changes a requirement, owner testing changes acceptance status, or a project PR merges. The user requested a regularly maintained source ZIP; maintenance must report actual changes and must not silently implement unrelated features or claim tests that did not run.

Keep one current downloadable archive identity. Use versioned file history for successive contents; use Git for code history. Do not create a new “current” archive for every small edit or modify the uploaded v2/v3/v4 historical files. Archive refresh is read/build/save maintenance; it is not authorization to merge an untested branch.

## Canonical inputs

- `docs/source-pack/` in the repository contains the editable pack documents.
- The current code/PR revision determines implementation truth.
- `DECISION_REGISTER.md` distinguishes approved direction from unresolved specifics.
- `CURRENT_STATE.md`, `ACCEPTANCE.md` and `CHANGELOG.md` must identify meaningful changes and verification limits.
- Build metadata is generated from the exported revision. Never hand-edit a SHA or present a dirty working tree as a committed snapshot. The snapshot retains repository paths; convenient root copies of text pack documents are generated from those same committed bytes. Historical review images and videos remain in Git but are omitted from the ZIP with explicit manifest reasons so code and editable source art fit in one handoff. Keep the approved layered-city baseline video and the current six-family contact/still images; the four current moving clips remain in Git.

## One recorded current checkpoint

`CURRENT_CHECKPOINT.json` is the editable record for the latest verified merged
checkpoint, latest recorded continuation task/branch, scoped automated evidence,
and separately recorded human acceptance. It is dated handoff information, not a
live GitHub query. Do not store the current commit's own SHA in this file: a commit
cannot contain its own hash. The builder's existing `SOURCE_MANIFEST.json` continues
to identify the exact exported revision and its review/merged publication state.

Before resuming work and at the next authorized milestone/merge handoff, inspect
remote main, relevant PRs and the latest owner instruction, then update this record.
Use `activeWork.status: "none"` when there is no continuing task; do not leave a
completed branch described as the next task. A merge does not establish Makko,
physical-controller, listening, comfort, balance or device-frame-pacing acceptance.
Only record human acceptance from actual owner evidence and identify its scope.

Run `npm run checkpoint:sync` to regenerate the bounded current blocks at the top
of `CONTINUE_HERE.md`, `CURRENT_STATE.md`, both READMEs, `AGENTS.md`,
`PROJECT_INSTRUCTIONS.md` and `ACCEPTANCE.md`. Text outside those blocks stays intact.
Old dated instructions and pending/candidate claims remain historical, not a queue
of work to repeat. Do not prepend new active instructions ahead of the generated
block or edit generated fields by hand. Add detailed dated history below it.

`npm run check:checkpoint` rejects missing/malformed blocks and record/header
drift; `npm run test:checkpoint` exercises repair, history preservation and exact
revision export. Both run in `npm test`, so the existing validation workflow gates
its normal source-pack artifact. Checks are independent of the checkout branch
and do not contact GitHub or infer owner approval. Sync refuses ambiguous marker
boundaries rather than risking historical text; restore the marker pair from Git
before synchronizing in that case.

The existing pack builder checks these same bytes from `--revision` before export,
never substitutes working-tree docs, and adds a byte-identical `CONTINUE_HERE.md`
at the pack root. The record is included in the existing JSON root-copy mechanism.
Pre-record historical revisions still export unchanged and are explicitly labeled
as lacking checkpoint metadata. Current revisions with incomplete or mismatched
metadata fail without replacing the last good ZIP. Checksums, exact-revision test
receipts, CI artifacts and the canonical downloadable archive identity are retained.
Keep each schema version's header-rendering contract stable. If that format changes,
bump the schema and retain its older renderer, or rebuild an old revision using its
own checked-out tools; do not silently reinterpret historical generated headers.
This workflow performs no automatic Git commits, merges, deployment or archive
publication; those actions remain subject to the current task's authorization.

## At each reviewable milestone

1. Read the current owner instructions, current head and PR state; do not reuse old context as evidence of current merge state.
2. Finish the scoped work and run its necessary checks. Preserve test exit status and the exact tested revision.
3. Update the current checkpoint record and synchronize its headers, then update relevant decision/acceptance/changelog history, including deferred work and Makko status. Run the consistency check and commit the reviewable result on its branch.
4. Build the archive from that commit: `python3 tools/build-source-pack.py --output /absolute/path/BARCODE-System-Override-Source-Pack-v5.zip --revision HEAD`.
5. Include the generated manifest/hashes and actual test evidence when supplied to the builder. Inspect the ZIP inventory and ensure all paths remain inside the archive root. The builder excludes historical `project_sources/**/*.zip` inputs and superseded binary review media, recording every exclusion in the manifest; those originals stay in Git. Review the tracked inventory for secrets, dependencies or transient work before committing; `.git` and untracked files never enter a Git-tree export.
6. Save the new bytes as a version of the established current archive and provide its download link. Keep the archive's stored file identity in the maintenance task/metadata once created.
7. Report what became playable, what was tested, what the owner must check and the next milestone. Do not replace a blocked saving action with a false “updated” claim.

## At merge

Fetch/read the actual merged revision and PR metadata. Rebuild from the exact merge commit, preserving the previously tested SHA and owner acceptance record. If the tested code differs from merged code beyond the merge itself, inspect that difference and resolve its concrete validation risk. Update the same archive identity and record merge SHA/PR/test status. A scheduled merge check may perform these read/build/save steps only; it must not grant itself implementation, merge or external messaging authority.

## Automation and failures

The repository build can produce the ZIP in CI; a configured project maintenance automation can check for new merged commits and refresh the downloadable current archive. Configuration and latest execution are separate facts: record a real automation ID/status only after setup succeeds, and do not describe a scheduled task as having already refreshed a future revision.

If no changes occurred, retain the existing bytes/version. If repository access, build, tests or saving fails, preserve the last good archive, explain the specific failure and leave its old SHA visible. Never overwrite a working package with an incomplete export.
