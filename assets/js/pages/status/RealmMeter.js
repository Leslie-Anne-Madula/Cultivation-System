import { escapeHtml, formatDate, glyph } from "../../core/dom.js";

export class RealmMeter {
  constructor(element, { content, realm }) {
    this.element = element;
    this.info = content.realm;
    this.realm = realm;
  }

  render() {
    const { info, realm } = this;
    const progress = realm.progress;
    const percent = Math.round(progress);
    const stages = realm.segments.map(({ from, to, stage }) => {
      const active = progress > from && progress <= to;
      return `<span class="${active ? "active" : ""}">${glyph(stage.glyph)}<span class="en">${escapeHtml(stage.name.replace(" Stage", ""))}</span></span>`;
    }).join("");
    const monthYear = { month: "short", year: "numeric" };

    this.element.innerHTML = `
      <div class="realm-meter-top">
        <h2 class="h3">${glyph(info.glyph)} ${escapeHtml(info.name)} · ${escapeHtml(realm.isReadyToBreakThrough ? "Peak" : realm.stage.name)}</h2>
        <span class="percent tabular">${percent}%</span>
      </div>
      <div class="meter" role="progressbar" aria-label="Core refinement" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><span></span></div>
      <div class="meter-stages">${stages}</div>
      <small>Core refinement follows the BSIT program from ${formatDate(info.programStart, monthYear)} to an expected ${formatDate(info.programEnd, monthYear)}. Next breakthrough: ${escapeHtml(info.next)} ${glyph(info.nextGlyph)}, through an ${escapeHtml(info.breakthrough)}.</small>`;
    requestAnimationFrame(() => setTimeout(() => (this.element.querySelector(".meter span").style.width = `${progress}%`), 120));
  }
}
