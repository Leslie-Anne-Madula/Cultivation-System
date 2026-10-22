import { createSvg, escapeHtml, glyph } from "../../core/dom.js";
import { tween } from "../../core/motion.js";

const CENTRE_X = 240, CENTRE_Y = 205, RADIUS = 128;

/** Pentagon chart of attributes; pointing at a vertex shows its note. */
export class RadarChart {
  constructor(svg, note, attributes) {
    this.svg = svg;
    this.note = note;
    this.attributes = attributes;
    this.defaultNote = note.textContent;
  }

  point(index, scale) {
    const angle = ((-90 + (index * 360) / this.attributes.length) * Math.PI) / 180;
    return [CENTRE_X + Math.cos(angle) * RADIUS * scale, CENTRE_Y + Math.sin(angle) * RADIUS * scale];
  }

  polygon(scaleFor) {
    return this.attributes.map((_, i) => this.point(i, scaleFor(i)).join(",")).join(" ");
  }

  render() {
    const { svg, attributes } = this;
    for (const scale of [0.25, 0.5, 0.75, 1]) {
      createSvg("polygon", { class: scale < 1 ? "grid faint" : "grid", points: this.polygon(() => scale) }, svg);
    }
    attributes.forEach((_, i) => {
      const [x, y] = this.point(i, 1);
      createSvg("line", { class: "axis", x1: CENTRE_X, y1: CENTRE_Y, x2: x, y2: y }, svg);
    });
    this.shape = createSvg("polygon", { class: "shape", points: this.polygon(() => 0) }, svg);
    this.dots = attributes.map(() => createSvg("circle", { class: "dot", r: 3.5, cx: CENTRE_X, cy: CENTRE_Y }, svg));
    this.vertices = attributes.map((attribute, i) => this.renderVertex(attribute, i));
    this.animateIn();
  }

  renderVertex(attribute, index) {
    const [x, y] = this.point(index, 1.2);
    const dx = x - CENTRE_X;
    const anchor = Math.abs(dx) < 12 ? "middle" : dx > 0 ? "start" : "end";
    const top = y < CENTRE_Y - RADIUS * 0.5 ? y - 14 : y > CENTRE_Y + RADIUS * 0.5 ? y + 8 : y - 4;

    const group = createSvg("g", {
      class: "vertex",
      tabindex: 0,
      role: "button",
      "data-hover-note": index,
      "data-sound": "none",
      "aria-label": `${attribute.name} ${attribute.value}. ${attribute.note}`
    }, this.svg);
    const title = createSvg("text", { x, y: top, "text-anchor": anchor, translate: "no" }, group);
    title.textContent = `${attribute.glyph} `;
    createSvg("tspan", { class: "value" }, title).textContent = attribute.value;
    createSvg("text", { class: "en", x, y: top + 16, "text-anchor": anchor }, group).textContent = attribute.name;
    createSvg("circle", { cx: x, cy: top + 2, r: 34, fill: "transparent" }, group);

    const show = () => this.select(index);
    group.addEventListener("mouseenter", show);
    group.addEventListener("focus", show);
    group.addEventListener("click", show);
    return group;
  }

  select(index) {
    const attribute = this.attributes[index];
    this.note.innerHTML = `<b>${glyph(attribute.glyph)} ${escapeHtml(attribute.name)} · ${attribute.value}</b><br>${escapeHtml(attribute.note)}`;
    this.vertices.forEach((vertex, i) => vertex.classList.toggle("active", i === index));
  }

  animateIn() {
    tween(1100, (progress) => {
      const scaleFor = (i) => (this.attributes[i].value / 100) * progress;
      this.shape.setAttribute("points", this.polygon(scaleFor));
      this.dots.forEach((dot, i) => {
        const [x, y] = this.point(i, scaleFor(i));
        dot.setAttribute("cx", x);
        dot.setAttribute("cy", y);
      });
    });
  }
}
