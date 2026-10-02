"""Regression coverage for the real checkpoint renderer/checker and source-pack builder."""
import argparse
import contextlib
import copy
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import zipfile

TOOLS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(TOOLS))
import checkpoint_state as checkpoint

spec = importlib.util.spec_from_file_location('source_pack', TOOLS / 'build-source-pack.py')
pack = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pack)
# Deliberately independent of the live record: future checkpoint/acceptance
# updates must not require changing this regression fixture.
RECORD = {
    'schemaVersion': 1,
    'recordedAtUtc': '2026-10-02T00:00:00Z',
    'mergedCheckpoint': {'branch': 'main', 'pullRequest': 172,
        'revision': 'a' * 40, 'summary': 'Fixture merged checkpoint'},
    'activeWork': {'status': 'review', 'task': 'Fixture continuation',
        'branch': 'agent/fixture', 'baseRevision': 'a' * 40, 'scope': 'Fixture scope'},
    'automatedValidation': {'revision': 'b' * 40, 'status': 'passed',
        'scope': 'Fixture automated check only',
        'evidence': [checkpoint.REPO_URL + '/actions/runs/1']},
    'humanAcceptance': {'status': 'not-recorded', 'scope': 'Fixture owner review',
        'evidence': 'No owner evidence recorded'},
    'nextStep': 'Review the fixture',
}


class CheckpointFixture:
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'repository'
        self.root.mkdir()
        self.record = copy.deepcopy(RECORD)
        self.write(checkpoint.RECORD_PATH, json.dumps(self.record))
        header = checkpoint.render_header(self.record)
        self.history = '\n\n## Historical task\nOld pending work at deadbeef stays historical.\r\n'
        for name in checkpoint.TARGETS:
            self.write(name, '# Fixture\n\n' + header + self.history)

    def write(self, name, value):
        target = self.root / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(value.encode())

    def read(self, name):
        return (self.root / name).read_bytes().decode()

    def run_check(self, write=False):
        with contextlib.redirect_stdout(io.StringIO()):
            checkpoint.run(self.root, write)


class CheckpointTests(CheckpointFixture, unittest.TestCase):
    def test_clean_and_idempotent_sync_preserve_every_document_byte(self):
        before = {name: (self.root / name).read_bytes() for name in checkpoint.TARGETS}
        self.run_check()
        self.run_check(write=True)
        self.run_check(write=True)
        self.assertEqual(before, {name: (self.root / name).read_bytes() for name in checkpoint.TARGETS})

    def test_record_drift_is_detected_and_repaired_without_changing_history(self):
        self.record['activeWork']['task'] = 'The next explicitly approved task'
        self.write(checkpoint.RECORD_PATH, json.dumps(self.record))
        with self.assertRaisesRegex(ValueError, 'drifted'):
            self.run_check()
        self.run_check(write=True)
        self.run_check()
        for name in checkpoint.TARGETS:
            content = self.read(name)
            self.assertIn(self.record['activeWork']['task'], content)
            self.assertEqual(content.split(checkpoint.END, 1)[1], self.history)

    def test_manual_header_drift_is_detected_and_repaired(self):
        name = checkpoint.TARGETS[0]
        self.write(name, self.read(name).replace('PR #172', 'PR #157'))
        with self.assertRaisesRegex(ValueError, 'CONTINUE_HERE.md.*drifted'):
            self.run_check()
        self.run_check(write=True)
        self.run_check()

    def test_malformed_boundaries_and_prepended_status_fail_without_partial_writes(self):
        name = checkpoint.TARGETS[-1]
        original = self.read(name)
        mutations = [
            original.replace(checkpoint.START, ''),
            original.replace(checkpoint.END, ''),
            original + checkpoint.START + checkpoint.END,
            original.replace(checkpoint.START, 'SWAP').replace(checkpoint.END, checkpoint.START)
                .replace('SWAP', checkpoint.END),
            original.replace('# Fixture\n\n', '# Fixture\n\nResume an obsolete branch.\n\n'),
        ]
        for damaged in mutations:
            with self.subTest(damaged=damaged[:100]):
                self.write(name, damaged)
                # Even earlier, repairable drift must not be partially written.
                first = checkpoint.TARGETS[0]
                self.write(first, self.read(first).replace('PR #172', 'PR #157'))
                before = {p: self.read(p) for p in checkpoint.TARGETS}
                with self.assertRaises(ValueError):
                    self.run_check(write=True)
                self.assertEqual(before, {p: self.read(p) for p in checkpoint.TARGETS})
        self.write(name, original)

    def test_invalid_record_fields_fail(self):
        mutations = [
            lambda r: r.update(schemaVersion=2),
            lambda r: r.update(recordedAtUtc='yesterday'),
            lambda r: r['mergedCheckpoint'].update(revision='351f988'),
            lambda r: r['mergedCheckpoint'].update(pullRequest=True),
            lambda r: r['activeWork'].update(baseRevision='f' * 40),
            lambda r: r['activeWork'].update(branch='main'),
            lambda r: r['activeWork'].update(task='misleading\nnew line'),
            lambda r: r['automatedValidation'].update(evidence=[]),
            lambda r: r['humanAcceptance'].update(status='CI passed'),
        ]
        for mutate in mutations:
            record = copy.deepcopy(self.record)
            mutate(record)
            with self.assertRaises(ValueError):
                checkpoint.load_record(json.dumps(record))

    def test_no_active_work_and_separate_human_acceptance(self):
        self.record['activeWork'] = {'status': 'none'}
        loaded = checkpoint.load_record(json.dumps(self.record))
        header = checkpoint.render_header(loaded)
        self.assertIn('Latest recorded continuation task: none recorded', header)
        self.assertNotIn('Review branch:', header)
        self.assertIn('Human acceptance: not-recorded', header)
        self.assertIn('Recorded automated validation: passed', header)


class SourcePackTests(CheckpointFixture, unittest.TestCase):
    def setUp(self):
        super().setUp()
        self.previous_root = pack.ROOT
        pack.ROOT = self.root
        self.addCleanup(setattr, pack, 'ROOT', self.previous_root)
        for name in ('DECISION_REGISTER.md', 'UPDATE_PROTOCOL.md'):
            self.write('docs/source-pack/' + name, '# Required pack document\n')
        self.write('tools/checkpoint_state.py', (TOOLS / 'checkpoint_state.py').read_text())
        self.write('src/example.js', 'const retained = true;\n')
        self.write('project_sources/old.zip', 'historical source input')
        self.write('docs/source-pack/review-old/old.png', 'historical review image')
        self.git('init', '-q')
        self.git('config', 'user.name', 'Checkpoint test')
        self.git('config', 'user.email', 'checkpoint-test@example.invalid')
        self.commit()

    def git(self, *args):
        return subprocess.check_output(['git', '-C', str(self.root), *args], stderr=subprocess.STDOUT).decode().strip()

    def commit(self):
        self.git('add', '.')
        self.git('commit', '-qm', 'Test fixture')
        return self.git('rev-parse', 'HEAD')

    def build(self, revision='HEAD', evidence=None):
        output = Path(self.temp.name) / 'output.zip'
        args = argparse.Namespace(revision=revision, base=None, state='review',
            output=str(output), validation_file=str(evidence) if evidence else None,
            unpublished=True, pr_url=None)
        with contextlib.redirect_stdout(io.StringIO()):
            pack.build(args)
        return output

    def test_branch_name_and_detached_head_do_not_change_consistency(self):
        self.git('checkout', '-qb', 'unrelated-review-name')
        self.run_check()
        self.git('checkout', '--detach', '-q')
        self.run_check()
        self.build()

    def test_exact_revision_ignores_dirty_and_later_committed_headers(self):
        first = self.git('rev-parse', 'HEAD')
        original_record = self.read(checkpoint.RECORD_PATH)
        original_continue = self.read('CONTINUE_HERE.md')
        self.record['activeWork']['task'] = 'Later committed task'
        self.write(checkpoint.RECORD_PATH, json.dumps(self.record))
        self.run_check(write=True)
        self.commit()
        self.write('CONTINUE_HERE.md', 'uncommitted inconsistent text')
        with zipfile.ZipFile(self.build(first)) as archive:
            def read(name):
                return archive.read(pack.PACK_ROOT + '/' + name)
            manifest = json.loads(read('SOURCE_MANIFEST.json'))
            self.assertEqual(manifest['revision'], first)
            self.assertEqual(manifest['implementationStatus'], 'review')
            self.assertEqual(manifest['checkpointConsistency'], 'passed against exported revision')
            self.assertEqual(read('CURRENT_CHECKPOINT.json').decode(), original_record)
            self.assertEqual(read('CONTINUE_HERE.md').decode(), original_continue)
            self.assertEqual(read('repository-snapshot/CONTINUE_HERE.md'), read('CONTINUE_HERE.md'))
            for name in checkpoint.TARGETS:
                if name.startswith('docs/source-pack/'):
                    self.assertEqual(read(name.removeprefix('docs/source-pack/')), read('repository-snapshot/' + name))
            for line in read('FILE_HASHES.sha256').decode().splitlines():
                digest, name = line.split('  ', 1)
                self.assertEqual(digest, hashlib.sha256(read(name)).hexdigest())
            excluded = {item['path'] for item in manifest['excludedSourceFiles']}
            self.assertIn('project_sources/old.zip', excluded)
            self.assertIn('docs/source-pack/review-old/old.png', excluded)
            self.assertNotIn('repository-snapshot/project_sources/old.zip', [n.removeprefix(pack.PACK_ROOT + '/') for n in archive.namelist()])

    def test_committed_drift_fails_before_replacing_existing_zip(self):
        output = self.build()
        before = output.read_bytes()
        self.write('CONTINUE_HERE.md', self.read('CONTINUE_HERE.md').replace('PR #172', 'PR #157'))
        self.commit()
        with self.assertRaisesRegex(ValueError, 'drifted'):
            self.build()
        self.assertEqual(output.read_bytes(), before)

    def test_missing_record_in_current_format_fails(self):
        (self.root / checkpoint.RECORD_PATH).unlink()
        self.commit()
        with self.assertRaisesRegex(ValueError, 'record is missing'):
            self.build()

    def test_removed_record_and_tool_with_remaining_markers_is_not_legacy(self):
        (self.root / checkpoint.RECORD_PATH).unlink()
        (self.root / 'tools/checkpoint_state.py').unlink()
        self.commit()
        with self.assertRaisesRegex(ValueError, 'markers without a committed record'):
            self.build()

    def test_legacy_export_has_no_invented_current_metadata(self):
        (self.root / checkpoint.RECORD_PATH).unlink()
        (self.root / 'tools/checkpoint_state.py').unlink()
        for name in checkpoint.TARGETS:
            self.write(name, '# Historical fixture without current-format headers\n')
        self.commit()
        with zipfile.ZipFile(self.build()) as archive:
            manifest = json.loads(archive.read(pack.PACK_ROOT + '/SOURCE_MANIFEST.json'))
            self.assertIsNone(manifest['checkpointRecord'])
            self.assertIn('legacy', manifest['checkpointConsistency'])
            self.assertNotIn(pack.PACK_ROOT + '/CURRENT_CHECKPOINT.json', archive.namelist())
            self.assertNotIn(pack.PACK_ROOT + '/CONTINUE_HERE.md', archive.namelist())

    def test_exact_evidence_receipt_required_without_inventing_owner_acceptance(self):
        evidence = Path(self.temp.name) / 'receipt.json'
        evidence.write_text(json.dumps({'revision': self.git('rev-parse', 'HEAD'),
            'automatedTests': {'checkpoint fixture': 'passed'}, 'makkoPlaytest': 'not recorded'}))
        with zipfile.ZipFile(self.build(evidence=evidence)) as archive:
            actual = json.loads(archive.read(pack.PACK_ROOT + '/test-evidence.json'))
            self.assertEqual(actual['makkoPlaytest'], 'not recorded')
        evidence.write_text(json.dumps({'revision': 'f' * 40}))
        with self.assertRaisesRegex(ValueError, 'exact exported commit'):
            self.build(evidence=evidence)


if __name__ == '__main__':
    unittest.main()
