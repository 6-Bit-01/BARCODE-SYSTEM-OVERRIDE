#!/usr/bin/env node
// Production spawn/entrance, physical gate and checkpoint owners. These are
// spatial regression fixtures, not simulated human combat or device evidence.
const assert = require('node:assert/strict');
const { createRig } = require('./check-level-01-boss');
const { campaignRig } = require('./check-boss-music-campaign.cjs');
const copy = value => JSON.parse(JSON.stringify(value));

function encounterRig(number, x = 'wall', zoom = .735) {
  const r = createRig(), { w, p } = r;
  p.startMission(); w.rhythmSystem.hideRhythmMode();
  const def = w.Sector1Progression.ENCOUNTERS[number - 1];
  const gate = w.Sector1Progression.ENCOUNTER_GATES[number - 1];
  p.state = def.id; p.spawnEncounter(def); p.pendingSpawns = [];
  w.renderer.zoomLevel = zoom;
  w.player.position.x = x === 'wall' ? gate.x - w.player.width / 2 : x;
  return { ...r, def, gate };
}

let placements = 0;
for (let number = 1; number <= 4; number++) for (const zoom of [1, .735, .625]) {
  const def = createRig().w.Sector1Progression.ENCOUNTERS[number - 1];
  for (const position of [def.triggerX, 'wall']) {
    const { w, p, def, gate } = encounterRig(number, position, zoom);
    const score = w.gameState.score, quota = p.requiredEnemyKills;
    const enemies = def.packets.flat().map((spec, index) => p.spawnMissionEnemy(spec, def.id, index));
    assert.equal(enemies.length, [4, 5, 5, 6][number - 1]);
    for (const enemy of enemies) {
      placements++;
      assert(enemy._entranceTarget.x < gate.x, `${def.id}/${enemy._sector1Index}: destination is on the playable side`);
      if (enemy._homeSurfaceId) {
        const home = p.getStageSurfaces().find(s => s.id === enemy._homeSurfaceId);
        assert(home && enemy.position.x >= home.x && enemy.position.x <= home.x + home.w);
        assert(enemy.getHitbox().x + enemy.getHitbox().width < gate.x, 'required home guard is before its wall');
        // A player on this existing home can use the unchanged base attack.
        assert(Math.abs(enemy.position.y - (home.y - 72)) <= 120, 'home guard remains within normal vertical attack reach');
      } else {
        const half = p.getSpawnBodyHalfWidth(enemy.type);
        assert(enemy._entranceTarget.x + half <= gate.x - 8 + 1e-7);
        assert(Math.abs(enemy._entranceTarget.x - w.player.position.x) >= 350 + half - 1e-7,
          'a gate-safe target also retains player arrival clearance');
      }
    }
    assert.equal(p.requiredEnemyKills, quota); assert.equal(quota, 20);
    assert.equal(p.missionDefeats, 0); assert.equal(w.gameState.score, score);
    assert.deepEqual(copy(w.Sector1Progression.ENCOUNTERS.map(e => e.packets.flat().length)), [4, 5, 5, 6]);
  }
}

// The actual protected entrance advances at every supported display rate and
// hostile difficulty clock. The player can keep pressing against the wall.
for (const fps of [30, 60, 120, 144]) for (const scale of [.86, 1, 1.15]) {
  for (const number of [1, 2]) {
    const { w, p, def, gate, calls } = encounterRig(number);
    const enemies = def.packets.flat().map((spec, index) => p.spawnMissionEnemy(spec, def.id, index));
    let elapsed = 0;
    while (enemies.some(e => e._authoredEntranceActive) && elapsed < 20000) {
      const dt = 1000 / fps * scale; elapsed += dt;
      for (const e of enemies) e.updateAuthoredEntrance(dt);
    }
    assert(elapsed < 20000, `${number}/${fps}/${scale}: every required entrance finishes`);
    assert(enemies.every(e => e.entranceComplete && e.getHitbox().x + e.getHitbox().width < gate.x));
    assert.equal(p.missionDefeats, 0, 'arrival cannot credit a required defeat');
    assert.deepEqual(calls.errors, []);
  }
}

// Contact/crowd motion and allegiance cannot strand a required actor outside
// the gate. Exercise the manager hooks, including its early-spacing return.
{
  const { w, p, def, gate, calls } = encounterRig(1);
  const e = p.spawnMissionEnemy(def.packets[0][0], def.id, 0);
  e.updateAuthoredEntrance(20000); e.spawnProtectionDuration = 0; e.spawnTimeMs = -10000;
  e.position.x = gate.x + 90; e.position.y = w.Player.GROUND_Y;
  const before = copy({ health: e.health, footY: e.position.y, phase: e.combatPattern, quota: p.missionDefeats });
  w.enemyManager.hasAdequateSpacing = () => false;
  w.enemyManager.update(16, w.player);
  assert(e.getHitbox().x + e.getHitbox().width <= gate.x - 8 + 1e-7);
  assert.equal(e.position.y, before.footY); assert.equal(e.health, before.health);
  assert.equal(p.missionDefeats, before.quota);
  assert(w.enemyManager.hijackEnemy(e), 'the real hijack owner accepts the arrived ordinary target');
  e.position.x = gate.x + 30; p.constrainEncounterEnemies();
  assert(e.getHitbox().x + e.getHitbox().width <= gate.x - 8 + 1e-7);
  assert(w.enemyManager.isHijacked(e), 'wall resolution does not cancel allegiance');
  p.openEncounterGate(def.id); e.position.x = gate.x + 30; p.constrainEncounterEnemies();
  assert.equal(e.position.x, gate.x + 30, 'an opened gate removes the combat constraint');
  assert.equal(e.health, before.health); assert.deepEqual(calls.errors, []);
}

// Tutorial targets are required for training, while reinforcements use the
// original open-world policy after every mission gate has cleared.
{
  const { w, p } = createRig(), gate = w.Sector1Progression.ENCOUNTER_GATES[0];
  p.reset(); w.player.position.x = gate.x - w.player.width / 2;
  const e = p.spawnTutorialEnemy();
  assert(e._entranceTarget.x + 40 <= gate.x - 8);
  e.updateAuthoredEntrance(20000); e.position.x = gate.x + 100; p.constrainEncounterEnemies();
  assert(e.getHitbox().x + e.getHitbox().width <= gate.x - 8);
  assert.equal(p.missionDefeats, 0);
  const reinforcement = p.spawnMissionEnemy({ type: 'virus', x: 2000, y: 784 }, 'jammer_reinforcement', 0,
    { jammerReinforcement: true, origin: { x: 2600, y: 784, side: 'right' } });
  reinforcement.updateAuthoredEntrance(20000); reinforcement.position.x = 2200; p.constrainEncounterEnemies();
  assert.equal(reinforcement.position.x, 2200); assert.equal(reinforcement._sector1MissionEnemy, false);
}

for (const recovery of ['checkpoints', 'full-run']) for (const difficulty of [0, 1, 2]) {
  for (let number = 1; number <= 4; number++) {
    const { w, p, c, storage } = campaignRig();
    w.BARCODE.LevelDifficulty.beginLevel(); w.BARCODE.LevelDifficulty.select(difficulty);
    w.BARCODE.LevelDifficulty.setRecovery(recovery); w.BARCODE.LevelDifficulty.confirm();
    p.startMission(); const gate = w.Sector1Progression.ENCOUNTER_GATES[number - 1];
    assert(c.checkpoint(gate.encounterId)); const saved = copy(c.readResume());
    saved.levelState.playerX = gate.x + 100; // Valid legacy coordinate, beyond its still-locked wall.
    const next = campaignRig(storage); assert(next.c.restore(saved));
    assert(next.w.player.position.x + next.w.player.width / 2 <= gate.x);
    assert.equal(next.p.state, gate.encounterId); assert.equal(next.p.pendingSpawns.length, 0);
    assert.equal(next.w.BARCODE.LevelDifficulty.recoveryMode, recovery);
    assert.equal(next.p.requiredEnemyKills, 20);
  }
}
console.log(`Level 1 reachability passed: ${placements} authored placements, all gates/zooms, 30/60/120/144 Hz hostile clocks, protected arrival, contact/crowd/hijack, tutorial, opened gates and 24 objective resumes.`);
