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

// The narration runs against real combat receipts, never snapshot polling or
// another update owner. Actual chapter entry verifies the shared event shape.
const combatFilename = 'src/game/mac-street-combat.js';
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', combatFilename), 'utf8'), { window }, { filename: combatFilename });
const combat = window.BARCODE.MacStreetCombat.create();
combat.handleInput({move_x:1});
const initialEvents = [];
for (let frame = 0; frame < 20 && !initialEvents.some(event => event.type === 'zone-enter'); frame++) {
  combat.update(100); initialEvents.push(...combat.drainEvents());
}
const initialState = combat.getSnapshot();
assert(initialEvents.some(event => event.type === 'zone-enter' && event.zoneId === 'service-alley'));
const initialCues = story.gameplayCues(initialEvents, initialState);
assert.deepEqual(copy(initialCues.cues.map(cue => cue.id)), ['city.arrival.service-alley']);
assert.equal(initialCues.cues[0].zoneId, initialState.zone.id);
assert.equal(story.gameplayCues([], initialState).cues.length, 0, 'Snapshot polling cannot earn a bark');
assert.equal(story.gameplayCues(initialEvents, initialState, initialCues.seenIds).cues.length, 0, 'Repeated arrival/retry cannot repeat a consumed line');
assert.deepEqual(copy(combat.getSnapshot()), copy(initialState), 'Narration cannot mutate the combat owner');

const districtIds = ['service-alley','night-market','transit-concourse','relay-canal','rooftop-relay','broadcast-plaza'];
const frozen = value => {
  if (value && typeof value === 'object') { for (const child of Object.values(value)) frozen(child); Object.freeze(value); }
  return value;
};
const stateFor = (zoneId, extra = {}) => ({player:{hp:200}, status:'playing', zone:{id:zoneId,cleared:false},
  city:{clearedZones:[],completedWaves:0,complete:false},props:[],...extra});
assert(Object.isFrozen(story));
assert(Object.isFrozen(story.gameplayCueIds));
assert.equal(story.gameplayCueIds.length, 16);
assert.equal(new Set(story.gameplayCueIds).size, 16);
for (const zoneId of districtIds) {
  const inputState = frozen(stateFor(zoneId));
  const inputEvents = frozen([{type:'zone-enter',zoneId}]);
  const earned = story.gameplayCues(inputEvents, inputState);
  assert.equal(earned.cues.length, 1, zoneId);
  assert.equal(earned.cues[0].id, `city.arrival.${zoneId}`);
  assert.equal(earned.cues[0].zoneId, zoneId);
  assert(earned.cues[0].text.length <= 100, 'Action text stays short');
  for (const value of [earned,earned.cues,earned.cues[0],earned.seenIds]) assert(Object.isFrozen(value));
  assert.throws(() => Object.defineProperty(earned.cues[0], 'text', {value:'Edited'}), TypeError);
  assert.equal(story.gameplayCues([{type:'zone-enter',zoneId:'wrong-district'}], inputState).cues.length, 0);
  assert.equal(story.gameplayCues(inputEvents, {...inputState,player:{hp:0},status:'defeated'}).cues.length, 0);
}
for (const invalid of [null, undefined, {}, 'zone-enter']) assert.equal(story.gameplayCues(invalid, null).cues.length, 0);
assert.deepEqual(copy(story.gameplayCues([], initialState, ['unknown',initialCues.seenIds[0],initialCues.seenIds[0]]).seenIds),
  ['city.arrival.service-alley'], 'Seen IDs remain bounded to authored chapter cues');

for (const zoneId of ['transit-concourse','rooftop-relay']) {
  const event = {type:'zone-cleared',zoneId};
  assert.equal(story.gameplayCues([event], stateFor(zoneId)).cues.length, 0, 'A clear event cannot overrule an uncleared snapshot');
  const state = stateFor(zoneId,{zone:{id:zoneId,cleared:true},city:{clearedZones:[zoneId]}});
  assert.equal(story.gameplayCues([event], state).cues[0].id, `city.clear.${zoneId}`);
}
const market = stateFor('night-market',{zone:{id:'night-market',cleared:true},city:{clearedZones:['night-market']},
  relay:{available:true,restored:false}});
const readyEvent = {type:'relay-ready',id:'market-relay'};
assert.equal(story.gameplayCues([readyEvent], market).cues[0].text,
  'Market relay is clear. Link it and give Kave his signal back.');
assert.equal(story.gameplayCues([readyEvent], {...market,relay:{available:false,restored:false}}).cues.length, 0);
const restoredMarket = {...market,relay:{available:false,restored:true}};
const restoredEvent = {type:'relay-restored',id:'market-relay'};
const restored = story.gameplayCues([restoredEvent], restoredMarket);
assert.deepEqual(copy(restored.cues.map(cue => [cue.speaker,cue.text])), [
  ['9 BIT','Local signal restored. Your track. Their speakers.'],
  ['KAVE','There you are, Modem. Keep that signal moving.']
]);
assert.equal(story.gameplayCues([restoredEvent], market).cues.length, 0, 'A relay claim requires the real restored result');
assert.equal(story.gameplayCues([readyEvent], restoredMarket).cues.length, 0, 'A restored relay cannot ask for another Link');
assert(restored.cues.every(cue => !/outbound|first play/i.test(cue.text)), 'Local relay is not an earned outbound feed claim');

const fixture = {id:'transit-terminal',kind:'terminal',zoneId:'transit-concourse',broken:true};
const fixtureState = stateFor('transit-concourse',{props:[fixture]});
const dischargeEvent = {type:'fixture-discharge',id:fixture.id,kind:fixture.kind,enemyIds:['enemy-1']};
const discharged = story.gameplayCues([dischargeEvent], fixtureState);
assert.equal(discharged.cues[0].id, 'city.fixture-discharge');
assert.equal(discharged.cues[0].zoneId, fixtureState.zone.id);
for (const invalidEvent of [{...dischargeEvent,enemyIds:[]},{...dischargeEvent,id:'wrong-prop'},
  {...dischargeEvent,kind:'crate'},{type:'prop-hit',id:fixture.id,kind:fixture.kind}])
  assert.equal(story.gameplayCues([invalidEvent], fixtureState).cues.length, 0, 'A fixture reaction requires real enemy contact and the broken authored fixture');
assert.equal(story.gameplayCues([dischargeEvent], {...fixtureState,props:[{...fixture,broken:false}]}).cues.length, 0);
assert.equal(story.gameplayCues([dischargeEvent], fixtureState, discharged.seenIds).cues.length, 0);
const car = {id:'market-car',kind:'car',zoneId:'night-market',broken:true};
const carEvent = {type:'prop-break',id:car.id,kind:car.kind};
const mixedMarket = frozen({...restoredMarket,props:[car,{id:'market-test-fixture',kind:'terminal',zoneId:'night-market',broken:true}]});
const mixedEvents = frozen([carEvent,{type:'zone-enter',zoneId:'night-market'},
  {type:'fixture-discharge',id:'market-test-fixture',kind:'terminal',enemyIds:['actual-victim']},restoredEvent]);
const selected = story.gameplayCues(mixedEvents, mixedMarket);
assert.deepEqual(copy(selected.cues.map(cue => cue.id)), copy(restored.cues.map(cue => cue.id)), 'The useful relay pair takes priority over incidental jokes');
assert.deepEqual(copy(selected.seenIds), copy(restored.seenIds), 'Only the two returned cues acquire seen IDs');
const wrecked = story.gameplayCues([carEvent], mixedMarket);
assert.equal(wrecked.cues[0].speaker, 'Dr3wBaby / COMMS');
assert.equal(wrecked.cues[0].zoneId, 'night-market');
assert.equal(story.gameplayCues([{...carEvent,type:'prop-hit'}], mixedMarket).cues.length, 0, 'A car bounce is not a wreck payoff');

const boss = {id:'regent-1',kind:'null_regent',hp:100,phase:2,defeated:false};
const plaza = stateFor('broadcast-plaza',{boss});
for (const phase of [2,3]) {
  const event = {type:'boss-phase',id:boss.id,phase};
  const state = {...plaza,boss:{...boss,phase}};
  const phaseCues = story.gameplayCues([event], state);
  assert.equal(phaseCues.cues[0].id, `city.regent.phase${phase}`);
  assert.equal(story.gameplayCues([event], {...state,boss:{...state.boss,id:'different'}}).cues.length, 0);
  assert.equal(story.gameplayCues([event], {...state,boss:{...state.boss,phase:1}}).cues.length, 0, 'A stale phase cannot overwrite the current fight');
  assert.equal(story.gameplayCues([event], {...state,boss:{...state.boss,hp:0,defeated:true}}).cues.length, 0);
}
const defeatEvent = {type:'enemy-defeated',id:boss.id,kind:'null_regent'};
assert.equal(story.gameplayCues([defeatEvent], plaza).cues.length, 0, 'An event alone cannot grant a city endpoint');
const endpoint = frozen({...plaza,status:'desk-ready',boss:{...boss,hp:0,defeated:true},
  desk:{unlocked:true},zone:{id:'broadcast-plaza',cleared:true},
  city:{complete:true,completedWaves:12,clearedZones:districtIds}});
const endpointCues = story.gameplayCues([defeatEvent], endpoint);
assert.equal(endpointCues.cues[0].id, 'city.regent.defeated');
assert(endpointCues.cues[0].text.includes("let's check the outbound feed"));
for (const incomplete of [{...endpoint,desk:{unlocked:false}},
  {...endpoint,city:{...endpoint.city,completedWaves:11}},
  {...endpoint,city:{...endpoint.city,clearedZones:districtIds.slice(1)}},
  {...endpoint,status:'playing'},{...endpoint,boss:{...endpoint.boss,defeated:false}}])
  assert.equal(story.gameplayCues([defeatEvent], incomplete).cues.length, 0, 'Only the earned six-district endpoint authorizes the payoff');
assert.equal(story.gameplayCues([], endpoint).cues.length, 0, 'Reading/reviewing a completed snapshot is not a new event');
assert.equal(story.gameplayCues([defeatEvent], endpoint, endpointCues.seenIds).cues.length, 0);
assert.deepEqual(copy(story.sceneIds), expectedIds, 'Gameplay narration preserves every approved scene');
assert.deepEqual(readAll(story.createIntro()).choices, ['delivery-question']);
assert.deepEqual(readAll(story.createDesk()).choices, ['desk-question']);
console.log('Mac street story passed: eight stable scenes, exactly two optional Kave choices, all 19 core lines, reveal/advance/reconvergence/skip/reset, and 16 sparse immutable gameplay cues gated by actual events and snapshots without campaign or host side effects.');
