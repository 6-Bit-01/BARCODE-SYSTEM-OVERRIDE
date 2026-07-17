const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const exists = f => fs.existsSync(path.join(ROOT, f));
let failed = false;
function assert(cond, msg) { if (!cond) { failed = true; console.error(`enemy ownership check failed: ${msg}`); } }
function count(s, re) { return (s.match(re) || []).length; }

const index = read('index.html');
const loadedScripts = [...index.matchAll(/<script src="([^"]+\.js)"><\/script>/g)].map(m => m[1]).filter(src => !src.startsWith('/'));
const loadedSources = Object.fromEntries(loadedScripts.filter(exists).map(f => [f, read(f)]));
const loadedText = Object.values(loadedSources).join('\n');
const rootDiagnostics = ['final-verification-test.js', 'verify-jammer-autospawn.js', 'test-jammer-spawn.js', 'test-jammer-spawn-fix.js', 'jammer-audio-patch.js'].filter(exists);
const rootDiagnosticText = rootDiagnostics.map(read).join('\n');

const enemies = read('src/game/enemies.js');
const jammer = read('src/game/jammer-environment.js');
const gameState = read('src/game/game-state.js');
const tutorial = read('src/game/tutorial.js');
const runtime = read('src/core/runtime-lifecycle.js');
const sector = read('src/game/sector1-progression.js');
const objectives = read('src/game/objectives.js');
const debug = read('src/game/debug-commands.js');
const docs = ['docs/technical/SCRIPT_AND_GLOBAL_MAP.md', 'docs/technical/KNOWN_ISSUES.md', 'docs/design/LEVEL_01_VERTICAL_SLICE.md'].filter(exists).map(read).join('\n');

assert(loadedScripts.includes('src/game/enemies.js') && loadedScripts.includes('src/game/jammer-environment.js'), 'index loads canonical enemies and JammerEnvironment');
assert(count(enemies, /window\.Enemy\s*=\s*class Enemy/g) === 1, 'one Enemy definition lives in enemies.js');
assert(count(enemies, /window\.EnemyManager\s*=\s*class EnemyManager/g) === 1, 'one EnemyManager definition lives in enemies.js');
assert(count(enemies, /window\.enemyManager\s*=\s*new window\.EnemyManager/g) === 1, 'one enemyManager construction site lives in enemies.js');
assert(!/JammerEnemy/.test(loadedText + index), 'JammerEnemy is not active or loaded');
assert(!index.includes('jammer-fix-patch.js') && !index.includes('jammer-spawn-logic.js') && !index.includes('collision-fix.js'), 'late enemy patch scripts are not loaded');
assert(!exists('jammer-fix-patch.js') && !exists('src/game/' + 'jammer-spawn-logic.js') && !exists('src/game/' + 'collision-fix.js'), 'obsolete patch files are deleted');
assert(rootDiagnostics.length === 0, `obsolete executable root diagnostics must be archived, still present: ${rootDiagnostics.join(', ')}`);

const forbiddenGate = /requiredForProgress|requiredEnemyKills|savedEnemiesDefeated|broadcastJammerDestroyed|getTotalEnemiesDefeated|Defeat 20 enemies|Eliminate 20 hostile|Destroy the Broadcast Jammer|destroy_jammer|spawnBroadcastJammer|20 ENEMIES|set enemy count to 20|currentEnemyCount\s*>=\s*20/;
assert(!forbiddenGate.test(gameState + tutorial + runtime + sector + objectives + debug + loadedText + rootDiagnosticText), 'active/diagnostic code must not contain twenty-kill or destructive-Jammer gate behavior');
assert(!/enemiesDefeated\s*\+\s*.*defeatedCount|defeatedCount\s*\+\s*.*enemiesDefeated/.test(gameState + sector), 'defeat projections must not be added together');
assert(/getCurrentRunDefeats/.test(gameState) && /syncEnemyDefeatProjections/.test(gameState), 'game-state exposes projection sync instead of duplicate totals');
assert(/preserveDefeats/.test(runtime) && !/currentEnemyCount/.test(runtime), 'RuntimeLifecycle uses explicit preserveDefeats policy without quota inference');
assert(/reset\(options = \{\}\)/.test(sector) && /preserveDefeats/.test(sector), 'Sector1Progression reset accepts explicit preservation intent');
assert(!/JammerEnvironment\.reset\(\)/.test(objectives), 'ObjectivesSystem reset must not compete for JammerEnvironment ownership');
assert(!/health|takeDamage|kill|point value/i.test(jammer), 'Jammer environment has no health/damage/kill/point semantics');
assert(/spriteRequested/.test(jammer) && /spriteRequestGeneration/.test(jammer), 'JammerEnvironment tracks one sprite request per generation');
assert(/_spriteRequested/.test(enemies) && /pollSpriteReady/.test(enemies), 'Enemy sprites use request/poll readiness state');
assert(!/setTimeout\(\(\) => \{\s*this\.initSprite/.test(enemies) && !/setTimeout\(\(\) => this\.initSprite/.test(enemies), 'enemy sprite retries must not use recursive untracked setTimeout');
assert(!/Date\.now\(/.test(enemies), 'enemy-owned gameplay timing must not use wall-clock Date.now');
assert(!/setTimeout\(/.test(enemies), 'enemy owner must not create untracked timers');
assert(/simulationTimeMs/.test(enemies), 'enemy manager/entity simulation time exists');
assert(/JammerEnvironment\.getPosition\(\)/.test(read('src/game/update-coordinator.js')), 'indicator tracks environmental Jammer state');
assert(/JammerEnvironment\.dispose/.test(runtime) && /jammerEnvironment:/.test(runtime), 'RuntimeLifecycle owns Jammer teardown and diagnostics');
assert(/enemies: window\.enemyManager/.test(runtime), 'RuntimeLifecycle exposes enemy diagnostics');
assert(/_tutorialEnemiesDefeated >= 3/.test(enemies), 'tutorial three-enemy path remains represented');
assert(!/requestAnimationFrame\(/.test(enemies + jammer + runtime), 'enemy/Jammer/lifecycle changes create no competing RAF');
assert(/single active enemy owner/.test(docs) && /JammerEnvironment/.test(docs) && /authoritative defeat/.test(docs), 'documentation records new ownership model');


// Controlled fixtures model the contracts enforced above without executing browser runtime files.
class DefeatOwnerFixture {
  constructor() { this.defeatedCount = 0; this.projections = { gameState: 0, sector: 0 }; }
  recordDefeat(enemy) {
    if (!enemy || enemy.recorded) return false;
    enemy.recorded = true;
    this.defeatedCount += 1;
    this.projections.gameState = this.defeatedCount;
    this.projections.sector = this.defeatedCount;
    return true;
  }
  clear(options = {}) {
    if (!options.preserveDefeats) this.defeatedCount = 0;
    this.projections.gameState = this.defeatedCount;
    this.projections.sector = this.defeatedCount;
  }
}

class CollisionFixture {
  static separate(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    let nx = dx / dist;
    let ny = dy / dist;
    if (!Number.isFinite(dist) || dist === 0) { dist = 0.0001; nx = 1; ny = 0; }
    const force = (40 - dist) * 0.8;
    a.x -= nx * force; a.y -= ny * force * 0.4;
    b.x += nx * force; b.y += ny * force * 0.4;
  }
}

class SpriteOwnerFixture {
  constructor() { this.sprite = null; this.spriteReady = false; this.requested = false; this.disposed = false; this.allocations = 0; }
  poll(loaderReady, spriteReady) {
    if (this.disposed || this.spriteReady || !loaderReady) return;
    if (!this.requested) { this.requested = true; this.sprite = {}; this.allocations += 1; }
    if (spriteReady && !this.disposed) this.spriteReady = true;
  }
  dispose() { this.disposed = true; }
}

class SimulationClockFixture {
  constructor() { this.simulationTimeMs = 0; }
  update(deltaMs) { this.simulationTimeMs += deltaMs; }
}

class JammerFixture {
  constructor() { this.generation = 0; this.revealed = false; this.triggered = false; this.disposed = false; this.spriteRequested = false; this.spriteReady = false; this.allocations = 0; }
  reveal() { this.disposed = false; this.revealed = true; this.poll(false); }
  trigger() { this.reveal(); this.triggered = true; }
  poll(ready) { if (this.disposed) return; if (!this.spriteRequested) { this.spriteRequested = true; this.allocations += 1; } if (ready && !this.disposed) this.spriteReady = true; }
  reset() { if (!this.revealed && !this.triggered && !this.spriteRequested && !this.spriteReady) return; this.generation += 1; this.revealed = false; this.triggered = false; this.spriteRequested = false; this.spriteReady = false; }
  dispose() { if (this.disposed && !this.revealed && !this.triggered && !this.spriteRequested) return; this.reset(); this.disposed = true; }
}

const owner = new DefeatOwnerFixture();
const enemy = { recorded: false };
assert(owner.recordDefeat(enemy) && owner.defeatedCount === 1, 'fixture: one actual defeat produces one authoritative count');
assert(owner.projections.gameState === 1 && owner.projections.sector === 1, 'fixture: compatibility projections equal the authoritative count');
assert(!owner.recordDefeat(enemy) && owner.defeatedCount === 1, 'fixture: repeated damage/cleanup does not recount');
const a = { x: 0, y: 0 }, b = { x: 0, y: 0 };
CollisionFixture.separate(a, b);
assert(Number.isFinite(a.x) && Number.isFinite(b.x), 'fixture: exact-overlap collision produces finite results');
const clock = new SimulationClockFixture();
clock.update(100); const frozen = clock.simulationTimeMs; clock.update(0);
assert(clock.simulationTimeMs === frozen, 'fixture: pause/resume zero delta freezes enemy simulation time');
const sprite = new SpriteOwnerFixture();
sprite.poll(true, false); sprite.poll(true, false);
assert(sprite.allocations === 1, 'fixture: one sprite allocation while readiness is pending');
sprite.dispose(); sprite.poll(true, true);
assert(sprite.allocations === 1 && !sprite.spriteReady, 'fixture: stale enemy readiness does nothing after disposal');
owner.defeatedCount = 7; owner.clear({ preserveDefeats: true });
assert(owner.defeatedCount === 7 && owner.projections.gameState === 7 && owner.projections.sector === 7, 'fixture: restart preservation keeps projections synchronized');
owner.clear({ preserveDefeats: false });
assert(owner.defeatedCount === 0 && owner.projections.gameState === 0 && owner.projections.sector === 0, 'fixture: full-stop clearing resets projections');
const jammerFixture = new JammerFixture();
jammerFixture.reveal(); jammerFixture.poll(false); jammerFixture.trigger();
assert(jammerFixture.allocations === 1, 'fixture: Jammer reveal/trigger does not duplicate pending sprite allocation');
const gen = jammerFixture.generation; jammerFixture.reset(); jammerFixture.reset();
assert(jammerFixture.generation === gen + 1 && !jammerFixture.revealed && !jammerFixture.triggered, 'fixture: repeated Jammer reset is idempotent');
jammerFixture.reveal(); jammerFixture.dispose(); jammerFixture.dispose(); jammerFixture.poll(true);
assert(jammerFixture.disposed && !jammerFixture.spriteReady, 'fixture: stale Jammer readiness does nothing after disposal');

if (failed) process.exit(1);
console.log('enemy ownership check passed.');
