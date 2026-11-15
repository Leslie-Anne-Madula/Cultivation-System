import { SeededRandom, ValueNoise1D } from "./noise.js";
import { rgba } from "./InkCanvas.js";

const SEGMENTS = 48;

const smoothstep = (a, b, t) => {
  const k = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

const cubic = (p0, p1, p2, p3, t) => {
  const m = 1 - t;
  return [
    m * m * m * p0[0] + 3 * m * m * t * p1[0] + 3 * m * t * t * p2[0] + t * t * t * p3[0],
    m * m * m * p0[1] + 3 * m * m * t * p1[1] + 3 * m * t * t * p2[1] + t * t * t * p3[1]
  ];
};

/** Limb layout of a Huangshan "welcoming guest" pine, relative to tree size. */
const WELCOMING_PINE = [
  { at: 0.4, side: 1, length: 0.92, rise: 0.1, droop: 0.07, front: true },
  { at: 0.52, side: -1, length: 0.4, rise: 0.12, droop: 0.03, front: false },
  { at: 0.63, side: 1, length: 0.62, rise: 0.15, droop: 0.05, front: false },
  { at: 0.75, side: -1, length: 0.32, rise: 0.11, droop: 0.02, front: true },
  { at: 0.86, side: 1, length: 0.38, rise: 0.1, droop: 0.02, front: true }
];

export class PineTree {
  /**
   * @param {object} options
   * @param {number} options.x      base of the trunk
   * @param {number} options.y
   * @param {number} options.size   overall height of the tree in pixels
   * @param {number[]} options.color rgb ink colour
   * @param {number[]} options.paper rgb paper colour, used to tint the wood
   * @param {1|-1} [options.facing] direction the long limb reaches
   */
  constructor({ x, y, size, color, paper, seed = 3, facing = 1, limbs = WELCOMING_PINE }) {
    Object.assign(this, { x, y, size, color, paper, seed, facing, limbs });
    this.woodTone = mix(color, paper, 0.62);
    this.shadeTone = mix(color, paper, 0.42);
  }

  paint(ctx) {
    this.ctx = ctx;
    this.random = new SeededRandom(this.seed);
    this.noise = new ValueNoise1D(this.random);

    const trunk = this.buildTrunk();
    const limbs = this.limbs.map((spec) => this.buildLimb(trunk, spec));
    const clusters = limbs.flatMap((limb) => limb.clusters).concat(this.buildCrown(trunk));

    const wood = document.createElement("canvas");
    wood.width = ctx.canvas.width;
    wood.height = ctx.canvas.height;
    this.wood = wood.getContext("2d");
    limbs.filter((limb) => !limb.front).forEach((limb) => this.paintBranch(limb));
    this.paintRoots(trunk);
    this.paintLimb(trunk.spine, { bark: true });
    limbs.filter((limb) => limb.front).forEach((limb) => this.paintBranch(limb));
    ctx.drawImage(wood, 0, 0);

    clusters.sort((a, b) => b.y - a.y).forEach((cluster) => this.paintCluster(cluster));
  }

  buildTrunk() {
    const { x, y, size: s, facing: f } = this;
    const p0 = [x, y];
    const p1 = [x - 0.14 * s * f, y - 0.34 * s];
    const p2 = [x + 0.3 * s * f, y - 0.6 * s];
    const p3 = [x + 0.08 * s * f, y - 0.95 * s];
    const spine = [];
    for (let i = 0; i <= SEGMENTS; i++) {
      const t = i / SEGMENTS;
      const [bx, by] = cubic(p0, p1, p2, p3, t);
      spine.push({
        x: bx + (this.noise.at(t * 6) - 0.5) * 0.03 * s,
        y: by,
        w: s * 0.12 * (1 - 0.7 * t) + s * 0.08 * Math.exp(-t * 10)
      });
    }
    return { spine };
  }

  buildLimb(trunk, { at, side, length, rise, droop, front }) {
    const s = this.size;
    const dir = side * this.facing;
    const root = trunk.spine[Math.round(at * SEGMENTS)];
    const reach = length * s;
    const baseWidth = root.w * 0.62;
    const phase = this.random.range(0, 20);
    const steps = 24;
    const spine = [];
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const lift = rise * s * Math.sin(Math.min(1, u * 1.7) * Math.PI * 0.5);
      const sag = droop * s * u * u;
      const tipUp = 0.05 * s * smoothstep(0.7, 1, u);
      const wobble = (this.noise.at(phase + u * 5) - 0.5) * 0.045 * s;
      spine.push({
        x: root.x + dir * reach * u,
        y: root.y - lift + sag - tipUp + wobble,
        w: Math.max(1.5, baseWidth * (1 - 0.75 * u))
      });
    }

    const limb = { spine, front, twigs: [], clusters: [] };
    const stops = length > 0.6 ? [0.36, 0.56, 0.76] : length > 0.36 ? [0.48, 0.76] : [0.6];
    for (const u of stops) {
      const from = spine[Math.round(u * steps)];
      const angle = -Math.PI / 2 + dir * this.random.range(0.45, 0.95);
      const twigLength = this.random.range(0.08, 0.15) * s;
      const twig = [];
      for (let j = 0; j <= 6; j++) {
        const v = j / 6;
        const bend = 0.3 * v * dir;
        twig.push({
          x: from.x + Math.cos(angle + bend) * twigLength * v,
          y: from.y + Math.sin(angle + bend) * twigLength * v,
          w: Math.max(1, from.w * 0.6 * (1 - 0.7 * v))
        });
      }
      limb.twigs.push(twig);
      const end = twig[twig.length - 1];
      limb.clusters.push({ x: end.x, y: end.y - 0.01 * s, w: this.random.range(0.17, 0.24) * s });
    }

    for (let u = 0.32; u < 0.92; u += 0.14) {
      if (this.random.chance(0.3)) continue;
      const p = spine[Math.round(u * steps)];
      limb.clusters.push({ x: p.x, y: p.y - 0.035 * s, w: this.random.range(0.15, 0.21) * s });
    }

    const tip = spine[steps];
    const tipWidth = (0.19 + 0.1 * Math.min(1, length)) * s;
    limb.clusters.push({ x: tip.x + dir * 0.03 * s, y: tip.y - 0.02 * s, w: tipWidth });
    if (length > 0.6) limb.clusters.push({ x: tip.x - dir * 0.13 * s, y: tip.y - 0.05 * s, w: tipWidth * 0.8 });
    return limb;
  }

  buildCrown(trunk) {
    const top = trunk.spine[SEGMENTS];
    const s = this.size, f = this.facing;
    return [
      { x: top.x, y: top.y - 0.03 * s, w: 0.27 * s },
      { x: top.x - 0.12 * s * f, y: top.y + 0.03 * s, w: 0.18 * s },
      { x: top.x + 0.13 * s * f, y: top.y + 0.02 * s, w: 0.2 * s }
    ];
  }

  paintBranch(limb) {
    this.paintLimb(limb.spine, { bark: false });
    limb.twigs.forEach((twig) => this.paintLimb(twig, { bark: false }));
  }

  paintRoots(trunk) {
    const base = trunk.spine[0], s = this.size;
    for (const [dx, dy, w] of [[-0.16, 0.025, 0.05], [0.14, 0.03, 0.045], [0.05, 0.05, 0.035]]) {
      const root = [];
      for (let i = 0; i <= 6; i++) {
        const u = i / 6;
        root.push({
          x: base.x + dx * s * u * this.facing,
          y: base.y + dy * s * u * u + (this.noise.at(u * 3 + dx * 10) - 0.5) * 0.01 * s,
          w: Math.max(1, w * s * (1 - 0.85 * u))
        });
      }
      this.paintLimb(root, { bark: false });
    }
  }

  outline(spine) {
    const left = [], right = [];
    spine.forEach((p, i) => {
      const a = spine[Math.max(0, i - 1)], b = spine[Math.min(spine.length - 1, i + 1)];
      const normal = Math.atan2(b.y - a.y, b.x - a.x) + Math.PI / 2;
      const half = (p.w * (0.94 + 0.12 * this.random.next())) / 2;
      left.push([p.x + Math.cos(normal) * half, p.y + Math.sin(normal) * half]);
      right.push([p.x - Math.cos(normal) * half, p.y - Math.sin(normal) * half]);
    });
    return { left, right };
  }

  paintLimb(spine, { bark }) {
    const ctx = this.wood, { color, noise } = this;
    const { left, right } = this.outline(spine);
    const fillPath = (a, b) => {
      ctx.beginPath();
      a.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      for (let i = b.length - 1; i >= 0; i--) ctx.lineTo(b[i][0], b[i][1]);
      ctx.closePath();
      ctx.fill();
    };
    ctx.fillStyle = rgba(this.woodTone, 1);
    fillPath(left, right);
    ctx.fillStyle = rgba(this.shadeTone, 1);
    fillPath(left, spine.map((p) => [p.x, p.y]));

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const phase = this.random.range(0, 50);
    [[right, 0.07, 0.7], [left, 0.14, 0.92]].forEach(([edge, weight, alpha], side) => {
      for (let i = 0; i < edge.length - 1; i++) {
        const pressure = noise.at(phase + side * 13 + i * 0.35);
        if (pressure < 0.12) continue;
        ctx.strokeStyle = rgba(color, alpha * (0.7 + 0.3 * pressure));
        ctx.lineWidth = Math.min(this.size * 0.014, Math.max(0.7, spine[i].w * weight * (0.6 + 0.8 * pressure)));
        ctx.beginPath();
        ctx.moveTo(edge[i][0], edge[i][1]);
        ctx.lineTo(edge[i + 1][0], edge[i + 1][1]);
        ctx.stroke();
      }
    });

    if (bark) this.paintBark(spine);
  }

  paintBark(spine) {
    const ctx = this.wood, { color, random } = this;
    for (let i = 3; i < spine.length - 3; i++) {
      const p = spine[i];
      if (p.w < 7 || random.chance(0.45)) continue;
      const a = spine[i - 1], b = spine[i + 1];
      const along = Math.atan2(b.y - a.y, b.x - a.x);
      const across = along + Math.PI / 2;
      const offset = random.range(-0.32, 0.38) * p.w;
      const cx = p.x + Math.cos(across) * offset;
      const cy = p.y + Math.sin(across) * offset;
      const half = random.range(0.12, 0.22) * p.w;
      const bulge = random.range(0.05, 0.12) * p.w;
      ctx.strokeStyle = rgba(color, random.range(0.25, 0.5));
      ctx.lineWidth = Math.max(0.6, p.w * random.range(0.025, 0.05));
      ctx.beginPath();
      ctx.moveTo(cx - Math.cos(across) * half, cy - Math.sin(across) * half);
      ctx.quadraticCurveTo(cx + Math.cos(along) * bulge, cy + Math.sin(along) * bulge, cx + Math.cos(across) * half, cy + Math.sin(across) * half);
      ctx.stroke();
      if (random.chance(0.12)) {
        ctx.fillStyle = rgba(color, 0.6);
        ctx.beginPath();
        ctx.ellipse(cx, cy, half * 0.35, half * 0.22, along, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  paintCluster({ x, y, w }) {
    const { ctx, color, random } = this;
    const h = w * 0.5;
    const needle = Math.max(5, w * 0.12);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, h / w);
    const body = ctx.createRadialGradient(0, w * 0.06, 0, 0, w * 0.06, w * 0.56);
    body.addColorStop(0, rgba(color, 0.3));
    body.addColorStop(0.65, rgba(color, 0.14));
    body.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(0, w * 0.06, w * 0.56, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const count = Math.round((w / needle) * 3.4);
    const wheels = [];
    for (let i = 0; i < count; i++) {
      const u = random.range(-1, 1);
      const v = random.next() * Math.sqrt(1 - u * u);
      wheels.push({ x: x + u * w * 0.46, y: y + h * 0.2 - v * h * 0.82, u, v });
    }
    wheels.sort((a, b) => a.v - b.v);

    ctx.lineCap = "round";
    for (const wheel of wheels) {
      const radius = needle * random.range(0.8, 1.25) * (0.85 + 0.25 * wheel.v);
      const centre = -Math.PI / 2 + wheel.u * 0.75;
      const spread = Math.PI * random.range(0.55, 0.68);
      const needles = 11 + Math.floor(random.next() * 6);
      ctx.strokeStyle = rgba(color, (0.3 + 0.58 * wheel.v) * random.range(0.8, 1));
      ctx.lineWidth = Math.max(0.6, needle * random.range(0.07, 0.11));
      ctx.beginPath();
      for (let j = 0; j < needles; j++) {
        const angle = centre - spread + (2 * spread * j) / (needles - 1) + random.range(-0.06, 0.06);
        ctx.moveTo(wheel.x, wheel.y);
        ctx.lineTo(wheel.x + Math.cos(angle) * radius, wheel.y + Math.sin(angle) * radius);
      }
      ctx.stroke();
    }
  }
}
