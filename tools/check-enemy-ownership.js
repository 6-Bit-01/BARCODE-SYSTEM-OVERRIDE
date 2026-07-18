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
const render = read('src/game/render-coordinator.js');
const docs = ['docs/technical/SCRIPT_AND_GLOBAL_MAP.md', 'docs/technical/KNOWN_ISSUES.md', 'docs/design/LEVEL_01_VERTICAL_SLICE.md'].filter(exists).map(read).join('\n');

assert(loadedScripts.includes('src/game/enemies.js') && loadedScripts.includes('src/game/jammer-environment.js'), 'index loads canonical enemies and JammerEnvironment');
assert(count(enemies, /window\.Enemy\s*=\s*class Enemy/g) === 1, 'one Enemy definition lives in enemies.js');
assert(count(enemies, /window\.EnemyManager\s*=\s*class EnemyManager/g) === 1, 'one EnemyManager definition lives in enemies.js');
assert(count(enemies, /window\.enemyManager\s*=\s*new window\.EnemyManager/g) === 1, 'one enemyManager construction site lives in enemies.js');
assert(!/JammerEnemy/.test(loadedText + index), 'JammerEnemy is not active or loaded');
assert(!index.includes('jammer-fix-patch.js') && !index.includes('jammer-spawn-logic.js') && !index.includes('collision-fix.js'), 'late enemy patch scripts are not loaded');
assert(!exists('jammer-fix-patch.js') && !exists('src/game/' + 'jammer-spawn-logic.js') && !exists('src/game/' + 'collision-fix.js'), 'obsolete patch files are deleted');
assert(rootDiagnostics.length === 0, `obsolete executable root diagnostics must be archived, still present: ${rootDiagnostics.join(', ')}`);

const forbiddenGate = /requiredForProgress|savedEnemiesDefeated|broadcastJammerDestroyed|getTotalEnemiesDefeated|Eliminate 20 hostile|destroy_jammer|spawnBroadcastJammer|20 ENEMIES|set enemy count to 20|currentEnemyCount\s*>=\s*20/;
assert(!forbiddenGate.test(gameState + tutorial + runtime + debug + rootDiagnosticText), 'legacy competing quota/Jammer gate behavior is not present outside the mission owner');
assert(/requiredEnemyKills = totalQuota\(\)/.test(sector) && /Defeat 20 enemies/.test(objectives), 'Sector1Progression owns the approved 20-enemy mission gate');
assert(!/enemiesDefeated\s*\+\s*.*defeatedCount|defeatedCount\s*\+\s*.*enemiesDefeated/.test(gameState + sector), 'defeat projections must not be added together');
assert(/getCurrentRunDefeats/.test(gameState) && /syncEnemyDefeatProjections/.test(gameState), 'game-state exposes projection sync instead of duplicate totals');
assert(/preserveDefeats/.test(runtime) && !/currentEnemyCount/.test(runtime), 'RuntimeLifecycle uses explicit preserveDefeats policy without quota inference');
assert(/reset\(options = \{\}\)/.test(sector) && /JammerEnvironment\.reset/.test(sector), 'Sector1Progression reset explicitly cleans mission state');
assert(/draw\(ctx\) \{ this\.drawStageSurfaces\(ctx\); this\.drawEncounterGates\(ctx\); this\.drawBoss\(ctx\); \}/.test(sector), 'Sector1Progression draw owns authored geometry and boss-intro presentation');
assert(/window\.sector1Progression && typeof window\.sector1Progression\.draw === 'function'/.test(render), 'render coordinator checks Sector1Progression draw contract before calling');
const drawGameEntitiesBody = (render.match(/function drawGameEntities\(ctx\) \{([\s\S]*?)\n\}/) || [null, ''])[1];
assert(drawGameEntitiesBody.indexOf('JammerEnvironment.draw(ctx)') !== -1 && drawGameEntitiesBody.indexOf('window.enemyManager.draw(ctx)') !== -1 && drawGameEntitiesBody.indexOf('JammerEnvironment.draw(ctx)') < drawGameEntitiesBody.indexOf('window.enemyManager.draw(ctx)'), 'JammerEnvironment draws before enemyManager in drawGameEntities');
assert(!/JammerEnvironment\.reset\(\)/.test(objectives), 'ObjectivesSystem reset must not compete for JammerEnvironment ownership');
assert(/health: 16/.test(jammer) && /applyRhythmDamage/.test(jammer) && !/class\s+JammerEnemy|extends\s+Enemy/.test(jammer), 'JammerEnvironment is the approved destructible stage target, not a normal enemy');

assert(/drawScale:\s*1/.test(jammer) && /drawOffsetY:\s*0/.test(jammer), 'JammerEnvironment uses bottom-centered Level 1 presentation without draw-only Y offset');
assert(/getVisualBounds/.test(jammer) && /getAimBounds/.test(jammer), 'JammerEnvironment exposes one visual/aim bounds source');
assert(/scale:\s*visual\.scale/.test(jammer), 'JammerEnvironment draws Makko sprite with calculated presentation scale');
assert(/presentation: Object\.freeze/.test(jammer), 'Jammer presentation values are diagnostics/status state, not mutable competing owners');
assert(/lungeCooldownSeconds\s*=\s*6 \+ Math\.random\(\) \* 4/.test(enemies), 'Firewall initial lunge cooldown is seconds, not milliseconds');
assert(/lungeCooldownSeconds\s*=\s*1 \+ Math\.random\(\) \* 3/.test(enemies), 'Firewall reset lunge cooldown is seconds, not milliseconds');
assert(/lungeCooldownSeconds\s*=\s*3 \+ Math\.random\(\) \* 2/.test(enemies), 'Firewall post-attack cooldown is seconds, not milliseconds');
assert(/lungeCooldownSeconds\s*=\s*2/.test(enemies), 'Firewall timeout cooldown is seconds, not milliseconds');
assert(/lungeCooldownSeconds\s*=\s*Math\.max\(0, this\.lungeCooldownSeconds - dt\)/.test(enemies), 'Firewall cooldown decremented by dt seconds with clamp');
assert(!/lungeCooldown\s*=\s*(6000|3000|2000|1000)/.test(enemies), 'no millisecond-sized lungeCooldown assignments remain');
assert(!/\b(lungeCooldown|lungePreparationTime|behaviorTimer|glideDuration|fullAttackDuration|attackAnimationDuration|attackAnimationTimer|attackStartTime)\b(?!Seconds|Ms)/.test(enemies), 'ambiguous Firewall timer names are suffixed with Seconds or Ms');
assert(/spriteRequested/.test(jammer) && /spriteRequestGeneration/.test(jammer), 'JammerEnvironment tracks one sprite request per generation');
assert(/!state\.spriteReady && state\.sprite && state\.sprite\.isLoaded/.test(jammer), 'JammerEnvironment starts idle animation only on readiness transition');
assert(/state\.sprite\.play\('broadcast_jammer_idle_idle', true\)/.test(jammer), 'JammerEnvironment starts the approved idle animation when ready');
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

const debugCommands = read('src/game/debug-commands.js');
const inputSource = read('src/core/input.js');
const activeHandleDefinitions = Object.entries(loadedSources).filter(([, source]) => /window\.handleGameAction\s*=\s*function/.test(source));
assert(activeHandleDefinitions.length === 1 && activeHandleDefinitions[0][0] === 'src/game/debug-commands.js', 'exactly one active handleGameAction definition exists');
const dispatchedActions = [...inputSource.matchAll(/handleGameAction\(['"]([^'"]+)['"]\)/g)].map(match => match[1]);
const uniqueActions = [...new Set(dispatchedActions)];
for (const action of uniqueActions) {
  assert(new RegExp(`case ['"]${action}['"]`).test(debugCommands), `input-dispatched action has an explicit route: ${action}`);
}
assert(uniqueActions.includes('jump'), 'live input jump action is audited');
assert(!uniqueActions.includes('dash') && !uniqueActions.includes('hack'), 'removed dash/global hack actions are not dispatched by input');
assert(/case 'jump':[\s\S]*routeJumpAction\(\)/.test(debugCommands), 'Space/input jump routes through routeJumpAction');
assert(/window\.player\.jump\(\)/.test(debugCommands), 'jump route invokes player.jump()');
assert(/r && r\.ok[\s\S]*checkObjective\('jump'\)/.test(inputSource), 'tutorial jump progress is conditional on successful jump result');
assert(!/case 'dash'|routeDashAction|window\.player\.dash\(\)/.test(debugCommands), 'dash action is not recognized or routed');
assert(/case 'skip_tutorial':[\s\S]*routeSkipTutorialAction\(\)/.test(debugCommands), 'skip_tutorial action has an explicit tutorial completion route');
assert(/cancelInitialEnemySpawn\(\)/.test(debugCommands) && /hasSpawnedInitialEnemies = false/.test(debugCommands), 'tutorial skip uses authoritative initial-spawn path without duplicate manual spawn');
assert(!/RuntimeLifecycle\.(pause|resume|restart|stop)/.test(debugCommands), 'handleGameAction does not own pause/resume/restart/stop');


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


class SectorProgressionFixture {
  constructor() { this.enemiesDefeated = 3; this.jammerRevealed = true; this.jammerTriggered = false; this.sectorComplete = false; this.drawCount = 0; }
  snapshot() { return JSON.stringify({ enemiesDefeated: this.enemiesDefeated, jammerRevealed: this.jammerRevealed, jammerTriggered: this.jammerTriggered, sectorComplete: this.sectorComplete }); }
  draw(ctx) { void ctx; this.drawCount += 1; }
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


class FirewallCooldownFixture {
  constructor(cooldownSeconds) { this.lungeCooldownSeconds = cooldownSeconds; }
  update(dtSeconds) {
    if (this.lungeCooldownSeconds > 0) this.lungeCooldownSeconds = Math.max(0, this.lungeCooldownSeconds - dtSeconds);
  }
}

class ActionRouterFixture {
  constructor() { this.player = { grounded: true, jumped: false, dashed: false, jump() { this.jumped = true; this.grounded = false; return true; }, dash() { this.dashed = true; return false; } }; this.tutorialChecked = false; }
  jump() { const result = this.player.jump(); return { ok: result === true }; }
  trackJump(result) { if (result && result.ok) this.tutorialChecked = true; }
}

class JammerFixture {
  constructor() { this.generation = 0; this.revealed = false; this.triggered = false; this.disposed = false; this.spriteRequested = false; this.spriteReady = false; this.allocations = 0; this.playStarts = 0; }
  reveal() { this.disposed = false; this.revealed = true; this.poll(false); }
  trigger() { this.reveal(); this.triggered = true; }
  poll(ready) { if (this.disposed) return; if (!this.spriteRequested) { this.spriteRequested = true; this.allocations += 1; } if (!this.spriteReady && ready && !this.disposed) { this.spriteReady = true; this.playStarts += 1; } }
  update(deltaMs, ready) { if (!this.revealed || this.disposed) return; this.poll(ready); this.lastDeltaMs = deltaMs; }
  reset() { if (!this.revealed && !this.triggered && !this.spriteRequested && !this.spriteReady) return; this.generation += 1; this.revealed = false; this.triggered = false; this.spriteRequested = false; this.spriteReady = false; }
  dispose() { if (this.disposed && !this.revealed && !this.triggered && !this.spriteRequested) return; this.reset(); this.disposed = true; }
}


const sectorFixture = new SectorProgressionFixture();
const sectorBefore = sectorFixture.snapshot();
sectorFixture.draw({});
assert(sectorFixture.snapshot() === sectorBefore && sectorFixture.drawCount === 1, 'fixture: Sector1Progression draw presentation does not mutate progression state');

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
const actionFixture = new ActionRouterFixture();
const jumpResult = actionFixture.jump();
actionFixture.trackJump(jumpResult);
assert(actionFixture.player.jumped && actionFixture.tutorialChecked, 'fixture: successful jump routes to player.jump and tracks tutorial');
const rejectedActionFixture = new ActionRouterFixture();
rejectedActionFixture.player.jump = () => false;
const rejectedJump = rejectedActionFixture.jump();
rejectedActionFixture.trackJump(rejectedJump);
assert(!rejectedActionFixture.tutorialChecked, 'fixture: rejected jump does not track tutorial');
assert(rejectedActionFixture.player.dash() === false && rejectedActionFixture.player.dashed, 'fixture: dash route can be recognized while remaining current no-op design');


const firewallCooldown = new FirewallCooldownFixture(6);
for (let i = 0; i < 6; i += 1) firewallCooldown.update(1);
assert(firewallCooldown.lungeCooldownSeconds === 0, 'fixture: Firewall cooldown reaches zero after intended simulated seconds');
const zeroDeltaFirewall = new FirewallCooldownFixture(3);
zeroDeltaFirewall.update(0);
assert(zeroDeltaFirewall.lungeCooldownSeconds === 3, 'fixture: zero delta does not advance Firewall cooldown');

const jammerFixture = new JammerFixture();
jammerFixture.reveal(); jammerFixture.poll(false); jammerFixture.trigger();
assert(jammerFixture.allocations === 1, 'fixture: Jammer reveal/trigger does not duplicate pending sprite allocation');
jammerFixture.poll(true); jammerFixture.poll(true); jammerFixture.update(16, true); jammerFixture.update(0, true);
assert(jammerFixture.playStarts === 1, 'fixture: repeated Jammer readiness polling/update starts playback once');
const gen = jammerFixture.generation; jammerFixture.reset(); jammerFixture.reset();
assert(jammerFixture.generation === gen + 1 && !jammerFixture.revealed && !jammerFixture.triggered, 'fixture: repeated Jammer reset is idempotent');
jammerFixture.reveal(); jammerFixture.poll(true); jammerFixture.update(0, true);
assert(jammerFixture.playStarts === 2, 'fixture: reset followed by new load allows exactly one new playback start');
jammerFixture.dispose(); jammerFixture.dispose(); jammerFixture.poll(true);
assert(jammerFixture.disposed && !jammerFixture.spriteReady && jammerFixture.playStarts === 2, 'fixture: stale Jammer readiness does nothing after disposal');

if (failed) process.exit(1);
console.log('enemy ownership check passed.');
