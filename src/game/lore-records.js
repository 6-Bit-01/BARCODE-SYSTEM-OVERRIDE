// Authored Level 1 records. Save files keep these stable IDs, not copies of prose.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/game/lore-records.js', exports: ['BARCODE.LoreRecords'], dependencies: [] });
(function() {
  const BARCODE = window.BARCODE = window.BARCODE || {};
  const records = [
    {
      id: 'lore.l01.01', number: '01', title: 'Four Names on the Tape', author: 'CACHE BACK', source: 'Protected session notes',
      paragraphs: [
        'The label says BARCODE: 6 Bit, DJ Floppydisc, Cache Back, Mac Modem. Four voices before the Network started calling everything its signal.',
        'I know what a bad label can do. I woke up from a cleared laptop cache convinced I was callembini. The files survived. Sorting out who I was took longer.',
        'We locked these memories inside the system. Keep the names with the music. A clean copy means nothing if it erases the people who made it.'
      ],
      response: '6 Bit: "The Network can keep the stationery. That\'s our tape."'
    },
    {
      id: 'lore.l01.02', number: '02', title: 'The Other Side of Silence', author: 'DJ FLOPPYDISC', source: 'Isolated channel check',
      paragraphs: [
        'Two waveforms in the same channel. Same timing. Same shape. Every peak on the second trace points the other way.',
        'Together, they cancel. Separate them and both are still there. Someone listening only to the mix could mistake that silence for an empty track.',
        'I have kept both traces. Source unresolved. Do not normalize, overwrite, or discard either one. First we find out what we are actually hearing.'
      ],
      response: '6 Bit: "Great. Even the silence has a second track."'
    },
    {
      id: 'lore.l01.03', number: '03', title: 'A Whole Block on Mute', author: 'MAC MODEM', source: 'Relay carrier trace',
      paragraphs: [
        'The Broadcast Jammer doesn\'t have to chase anybody. It leans on the whole block: signs, gate lines, speakers. Different systems, same ugly pulse.',
        'That is how you hold a street hostage without taking a step. Leave the transmitter alone and you can spend all night fighting the things underneath it.',
        'I kept the carrier trace. Find what is feeding that interference and cut the transmission. I want to hear the neighborhood again.'
      ],
      response: '6 Bit: "We came to bring the volume back. Let\'s do that."'
    }
  ].map(record => Object.freeze({ ...record, paragraphs: Object.freeze(record.paragraphs) }));
  const byId = new Map(records.map(record => [record.id, record]));
  BARCODE.LoreRecords = Object.freeze({
    level1: Object.freeze(records),
    get: id => byId.get(id) || null,
    preview: id => {
      const record = byId.get(id);
      return record ? `ARCHIVE ${record.number} // ${record.title.toUpperCase()} — ${record.paragraphs[0]}` : '';
    },
    wrap(ctx, text, width) {
      const lines = []; let line = '';
      for (const word of String(text).split(/\s+/)) {
        const next = line ? line + ' ' + word : word;
        if (line && ctx.measureText(next).width > width) { lines.push(line); line = word; }
        else line = next;
      }
      if (line) lines.push(line);
      return lines;
    }
  });
})();
