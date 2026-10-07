"""Exercise the strict builder's low-space writes on tiny real filesystem fixtures."""
import argparse
import importlib.util
import json
import os
import sys
import tempfile
from pathlib import Path

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("standalone_builder", Path(__file__).with_name("build-standalone.py"))
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


def fixture(root, label):
    donor, output = root / label / "donor", root / label / "output"
    donor.mkdir(parents=True)
    data = {"assets/existing.bin": b"original native art\x00\xff", "src/game.js": b"original runtime"}
    for name, payload in data.items():
        target = builder.safe_path(donor, name)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(payload)
    owner = {"builder": builder.TOOL_ID, "status": "complete", "sourceCommit": "1" * 40,
             "sourceTree": "2" * 40, "builderSHA256": builder.sha(Path(builder.__file__).read_bytes()),
             "files": {name: {"bytes": len(payload), "sha256": builder.sha(payload)} for name, payload in data.items()},
             "sourceMode": "working-tree runtime scripts; exact HEAD canonical asset blobs",
             "canonicalAssetCount": 1, "preservedOriginalCount": 1,
             "assetBytes": len(data["assets/existing.bin"]), "ownedFiles": sorted([*data, builder.OWNER_FILE]),
             "limitations": ["Tiny filesystem safety fixture; no gameplay or release acceptance."]}
    marker = donor / builder.OWNER_FILE
    marker.write_text(json.dumps(owner, indent=2) + "\n", encoding="utf-8")
    return donor, output, builder.sha(marker.read_bytes()), data


def refused(action, expected):
    try:
        action()
    except ValueError as error:
        assert expected in str(error), (expected, str(error))
        return str(error)
    raise AssertionError("Unsafe fixture was not refused: " + expected)


def identity(path):
    value = path.stat()
    return {"device": value.st_dev, "inode": value.st_ino, "links": value.st_nlink}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--receipt", type=Path, required=True)
    args = parser.parse_args()
    args.receipt.parent.mkdir(parents=True, exist_ok=True)
    # Retain these few-byte fixtures as evidence; never delete another build.
    root = Path(tempfile.mkdtemp(prefix="reuse-proof-", dir=args.receipt.parent))
    groups = []
    donor, output, marker_hash, payloads = fixture(root, "safe")
    reuse = builder.OwnedReuse(donor, output, marker_hash)
    names = set(payloads) | {builder.OWNER_FILE}
    reuse.seed(names)
    assert not (output / builder.OWNER_FILE).exists(), "Mutable marker must never be hardlinked"
    art = "assets/existing.bin"
    assert os.path.samefile(donor / art, output / art)
    linked_before = identity(output / art)
    builder.write_generated(output / art, payloads[art], reuse)
    assert os.path.samefile(donor / art, output / art)
    assert identity(output / art) == linked_before
    groups.append({"group": "identical-native-asset-keeps-real-hardlink", "identity": linked_before})
    game = "src/game.js"
    linked_game = identity(output / game)
    changed = b"changed runtime, new inode"
    builder.write_generated(output / game, changed, reuse)
    assert (output / game).read_bytes() == changed
    assert (donor / game).read_bytes() == payloads[game]
    assert not os.path.samefile(donor / game, output / game)
    assert identity(output / game)["inode"] != linked_game["inode"]
    groups.append({"group": "changed-runtime-atomically-isolates-donor", "before": linked_game,
                   "after": identity(output / game), "donor": identity(donor / game)})
    builder.write_generated_text(output / builder.OWNER_FILE, "new marker\n", reuse)
    assert builder.sha((donor / builder.OWNER_FILE).read_bytes()) == marker_hash
    assert not os.path.samefile(donor / builder.OWNER_FILE, output / builder.OWNER_FILE)
    reuse.verify_donor()
    assert builder.owned_inventory(output) == sorted(names)
    groups.append({"group": "mutable-marker-isolated-and-entire-donor-unchanged"})
    plain = root / "ordinary-output.txt"
    builder.write_generated(plain, b"unchanged default bytes", None)
    assert plain.read_bytes() == b"unchanged default bytes"
    builder.write_generated_text(plain, "default\nnewlines\n", None)
    assert plain.read_bytes() == ("default\nnewlines\n".replace("\n", os.linesep).encode())
    groups.append({"group": "ordinary-byte-and-text-write-behavior-preserved"})
    donor, output, marker_hash, _ = fixture(root, "unknown")
    (donor / "unowned.txt").write_bytes(b"preserve me")
    groups.append({"group": "unknown-donor-entry-refused", "reason": refused(
        lambda: builder.OwnedReuse(donor, output, marker_hash), "unknown or missing")})
    assert (donor / "unowned.txt").read_bytes() == b"preserve me" and not output.exists()
    donor, output, marker_hash, _ = fixture(root, "changed")
    (donor / "src/game.js").write_bytes(b"unrecorded change")
    groups.append({"group": "changed-donor-payload-refused", "reason": refused(
        lambda: builder.OwnedReuse(donor, output, marker_hash), "payload hash differs")})
    assert not output.exists()
    donor, output, marker_hash, _ = fixture(root, "owner")
    groups.append({"group": "unexpected-owner-hash-refused", "reason": refused(
        lambda: builder.OwnedReuse(donor, output, "0" * 64), "owner hash differs")})
    donor, output, marker_hash, payloads = fixture(root, "stale")
    stale_reuse = builder.OwnedReuse(donor, output, marker_hash)
    groups.append({"group": "stale-owned-path-refused-without-deletion", "reason": refused(
        lambda: stale_reuse.seed({"assets/existing.bin", builder.OWNER_FILE}), "stale owned files")})
    assert not output.exists() and (donor / "src/game.js").read_bytes() == payloads["src/game.js"]
    donor, output, marker_hash, _ = fixture(root, "occupied")
    output.mkdir()
    (output / "user.txt").write_bytes(b"do not touch")
    groups.append({"group": "occupied-output-refused", "reason": refused(
        lambda: builder.OwnedReuse(donor, output, marker_hash), "fresh and empty")})
    assert (output / "user.txt").read_bytes() == b"do not touch"
    donor, output, marker_hash, _ = fixture(root, "overlap")
    groups.append({"group": "overlapping-roots-refused", "reason": refused(
        lambda: builder.OwnedReuse(donor, donor / "child", marker_hash), "roots overlap")})
    groups.append({"group": "write-escape-refused", "reason": refused(
        lambda: reuse.write(root / "outside.txt", b"forbidden"), "write escapes")})
    assert not (root / "outside.txt").exists()
    # Native Windows junction creation needs no elevated symlink privilege.
    # Test a real reparse point where supported; unsupported hosts are explicit.
    reparse = {"group": "real-reparse-point-refused", "status": "not-exercised"}
    if os.name == "nt":
        import subprocess
        junction = root / "junction"
        made = subprocess.run(["cmd", "/c", "mklink", "/J", str(junction), str(donor)],
                              capture_output=True, text=True)
        if made.returncode == 0:
            reparse = {"group": "real-reparse-point-refused", "status": "passed", "reason": refused(
                lambda: builder.OwnedReuse(junction, root / "junction-output", marker_hash), "reparse point")}
        else:
            reparse["reason"] = made.stderr.strip() or made.stdout.strip()
    groups.append(reparse)
    receipt = {"status": "passed", "groups": len(groups), "fixtures": str(root), "platform": sys.platform,
               "builderSHA256": builder.sha(Path(builder.__file__).read_bytes()), "results": groups,
               "limitations": ["Tiny real filesystem proof only; no full package, browser or game test was run.",
                               "Hardlinked generated assets stay immutable; installers must atomically replace changed paths."]}
    args.receipt.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": "passed", "groups": len(groups), "receipt": str(args.receipt),
                      "fixtures": str(root), "realReparsePoint": reparse["status"]}))


if __name__ == "__main__":
    main()
