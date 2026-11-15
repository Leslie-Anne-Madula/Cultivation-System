import { chance } from "../../core/random.js";
import { EIGHTH, SWEEP, pitch } from "./composition.js";

const PAD_LEVEL = 0.012;

/** The backing under the lead: a flowing zither figure, a soft pad, sweeps into choruses and harmonic sparkles. */
export class Accompaniment {
  constructor(engine, guqin) {
    this.engine = engine;
    this.guqin = guqin;
  }

  /** Zither figure in eighths. A bar with two chords changes halfway, on the new bass note. */
  strum(chords, figure, offset) {
    for (let i = 0; i < 8; i++) {
      const half = Math.floor((i * chords.length) / 8);
      const string = chords.length > 1 && i === 4 ? 0 : figure[i];
      if (string === null) continue;
      this.guqin.pluck(pitch(chords[half].strings[string]), {
        when: offset + i * EIGHTH + (Math.random() - 0.5) * 0.012,
        gain: (string === 0 ? 0.12 : 0.08) * (i % 4 === 0 ? 1.1 : 1) * (0.9 + Math.random() * 0.2),
        bus: "music",
        reverb: 0.45,
        pan: (string / 5 - 0.5) * 0.7
      });
    }
  }

  /** Soft string pad that swells in and lingers into the next chord. */
  pad(chord, offset, length) {
    const ctx = this.engine.context;
    const start = this.engine.now + offset;
    const end = start + length;
    const filter = this.engine.createFilter("lowpass", 900, { q: 0.4 });
    const level = this.engine.createGain(0);
    level.gain.setValueAtTime(0, start);
    level.gain.linearRampToValueAtTime(PAD_LEVEL, start + Math.min(1.2, length * 0.5));
    level.gain.setValueAtTime(PAD_LEVEL, end);
    level.gain.linearRampToValueAtTime(0, end + 1.6);
    filter.connect(level);
    this.engine.route(level, { bus: "music", reverb: 0.6 });
    for (const step of chord.pad) {
      for (const cents of [-7, 7]) {
        const tone = ctx.createOscillator();
        tone.type = "sawtooth";
        tone.frequency.value = pitch(step);
        tone.detune.value = cents;
        tone.connect(filter);
        tone.start(start);
        tone.stop(end + 1.7);
      }
    }
  }

  /** Glissando that sweeps up into the downbeat. */
  sweep(offset) {
    SWEEP.forEach((step, i) => {
      this.guqin.pluck(pitch(step), {
        when: offset - (SWEEP.length - i) * 0.05,
        gain: 0.05 + i * 0.007,
        bus: "music",
        reverb: 0.6,
        pan: -0.4 + i * 0.1
      });
    });
  }

  /** A high harmonic on the chord, like a drop of dew. */
  sparkle(chord, offset) {
    this.guqin.harmonic(pitch(chord.strings[2] + 24), {
      when: offset,
      gain: 0.1,
      bus: "music",
      reverb: 0.75,
      pan: chance(0.5) ? 0.3 : -0.3
    });
  }
}
