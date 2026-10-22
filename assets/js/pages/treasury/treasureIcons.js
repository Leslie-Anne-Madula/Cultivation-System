import { escapeHtml } from "../../core/dom.js";

const glyphText = (character, y, className = "glyph") => `<text class="${className}" x="50" y="${y}" translate="no">${escapeHtml(character)}</text>`;

const FORMS = {
  pendant: (g) => `
    <path class="stroke" d="M50 3 V16"/><circle class="body" cx="50" cy="44" r="28"/><circle class="line" cx="50" cy="44" r="22"/>${glyphText(g, 54)}
    <path class="stroke" d="M50 72 V79"/><circle class="knot" cx="50" cy="81.5" r="3"/><path class="tassel" d="M50 84 L45 98 M50 84 V99 M50 84 L55 98"/>`,
  slip: (g) => `
    <rect class="body" x="33" y="8" width="34" height="84" rx="5"/><path class="line" d="M38 18 H62 M38 22 H62 M38 78 H62 M38 82 H62"/>${glyphText(g, 61)}
    <path class="tassel" d="M50 92 V99"/>`,
  talisman: (g) => `
    <path class="body paper" d="M31 6 H69 V92 L60 86 L50 93 L40 86 L31 92 Z"/><path class="charm" d="M39 16 q11 7 22 0 M40 24 H60 M42 74 q8 -8 16 0 q-4 7 -8 10"/>${glyphText(g, 60, "glyph red")}`,
  token: (g) => `
    <circle class="line strong" cx="50" cy="11" r="5"/><path class="body" d="M27 19 H73 L77 29 V77 Q77 91 50 96 Q23 91 23 77 V29 Z"/>
    <path class="line" d="M31 27 H69 V75 Q69 86 50 89 Q31 86 31 75 Z"/>${glyphText(g, 66)}`,
  scroll: (g) => `
    <rect class="body" x="18" y="26" width="64" height="48"/><path class="line" d="M24 34 H76 M24 66 H76"/>
    <rect class="roller" x="9" y="19" width="10" height="62" rx="4"/><rect class="roller" x="81" y="19" width="10" height="62" rx="4"/>${glyphText(g, 61)}`,
  pill: (g) => `
    <path class="smoke stroke" d="M42 30 q-6 -8 0 -14 q6 -6 0 -12"/><path class="smoke stroke" d="M58 30 q6 -8 0 -14 q-6 -6 0 -12"/>
    <path class="stroke" d="M20 40 Q19 33 26 35 M80 40 Q81 33 74 35"/><path class="stroke" d="M21 44 H79"/>
    <path class="body" d="M25 44 Q23 81 50 83 Q77 81 75 44 Z"/><path class="stroke thick" d="M33 80 L28 95 M67 80 L72 95 M50 83 V96"/>${glyphText(g, 72)}`
};

export function treasureIcon({ form, glyph }) {
  const draw = FORMS[form] ?? FORMS.token;
  return `<svg class="item-icon" viewBox="0 0 100 100" aria-hidden="true">${draw(glyph)}</svg>`;
}

export function gradeColor(treasure) {
  return treasure.grade ? `var(--g-${treasure.grade})` : "var(--ink-3)";
}
