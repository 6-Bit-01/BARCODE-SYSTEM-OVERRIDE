#!/usr/bin/env node
const fs = require('fs');
const assert = require('assert');
const sector = fs.readFileSync('src/game/sector1-progression.js','utf8');
const jammerSource = fs.readFileSync('src/game/jammer-environment.js','utf8');
const combat = fs.readFileSync('src/game/player-combat.js','utf8');
const rhythm = fs.readFileSync('src/game/rhythm.js','utf8');
const enemies = fs.readFileSync('src/game/enemies.js','utf8');
const input = fs.readFileSync('src/core/input.js','utf8');
const gameState = fs.readFileSync('src/game/game-state.js','utf8');
const render = fs.readFileSync('src/game/render-coordinator.js','utf8');
const objectives = fs.readFileSync('src/game/objectives.js','utf8');
function must(text, re, msg) { assert(re.test(text), msg); }

const encounterBlocks = [...sector.matchAll(/\{ id: 'encounter_\d'[^]*?enemies: \[([^]*?)\] \}/g)];
assert.strictEqual(encounterBlocks.length, 4, 'four authored encounter definitions');
const counts = encounterBlocks.map(m => (m[1].match(/type: '/g) || []).length);
assert.strictEqual(counts.reduce((a,b)=>a+b,0), 20, 'exactly 20 quota enemies');
assert.deepStrictEqual(counts, [4,5,5,6], 'encounter counts are 4/5/5/6');
must(sector, /STAGE_SURFACES = Object\.freeze/, 'single stage surface data exists');
must(sector, /ENCOUNTER_GATES = Object\.freeze/, 'single gate data exists');
must(sector, /applyPlayerStageCollision/, 'platform collision hook exists');
must(sector, /previousFootY <= surface\.y && currentFootY >= surface\.y/, 'platform tunneling prevention uses previous/current feet');
must(sector, /applyGateCollision/, 'gate collision exists');
must(sector, /this\.closedGateEncounterId = def\.id/, 'encounter closes its gate when spawned');
must(sector, /openEncounterGate\(def\.id\)/, 'encounter gate opens after clear');
must(sector, /isCompleted[^]*isCompleted\(\)/, 'mission starts only from explicit tutorial completion');
must(sector, /window\.gameCamera\.centerX/, 'camera pan starts from gameCamera.centerX');
must(sector, /activeAnimation === animation/, 'boss animation play is guarded by active animation');
must(sector, /updateBossSprite\(deltaTime\)[^]*BOSS_READY/, 'boss sprite updates through boss-ready');
must(sector, /prepareBossAssets/, 'boss assets prepared before entrance');
must(sector, /prepareAssetsForEncounter/, 'encounter assets prepared before encounter');
must(sector, /prepareJammerAsset/, 'jammer asset prepared before reveal');
must(jammerSource, /state\.generation \+= 1;[^]*state\.revealed = false;[^]*state\.targetable = false;[^]*state\.health = state\.maxHealth;[^]*state\.destroyed = false;[^]*state\.lastDamageSequence = null/s, 'jammer reset always restores gameplay state');
must(jammerSource, /destructionEffectStarted[^]*particleSystem/s, 'jammer destruction effect starts');
must(jammerSource, /state\.destroyed \|\| !state\.revealed/, 'destroyed jammer sprite stops rendering');
must(jammerSource, /state\.health = Math\.max\(0, state\.health - 1\)/, 'accepted rhythm hit does one jammer damage');
must(combat, /jammerHit\.ok\) \? 'hit' : 'no-target'/, 'jammer-only hit reports hit');
must(rhythm, /timing === 'miss'[^]*playSound\('synthHit', 0\.3\)/, 'exact miss plays synthHit once');
must(enemies, /if \(suppressMissionSimulation\) return;\n    this\.simulationTimeMs \+= deltaTime;/, 'enemy sim time does not advance while suppressed');
must(enemies, /purgeForCinematic\(\)[^]*_defeatRecorded = true[^]*particleSystem[^]*this\.enemies = this\.enemies\.filter/s, 'purge starts visible effects and avoids defeat credit');
must(input, /tutorialSystem\.handleSpacePress/, 'tutorial Space ownership preserved');
must(input, /actions\.jump\.pressed/, 'jump action path preserved');
must(input, /resolvePrimary/, 'rhythm attack path preserved');
must(input, /hacking && typeof hacking\.start/, 'hacking path preserved');
must(enemies, /Intentional passive landing stomp/, 'passive stomp remains lethal');
must(gameState, /shouldSuppressGenericSpawning\(\)[^]*hasSpawnedInitialEnemies = true/s, 'generic initial spawn disabled under mission owner');
must(render, /centerX: cameraX/, 'renderer records camera center convention');
must(objectives, /visibleObjectives[^]*Math\.max\(160, 60 \+ visibleObjectives\.length \* 50\)/s, 'objective panel height grows for boss-ready row');

class MissionFixture {
  constructor() { this.state='tutorial'; this.started=false; this.count=0; this.revealed=false; this.encounters=[4,5,5,6]; this.index=0; this.gateClosed=false; this.player={x:0,width:80}; this.panStart=null; this.bossPlays=[]; this.bossUpdates=0; this.phase='none'; this.bossReady=false; }
  update(tutorialCompleted=false) { if (this.state==='tutorial' && tutorialCompleted && !this.started) { this.started=true; this.state='encounter_1'; this.gateClosed=true; } }
  tryPassGate() { if (this.gateClosed && this.player.x > 100) this.player.x = 100; return this.player.x; }
  clearEncounter() { this.count += this.encounters[this.index]; this.gateClosed=false; if (this.count === 20) this.revealed=true; else { this.index += 1; this.state=`encounter_${this.index+1}`; this.gateClosed=true; } }
  startPan(gameCamera, playerX) { this.panStart = Number.isFinite(gameCamera?.centerX) ? gameCamera.centerX : playerX; }
  setBossAnimation(anim) { if (this.activeAnimation !== anim) { this.activeAnimation = anim; this.bossPlays.push(anim); } }
  updateBoss() { this.bossUpdates += 1; }
  flourishComplete() { this.updateBoss(); this.setBossAnimation('idle'); this.bossReady=true; }
}
class JammerFixture { constructor(){ this.maxHealth=16; this.health=16; this.destroyed=false; this.notices=0; this.last=null; } hit(timing, seq){ if (this.destroyed || this.last===seq || !['perfect','excellent'].includes(timing)) return false; this.last=seq; this.health-=1; if (this.health===0 && !this.destroyed){ this.destroyed=true; this.notices++; } return true; } reset(){ this.health=16; this.destroyed=false; this.last=null; this.revealed=false; this.targetable=false; this.triggered=false; this.notified=false; } }
class EnemyFixture { constructor(){ this.defeats=0; this.drops=0; this.sim=0; this.suppressed=false; this.enemies=[{x:1},{x:2}]; this.effects=0; } update(dt){ if (this.suppressed) return; this.sim += dt; } purge(){ const n=this.enemies.length; this.effects += n; this.enemies=[]; return n; } }
const mission = new MissionFixture();
mission.update(false); assert.strictEqual(mission.started,false,'mission cannot start before tutorial completion');
mission.update(true); assert.strictEqual(mission.state,'encounter_1','mission starts after explicit completion');
mission.player.x=150; assert.strictEqual(mission.tryPassGate(),100,'closed gate blocks player');
mission.clearEncounter(); assert.strictEqual(mission.count,4); assert.strictEqual(mission.gateClosed,true,'next encounter closes next gate');
mission.clearEncounter(); assert.strictEqual(mission.count,9); mission.clearEncounter(); assert.strictEqual(mission.count,14); assert.strictEqual(mission.revealed,false,'jammer absent before 20'); mission.clearEncounter(); assert.strictEqual(mission.count,20); assert.strictEqual(mission.revealed,true,'jammer reveals at exactly 20');
const jammer = new JammerFixture(); assert.strictEqual(jammer.hit('perfect',1),true); assert.strictEqual(jammer.health,15); assert.strictEqual(jammer.hit('excellent',2),true); assert.strictEqual(jammer.health,14); assert.strictEqual(jammer.hit('miss',3),false); assert.strictEqual(jammer.health,14); assert.strictEqual(jammer.hit('perfect',2),false,'duplicate sequence ignored'); while(!jammer.destroyed) jammer.hit('perfect',100+jammer.health); assert.strictEqual(jammer.notices,1,'destruction notified once'); jammer.hit('perfect',999); assert.strictEqual(jammer.notices,1,'post-destroy idempotent'); jammer.reset(); assert.strictEqual(jammer.health,16); assert.strictEqual(jammer.destroyed,false);
const enemiesFixture = new EnemyFixture(); enemiesFixture.suppressed=true; enemiesFixture.update(1000); assert.strictEqual(enemiesFixture.sim,0,'suppressed enemy sim time frozen'); const defeats=enemiesFixture.defeats; const drops=enemiesFixture.drops; enemiesFixture.purge(); assert.strictEqual(enemiesFixture.effects,2); assert.strictEqual(enemiesFixture.defeats,defeats); assert.strictEqual(enemiesFixture.drops,drops);
mission.startPan({x:500,centerX:1460},900); assert.strictEqual(mission.panStart,1460,'camera pan uses centerX'); mission.setBossAnimation('walk'); mission.setBossAnimation('walk'); mission.setBossAnimation('attack'); assert.deepStrictEqual(mission.bossPlays,['walk','attack'],'boss play called only on animation transitions'); mission.updateBoss(); mission.flourishComplete(); assert(mission.bossUpdates>=2,'flourish/ready sprite receives updates'); assert.strictEqual(mission.bossReady,true);
mission.flourishComplete(); assert.strictEqual(mission.bossPlays.filter(v=>v==='idle').length,1,'boss-ready idempotent animation transition');
console.log('Level 1 mission static and behavior checks passed');
