// Makko's public animation boundary: currentFrame is a getter; play selects
// the start frame. Optionally exercise the downloaded official runtime itself
// with MAKKO_ENGINE_PATH. Synthetic frame metadata avoids network/art loading.
const engine = process.env.MAKKO_ENGINE_PATH ? require(process.env.MAKKO_ENGINE_PATH) : null;

function createSprite(animations) {
  if (engine) {
    const character = new engine.Character('contract-check');
    for (const [name, count] of Object.entries(animations)) {
      const sheet = new engine.MakkoSpriteSheet('', '');
      sheet.metadata = {
        frames: Object.fromEntries(Array.from({ length: count }, (_, i) => [String(i), { frame: { x: 0, y: 0, w: 1, h: 1 }, duration: 100 }])),
        meta: { frameTags: [{ name: 'default', from: 0, to: count - 1, direction: 'forward' }] }
      };
      character.addAnimation(name, sheet);
    }
    return character;
  }
  let clip = null, frame = 0, elapsed = 0, playing = false, loop = true, speed = 1, ref = null;
  return {
    getCurrentAnimation: () => clip,
    stop() { playing = false; }, pause() { playing = false; }, resume() { playing = true; },
    play(name, looping = true, startFrame = 0, options = {}) {
      if (!(name in animations)) throw new Error(`Unknown fixture animation: ${name}`);
      if (ref) ref.isInterrupted = true;
      clip = name; frame = Math.max(0, Math.min(startFrame, animations[name] - 1));
      elapsed = 0; playing = true; loop = looping; speed = options.speed ?? 1;
      ref = { get currentFrame() { return frame; }, get totalFrames() { return animations[clip]; }, isInterrupted: false };
      return ref;
    },
    update(ms) {
      if (!playing) return;
      elapsed += ms * speed;
      if (elapsed >= 100) {
        elapsed = 0; frame++;
        if (frame >= animations[clip]) { frame = loop ? 0 : animations[clip] - 1; playing = loop; }
      }
    }
  };
}

const playerClips = { '6_bit_idle_idle': 26, '6_bit_walk_walk': 48, '6_bit_jump_jump': 27, '6_bit_r__h_mode_rhmode': 48 };
const enemyClips = { virus_idle_idle: 51, corrupted_idle_idle: 51, corrupted_walk_walk: 46, firewall_idle_idle: 62, firewall_walk_walk: 33, firewall_attack_default: 59 };
module.exports = { createSprite, playerClips, enemyClips };
