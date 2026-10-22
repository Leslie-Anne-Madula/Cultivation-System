import { SeededRandom, ValueNoise1D, ValueNoise2D } from "./random.js";
import { rgba } from "./InkCanvas.js";

/**
 * An ink rock: pale wash, lit upper planes, creases that split it into
 * facets, clustered texture strokes and a pressured contour.
 */
export class Rock {
  constructor({ outline, creases = [], seed = 1, color, light, wash = 0.4, texture = 1, scale = 1, moss = 0.25, highlights = 3, openEdge = null }) {
    Object.assign(this, { outline, creases, seed, color, light, wash, texture, scale, moss, highlights, openEdge });
  }

  paint(ctx) {
    this.ctx = ctx;
    this.random = new SeededRandom(this.seed);
    this.noise = new ValueNoise1D(this.random);
    this.points = this.roughen(this.outline);
    this.bounds = this.measure(this.points);

    ctx.save();
    this.tracePath();
    ctx.fillStyle = rgba(this.color, this.wash * 0.42);
    ctx.fill();
    ctx.clip();
    this.paintShade();
    this.paintHighlights();
    this.paintCreases();
    this.paintTexture();
    ctx.restore();
    this.paintContour();
    this.paintMoss();
  }

  roughen(outline) {
    const s = this.scale, points = [];
    outline.forEach((a, i) => {
      const b = outline[(i + 1) % outline.length];
      const segments = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / (10 * s)));
      for (let k = 0; k < segments; k++) {
        const t = k / segments, u = i * 10 + k;
        const jitter = ((this.noise.fbm(u * 0.11, 3) - 0.5) * 10 + (this.noise.at(u * 0.9 + 300) - 0.5) * 4) * s;
        points.push([a[0] + (b[0] - a[0]) * t + jitter * 0.8, a[1] + (b[1] - a[1]) * t + jitter * 0.6]);
      }
    });
    return points;
  }

  measure(points) {
    const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
  }

  tracePath() {
    const ctx = this.ctx;
    ctx.beginPath();
    this.points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
  }

  paintShade() {
    const { ctx, bounds: b } = this;
    const shade = ctx.createLinearGradient(b.minX, b.minY, b.minX + b.width * 0.55, b.maxY);
    shade.addColorStop(0, rgba(this.color, 0));
    shade.addColorStop(0.55, rgba(this.color, this.wash * 0.32));
    shade.addColorStop(1, rgba(this.color, this.wash * 0.7));
    ctx.fillStyle = shade;
    ctx.fillRect(b.minX, b.minY, b.width, b.height);
  }

  paintHighlights() {
    if (!this.light) return;
    const { ctx, bounds: b, random } = this;
    for (let i = 0; i < this.highlights; i++) {
      const x = b.minX + b.width * random.range(0.12, 0.72);
      const y = b.minY + b.height * random.range(0.04, 0.3);
      const radius = random.range(40, 110) * this.scale;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
      glow.addColorStop(0, rgba(this.light, 0.4));
      glow.addColorStop(1, rgba(this.light, 0));
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1.6, 0.6);
      ctx.translate(-x, -y);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  paintCreases() {
    const { ctx, random } = this, s = this.scale;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const crease of this.creases) {
      const path = () => {
        ctx.beginPath();
        crease.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      };
      for (let pass = 1; pass <= 5; pass++) {
        ctx.save();
        ctx.translate(0, pass * 3.2 * s);
        path();
        ctx.strokeStyle = rgba(this.color, this.wash * 0.045);
        ctx.lineWidth = 4 * s;
        ctx.stroke();
        ctx.restore();
        if (!this.light) continue;
        ctx.save();
        ctx.translate(0, -pass * 3 * s);
        path();
        ctx.strokeStyle = rgba(this.light, 0.035);
        ctx.lineWidth = 4 * s;
        ctx.stroke();
        ctx.restore();
      }
      for (let i = 0; i < crease.length - 1; i++) {
        const [x0, y0] = crease[i], [x1, y1] = crease[i + 1];
        const steps = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / (5 * s)));
        for (let k = 0; k < steps; k++) {
          if (random.chance(0.07)) continue;
          const t0 = k / steps, t1 = (k + 1) / steps;
          ctx.strokeStyle = rgba(this.color, random.range(0.3, 0.6));
          ctx.lineWidth = random.range(0.8, 2.2) * s;
          ctx.beginPath();
          ctx.moveTo(x0 + (x1 - x0) * t0, y0 + (y1 - y0) * t0);
          ctx.lineTo(x0 + (x1 - x0) * t1 + random.range(-1, 1) * s, y0 + (y1 - y0) * t1 + random.range(-1, 1) * s);
          ctx.stroke();
        }
      }
    }
  }

  paintTexture() {
    const { ctx, bounds: b, random } = this, s = this.scale;
    const density = new ValueNoise2D(this.seed);
    const centreX = (b.minX + b.maxX) / 2;
    const count = Math.round(((b.width * b.height) / (380 * s * s)) * this.texture);
    for (let i = 0; i < count; i++) {
      const x = b.minX + random.next() * b.width;
      const y = b.minY + random.next() * b.height;
      if (density.at(x * 0.012, y * 0.012) < 0.48) continue;
      const length = random.range(5, 19) * s;
      const angle = Math.PI * 0.5 + (x < centreX ? 0.35 : -0.35) + random.range(-0.45, 0.45);
      ctx.strokeStyle = rgba(this.color, random.range(0.08, 0.28));
      ctx.lineWidth = random.range(0.8, 2.6) * s;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(
        x + Math.cos(angle + 0.3) * length * 0.5,
        y + Math.sin(angle + 0.3) * length * 0.5,
        x + Math.cos(angle) * length,
        y + Math.sin(angle) * length
      );
      ctx.stroke();
    }
  }

  paintContour() {
    const { ctx, points } = this, s = this.scale;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    points.forEach((a, i) => {
      const b = points[(i + 1) % points.length];
      if (this.openEdge?.(a, b)) return;
      if (this.noise.at(i * 0.37 + 500) < 0.16) return;
      const shadowSide = b[1] >= a[1] ? 1.25 : 0.85;
      ctx.strokeStyle = rgba(this.color, 0.5 + 0.45 * this.noise.at(i * 0.3 + 90));
      ctx.lineWidth = (0.9 + 3.6 * this.noise.at(i * 0.17 + 40) ** 2.2) * s * shadowSide;
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
    });
  }

  paintMoss() {
    const { ctx, points, random } = this, s = this.scale;
    points.forEach((a, i) => {
      const b = points[(i + 1) % points.length];
      if (b[1] - a[1] > 4 * s || random.next() > this.moss) return;
      ctx.fillStyle = rgba(this.color, random.range(0.7, 1));
      ctx.beginPath();
      ctx.ellipse(a[0] + random.range(-3, 3) * s, a[1] - 1.5 * s, random.range(1.4, 3.8) * s, random.range(1, 2.6) * s, random.next(), 0, Math.PI * 2);
      ctx.fill();
    });
  }
}
