const TWO_PI = 2 * Math.PI;

/** Pluck point as a fraction of the string from the bridge. */
const PLUCK_POINT = 0.13;

/** Buffers are levelled by their RMS over the first moments of the note, with a peak ceiling. */
const LOUDNESS_WINDOW = 0.6;
const TARGET_RMS = 0.27;
const MAX_PEAK = 1.2;

/** Body response: cavity, top plate and the nasal band of a string plucked near the bridge. */
const BODY = [
  ["highpass", 45, { q: 0.7 }],
  ["peaking", 190, { q: 1.2, gain: 3 }],
  ["peaking", 520, { q: 1.4, gain: 2.5 }],
  ["peaking", 1250, { q: 2, gain: 3 }],
  ["lowpass", 3600, { q: 0.6 }]
];

/**
 * Left-hand techniques. Chuo and zhu slide into the note from below or above;
 * yin and nao are slow vibratos, nao the wider.
 */
const ORNAMENTS = {
  chuo: { from: 0.9 },
  zhu: { from: 1.06 },
  yin: { depth: 0.006, speed: 4.2 },
  nao: { depth: 0.014, speed: 2.8 }
};

/** In-place RBJ biquad over a buffer. */
function biquad(data, type, frequency, rate, { q = 0.7, gain = 0 }) {
  const w = (TWO_PI * frequency) / rate;
  const cos = Math.cos(w);
  const alpha = Math.sin(w) / (2 * q);
  let b0, b1, b2, a0, a1, a2;
  if (type === "peaking") {
    const amp = 10 ** (gain / 40);
    [b0, b1, b2] = [1 + alpha * amp, -2 * cos, 1 - alpha * amp];
    [a0, a1, a2] = [1 + alpha / amp, -2 * cos, 1 - alpha / amp];
  } else {
    const sign = type === "lowpass" ? -1 : 1;
    [b0, b1, b2] = [(1 + sign * cos) / 2, -sign * (1 + sign * cos), (1 + sign * cos) / 2];
    [a0, a1, a2] = [1 + alpha, -2 * cos, 1 - alpha];
  }
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < data.length; i++) {
    const x = data[i];
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    data[i] = y;
  }
}

/** One-pole loop filter coefficient that makes partials near 2.2 kHz fade by 60 dB in `seconds`. */
function loopDamping(frequency, seconds, rate) {
  const g = 0.001 ** (2 / (seconds * frequency));
  const c = 1 - g * Math.cos((TWO_PI * 2200) / rate);
  return (c - Math.sqrt(c * c - (1 - g) ** 2)) / (1 - g);
}

/** Open-string excitation: a triangle peaking at the pluck point, plus nail noise combed at that point. */
function pluckShape(size) {
  const ring = new Float32Array(size);
  const at = Math.max(1, Math.round(size * PLUCK_POINT));
  const grit = new Float32Array(size);
  let noise = 0;
  for (let i = 0; i < size; i++) {
    noise += 0.5 * (Math.random() * 2 - 1 - noise);
    grit[i] = noise;
  }
  for (let i = 0; i < size; i++) {
    const shape = i < at ? i / at : (size - i) / (size - at);
    ring[i] = shape + 0.2 * (grit[i] - grit[(i - at + size) % size]);
  }
  return withoutOffset(ring);
}

/** Harmonic excitation: a smooth fingertip bump, close to the fundamental alone. */
function touchShape(size) {
  const ring = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    const position = i / size;
    ring[i] = position < 0.7 ? Math.sin((Math.PI * position) / 0.7) : 0;
  }
  return withoutOffset(ring);
}

function withoutOffset(ring) {
  const mean = ring.reduce((sum, v) => sum + v, 0) / ring.length;
  for (let i = 0; i < ring.length; i++) ring[i] -= mean;
  return ring;
}

/** Short low noise burst: the string knocking against the wooden top. */
function addKnock(out, rate) {
  const length = Math.floor(rate * 0.03);
  const decay = rate * 0.006;
  let noise = 0;
  for (let i = 0; i < length; i++) {
    noise += 0.08 * (Math.random() * 2 - 1 - noise);
    out[i] += 0.6 * noise * Math.exp(-i / decay);
  }
}

/**
 * Guqin voice built with extended Karplus-Strong synthesis: pluck-point
 * excitation, a one-pole loop filter for silk damping, an all-pass for
 * tuning and a fixed body response. Pitch moves through playbackRate for
 * the left-hand slides and vibratos.
 */
export class Guqin {
  constructor(engine) {
    this.engine = engine;
    this.buffers = new Map();
  }

  buffer(frequency, tone = "open") {
    const key = `${tone}:${frequency.toFixed(2)}`;
    if (!this.buffers.has(key)) this.buffers.set(key, this.render(frequency, tone));
    return this.buffers.get(key);
  }

  /** Renders notes ahead of time, one every few frames, so the first plucks never stall the page. */
  prepare(frequencies, tone = "open") {
    const queue = [...frequencies];
    const next = () => {
      const frequency = queue.shift();
      if (frequency === undefined) return;
      this.buffer(frequency, tone);
      setTimeout(next, 30);
    };
    setTimeout(next, 30);
  }

  /**
   * @param {number} frequency
   * @param {object} [options]
   * @param {number} [options.damp]      seconds until the note is muted, for short taps
   * @param {string} [options.ornament]  "chuo", "zhu", "yin" or "nao"
   * @param {number} [options.slideTo]   pitch the left hand slides to after the pluck
   * @param {number} [options.slideAt]   seconds after the pluck when that slide starts
   * @param {string} [options.tone]      "open" or "harmonic"
   */
  pluck(frequency, { when = 0, gain = 0.4, bus = "sfx", reverb = 0.35, damp = 0, pan = 0, ornament, slideTo = 0, slideAt = 0.5, tone = "open" } = {}) {
    const ctx = this.engine.context;
    const start = this.engine.now + Math.max(0, when);
    const source = ctx.createBufferSource();
    source.buffer = this.buffer(frequency, tone);
    const length = source.buffer.duration;
    const style = ORNAMENTS[ornament] ?? {};
    const pitch = source.playbackRate;

    pitch.setValueAtTime(style.from ?? 1.003, start);
    pitch.exponentialRampToValueAtTime(1, start + (style.from ? 0.2 : 0.1));
    if (style.from) this.fingerSlide(start, 0.2, gain, bus);
    if (slideTo) {
      pitch.setValueAtTime(1, start + slideAt);
      pitch.exponentialRampToValueAtTime(slideTo / frequency, start + slideAt + 0.32);
      this.fingerSlide(start + slideAt, 0.32, gain, bus);
    }
    if (style.depth) this.vibrato(pitch, start, length, style);

    const level = this.engine.createGain(gain);
    if (damp) {
      level.gain.setValueAtTime(gain, start);
      level.gain.setTargetAtTime(0.0001, start + damp * 0.4, damp / 4);
    }
    this.engine.route(source.connect(level), { bus, reverb, pan });
    source.start(start);
  }

  /** A harmonic: the string touched lightly at a node, pure and bell-like. */
  harmonic(frequency, { gain = 0.18, reverb = 0.55, ...options } = {}) {
    this.pluck(frequency, { ...options, gain, reverb, tone: "harmonic" });
  }

  /** Vibrato that sets in after the pluck, then narrows and slows as the note fades. */
  vibrato(pitch, start, length, { depth, speed }) {
    const ctx = this.engine.context;
    const wobble = ctx.createOscillator();
    wobble.frequency.setValueAtTime(speed, start);
    wobble.frequency.linearRampToValueAtTime(speed * 0.7, start + length);
    const amount = this.engine.createGain(0);
    amount.gain.setValueAtTime(0, start + 0.25);
    amount.gain.linearRampToValueAtTime(depth, start + 0.7);
    amount.gain.linearRampToValueAtTime(depth * 0.3, start + length);
    wobble.connect(amount).connect(pitch);
    wobble.start(start);
    wobble.stop(start + length);
  }

  /** Faint hiss of a fingertip sliding along the string. */
  fingerSlide(start, duration, gain, bus) {
    const ctx = this.engine.context;
    const air = this.engine.noiseSource();
    const band = this.engine.createFilter("bandpass", 1600, { q: 0.9 });
    const level = ctx.createGain();
    level.gain.setValueAtTime(0.0001, start);
    level.gain.linearRampToValueAtTime(gain * 0.06, start + duration * 0.4);
    level.gain.linearRampToValueAtTime(0.0001, start + duration);
    air.connect(band).connect(level);
    this.engine.route(level, { bus, reverb: 0.1 });
    air.start(start, Math.random());
    air.stop(start + duration + 0.02);
  }

  render(frequency, tone) {
    const ctx = this.engine.context;
    const rate = ctx.sampleRate;
    const pure = tone === "harmonic";
    const length = Math.floor(rate * Math.min(5, 2.4 + 400 / frequency));
    const buffer = ctx.createBuffer(1, length, rate);
    const out = buffer.getChannelData(0);

    const damping = loopDamping(frequency, pure ? 0.2 : 0.4, rate);
    const w = (TWO_PI * frequency) / rate;
    const delay = rate / frequency - Math.atan2(damping * Math.sin(w), 1 - damping * Math.cos(w)) / w;
    const size = Math.floor(delay - 0.5);
    const fraction = delay - size;
    const allpass = (1 - fraction) / (1 + fraction);
    const ring = pure ? touchShape(size) : pluckShape(size);

    const sustain = pure ? 3.2 : Math.max(1.6, Math.min(4.2, 4.4 - frequency / 400));
    const loss = 0.001 ** (1 / (frequency * sustain));
    let index = 0, filtered = 0, apIn = 0, apOut = 0;
    for (let i = 0; i < length; i++) {
      const current = ring[index];
      out[i] = current;
      filtered = (1 - damping) * current + damping * filtered;
      apOut = allpass * filtered + apIn - allpass * apOut;
      apIn = filtered;
      ring[index] = apOut * loss;
      index = index + 1 === size ? 0 : index + 1;
    }

    if (!pure) addKnock(out, rate);
    for (const [type, cutoff, options] of BODY) biquad(out, type, cutoff, rate, options);

    const attack = Math.floor(rate * (pure ? 0.02 : 0.003));
    const release = Math.floor(rate * 0.12);
    const body = Math.floor(rate * LOUDNESS_WINDOW);
    let peak = 0, energy = 0;
    for (let i = 0; i < length; i++) {
      let shape = 1;
      if (i < attack) shape = 0.5 - 0.5 * Math.cos((Math.PI * i) / attack);
      if (i > length - release) shape *= (length - i) / release;
      out[i] *= shape;
      peak = Math.max(peak, Math.abs(out[i]));
      if (i < body) energy += out[i] * out[i];
    }
    const normal = Math.min(TARGET_RMS / (Math.sqrt(energy / body) || 1), MAX_PEAK / (peak || 1));
    for (let i = 0; i < length; i++) out[i] *= normal;
    return buffer;
  }
}
