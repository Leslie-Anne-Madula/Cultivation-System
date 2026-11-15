const PARTIALS = [
  [1, 1, 1],
  [2.01, 0.22, 0.6],
  [2.97, 0.08, 0.4]
];

/** A soft singing bowl: near-harmonic partials, slow bloom, long fade. */
export class SingingBowl {
  constructor(engine) {
    this.engine = engine;
  }

  strike(frequency, { when = 0, gain = 0.2, decay = 4, reverb = 0.5 } = {}) {
    const ctx = this.engine.context;
    const start = this.engine.now + when;
    const output = this.engine.createGain(gain);
    this.engine.route(output, { reverb });
    for (const [ratio, level, length] of PARTIALS) {
      const end = start + decay * length;
      const tone = ctx.createOscillator();
      tone.frequency.value = frequency * ratio;
      const envelope = ctx.createGain();
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.linearRampToValueAtTime(level, start + 0.03);
      envelope.gain.exponentialRampToValueAtTime(0.0001, end);
      tone.connect(envelope).connect(output);
      tone.start(start);
      tone.stop(end + 0.05);
    }
  }
}
