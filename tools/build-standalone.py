"""Build the static, same-origin System Override game without changing its source.

Usage: python tools/build-standalone.py --output PATH --receipt PATH
Optional low-space reuse: --reuse-owned PATH --reuse-owner-sha256 SHA256
The output must be empty or owned by an earlier invocation of this tool. No
files are deleted. Canonical assets come from exact HEAD blobs, not a checkout
that may have translated text line endings. Runtime source uses the working
tree so an uncommitted standalone adapter can be reviewed and tested.
"""
import argparse
import hashlib
import json
import math
import os
import re
import stat
import subprocess
import tempfile
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
MAC_FRAME_ROOT = "assets/mac-combat-frames/"
MAC_DYNAMIC_ROOT = "assets/mac-street-dynamic/"
MAC_DYNAMIC_SHEETS = {
    "dyn_guard": "mac-guard-two-braids-v1.png", "dyn_run": "mac-run-two-braids-v1.png",
    "dyn_hold": "mac-hold-carry-two-braids-v1.png", "dyn_weapon": "mac-weapon-poses-two-braids-v1.png",
    "dyn_pipe_swing": "mac-pipe-swing-two-braids-v1.png",
    "dyn_scatter_blaster": "mac-scatter-blaster-grips-v1.png",
    "dyn_coil_rifle": "mac-coil-rifle-grips-v1.png",
    "dyn_plasma_disc": "mac-plasma-disc-grips-v1.png", "dyn_carry_low": "mac-carry-low-front-v2.png",
    "dyn_armed_walk": "mac-armed-walk-two-braids-v1.png", "dyn_armed_run": "mac-armed-run-two-braids-v1.png",
    "dyn_disc_retained": "mac-plasma-disc-retained-two-braids-v1.png"}
MAC_DYNAMIC_IMAGE_HASHES = {
    "dyn_guard": "2a6ed176b8cefba33793f1d6633671322afc8555c01c725cbe8a9ca306e3ed85",
    "dyn_run": "b78e958967d49d32eccb85a19594691e244e6023c34371a002099f3ec0cc4a23",
    "dyn_hold": "c832b0a3cdfd58ce9c117beb9160c876b3df1d6cd4aa92cdb436e16527c916c9",
    "dyn_weapon": "f4d2a4c8d5f602691fa787c08b01680ab1bc19461a035cf0789a336c4969ec93",
    "dyn_pipe_swing": "a22a5f4787d339614af5c2fc51a548affe55628e057bb54cdeffbdb1e21c83af",
    "dyn_scatter_blaster": "36667f70a3e14bfba05baf4bdf86dda013bc83cb826d340bc3216faf97c274e7",
    "dyn_coil_rifle": "cd1fd6a52cf1df9fd9ff43a1a047768dc8b4285f6b7488685a45f565e1ecb297",
    "dyn_plasma_disc": "ad23988027d373b8ca10af1f8e4b99e3adb1cb441c1040b37b9b533e7a8ef8e8",
    "dyn_carry_low": "f60d950343d3198eee51f1147eacc232cf76d740d004c9a74c5c60b881df7a33",
    "dyn_armed_walk": "3b22399652ef4912163eceb1abdcd632e84f6ae3ba959fe8e1ba08cd23b05692",
    "dyn_armed_run": "8e2e20d6054e6d49de9f147609e24989cadd9a0bccd83faba499ff9516e57ecf",
    "dyn_disc_retained": "8c3ad1fd791ba4fa560cdcf1f22e8d7e06de91a8fbbac28ddb61d87ff598caf7"}
MAC_DYNAMIC_HISTORICAL_IMAGES = {
    "mac-guard-v1.png": "f3410efa856aa1ea7fcedf69bd1e37f8c259af8cfb315282fc81f08b235ca0ee",
    "mac-run-v1.png": "711c9993b6d39b0ce1fbc49897f154618c9d0baafad796a4bb236b2f6d9d4378",
    "mac-hold-carry-v1.png": "e40c210ed47efb4453d7add6d42250e766715825ff3943727203667d9939861c",
    "mac-weapon-poses-v1.png": "e59a6f8716d6d5b8fc3f4789dbc96cde64c94f186d99f6b2d8640f8033e4fba3"}
MAC_ARMED_LOCOMOTION_CLIPS = {
    "armed-" + action: {"loop": True, "frames": [
        {"frame": "armed_" + action + "_" + suffix, "holdMs": hold}
        for suffix in ("contact_a", "pass_a", "contact_b", "pass_b")]}
    for action, hold in (("walk", 100), ("run", 75))}
MAC_ARMED_FRAME_SHEETS = {
    entry["frame"]: "dyn_armed_" + key.removeprefix("armed-")
    for key, clip in MAC_ARMED_LOCOMOTION_CLIPS.items() for entry in clip["frames"]}
MAC_DISC_RETAINED_FRAMES = {
    "disc_jump_load", "disc_jump_rise", "disc_kick_chamber", "disc_kick_contact", "disc_kick_retract",
    "disc_jump_descent", "disc_landing", "disc_counter_contact", "disc_guard_brace", "disc_guard_step_a",
    "disc_guard_step_b", "disc_guard_impact"}
MAC_DISC_RETAINED_ALIASES = {
    "load": "disc_jump_load", "takeoff": "disc_jump_rise", "chamber": "disc_kick_chamber",
    "kick_extend": "disc_kick_contact", "kick_contact": "disc_kick_contact", "kick_retract": "disc_kick_retract",
    "descent": "disc_jump_descent", "landing": "disc_landing", "counter_contact": "disc_counter_contact",
    "guard_brace": "disc_guard_brace", "guard_step_a": "disc_guard_step_a", "guard_step_b": "disc_guard_step_b",
    "guard_impact": "disc_guard_impact", "hook_recovery": "plasma_disc_ready", "idle_b": "plasma_disc_ready"}
MAC_DISC_RETAINED_CLIPS = {
    "disc-carry." + base: {"loop": False, "frames": [{"frame": frame, "holdMs": 100}]}
    for base, frame in MAC_DISC_RETAINED_ALIASES.items()}
MAC_DYNAMIC_FRAMES = set(MAC_ARMED_FRAME_SHEETS) | {
    "guard_brace", "guard_step_a", "guard_step_b", "guard_impact",
    "run_contact_a", "run_pass_a", "run_contact_b", "run_pass_b",
    "grab_reach", "grab_hold", "pummel_load", "pummel_contact",
    "pickup_load", "carry_hold", "carry_step_a", "carry_step_b",
    "melee_load", "melee_contact", "melee_follow", "fire_aim", "fire_recoil", "fire_ready",
    "carry_low_pickup", "carry_low_hold", "carry_low_stride", "carry_low_pass", "carry_low_windup", "carry_low_release"}
MAC_PIPE_SWING_PHASES = {
    "windup": (("pipe_swing_load", 50), ("pipe_swing_uncoil", 50)),
    "active": (("pipe_swing_contact", 95),),
    "recovery": (("pipe_swing_through", 50), ("pipe_swing_finish", 70), ("pipe_swing_recover", 50))}
MAC_PIPE_SWING_FRAMES = {frame for sequence in MAC_PIPE_SWING_PHASES.values() for frame, _ in sequence}
MAC_EMBEDDED_WEAPON_SHEETS = {
    "scatter-blaster": "dyn_scatter_blaster", "coil-rifle": "dyn_coil_rifle", "plasma-disc": "dyn_plasma_disc"}
MAC_EMBEDDED_WEAPON_SUFFIXES = {
    "scatter-blaster": ("ready", "aim", "recoil", "walk_a", "walk_b", "run_a", "run_b", "guard", "hurt"),
    "coil-rifle": ("ready", "aim", "recoil", "walk_a", "walk_b", "run_a", "run_b", "guard", "hurt"),
    "plasma-disc": ("ready", "windup", "release", "walk_a", "walk_b", "run_a", "run_b", "guard", "followthrough")}
MAC_EMBEDDED_WEAPON_FRAMES = {
    kind.replace("-", "_") + "_" + suffix: kind
    for kind, suffixes in MAC_EMBEDDED_WEAPON_SUFFIXES.items() for suffix in suffixes}
MAC_EMBEDDED_FRAME_KINDS = {**{frame: "pipe" for frame in MAC_PIPE_SWING_FRAMES}, **MAC_EMBEDDED_WEAPON_FRAMES,
                           **{frame: "plasma-disc" for frame in MAC_DISC_RETAINED_FRAMES}}
MAC_EMBEDDED_WEAPON_CLIPS = {}
for _kind in MAC_EMBEDDED_WEAPON_SHEETS:
    _prefix = _kind.replace("-", "_") + "_"
    _sequences = {
        "idle": (("ready", 160),), "walk": (("walk_a", 100), ("walk_b", 100)),
        "run": (("run_a", 90), ("run_b", 90)), "guard": (("guard", 160),),
        "hurt": (("ready" if _kind == "plasma-disc" else "hurt", 140),),
        "windup": (("windup" if _kind == "plasma-disc" else "aim", 100),),
        "active": (("release" if _kind == "plasma-disc" else "recoil", 100),),
        "recovery": (("followthrough" if _kind == "plasma-disc" else "ready", 100),)}
    for _action, _sequence in _sequences.items():
        MAC_EMBEDDED_WEAPON_CLIPS[f"weapon_{_kind}.{_action}"] = {
            "loop": _action in ("idle", "walk", "run", "guard"),
            "frames": [{"frame": _prefix + suffix, "holdMs": hold} for suffix, hold in _sequence]}
MAC_EMBEDDED_SHOT_FRAMES = {clip["frames"][0]["frame"] for key, clip in MAC_EMBEDDED_WEAPON_CLIPS.items()
                            if key.endswith(".active")}
MAC_DYNAMIC_CLIPS = set(MAC_ARMED_LOCOMOTION_CLIPS) | {"guard", "guard-walk", "run", "grab-start", "grab-hold", "carry", "carry-walk"} | {
    f"{action}.{phase}" for action in ("pummel", "melee", "fire") for phase in ("windup", "active", "recovery")}
MAC_DYNAMIC_LOOPS = set(MAC_ARMED_LOCOMOTION_CLIPS) | {"guard", "guard-walk", "run", "grab-hold", "carry", "carry-walk"}
MAC_WEAPON_KINDS = {"pipe", "crowbar", "shock-baton", "energy-blade", "gravity-hammer",
                    "scatter-blaster", "coil-rifle", "plasma-disc"}
MAC_MELEE_KINDS = {"pipe", "crowbar", "shock-baton", "energy-blade", "gravity-hammer"}
MAC_POWER_ROOT = "assets/mac-street-power/"
MAC_POWER_SHEETS = {
    "props": "street-props-v1.png", "blood": "street-blood-v1.png",
    "equipment": "street-weapons-v1.png", "cars": "street-cars-side-v2.png",
    "fixtures": "street-fixtures-v1.png", "cores": "street-powerups-v1.png"}
MAC_POWER_CELLS = {"crate_intact", "crate_cracked", "crate_broken",
                   "stall_intact", "stall_cracked", "stall_broken",
                   "relay_off", "relay_on", "pickup_health"} | {
    f"blood_{color}_{kind}" for color in ("red", "green", "purple")
    for kind in ("impact", "heavy", "floor")} | {
    "weapon_" + kind for kind in ("pipe", "crowbar", "shock-baton", "energy-blade", "gravity-hammer",
                                    "scatter-blaster", "coil-rifle", "plasma-disc")} | {
    f"{kind}_{state}" for kind in ("car", "car_van", "barrel", "fixture_streetlight", "fixture_terminal")
    for state in ("intact", "cracked", "broken")} | {
    "pickup_overdrive", "pickup_barrier", "pickup_impact",
    "projectile_scatter-bolt", "projectile_coil-bolt", "projectile_plasma-disc"}


def native_frame_image(output, sheet, name):
    image = safe_path(output, name).read_bytes()
    require(sha(image) == sheet.get("sourceSHA256"), "Changed selected native PNG")
    require(image[:8] == b"\x89PNG\r\n\x1a\n" and image[24:29] == bytes((8, 6, 0, 0, 0)),
            "Selected source must retain native transparent RGBA8 PNG")
    size = {"width": int.from_bytes(image[16:20], "big"), "height": int.from_bytes(image[20:24], "big")}
    require(sheet.get("dimensions") == size, "Native atlas dimensions changed")
    return size


def native_rect(rect, size):
    return all(type(rect.get(key)) is int and rect[key] >= (1 if key in ("width", "height") else 0)
               for key in ("x", "y", "width", "height")) and \
        rect["x"] + rect["width"] <= size["width"] and rect["y"] + rect["height"] <= size["height"]


def native_anchor(anchor, rect):
    return all(type(anchor.get(key)) in (int, float) and math.isfinite(anchor[key]) and
               0 <= anchor[key] <= rect["width" if key == "x" else "height"] for key in ("x", "y"))


def crops_overlap(a, b):
    return min(a["x"] + a["width"], b["x"] + b["width"]) > max(a["x"], b["x"]) and \
        min(a["y"] + a["height"], b["y"] + b["height"]) > max(a["y"], b["y"])


def native_polygons(polygons, rect):
    require(isinstance(polygons, list), "Native overlap regions must be polygon arrays")
    for polygon in polygons:
        require(isinstance(polygon, list) and len(polygon) >= 3 and
                all(isinstance(point, dict) and native_anchor(point, rect) for point in polygon),
                "Native overlap polygon escapes its complete source crop")
        area = sum(point["x"] * polygon[(index + 1) % len(polygon)]["y"] -
                   polygon[(index + 1) % len(polygon)]["x"] * point["y"]
                   for index, point in enumerate(polygon))
        require(abs(area) > 0.01, "Native overlap polygon has no area")


def native_item_bindings(entry, rect, weapon_cells, kinds=MAC_WEAPON_KINDS):
    bindings = entry.get("itemBindings", {})
    require(isinstance(bindings, dict) and set(bindings) == kinds,
            "Every equipped character cel must register exactly its selected weapon family")
    for kind, binding in bindings.items():
        require(native_anchor(binding.get("gripAnchor", {}), rect) and
                type(binding.get("weaponAngle")) in (int, float) and
                math.isfinite(binding["weaponAngle"]) and abs(binding["weaponAngle"]) <= math.pi and
                binding.get("itemLayer") in ("front", "behind"), "Invalid per-weapon native grip/layer")
        held_scale = binding.get("itemScale", 1)
        require(type(held_scale) in (int, float) and math.isfinite(held_scale) and .25 <= held_scale <= 1,
                "Invalid registered held-only item scale")
        native_polygons(binding.get("handOcclusion"), rect)
        if "itemFrontRegions" in binding:
            native_polygons(binding["itemFrontRegions"], weapon_cells["weapon_" + kind]["source"])


def supplemental_frame_files(output, actor, base):
    weapon_cells = json.loads(safe_path(output, MAC_POWER_ROOT + "mac-street-power-v1.json").read_text(encoding="utf-8"))["cells"]
    name = MAC_DYNAMIC_ROOT + "mac-modem-actions-v1.json"
    selection = actor.get("supplemental", {})
    require(selection.get("registration") == name, "Missing selected Mac supplemental registration")
    data = safe_path(output, name).read_bytes()
    require(sha(data) == selection.get("registrationSHA256"), "Changed supplemental registration")
    registration = json.loads(data)
    require(registration.get("schemaVersion") == 1 and registration.get("actor") == "mac" and
            registration.get("facing") == "right", "Invalid supplemental complete-character identity")
    require(registration.get("baseRegistration") == actor["registration"] and
            registration.get("baseRegistrationSHA256") == actor["registrationSHA256"],
            "Supplemental poses must use the selected unchanged Mac base registration")
    sheets = registration.get("sheets", [])
    require(len(sheets) == 12 and {sheet.get("id") for sheet in sheets} == set(MAC_DYNAMIC_SHEETS),
            "Supplemental poses require exactly twelve selected native sheets")
    selected, dimensions, crops = {name}, {}, {}
    for sheet in sheets:
        image_name = MAC_DYNAMIC_ROOT + MAC_DYNAMIC_SHEETS[sheet["id"]]
        require(sheet.get("sourceImage") == image_name, "Unselected supplemental native PNG")
        require(sheet["id"] in MAC_DYNAMIC_IMAGE_HASHES and
                sheet.get("sourceSHA256") == MAC_DYNAMIC_IMAGE_HASHES[sheet["id"]],
                "Selected supplemental PNG differs from the pinned native candidate")
        dimensions[sheet["id"]] = native_frame_image(output, sheet, image_name)
        selected.add(image_name)
    frames = registration.get("frames", [])
    require(len(frames) == 81 and {frame.get("id") for frame in frames} == MAC_DYNAMIC_FRAMES | set(MAC_EMBEDDED_FRAME_KINDS),
            "Supplemental poses require 22 preserved attachment cels, six low carry cels, eight armed movement cels, six complete pipe cels, nine cels per selected gun/disc and twelve retained Disc cels")
    by_id = {frame["id"]: frame for frame in frames}
    for frame in frames:
        sheet, rect = frame.get("sheet"), frame.get("source", {})
        require(sheet in dimensions and native_rect(rect, dimensions[sheet]), "Invalid supplemental native crop")
        require(native_anchor(frame.get("feetPivot", {}), rect) and frame.get("baselineLift") == 0,
                "Supplemental complete-body cel must retain grounded feet")
        embedded_kind = MAC_EMBEDDED_FRAME_KINDS.get(frame["id"])
        if embedded_kind:
            expected_sheet = "dyn_disc_retained" if frame["id"] in MAC_DISC_RETAINED_FRAMES else \
                "dyn_pipe_swing" if embedded_kind == "pipe" else MAC_EMBEDDED_WEAPON_SHEETS[embedded_kind]
            require(sheet == expected_sheet and frame.get("embeddedWeapon") == embedded_kind and
                    not any(key in frame for key in ("gripAnchor", "weaponAngle", "itemBindings", "handOcclusion")),
                    "Complete embedded weapon cels must match their selected weapon and suppress only its external item")
            if frame["id"] in MAC_EMBEDDED_WEAPON_FRAMES:
                require(frame["id"] not in MAC_EMBEDDED_SHOT_FRAMES or "shotAnchor" in frame,
                        "Embedded gun/disc active cel must register its native shot origin")
                if "shotAnchor" in frame:
                    require(native_anchor(frame["shotAnchor"], rect), "Embedded shot origin escapes its native crop")
        else:
            require(sheet not in {"dyn_pipe_swing", "dyn_disc_retained", *MAC_EMBEDDED_WEAPON_SHEETS.values()} and "embeddedWeapon" not in frame and
                    native_anchor(frame.get("gripAnchor", {}), rect), "Attachment cel must retain its registered grip")
            angle = frame.get("weaponAngle")
            require(type(angle) in (int, float) and math.isfinite(angle) and abs(angle) <= math.pi,
                    "Invalid native weapon angle")
            if sheet == "dyn_carry_low":
                require(frame["id"] in {"carry_low_pickup", "carry_low_hold", "carry_low_stride", "carry_low_pass", "carry_low_windup", "carry_low_release"}
                        and "itemBindings" not in frame, "Low support cels are exclusively carried-prop poses")
                native_polygons(frame.get("handOcclusion"), rect)
            elif frame["id"] in MAC_ARMED_FRAME_SHEETS:
                require(sheet == MAC_ARMED_FRAME_SHEETS[frame["id"]],
                        "Armed movement cels must retain their selected whole-body sheet")
                native_item_bindings(frame, rect, weapon_cells, MAC_MELEE_KINDS)
                require(all(binding["handOcclusion"] for binding in frame["itemBindings"].values()),
                        "Every armed movement grip needs a native palm mask")
            else:
                require(sheet not in {"dyn_armed_walk", "dyn_armed_run"},
                        "Only the exact eight armed movement cels belong to these sheets")
                native_item_bindings(frame, rect, weapon_cells)
        require(not any(crops_overlap(rect, old) for old in crops.get(sheet, [])), "Supplemental crops overlap")
        crops.setdefault(sheet, []).append(rect)
    for sheet in sheets:
        scale = sheet.get("pixelScale", {})
        reference = by_id.get(scale.get("referenceFrame"), {})
        require(type(scale.get("standingVisibleHeight")) in (int, float) and
                math.isfinite(scale["standingVisibleHeight"]) and scale["standingVisibleHeight"] > 0 and
                reference.get("sheet") == sheet["id"], "Invalid supplemental sheet scale reference")
        excluded = []
        for region in sheet.get("excludedRegions", []):
            rect = region.get("source", {})
            require(native_rect(rect, dimensions[sheet["id"]]) and isinstance(region.get("reason"), str) and
                    region["reason"].strip(), "Invalid excluded native region")
            require(not any(crops_overlap(rect, old) for old in crops.get(sheet["id"], []) + excluded),
                    "Excluded supplemental region overlaps a selected cel")
            excluded.append(rect)
    clips = registration.get("clips", {})
    pipe_clips = {"pipe-swing." + phase for phase in MAC_PIPE_SWING_PHASES}
    embedded_clips = {**{key: "pipe" for key in pipe_clips},
                      **{key: key.removeprefix("weapon_").split(".")[0] for key in MAC_EMBEDDED_WEAPON_CLIPS},
                      **{key: "plasma-disc" for key in MAC_DISC_RETAINED_CLIPS}}
    required_clips = MAC_DYNAMIC_CLIPS | set(embedded_clips)
    loop_clips = MAC_DYNAMIC_LOOPS | {key for key, clip in MAC_EMBEDDED_WEAPON_CLIPS.items() if clip["loop"]}
    require(required_clips <= set(clips) <= required_clips | {"pickup", "guard-impact", "carry-throw"},
            "Unselected or missing supplemental animation clip")
    for key, clip in clips.items():
        require(clip.get("loop") is (key in loop_clips) and isinstance(clip.get("frames"), list) and
                clip["frames"], "Invalid supplemental clip sequence")
        for entry in clip["frames"]:
            require(entry.get("frame") in by_id and type(entry.get("holdMs")) in (int, float) and
                    math.isfinite(entry["holdMs"]) and entry["holdMs"] > 0, "Invalid supplemental clip timing")
            require(MAC_EMBEDDED_FRAME_KINDS.get(entry["frame"]) == embedded_clips.get(key),
                    "Embedded weapon cels may only belong to their own committed weapon clips")
            require(entry["frame"] not in MAC_ARMED_FRAME_SHEETS or key in MAC_ARMED_LOCOMOTION_CLIPS,
                    "Armed movement cels may only belong to their own locomotion clips")
    for phase, sequence in MAC_PIPE_SWING_PHASES.items():
        require(clips["pipe-swing." + phase] == {"loop": False,
                "frames": [{"frame": frame, "holdMs": hold} for frame, hold in sequence]},
                "Pipe swing must preserve its exact six-cel phase order and bounded holds")
    for key, clip in MAC_EMBEDDED_WEAPON_CLIPS.items():
        require(clips[key] == clip, "Embedded gun/disc clip must preserve its exact native cels, order and bounded holds")
    for key, clip in MAC_ARMED_LOCOMOTION_CLIPS.items():
        require(clips[key] == clip, "Armed movement must preserve its exact four-cel order and bounded holds")
    for key, clip in MAC_DISC_RETAINED_CLIPS.items():
        require(clips[key] == clip, "Retained Disc poses must preserve their exact single-frame aliases")
    base_frames = {frame["id"]: frame for frame in base.get("frames", [])}
    anchors = registration.get("baseGripAnchors", {})
    require(isinstance(anchors, dict) and anchors, "Missing selected base-cel weapon grips")
    for frame_id, anchor in anchors.items():
        angle = anchor.get("weaponAngle", 0)
        require(frame_id in base_frames and native_anchor(anchor.get("gripAnchor", {}), base_frames[frame_id]["source"]) and
                type(angle) in (int, float) and math.isfinite(angle) and abs(angle) <= math.pi,
                "Invalid base-cel weapon grip")
        native_item_bindings(anchor, base_frames[frame_id]["source"], weapon_cells)
    require(len(selected) == 13, "Exact selected supplemental native file set required")
    # Preserve the exact old sheets in the source package without selecting them for play.
    for filename, digest in MAC_DYNAMIC_HISTORICAL_IMAGES.items():
        image_name = MAC_DYNAMIC_ROOT + filename
        require(sha(safe_path(output, image_name).read_bytes()) == digest,
                "Historical supplemental source PNG changed")
        selected.add(image_name)
    require(len(selected) == 17, "Exact native supplemental and historical file set required")
    return selected


def street_power_files(output):
    """Select only the six native power atlases and their measured cells."""
    manifest_name = MAC_POWER_ROOT + "mac-street-power-v1.json"
    manifest = json.loads(safe_path(output, manifest_name).read_text(encoding="utf-8"))
    require(manifest.get("schema") == 1 and set(manifest.get("cells", {})) == MAC_POWER_CELLS,
            "Street power requires every registered prop and all three damage palettes")
    sheets = manifest.get("sheets", [])
    require(len(sheets) == 6 and {sheet.get("id") for sheet in sheets} == set(MAC_POWER_SHEETS),
            "Street power must select exactly six native atlases")
    selected, dimensions = {manifest_name}, {}
    for sheet in sheets:
        name = sheet.get("sourceImage", "")
        require(name == MAC_POWER_ROOT + MAC_POWER_SHEETS[sheet["id"]],
                "Power atlas must be a selected native PNG sibling")
        image = safe_path(output, name).read_bytes()
        require(sha(image) == sheet.get("sourceSHA256"), "Power atlas bytes changed")
        require(image[:8] == b"\x89PNG\r\n\x1a\n" and image[24:29] == bytes((8, 6, 0, 0, 0)),
                "Power atlas must retain native RGBA8 transparency")
        size = {"width": int.from_bytes(image[16:20], "big"), "height": int.from_bytes(image[20:24], "big")}
        require(sheet.get("dimensions") == size, "Power atlas dimensions changed")
        dimensions[sheet["id"]] = size
        selected.add(name)
    require(len(selected) == 7, "Power atlases must have distinct paths")
    crops = []
    for name, cell in manifest["cells"].items():
        sheet, rect, pivot = cell.get("sheet"), cell.get("source", {}), cell.get("pivot", {})
        require(sheet in dimensions, "Unknown power cell atlas")
        require(all(isinstance(rect.get(key), int) and rect[key] >= (1 if key in ("width", "height") else 0)
                    for key in ("x", "y", "width", "height")), "Invalid native power crop")
        require(rect["x"] + rect["width"] <= dimensions[sheet]["width"] and
                rect["y"] + rect["height"] <= dimensions[sheet]["height"], "Power crop escapes native atlas")
        require(all(isinstance(pivot.get(key), (int, float)) and math.isfinite(pivot[key]) and
                    0 <= pivot[key] <= rect["width" if key == "x" else "height"] for key in ("x", "y"))
                and isinstance(cell.get("displayHeight"), (int, float)) and
                0 < cell["displayHeight"] <= (580 if name.startswith("fixture_streetlight_") else 500),
                "Invalid power cell registration")
        for key in ("grip", "muzzle"):
            require(key not in cell or native_anchor(cell[key], rect), "Invalid native weapon " + key)
        if "itemFrontRegions" in cell:
            native_polygons(cell["itemFrontRegions"], rect)
        for other_sheet, other in crops:
            require(sheet != other_sheet or min(rect["x"] + rect["width"], other["x"] + other["width"]) <= max(rect["x"], other["x"])
                    or min(rect["y"] + rect["height"], other["y"] + other["height"]) <= max(rect["y"], other["y"]),
                    "Power crops overlap")
        crops.append((sheet, rect))
    historical_car = MAC_POWER_ROOT + "street-cars-v1.png"
    require(sha(safe_path(output, historical_car).read_bytes()) ==
            "8a4bb7d98147fdf88b7cafe39ba268af7b557e601abad24015b3922a4b6d7224",
            "Historical car artwork must remain unchanged")
    selected.add(historical_car)
    return selected


def combat_frame_files(output):
    """Only selected native cels and their hashed registrations enter the game."""
    bank_name = MAC_FRAME_ROOT + "mac-combat-frames-v1.json"
    bank = json.loads(safe_path(output, bank_name).read_text(encoding="utf-8"))
    require(bank.get("schemaVersion") == 1 and isinstance(bank.get("actors"), list),
            "Missing complete-character combat frame bank")
    require(sorted(actor.get("kind") for actor in bank["actors"]) == sorted(MAC_RIG_ACTORS),
            "The frame bank must register Mac, six alien types and the Regent")
    selected = {bank_name}
    for actor in bank["actors"]:
        registration_name = MAC_FRAME_ROOT + actor["kind"] + "-frames-v1.json"
        require(actor.get("registration") == registration_name, "Unselected actor registration")
        selected.add(registration_name)
        data = safe_path(output, registration_name).read_bytes()
        require(sha(data) == actor.get("registrationSHA256"), "Changed actor registration")
        registration = json.loads(data)
        require(registration.get("actor") == actor["kind"] and registration.get("schemaVersion") == 1
                and registration.get("facing") == "right", "Invalid whole-character identity")
        for sheet in registration.get("sheets", []):
            name = sheet.get("sourceImage", "")
            require(re.fullmatch(re.escape(MAC_FRAME_ROOT) + r"[a-z0-9_-]+-v[0-9]+\.png", name),
                    "Frame image must be a selected native PNG sibling")
            selected.add(name)
            image = safe_path(output, name).read_bytes()
            require(sha(image) == sheet.get("sourceSHA256"), "Changed selected complete-character PNG")
            require(image[:8] == b"\x89PNG\r\n\x1a\n" and image[24:29] == bytes((8, 6, 0, 0, 0)),
                    "Frame source must preserve native transparent RGBA8 PNG")
            require(sheet.get("dimensions") == {"width": int.from_bytes(image[16:20], "big"),
                    "height": int.from_bytes(image[20:24], "big")}, "Native frame dimensions changed")
        if actor["kind"] == "mac":
            selected.update(supplemental_frame_files(output, actor, registration))
        else:
            require("supplemental" not in actor, "Only Mac has selected supplemental poses")
    require(sorted(bank.get("files", [])) == sorted(selected), "Unregistered file in frame bank")
    return selected


def verify_combat_frames(output, files):
    selected = combat_frame_files(output)
    require({name for name in files if name.startswith((MAC_FRAME_ROOT, MAC_DYNAMIC_ROOT))} == selected,
            "Only registered complete-character assets may enter the game")
    return {"selectedActors": 8, "assetCount": len(selected), "registeredFiles": sorted(selected),
            "nativeHashesAndDimensions": True, "runtimeAcceptance": "not established by packaging"}
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


def file_record(path):
    digest, size = hashlib.sha256(), 0
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
            size += len(chunk)
    return {"sha256": digest.hexdigest(), "bytes": size}


def no_reparse_path(path):
    # Check before resolving: resolve() would hide a junction or symlink.
    absolute = path.absolute()
    for component in reversed((absolute, *absolute.parents)):
        try:
            metadata = component.lstat()
        except FileNotFoundError:
            continue
        require(not stat.S_ISLNK(metadata.st_mode) and
                not getattr(metadata, "st_file_attributes", 0) &
                getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0),
                f"Reuse path contains a link or reparse point: {component}")


def owned_inventory(root):
    no_reparse_path(root)
    require(root.is_dir(), "Reuse donor must be an existing directory")
    files = []
    for directory, folders, names in os.walk(root, followlinks=False):
        for name in folders + names:
            entry = Path(directory) / name
            metadata = entry.lstat()
            require(not stat.S_ISLNK(metadata.st_mode) and
                    not getattr(metadata, "st_file_attributes", 0) &
                    getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0),
                    f"Reuse donor contains a link or reparse point: {entry}")
            require(stat.S_ISDIR(metadata.st_mode) or stat.S_ISREG(metadata.st_mode),
                    f"Reuse donor contains a non-regular entry: {entry}")
            if stat.S_ISREG(metadata.st_mode):
                files.append(entry.relative_to(root).as_posix())
    return sorted(files)


class OwnedReuse:
    """Verified immutable donor links; changed paths always get a new inode."""

    def __init__(self, donor, output, owner_sha256):
        no_reparse_path(donor)
        no_reparse_path(output)
        self.donor, self.output = donor.resolve(), output.resolve()
        require(self.donor != self.output and
                not self.output.is_relative_to(self.donor) and
                not self.donor.is_relative_to(self.output), "Reuse roots overlap")
        require(not self.output.exists() or not any(self.output.iterdir()),
                "Reuse output must be fresh and empty")
        require(re.fullmatch(r"[0-9a-f]{64}", owner_sha256 or ""),
                "Reuse requires the exact previously verified owner SHA-256")
        marker = safe_path(self.donor, OWNER_FILE)
        require(file_record(marker)["sha256"] == owner_sha256, "Reuse owner hash differs")
        self.owner_bytes = marker.read_bytes()
        self.owner = json.loads(self.owner_bytes)
        require(set(self.owner) == {"assetBytes", "builder", "builderSHA256", "canonicalAssetCount", "files",
                                   "limitations", "ownedFiles", "preservedOriginalCount", "sourceCommit",
                                   "sourceMode", "sourceTree", "status"},
                "Reuse donor owner differs from the sanitized strict-builder schema")
        require(self.owner.get("builder") == TOOL_ID and self.owner.get("status") == "complete",
                "Reuse donor has no complete strict-builder owner")
        require(re.fullmatch(r"[0-9a-f]{40}", self.owner.get("sourceCommit", "")) and
                re.fullmatch(r"[0-9a-f]{40}", self.owner.get("sourceTree", "")),
                "Reuse donor has invalid source identity")
        require(isinstance(self.owner.get("files"), dict), "Reuse donor has no file hashes")
        names = sorted(self.owner["files"])
        for name in names:
            require(PurePosixPath(name).as_posix() == name and name != OWNER_FILE,
                    "Reuse owner contains an unnormalized or recursive path")
            safe_path(self.donor, name)
            record = self.owner["files"][name]
            require(isinstance(record, dict) and set(record) == {"sha256", "bytes"} and
                    re.fullmatch(r"[0-9a-f]{64}", record.get("sha256", "")) and
                    type(record.get("bytes")) is int and record["bytes"] >= 0,
                    f"Reuse owner has an invalid file record: {name}")
        require(self.owner.get("ownedFiles") == sorted([*names, OWNER_FILE]),
                "Reuse owner does not account for every payload path")
        self.linked = 0
        self.skipped = 0
        self.written_bytes = 0
        self.verify_donor()

    def verify_donor(self):
        require(owned_inventory(self.donor) == self.owner["ownedFiles"],
                "Reuse donor contains unknown or missing files")
        require(safe_path(self.donor, OWNER_FILE).read_bytes() == self.owner_bytes,
                "Reuse donor owner changed")
        for name, expected in self.owner["files"].items():
            require(file_record(safe_path(self.donor, name)) == expected,
                    f"Reuse donor payload hash differs: {name}")

    def seed(self, names):
        require(set(self.owner["ownedFiles"]) <= names,
                "Reuse donor has stale owned files; no deletion is permitted")
        require(not self.output.exists() or not any(self.output.iterdir()),
                "Reuse output ceased to be empty")
        self.output.mkdir(parents=True, exist_ok=True)
        # Never hardlink the mutable ownership marker. It is written atomically
        # below, while every linked payload inode remains immutable.
        for name in self.owner["files"]:
            donor, target = safe_path(self.donor, name), safe_path(self.output, name)
            target.parent.mkdir(parents=True, exist_ok=True)
            os.link(donor, target)
            require(os.path.samefile(donor, target), f"Reuse link identity differs: {name}")
            self.linked += 1

    def write(self, target, data):
        no_reparse_path(target)
        require(target.resolve().is_relative_to(self.output), "Reuse write escapes output")
        if target.exists() and file_record(target) == {"sha256": sha(data), "bytes": len(data)}:
            self.skipped += 1
            return
        target.parent.mkdir(parents=True, exist_ok=True)
        descriptor, temporary = tempfile.mkstemp(prefix=".standalone-reuse-", dir=target.parent)
        temporary = Path(temporary)
        try:
            with os.fdopen(descriptor, "wb") as stream:
                stream.write(data)
            require(file_record(temporary) == {"sha256": sha(data), "bytes": len(data)},
                    "Reuse atomic write hash differs")
            # replace() removes this output's old directory entry only. It
            # never truncates an inode shared with the verified donor.
            os.replace(temporary, target)
            self.written_bytes += len(data)
        finally:
            if temporary.exists():
                temporary.unlink()


def write_generated(target, data, reuse):
    if reuse is None:
        target.write_bytes(data)
    else:
        reuse.write(target, data)


def write_generated_text(target, text, reuse):
    if reuse is None:
        target.write_text(text, encoding="utf-8")
    else:
        # Match Path.write_text's existing platform newline behavior exactly.
        reuse.write(target, text.replace("\n", os.linesep).encode("utf-8"))


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
    require(scripts.count("src/game/mac-combat-frames.js") == 1 and
            scripts.index("src/game/mac-combat-frames.js") < scripts.index("src/game/mac-combat-preview.js")
            and "src/game/mac-combat-animation.js" not in scripts,
            "The complete-character cel sampler must launch once before the private Mac wrapper")
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
    frame_files = combat_frame_files(output)
    require({name for name in files if name.startswith((MAC_FRAME_ROOT, MAC_DYNAMIC_ROOT))} == frame_files,
            "The game contains an unregistered complete-character sprite asset")
    power_files = street_power_files(output)
    require({name for name in files if name.startswith(MAC_POWER_ROOT)} == power_files,
            "Only selected power art may enter the playable package")
    originals = sorted([name, record["bytes"], record["sha256"]]
                       for name, record in files.items() if name.startswith("assets/")
                       and name not in derivatives and name not in MAC_REVIEW_ASSETS and name not in MAC_CITY_ASSETS
                       and name not in MAC_RIG_ASSETS and name not in frame_files and name not in power_files)
    require(len(originals) == 624 and sha(json.dumps(originals, separators=(",", ":")).encode("utf-8")) ==
            "0b2ac58dc88ddb68b595fb8592d242d8478c426d78309fe4ff45b88c04027f56",
            "Original 624 artwork/audio identities or bytes changed")
    return {"sources": 171, "compressedSources": 149, "originalSvgSources": 22,
            "derivativeCount": len(derivatives), "unchangedOriginalCount": len(originals),
            "macReviewAssetCount": len(MAC_REVIEW_ASSETS),
            "macCityAssetCount": len(MAC_CITY_ASSETS),
            "macRigAssetCount": len(MAC_RIG_ASSETS),
            "macFrameAssetCount": len(frame_files),
            "macPowerAssetCount": len(power_files),
            "gpuMipBytes": bank.get("allGpuMipBytes"), "runtimeAcceptance": "not established by packaging"}


def build(output, receipt, reuse_owned=None, reuse_owner_sha256=None):
    require((reuse_owned is None) == (reuse_owner_sha256 is None),
            "Provide both --reuse-owned and --reuse-owner-sha256")
    reuse = OwnedReuse(reuse_owned, output, reuse_owner_sha256) if reuse_owned is not None else None
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
    if reuse is not None:
        base = reuse.owner["sourceCommit"]
        require(git("rev-parse", base + "^{tree}").decode("ascii").strip() == reuse.owner["sourceTree"],
                "Reuse donor source tree differs from the exact committed checkpoint")
        require(sha(git("show", base + ":tools/build-standalone.py")) == reuse.owner.get("builderSHA256"),
                "Reuse donor builder differs from its exact committed source")
        git("merge-base", "--is-ancestor", base, head)
    source_paths = ["index.html", "mac-equipment-review.html", "style.css", "sprites-manifest.json"] + sorted(
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
    if reuse is not None:
        reuse.seed(names)
    output.mkdir(parents=True, exist_ok=True)
    # Recover an interrupted copy by recording the exact generated paths before
    # writing them. An in-progress marker never claims the package passed.
    write_generated_text(owner, json.dumps({"builder": TOOL_ID, "status": "building",
                                           "ownedFiles": sorted(names)}, indent=2) + "\n", reuse)
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
            write_generated(target, data, reuse)
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
        write_generated(target, data, reuse)
        assets.append({**record, "source": record["source"]})
    for name, data in payloads.items():
        target = safe_path(output, name)
        target.parent.mkdir(parents=True, exist_ok=True)
        write_generated(target, data, reuse)
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
    checks["wholeCharacterCombatFrames"] = verify_combat_frames(output, file_hashes)
    public = {"builder": TOOL_ID, "status": "complete", "sourceCommit": head, "sourceTree": tree,
              "builderSHA256": sha(Path(__file__).read_bytes()), "files": file_hashes,
              "sourceMode": "working-tree runtime scripts; exact HEAD canonical asset blobs",
              "canonicalAssetCount": len(entries), "preservedOriginalCount": len(records),
              "assetBytes": sum(record["bytes"] for record in assets), "ownedFiles": sorted(names),
              "limitations": limitations}
    if reuse is not None:
        reuse.verify_donor()
        require(owned_inventory(output) == sorted(names), "Reuse output inventory differs from strict ownership")
    write_generated_text(owner, json.dumps(public, indent=2) + "\n", reuse)
    result = {**public, "builtAtUTC": datetime.now(timezone.utc).isoformat(),
              "output": str(output), "originalsReceiptSHA256": originals_hash,
              "runtimeSources": sources,
              "assets": assets, "checks": checks, "publication": "local generated draft; no push or deployment"}
    if reuse is not None:
        result["ownedReuse"] = {"donor": str(reuse.donor), "ownerSHA256": reuse_owner_sha256,
                                "linkedPayloadFiles": reuse.linked, "identicalWritesSkipped": reuse.skipped,
                                "newBytesWritten": reuse.written_bytes, "donorUnchanged": True,
                                "immutableAssetLinks": True, "changedPathsAtomicallyReplaced": True}
    receipt.parent.mkdir(parents=True, exist_ok=True)
    receipt.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "receipt": str(receipt), "sourceCommit": head,
                      "scripts": len(checks["orderedScripts"]), "canonicalAssets": len(entries),
                      "preservedOriginals": len(records), "assetBytes": public["assetBytes"]}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--receipt", type=Path, required=True)
    parser.add_argument("--reuse-owned", type=Path,
                        help="Verify and hardlink an exact owned donor into a fresh low-space output")
    parser.add_argument("--reuse-owner-sha256",
                        help="Required exact SHA-256 of the previously verified donor ownership marker")
    args = parser.parse_args()
    build(args.output, args.receipt, args.reuse_owned, args.reuse_owner_sha256)
