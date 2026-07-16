const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
function fail(message) { console.error(`music profile check failed: ${message}`); process.exit(1); }
function assert(condition, message) { if (!condition) fail(message); }
function count(source, pattern) { return (source.match(pattern) || []).length; }
function blockFrom(source, start, end) {
  const i = source.indexOf(start);
  assert(i !== -1, `missing block start ${start}`);
  const j = end ? source.indexOf(end, i + start.length) : -1;
  return j === -1 ? source.slice(i) : source.slice(i, j);
}

const profile = read('src/engine/level-01-music-profile.js');
const profiles = read('src/engine/music-profiles.js');
const transport = read('src/engine/music-transport.js');
const rhythm = read('src/game/rhythm.js');
const audio = read('src/engine/audio.js');

// Level 1 exact profile contract.
assert(profile.includes("const LEVEL_01_PROFILE_ID = 'level-01.main'"), 'Level 1 profile ID changed');
for (const sourceId of ['foundation', 'bass-layer', 'fx-layer']) assert(profile.includes(`sourceId: '${sourceId}'`), `missing source ID ${sourceId}`);
for (const assetId of ['audio.level-01.foundation', 'audio.level-01.bass-layer', 'audio.level-01.fx-layer']) assert(profile.includes(`assetId: '${assetId}'`), `missing asset ID ${assetId}`);
for (const urlPart of ['2133657a-6dbe-47c0-b4c3-4cb9849b3c58.mp3', '5089debd-8927-4409-88f1-785be8508686.mp3', '1e86d080-84ac-45df-b591-5e433ae5ec8f.mp3']) assert(profile.includes(urlPart), `asset URL changed: ${urlPart}`);
assert(profile.includes('gain: 0.8') && count(profile, /gain: 0/g) >= 2, 'Level 1 gains changed');
assert(count(profile, /nativeLoop: true/g) === 3, 'Level 1 native-loop flags changed');
assert(profile.includes("fallbackRole: 'required-or-degraded'") && count(profile, /fallbackRole: 'synthetic-layer-fallback'/g) === 2, 'fallback roles changed');
assert(profile.includes('quarterBpm: 146') && profile.includes('beatsPerBar: 4') && profile.includes('beatUnit: 4'), 'Level 1 fixed-grid tempo/meter changed');
assert(profile.includes('legacyManualRestartSec: 211'), '211s legacy manual restart missing');
assert(profile.includes("id: 'level-01.attack'") && profile.includes('perfect: 60') && profile.includes('excellent: 100'), 'Level 1 judgment rule/windows changed');
assert(profile.includes('establishmentBeatCount: 32') && profile.includes('phraseCycleBeats: 16'), 'Level 1 legacy rhythm presentation changed');
assert(profile.includes('deadCompensationMsNotApplied: -20'), '-20ms compensation must remain unapplied');

// Registry/static validation structure remains meaningful without executing browser code.
for (const token of ['deepFreeze', 'cloneProfile', 'register(profile)', 'validateProfile', 'duplicate sourceId', 'duplicate judgment rule id', 'quarterBpm invalid', 'perfect window']) assert(profiles.includes(token), `music profile registry missing ${token}`);
assert(profiles.includes('Object.freeze'), 'registered profiles must be frozen structurally');

// MusicTransport structure and authority.
const startBlock = blockFrom(transport, 'function start(options)', 'function stop()');
const pauseBlock = blockFrom(transport, 'function pause(audioTimeSec)', 'function resume(audioTimeSec)');
const resumeBlock = blockFrom(transport, 'function resume(audioTimeSec)', 'function coordinatedRestart');
const sampleBlock = blockFrom(transport, 'function sample(audioTimeSec)', 'function poll(audioTimeSec)');
const pollBlock = blockFrom(transport, 'function poll(audioTimeSec)', 'function judgeInput');
assert(startBlock.includes('generation++') && startBlock.includes('sourceAnchorAudioSec = anchor') && startBlock.includes('sourceOffsetTrackSec = offset'), 'transport start must anchor source and advance generation');
assert(pauseBlock.includes('frozenTrackTimeSec') && pauseBlock.includes('sourceOffsetTrackSec = frozenTrackTimeSec') && pauseBlock.includes('generation++'), 'transport pause must freeze track position and advance generation');
assert(resumeBlock.includes('sourceAnchorAudioSec = audioTimeSec;') && !resumeBlock.includes('audioTimeSec - sourceOffsetTrackSec'), 'transport resume anchor formula regressed');
assert(resumeBlock.includes('generation++') && resumeBlock.includes('lastBoundaryBeat = grid ? grid.beatIndex : null'), 'transport resume must advance generation and avoid catch-up beats');
assert(sampleBlock.includes('(audioTimeSec - sourceAnchorAudioSec) + sourceOffsetTrackSec'), 'transport sample formula changed');
assert(transport.includes('return (60 / grid.quarterBpm) * (4 / grid.beatUnit);'), 'fixed-grid duration formula changed');
assert(pollBlock.includes('Math.min(beat - lastBoundaryBeat, 16)') && pollBlock.includes('generation: snapshot.generation'), 'bounded generation-tagged beat polling changed');
assert(transport.includes('function stop()') && transport.includes('coordinatedRestart(anchor)'), 'transport stop/coordinated restart structure missing');
assert(!/setTimeout\s*\(|setInterval\s*\(|requestAnimationFrame\s*\(|Date\.now\s*\(/.test(transport), 'transport must not own timers, RAF, or wall-clock authority');

// Active audio/rhythm integration is inspected statically only.
assert(rhythm.includes('MusicTransport.judgeInput') || rhythm.includes('transport.judgeInput'), 'rhythm input must use MusicTransport.judgeInput');
assert(rhythm.includes('resetForFreshRuntimeRestart') && rhythm.includes('restartForLoop()'), 'rhythm must have explicit fresh-restart hook');
assert(audio.includes('scheduleRuntimeTimeout') && audio.includes('runtimeAudioGeneration') && audio.includes('clearRuntimeTimeouts'), 'AudioSystem must track run-owned delayed callbacks');
assert(audio.includes('scheduleNextBeatSync()') && /scheduleNextBeatSync\(\)\s*{\s*return;\s*}/.test(audio), 'legacy recursive beat-sync scheduler must remain disabled');
assert(audio.includes('legacyManualRestartSec') && audio.includes('coordinatedRestart(restartTime)'), '211s coordinated restart behavior must remain profile-controlled');

console.log('music profile/transport static checks passed');
