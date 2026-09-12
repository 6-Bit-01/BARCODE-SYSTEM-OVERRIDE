// Durable discovery facts. Ending evaluation belongs to a future campaign owner.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/game/lore-collection.js', exports: ['BARCODE.LoreCollection'], dependencies: [] });
(function() {
  const BARCODE = window.BARCODE = window.BARCODE || {};
  const KEY = 'barcode.system-override.save.v1.default';
  const COUNTS = [3, 4, 5, 4, 5, 4, 3];
  const IDS = new Set(COUNTS.flatMap((count, index) => Array.from({ length: count }, (_, piece) =>
    `lore.l${String(index + 1).padStart(2, '0')}.${String(piece + 1).padStart(2, '0')}`)));
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  function blank() {
    return { schemaVersion: 1, campaignVersion: 'level-01-demo-1', slotId: 'default', revision: 0,
      current: { levelId: 'level-01', checkpointId: 'start', levelState: null },
      progress: { unlockedLevels: ['level-01'], completedLevels: [], items: [], lore: [], easterEggs: [], results: {} },
      settings: {}, integrity: { lastCleanExit: false, recoveredFromBackup: false } };
  }
  function parse(raw) {
    if (!raw) return null;
    try {
      const value = JSON.parse(raw);
      if (value.schemaVersion !== 1 || value.slotId !== 'default' || !object(value.progress) || !Array.isArray(value.progress.lore)) return null;
      value.integrity = object(value.integrity) ? value.integrity : {};
      const unknown = value.progress.lore.filter(id => !IDS.has(id));
      if (unknown.length) value.integrity.unrecognizedLore = unknown;
      value.progress.lore = [...new Set(value.progress.lore.filter(id => IDS.has(id)))];
      return value;
    } catch (_) { return null; }
  }
  BARCODE.LoreCollection = class LoreCollection {
    constructor() {
      this.record = blank(); this.status = 'ready'; this.blocked = false;
      try {
        const raw = window.localStorage?.getItem(KEY);
        if (!window.localStorage) throw new Error('storage unavailable');
        if (!raw) {
          const backup = window.localStorage.getItem(KEY + '.backup');
          if (!backup) return;
          const recovered = parse(backup);
          if (recovered) { this.record = recovered; this.record.integrity.recoveredFromBackup = true; }
          else { this.blocked = true; this.status = 'damaged'; }
          return;
        }
        try {
          const version = JSON.parse(raw)?.schemaVersion;
          if (version !== undefined && version !== 1) { this.blocked = true; this.status = 'incompatible'; return; }
        } catch (_) { /* Try the last complete backup. */ }
        const canonical = parse(raw);
        const recovered = canonical || parse(window.localStorage.getItem(KEY + '.backup'));
        if (recovered) {
          this.record = recovered;
          if (!canonical) this.record.integrity.recoveredFromBackup = true;
        } else { this.blocked = true; this.status = 'damaged'; }
      } catch (_) { this.status = 'unavailable'; }
    }
    has(id) { return this.record.progress.lore.includes(id); }
    getIds() { return [...this.record.progress.lore]; }
    collect(id) {
      if (!IDS.has(id)) return false;
      const fresh = !this.has(id);
      if (fresh) this.record.progress.lore.push(id);
      if (fresh || this.status !== 'ready') this.save();
      return fresh;
    }
    save() {
      if (this.blocked) return false;
      try {
        const storage = window.localStorage;
        if (!storage) throw new Error('storage unavailable');
        // Merge discoveries from another tab before committing this one.
        const currentRaw = storage.getItem(KEY);
        if (currentRaw) {
          let current = null;
          try { current = JSON.parse(currentRaw); } catch (_) { /* Recovered backup is authoritative. */ }
          if (current?.schemaVersion !== undefined && current.schemaVersion !== 1) { this.blocked = true; this.status = 'incompatible'; return false; }
          const valid = parse(currentRaw);
          if (!valid && !this.record.integrity?.recoveredFromBackup) { this.blocked = true; this.status = 'damaged'; return false; }
          if (!valid) storage.setItem(KEY + '.damaged', currentRaw);
          if (valid) this.record = { ...valid, progress: { ...valid.progress,
            lore: [...new Set([...valid.progress.lore, ...this.record.progress.lore])] } };
        }
        const next = JSON.parse(JSON.stringify(this.record));
        next.revision = (Number.isSafeInteger(next.revision) ? next.revision : 0) + 1;
        next.updatedAt = new Date().toISOString();
        const serialized = JSON.stringify(next);
        storage.setItem(KEY + '.pending', serialized);
        if (storage.getItem(KEY + '.pending') !== serialized || !parse(serialized)) throw new Error('save verification failed');
        const previous = parse(currentRaw);
        if (previous) storage.setItem(KEY + '.backup', JSON.stringify(previous));
        else storage.setItem(KEY + '.backup', serialized);
        storage.setItem(KEY, serialized);
        if (storage.getItem(KEY) !== serialized) throw new Error('save promotion failed');
        this.record = next; this.status = 'ready';
        storage.removeItem(KEY + '.pending');
        return true;
      } catch (_) { this.status = 'unavailable'; return false; }
    }
  };
})();
