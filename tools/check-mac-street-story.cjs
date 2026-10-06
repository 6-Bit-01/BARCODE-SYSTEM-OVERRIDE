// Exercise the actual pure story module. Rendering and gameplay belong to their own owners.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const filename = 'src/game/mac-street-story.js';
const source = fs.readFileSync(path.join(__dirname, '..', filename), 'utf8');
const copy = value => JSON.parse(JSON.stringify(value));
const window = { BARCODE: {} };
for (const key of ['audioSystem', 'inputManager', 'localStorage', 'document', 'addEventListener', 'requestAnimationFrame', 'setTimeout'])
  Object.defineProperty(window, key, { get() { throw new Error(`Story touched host: ${key}`); } });
for (const key of ['Campaign', 'CacheChapter', 'RuntimeLifecycle', 'MusicTransport'])
  Object.defineProperty(window.BARCODE, key, { get() { throw new Error(`Story touched campaign owner: ${key}`); } });
vm.runInNewContext(source, { window }, { filename });
const story = window.BARCODE.MacStreetStory;
const expectedIds = ['delivered', 'unverified', 'kave-dead-air', 'held', 'margin-note', 'record-straight', 'street-access', 'get-it-heard'];
assert.deepEqual(copy(story.sceneIds), expectedIds);

function reachChoice(reader, id) {
  for (let i = 0; i < 120; i++) {
    const s = reader.snapshot();
    if (s.choice?.id === id) return s;
    assert.equal(s.done, false, `Could not reach ${id}`);
    if (s.choice) reader.choose(0); else reader.advance();
  }
  throw new Error(`Choice traversal did not settle: ${id}`);
}
function readAll(reader, answers = {}) {
  const lines = [], scenes = [], choices = [];
  let lastLine = null;
  for (let i = 0; i < 200; i++) {
    const s = reader.snapshot();
    if (!scenes.includes(s.sceneId)) scenes.push(s.sceneId);
    if (s.choice) {
      choices.push(s.choice.id);
      assert.equal(reader.choose(answers[s.choice.id] ?? 0).accepted, true);
    } else {
      const key = `${s.sceneId}/${s.phase}/${s.lineIndex}/${s.fullText}`;
      if (s.revealed && key !== lastLine) { lines.push(`${s.speaker}: ${s.fullText}`); lastLine = key; }
      if (s.done) return { lines, scenes, choices, snapshot: s };
      assert.equal(reader.advance().consumed, true);
    }
  }
  throw new Error('Story never completed');
}

const reader = story.createIntro();
assert.equal(reader.snapshot().text, '');
reader.update(125);
assert.equal(reader.snapshot().text, 'Origi');
for (const invalid of [NaN, Infinity, -10, 0]) reader.update(invalid);
assert.equal(reader.snapshot().text, 'Origi');
assert.equal(reader.advance().action, 'reveal');
assert.equal(reader.snapshot().lineIndex, 0, 'Reveal must not advance the line');
assert.equal(reader.snapshot().fullText, 'Original delivered. Names, room noise, all of it.');
assert.equal(reader.advance().action, 'line');
assert.equal(reader.snapshot().speaker, 'DJ FLOPPYDISC / COMMS');
assert.equal(reader.snapshot().text, '');

const choiceReader = story.createIntro();
const deliveryChoice = reachChoice(choiceReader, 'delivery-question');
assert.deepEqual(copy(deliveryChoice.choice.options.map(option => option.label)), ["Who's waiting?", 'What got blocked?']);
const waiting = copy(choiceReader.snapshot());
choiceReader.update(1e8);
assert.deepEqual(copy(choiceReader.snapshot()), waiting, 'Choices never have a deadline');
assert.equal(choiceReader.advance().consumed, true);
assert.equal(choiceReader.snapshot().phase, 'choice', 'Continue does not choose for the player');
for (const index of [-1, 2, 0.5, undefined]) assert.equal(choiceReader.choose(index).accepted, false);
assert.equal(choiceReader.choose(1).accepted, true);
assert.equal(choiceReader.snapshot().fullText, "The outbound feed. Local monitoring works; distribution doesn't.");
const answered = copy(choiceReader.snapshot());
assert.equal(choiceReader.choose(0).accepted, false, 'One press cannot choose twice');
assert.deepEqual(copy(choiceReader.snapshot()), answered);
choiceReader.advance();
choiceReader.advance();
assert.equal(choiceReader.snapshot().fullText, 'Then we open it back up, piece by piece.');
assert.equal(choiceReader.snapshot().speaker, 'MAC MODEM / COMMS');

const first = readAll(story.createIntro(), { 'delivery-question': 0, 'frame-reply': 0 });
const second = readAll(story.createIntro(), { 'delivery-question': 1, 'frame-reply': 1 });
for (const trace of [first, second]) {
  assert.deepEqual(trace.scenes, expectedIds);
  assert.deepEqual(trace.choices, ['delivery-question', 'frame-reply']);
  assert(trace.lines.includes('DJ FLOPPYDISC / COMMS: It matches. Nothing missing.'));
  assert(trace.lines.includes("DJ FLOPPYDISC / COMMS: Then keep it separate. Record the interruption. Don't call it proof."));
  assert(trace.lines.includes("KAVE / COMMS: I'll keep the queue moving and the local line open."));
  assert.equal(trace.lines.at(-1), 'MAC MODEM: Open the channel.');
  assert.equal(trace.snapshot.sceneId, 'get-it-heard');
  assert.equal(trace.snapshot.asset, 'assets/mac-street-review/mac-hero-v2.png');
  assert.equal(trace.snapshot.objective, "Open the approach and restore the review desk's outbound feed.");
}
assert(first.lines.includes('KAVE: Artists waiting for a play. Listeners waiting for a voice.'));
assert(first.lines.includes("9 BIT: Then listen to what isn't there."));
assert(second.lines.includes('9 BIT: Fair. They know the streets. You know the frame.'));

const heldReader = story.createIntro({ instantText: true });
for (let i = 0; i < 30 && heldReader.snapshot().sceneId !== 'held'; i++) {
  if (heldReader.snapshot().choice) heldReader.choose(0); else heldReader.advance();
}
assert.equal(heldReader.snapshot().sceneId, 'held');
assert.equal(heldReader.snapshot().asset, 'assets/cache-ending/ending-03-held.webp');
assert.equal(heldReader.snapshot().artLabel, 'EARLIER / STUDIO COMPARISON');
assert.equal(heldReader.snapshot().artLocation, 'studio');
assert.equal(heldReader.snapshot().artTime, 'earlier-comparison');
assert.equal(heldReader.snapshot().dialogueContext, 'live-comms');
assert.equal(heldReader.snapshot().speaker, 'DJ FLOPPYDISC / COMMS');

const frameReader = story.createIntro();
reachChoice(frameReader, 'frame-reply');
assert.deepEqual(copy(frameReader.snapshot().annotations), [{ kind: 'comic-margin', by: '9 BIT', text: 'AUTHORISED PUNCHING CONSULTANT' }]);
const editedSnapshot = frameReader.snapshot();
editedSnapshot.choice.options[0].label = 'Altered';
editedSnapshot.annotations[0].text = 'Altered';
editedSnapshot.selections['delivery-question'] = 'Altered';
assert.equal(frameReader.snapshot().choice.options[0].label, "I'm listening.");
assert.equal(frameReader.snapshot().annotations[0].text, 'AUTHORISED PUNCHING CONSULTANT');
assert.notEqual(frameReader.snapshot().selections['delivery-question'], 'Altered');
assert.equal(frameReader.choose(1).accepted, true);
frameReader.advance();
assert.equal(frameReader.advance().action, 'scene');
assert.equal(frameReader.snapshot().sceneId, 'record-straight', 'Both frame answers return to the evidence distinction');

const skipped = story.createIntro();
reachChoice(skipped, 'delivery-question');
assert.equal(skipped.skip().consumed, true);
assert.equal(skipped.snapshot().done, true);
assert.equal(skipped.snapshot().skipped, true);
assert.deepEqual(copy(skipped.snapshot().selections), {}, 'Skip must not invent answers');
assert.equal(skipped.snapshot().fullText, 'Open the channel.');
assert.equal(skipped.advance().action, 'blocked');
assert.equal(skipped.choose(0).accepted, false);
skipped.reset();
assert.equal(skipped.snapshot().sceneId, 'delivered');
assert.equal(skipped.snapshot().done, false);
assert.equal(skipped.snapshot().skipped, false);
assert.equal(story.createIntro().snapshot().sceneId, 'delivered', 'Readers own independent memory');

const bypassDesk = story.createDesk();
reachChoice(bypassDesk, 'desk-question');
assert.equal(bypassDesk.snapshot().choice.optional, true);
assert.equal(bypassDesk.advance().action, 'rejoin', 'Optional desk conversation has a direct Continue');
assert.equal(bypassDesk.snapshot().fullText, "Local monitoring stayed live. Now the outbound feed's open too.");
for (const index of [0, 1]) {
  const trace = readAll(story.createDesk(), { 'desk-question': index });
  assert.equal(trace.lines.at(-1), "MAC MODEM: One line open. There's more street ahead.");
  assert.equal(trace.snapshot.objective, "The review desk's outbound feed is reopened. Continue into Broadcast Slum.");
  if (index === 1) assert(trace.lines.some(text => text.includes('not who ordered it')));
}
const skippedDesk = story.createDesk();
skippedDesk.skip();
assert.equal(skippedDesk.snapshot().fullText, "One line open. There's more street ahead.");
assert.deepEqual(copy(skippedDesk.snapshot().selections), {});
const instant = story.createIntro({ instantText: true, artPaths: { delivered: 'assets/private-test.png' } });
assert.equal(instant.snapshot().revealed, true);
assert.equal(instant.snapshot().asset, 'assets/private-test.png');
assert.equal(instant.advance().action, 'line');
console.log('Mac street story passed: eight stable scenes, reveal/advance, exact choices, reconvergence, optional desk, skip/reset and no campaign or host side effects.');
