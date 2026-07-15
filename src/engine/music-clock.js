// Authoritative music transport for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/engine/music-clock.js',
  exports: ['MusicClock', 'musicClock'],
  dependencies: []
});

(function () {
  const DEFAULT_BPM = 146;
  const BEATS_PER_BAR = 4;
  const BARS_PER_PHRASE = 4;
  const BEATS_PER_PHRASE = BEATS_PER_BAR * BARS_PER_PHRASE;
  const MAX_CATCH_UP_BEATS = 64;

  class MusicClock {
    constructor(options = {}) {
      this.bpm = options.bpm || DEFAULT_BPM;
      this.beatOffset = options.beatOffset || 0;
      this.beatsPerBar = BEATS_PER_BAR;
      this.barsPerPhrase = BARS_PER_PHRASE;
      this.mode = 'stopped';
      this.anchorTime = 0;
      this.anchorPerformanceTime = 0;
      this.context = null;
      this.epoch = 0;
      this.lastEmittedBeat = -1;
      this.fallbackReported = false;
      this.subscribers = {
        beat: new Set(),
        bar: new Set(),
        phrase: new Set(),
        start: new Set(),
        stop: new Set(),
        reanchor: new Set(),
        resync: new Set()
      };
    }

    get beatDuration() {
      return 60 / this.bpm;
    }

    configure(options = {}) {
      if (typeof options.bpm === 'number' && options.bpm > 0) {
        this.bpm = options.bpm;
      }
      if (typeof options.beatOffset === 'number') {
        this.beatOffset = options.beatOffset;
      }
      return this.getSnapshot();
    }

    on(eventName, callback) {
      if (!this.subscribers[eventName] || typeof callback !== 'function') {
        return () => {};
      }
      this.subscribers[eventName].add(callback);
      return () => this.subscribers[eventName].delete(callback);
    }

    emit(eventName, payload) {
      if (!this.subscribers[eventName]) return;
      const eventPayload = Object.freeze(Object.assign({}, payload, { snapshot: this.getSnapshot() }));
      Array.from(this.subscribers[eventName]).forEach(callback => {
        try {
          callback(eventPayload);
        } catch (error) {
          console.warn(`MusicClock ${eventName} subscriber failed:`, error?.message || error);
        }
      });
    }

    start(options = {}) {
      const context = options.context || this.context;
      const hasAudio = !!(context && typeof context.currentTime === 'number');
      if (!hasAudio && this.mode === 'running') {
        return this.getSnapshot();
      }
      const anchorTime = typeof options.anchorTime === 'number'
        ? options.anchorTime
        : hasAudio ? context.currentTime : this.getMonotonicSeconds();
      const mode = hasAudio ? (anchorTime > context.currentTime ? 'scheduled' : 'running') : 'fallback';
      if (this.mode === mode && this.anchorTime === anchorTime && this.context === context) {
        return this.getSnapshot();
      }
      this.context = hasAudio ? context : null;
      this.anchorTime = anchorTime;
      this.anchorPerformanceTime = this.getMonotonicSeconds();
      this.mode = mode;
      this.epoch++;
      this.lastEmittedBeat = -1;
      if (!hasAudio && !this.fallbackReported) {
        this.fallbackReported = true;
        console.warn('MusicClock fallback transport active: Web Audio clock is unavailable.');
      }
      this.emit('start', { epoch: this.epoch, mode: this.mode, anchorTime: this.anchorTime });
      return this.getSnapshot();
    }

    startFallback(options = {}) {
      if (this.mode === 'running' || this.mode === 'scheduled') {
        return this.getSnapshot();
      }
      return this.start(Object.assign({}, options, { context: null, anchorTime: this.getMonotonicSeconds() }));
    }

    reanchor(options = {}) {
      const oldEpoch = this.epoch;
      this.stop({ silent: true });
      const snapshot = this.start(options);
      this.emit('reanchor', { oldEpoch, epoch: this.epoch, mode: this.mode, anchorTime: this.anchorTime });
      return snapshot;
    }

    stop(options = {}) {
      if (this.mode === 'stopped') return this.getSnapshot();
      const previousMode = this.mode;
      this.mode = 'stopped';
      this.epoch++;
      this.lastEmittedBeat = -1;
      if (!options.silent) {
        this.emit('stop', { epoch: this.epoch, previousMode });
      }
      return this.getSnapshot();
    }

    reset() {
      return this.stop();
    }

    getMonotonicSeconds() {
      if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        return performance.now() / 1000;
      }
      return 0;
    }

    getTransportTime() {
      if ((this.mode === 'running' || this.mode === 'scheduled') && this.context) {
        return this.context.currentTime;
      }
      if (this.mode === 'fallback') {
        return this.getMonotonicSeconds();
      }
      return this.anchorTime;
    }

    getSnapshot(timeOverride) {
      const transportTime = typeof timeOverride === 'number' ? timeOverride : this.getTransportTime();
      const rawElapsed = transportTime - this.anchorTime - this.beatOffset;
      const elapsed = Math.max(0, rawElapsed);
      const beatDuration = this.beatDuration;
      const completedBeatCount = Math.floor(elapsed / beatDuration);
      const absoluteBeatIndex = completedBeatCount;
      const absoluteBarIndex = Math.floor(absoluteBeatIndex / BEATS_PER_BAR);
      const beatPhase = beatDuration > 0 ? (elapsed % beatDuration) / beatDuration : 0;
      const barBeatElapsed = (absoluteBeatIndex % BEATS_PER_BAR) + beatPhase;
      const phraseBeatElapsed = (absoluteBeatIndex % BEATS_PER_PHRASE) + beatPhase;
      const mode = this.mode === 'scheduled' && this.context && transportTime >= this.anchorTime ? 'running' : this.mode;
      return Object.freeze({
        mode,
        bpm: this.bpm,
        beatsPerBar: BEATS_PER_BAR,
        barsPerPhrase: BARS_PER_PHRASE,
        beatDuration,
        anchorTime: this.anchorTime,
        currentTime: transportTime,
        transportTime,
        elapsedMusicalTime: elapsed,
        absoluteBeatIndex,
        completedBeatCount,
        beatWithinBar: absoluteBeatIndex % BEATS_PER_BAR,
        barWithinPhrase: absoluteBarIndex % BARS_PER_PHRASE,
        absoluteBarIndex,
        phraseIndex: Math.floor(absoluteBarIndex / BARS_PER_PHRASE),
        beatPhase,
        barPhase: barBeatElapsed / BEATS_PER_BAR,
        phrasePhase: phraseBeatElapsed / BEATS_PER_PHRASE,
        epoch: this.epoch,
        firstDownbeatOccurred: rawElapsed >= 0,
        valid: mode === 'running' || mode === 'scheduled' || mode === 'fallback'
      });
    }

    sample(timeOverride) {
      const snapshot = this.getSnapshot(timeOverride);
      if (!snapshot.valid || !snapshot.firstDownbeatOccurred || this.mode === 'stopped') {
        return snapshot;
      }
      const currentBeat = snapshot.completedBeatCount;
      if (currentBeat > this.lastEmittedBeat) {
        const missed = currentBeat - this.lastEmittedBeat;
        if (this.lastEmittedBeat >= 0 && missed > MAX_CATCH_UP_BEATS) {
          this.lastEmittedBeat = currentBeat;
          this.emit('resync', { epoch: this.epoch, beat: currentBeat, skippedBeats: missed });
          return snapshot;
        }
        for (let beat = this.lastEmittedBeat + 1; beat <= currentBeat; beat++) {
          this.lastEmittedBeat = beat;
          this.emit('beat', { epoch: this.epoch, beat });
          if (beat % BEATS_PER_BAR === 0) {
            this.emit('bar', { epoch: this.epoch, bar: Math.floor(beat / BEATS_PER_BAR), beat });
          }
          if (beat % BEATS_PER_PHRASE === 0) {
            this.emit('phrase', { epoch: this.epoch, phrase: Math.floor(beat / BEATS_PER_PHRASE), beat });
          }
        }
      }
      return snapshot;
    }

    judgeNearestBeat(timeOverride, calibrationMs = 0) {
      const snapshot = this.getSnapshot(timeOverride);
      if (!snapshot.valid || !snapshot.firstDownbeatOccurred) {
        return Object.freeze({ valid: false, mode: snapshot.mode, timing: 'waiting', signedOffsetMs: 0, absoluteOffsetMs: Infinity, nearestBeatIndex: null });
      }
      const calibratedElapsed = snapshot.elapsedMusicalTime + (calibrationMs / 1000);
      const nearestBeatIndex = Math.max(0, Math.round(calibratedElapsed / snapshot.beatDuration));
      const nearestBeatTime = this.anchorTime + this.beatOffset + (nearestBeatIndex * snapshot.beatDuration);
      const signedOffsetMs = (snapshot.transportTime - nearestBeatTime) * 1000 + calibrationMs;
      const absoluteOffsetMs = Math.abs(signedOffsetMs);
      let timing = 'miss';
      if (absoluteOffsetMs <= 60) timing = 'perfect';
      else if (absoluteOffsetMs <= 100) timing = 'excellent';
      return Object.freeze({ valid: true, mode: snapshot.mode, timing, signedOffsetMs, absoluteOffsetMs, nearestBeatIndex });
    }
  }

  window.MusicClock = MusicClock;
  window.musicClock = window.musicClock || new MusicClock();
})();
