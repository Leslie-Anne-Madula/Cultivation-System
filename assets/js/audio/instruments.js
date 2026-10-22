/**
 * Guqin-like plucked string built with Karplus-Strong synthesis.
 * A soft fingertip excitation, a three-tap loop filter and a gentle
 * low-pass keep the tone warm; an all-pass filter keeps it in tune.
 */
export class Guqin {
  constructor(engine) {
    this.engine = engine;
    this.buffers = new Map();
  }

  buffer(frequency) {
    const key = frequency.toFixed(2);
    if (!this.buffers.has(key)) this.buffers.set(key, this.render(frequency));
    return this.buffers.get(key);
  }

  /**
   * @param {number} frequency
   * @param {object} [options]
   * @param {number} [options.damp]     seconds until the note is muted, for short taps
   * @param {number} [options.vibrato]  depth of the slow left-hand vibrato
   * @param {number} [options.slide]    pitch slide upward, as a fraction of the note
   */
  pluck(frequency, { when = 0, gain = 0.4, bus = "sfx", reverb = 0.35, damp = 0, vibrato = 0, slide = 0, pan = 0 } = {}) {
    const ctx = this.engine.context;
    const start = this.engine.now + Math.max(0, when);
    const source = ctx.createBufferSource();
    source.buffer = this.buffer(frequency);
    const length = source.buffer.duration;

    if (slide) {
      source.playbackRate.setValueAtTime(1, start + 0.25);
      source.playbackRate.linearRampToValueAtTime(1 + slide, start + 0.6);
      source.playbackRate.linearRampToValueAtTime(1, start + 1.2);
    }
    if (vibrato) {
      const wobble = ctx.createOscillator();
      wobble.frequency.value = 4.6;
      const depth = this.engine.createGain(0);
      depth.gain.setValueAtTime(0, start + 0.35);
      depth.gain.linearRampToValueAtTime(vibrato, start + 0.9);
      wobble.connect(depth).connect(source.playbackRate);
      wobble.start(start);
      wobble.stop(start + length);
    }

    const level = this.engine.createGain(gain);
    if (damp) {
      level.gain.setValueAtTime(gain, start);
      level.gain.setTargetAtTime(0.0001, start + damp * 0.4, damp / 4);
    }
    let output = source.connect(level);
    if (pan && ctx.createStereoPanner) {
      const panner = ctx.createStereoPanner();
      panner.pan.value = pan;
      output = output.connect(panner);
    }
    this.engine.route(output, { bus, reverb });
    source.start(start);
  }

  /** A harmonic: a pure, airy tone made by touching the string lightly. */
  harmonic(frequency, { when = 0, gain = 0.18, decay = 2.6, bus = "sfx", reverb = 0.55 } = {}) {
    const ctx = this.engine.context;
    const start = this.engine.now + when;
    const output = this.engine.createGain(1);
    this.engine.route(output, { bus, reverb });
    for (const [ratio, level] of [[1, 1], [2, 0.12]]) {
      const tone = ctx.createOscillator();
      tone.frequency.value = frequency * ratio;
      const envelope = ctx.createGain();
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.linearRampToValueAtTime(gain * level, start + 0.02);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + decay);
      tone.connect(envelope).connect(output);
      tone.start(start);
      tone.stop(start + decay + 0.05);
    }
  }

  render(frequency) {
    const ctx = this.engine.context;
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * Math.min(5, 2.4 + 400 / frequency));
    const buffer = ctx.createBuffer(1, length, rate);
    const out = buffer.getChannelData(0);

    const delay = rate / frequency - 1;
    const size = Math.floor(delay);
    const fraction = delay - size;
    const allpass = (1 - fraction) / (1 + fraction);
    const ring = new Float32Array(size);

    let smoothed = 0;
    for (let i = 0; i < size; i++) {
      const position = i / size;
      const fingertip = position < 0.7 ? Math.sin((Math.PI * position) / 0.7) : 0;
      smoothed += 0.15 * (Math.random() * 2 - 1 - smoothed);
      ring[i] = 0.9 * fingertip + 0.12 * smoothed;
    }
    const mean = ring.reduce((sum, v) => sum + v, 0) / size;
    for (let i = 0; i < size; i++) ring[i] -= mean;

    const sustain = Math.max(1.6, Math.min(4.2, 4.4 - frequency / 400));
    const loss = 0.001 ** (1 / (frequency * sustain));
    let index = 0, previous = 0, older = 0, apIn = 0, apOut = 0;
    for (let i = 0; i < length; i++) {
      const current = ring[index];
      const averaged = 0.25 * current + 0.5 * previous + 0.25 * older;
      older = previous;
      previous = current;
      const tuned = allpass * averaged + apIn - allpass * apOut;
      apIn = averaged;
      apOut = tuned;
      ring[index] = tuned * loss;
      out[i] = current;
      index = index + 1 === size ? 0 : index + 1;
    }

    const smoothing = Math.exp((-2 * Math.PI * 1700) / rate);
    const attack = Math.floor(rate * 0.014);
    const release = Math.floor(rate * 0.12);
    let lowpassed = 0, peak = 0;
    for (let i = 0; i < length; i++) {
      lowpassed = (1 - smoothing) * out[i] + smoothing * lowpassed;
      let shape = 1;
      if (i < attack) shape = 0.5 - 0.5 * Math.cos((Math.PI * i) / attack);
      if (i > length - release) shape *= (length - i) / release;
      out[i] = lowpassed * shape;
      peak = Math.max(peak, Math.abs(out[i]));
    }
    const normal = 0.85 / (peak || 1);
    for (let i = 0; i < length; i++) out[i] *= normal;
    return buffer;
  }
}

const BOWL_PARTIALS = [
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
    for (const [ratio, level, length] of BOWL_PARTIALS) {
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

/** Soft non-pitched sounds: a turning page, a seal pressed into paper and a breath of air. */
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

  breath({ gain = 0.2, duration = 0.9 } = {}) {
    const ctx = this.engine.context, start = this.engine.now;
    const air = this.engine.noiseSource();
    const band = this.engine.createFilter("bandpass", 260, { q: 0.6 });
    band.frequency.setValueAtTime(260, start);
    band.frequency.exponentialRampToValueAtTime(900, start + duration * 0.45);
    band.frequency.exponentialRampToValueAtTime(350, start + duration);
    const level = ctx.createGain();
    level.gain.setValueAtTime(0.0001, start);
    level.gain.linearRampToValueAtTime(gain, start + duration * 0.4);
    level.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    air.connect(band).connect(level);
    this.engine.route(level, { reverb: 0.35 });
    air.start(start);
    air.stop(start + duration + 0.05);
  }
}
