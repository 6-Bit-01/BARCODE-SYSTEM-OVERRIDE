#!/usr/bin/env node
const fs = require('fs');
function assert(cond, msg) { if (!cond) { console.error(`❌ ${msg}`); process.exit(1); } }
function read(p) { return fs.readFileSync(p, 'utf8'); }
const action = read('src/core/action-input.js');
const input = read('src/core/input.js');
const combat = read('src/game/player-combat.js');
const rhythm = read('src/game/rhythm.js');
const enemy = read('src/game/enemies.js');
const player = read('src/game/player.js');
const tutorial = read('src/game/tutorial.js');
const debug = read('src/game/debug-commands.js');
const pkg = read('package.json');

assert(action.includes('BARCODE.ActionInput') && action.includes("'move_left'") && action.includes("'primary'"), 'ActionInput exposes semantic action layer');
assert(action.includes("move_left: ['arrowleft', 'a']") && action.includes("move_right: ['arrowright', 'd']"), 'Keyboard movement bindings are present');
assert(action.includes("jump: [' ', 'arrowup', 'w']") && action.includes("primary: ['arrowdown']") && action.includes("interact: ['h']") && action.includes("pause: ['p']"), 'Keyboard action bindings are present');
assert(action.includes('move_left: [{ axis: 0, dir: -1 }, { button: 14 }]') && action.includes('jump: [{ button: 0 }]') && action.includes('primary: [{ button: 2 }]') && action.includes('interact: [{ button: 3 }]') && action.includes('pause: [{ button: 9 }]'), 'Standard gamepad bindings are present');
assert(action.includes('nowHeld && !wasHeld') && action.includes('!nowHeld && wasHeld'), 'Pressed/released edge states prevent held retriggering');
assert(action.includes('remap(action, bindings)') && action.includes('diagnostics()') && action.includes('dispose()') && action.includes('reset()'), 'ActionInput supports remap, diagnostics, reset, and dispose');
for (const token of ['paused', 'stopped', 'gameOver', 'cutscene', 'dialogue', 'gameplayActive']) assert(action.includes(token), `ActionInput suppression covers ${token}`);
assert(input.includes('new window.BARCODE.ActionInput()') && input.includes('actions.primary.pressed') && input.includes('playerCombat.resolvePrimary'), 'InputManager routes gameplay through ActionInput and PlayerCombat');
assert(input.includes('actions.move_left.held') && input.includes('actions.move_right.held'), 'Movement is continuous left/right semantic state');
assert(input.includes('actions.rhythm_visual') && !input.includes('player.velocity.x = 0'), 'R visualization is optional and does not freeze movement in input');
assert(input.includes('routeInteract()') && !input.includes('hackingSystem.start()'), 'Global H routes through interact and does not globally start hacking');
assert(!/e\.key === 'Shift'|handleGameAction\('dash'\)|routeDashAction|case 'dash'/.test(input + debug), 'No active Shift dash route remains');

assert(combat.includes('BARCODE.PlayerCombat') && combat.includes('resolvePrimary') && combat.includes('findTargets') && combat.includes('takeDamage(result.resolvedDamage)'), 'PlayerCombat is authoritative attack resolver');
assert(combat.includes('perfect: 1.5') && combat.includes('excellent: 1.25') && combat.includes('BONUS[judgment.timing] || 1'), 'Timing bonuses are bounded and misses/unavailable remain base damage');
assert(combat.includes('transport.judgeInput(rule.id, audioTimeSec)') && !/146|quarterBpm\s*=|beatsPerBar\s*=|song duration/i.test(combat), 'Combat uses MusicTransport judgment without hardcoded tempo/grid assumptions');
assert(combat.includes('hitIds = new Set()') && combat.includes('hitIds.has(target)'), 'Single primary press cannot damage the same target twice');
assert(combat.includes("player.playAnimation('rhythm')"), 'Primary attack uses existing rhythm/attack animation reference');
assert(combat.includes('cooldownMs') && combat.includes('canAttack'), 'Single attack cooldown gates repeated primary transactions');

assert(!/checkPlayerAttacks\(window\.player/.test(input), 'InputManager no longer applies enemy damage independently');
assert(!/enemyManager\.checkPlayerAttacks/.test(rhythm), 'RhythmSystem no longer applies enemy damage independently');
assert(!/damageBoss\(|takeDamage\(/.test(rhythm), 'RhythmSystem no longer applies boss or target damage independently');
assert(rhythm.includes('RhythmSystem now returns judgment/feedback only') && rhythm.includes('this.lastJudgment'), 'RhythmSystem returns feedback/judgment data only');
assert(enemy.includes('BARCODE.PlayerCombat is the only production damage owner') && !/rhythmSystem\.combo[\s\S]{0,160}takeDamage/.test(enemy), 'EnemyManager does not recalculate damage from global combo/rhythm state');
assert(!/fastFallMultiplier|fastFallInvincible|performPowerfulStomp|stompDamage|isStomping/.test(player + enemy), 'No fast-fall invincibility or stomp damage remains active');
assert(!/isKey\('arrowdown'\)[\s\S]{0,240}gravity|performPowerfulStomp/.test(player), 'Down Arrow no longer triggers fast-fall/stomp');
assert(!/this\.state === 'rhythm'[\s\S]{0,120}No movement allowed|No jumping allowed during rhythm/.test(player), 'Rhythm visualization does not gate movement or jump');
assert(!/5\+ combo|rhythm_combo|hack_start|dash|stomp|fast-fall|Jump on corrupted|hacking puzzle/.test(tutorial), 'Tutorial completion does not require perfect timing, combo, dash, stomp, or nonexistent terminal');
assert(tutorial.includes('Musical timing can improve it, but a normal attack always works') && tutorial.includes('No terminal is required'), 'Tutorial teaches primary attack and optional timing/terminal interaction');
assert(!/requestAnimationFrame\(|setInterval\(|setTimeout\([^)]*=>[\s\S]{0,120}setTimeout/.test(action + combat), 'No new RAF, recursive timer, or competing lifecycle owner is created by action/combat modules');
assert(pkg.includes('check:action-combat') && pkg.includes('tools/check-action-combat.js'), 'package.json wires focused validator into npm scripts');
console.log('PASS action/combat semantic contract static checks');
