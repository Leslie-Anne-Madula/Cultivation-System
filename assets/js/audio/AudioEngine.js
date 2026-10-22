/**
 * Owns the AudioContext and the mixing graph:
 *   sfx bus ───────────┐
 *   music bus ─> duck ──┼─> master ─> warmth ─> softening ─> limiter ─> speakers
 *   reverb ────────────┘
 * The warmth and softening filters keep every sound mellow.
 */
export class AudioEngine {
  constructor() {
    this.context = null;
    this.noise = null;
  }

  get isRunning() {
    return this.context?.state === "running";
  }

  get now() {
    return this.context.currentTime;
  }

  init() {
    if (this.context) return this.context;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    const ctx = new AudioContextClass();
    this.context = ctx;

    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.knee.value = 8;
    limiter.ratio.value = 6;
    limiter.attack.value = 0.01;
    limiter.release.value = 0.3;
    limiter.connect(ctx.destination);

    const softening = this.createFilter("highshelf", 3000, { gain: -9 });
    softening.connect(limiter);
    const warmth = this.createFilter("lowshelf", 240, { gain: 3 });
    warmth.connect(softening);

    this.master = this.createGain(1, warmth);
    this.sfx = this.createGain(0.75, this.master);
    this.duck = this.createGain(1, this.master);
    this.music = this.createGain(0, this.duck);

    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.createImpulse(3.8);
    const reverbTone = this.createFilter("lowpass", 2600, { q: 0.5 });
    this.reverb.connect(reverbTone).connect(this.createGain(0.55, this.master));

    this.noise = this.createNoise(2);
    return ctx;
  }

  async resume() {
    const ctx = this.init();
    if (!ctx) return false;
    if (ctx.state !== "running") {
      try {
        await ctx.resume();
      } catch {
        return false;
      }
    }
    return this.isRunning;
  }

  suspend() {
    if (this.isRunning) this.context.suspend();
  }

  createGain(value, destination) {
    const node = this.context.createGain();
    node.gain.value = value;
    if (destination) node.connect(destination);
    return node;
  }

  createFilter(type, frequency, { q = 0.7, gain = 0 } = {}) {
    const filter = this.context.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = q;
    filter.gain.value = gain;
    return filter;
  }

  /** Sends a voice to a bus, with an optional amount of reverb. */
  route(node, { bus = "sfx", reverb = 0.25 } = {}) {
    node.connect(this[bus]);
    if (reverb > 0) node.connect(this.createGain(reverb, this.reverb));
  }

  noiseSource({ loop = false } = {}) {
    const source = this.context.createBufferSource();
    source.buffer = this.noise;
    source.loop = loop;
    return source;
  }

  fadeMusic(target, seconds) {
    const gain = this.music.gain;
    const now = this.now;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(target, now + seconds);
  }

  /** Lowers the music briefly, then lets it swell back. */
  duckMusic(depth = 0.45, hold = 0.5) {
    const gain = this.duck.gain;
    const now = this.now;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(depth, now + 0.25);
    gain.setValueAtTime(depth, now + 0.25 + hold);
    gain.linearRampToValueAtTime(1, now + 1.6 + hold);
  }

  fadeMaster(target, seconds) {
    const gain = this.master.gain;
    const now = this.now;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(target, now + seconds);
  }

  createNoise(seconds) {
    const { sampleRate } = this.context;
    const buffer = this.context.createBuffer(1, Math.floor(sampleRate * seconds), sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  /** A hall-like tail whose highs fade faster than its lows, so it never hisses. */
  createImpulse(seconds) {
    const { sampleRate } = this.context;
    const length = Math.floor(sampleRate * seconds);
    const buffer = this.context.createBuffer(2, length, sampleRate);
    const preDelay = Math.floor(sampleRate * 0.025);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let smoothed = 0;
      for (let i = preDelay; i < length; i++) {
        const progress = i / length;
        const damping = 0.35 + 0.6 * progress;
        smoothed += (1 - damping) * (Math.random() * 2 - 1 - smoothed);
        data[i] = smoothed * (1 - progress) ** 2.4;
      }
    }
    return buffer;
  }
}
