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
function reachScene(reader, id) {
  for (let i = 0; i < 120; i++) {
    const s = reader.snapshot();
    if (s.sceneId === id) return s;
    assert.equal(s.done, false);
    reader.advance();
  }
  throw new Error(`Could not reach scene ${id}`);
}
function readAll(reader, answers = {}) {
  const lines = [], scenes = [], choices = [];
  let lastLine = null;
  for (let i = 0; i < 200; i++) {
    const s = reader.snapshot();
    if (!scenes.includes(s.sceneId)) scenes.push(s.sceneId);
    if (s.choice) {
      choices.push(s.choice.id);
      if (answers[s.choice.id] === 'continue') assert.equal(reader.advance().action, 'rejoin');
      else assert.equal(reader.choose(answers[s.choice.id] ?? 0).accepted, true);
    } else {
      const key = `${s.sceneId}/${s.lineIndex}/${s.fullText}`;
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

const opening = story.createIntro();
const unchanged = copy(opening.snapshot());
for (const index of [-1, 0, 1, 2, 0.5, undefined]) assert.equal(opening.choose(index).accepted, false);
assert.deepEqual(copy(opening.snapshot()), unchanged, 'No answer before its actual question');
const first = readAll(opening);
const second = readAll(story.createIntro({ instantText: true }), { 'delivery-question': 1 });
const bypassIntro = readAll(story.createIntro({ instantText: true }), { 'delivery-question': 'continue' });
for (const trace of [first, second, bypassIntro]) {
  assert.deepEqual(trace.scenes, expectedIds);
  assert.deepEqual(trace.choices, ['delivery-question'], 'Only the main Kave opening choice remains');
  assert.equal(trace.lines.length, 19);
  assert(trace.lines.includes('DJ FLOPPYDISC / COMMS: It matches. Nothing missing.'));
  assert(trace.lines.includes("DJ FLOPPYDISC / COMMS: Then keep it separate. Record the interruption. Don't call it proof."));
  assert(trace.lines.includes("KAVE / COMMS: I'll keep the queue moving and the local line open."));
  assert.equal(trace.lines.at(-1), 'MAC MODEM: Open the channel.');
  assert.equal(trace.snapshot.sceneId, 'get-it-heard');
  assert.equal(trace.snapshot.asset, 'assets/mac-street-review/mac-hero-v2.png');
  assert.equal(trace.snapshot.objective, "Break the street hold across Broadcast Slum and reopen the studio's outbound feed.");
  assert.equal(trace.snapshot.entryRequirement, null);
  assert(trace.lines.includes('KAVE: Artists waiting for a play. Listeners waiting for a voice.'));
  assert(trace.lines.includes("KAVE: The outbound feed. Local monitoring works; distribution doesn't."));
}
assert.deepEqual(copy(first.snapshot.selections), { 'delivery-question': 'who-is-waiting' });
assert.deepEqual(copy(second.snapshot.selections), { 'delivery-question': 'what-got-blocked' });
assert.deepEqual(copy(bypassIntro.snapshot.selections), {}, 'Continue does not invent an opening answer');
assert(first.lines.indexOf('KAVE: Artists waiting for a play. Listeners waiting for a voice.') < first.lines.indexOf("KAVE: The outbound feed. Local monitoring works; distribution doesn't."));
assert(second.lines.indexOf("KAVE: The outbound feed. Local monitoring works; distribution doesn't.") < second.lines.indexOf('KAVE: Artists waiting for a play. Listeners waiting for a voice.'));
const openingChoice = story.createIntro({ instantText: true });
reachChoice(openingChoice, 'delivery-question');
assert.equal(openingChoice.snapshot().choice.optional, true);
const noDeadline = copy(openingChoice.snapshot());
openingChoice.update(1e8);
assert.deepEqual(copy(openingChoice.snapshot()), noDeadline);
assert.equal(openingChoice.choose(1).accepted, true);
const openingAnswered = copy(openingChoice.snapshot());
assert.equal(openingChoice.choose(0).accepted, false, 'Opening answer consumes the press without a second answer');
assert.deepEqual(copy(openingChoice.snapshot()), openingAnswered);
assert(first.lines.includes('KAVE: Artists waiting for a play. Listeners waiting for a voice.'));
assert(first.lines.includes("KAVE: The outbound feed. Local monitoring works; distribution doesn't."));
assert(first.lines.includes('MAC MODEM / COMMS: Then we open it back up, piece by piece.'));
assert(first.lines.indexOf('KAVE: Artists waiting for a play. Listeners waiting for a voice.') < first.lines.indexOf('MAC MODEM / COMMS: Then we open it back up, piece by piece.'));
assert(first.lines.includes("9 BIT: You. Outside the panel. Still think 'delivered' means 'heard'?"));
const studio = reachScene(story.createIntro({ instantText: true }), 'kave-dead-air');
assert.equal(studio.asset, 'assets/mac-street-review/scene03-kave-dead-air-v5.png');
assert(fs.existsSync(path.join(__dirname, '..', studio.asset)), 'Studio candidate must be available');
assert.equal(studio.artLocation, 'enclosed-broadcast-studio');
assert.equal(studio.artTime, 'present');

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
reachScene(frameReader, 'margin-note');
assert.deepEqual(copy(frameReader.snapshot().annotations), [{ kind: 'comic-margin', by: '9 BIT', text: 'AUTHORISED PUNCHING CONSULTANT' }]);
const editedSnapshot = frameReader.snapshot();
editedSnapshot.annotations[0].text = 'Altered';
editedSnapshot.selections['delivery-question'] = 'Altered';
assert.equal(frameReader.snapshot().choice, null);
assert.equal(frameReader.snapshot().annotations[0].text, 'AUTHORISED PUNCHING CONSULTANT');
assert.notEqual(frameReader.snapshot().selections['delivery-question'], 'Altered');
assert.equal(frameReader.choose(1).accepted, false);
frameReader.advance();
frameReader.advance();
frameReader.advance();
assert.equal(frameReader.advance().action, 'scene');
assert.equal(frameReader.snapshot().sceneId, 'record-straight', 'Crew responds naturally without a player interruption prompt');

const skipped = story.createIntro();
reachScene(skipped, 'kave-dead-air');
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
assert.equal(bypassDesk.snapshot().entryRequirement, 'city-chapter-endpoint');
assert.equal(bypassDesk.snapshot().artLocation, 'enclosed-broadcast-studio');
assert.equal(bypassDesk.snapshot().artTime, 'after-city-chapter-endpoint');
assert.equal(bypassDesk.snapshot().dialogueContext, 'in-person-studio');
const waiting = copy(bypassDesk.snapshot());
bypassDesk.update(1e8);
assert.deepEqual(copy(bypassDesk.snapshot()), waiting, 'Optional desk conversation has no deadline');
assert.equal(bypassDesk.advance().action, 'rejoin', 'Optional desk conversation has a direct Continue');
assert.equal(bypassDesk.snapshot().fullText, "Local monitoring stayed live. Now the outbound feed's open too.");
assert.deepEqual(copy(bypassDesk.snapshot().selections), {}, 'Continue bypasses without inventing an answer');
const choiceReader = story.createDesk();
reachChoice(choiceReader, 'desk-question');
assert.deepEqual(copy(choiceReader.snapshot().choice.options.map(option => option.label)), ['Ask about the people', 'Ask about the order']);
for (const index of [-1, 2, 0.5, undefined]) assert.equal(choiceReader.choose(index).accepted, false);
const mutated = choiceReader.snapshot();
mutated.choice.options[0].label = 'Altered';
assert.equal(choiceReader.snapshot().choice.options[0].label, 'Ask about the people');
assert.equal(choiceReader.choose(1).accepted, true);
assert(choiceReader.snapshot().fullText.includes('not who ordered it'));
const answered = copy(choiceReader.snapshot());
assert.equal(choiceReader.choose(0).accepted, false, 'One press cannot choose twice or advance');
assert.deepEqual(copy(choiceReader.snapshot()), answered);
for (const index of [0, 1]) {
  const trace = readAll(story.createDesk(), { 'desk-question': index });
  assert.deepEqual(trace.choices, ['desk-question'], 'There is exactly one optional conversation');
  assert.equal(trace.lines.at(-1), "MAC MODEM: The street hold's broken. Keep both records safe.");
  assert.equal(trace.snapshot.objective, "The city's street hold is broken. The studio's outbound feed is open.");
  if (index === 1) assert(trace.lines.some(text => text.includes('not who ordered it')));
}
const skippedDesk = story.createDesk();
skippedDesk.skip();
assert.equal(skippedDesk.snapshot().fullText, "The street hold's broken. Keep both records safe.");
assert.deepEqual(copy(skippedDesk.snapshot().selections), {});
skippedDesk.reset();
assert.equal(skippedDesk.snapshot().done, false);
assert.equal(skippedDesk.snapshot().skipped, false);
const instant = story.createIntro({ instantText: true, artPaths: { delivered: 'assets/private-test.png' } });
assert.equal(instant.snapshot().revealed, true);
assert.equal(instant.snapshot().asset, 'assets/private-test.png');
assert.equal(instant.advance().action, 'line');
console.log('Mac street story passed: eight stable scenes, one Kave opening choice plus one optional earned studio choice, all 19 core lines, reveal/advance, reconvergence, skip/reset and no campaign or host side effects.');
