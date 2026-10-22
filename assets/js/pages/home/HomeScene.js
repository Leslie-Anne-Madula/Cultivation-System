import { InkCanvas, readColor, rgba } from "../../ink/InkCanvas.js";
import { MountainRange } from "../../ink/MountainRange.js";
import { Rock } from "../../ink/Rock.js";
import { PineTree } from "../../ink/PineTree.js";
import { debounce, prefersReducedMotion, smoothstep } from "../../core/motion.js";

const CLIFF = [
  [-0.05, 0.465], [0.05, 0.448], [0.12, 0.455], [0.19, 0.436], [0.26, 0.448], [0.31, 0.47], [0.33, 0.505], [0.315, 0.54],
  [0.345, 0.57], [0.36, 0.625], [0.335, 0.665], [0.37, 0.705], [0.395, 0.765], [0.38, 0.81], [0.41, 0.85], [-0.05, 0.862]
];
const CLIFF_CREASES = [
  [[0.26, 0.455], [0.245, 0.5], [0.262, 0.55], [0.25, 0.6]],
  [[0.315, 0.545], [0.24, 0.565], [0.13, 0.58]],
  [[0.335, 0.67], [0.25, 0.69], [0.12, 0.7]],
  [[0.17, 0.6], [0.16, 0.65], [0.185, 0.69]],
  [[0.36, 0.77], [0.27, 0.79], [0.15, 0.8]]
];
const LEDGE = [[-0.05, 0.855], [0.42, 0.84], [0.82, 0.852], [0.99, 0.885], [0.975, 1.03], [-0.05, 1.03]];
const LEDGE_TOP = [[-0.05, 0.862], [0.42, 0.848], [0.8, 0.86], [0.94, 0.884], [0.5, 0.9], [-0.05, 0.902]];

/** Paints the home landscape and moves its layers with the pointer. */
export class HomeScene {
  constructor(root, { bus, theme, scope }) {
    this.root = root;
    this.bus = bus;
    this.theme = theme;
    this.scope = scope;
    this.far = new InkCanvas(root.querySelector(".scene-far"));
    this.near = new InkCanvas(root.querySelector(".scene-near"));
    this.cliff = new InkCanvas(root.querySelector(".scene-cliff"), { pixelRatio: Math.min(2, window.devicePixelRatio || 1) });
    this.layers = [...root.querySelectorAll("[data-depth]")];
  }

  mount() {
    this.paint();
    this.scope.on(window, "resize", debounce(() => this.paint(), 220));
    this.scope.subscribe(this.bus, "theme:change", () => requestAnimationFrame(() => this.paint()));
    if (!prefersReducedMotion() && window.matchMedia("(pointer: fine)").matches) this.enableParallax();
  }

  paint() {
    const ink = readColor("--ink");
    const paper = readColor("--paper");
    this.paintMountains(ink);
    this.paintCliff(ink, paper);
  }

  paintMountains(color) {
    const far = this.far.fit();
    const near = this.near.fit();
    const width = far.width, height = far.height;
    const narrow = width < 760;
    const fadeIn = (a, b) => (x) => smoothstep(a, b, x);

    new MountainRange({
      seed: 7, color, base: () => height * 0.665, amplitude: height * 0.17, frequency: 1 / 170,
      alpha: 0.15, fade: height * 0.26, edge: 2, edgeAlpha: 0.08, texture: 0.06, trees: 0.02, scale: 0.8,
      peaks: [
        { x: width * 0.66, width: width * 0.05, height: height * 0.07 },
        { x: width * 0.84, width: width * 0.06, height: height * 0.1 },
        { x: width * 0.96, width: width * 0.05, height: height * 0.06 }
      ],
      mask: narrow ? fadeIn(-width * 0.2, width * 0.4) : fadeIn(width * 0.44, width * 0.66)
    }).paint(far.ctx);

    new MountainRange({
      seed: 21, color, base: () => height * 0.78, amplitude: height * 0.15, frequency: 1 / 140,
      alpha: 0.28, fade: height * 0.2, edge: 2.5, edgeAlpha: 0.16, texture: 0.22, trees: 0.08, scale: 0.9,
      peaks: [
        { x: width * 0.71, width: width * 0.06, height: height * 0.1 },
        { x: width * 0.89, width: width * 0.05, height: height * 0.12 }
      ],
      mask: narrow ? fadeIn(-width * 0.2, width * 0.5) : fadeIn(width * 0.46, width * 0.7)
    }).paint(near.ctx);

    new MountainRange({
      seed: 42, color, base: () => height * 0.91, amplitude: height * 0.12, frequency: 1 / 118,
      alpha: 0.42, fade: height * 0.16, edge: 3, edgeAlpha: 0.24, texture: 0.35, trees: 0.13, scale: 1,
      peaks: [{ x: width * 0.8, width: width * 0.08, height: height * 0.08 }],
      mask: narrow ? fadeIn(width * 0.1, width * 0.6) : fadeIn(width * 0.52, width * 0.74)
    }).paint(near.ctx);
  }

  paintCliff(color, paper) {
    const canvas = this.cliff.fit();
    const { ctx, width, height } = canvas;
    const scale = Math.min(height / 900, width / 600);
    const toPixels = (points) => points.map(([x, y]) => [width * x, height * y]);
    const wash = this.theme.isDark ? 0.62 : 1;

    new Rock({
      outline: toPixels(CLIFF), creases: CLIFF_CREASES.map(toPixels),
      seed: 5, color, light: paper, wash: 0.42 * wash, scale, highlights: 3
    }).paint(ctx);

    new Rock({
      outline: toPixels(LEDGE), seed: 13, color, light: paper, wash: 0.3 * wash, scale, texture: 0.6, moss: 0.12,
      openEdge: (a, b) => a[1] > height && b[1] > height
    }).paint(ctx);
    ctx.fillStyle = rgba(paper, 0.42);
    ctx.beginPath();
    toPixels(LEDGE_TOP).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();

    const viewport = window.innerWidth * this.cliff.pixelRatio;
    new PineTree({
      x: width * 0.2,
      y: height * 0.442,
      size: Math.min(height * 0.32, width * 0.5, viewport * 0.2),
      color,
      paper,
      seed: 3
    }).paint(ctx);
  }

  enableParallax() {
    let frame = 0, x = 0, y = 0;
    this.root.addEventListener("mousemove", (event) => {
      x = event.clientX / window.innerWidth - 0.5;
      y = event.clientY / window.innerHeight - 0.5;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        for (const layer of this.layers) {
          const depth = Number(layer.dataset.depth);
          layer.style.transform = `translate(${-x * depth}px, ${-y * depth * 0.4}px)`;
        }
      });
    });
  }
}
