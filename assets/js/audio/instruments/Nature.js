const TWO_PI = 2 * Math.PI;

/** Mountain ambience: a brook running over stones, wind and small birds calling in the distance. */
export class Nature {
  constructor(engine) {
    this.engine = engine;
    this.water = null;
  }

  /** Starts the brook looping and returns its source. */
  brook({ gain = 0.06, reverb = 0.15 } = {}) {
    const source = this.engine.context.createBufferSource();
    source.buffer = this.water ??= this.renderBrook(7);
    source.loop = true;
    const level = this.engine.createGain(gain);
    source.connect(level);
    this.engine.route(level, { bus: "music", reverb });
    source.start(this.engine.now);
    return source;
  }

  /** Starts a slow, gusting wind and returns a handle that stops it. */
  wind({ gain = 0.03, reverb = 0.25 } = {}) {
    const ctx = this.engine.context, start = this.engine.now;
    const air = this.engine.noiseSource({ loop: true });
    const band = this.engine.createFilter("bandpass", 420, { q: 0.5 });
    const level = this.engine.createGain(gain);
    air.connect(band).connect(level);
    this.engine.route(level, { bus: "music", reverb });

    const sweep = ctx.createOscillator();
    sweep.frequency.value = 0.04;
    sweep.connect(this.engine.createGain(180)).connect(band.frequency);

    const gust = ctx.createOscillator();
    gust.frequency.value = 0.09;
    gust.connect(this.engine.createGain(gain * 0.6)).connect(level.gain);

    const nodes = [air, sweep, gust];
    nodes.forEach((node) => node.start(start));
    return { stop: (at) => nodes.forEach((node) => node.stop(at)) };
  }

  /** One call of two to five chirps that all rise or all fall. */
  bird({ when = 0, gain = 0.06, pan = 0, reverb = 0.6 } = {}) {
    const ctx = this.engine.context;
    let t = this.engine.now + Math.max(0, when);
    const pitch = 2400 * 2 ** (Math.random() * 0.6);
    const sweep = Math.random() < 0.5 ? 1.3 : 0.75;
    const output = this.engine.createGain(gain);
    this.engine.route(output, { bus: "music", reverb, pan });

    const chirps = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < chirps; i++) {
      const length = 0.05 + Math.random() * 0.06;
      const from = pitch * (0.92 + Math.random() * 0.16);
      const tone = ctx.createOscillator();
      tone.frequency.setValueAtTime(from, t);
      tone.frequency.exponentialRampToValueAtTime(from * sweep, t + length);
      const envelope = ctx.createGain();
      envelope.gain.setValueAtTime(0.0001, t);
      envelope.gain.exponentialRampToValueAtTime(1, t + 0.012);
      envelope.gain.exponentialRampToValueAtTime(0.0001, t + length);
      tone.connect(envelope).connect(output);
      tone.start(t);
      tone.stop(t + length + 0.02);
      t += length + 0.05 + Math.random() * 0.05;
    }
  }

  /** A seamless loop of running water: a swaying rush with bubbles rising through it. */
  renderBrook(seconds) {
    const ctx = this.engine.context;
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * seconds);
    const seam = Math.floor(rate * 0.5);
    const buffer = ctx.createBuffer(2, length, rate);
    for (let channel = 0; channel < 2; channel++) {
      const water = new Float32Array(length + seam);
      let bright = 0, dark = 0;
      const phase = Math.random() * TWO_PI;
      for (let i = 0; i < water.length; i++) {
        const t = i / rate;
        const white = Math.random() * 2 - 1;
        bright += 0.25 * (white - bright);
        dark += 0.04 * (white - dark);
        water[i] = (bright - dark) * (1 + 0.3 * Math.sin(TWO_PI * 0.7 * t + phase) + 0.2 * Math.sin(TWO_PI * 1.3 * t));
      }
      for (let b = 0; b < seconds * 30; b++) {
        const at = Math.floor(Math.random() * water.length);
        const base = 400 * 2 ** (Math.random() * 2.2);
        const fade = rate * (0.003 + Math.random() * 0.01);
        const size = Math.min(Math.floor(fade * 6), water.length - at);
        const amount = 0.05 + 0.25 * Math.random() ** 3;
        let angle = 0;
        for (let i = 0; i < size; i++) {
          angle += (TWO_PI * base * (1 + (0.5 * i) / size)) / rate;
          water[at + i] += amount * Math.sin(angle) * Math.min(1, i / (rate * 0.001)) * Math.exp(-i / fade);
        }
      }
      const data = buffer.getChannelData(channel);
      let energy = 0, peak = 0;
      for (let i = 0; i < length; i++) {
        const blend = i < seam ? i / seam : 1;
        data[i] = i < seam ? water[i] * Math.sqrt(blend) + water[length + i] * Math.sqrt(1 - blend) : water[i];
        energy += data[i] * data[i];
        peak = Math.max(peak, Math.abs(data[i]));
      }
      const normal = Math.min(0.25 / Math.sqrt(energy / length), 0.95 / peak);
      for (let i = 0; i < length; i++) data[i] *= normal;
    }
    return buffer;
  }
}
