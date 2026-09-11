#!/usr/bin/env python3
"""Export a reviewable source pack from an exact Git commit; standard library only."""
import argparse
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import subprocess
import tarfile
import zipfile
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
PACK_ROOT = "BARCODE-System-Override-Source-Pack-v5"
DOC_PREFIX = "docs/source-pack/"


def exclusion_reason(path):
    if path.parts and path.parts[0] == "project_sources" and path.suffix.lower() == ".zip":
        return "Historical source-pack input; retained in Git, omitted from current export to avoid nested obsolete packs."
    return None


def git(*args):
    return subprocess.check_output(["git", "-C", str(ROOT), *args])


def build(args):
    revision = git("rev-parse", "--verify", args.revision + "^{commit}").decode().strip()
    base = git("rev-parse", "--verify", args.base + "^{commit}").decode().strip() if args.base else None
    if args.state == "merged" and base and revision != base:
        raise ValueError("A merged export must identify the same revision and verified main base.")
    output = Path(args.output).resolve()
    if output.is_relative_to(ROOT):
        raise ValueError("Write ZIPs outside the repository so generated exports cannot enter the source tree.")
    entries = {}
    tracked_count = 0
    exported_count = 0
    exclusions = []
    with tarfile.open(fileobj=io.BytesIO(git("archive", "--format=tar", revision))) as source:
        for member in source.getmembers():
            if member.isdir():
                continue
            path = PurePosixPath(member.name)
            if not member.isfile() or path.is_absolute() or ".." in path.parts:
                raise ValueError("Unsupported archive member: " + member.name)
            tracked_count += 1
            reason = exclusion_reason(path)
            if reason:
                exclusions.append({"path": member.name, "reason": reason})
                continue
            content = source.extractfile(member).read()
            destinations = ["repository-snapshot/" + member.name]
            if member.name.startswith(DOC_PREFIX):
                destinations.append(member.name[len(DOC_PREFIX):])
            for destination in destinations:
                if destination in entries:
                    raise ValueError("Duplicate exported path: " + destination)
                entries[destination] = content
            exported_count += 1
    for required in ("README.md", "PROJECT_INSTRUCTIONS.md", "DECISION_REGISTER.md", "CURRENT_STATE.md", "UPDATE_PROTOCOL.md"):
        if required not in entries:
            raise ValueError("Committed source-pack document is missing: " + required)
    evidence = None
    if args.validation_file:
        evidence = json.loads(Path(args.validation_file).read_text())
        if evidence.get("revision") != revision:
            raise ValueError("Validation evidence must identify this exact exported commit.")
        entries["test-evidence.json"] = (json.dumps(evidence, indent=2) + "\n").encode()
    manifest = {
        "packVersion": "5.0",
        "repository": "6-Bit-01/BARCODE-SYSTEM-OVERRIDE",
        "repositoryUrl": "https://github.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE",
        "revision": revision,
        "revisionUrl": "https://github.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/tree/" + revision,
        "verifiedMainBase": base,
        "implementationStatus": args.state,
        "pullRequestUrl": args.pr_url,
        "generatedAtUtc": datetime.now(timezone.utc).isoformat(),
        "sourceCommitDate": git("show", "-s", "--format=%cI", revision).decode().strip(),
        "sourceMode": "committed Git tree with listed exclusions; no working-tree substitutions; pack documents additionally copied to archive root",
        "snapshotDirectory": "repository-snapshot/",
        "trackedFileCount": tracked_count,
        "exportedSourceFileCount": exported_count,
        "excludedSourceFiles": exclusions,
        "packDocumentSourceDirectory": DOC_PREFIX,
        "historicalBaseline": "7788ebfab4d6231c18229bef9571d6b97b676764 (PR #25)",
        "supersedes": ["Source Pack v2", "Source Pack v3", "Source Pack v4"],
        "authority": "Newest explicit owner decisions, then current pack decisions; snapshot proves implementation, not design approval.",
        "verification": evidence or {"automatedTests": "not recorded in this export", "makkoPlaytest": "not recorded in this export"},
        "runtimeLimitations": [
            "Makko supplies /lib/MakkoEngine.min.js; it is not included in Git.",
            "Artwork and audio referenced by remote URLs remain externally hosted.",
            "This source snapshot is not a self-contained offline build."
        ],
        "hashScope": "FILE_HASHES.sha256 covers every archive file except itself."
    }
    entries["SOURCE_MANIFEST.json"] = (json.dumps(manifest, indent=2) + "\n").encode()
    entries["FILE_HASHES.sha256"] = "".join(
        hashlib.sha256(entries[name]).hexdigest() + "  " + name + "\n"
        for name in sorted(entries)
    ).encode()
    timestamp = tuple(datetime.fromisoformat(manifest["sourceCommitDate"]).astimezone(timezone.utc).timetuple()[:6])
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name in sorted(entries):
            info = zipfile.ZipInfo(PACK_ROOT + "/" + name, date_time=timestamp)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, entries[name])
    with zipfile.ZipFile(output) as archive:
        if archive.testzip() is not None:
            raise ValueError("ZIP integrity validation failed")
        for name, content in entries.items():
            if archive.read(PACK_ROOT + "/" + name) != content:
                raise ValueError("Export content validation failed: " + name)
    print(json.dumps({"output": str(output), "revision": revision, "files": len(entries), "bytes": output.stat().st_size, "sha256": hashlib.sha256(output.read_bytes()).hexdigest(), "status": "validated"}, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--revision", default="HEAD")
    parser.add_argument("--base", help="Verified current main commit; required to label an export merged.")
    parser.add_argument("--output", required=True, help="Absolute ZIP path outside the repository.")
    parser.add_argument("--state", choices=("review", "merged"), default="review")
    parser.add_argument("--pr-url", default=None)
    parser.add_argument("--validation-file", help="JSON test receipt with matching revision.")
    arguments = parser.parse_args()
    if arguments.state == "merged" and not arguments.base:
        parser.error("--state merged requires --base naming the verified current main commit")
    build(arguments)
