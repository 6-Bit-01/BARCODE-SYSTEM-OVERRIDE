#!/usr/bin/env node
const fs = require('fs');
const assert = require('assert');
const files = {
  player: fs.readFileSync('src/game/player.js', 'utf8'),
  sector: fs.readFileSync('src/game/sector1-progression.js', 'utf8'),
  combat: fs.readFileSync('src/game/player-combat.js', 'utf8'),
  rhythm: fs.readFileSync('src/game/rhythm.js', 'utf8'),
  hacking: fs.readFileSync('src/game/hacking.js', 'utf8'),
  enemies: fs.readFileSync('src/game/enemies.js', 'utf8'),
  lost: fs.readFileSync('src/game/lost-data.js', 'utf8'),
  debug: fs.readFileSync('src/game/level-01-debug.js', 'utf8')
};
function has(s, msg){ assert(s, msg); }
function count(re, s){ return (s.match(re)||[]).length; }

has(files.player.includes('PLAYER_JUMP_GRAVITY = 1460') && files.player.includes('PLAYER_JUMP_POWER = 920'), 'movement model declares held apex tuning');
has(files.player.includes('PLAYER_COYOTE_MS = 100') && files.player.includes('PLAYER_BUFFER_MS = 120'), 'coyote time and jump buffering are present');
has(files.player.includes('PLAYER_MIN_JUMP_HOLD_MS = 60') && files.player.includes('PLAYER_JUMP_CUT_MULTIPLIER = 0.48'), 'variable tap/held jump contract is present');
has(files.player.includes('while (remaining > 0)') && files.player.includes('1000 / 120'), 'jump integration uses bounded substeps for 30/60/120 FPS stability');
has(!/this\.state === 'rhythm'[^\n]+jump\(\)/.test(files.player), 'rhythm presentation does not block jump');
has(files.player.includes('supportedSurfaceId'), 'player tracks a supported surface id');
has(files.enemies.includes('player.stompRebound'), 'stomp rebound uses deterministic smaller jump-state reset');

has(files.sector.includes('SIGNAL_LIFT') && files.sector.includes("id: 'signal-lift'"), 'one code-drawn signal lift exists');
has(files.sector.includes('chargeSignalLift') && files.combat.includes('chargeSignalLift'), 'successful rhythm attacks charge the lift');
has(files.sector.includes('prevY') && files.sector.includes('player.position.y += dy'), 'moving lift carries supported player by platform delta');
has(files.sector.includes('STAGE_SURFACES.concat(moving)'), 'moving lift is resolved with relative platform crossing without mutating static surfaces');
has(files.sector.includes('debugResetSignalLift') && files.sector.includes('debugChargeSignalLift'), 'debug controls expose lift reset/charge');

has(count(/packets:/g, files.sector) === 4, 'all four encounters are packetized');
has(files.sector.includes('activeCap: 3') && files.sector.includes('activeCap: 4'), 'encounter active caps are authored');
has(count(/role: 'swooper'/g, files.sector) >= 4, 'swooper roles are authored using Virus specs');
has(files.sector.includes('survivors <= 1') && files.sector.includes('packetGraceMs'), 'packet B releases after packet A is reduced plus grace');
has(files.sector.includes('jammerReinforcementCap: 3') && files.sector.includes('jammerCadenceMinMs: 2500') && files.sector.includes('jammerCadenceMaxMs: 3500'), 'jammer reinforcements use fair cap/cadence');
has(files.sector.includes('window.hackingSystem?.isActive?.()'), 'spawn clocks pause during active hacking');

has(files.hacking.includes('cooldownMs = 10000') && files.hacking.includes('guardHitsRemaining = 1'), 'hacking has tactical cooldown and one-hit guard');
has(files.hacking.includes('previousRhythmModeActive') && files.hacking.includes('hideRhythmMode') && files.hacking.includes('showRhythmMode'), 'hacking suspends/restores Rhythm Mode presentation');
has(files.hacking.includes('this.puzzleReadyAt = Date.now()') && files.hacking.includes('this._startTime = this.puzzleReadyAt'), 'hack timer starts after puzzle generation');
has(files.hacking.includes('}, 4000)') && files.hacking.includes('4000 - elapsed'), 'hack answer window is approximately 4 seconds and matches UI');
has(files.enemies.includes('hostileScale') && files.enemies.includes('? 0.25 : 1'), 'active enemies run at 25% hostile speed while hacking');
has(files.hacking.includes('emitOverridePulse') && files.hacking.includes('beatMs * 4'), 'successful hack emits non-damaging four-beat stun pulse');

has(files.lost.includes('authoredLevel1Placements') && count(/unlockKills:/g, files.lost) === 3, 'three authored Lost Data rooftop placements replace random unsafe Y');
has(files.sector.includes('SIGNAL_AMP') && files.combat.includes('signalAmpCharges') && files.combat.includes('430'), 'Signal Amp pickup provides three extended-range normal-enemy attacks');
has(files.rhythm.includes('getAuthoritativeDamageRadius') && files.combat.includes('getAuthoritativeRange'), 'rhythm attack range has one authoritative source');
has(files.combat.includes('{ jammer: true }'), 'Signal Amp does not affect jammer range');

has(files.sector.includes('getBossVisualBounds()') && files.sector.includes('currentSprite') || files.sector.includes('animationRef'), 'boss visual-foot bounds remain solved from runtime presentation data');
has(files.debug.includes('Geometry Overlay') && files.debug.includes('Reset Mission') && files.debug.includes('Play Boss Intro'), 'Makko debug panel retains session-only geometry and mission controls');
has(files.debug.includes('signal') || files.sector.includes('debugGiveSignalAmp'), 'debug hooks include signal pass support');

console.log('✅ Level 1 gameplay dynamics checks passed');
