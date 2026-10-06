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
import math
import re
import subprocess
import zlib
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
RAW_ROOT = "https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/"
RAW_PATTERN = re.compile(re.escape(RAW_ROOT) + r"(?:[A-Za-z0-9._-]+|\$\{[^{}\r\n]+\})/")
ADAPTER = "src/engine/standalone-sprites.js"
TOUCH_SCRIPT = "src/core/touch-controls.js"
VENDOR_ROOT = "src/vendor/pixi-8.22.0/"
BASIS_ROOT = "src/vendor/basis-2.50/"
BINARY_VENDOR_FILES = {BASIS_ROOT + "basis_transcoder.wasm"}
# Exact npm 8.22.0 bytes; never localize or rewrite third-party source.
VENDOR_FILES = {
    VENDOR_ROOT + "pixi.min.js": "06d9ef9823e743518793083c296d801e752db128cb1f519fbabe37e1259567ea",
    VENDOR_ROOT + "LICENSE": "5ce7447bc57f7349ffc48338782fbcabe613696e00712b20d66bc58e780f9473",
    VENDOR_ROOT + "provenance.json": "a5c6a646c2b1b37cbd65356d0475474d9b307910a8d888f8885918d860032075",
    BASIS_ROOT + "basis_transcoder.js": "720dd9bd09c7cada6d87f1b7b70cec713df04da88cd641ac3212559353834dc8",
    BASIS_ROOT + "basis_transcoder.wasm": "a0f65d4a30ecb3269d01ead7d0a3477d2b0208146d083625a90623f473f6c139",
    BASIS_ROOT + "LICENSE": "065fcf48d6af21c0b75e23be5ed5753aee75c892e1c2cf178fa6736305614a5c",
    BASIS_ROOT + "provenance.json": "49c856c675a79368ecc76e356eec90ce7aa87bf2f1da302cf51aa1f647fa03ed",
}
VENDOR_REFERENCES = {
    VENDOR_ROOT + "pixi.min.js": {
        "http://www.opensource.org/licenses/mit-license": "upstream MIT license reference",
        "http://www.pixijs.com/": "upstream console credit",
        **{f"https://cdn.jsdelivr.net/npm/pixi.js/transcoders/{name}":
           "inert upstream loader default; the game uses its own local pinned transcoder"
           for name in ("basis/basis_transcoder.js", "basis/basis_transcoder.wasm",
                        "ktx/libktx.js", "ktx/libktx.wasm")},
    },
    VENDOR_ROOT + "provenance.json": {
        "https://github.com/pixijs/pixijs/releases/tag/v8.22.0": "pinned vendor release provenance",
        "https://registry.npmjs.org/pixi.js/-/pixi.js-8.22.0.tgz": "integrity-verified npm provenance",
    },
    BASIS_ROOT + "LICENSE": {
        "http://www.apache.org/licenses/": "upstream Apache license reference",
        "http://www.apache.org/licenses/LICENSE-2.0": "upstream Apache license reference",
    },
    BASIS_ROOT + "provenance.json": {
        "https://github.com/BinomialLLC/basis_universal/releases/tag/v2_50": "pinned decoder release provenance",
    },
}
OWNER_FILE = ".standalone-build.json"
TOOL_ID = "barcode-system-override-standalone-v1"
MAC_REVIEW_ASSETS = {"assets/mac-street-review/" + name for name in (
    "cache-walk-to-car-v6.png", "mac-hero-v2.png", "mac-poses-v3-frames.json", "mac-poses-v3.png",
    "scene03-kave-dead-air-v5.png", "scene05-margin-note-v1.png", "scene06-record-straight-v1.png",
    "street-panorama-v1.png")}
MAC_CITY_ASSETS = {"assets/mac-city-review/" + name for name in (
    "chitin_scuttler-v1.png", "chitin_scuttler-v1-frames.json",
    "psion_lancer-v2.png", "psion_lancer-v2-frames.json",
    "bile_spitter-v1.png", "bile_spitter-v1-frames.json",
    "prism_guard-v1.png", "prism_guard-v1-frames.json",
    "rift_stalker-v1.png", "rift_stalker-v1-frames.json",
    "shock_mantid-v2.png", "shock_mantid-v2-frames.json",
    "null_regent-v2.png", "null_regent-v2-frames.json",
    "service-alley-v1.png", "night-market-v1.png", "transit-concourse-v1.png",
    "relay-canal-v1.png", "rooftop-relay-v1.png", "broadcast-plaza-v1.png",
    "mac-city-art-v1.json", "mac-attacks-v4.png", "mac-attacks-v4-frames.json")}
MAC_RIG_ACTORS = ("mac", "chitin_scuttler", "psion_lancer", "bile_spitter", "prism_guard",
                  "rift_stalker", "shock_mantid", "null_regent")
MAC_RIG_ASSETS = {"assets/mac-combat-rigs/" + name for name in (
    "mac-combat-art-v1.json", "mac-modem-v2.png", "mac-modem-v2-rig.json",
    "chitin_scuttler-v1.png", "chitin_scuttler-v1-rig.json",
    "psion_lancer-v1.png", "psion_lancer-v1-rig.json",
    "bile_spitter-v1.png", "bile_spitter-v1-rig.json",
    "prism_guard-v1.png", "prism_guard-v1-rig.json",
    "rift_stalker-v1.png", "rift_stalker-v1-rig.json",
    "shock_mantid-v1.png", "shock_mantid-v1-rig.json",
    "null_regent-v1.png", "null_regent-v1-rig.json")}
VIEWPORT_STYLE = """<style id="standalone-viewport-style">
/* Fit the complete native backing image; runtime owners still control display. */
.game-container {
  position: fixed; inset: 0; display: block; flex: none;
  width: 100vw; height: 100vh; margin: 0; padding: 0;
  background: #000; overflow: hidden;
}
#gameCanvas, #cacheRoadGpuCanvas {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  flex: none; margin: 0; padding: 0; border: 0; box-sizing: border-box;
  width: min(100vw, 177.777778vh); height: min(100vh, 56.25vw);
  max-width: none; max-height: none; object-fit: contain; image-rendering: auto;
}
#gameCanvas { z-index: 1; }
#cacheRoadGpuCanvas { z-index: 0; pointer-events: none; }
#gameCanvas.cache-road-gpu-active { background: transparent; }
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
    if name.startswith((VENDOR_ROOT, BASIS_ROOT)):
        require(name in VENDOR_FILES and sha(data) == VENDOR_FILES[name],
                f"Pinned vendor bytes changed: {name}")
        return data, [{"kind": "exact-pinned-vendor-bytes",
                       "version": "8.22.0" if name.startswith(VENDOR_ROOT) else "2.50"}]
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
    require(scripts.count(TOUCH_SCRIPT) == 1 and
            all(scripts.count(name) == 1 and scripts.index(name) < scripts.index(TOUCH_SCRIPT)
                for name in ("src/core/action-input.js", "src/core/input.js")),
            "Touch controls must launch once after the existing input owners")
    require(scripts.count("src/game/mac-combat-animation.js") == 1 and
            scripts.index("src/game/mac-combat-animation.js") < scripts.index("src/game/mac-combat-preview.js"),
            "The articulated animation owner must launch once before the private Mac wrapper")
    gpu_scripts = [VENDOR_ROOT + "pixi.min.js", "src/engine/cache-road-texture-bank.js",
                   "src/engine/cache-road-gpu-renderer.js",
                   "src/engine/cache-road-gpu-context.js", "src/game/cache-road-proof.js"]
    require(all(scripts.count(name) == 1 for name in gpu_scripts),
            "Expected one pinned GPU renderer and context before the road owner")
    positions = [scripts.index(name) for name in gpu_scripts]
    require(positions == sorted(positions) and
            scripts.index("src/engine/presentation-assets.js") < positions[1],
            "GPU renderer load order changed")
    for name, expected in VENDOR_FILES.items():
        require(name in payloads and sha(payloads[name]) == expected,
                f"Missing or changed pinned vendor file: {name}")
    require("src/engine/cache-road-texture-worker.js" in payloads,
            "Owned compressed-texture worker is missing")
    stylesheets = re.findall(r'<link\b[^>]*\brel=["\']stylesheet["\'][^>]*\bhref=["\']([^"\']+)', index, re.I)
    for name in stylesheets:
        require(name in payloads, f"Missing linked stylesheet: {name}")
    local_links = []
    for tag in re.findall(r'<link\b[^>]*>', index, re.I):
        href = re.search(r'\bhref=["\']([^"\']+)', tag, re.I)
        require(href is not None, "Index link has no href")
        value = href.group(1)
        if not re.match(r'(?:[A-Za-z][A-Za-z0-9+.-]*:|//)', value):
            local_links.append(re.split(r'[?#]', value)[0].removeprefix('./'))
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
        if name in BINARY_VENDOR_FILES:
            continue  # Exact hash-pinned WASM is preserved as binary, never decoded or rewritten.
        for url in re.findall(r"https?://[^\s'\"`<>]+", data.decode("utf-8")):
            if url.startswith(("http://www.w3.org/", "https://www.w3.org/", "http://localhost/")):
                continue
            vendor_purpose = VENDOR_REFERENCES.get(name, {}).get(url)
            allowed = vendor_purpose or any(url.startswith(prefix) for prefix in exceptions.get(name, set()))
            require(allowed, f"Unexpected external reference in {name}: {url}")
            external.append({"path": name, "url": url, "purpose": vendor_purpose or
                             ("font stylesheet" if name == "index.html" else "inert original GIF provenance")})
    return {"orderedScripts": scripts, "localIndexLinks": local_links,
            "spriteAnimations": total, "remainingExternalReferences": external,
            "vendoredRenderer": {"name": "pixi.js", "version": "8.22.0",
                                 "license": "MIT", "files": VENDOR_FILES,
                                 "runtimeSource": "local pinned bundle; full-resolution compressed textures with original-image fallback"},
            "vendoredTranscoder": {"name": "Basis Universal", "version": "2.50",
                                   "license": "Apache-2.0", "runtimeSource": "local owned worker; no CDN loader"}}


def native_rgba(data, name):
    """Decode original PNG scanlines for measured alpha; never rewrite artwork."""
    require(data[:8] == b"\x89PNG\r\n\x1a\n", f"Rig source is not a native PNG: {name}")
    offset, chunks, width, height = 8, [], 0, 0
    while offset + 12 <= len(data):
        length = int.from_bytes(data[offset:offset + 4], "big")
        kind, start = data[offset + 4:offset + 8], offset + 8
        require(start + length + 4 <= len(data), f"Truncated PNG chunk: {name}")
        content = data[start:start + length]
        if kind == b"IHDR":
            require(length == 13, f"Invalid PNG header: {name}")
            width, height = int.from_bytes(content[:4], "big"), int.from_bytes(content[4:8], "big")
            require(width > 0 and height > 0 and content[8:] == bytes((8, 6, 0, 0, 0)),
                    f"Rig must retain noninterlaced native RGBA8: {name}")
        if kind == b"IDAT": chunks.append(content)
        offset = start + length + 4
        if kind == b"IEND": break
    require(width > 0 and height > 0 and chunks, f"Incomplete PNG: {name}")
    stride = width * 4
    raw = zlib.decompress(b"".join(chunks))
    require(len(raw) == (stride + 1) * height, f"Invalid RGBA scanline size: {name}")
    pixels = bytearray(stride * height)
    for y in range(height):
        row_start, target = y * (stride + 1), y * stride
        mode = raw[row_start]
        require(mode in range(5), f"Unsupported PNG filter: {name}")
        for x in range(stride):
            a = pixels[target + x - 4] if x >= 4 else 0
            b = pixels[target + x - stride] if y else 0
            c = pixels[target + x - stride - 4] if y and x >= 4 else 0
            if mode == 0: predictor = 0
            elif mode == 1: predictor = a
            elif mode == 2: predictor = b
            elif mode == 3: predictor = (a + b) // 2
            else:
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                predictor = a if pa <= pb and pa <= pc else b if pb <= pc else c
            pixels[target + x] = (raw[row_start + 1 + x] + predictor) & 255
    require(any(value < 255 for value in pixels[3::4]), f"Rig lost native transparency: {name}")
    return width, height, pixels


def verify_combat_rigs(output, files):
    prefix = "assets/mac-combat-rigs/"
    require({name for name in files if name.startswith(prefix)} == MAC_RIG_ASSETS,
            "Incomplete or unselected articulated combat asset set")
    bank = json.loads(safe_path(output, prefix + "mac-combat-art-v1.json").read_text(encoding="utf-8"))
    require(bank.get("schemaVersion") == 1 and sorted(bank.get("files", [])) == sorted(MAC_RIG_ASSETS),
            "Rig manifest must declare the exact 17 selected files")
    actors = bank.get("actors")
    require(isinstance(actors, list) and len(actors) == 8 and
            sorted(actor.get("kind") for actor in actors) == sorted(MAC_RIG_ACTORS),
            "Rig manifest must select Mac and the exact seven alien kinds")
    colors = dict(zip(MAC_RIG_ACTORS, ("red", "green", "purple", "green", "purple", "purple", "green", "purple")))
    blood_hex = {"red": "#f04455", "green": "#78ea68", "purple": "#b374ed"}
    base_parts = {"head", "torso", "pelvis"} | {side + "_" + part for side in ("rear", "front")
                 for part in ("upper_arm", "forearm", "fist", "thigh", "shin", "shoe")}
    chains = {side + "_" + part: (side + "_" + a, side + "_" + b) for side in ("rear", "front")
              for part, a, b in (("upper_arm", "shoulder", "elbow"), ("forearm", "elbow", "wrist"),
                                 ("thigh", "hip", "knee"), ("shin", "knee", "ankle"))}
    for side in ("a", "b"):
        chains["extra_upper_arm_" + side] = ("extra_shoulder_" + side, "extra_elbow_" + side)
        chains["extra_forearm_" + side] = ("extra_elbow_" + side, "extra_wrist_" + side)
    def finite_point(value):
        return isinstance(value, dict) and all(isinstance(value.get(k), (int, float)) and
               not isinstance(value.get(k), bool) and math.isfinite(value[k]) for k in ("x", "y"))
    def close(a, b, label): require(abs(a - b) <= .001, f"Measured rig geometry differs: {label}")
    results = []
    for actor in actors:
        kind = actor["kind"]
        stem = "mac-modem-v2" if kind == "mac" else kind + "-v1"
        image, rig_name = prefix + stem + ".png", prefix + stem + "-rig.json"
        require(actor.get("image") == image and actor.get("rig") == rig_name and
                actor.get("imageSHA256") == files[image]["sha256"] and
                actor.get("rigSHA256") == files[rig_name]["sha256"], f"Unselected or changed rig identity: {kind}")
        require(actor.get("bloodColor") == colors[kind] and actor.get("bloodHex") == blood_hex[colors[kind]]
                and isinstance(actor.get("displayName"), str) and actor["displayName"].strip(), f"Invalid selected actor role: {kind}")
        image_data = safe_path(output, image).read_bytes()
        width, height, pixels = native_rgba(image_data, image)
        rig = json.loads(safe_path(output, rig_name).read_text(encoding="utf-8"))
        require(rig.get("schemaVersion") == 1 and rig.get("actor") == kind and rig.get("sourceImage") == image and
                rig.get("sourceSHA256") == sha(image_data) and rig.get("sourceDimensions") == {"width": width, "height": height}
                and rig.get("facing") == "right" and rig.get("commonScale") == 1 and
                rig.get("groundOrigin") == {"x": 0, "y": 0}, f"Native rig contract changed: {kind}")
        expected = base_parts | ({"extra_" + part + "_" + side for side in ("a", "b")
                    for part in ("upper_arm", "forearm", "fist")} if kind == "null_regent" else set())
        parts = rig.get("parts", [])
        require(len(parts) == len(expected) and {part.get("id") for part in parts} == expected,
                f"Rig must register exactly {len(expected)} anatomical pieces: {kind}")
        by_id = {part["id"]: part for part in parts}
        rest = rig.get("restSkeleton", {})
        require(isinstance(rest, dict) and all(finite_point(point) for point in rest.values()), f"Invalid rest joints: {kind}")
        assembled = {"left": math.inf, "top": math.inf, "right": -math.inf, "bottom": -math.inf}
        for part in parts:
            label = kind + "/" + part["id"]
            source, visible = part.get("source", {}), part.get("visibleBounds", {})
            for rect in (source, visible):
                require(all(isinstance(rect.get(k), int) and not isinstance(rect.get(k), bool) and
                            rect[k] >= (1 if k in ("width", "height") else 0) for k in ("x", "y", "width", "height")),
                        f"Invalid measured source bounds: {label}")
            require(source["x"] + source["width"] <= width and source["y"] + source["height"] <= height,
                    f"Rig crop escapes native bitmap: {label}")
            occupied = [(x, y) for y in range(source["height"]) for x in range(source["width"])
                        if pixels[((source["y"] + y) * width + source["x"] + x) * 4 + 3] > 8]
            require(occupied, f"Empty anatomical piece: {label}")
            left, top = min(x for x, y in occupied), min(y for x, y in occupied)
            right, bottom = max(x for x, y in occupied), max(y for x, y in occupied)
            require(visible == {"x": left, "y": top, "width": right - left + 1, "height": bottom - top + 1},
                    f"Visible bounds differ from actual native alpha>8: {label}")
            points = [part.get("pivot")] + list(part.get("anchors", {}).values())
            if part["id"] in chains: points.append(part.get("distal"))
            for point in points:
                require(finite_point(point) and all(point[k] == int(point[k]) and 0 <= point[k] < source[
                        "width" if k == "x" else "height"] for k in ("x", "y")), f"Invalid native joint cap: {label}")
                require(pixels[((source["y"] + int(point["y"])) * width + source["x"] + int(point["x"])) * 4 + 3] > 8,
                        f"Joint cap lies outside actual opaque piece: {label}")
            require(part.get("restScale", 1) == 1, f"Per-piece scale stretches anatomy: {label}")
            if part["id"] in chains:
                a, b = part["pivot"], part["distal"]
                length = math.hypot(b["x"] - a["x"], b["y"] - a["y"])
                require(isinstance(part.get("boneLength"), (int, float)) and part["boneLength"] > 0, f"Missing measured bone: {label}")
                close(length, part["boneLength"], label + "/source length")
                a, b = chains[part["id"]]
                require(a in rest and b in rest, f"Missing rest bone joints: {label}")
                close(math.hypot(rest[b]["x"] - rest[a]["x"], rest[b]["y"] - rest[a]["y"]), length, label + "/rest length")
            angle = 0
            if part["id"] in chains:
                a, b = chains[part["id"]]
                origin = rest[a]
                angle = math.atan2(rest[b]["y"] - origin["y"], rest[b]["x"] - origin["x"]) - math.atan2(
                        part["distal"]["y"] - part["pivot"]["y"], part["distal"]["x"] - part["pivot"]["x"])
            else:
                identifier = part["id"]
                joint = ("neck" if identifier == "head" else "waist" if identifier in ("torso", "pelvis") else
                         "extra_wrist_" + identifier[-1] if identifier.startswith("extra_fist_") else
                         identifier.split("_")[0] + ("_wrist" if identifier.endswith("_fist") else "_ankle"))
                require(joint in rest, f"Missing neutral attachment joint: {label}")
                origin = rest[joint]
            cosine, sine = math.cos(angle), math.sin(angle)
            x_min, x_max = min(0, cosine) + min(0, -sine), max(0, cosine) + max(0, -sine)
            y_min, y_max = min(0, sine) + min(0, cosine), max(0, sine) + max(0, cosine)
            for x, y in occupied:
                x, y = x - part["pivot"]["x"], y - part["pivot"]["y"]
                tx, ty = origin["x"] + x * cosine - y * sine, origin["y"] + x * sine + y * cosine
                assembled["left"], assembled["right"] = min(assembled["left"], tx + x_min), max(assembled["right"], tx + x_max)
                assembled["top"], assembled["bottom"] = min(assembled["top"], ty + y_min), max(assembled["bottom"], ty + y_max)
        for i, part in enumerate(parts):
            a = part["source"]
            for other in parts[i + 1:]:
                b = other["source"]
                require(min(a["x"] + a["width"], b["x"] + b["width"]) <= max(a["x"], b["x"]) or
                        min(a["y"] + a["height"], b["y"] + b["height"]) <= max(a["y"], b["y"]),
                        f"Anatomical source crops overlap: {kind}")
        require(len({(p["source"]["width"], p["source"]["height"]) for p in parts}) > 1,
                f"Rig cannot replace measured pieces with equal atlas cells: {kind}")
        for part_id, required_anchors in (("torso", {"neck", "waist", "rear_shoulder", "front_shoulder"} |
                     ({"extra_shoulder_a", "extra_shoulder_b"} if kind == "null_regent" else set())),
                     ("pelvis", {"waist", "rear_hip", "front_hip"})):
            part = by_id[part_id]
            require(set(part.get("anchors", {})) == required_anchors and "waist" in rest, f"Missing attachment anchors: {kind}/{part_id}")
            for joint, anchor in part["anchors"].items():
                require(joint in rest, f"Missing attachment rest joint: {kind}/{joint}")
                for coordinate in ("x", "y"):
                    close(rest[joint][coordinate], rest["waist"][coordinate] + anchor[coordinate] - part["pivot"][coordinate], kind + "/" + joint)
        for a, b in (("hip", "waist"), ("head", "neck"), ("rear_fist", "rear_wrist"), ("front_fist", "front_wrist")):
            require(a in rest and b in rest, f"Missing rest alias: {kind}/{a}")
            for coordinate in ("x", "y"): close(rest[a][coordinate], rest[b][coordinate], kind + "/" + a)
        for side in ("rear", "front"):
            shoe = by_id[side + "_shoe"]
            require(set(shoe.get("anchors", {})) == {"ground_contact"}, f"Missing measured shoe contact: {kind}/{side}")
            ankle, foot = side + "_ankle", side + "_foot_contact"
            require(ankle in rest and foot in rest, f"Missing planted foot: {kind}/{side}")
            for coordinate in ("x", "y"):
                close(rest[foot][coordinate], rest[ankle][coordinate] + shoe["anchors"]["ground_contact"][coordinate] - shoe["pivot"][coordinate], kind + "/" + foot)
            close(rest[foot]["y"], 0, kind + "/planted floor")
        bounds = rig.get("restVisibleBounds", {})
        require(all(isinstance(bounds.get(k), (int, float)) and math.isfinite(bounds[k]) for k in ("left", "top", "right", "bottom"))
                and bounds["right"] > bounds["left"] and bounds["bottom"] > bounds["top"], f"Invalid rest alpha extent: {kind}")
        close(rig.get("pixelScale", {}).get("standingVisibleHeight", 0), bounds["bottom"] - bounds["top"], kind + "/native standing height")
        for coordinate in ("left", "top", "right", "bottom"):
            close(bounds[coordinate], assembled[coordinate], kind + "/transformed native alpha " + coordinate)
        close(rig["pixelScale"]["standingVisibleHeight"], assembled["bottom"] - assembled["top"], kind + "/actual native standing height")
        results.append({"kind": kind, "pieces": len(parts), "nativePNG_SHA256": sha(image_data),
                        "decodedRGBA_SHA256": sha(pixels), "rigSHA256": files[rig_name]["sha256"],
                        "restNativeAlphaExtent": {key: round(value, 6) for key, value in assembled.items()}})
    return {"selectedActors": 8, "assetCount": 17, "nativeAlphaThreshold": 8, "registrations": results,
            "runtimeAcceptance": "not established by packaging"}


def verify_texture_bank(output, files):
    prefix = "assets/cache-road/gpu-textures/"
    manifest_name = prefix + "manifest.json"
    require(manifest_name in files, "Compressed texture bank must be committed before building")
    bank = json.loads(safe_path(output, manifest_name).read_text(encoding="utf-8"))
    require(bank.get("version") == 1 and bank.get("sourceCount") == 171 and
            bank.get("compressedCount") == 149 and bank.get("originalCount") == 22,
            "Compressed bank source inventory changed")
    require(bank.get("encoderCommit") == "4d6fc70eaf62ad0558e63e8d97eb9766118327a6" and
            bank.get("transcoderCommit") == "9bebe16726b3a61c8c213eeee3b7cffb462ef34e" and
            bank.get("alphaMode") == "premultiplied-alpha" and bank.get("colorSpace") == "unorm",
            "Compressed bank provenance or alpha/color contract changed")
    entries = bank.get("entries")
    require(isinstance(entries, dict) and len(entries) == 171, "Incomplete road texture bank")
    derivatives, compressed, original = {manifest_name}, 0, 0
    for key, entry in entries.items():
        require(re.fullmatch(r"[A-Za-z0-9_.-]+", key), "Unsafe road texture key")
        original_name = entry.get("originalPath")
        require(original_name in files and
                files[original_name]["sha256"] == entry.get("originalSHA256"),
                f"Texture original differs from canonical HEAD artwork: {key}")
        if entry.get("kind") == "compressed":
            name = prefix + key + ".ktx2"
            require(entry.get("path") == name and name in files and
                    files[name] == {"sha256": entry.get("sha256"), "bytes": entry.get("bytes")},
                    f"Texture derivative differs from committed bank: {key}")
            require(original_name.endswith(".webp"), f"Unexpected compressed source type: {key}")
            derivatives.add(name)
            compressed += 1
        else:
            require(entry.get("kind") == "original" and entry.get("path") == original_name and
                    original_name.endswith(".svg"), f"Unexpected original texture exemption: {key}")
            original += 1
    require(compressed == 149 and original == 22, "Incomplete raster/vector bank accounting")
    require({name for name in files if name.startswith(prefix)} == derivatives,
            "Unowned texture derivative or private generation receipt entered the package")
    require({name for name in files if name.startswith("assets/mac-street-review/")} == MAC_REVIEW_ASSETS,
            "The private Mac review must include exactly its eight registered runtime assets")
    require(len(MAC_CITY_ASSETS) == 23 and
            {name for name in files if name.startswith("assets/mac-city-review/")} == MAC_CITY_ASSETS,
            "The private Mac city must include exactly its 23 registered runtime assets")
    require(len(MAC_RIG_ASSETS) == 17 and
            {name for name in files if name.startswith("assets/mac-combat-rigs/")} == MAC_RIG_ASSETS,
            "The articulated Mac combat bank must include exactly its 17 selected runtime assets")
    originals = sorted([name, record["bytes"], record["sha256"]]
                       for name, record in files.items() if name.startswith("assets/")
                       and name not in derivatives and name not in MAC_REVIEW_ASSETS and name not in MAC_CITY_ASSETS
                       and name not in MAC_RIG_ASSETS)
    require(len(originals) == 624 and sha(json.dumps(originals, separators=(",", ":")).encode("utf-8")) ==
            "0b2ac58dc88ddb68b595fb8592d242d8478c426d78309fe4ff45b88c04027f56",
            "Original 624 artwork/audio identities or bytes changed")
    return {"sources": 171, "compressedSources": 149, "originalSvgSources": 22,
            "derivativeCount": len(derivatives), "unchangedOriginalCount": len(originals),
            "macReviewAssetCount": len(MAC_REVIEW_ASSETS),
            "macCityAssetCount": len(MAC_CITY_ASSETS),
            "macRigAssetCount": len(MAC_RIG_ASSETS),
            "gpuMipBytes": bank.get("allGpuMipBytes"), "runtimeAcceptance": "not established by packaging"}


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
    for name in checks["localIndexLinks"]:
        require(safe_path(output, name).is_file(), f"Index link not emitted: {name}")
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
    checks["compressedTextureBank"] = verify_texture_bank(output, file_hashes)
    checks["articulatedCombatRigs"] = verify_combat_rigs(output, file_hashes)
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
