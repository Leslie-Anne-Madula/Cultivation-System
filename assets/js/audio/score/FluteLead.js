import { chance } from "../../core/random.js";
import { EIGHTH, above, breathsOf, pitch } from "./composition.js";

const GAIN = 0.11;

/**
 * Arranges a melody for the bamboo flute. It breathes at each rest, flicks a
 * grace note into some rising notes, and a long phrase ending is echoed by a
 * guqin harmonic.
 */
export class FluteLead {
  constructor(flute, guqin) {
    this.flute = flute;
    this.guqin = guqin;
  }

  /** @returns {Array<{at: number, play(when: number): object | undefined}>} events timed in eighths; `play` may return a voice to stop later */
  arrange(melody) {
    const part = [];
    for (const breath of breathsOf(melody)) {
      part.push({ at: breath[0].at, play: (when) => this.flute.phrase(this.phrase(breath), { when, gain: GAIN }) });
      const last = breath[breath.length - 1];
      if (last.length >= 6) {
        part.push({ at: last.at + 4, play: (when) => this.guqin.harmonic(pitch(last.step + 12), { when, gain: 0.08, bus: "music", reverb: 0.75 }) });
      }
    }
    return part;
  }

  phrase(breath) {
    const start = breath[0].at;
    return breath.map((note, i) => ({
      frequency: pitch(note.step),
      at: (note.at - start) * EIGHTH,
      length: note.length * EIGHTH,
      grace: i > 0 && note.length >= 2 && note.step > breath[i - 1].step && chance(0.35) ? pitch(above(note.step)) : 0
    }));
  }
}
