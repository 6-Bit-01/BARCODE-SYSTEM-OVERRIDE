# Source Archive Update Protocol

## Update triggers

Update this source pack whenever a development milestone becomes reviewable, the owner changes a requirement, owner testing changes acceptance status, or a project PR merges. The user requested a regularly maintained source ZIP; maintenance must report actual changes and must not silently implement unrelated features or claim tests that did not run.

Keep one current downloadable archive identity. Use versioned file history for successive contents; use Git for code history. Do not create a new “current” archive for every small edit or modify the uploaded v2/v3/v4 historical files. Archive refresh is read/build/save maintenance; it is not authorization to merge an untested branch.

## Canonical inputs

- `docs/source-pack/` in the repository contains the editable pack documents.
- The current code/PR revision determines implementation truth.
- `DECISION_REGISTER.md` distinguishes approved direction from unresolved specifics.
- `CURRENT_STATE.md`, `ACCEPTANCE.md` and `CHANGELOG.md` must identify meaningful changes and verification limits.
- Build metadata is generated from the exported revision. Never hand-edit a SHA or present a dirty working tree as a committed snapshot. The snapshot retains repository paths; convenient root copies of the pack documents are generated from those same committed bytes.

## At each reviewable milestone

1. Read the current owner instructions, current head and PR state; do not reuse old context as evidence of current merge state.
2. Finish the scoped work and run its necessary checks. Preserve test exit status and the exact tested revision.
3. Update decision/current-state/acceptance/changelog docs, including deferred work and Makko status. Commit the reviewable result on its branch.
4. Build the archive from that commit: `python3 tools/build-source-pack.py --output /absolute/path/BARCODE-System-Override-Source-Pack-v5.zip --revision HEAD`.
5. Include the generated manifest/hashes and actual test evidence when supplied to the builder. Inspect the ZIP inventory and ensure all paths remain inside the archive root. The builder excludes historical `project_sources/**/*.zip` inputs and records every exclusion in the manifest; those originals stay in Git. Review the tracked inventory for secrets, dependencies or transient work before committing; `.git` and untracked files never enter a Git-tree export.
6. Save the new bytes as a version of the established current archive and provide its download link. Keep the archive's stored file identity in the maintenance task/metadata once created.
7. Report what became playable, what was tested, what the owner must check and the next milestone. Do not replace a blocked saving action with a false “updated” claim.

## At merge

Fetch/read the actual merged revision and PR metadata. Rebuild from the exact merge commit, preserving the previously tested SHA and owner acceptance record. If the tested code differs from merged code beyond the merge itself, inspect that difference and resolve its concrete validation risk. Update the same archive identity and record merge SHA/PR/test status. A scheduled merge check may perform these read/build/save steps only; it must not grant itself implementation, merge or external messaging authority.

## Automation and failures

The repository build can produce the ZIP in CI; a configured project maintenance automation can check for new merged commits and refresh the downloadable current archive. Configuration and latest execution are separate facts: record a real automation ID/status only after setup succeeds, and do not describe a scheduled task as having already refreshed a future revision.

If no changes occurred, retain the existing bytes/version. If repository access, build, tests or saving fails, preserve the last good archive, explain the specific failure and leave its old SHA visible. Never overwrite a working package with an incomplete export.
