# Standalone BARCODE website build

The existing BARCODE Next.js website hosts the game as a static document at
`/games/system-override/index.html`, with a normal website entry at
`/system-override`. No iframe editor or Makko SDK is required.

Build from this repository with Python 3:

```text
python tools/build-standalone.py --output <website>/public/games/system-override --receipt <private-verification>/build-receipt.json
node tools/check-standalone-build.js <website>/public/games/system-override
node tools/check-standalone-sprites.js
```

The output directory must be empty or contain the builder's ownership manifest.
The builder verifies assets against Git HEAD and the SHA-256 receipt in
`assets/standalone/originals.json`. Source artwork is copied without resampling.
Generated scripts replace pinned remote asset roots with local paths and load
the independent sprite adapter before the existing playback owner. Font loading
uses the existing Google Fonts stylesheet; gameplay artwork and audio are local.

The public ownership manifest records source revision and generated-file hashes.
The detailed private receipt stays outside the public website. Local review
shortcuts and diagnostic instrumentation also stay outside the published output.
Rebuild after committing source so the published receipt names the actual commit.

Existing gameplay, progression, clock, input, settings and pause owners remain
authoritative. Saves use browser storage for the current origin; a Makko save
does not automatically transfer to the website. The sprite compatibility alias
`MakkoEngine` is provided by our local adapter, not a vendor service.

Validate the game with its full npm suite and all-file syntax checks; validate
the website with its required check/build workflow. Hosted runtime and frame
pacing acceptance must be recorded separately. Hosting alone does not establish
a frame-rate improvement or completion of the outstanding keyboard audit.
