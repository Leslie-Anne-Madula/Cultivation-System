import { escapeHtml, frameCorners, glyph } from "../../core/dom.js";
import { icons } from "../../ui/icons.js";
import { treasureIcon, gradeColor } from "./treasureIcons.js";

/** Detail panel for the selected treasure. Calls onUnseal(treasure) to open the certificate. */
export class ItemInspector {
  constructor(element, { content }, onUnseal) {
    this.element = element;
    this.grades = content.grades;
    this.onUnseal = onUnseal;
  }

  show(treasure) {
    const grade = treasure.grade ? this.grades[treasure.grade] : null;
    this.element.style.setProperty("--grade", gradeColor(treasure));
    this.element.innerHTML = `
      ${frameCorners()}
      <div class="inspector-head">
        <span class="label">Item inspection ${glyph("鉴定")}</span>
        <h2 class="inspector-name">${escapeHtml(treasure.item)}</h2>
        <span class="grade-line">
          <span class="grade-badge">${glyph(grade ? grade.glyph : "炼")}${grade ? `${escapeHtml(grade.name)} grade` : "Still refining"}</span>
          ${grade ? `<span class="grade-meaning">${escapeHtml(grade.meaning)}</span>` : ""}
        </span>
      </div>
      ${treasure.image ? this.certificate(treasure) : this.cauldron(treasure)}
      <dl class="facts">
        <div><dt>Certificate</dt><dd>${escapeHtml(treasure.title)}</dd></div>
        <div><dt>Issued by</dt><dd>${escapeHtml(treasure.issuer)}</dd></div>
        <div><dt>Obtained</dt><dd>${escapeHtml(treasure.date)}</dd></div>
        <div><dt>Effect</dt><dd>${escapeHtml(treasure.effect)}</dd></div>
      </dl>
      <div class="inspector-actions">
        ${treasure.image ? '<button class="btn solid" type="button" data-unseal data-sound="unseal">Unseal certificate</button>' : ""}
        ${treasure.pdf ? `<a class="btn" href="${escapeHtml(treasure.pdf)}" target="_blank" rel="noopener">Original PDF</a>` : ""}
        ${treasure.verify ? `<a class="link-ink" href="${escapeHtml(treasure.verify)}" target="_blank" rel="noopener">Verify online ${icons.arrow}</a>` : ""}
      </div>`;
    this.element.querySelectorAll("[data-unseal]").forEach((button) => button.addEventListener("click", () => this.onUnseal(treasure)));
  }

  certificate(treasure) {
    return `
      <button class="certificate-frame" type="button" data-unseal data-sound="unseal" aria-label="Unseal the certificate: ${escapeHtml(treasure.title)}">
        <img src="${escapeHtml(treasure.image)}" alt="Certificate: ${escapeHtml(treasure.title)}" loading="lazy">
        <span class="hint">Unseal</span>
      </button>`;
  }

  cauldron(treasure) {
    return `<div class="cauldron">${treasureIcon(treasure)}<div class="meter" aria-hidden="true"><span></span></div><span class="label">Refining in the cauldron</span></div>`;
  }
}
