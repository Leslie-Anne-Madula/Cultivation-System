import { AudioEngine } from "./AudioEngine.js";
import { Effects } from "./instruments/Effects.js";
import { Guqin } from "./instruments/Guqin.js";
import { SingingBowl } from "./instruments/SingingBowl.js";
import { AmbientScore } from "./score/AmbientScore.js";

const STORE_KEY = "sound";
/** D major pentatonic, D3 to B4: the middle of the qin's range. */
const NOTES = [146.83, 164.81, 185.0, 220.0, 246.94, 293.66, 329.63, 369.99, 440.0, 493.88];
const OCTAVE = 5;
const HOVER_GAP_MS = 120;

/**
 * Public sound API. Click sounds are declarative: any link or button plays
 * the cue named in its data-sound attribute ("tap" when absent, "none" to mute).
 * Elements with data-hover-note="n" pluck note n on hover.
 */
export class SoundManager {
  constructor({ storage, bus }) {
    this.storage = storage;
    this.bus = bus;
    this.engine = new AudioEngine();
    this.enabled = storage.read(STORE_KEY, false);
    this.lastHover = null;
    this.lastHoverAt = 0;
    this.cues = this.createCues();
    this.listen();
    if (this.enabled) this.unlock();
  }

  get isEnabled() {
    return this.enabled;
  }

  async toggle() {
    await this.setEnabled(!this.enabled);
  }

  async setEnabled(enabled) {
    this.enabled = enabled;
    this.storage.write(STORE_KEY, enabled);
    this.bus.emit("sound:change", enabled);
    if (enabled) {
      if (await this.unlock()) this.play("enable");
    } else {
      this.score?.stop();
    }
  }

  async unlock() {
    if (!(await this.engine.resume())) return false;
    this.prepareInstruments();
    if (this.enabled) this.score.start();
    return true;
  }

  prepareInstruments() {
    if (this.guqin) return;
    this.guqin = new Guqin(this.engine);
    this.bowl = new SingingBowl(this.engine);
    this.effects = new Effects(this.engine);
    this.score = new AmbientScore(this.engine, this.guqin);
    this.guqin.prepare(NOTES);
  }

  /** Fades out when the browser tab is hidden and back in when it returns, instead of cutting off. */
  async onVisibilityChange() {
    if (!this.engine.context) return;
    clearTimeout(this.suspendTimer);
    if (document.hidden) {
      if (!this.engine.isRunning) return;
      this.engine.fadeMaster(0, 0.4);
      this.suspendTimer = setTimeout(() => document.hidden && this.engine.suspend(), 450);
    } else if (this.enabled && (await this.engine.resume())) {
      this.engine.fadeMaster(1, 0.9);
    }
  }

  play(cue, options = {}) {
    if (!this.enabled || !this.engine.isRunning || !this.guqin) return;
    this.cues[cue]?.(options);
  }

  note(index) {
    return NOTES[((index % NOTES.length) + NOTES.length) % NOTES.length];
  }

  /** Cuo: a note and its octave plucked together. */
  cuo(index, { when = 0, gain = 0.22 } = {}) {
    this.guqin.pluck(this.note(index), { when, gain });
    this.guqin.pluck(this.note(index + OCTAVE), { when: when + 0.015, gain: gain * 0.75 });
  }

  createCues() {
    return {
      tap: () => this.guqin.pluck(this.note(Math.random() < 0.5 ? 0 : 2), { gain: 0.2, damp: 0.6, reverb: 0.3 }),
      hover: ({ index = 0 }) => this.guqin.pluck(this.note(index), { gain: 0.12, damp: 1.4, reverb: 0.45 }),
      select: ({ index = 0 }) => {
        this.guqin.pluck(this.note(index), { gain: 0.34, ornament: "yin" });
        this.guqin.pluck(this.note(index + 2), { when: 0.12, gain: 0.18 });
      },
      notify: () => {
        this.guqin.harmonic(587.33, { gain: 0.17 });
        this.guqin.harmonic(880.0, { when: 0.16, gain: 0.1 });
      },
      quest: () => {
        this.guqin.pluck(this.note(2), { gain: 0.26 });
        this.guqin.pluck(this.note(4), { when: 0.14, gain: 0.26 });
        this.guqin.pluck(this.note(5), { when: 0.28, gain: 0.3, ornament: "nao" });
        this.guqin.harmonic(880.0, { when: 0.6, gain: 0.11 });
      },
      turn: () => {
        this.engine.duckMusic(0.5, 0.7);
        this.effects.paper({ gain: 0.55 });
        this.guqin.pluck(this.note(0), { when: 0.42, gain: 0.18, damp: 2 });
      },
      open: () => {
        this.effects.paper({ gain: 0.3, rate: 1.25 });
        this.cuo(0);
      },
      unseal: () => {
        this.effects.paper({ gain: 0.34, rate: 0.85 });
        this.effects.paper({ when: 0.22, gain: 0.22, rate: 0.75 });
        this.cuo(0, { gain: 0.24 });
        this.guqin.pluck(this.note(7), { when: 0.35, gain: 0.2, slideTo: this.note(8), slideAt: 0.4 });
        this.guqin.harmonic(587.33, { when: 0.9, gain: 0.12 });
      },
      stamp: () => this.effects.thud({ gain: 0.38 }),
      theme: () => {
        this.bowl.strike(293.66, { gain: 0.16 });
        this.guqin.pluck(this.note(2), { when: 0.14, gain: 0.2 });
      },
      sun: () => {
        this.bowl.strike(440.0, { gain: 0.14 });
        this.guqin.harmonic(880.0, { when: 0.2, gain: 0.09 });
      },
      enable: () => {
        this.guqin.pluck(this.note(2), { gain: 0.3 });
        this.guqin.pluck(this.note(5), { when: 0.18, gain: 0.26, ornament: "chuo" });
      }
    };
  }

  listen() {
    const unlockOnGesture = () => {
      if (this.enabled && !this.engine.isRunning) this.unlock();
    };
    document.addEventListener("pointerdown", unlockOnGesture, true);
    document.addEventListener("keydown", unlockOnGesture, true);

    document.addEventListener("click", (event) => {
      const target = event.target.closest("a[href], button, [role='button'], [data-sound]");
      if (!target) return;
      const cue = target.dataset.sound ?? "tap";
      if (cue !== "none") this.play(cue, { index: Number(target.dataset.soundIndex) || 0 });
    });

    document.addEventListener("pointerover", (event) => {
      const target = event.target.closest("[data-hover-note]");
      if (target === this.lastHover) return;
      this.lastHover = target;
      const now = performance.now();
      if (!target || now - this.lastHoverAt < HOVER_GAP_MS) return;
      this.lastHoverAt = now;
      this.play("hover", { index: Number(target.dataset.hoverNote) });
    });

    document.addEventListener("visibilitychange", () => this.onVisibilityChange());

    this.bus.on("toast", ({ cue }) => this.play(cue));
  }
}
