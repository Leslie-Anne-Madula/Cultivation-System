/** D major pentatonic, D3 to D5. */
const SCALE = [146.83, 164.81, 185.0, 220.0, 246.94, 293.66, 329.63, 369.99, 440.0, 493.88, 587.33];
const LOWEST = 2;
const HIGHEST = 9;
const STEPS = [-2, -1, -1, 1, 1, 2];
const NOTE_LENGTHS = [0.8, 1.0, 1.2, 1.6, 2.0];
const LOOKAHEAD = 1.5;

const pick = (list) => list[Math.floor(Math.random() * list.length)];

/**
 * Generative background music in the manner of a guqin meditation:
 * a low drone, distant wind and slow phrases with long silences between them.
 */
export class AmbientScore {
  constructor(engine, guqin) {
    this.engine = engine;
    this.guqin = guqin;
    this.playing = false;
    this.voices = [];
  }

  start() {
    if (this.playing) return;
    this.playing = true;
    this.position = 5;
    this.notesLeft = 0;
    this.nextAt = this.engine.now + 2;
    this.startDrone();
    this.startWind();
    this.engine.fadeMusic(0.62, 6);
    this.timer = setInterval(() => this.schedule(), 250);
  }

  stop() {
    if (!this.playing) return;
    this.playing = false;
    clearInterval(this.timer);
    this.engine.fadeMusic(0, 1.5);
    const stopAt = this.engine.now + 1.7;
    this.voices.forEach((voice) => voice.stop(stopAt));
    this.voices = [];
  }

  schedule() {
    const now = this.engine.now;
    if (this.nextAt < now - 0.1) this.nextAt = now + 0.5;
    while (this.nextAt < now + LOOKAHEAD) this.nextAt += this.playStep(this.nextAt - now);
  }

  playStep(offset) {
    if (this.notesLeft <= 0) {
      this.notesLeft = 3 + Math.floor(Math.random() * 3);
      if (Math.random() < 0.15) this.glissando(offset);
      return 0.6;
    }

    let next = this.position + pick(STEPS);
    if (next < LOWEST || next > HIGHEST) next = this.position - Math.sign(next - this.position);
    this.position = next;
    this.notesLeft -= 1;
    const isLast = this.notesLeft === 0;
    const frequency = SCALE[this.position];

    if (!isLast && Math.random() < 0.18) {
      this.guqin.harmonic(frequency * 2, { when: offset, gain: 0.1, decay: 3.2, bus: "music", reverb: 0.7 });
    } else {
      this.guqin.pluck(frequency, {
        when: offset,
        gain: isLast ? 0.36 : 0.26 + Math.random() * 0.07,
        bus: "music",
        reverb: 0.6,
        vibrato: isLast ? 0.004 : 0,
        slide: isLast && Math.random() < 0.35 ? 0.02 : 0,
        pan: (Math.random() - 0.5) * 0.4
      });
    }
    if (isLast && Math.random() < 0.4) {
      this.guqin.pluck(SCALE[Math.max(0, this.position - 5)], { when: offset + 0.04, gain: 0.2, bus: "music", reverb: 0.6 });
    }
    return isLast ? 5 + Math.random() * 4 : pick(NOTE_LENGTHS);
  }

  glissando(offset) {
    const first = Math.max(0, this.position - 3);
    for (let i = 0; i < 4; i++) {
      this.guqin.pluck(SCALE[first + i], { when: offset + i * 0.09, gain: 0.12 + i * 0.025, bus: "music", reverb: 0.6 });
    }
  }

  startDrone() {
    const ctx = this.engine.context, start = this.engine.now;
    const filter = this.engine.createFilter("lowpass", 380, { q: 0.5 });
    const level = this.engine.createGain(0.05);
    filter.connect(level);
    this.engine.route(level, { bus: "music", reverb: 0.4 });

    for (const [frequency, amount] of [[73.42, 1], [110, 0.5], [146.83, 0.25]]) {
      const tone = ctx.createOscillator();
      tone.frequency.value = frequency;
      tone.connect(this.engine.createGain(amount)).connect(filter);
      tone.start(start);
      this.voices.push(tone);
    }

    const swell = ctx.createOscillator();
    swell.frequency.value = 0.06;
    swell.connect(this.engine.createGain(0.02)).connect(level.gain);
    swell.start(start);
    this.voices.push(swell);
  }

  startWind() {
    const ctx = this.engine.context, start = this.engine.now;
    const air = this.engine.noiseSource({ loop: true });
    const band = this.engine.createFilter("bandpass", 420, { q: 0.5 });
    const level = this.engine.createGain(0.045);
    air.connect(band).connect(level);
    this.engine.route(level, { bus: "music", reverb: 0.25 });

    const sweep = ctx.createOscillator();
    sweep.frequency.value = 0.04;
    sweep.connect(this.engine.createGain(180)).connect(band.frequency);

    const gust = ctx.createOscillator();
    gust.frequency.value = 0.09;
    gust.connect(this.engine.createGain(0.025)).connect(level.gain);

    for (const node of [air, sweep, gust]) {
      node.start(start);
      this.voices.push(node);
    }
  }
}
