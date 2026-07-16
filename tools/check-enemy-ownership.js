const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const exists = f => fs.existsSync(path.join(ROOT, f));
let failed = false;
function assert(cond, msg) { if (!cond) { failed = true; console.error(`enemy ownership check failed: ${msg}`); } }
function count(s, re) { return (s.match(re) || []).length; }

const index = read('index.html');
const enemies = read('src/game/enemies.js');
const jammer = read('src/game/jammer-environment.js');
const update = read('src/game/update-coordinator.js');
const runtime = read('src/core/runtime-lifecycle.js');
const objectives = read('src/game/objectives.js');
const debug = read('src/game/debug-commands.js');
const tutorial = read('src/game/tutorial.js');
const docs = [
  'docs/technical/SCRIPT_AND_GLOBAL_MAP.md',
  'docs/technical/KNOWN_ISSUES.md',
  'docs/design/LEVEL_01_VERTICAL_SLICE.md'
].filter(exists).map(read).join('\n');

assert(count(enemies, /window\.Enemy\s*=\s*class Enemy/g) === 1, 'one Enemy definition lives in enemies.js');
assert(count(enemies, /window\.EnemyManager\s*=\s*class EnemyManager/g) === 1, 'one EnemyManager definition lives in enemies.js');
assert(count(enemies, /window\.enemyManager\s*=\s*new window\.EnemyManager/g) === 1, 'one enemyManager construction site lives in enemies.js');
assert(!/JammerEnemy/.test(enemies + index), 'JammerEnemy is not active or loaded');
assert(!index.includes('jammer-fix-patch.js') && !index.includes('jammer-spawn-logic.js') && !index.includes('collision-fix.js'), 'late enemy patch scripts are not loaded');
assert(!exists('jammer-fix-patch.js') && !exists('src/game/' + 'jammer-spawn-logic.js') && !exists('src/game/' + 'collision-fix.js'), 'obsolete patch files are deleted');
assert(/if \(!window\.enemyManager\)/.test(enemies), 'manager initialization is idempotent and stable');
assert(/EnemyManager\.update\(\) owns enemy\/enemy and enemy\/player collision orchestration/.test(update), 'update coordinator calls enemy manager once and documents collision ownership');
assert(count(update, /enemyManager\.update\(/g) === 1 && count(update, /enemyManager\.checkCollisions\(/g) === 0, 'update coordinator does not duplicate collision calls');
assert(/newlyDefeated\.forEach\(enemy => this\.recordDefeat\(enemy\)\)/.test(enemies), 'defeats are recorded through manager event path');
assert(/_defeatRecorded/.test(enemies) && /_scoreApplied/.test(enemies), 'repeated damage/cleanup cannot recount score or defeats');
assert(/nx = 1; ny = 0/.test(enemies) && /Number\.isFinite\(dist\)/.test(enemies), 'exact-overlap collisions use finite deterministic fallback');
assert(!/return;\s*\}\s*const e1CX/.test(enemies), 'skipped/noncollidable pairs cannot abort enemy pair scan');
assert(/_crowdBurstTimer/.test(enemies) && /_crowdBurstMultiplier/.test(enemies) && !/enemy\.speed \*=/.test(enemies), 'crowd modifiers are countdown-owned and do not mutate base speed');
assert(/reset\(\)/.test(enemies) && /dispose\(\)/.test(enemies) && /getDiagnostics\(\)/.test(enemies), 'manager has reset/dispose/diagnostics');
assert(/BARCODE\.JammerEnvironment/.test(jammer) && /Object\.freeze\(\{ initialize, reveal, trigger, reset, dispose, update, draw, getStatus, getDiagnostics, getPosition \}\)/.test(jammer), 'environmental Jammer API exists');
assert(!/health|takeDamage|kill|point value/i.test(jammer), 'Jammer environment has no health/damage/kill/point semantics');
assert(/JammerEnvironment\.getPosition\(\)/.test(update), 'indicator tracks environmental Jammer state');
assert(/JammerEnvironment\.dispose/.test(runtime) && /jammerEnvironment:/.test(runtime), 'RuntimeLifecycle owns Jammer teardown and diagnostics');
assert(/enemies: window\.enemyManager/.test(runtime), 'RuntimeLifecycle exposes enemy diagnostics');
assert(!/Defeat 20 enemies|Destroy the Broadcast Jammer|destroy_jammer|spawnBroadcastJammer|20 ENEMIES|set enemy count to 20/.test(objectives + debug + tutorial + update), 'old kill-20/destroy-Jammer active paths are gone');
assert(/_tutorialEnemiesDefeated >= 3/.test(enemies) && /Practice movement, rhythm, and hacking/.test(tutorial), 'tutorial three-enemy path remains represented');
assert(!/requestAnimationFrame\(/.test(enemies + jammer + runtime), 'enemy/Jammer/lifecycle changes create no competing RAF');
assert(/single active enemy owner/.test(docs) && /JammerEnvironment/.test(docs) && /authoritative defeat/.test(docs), 'documentation records new ownership model');

if (failed) process.exit(1);
console.log('enemy ownership check passed.');
