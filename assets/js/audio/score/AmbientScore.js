import { pick } from "../../core/random.js";
import { BambooFlute } from "../instruments/BambooFlute.js";
import { Nature } from "../instruments/Nature.js";
import { Accompaniment } from "./Accompaniment.js";
import { BAR, CHORDS, EIGHTH, FIGURES, SECTIONS, STRING_STEPS, pitch } from "./composition.js";
import { FluteLead } from "./FluteLead.js";
import { QinLead } from "./QinLead.js";

const LOOKAHEAD = 1.5;

/**
 * Plays the composition as generative background music for a bright morning
 * in the mountains: a lead over the accompaniment, with a brook, wind and
 * distant birds beneath. Bars are scheduled a moment ahead on the audio clock.
 * The sections and what they contain live in composition.js.
 */
export class AmbientScore {
  constructor(engine, guqin) {
    this.engine = engine;
    this.guqin = guqin;
    this.nature = new Nature(engine);
    this.band = new Accompaniment(engine, guqin);
    this.leads = { flute: new FluteLead(new BambooFlute(engine), guqin), guqin: new QinLead(guqin) };
    this.visits = {};
    this.playing = false;
    this.voices = [];
  }

  start() {
    if (this.playing) return;
    this.playing = true;
    this.enter("intro");
    this.barAt = this.engine.now + 2.5;
    this.birdAt = this.engine.now + 5 + Math.random() * 5;
    this.voices.push(this.nature.brook(), this.nature.wind());
    this.guqin.prepare(STRING_STEPS.map(pitch));
    this.engine.fadeMusic(0.62, 4);
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
    if (this.barAt < now - 0.1) this.barAt = now + 0.5;
    while (this.barAt < now + LOOKAHEAD) {
      this.playBar(this.barAt - now);
      this.barAt += BAR;
    }
    if (this.birdAt < now + LOOKAHEAD) {
      this.nature.bird({ when: this.birdAt - now, pan: (Math.random() - 0.5) * 1.4 });
      this.birdAt = Math.max(this.birdAt, now) + 7 + Math.random() * 12;
    }
    this.voices = this.voices.filter((voice) => !(voice.end < now));
  }

  /** Starts a section and, if it has melodies, arranges one for the lead whose turn it is. */
  enter(name) {
    const section = SECTIONS[name];
    const visit = (this.visits[name] = (this.visits[name] ?? 0) + 1);
    this.section = section;
    this.bar = 0;
    this.part = section.melodies ? this.leads[section.leads[(visit - 1) % section.leads.length]].arrange(pick(section.melodies)) : [];
  }

  playBar(offset) {
    const { section, bar } = this;
    const chords = [section.chords[bar]].flat().map((name) => CHORDS[name]);
    const span = BAR / chords.length;
    this.band.strum(chords, FIGURES[section.figure], offset);
    chords.forEach((chord, half) => this.band.pad(chord, offset + half * span, span));
    if (section.sweep && bar === 0) this.band.sweep(offset);
    if (section.sparkle) this.band.sparkle(chords[0], offset);

    const from = bar * 8;
    for (const event of this.part) {
      if (event.at < from || event.at >= from + 8) continue;
      const voice = event.play(offset + (event.at - from) * EIGHTH);
      if (voice) this.voices.push(voice);
    }
    this.bar += 1;
    if (this.bar === section.chords.length) this.enter(section.next);
  }
}
