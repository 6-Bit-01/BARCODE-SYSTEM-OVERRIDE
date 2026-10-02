#!/usr/bin/env python3
"""Synchronize current handoff headers without changing historical notes (stdlib)."""
import argparse
from datetime import datetime
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
RECORD_PATH = 'docs/source-pack/CURRENT_CHECKPOINT.json'
TARGETS = (
    'CONTINUE_HERE.md',
    'docs/source-pack/CURRENT_STATE.md',
    'AGENTS.md',
    'README.md',
    'docs/source-pack/README.md',
    'docs/source-pack/PROJECT_INSTRUCTIONS.md',
    'docs/source-pack/ACCEPTANCE.md',
)
START = '<!-- CURRENT_CHECKPOINT:START -->'
END = '<!-- CURRENT_CHECKPOINT:END -->'
REPO_URL = 'https://github.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE'


def require(condition, message):
    if not condition:
        raise ValueError(message)


def text(value, name):
    require(isinstance(value, str) and bool(value.strip()) and '\n' not in value
            and '\r' not in value and START not in value and END not in value,
            name + ' must be nonempty single-line text')
    return value


def revision(value, name):
    require(isinstance(value, str) and re.fullmatch(r'[0-9a-f]{40}', value),
            name + ' must be a full lowercase Git SHA')


def load_record(content):
    record = json.loads(content)
    require(isinstance(record, dict) and type(record.get('schemaVersion')) is int and record.get('schemaVersion') == 1,
            'Unsupported checkpoint schemaVersion (expected 1)')
    stamp = text(record.get('recordedAtUtc'), 'recordedAtUtc')
    require(stamp.endswith('Z'), 'recordedAtUtc must use UTC Z notation')
    datetime.fromisoformat(stamp.replace('Z', '+00:00'))
    for section in ('mergedCheckpoint', 'activeWork', 'automatedValidation', 'humanAcceptance'):
        require(isinstance(record.get(section), dict), section + ' must be an object')
    merged = record['mergedCheckpoint']
    require(merged['branch'] == 'main', 'mergedCheckpoint.branch must be main')
    require(type(merged['pullRequest']) is int and merged['pullRequest'] > 0,
            'mergedCheckpoint.pullRequest must be a positive integer')
    revision(merged['revision'], 'mergedCheckpoint.revision')
    text(merged['summary'], 'mergedCheckpoint.summary')
    work = record['activeWork']
    require(work['status'] in ('review', 'none'), 'activeWork.status must be review or none')
    if work['status'] == 'review':
        for key in ('task', 'branch', 'scope'):
            text(work[key], 'activeWork.' + key)
        require(re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._/-]*', work['branch'])
                and '..' not in work['branch'] and work['branch'] != 'main',
                'activeWork.branch must name a review branch')
        revision(work['baseRevision'], 'activeWork.baseRevision')
        require(work['baseRevision'] == merged['revision'],
                'activeWork.baseRevision must match the merged checkpoint')
    text(record['nextStep'], 'nextStep')
    checks = record['automatedValidation']
    revision(checks['revision'], 'automatedValidation.revision')
    require(checks['status'] in ('passed', 'failed', 'not-recorded'),
            'Invalid automatedValidation.status')
    text(checks['scope'], 'automatedValidation.scope')
    require(isinstance(checks['evidence'], list), 'automatedValidation.evidence must be a list')
    for url in checks['evidence']:
        require(isinstance(url, str) and re.fullmatch(
            re.escape(REPO_URL) + r'/actions/runs/[0-9]+', url),
            'Automated evidence must link to a repository workflow run')
    require(checks['status'] == 'not-recorded' or bool(checks['evidence']),
            'A recorded automated result needs evidence')
    acceptance = record['humanAcceptance']
    require(acceptance['status'] in ('not-recorded', 'recorded'),
            'Invalid humanAcceptance.status')
    text(acceptance['scope'], 'humanAcceptance.scope')
    text(acceptance['evidence'], 'humanAcceptance.evidence')
    return record


def render_header(record):
    merged, work = record['mergedCheckpoint'], record['activeWork']
    checks, human = record['automatedValidation'], record['humanAcceptance']
    lines = [START, '## Current checkpoint', '',
        'Generated from `' + RECORD_PATH + '`; edit that record, then run `npm run checkpoint:sync`.',
        'Recorded at ' + record['recordedAtUtc'] + '; this is a dated handoff, not a live GitHub status query.', '',
        '- Latest verified merged code: [PR #' + str(merged['pullRequest']) + ']('
        + REPO_URL + '/pull/' + str(merged['pullRequest']) + ') on `main` at `'
        + merged['revision'] + '`',
        '- Merged checkpoint: ' + merged['summary']]
    if work['status'] == 'review':
        lines.extend(['- Latest recorded continuation task: ' + work['task'] + ' (review)',
            '- Review branch: `' + work['branch'] + '`; base `' + work['baseRevision'] + '`',
            '- Approved scope: ' + work['scope']])
    else:
        lines.append('- Latest recorded continuation task: none recorded')
    lines.extend(['- Recorded automated validation: ' + checks['status'] + ' at `'
        + checks['revision'] + '`; ' + checks['scope'],
        '- Automated evidence: ' + (', '.join('[run ' + url.rsplit('/', 1)[1] + ']('
            + url + ')' for url in checks['evidence']) or 'none recorded'),
        '- Human acceptance: ' + human['status'] + '; ' + human['scope'],
        '- Human evidence: ' + human['evidence'],
        '- Next step: ' + record['nextStep'], '',
        'The exported tree/review/merge status and exact test receipt belong to `SOURCE_MANIFEST.json` and `test-evidence.json` when present.',
        'A prior checkpoint or passing CI does not certify this review, owner acceptance, or permission to merge/deploy.',
        'Before continuing, recheck the current owner request and remote branch/PR state; update the record when those facts change.', '',
        'Earlier task/status descriptions below, including old current/next/candidate/publication wording, are historical. Do not resume an old task from them.',
        'Retained gameplay constraints and engineering rules still apply unless explicitly superseded by the owner.', END])
    return '\n'.join(lines)


def updated_document(content, header, name):
    require(content.count(START) == 1 and content.count(END) == 1,
            name + ': expected exactly one current checkpoint marker pair')
    start, end = content.index(START), content.index(END)
    require(start < end, name + ': checkpoint markers are reversed')
    title = content.split('\n', 1)[0]
    require(title.startswith('# ') and content[:start] == title + '\n\n',
            name + ': current checkpoint must immediately follow the document title')
    return content[:start] + header + content[end + len(END):]


def verify_documents(record, documents):
    header = render_header(record)
    errors = []
    for name in TARGETS:
        try:
            content = documents[name]
            if updated_document(content, header, name) != content:
                errors.append(name + ': generated current checkpoint has drifted')
        except (KeyError, ValueError) as error:
            errors.append(str(error))
    require(not errors, '\n'.join(errors) + '\nRun npm run checkpoint:sync after updating ' + RECORD_PATH)


def run(root, write=False):
    record = load_record((root / RECORD_PATH).read_bytes().decode('utf-8'))
    documents = {name: (root / name).read_bytes().decode('utf-8') for name in TARGETS}
    if write:
        # Validate every boundary before writing anything; never guess where history ends.
        updates = {name: updated_document(content, render_header(record), name)
                   for name, content in documents.items()}
        for name, content in updates.items():
            if content != documents[name]:
                (root / name).write_bytes(content.encode('utf-8'))
    else:
        verify_documents(record, documents)
    print('PASS current checkpoint ' + ('synchronized' if write else 'consistent')
          + ' across ' + str(len(TARGETS)) + ' entrypoints')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true', help='Repair marked headers; preserve all other bytes')
    arguments = parser.parse_args()
    try:
        run(ROOT, write=arguments.write)
    except (KeyError, ValueError, OSError) as error:
        print('Checkpoint error: ' + str(error), file=sys.stderr)
        sys.exit(1)
