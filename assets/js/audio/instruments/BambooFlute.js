/** A bamboo flute played softly: a round fundamental with a little octave and twelfth. */
const PARTIALS = [0, 1, 0.4, 0.18, 0.07, 0.035, 0.015];
const GLIDE = 0.04;
const GRACE = 0.07;
const RELEASE = 0.3;
/** Breath noise: a band that follows the pitch, a wider band of air, and the burst of each tongued note. */
const EDGE = 1.8;
const HISS = 0.25;
const CHIFF = 3;
const VIBRATO = { speed: 5.2, cents: 14, sway: 0.07 };

/**
 * Bamboo flute between the mellow xiao and the brighter dizi. A phrase is one
 * breath: a single tone that glides between notes, with soft tonguing, breath
 * noise and a vibrato that blooms on held notes.
 */
export class BambooFlute {
  constructor(engine) {
    this.engine = engine;
    this.wave = null;
  }

  /**
   * @param {Array<{frequency: number, at: number, length: number, grace?: number}>} notes
   *   times in seconds from the start of the breath; `grace` is a pitch flicked through on the way into the note
   * @returns {{ end: number, stop(at: number): void }}
   */
  phrase(notes, { when = 0, gain = 0.12, bus = "music", reverb = 0.55, pan = 0 } = {}) {
    const ctx = this.engine.context;
    const start = this.engine.now + Math.max(0, when);
    const last = notes[notes.length - 1];
    const end = start + last.at + last.length + RELEASE;
    this.wave ??= ctx.createPeriodicWave(new Float32Array(PARTIALS.length), Float32Array.from(PARTIALS));

    const tone = ctx.createOscillator();
    tone.setPeriodicWave(this.wave);
    const air = this.engine.noiseSource({ loop: true });
    const edge = this.engine.createFilter("bandpass", notes[0].frequency, { q: 3 });
    const breath = this.engine.createGain(1);
    const envelope = this.engine.createGain(0);
    const tremolo = this.engine.createGain(1);
    air.connect(edge).connect(this.engine.createGain(EDGE)).connect(breath);
    air.connect(this.engine.createFilter("bandpass", 2400, { q: 0.8 })).connect(this.engine.createGain(HISS)).connect(breath);
    tone.connect(envelope);
    breath.connect(envelope);
    this.engine.route(envelope.connect(tremolo), { bus, reverb, pan });

    const vibrato = ctx.createOscillator();
    vibrato.frequency.value = VIBRATO.speed;
    const depth = this.engine.createGain(0);
    const sway = this.engine.createGain(0);
    vibrato.connect(depth);
    depth.connect(tone.detune);
    depth.connect(edge.detune);
    vibrato.connect(sway).connect(tremolo.gain);
    const drift = ctx.createOscillator();
    drift.frequency.value = 0.23;
    drift.connect(this.engine.createGain(4)).connect(tone.detune);

    let previous = 0;
    for (const [i, note] of notes.entries()) {
      const t = start + note.at;
      const length = note.length;
      const tongued = i === 0 || !note.grace;
      for (const param of [tone.frequency, edge.frequency]) {
        if (note.grace) {
          param.setValueAtTime(note.grace, t);
          param.setValueAtTime(note.grace, t + GRACE);
          param.exponentialRampToValueAtTime(note.frequency, t + GRACE + 0.02);
        } else {
          param.setValueAtTime(previous || note.frequency * 0.985, t);
          param.exponentialRampToValueAtTime(note.frequency, t + (previous ? GLIDE : 0.09));
        }
      }
      previous = note.frequency;

      const level = envelope.gain;
      if (i === 0) {
        level.setValueAtTime(0, t);
        level.linearRampToValueAtTime(gain * 0.8, t + 0.08);
      } else if (tongued) {
        level.linearRampToValueAtTime(gain * 0.55, t + 0.02);
        level.linearRampToValueAtTime(gain, t + 0.07);
      }
      if (length >= 0.6) {
        level.linearRampToValueAtTime(gain * 1.1, t + length * 0.45);
        level.linearRampToValueAtTime(gain * 0.85, t + length - 0.03);
        for (const [param, amount] of [[depth.gain, VIBRATO.cents], [sway.gain, VIBRATO.sway]]) {
          param.setValueAtTime(0, t + 0.15);
          param.linearRampToValueAtTime(amount, t + Math.min(0.7, length * 0.6));
          param.linearRampToValueAtTime(0, t + length);
        }
      } else {
        level.linearRampToValueAtTime(gain * 0.92, t + length - 0.03);
      }
      if (tongued) {
        breath.gain.setValueAtTime(CHIFF, t);
        breath.gain.setTargetAtTime(1, t + 0.01, 0.03);
      }
    }
    envelope.gain.linearRampToValueAtTime(0, end);

    const sources = [tone, air, vibrato, drift];
    for (const source of sources) {
      source === air ? air.start(start, Math.random()) : source.start(start);
      source.stop(end + 0.05);
    }
    return { end, stop: (at) => sources.forEach((source) => source.stop(Math.min(at, end + 0.05))) };
  }
}
