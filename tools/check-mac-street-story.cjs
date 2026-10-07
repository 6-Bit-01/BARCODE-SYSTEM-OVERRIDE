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
  let lastLine = null, advancePresses = 0, choicePresses = 0;
  for (let i = 0; i < 200; i++) {
    const s = reader.snapshot();
    if (!scenes.includes(s.sceneId)) scenes.push(s.sceneId);
    if (s.choice) {
      choices.push(s.choice.id);
      if (answers[s.choice.id] === 'continue') {
        advancePresses++; assert.equal(reader.advance().action, 'rejoin');
      } else {
        choicePresses++; assert.equal(reader.choose(answers[s.choice.id] ?? 0).accepted, true);
      }
    } else {
      const key = `${s.sceneId}/${s.lineIndex}/${s.fullText}`;
      if (s.revealed && key !== lastLine) { lines.push(`${s.speaker}: ${s.fullText}`); lastLine = key; }
      if (s.done) return { lines, scenes, choices, advancePresses, choicePresses, snapshot: s };
      advancePresses++;
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
assert.equal(reader.advance().action, 'scene');
assert.equal(reader.snapshot().speaker, 'MAC MODEM / COMMS');
assert.equal(reader.snapshot().text, '');

const opening = story.createIntro();
const unchanged = copy(opening.snapshot());
for (const index of [-1, 0, 1, 2, 0.5, undefined]) assert.equal(opening.choose(index).accepted, false);
assert.deepEqual(copy(opening.snapshot()), unchanged, 'No answer before its actual question');
const first = readAll(opening);
const second = readAll(story.createIntro({ instantText: true }), { 'fourth-wall-question': 1 });
const bypassIntro = readAll(story.createIntro({ instantText: true }), { 'fourth-wall-question': 'continue' });
for (const trace of [first, second, bypassIntro]) {
  assert.deepEqual(trace.scenes, expectedIds);
  assert.deepEqual(trace.choices, ['fourth-wall-question'], 'Only the player-facing 9 Bit fourth-wall choice remains');
  assert.equal(trace.lines.length, trace === bypassIntro ? 8 : 9);
  assert(trace.lines.includes("KAVE: Artists are waiting. Local monitoring works; the outbound feed doesn't."));
  assert(trace.lines.includes("DJ FLOPPYDISC / COMMS: The original is whole. The distribution hold is here, on the line out."));
  assert(trace.lines.includes("DJ FLOPPYDISC / COMMS: That margin note isn't on the tape. Keep it separate; it isn't proof."));
  assert(trace.lines.includes("MAC MODEM / COMMS: Street enforcement has the hold. I'll find a way through."));
  assert.equal(trace.lines.at(-1), 'MAC MODEM: Open the channel.');
  assert.equal(trace.snapshot.sceneId, 'get-it-heard');
  assert.equal(trace.snapshot.asset, 'assets/mac-street-review/mac-hero-v2.png');
  assert.equal(trace.snapshot.objective, "Break the street hold across Broadcast Slum and reopen the studio's outbound feed.");
  assert.equal(trace.snapshot.entryRequirement, null);
}
assert.deepEqual(copy(first.snapshot.selections), { 'fourth-wall-question': 'get-it-heard' });
assert.deepEqual(copy(second.snapshot.selections), { 'fourth-wall-question': 'keep-receipts' });
assert.deepEqual(copy(bypassIntro.snapshot.selections), {}, 'Continue does not invent an opening answer');
assert.equal(bypassIntro.advancePresses, 9, 'Eight complete scene cues plus one optional Continue, without reveal presses');
assert.equal(bypassIntro.choicePresses, 0);
for (const index of [0, 1]) {
  const trace = readAll(story.createIntro({ instantText: true }), { 'fourth-wall-question': index });
  assert.equal(trace.advancePresses, 9, 'Answer adds one short response without adding a rejoin speech');
  assert.equal(trace.choicePresses, 1);
  assert.equal(trace.advancePresses + trace.choicePresses, 10, 'Answered route has ten total deliberate inputs');
}
for (const id of expectedIds) {
  const scene = reachScene(story.createIntro({ instantText: true }), id);
  assert.equal(scene.lineCount, 1, `One cue per approved scene: ${id}`);
  assert(scene.fullText.length <= 90, 'Scene cues remain brief');
  assert.equal(scene.choice, null, 'No ordinary crew conversation question precedes its cue');
}
const openingChoice = story.createIntro({ instantText: true });
reachChoice(openingChoice, 'fourth-wall-question');
assert.equal(openingChoice.snapshot().choice.optional, true);
assert.equal(openingChoice.snapshot().sceneId, 'margin-note');
assert.equal(openingChoice.snapshot().speaker, '9 BIT');
assert.equal(openingChoice.snapshot().dialogueContext, 'fourth-wall-player-address');
assert.deepEqual(copy(openingChoice.snapshot().choice.options.map(option => option.label)), ['Get it heard', 'Keep the receipts']);
for (const index of [-1, 2, 0.5, undefined]) assert.equal(openingChoice.choose(index).accepted, false);
const mutableChoice = openingChoice.snapshot();
mutableChoice.choice.options[0].label = 'Altered';
assert.equal(openingChoice.snapshot().choice.options[0].label, 'Get it heard');
const noDeadline = copy(openingChoice.snapshot());
openingChoice.update(1e8);
assert.deepEqual(copy(openingChoice.snapshot()), noDeadline);
assert.equal(openingChoice.choose(1).accepted, true);
assert.equal(openingChoice.snapshot().lineCount, 1, 'A selected answer is one short response');
assert(openingChoice.snapshot().fullText.includes('controller, not a verdict'));
const openingAnswered = copy(openingChoice.snapshot());
assert.equal(openingChoice.choose(0).accepted, false, 'Opening answer consumes the press without a second answer');
assert.deepEqual(copy(openingChoice.snapshot()), openingAnswered);
assert(first.lines.includes("9 BIT: Hey, you outside the panel. 'Delivered' doesn't mean 'heard'."));
assert(first.lines.includes("9 BIT: That's the job. Finish the panels; then you get the buttons."));
assert(first.lines.filter(text => text.startsWith('9 BIT:')).every(text => /outside the panel|buttons/.test(text)),
  'Every interactive 9 Bit cue addresses the player or the game presentation');
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
editedSnapshot.selections['fourth-wall-question'] = 'Altered';
assert.equal(frameReader.snapshot().choice, null);
assert.equal(frameReader.snapshot().annotations[0].text, 'AUTHORISED PUNCHING CONSULTANT');
assert.notEqual(frameReader.snapshot().selections['fourth-wall-question'], 'Altered');
assert.equal(frameReader.choose(1).accepted, false);
frameReader.advance();
frameReader.advance();
assert.equal(frameReader.snapshot().choice.id, 'fourth-wall-question');
assert.equal(frameReader.advance().action, 'rejoin');
assert.equal(frameReader.snapshot().sceneId, 'record-straight', 'Continue immediately resumes the next scene without another speech');

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

const bypassDesk = story.createDesk({ instantText: true });
assert.equal(bypassDesk.snapshot().entryRequirement, 'city-chapter-endpoint');
assert.equal(bypassDesk.snapshot().artLocation, 'enclosed-broadcast-studio');
assert.equal(bypassDesk.snapshot().artTime, 'after-city-chapter-endpoint');
assert.equal(bypassDesk.snapshot().dialogueContext, 'in-person-studio');
assert.equal(bypassDesk.snapshot().choice, null, 'Ordinary Kave payoff has no dialogue menu');
assert.equal(bypassDesk.snapshot().lineCount, 1);
assert.equal(bypassDesk.snapshot().fullText, "First play's through. The outbound feed is open; keep both records safe.");
for (const index of [-1, 0, 1, 2, 0.5, undefined]) assert.equal(bypassDesk.choose(index).accepted, false);
assert.equal(bypassDesk.advance().action, 'complete');
const deskTrace = readAll(story.createDesk({ instantText: true }));
assert.deepEqual(deskTrace.choices, [], 'No interaction outside the fourth-wall break');
assert.equal(deskTrace.lines.length, 1);
assert.equal(deskTrace.advancePresses, 1);
assert.equal(deskTrace.snapshot.objective, "The city's street hold is broken. The studio's outbound feed is open.");
assert.deepEqual(copy(deskTrace.snapshot.selections), {});
const skippedDesk = story.createDesk();
skippedDesk.skip();
assert.equal(skippedDesk.snapshot().fullText, "First play's through. The outbound feed is open; keep both records safe.");
assert.deepEqual(copy(skippedDesk.snapshot().selections), {});
skippedDesk.reset();
assert.equal(skippedDesk.snapshot().done, false);
assert.equal(skippedDesk.snapshot().skipped, false);
const instant = story.createIntro({ instantText: true, artPaths: { delivered: 'assets/private-test.png' } });
assert.equal(instant.snapshot().revealed, true);
assert.equal(instant.snapshot().asset, 'assets/private-test.png');
assert.equal(instant.advance().action, 'scene');

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
  'Market relay is clear. Link it and bring my signal back.');
assert.equal(story.gameplayCues([readyEvent], market).cues[0].speaker, 'KAVE / COMMS');
assert.equal(story.gameplayCues([readyEvent], {...market,relay:{available:false,restored:false}}).cues.length, 0);
const restoredMarket = {...market,relay:{available:false,restored:true}};
const restoredEvent = {type:'relay-restored',id:'market-relay'};
const restored = story.gameplayCues([restoredEvent], restoredMarket);
assert.deepEqual(copy(restored.cues.map(cue => [cue.speaker,cue.text])), [
  ['DJ FLOPPYDISC / COMMS','Local signal restored. Your track. Their speakers.'],
  ['KAVE','There you are, Modem. Keep that signal moving.']
]);
assert.equal(restored.cues[0].id, 'city.relay.restored.local');
assert.equal(story.gameplayCues([restoredEvent], market).cues.length, 0, 'A relay claim requires the real restored result');
assert.equal(story.gameplayCues([readyEvent], restoredMarket).cues.length, 0, 'A restored relay cannot ask for another Link');
assert(restored.cues.every(cue => !/outbound|first play/i.test(cue.text)), 'Local relay is not an earned outbound feed claim');

const fixture = {id:'transit-terminal',kind:'terminal',zoneId:'transit-concourse',broken:true};
const fixtureState = stateFor('transit-concourse',{props:[fixture]});
const dischargeEvent = {type:'fixture-discharge',id:fixture.id,kind:fixture.kind,enemyIds:['enemy-1']};
const discharged = story.gameplayCues([dischargeEvent], fixtureState);
assert.equal(discharged.cues[0].id, 'city.fixture-discharge');
assert.equal(discharged.cues[0].speaker, 'DJ FLOPPYDISC / COMMS');
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
assert.deepEqual(readAll(story.createIntro()).choices, ['fourth-wall-question']);
assert.deepEqual(readAll(story.createDesk()).choices, []);
const rooftopCue = story.gameplayCues([{type:'zone-enter',zoneId:'rooftop-relay'}], stateFor('rooftop-relay')).cues[0];
assert.equal(rooftopCue.speaker, '9 BIT');
assert(/player.*camera/i.test(rooftopCue.text), 'The only 9 Bit gameplay aside explicitly breaks the fourth wall');
console.log('Mac street story passed: eight stable single-cue scenes, one optional player-facing 9 Bit choice, nine-input Continue and ten-input answered instant routes, one-cue desk payoff, reveal/advance/reconvergence/skip/reset, and 16 sparse immutable gameplay cues gated by actual events and snapshots without campaign or host side effects.');
