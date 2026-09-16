#!/usr/bin/env node
const assert = require('node:assert/strict');
const { createRig } = require('./check-level-01-boss');
const { createSprite, playerClips, enemyClips } = require('./makko-animation-fixture');
const { w } = createRig();
const update = w.BARCODE.SpritePlayback.update;
const near = (a, b) => assert(Math.abs(a - b) < 1e-4, `${a} / ${b}`);

// Exercise production playback with the real, deliberately unequal walk
// durations, including its repeat seam and a long render interval.
{
  const fs = require('node:fs'), path = require('node:path');
  const entries = Object.values(JSON.parse(fs.readFileSync(path.join(__dirname,
    '../assets/sprites-v3/prepared/6_bit_walk_walk.json'))).frames);
  function expected(time) {
    let remaining = time % 4000, frame = 0;
    while (remaining >= entries[frame].duration - 1e-7) {
      remaining -= entries[frame].duration; frame = (frame + 1) % entries.length;
    }
    return { frame, remaining };
  }
  for (const fps of [30, 60, 120, 144]) for (const elapsed of [999, 1001, 1750, 4001]) {
    const sprite = createSprite(playerClips), ref = sprite.play('6_bit_walk_walk', true);
    sprite.currentSprite.metadata.frames = Object.fromEntries(entries.map((entry, i) => [String(i), entry]));
    let remaining = elapsed;
    while (remaining > 1e-7) { const step = Math.min(remaining, 1000 / fps); update(sprite, step); remaining -= step; }
    const result = expected(elapsed);
    assert.equal(ref.currentFrame, result.frame, 'stride phase is independent of rendering frequency');
    near(sprite.currentSprite.timeAccumulator, result.remaining);
    const before = ref.currentFrame; sprite.pause(); update(sprite, 800); assert.equal(ref.currentFrame, before);
    sprite.resume(); update(sprite, 731);
    assert.equal(ref.currentFrame, expected(elapsed + 731).frame, 'irregular delta preserves retimed stride');
  }
}

// Sustained movement exercises Player's real transition owner as well as the
// clock. Turning while held must not replace the reference or reset the stride.
{
  const fs = require('node:fs'), path = require('node:path');
  const metadata = JSON.parse(fs.readFileSync(path.join(__dirname,
    '../assets/sprites-v3/prepared/6_bit_walk_walk.json')));
  const entries = Object.values(metadata.frames);
  for (const fps of [30, 60, 120, 144]) {
    const { w: world } = createRig(), player = world.player;
    player.sprite = createSprite(playerClips); player.spriteReady = true;
    player.state = 'walk'; player.grounded = true; player.landingPoseMs = 0;
    player.cinematicPoseActive = false; player.impactHoldMs = 0;
    player.playAnimation('walk');
    player.sprite.currentSprite.metadata.frames = Object.fromEntries(entries.map((f, i) => [String(i), f]));
    const ref = player.animationRef, body = JSON.stringify(player.getHitbox());
    for (let i = 0; i < 60 * fps; i++) {
      player.facing = i < 30 * fps ? 1 : -1;
      player.updateSpriteAnimation(1000 / fps);
      assert.equal(player.animationRef, ref, 'held walk and turns never restart the clip');
    }
    assert.equal(ref.currentFrame, 0, 'sixty sustained strides wrap to the initial pose');
    near(player.sprite.currentSprite.timeAccumulator, 0);
    assert.equal(JSON.stringify(player.getHitbox()), body, 'visual changes cannot alter the body');
    player.sprite.pause(); player.updateSpriteAnimation(800);
    assert.equal(ref.currentFrame, 0); player.sprite.resume();
    player.updateSpriteAnimation(125);
    assert.equal(player.animationRef, ref, 'resume retains the walk owner');
    assert.equal(ref.currentFrame, 2, 'two evenly paced drawings after resume');
    player.state = 'idle'; player.updateSpriteAnimation(16);
    assert.equal(player.sprite.getCurrentAnimation(), '6_bit_idle_idle');
    player.state = 'jump'; player.grounded = false; player.velocity.y = 300;
    player.updateSpriteAnimation(16);
    assert.equal(player.sprite.getCurrentAnimation(), '6_bit_jump_jump');
    player.state = 'walk'; player.grounded = true; player.updateSpriteAnimation(16);
    assert.equal(player.sprite.getCurrentAnimation(), '6_bit_walk_walk', 'moving landing resumes walk');
    assert.equal(player.animationRef.currentFrame, 0, 'new walk starts on contact');
  }
}

// At equal elapsed time the pose must agree, including remainder and speed.
for (const fps of [30, 60, 120, 144]) for (const speed of [0.75, 1, 1.25, 2]) {
  const sprite = createSprite(playerClips);
  const ref = sprite.play('6_bit_walk_walk', true, 0, { speed });
  for (let i = 0; i < fps; i++) update(sprite, 1000 / fps);
  assert.equal(ref.currentFrame, Math.floor(10 * speed));
  near(sprite.currentSprite.timeAccumulator, 1000 * speed % 100);
  assert(!ref.isInterrupted, 'advancing does not replace the animation reference');
}
{
  const sprite = createSprite({ loop: 3, once: 4 });
  let cycles = 0, completed = 0;
  const ref = sprite.play('loop', true);
  ref.onCycle?.(() => cycles++);
  for (const dt of [17, 83, 251, 49, 127, 23, 450]) update(sprite, dt);
  assert.equal(ref.currentFrame, 1, 'irregular render delta crosses every boundary');
  near(sprite.currentSprite.timeAccumulator, 0);
  if (ref.onCycle) assert.equal(cycles, 3, 'native loop callbacks retained');
  sprite.pause(); update(sprite, 1000); assert.equal(ref.currentFrame, 1);
  sprite.resume(); update(sprite, 50); near(sprite.currentSprite.timeAccumulator, 50);
  const shot = sprite.play('once', false);
  shot.onComplete?.(() => completed++);
  update(sprite, 1000); assert.equal(shot.currentFrame, 3);
  update(sprite, 1000); if (shot.onComplete) assert.equal(completed, 1);
  sprite.play('loop', true, 2); update(sprite, 50);
  near(sprite.currentSprite.timeAccumulator, 50, 'fresh play discards old clip remainder');
}
for (const type of ['virus', 'corrupted', 'firewall']) {
  const enemy = new w.Enemy(500, 750, type);
  enemy.sprite = createSprite(enemyClips); enemy.spriteReady = true;
  enemy.playAnimation('idle');
  const ref = enemy.animationRef;
  for (let i = 0; i < 12; i++) { enemy.playAnimation('idle'); enemy.updateSpritePlayback(25); }
  assert.equal(enemy.animationRef, ref, `${type}: repeated idle requests preserve playback`);
  assert(ref.currentFrame > 0);
}
{
  const player = w.player;
  player.sprite = createSprite(playerClips); player.spriteReady = true;
  player.state = 'jump'; player.grounded = false;
  const apex = [];
  for (const vy of [-159, -79, 1, 81]) {
    player.velocity.y = vy; player.updateSpriteAnimation(1); apex.push(player.animationRef.currentFrame);
  }
  assert.deepEqual(apex, [9, 10, 11, 12], 'jump no longer skips apex drawings');
  player.grounded = true; player.state = 'idle'; player.landingPoseMs = 9;
  player.updateSpriteAnimation(9); assert.equal(player.animationRef.currentFrame, 26);
  player.updateSpriteAnimation(1); assert(!player.landingPoseActive, '90 ms landing still expires');
}
{
  const env = w.BARCODE.JammerEnvironment;
  env.reveal({ position: { x: 3400, y: 750 } });
  const status = env.getStatus(), bounds = env.getAimBounds();
  assert.equal(status.presentation.drawOffsetY, 72);
  near(bounds.y, 750 + 72 - 214 * 0.7);
  assert.equal(status.health, 16); assert.equal(env.applyRhythmDamage({ timing: 'bad', sequence: 1 }).ok, false);
  assert.equal(env.applyRhythmDamage({ timing: 'perfect', sequence: 2 }).damage, 1);
}
console.log('Animation cleanup: consistent 30/60/120/144 Hz playback, variable deltas/speeds, pause/one-shots, stable idle refs, full apex/recovery and raised Jammer verified.');
