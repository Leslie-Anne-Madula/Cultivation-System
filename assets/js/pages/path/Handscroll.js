import { escapeHtml, glyph } from "../../core/dom.js";
import { debounce } from "../../core/motion.js";
import { PathLandscape } from "./PathLandscape.js";

const VERTICAL_BELOW = 760;
const CARD_GAP = 46;
const SIDE_OFFSET = 34;
const PROGRESS_SPACE = 96;

/**
 * A handscroll that slides sideways while the visitor scrolls down.
 * Stations sit on the painted ridge; narrow screens get a vertical path.
 */
export class Handscroll {
  constructor(section, { content, quests, bus, scope }) {
    this.section = section;
    this.stations = content.path;
    this.quests = quests;
    this.bus = bus;
    this.scope = scope;
    this.strip = section.querySelector("[data-strip]");
    this.frontispiece = section.querySelector("[data-frontispiece]");
    this.trail = section.querySelector("[data-trail]");
    this.progressFill = section.querySelector("[data-progress-fill]");
    this.progressRealms = section.querySelector("[data-progress-realms]");
    this.progressHint = section.querySelector("[data-progress-hint]");
    this.landscape = new PathLandscape(section.querySelector("[data-landscape]"));
    this.geometry = null;
  }

  mount() {
    this.elements = this.stations.map((station) => this.buildStation(station));
    this.progressRealms.innerHTML = this.stations.map((station) => `<span translate="no">${escapeHtml(station.glyph)}</span>`).join("");
    this.realmMarks = [...this.progressRealms.children];

    let ticking = false;
    this.scope.on(window, "scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        this.update();
      });
    }, { passive: true });

    let lastWidth = 0, lastHeight = 0;
    this.scope.on(window, "resize", debounce(() => {
      const width = document.documentElement.clientWidth, height = window.innerHeight;
      if (width !== lastWidth || Math.abs(height - lastHeight) > 120) {
        lastWidth = width;
        lastHeight = height;
        this.layout();
      }
    }));
    this.scope.subscribe(this.bus, "theme:change", () => requestAnimationFrame(() => this.layout()));
    this.observeSummit();

    lastWidth = document.documentElement.clientWidth;
    lastHeight = window.innerHeight;
    this.layout();
    document.fonts?.ready.then(() => {
      if (!this.scope.disposed) this.layout();
    });
  }

  buildStation(station) {
    const element = document.createElement("article");
    element.className = ["station", station.current && "current", station.locked && "locked"].filter(Boolean).join(" ");
    const merits = station.merits.length
      ? `<ul class="merits">${station.merits.map((merit) => `<li>${escapeHtml(merit)}</li>`).join("")}</ul>`
      : "";
    element.innerHTML = `
      <span class="station-stem" aria-hidden="true"></span>
      <span class="station-marker" aria-hidden="true"></span>
      <div class="station-card">
        ${station.locked ? '<span class="seal station-lock" translate="no" aria-hidden="true">封</span>' : ""}
        ${station.current ? '<span class="station-here">The Host is here</span>' : ""}
        <div class="station-top"><h2 class="station-realm">${escapeHtml(station.realm)}</h2><span class="station-when">${escapeHtml(station.when)}</span></div>
        ${glyph(station.glyph, "station-glyph")}
        <p class="station-title">${escapeHtml(station.title)}</p>
        <p>${escapeHtml(station.text)}</p>
        ${merits}
        ${station.locked ? '<button class="btn solid" type="button" data-invite data-sound="open">Send a sect invitation</button>' : ""}
      </div>`;
    this.strip.appendChild(element);
    return element;
  }

  layout() {
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight;
    const vertical = viewportWidth < VERTICAL_BELOW;
    this.section.classList.toggle("vertical", vertical);
    this.elements.forEach((element) => {
      element.style.left = element.style.top = "";
      element.querySelector(".station-marker").style.top = "";
    });

    if (vertical) {
      this.section.style.height = "";
      this.strip.style.width = "";
      this.elements.forEach((element) => element.classList.add("reached"));
      this.geometry = null;
      return;
    }

    const gap = Math.max(570, Math.min(640, viewportWidth * 0.42));
    const lead = Math.round(Math.max(viewportWidth * 0.6, this.frontispiece.offsetLeft + this.frontispiece.offsetWidth + 200));
    const width = Math.round(lead + gap * (this.stations.length - 1) + viewportWidth / 2);
    const xs = this.stations.map((_, i) => Math.round(lead + i * gap));
    this.strip.style.width = `${width}px`;
    this.section.style.height = `${width - viewportWidth + viewportHeight}px`;

    const ridge = this.landscape.paint({ width, height: viewportHeight, lead, gap, summitX: xs[xs.length - 1] });
    const points = xs.map((x) => [x, ridge[Math.min(width - 1, x)] - 4]);
    points.forEach((point, i) => this.placeStation(this.elements[i], point, viewportHeight));

    const startX = Math.round(Math.max(40, lead - gap * 0.9));
    const length = this.drawTrail([[startX, ridge[startX] - 4], ...points], width, viewportHeight);
    this.geometry = { viewportWidth, width, gap, xs, length, startX, endX: xs[xs.length - 1] };
    this.update();
  }

  placeStation(element, [x, y], viewportHeight) {
    const card = element.querySelector(".station-card");
    const marker = element.querySelector(".station-marker");
    const stem = element.querySelector(".station-stem");
    const headerHeight = document.querySelector(".site-header")?.offsetHeight ?? 76;
    const ceiling = headerHeight + 12, floor = viewportHeight - PROGRESS_SPACE;
    const height = card.offsetHeight;

    const fitsAbove = y - CARD_GAP - height >= ceiling;
    const fitsBelow = y + CARD_GAP + height <= floor;
    const mode = fitsAbove && (y > viewportHeight * 0.5 || !fitsBelow) ? "above" : fitsBelow ? "below" : "side";
    const top = mode === "above" ? y - CARD_GAP - height
      : mode === "below" ? y + CARD_GAP
      : Math.min(Math.max(ceiling, y - height / 2), floor - height);

    element.classList.toggle("side", mode === "side");
    element.style.left = `${mode === "side" ? x + SIDE_OFFSET : x}px`;
    element.style.top = `${top}px`;
    const markerY = y - top;
    marker.style.top = `${markerY}px`;

    const stemLength = mode === "above" ? markerY - height - 10 : -markerY - 10;
    stem.hidden = mode === "side" || stemLength < 4;
    stem.style.top = `${mode === "above" ? height : markerY + 10}px`;
    stem.style.height = `${Math.max(0, stemLength)}px`;
  }

  drawTrail(points, width, height) {
    let d = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] ?? points[i], p1 = points[i], p2 = points[i + 1], p3 = points[i + 2] ?? p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${p2[0]} ${p2[1]}`;
    }
    this.trail.setAttribute("viewBox", `0 0 ${width} ${height}`);
    this.trail.setAttribute("width", width);
    this.trail.setAttribute("height", height);
    this.trail.innerHTML = `<path class="track" d="${d}"/><path class="walked" d="${d}"/>`;
    this.walked = this.trail.querySelector(".walked");
    const length = this.walked.getTotalLength();
    this.walked.style.strokeDasharray = `${length} ${length}`;
    return length;
  }

  update() {
    const g = this.geometry;
    if (!g) return;
    const scrollable = Math.max(1, this.section.offsetHeight - window.innerHeight);
    const progress = Math.max(0, Math.min(1, -this.section.getBoundingClientRect().top / scrollable));
    const shift = progress * (g.width - g.viewportWidth);
    const centre = shift + g.viewportWidth / 2;
    this.strip.style.transform = `translate3d(${-shift}px, 0, 0)`;

    const walked = Math.max(0, Math.min(1, (centre + g.gap * 0.08 - g.startX) / (g.endX - g.startX)));
    this.walked.style.strokeDashoffset = g.length * (1 - walked);

    let focus = 0;
    g.xs.forEach((x, i) => {
      if (Math.abs(x - centre) < Math.abs(g.xs[focus] - centre)) focus = i;
    });
    this.elements.forEach((element, i) => {
      element.classList.toggle("reached", g.xs[i] <= centre + 20);
      element.classList.toggle("focus", i === focus);
    });
    this.realmMarks.forEach((mark, i) => mark.classList.toggle("on", i <= focus));
    this.progressFill.style.width = `${progress * 100}%`;
    this.progressHint.style.opacity = progress > 0.02 ? 0 : 1;
    if (progress > 0.97) this.quests.complete("path");
  }

  observeSummit() {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting) && this.section.classList.contains("vertical")) this.quests.complete("path");
    }, { threshold: 0.6 });
    observer.observe(this.elements[this.elements.length - 1]);
    this.scope.add(() => observer.disconnect());
  }
}
