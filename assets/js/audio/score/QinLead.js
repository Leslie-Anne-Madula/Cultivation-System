import { chance, pick } from "../../core/random.js";
import { EIGHTH, pitch } from "./composition.js";

const GAIN = 0.32;

/**
 * Arranges a melody for the guqin. It slides into phrase openings, sometimes
 * slides on to the next note instead of plucking it, and bends held endings
 * with vibrato.
 */
export class QinLead {
  constructor(guqin) {
    this.guqin = guqin;
  }

  /** @returns {Array<{at: number, play(when: number): void}>} events timed in eighths */
  arrange(melody) {
    const part = [];
    for (let i = 0; i < melody.length; i++) {
      const note = melody[i], previous = melody[i - 1], next = melody[i + 1];
      const opens = !previous || previous.at + previous.length < note.at;
      const joined = next && next.at === note.at + note.length;
      const slides = joined && note.length >= 2 && Math.abs(next.step - note.step) <= 3 && chance(0.35);
      const options = {
        gain: GAIN,
        bus: "music",
        reverb: 0.5,
        ornament: opens && chance(0.6) ? "chuo" : !joined && note.length >= 3 ? pick(["yin", "yin", "nao"]) : undefined,
        slideTo: slides ? pitch(next.step) : 0,
        slideAt: note.length * EIGHTH - 0.2
      };
      part.push({ at: note.at, play: (when) => this.guqin.pluck(pitch(note.step), { ...options, when }) });
      if (slides) i += 1;
    }
    return part;
  }
}
