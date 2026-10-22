import { createSvg, escapeHtml, frameCorners, glyph } from "../../core/dom.js";

const SIZE = 400, CENTRE = 200, RADIUS = 140;
const ARC_GAP = (15 * Math.PI) / 180;

/** The Five Elements wheel and the technique manual for the chosen element. */
export class ElementWheel {
  constructor({ wheel, manual, caption }, { content, quests }) {
    Object.assign(this, { wheel, manual, caption, quests });
    this.elements = content.elements;
    this.cycle = content.cycle;
    this.mastery = content.mastery;
    this.defaultKey = content.defaultElement;
    this.defaultCaption = caption.textContent;
  }

  angle(index) {
    return ((-90 + (index * 360) / this.elements.length) * Math.PI) / 180;
  }

  point(index, radius = RADIUS) {
    return [CENTRE + Math.cos(this.angle(index)) * radius, CENTRE + Math.sin(this.angle(index)) * radius];
  }

  render() {
    this.renderDiagram();
    this.buttons = this.elements.map((element, index) => this.renderNode(element, index));
    this.select(this.elements.findIndex((element) => element.key === this.defaultKey), false);
  }

  renderDiagram() {
    const svg = createSvg("svg", { viewBox: `0 0 ${SIZE} ${SIZE}`, "aria-hidden": "true" }, this.wheel);
    createSvg("circle", { class: "ring", cx: CENTRE, cy: CENTRE, r: RADIUS }, svg);
    createSvg("circle", { class: "flow", cx: CENTRE, cy: CENTRE, r: RADIUS }, svg);
    const star = [0, 2, 4, 1, 3].map((i) => this.point(i).join(",")).join(" ");
    createSvg("polygon", { class: "star", points: star }, svg);
    const centre = createSvg("text", { class: "centre", x: CENTRE, y: CENTRE + 15, "text-anchor": "middle", translate: "no" }, svg);
    centre.textContent = "五行";

    this.elements.forEach((element, index) => {
      const nextIndex = (index + 1) % this.elements.length;
      const start = this.angle(index) + ARC_GAP;
      const end = this.angle(nextIndex) - ARC_GAP + (nextIndex === 0 ? Math.PI * 2 : 0);
      const d = `M ${CENTRE + Math.cos(start) * RADIUS} ${CENTRE + Math.sin(start) * RADIUS} A ${RADIUS} ${RADIUS} 0 0 1 ${CENTRE + Math.cos(end) * RADIUS} ${CENTRE + Math.sin(end) * RADIUS}`;
      const hit = createSvg("path", { class: "arc-hit", d, "data-hover-note": index + 2 }, svg);
      createSvg("path", { class: "arc", d }, svg);
      const text = this.cycle[`${element.key}-${this.elements[nextIndex].key}`] ?? this.defaultCaption;
      hit.addEventListener("mouseenter", () => (this.caption.textContent = text));
      hit.addEventListener("mouseleave", () => (this.caption.textContent = this.defaultCaption));
    });
  }

  renderNode(element, index) {
    const [x, y] = this.point(index);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "element-node";
    button.style.left = `${(x / SIZE) * 100}%`;
    button.style.top = `${(y / SIZE) * 100}%`;
    button.style.setProperty("--element", `var(--e-${element.key})`);
    button.dataset.sound = "select";
    button.dataset.soundIndex = index * 2;
    button.dataset.hoverNote = index * 2;
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-label", `${element.name}: ${element.domain}`);
    button.innerHTML = `${glyph(element.glyph)}<small>${escapeHtml(element.name)}</small><span class="node-tag">${escapeHtml(element.tag)}</span>`;
    button.addEventListener("click", () => this.select(index, true));
    this.wheel.appendChild(button);
    return button;
  }

  select(index, byVisitor) {
    const element = this.elements[index];
    this.buttons.forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
    this.manual.style.setProperty("--element", `var(--e-${element.key})`);
    this.manual.innerHTML = `
      ${frameCorners()}
      <div class="manual-head">
        ${glyph(element.glyph, "manual-glyph")}
        <div>
          <span class="label">${escapeHtml(element.name)} element</span>
          <h3 class="h3">${escapeHtml(element.domain)}</h3>
          <p>${escapeHtml(element.text)}</p>
        </div>
      </div>
      <ul class="technique-list">${element.techniques.map((technique) => this.technique(technique)).join("")}</ul>
      <div class="mastery-legend">${this.mastery.map((m) => `<span>${glyph(m.glyph)}${escapeHtml(m.name)}</span>`).join("")}</div>`;
    if (byVisitor) this.quests.complete("element");
  }

  technique({ tech, art, level, note }) {
    const rank = this.mastery.find((m) => m.level === level) ?? this.mastery[0];
    const pips = this.mastery.map((m) => `<i class="${m.level <= level ? "on" : ""}"></i>`).join("");
    return `
      <li class="technique">
        <div class="technique-name"><b>${escapeHtml(tech)}</b><em>${escapeHtml(art)}</em></div>
        <span class="mastery" title="${escapeHtml(rank.name)}">
          <span class="pips" aria-hidden="true">${pips}</span>${glyph(rank.glyph)}<span class="sr-only">${escapeHtml(rank.name)}</span>
        </span>
        <p>${escapeHtml(note)}</p>
      </li>`;
  }
}
