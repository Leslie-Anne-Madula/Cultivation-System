/**
 * What the background music plays: tempo, chords, accompaniment figures,
 * melodies and the order of sections. Pitches are written as steps:
 * semitones above or below D4.
 */
export const TEMPO = 84;
export const EIGHTH = 30 / TEMPO;
export const BAR = EIGHTH * 8;

const D4 = 293.66;
const PENTATONIC = [0, 2, 4, 7, 9];

export const pitch = (step) => D4 * 2 ** (step / 12);

/** The next pentatonic step above `step`, for grace notes. */
export function above(step) {
  const octave = Math.floor(step / 12) * 12;
  const degree = PENTATONIC.find((offset) => octave + offset > step);
  return octave + (degree ?? 12);
}

/** `strings` feed the flowing zither figures, bass first; `pad` is the soft chord held underneath. */
export const CHORDS = {
  D: { strings: [-12, -5, 0, 2, 4, 7], pad: [-5, 0, 4] },
  Bm: { strings: [-15, -8, -3, 0, 4, 7], pad: [-3, 0, 4] },
  G: { strings: [-19, -12, -5, -3, 0, 4], pad: [-7, -3, 0] },
  A: { strings: [-17, -10, -5, -3, 0, 2], pad: [-5, -3, 2] },
  "F#m": { strings: [-20, -13, -8, -5, 2, 4], pad: [-8, -5, 2] }
};

/** Accompaniment figures: one string index per eighth note, null for a rest. */
export const FIGURES = {
  flow: [0, 1, 2, 4, 5, 4, 2, 1],
  ripple: [0, 2, 3, 2, 4, 2, 5, 3],
  sparse: [0, null, 2, null, 4, 5, null, 3]
};

/** Zither glissando that sweeps up into a chorus. */
export const SWEEP = [0, 2, 4, 7, 9, 12, 14, 16, 19];

/** Melodies as bars of [step, eighths] pairs; a null step is a rest, where the flute breathes. */
const VERSES = [
  [
    [[7, 2], [12, 2], [14, 1], [16, 3]],
    [[14, 2], [12, 1], [9, 1], [12, 3], [null, 1]],
    [[9, 2], [12, 1], [14, 1], [12, 2], [9, 2]],
    [[7, 6], [null, 2]],
    [[7, 2], [12, 2], [14, 1], [16, 3]],
    [[19, 2], [16, 1], [14, 1], [16, 3], [null, 1]],
    [[14, 2], [12, 1], [9, 1], [12, 2], [14, 2]],
    [[12, 6], [null, 2]]
  ],
  [
    [[16, 2], [14, 1], [12, 1], [14, 2], [16, 2]],
    [[19, 3], [16, 1], [14, 3], [null, 1]],
    [[12, 2], [14, 1], [12, 1], [9, 2], [7, 2]],
    [[9, 6], [null, 2]],
    [[16, 2], [14, 1], [12, 1], [14, 2], [16, 2]],
    [[21, 3], [19, 1], [16, 3], [null, 1]],
    [[14, 2], [12, 2], [9, 1], [12, 1], [14, 2]],
    [[12, 6], [null, 2]]
  ]
];

const CHORUSES = [
  [
    [[12, 3], [9, 1], [12, 2], [14, 2]],
    [[14, 3], [7, 1], [9, 2], [12, 1], [null, 1]],
    [[7, 3], [4, 1], [7, 2], [9, 2]],
    [[9, 2], [12, 4], [null, 2]],
    [[12, 3], [9, 1], [12, 2], [14, 2]],
    [[16, 3], [14, 1], [12, 2], [14, 1], [null, 1]],
    [[16, 2], [19, 2], [21, 1], [19, 3]],
    [[16, 2], [14, 2], [12, 3], [null, 1]]
  ],
  [
    [[9, 2], [12, 2], [14, 2], [16, 2]],
    [[19, 4], [16, 2], [14, 1], [null, 1]],
    [[16, 3], [19, 1], [16, 2], [14, 2]],
    [[12, 2], [14, 2], [16, 3], [null, 1]],
    [[9, 2], [12, 2], [14, 2], [16, 2]],
    [[19, 3], [21, 1], [19, 2], [16, 1], [null, 1]],
    [[14, 2], [16, 2], [19, 4]],
    [[16, 2], [14, 2], [12, 3], [null, 1]]
  ]
];

/** Flattens bars into notes timed in eighths from the start of the section. */
function notesOf(bars) {
  const notes = [];
  let at = 0;
  for (const [step, length] of bars.flat()) {
    if (step !== null) notes.push({ step, at, length });
    at += length;
  }
  return notes;
}

/** Splits a melody into breaths at each rest. */
export function breathsOf(notes) {
  const breaths = [];
  for (const [i, note] of notes.entries()) {
    const previous = notes[i - 1];
    if (!previous || previous.at + previous.length < note.at) breaths.push([]);
    breaths[breaths.length - 1].push(note);
  }
  return breaths;
}

/**
 * Each section lists its chords, one per bar (a pair splits the bar), its
 * accompaniment figure and the section that follows. Sections with melodies
 * pick one at random each time and hand it to the next lead in `leads`.
 */
export const SECTIONS = {
  intro: { chords: ["G", "A"], figure: "flow", next: "verse" },
  verse: {
    chords: ["D", "Bm", "G", "A", "D", "Bm", ["G", "A"], "D"],
    figure: "sparse",
    melodies: VERSES.map(notesOf),
    leads: ["flute"],
    next: "chorus"
  },
  chorus: {
    chords: ["G", "A", "F#m", "Bm", "G", "A", "D", "D"],
    figure: "flow",
    melodies: CHORUSES.map(notesOf),
    leads: ["guqin", "flute"],
    sweep: true,
    next: "interlude"
  },
  interlude: { chords: ["D", "Bm", "G", "A"], figure: "ripple", sparkle: true, next: "verse" }
};

/** Every open-string step the score plucks, so the guqin can render them ahead of time. */
export const STRING_STEPS = [
  ...new Set([
    ...Object.values(CHORDS).flatMap((chord) => chord.strings),
    ...SWEEP,
    ...Object.values(SECTIONS).flatMap((section) => (section.melodies ?? []).flat().map((note) => note.step))
  ])
];
