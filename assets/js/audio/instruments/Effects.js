/** Soft non-pitched sounds: a turning page and a seal pressed into paper. */
export class Effects {
  constructor(engine) {
    this.engine = engine;
    this.pages = null;
  }

  /** A sheet of paper lifting, turning and settling. */
  paper({ when = 0, gain = 0.5, rate = 1 } = {}) {
    const ctx = this.engine.context;
    this.pages ??= [0, 1, 2].map(() => this.renderPaper());
    const source = ctx.createBufferSource();
    source.buffer = this.pages[Math.floor(Math.random() * this.pages.length)];
    source.playbackRate.value = rate * (0.94 + Math.random() * 0.12);
    const level = this.engine.createGain(gain);
    source.connect(level);
    this.engine.route(level, { reverb: 0.18 });
    source.start(this.engine.now + when);
  }

  renderPaper() {
    const ctx = this.engine.context;
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * 0.75);
    const buffer = ctx.createBuffer(2, length, rate);
    const fadeIn = Math.floor(rate * 0.005), fadeOut = Math.floor(rate * 0.04);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let air = 0, grain = 0, softened = 0, peak = 0;
      for (let i = 0; i < length; i++) {
        const t = i / rate;
        const lift = t < 0.16 ? Math.sin(((t / 0.16) * Math.PI) / 2) ** 2 : Math.exp(-(t - 0.16) / 0.1);
        const settle = 0.55 * Math.exp(-(((t - 0.43) / 0.04) ** 2));
        const envelope = lift + settle;
        air += 0.14 * (Math.random() * 2 - 1 - air);
        if (Math.random() < 0.003 * envelope) grain += Math.random() * 2 - 1;
        grain *= 0.96;
        const flap = settle * 0.25 * Math.sin(2 * Math.PI * 110 * t);
        softened += 0.42 * ((air * 1.6 + grain * 1.0) * envelope + flap - softened);
        data[i] = softened;
        peak = Math.max(peak, Math.abs(softened));
      }
      for (let i = 0; i < length; i++) {
        let shape = 0.8 / (peak || 1);
        if (i < fadeIn) shape *= i / fadeIn;
        if (i > length - fadeOut) shape *= (length - i) / fadeOut;
        data[i] *= shape;
      }
    }
    return buffer;
  }

  thud({ gain = 0.45 } = {}) {
    const ctx = this.engine.context, start = this.engine.now;
    const tone = ctx.createOscillator();
    tone.frequency.setValueAtTime(115, start);
    tone.frequency.exponentialRampToValueAtTime(58, start + 0.35);
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.linearRampToValueAtTime(gain, start + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);
    tone.connect(envelope);
    this.engine.route(envelope, { reverb: 0.2 });
    tone.start(start);
    tone.stop(start + 0.5);
  }
}
