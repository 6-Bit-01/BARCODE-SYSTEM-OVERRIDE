"""Build the static, same-origin System Override game without changing its source.

Usage: python tools/build-standalone.py --output PATH --receipt PATH
The output must be empty or owned by an earlier invocation of this tool. No
files are deleted. Canonical assets come from exact HEAD blobs, not a checkout
that may have translated text line endings. Runtime source uses the working
tree so an uncommitted standalone adapter can be reviewed and tested.
"""
import argparse
import hashlib
import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
RAW_ROOT = "https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/"
RAW_PATTERN = re.compile(re.escape(RAW_ROOT) + r"(?:[A-Za-z0-9._-]+|\$\{[^{}\r\n]+\})/")
ADAPTER = "src/engine/standalone-sprites.js"
OWNER_FILE = ".standalone-build.json"
TOOL_ID = "barcode-system-override-standalone-v1"
VIEWPORT_STYLE = """<style id="standalone-viewport-style">
/* Fit the complete native backing image; runtime owners still control display. */
.game-container {
  position: fixed; inset: 0; display: block; flex: none;
  width: 100vw; height: 100vh; margin: 0; padding: 0;
  background: #000; overflow: hidden;
}
#gameCanvas {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  flex: none; margin: 0; padding: 0; border: 0; box-sizing: border-box;
  width: min(100vw, 177.777778vh); height: min(100vh, 56.25vw);
  max-width: none; max-height: none; object-fit: contain; image-rendering: auto;
}
/* Keep redundant DOM status and control descriptions available to readers. */
.game-container > .topbar, .game-container > .hint {
  display: block !important; position: absolute !important; flex: none;
  width: 1px !important; height: 1px !important; margin: -1px !important;
  padding: 0 !important; border: 0 !important; overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important; clip-path: inset(50%) !important;
  white-space: nowrap !important;
}
</style>"""
SHIP_URLS = ["https://i.postimg.cc/xj3VcRP3/Ship1.gif",
             "https://i.postimg.cc/T1LNxnfz/Ship2.gif",
             "https://i.postimg.cc/1zM9TVmz/Ship3.gif"]
WHOOSH_PRIMARY = ["4e510bfa-7c4c-4cd5-be98-99669e092b21.mp3",
                  "c5fe25ff-72fd-4a40-a30d-70c1a148920a.mp3"]


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def safe_path(root, name):
    relative = PurePosixPath(name)
    require(not relative.is_absolute() and ".." not in relative.parts and
            "\\" not in name and ":" not in name and bool(relative.parts),
            f"Unsafe relative path: {name}")
    target = root.joinpath(*relative.parts)
    require(target.resolve().is_relative_to(root.resolve()), f"Path escapes root: {name}")
    return target


def git(*args):
    return subprocess.check_output(["git", "-c", f"safe.directory={ROOT.as_posix()}",
                                    "-C", str(ROOT), *args])


def read_originals():
    journal = ROOT / "assets/standalone/originals.json"
    records = json.loads(journal.read_text(encoding="utf-8"))
    require(isinstance(records, list) and records, "Missing preserved external originals")
    mapping, paths = {}, set()
    for record in records:
        name, source = record["path"], record["source"]
        require(name.startswith("assets/standalone/"), f"Unexpected original path: {name}")
        require(name not in paths and source not in mapping, "Duplicate preserved original")
        require(isinstance(record["bytes"], int) and record["bytes"] > 0 and
                re.fullmatch(r"[0-9a-f]{64}", record["sha256"]), f"Invalid original receipt: {name}")
        data = safe_path(ROOT, name).read_bytes()
        require(len(data) == record["bytes"] and sha(data) == record["sha256"],
                f"Preserved original has changed: {name}")
        mapping[source] = "./" + name
        paths.add(name)
    for number, primary in enumerate(WHOOSH_PRIMARY, 1):
        candidates = [url for url in mapping if url.endswith("/" + primary)]
        require(len(candidates) == 1, f"Missing primary whoosh {number}")
        destination = mapping[candidates[0]]
        mapping[f"https://api.makko.ai/storage/v1/object/public/audio-assets/whoosh{number}.mp3"] = destination
        mapping[f"/assets/sounds/whoosh{number}.mp3"] = destination
    return records, mapping, sha(journal.read_bytes())


def rewrite(name, data, mapping):
    text = data.decode("utf-8-sig")
    changes = []
    raw_roots = RAW_PATTERN.findall(text)
    text = RAW_PATTERN.sub("./", text)
    if raw_roots:
        changes.append({"kind": "game-github-root", "count": len(raw_roots),
                        "roots": sorted(set(raw_roots))})
    for original, destination in mapping.items():
        count = text.count(original)
        if count:
            text = text.replace(original, destination)
            changes.append({"kind": "preserved-original", "source": original,
                            "destination": destination, "count": count})
    if name == "index.html":
        original = '/lib/MakkoEngine.min.js'
        require(text.count(original) == 1, "Expected one host sprite engine script")
        text = text.replace(original, ADAPTER)
        changes.append({"kind": "independent-sprite-engine"})
        boot = "document.addEventListener('DOMContentLoaded', async function() {"
        require(text.count(boot) == 1, "Expected one existing DOM boot owner")
        text = text.replace(boot, boot + "\n            // The standalone host preloads through the existing deduplicated initializer.\n"
                            "            Promise.resolve(window.initSprites?.()).catch(error => console.error('Sprite preload failed:', error));")
        changes.append({"kind": "existing-boot-owner-sprite-preload"})
        require(text.count('</head>') == 1, "Expected one document head")
        text = text.replace('</head>', VIEWPORT_STYLE + '\n</head>')
        changes.append({"kind": "contained-native-viewport-css"})
    if name == "src/engine/spaceships.js":
        # A fallback must retain atlas metadata; drawing an entire atlas as an
        # ordinary GIF image would corrupt the visible ship geometry.
        old = ('const loadOriginal = () => loadSharedImageAsset(`image.level-01.ship-${index + 1}`, '
               'url).then(image => ({ image, sheet: null }));')
        new = ('const loadOriginal = () => sheet ? '
               'loadSharedImageAsset(`image.level-01.ship-${index + 1}.atlas.${sheet.atlasSHA256}`, '
               "'./' + sheet.image).then(image => ({ image, sheet })) : "
               "Promise.reject(new Error('Standalone ship atlas is missing'));")
        require(text.count(old) == 1, "Ship loader changed; review the atlas fallback transformation")
        text = text.replace(old, new)
        for number, url in enumerate(SHIP_URLS, 1):
            require(text.count(url) == 1, f"Unexpected ship {number} fallback")
            text = text.replace(url, f"./assets/traffic/ship-{number}.webp")
        changes.append({"kind": "local-ship-atlas-fallback", "count": 3})
    if name == "src/engine/cache-road-proof-profile.js":
        # The canonical validator requires HTTPS backups. In this package the
        # primary and its former remote backup resolve to the same local file,
        # so remove only that redundant property from the generated profile.
        require("const publishedAudio = './assets/audio/';" in text and
                'url: `assets/audio/cache-${name}.mp3`' in text,
                "Cache primary/backup locations changed; review duplicate removal")
        backup = '    backupUrl: `${publishedAudio}cache-${name}.mp3`,'
        require(text.count(backup) == 1, "Expected one Cache backup property template")
        text = text.replace(backup, '')
        changes.append({"kind": "remove-duplicate-local-music-backup", "sources": 5})
    require(RAW_ROOT not in text, f"Unresolved game GitHub root in {name}")
    require(not re.search(r"https?://[^\s/'\"`]*makko\.ai(?:/|\b)", text, re.I),
            f"Unresolved Makko runtime URL in {name}")
    require("/lib/MakkoEngine.min.js" not in text and "supabase.co/storage/" not in text,
            f"Unresolved host dependency in {name}")
    # A literal leading /assets path would resolve against the website root.
    require(not re.search(r"['\"`]\/assets/", text), f"Root-relative asset in {name}")
    return text.encode("utf-8"), changes


def canonical_assets(head):
    entries = []
    for row in git("ls-tree", "-r", "-z", head, "--", "assets").split(b"\0"):
        if not row:
            continue
        details, name = row.split(b"\t", 1)
        mode, kind, blob = details.decode("ascii").split()
        require(kind == "blob" and mode in ("100644", "100755"), "Unsupported asset tree entry")
        entries.append((name.decode("utf-8"), blob))
    require(entries, "HEAD contains no canonical assets")
    return entries


def verify_runtime(payloads):
    index = payloads["index.html"].decode("utf-8")
    scripts = re.findall(r'<script\b[^>]*\bsrc=["\']([^"\']+)', index, re.I)
    original_scripts = re.findall(r'<script\b[^>]*\bsrc=["\']([^"\']+)',
                                  (ROOT / "index.html").read_text(encoding="utf-8-sig"), re.I)
    require(scripts == [ADAPTER if path == "/lib/MakkoEngine.min.js" else path
                        for path in original_scripts], "Script order changed")
    require(scripts.count(ADAPTER) == 1 and scripts.index(ADAPTER) < scripts.index("src/engine/sprite-playback.js"),
            "Sprite adapter must precede existing playback owners")
    for name in scripts:
        require(name in payloads, f"Missing browser script: {name}")
    stylesheets = re.findall(r'<link\b[^>]*\brel=["\']stylesheet["\'][^>]*\bhref=["\']([^"\']+)', index, re.I)
    for name in stylesheets:
        require(name in payloads, f"Missing linked stylesheet: {name}")
    manifest = json.loads(payloads["sprites-manifest.json"])
    original = json.loads((ROOT / "sprites-manifest.json").read_text(encoding="utf-8-sig"))
    calibration = json.loads(json.dumps(manifest))
    total = 0
    for character, record in manifest["characters"].items():
        for clip, entry in record["animations"].items():
            for kind in ("image", "json"):
                path = entry[kind]
                require(path.startswith("./assets/"), f"Sprite is not local: {character}/{clip}/{kind}")
                calibration["characters"][character]["animations"][clip][kind] = original["characters"][character]["animations"][clip][kind]
            untouched = {key: value for key, value in entry.items() if key not in ("image", "json")}
            expected = {key: value for key, value in original["characters"][character]["animations"][clip].items()
                        if key not in ("image", "json")}
            require(untouched == expected, f"Sprite calibration changed: {character}/{clip}")
            total += 1
    require(calibration == original, "Manifest changed beyond image/JSON locations")
    # Do not rewrite inert traffic sourceUrl provenance. It is never requested.
    exceptions = {"src/engine/traffic-sheets.js": set(SHIP_URLS),
                  "index.html": {"https://fonts.googleapis.com"}}
    external = []
    for name, data in payloads.items():
        for url in re.findall(r"https?://[^\s'\"`<>]+", data.decode("utf-8")):
            if url.startswith(("http://www.w3.org/", "https://www.w3.org/", "http://localhost/")):
                continue
            allowed = any(url.startswith(prefix) for prefix in exceptions.get(name, set()))
            require(allowed, f"Unexpected external reference in {name}: {url}")
            external.append({"path": name, "url": url, "purpose": "font stylesheet" if name == "index.html" else "inert original GIF provenance"})
    return {"orderedScripts": scripts, "spriteAnimations": total, "remainingExternalReferences": external}


def build(output, receipt):
    output, receipt = output.resolve(), receipt.resolve()
    require(output != ROOT and not output.is_relative_to(ROOT), "Output must be outside the game checkout")
    require(not receipt.is_relative_to(output), "Private receipt must be outside the public game output")
    owner = output / OWNER_FILE
    previous = set()
    if output.exists() and any(output.iterdir()):
        require(owner.is_file(), "Output is not empty and is not owned by this builder")
        ownership = json.loads(owner.read_text(encoding="utf-8"))
        require(ownership.get("builder") == TOOL_ID, "Output belongs to another builder")
        previous = set(ownership["ownedFiles"])
    records, mapping, originals_hash = read_originals()
    head = git("rev-parse", "HEAD").decode("ascii").strip()
    tree = git("rev-parse", "HEAD^{tree}").decode("ascii").strip()
    source_paths = ["index.html", "style.css", "sprites-manifest.json"] + sorted(
        path.relative_to(ROOT).as_posix() for path in (ROOT / "src").rglob("*") if path.is_file())
    require(ADAPTER in source_paths, "Standalone sprite adapter is missing")
    payloads, sources = {}, []
    for name in source_paths:
        data = safe_path(ROOT, name).read_bytes()
        rewritten, changes = rewrite(name, data, mapping)
        payloads[name] = rewritten
        sources.append({"path": name, "inputSHA256": sha(data), "outputSHA256": sha(rewritten),
                        "bytes": len(rewritten), "transformations": changes})
    checks = verify_runtime(payloads)
    entries = canonical_assets(head)
    originals = {record["path"]: record for record in records}
    names = set(payloads) | {name for name, _ in entries} | set(originals) | {OWNER_FILE}
    for name in names:
        target = safe_path(output, name)
        require(not target.exists() or name in previous, f"Refusing to overwrite an unowned file: {name}")
    stale = previous - names
    require(not any(safe_path(output, name).exists() for name in stale),
            "Old generated files remain; choose a fresh empty output rather than deleting them")
    output.mkdir(parents=True, exist_ok=True)
    # Recover an interrupted copy by recording the exact generated paths before
    # writing them. An in-progress marker never claims the package passed.
    owner.write_text(json.dumps({"builder": TOOL_ID, "status": "building",
                                "ownedFiles": sorted(names)}, indent=2) + "\n", encoding="utf-8")
    assets = []
    process = subprocess.Popen(["git", "-c", f"safe.directory={ROOT.as_posix()}",
                                "-C", str(ROOT), "cat-file", "--batch"],
                               stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    try:
        for name, blob in entries:
            process.stdin.write((blob + "\n").encode("ascii"))
            process.stdin.flush()
            header = process.stdout.readline().decode("ascii").strip().split()
            require(len(header) == 3 and header[0] == blob and header[1] == "blob", f"Bad Git blob: {name}")
            size = int(header[2])
            data = process.stdout.read(size)
            require(len(data) == size and process.stdout.read(1) == b"\n", f"Incomplete Git blob: {name}")
            target = safe_path(output, name)
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
            assets.append({"path": name, "gitBlob": blob, "sha256": sha(data), "bytes": size,
                           "source": "exact HEAD Git blob"})
        process.stdin.close()
        require(process.wait() == 0, "Git asset copy failed")
    finally:
        if process.poll() is None:
            process.kill()
            process.wait()
    for record in records:
        data = safe_path(ROOT, record["path"]).read_bytes()
        require(len(data) == record["bytes"] and sha(data) == record["sha256"], "Original changed during build")
        target = safe_path(output, record["path"])
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        assets.append({**record, "source": record["source"]})
    for name, data in payloads.items():
        target = safe_path(output, name)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    assets_by_path = {}
    for record in assets:
        if record["path"] in assets_by_path:
            require(record["sha256"] == assets_by_path[record["path"]]["sha256"],
                    f"HEAD and preserved original disagree: {record['path']}")
        assets_by_path[record["path"]] = record
    assets = list(assets_by_path.values())
    for record in assets:
        require(sha(safe_path(output, record["path"]).read_bytes()) == record["sha256"],
                f"Output asset hash mismatch: {record['path']}")
    for name in checks["orderedScripts"]:
        require(safe_path(output, name).is_file(), f"Script not emitted: {name}")
    manifest = json.loads(payloads["sprites-manifest.json"])
    for character in manifest["characters"].values():
        for entry in character["animations"].values():
            for kind in ("image", "json"):
                require(safe_path(output, entry[kind][2:]).is_file(), f"Missing emitted sprite: {entry[kind]}")
    limitations = ["Historical pinned GitHub URLs were not independently compared with current HEAD blobs.",
                   "Asset hashes and static checks do not establish browser playback, audio, gameplay or native performance.",
                   "Saves belong to the browser origin; this build does not automatically transfer Makko saves."]
    file_hashes = {record["path"]: {"sha256": record["sha256"], "bytes": record["bytes"]}
                   for record in assets}
    file_hashes.update({record["path"]: {"sha256": record["outputSHA256"], "bytes": record["bytes"]}
                       for record in sources})
    require(set(file_hashes) == names - {OWNER_FILE}, "Public hash manifest is incomplete")
    public = {"builder": TOOL_ID, "status": "complete", "sourceCommit": head, "sourceTree": tree,
              "builderSHA256": sha(Path(__file__).read_bytes()), "files": file_hashes,
              "sourceMode": "working-tree runtime scripts; exact HEAD canonical asset blobs",
              "canonicalAssetCount": len(entries), "preservedOriginalCount": len(records),
              "assetBytes": sum(record["bytes"] for record in assets), "ownedFiles": sorted(names),
              "limitations": limitations}
    owner.write_text(json.dumps(public, indent=2) + "\n", encoding="utf-8")
    result = {**public, "builtAtUTC": datetime.now(timezone.utc).isoformat(),
              "output": str(output), "originalsReceiptSHA256": originals_hash,
              "runtimeSources": sources,
              "assets": assets, "checks": checks, "publication": "local generated draft; no push or deployment"}
    receipt.parent.mkdir(parents=True, exist_ok=True)
    receipt.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "receipt": str(receipt), "sourceCommit": head,
                      "scripts": len(checks["orderedScripts"]), "canonicalAssets": len(entries),
                      "preservedOriginals": len(records), "assetBytes": public["assetBytes"]}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--receipt", type=Path, required=True)
    args = parser.parse_args()
    build(args.output, args.receipt)
