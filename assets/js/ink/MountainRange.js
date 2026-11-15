import { SeededRandom, ValueNoise1D, hash2 } from "./noise.js";
import { rgba } from "./InkCanvas.js";

/**
 * A layer of ink-wash mountains. The ridge is generated from noise plus
 * optional pinnacles; the wash fades downward into mist.
 */
export class MountainRange {
  constructor({
    seed,
    color,
    base,
    amplitude,
    frequency,
    alpha,
    fade,
    edge = 3,
    edgeAlpha = 0.2,
    falloff = 1.5,
    texture = 0,
    trees = 0,
    scale = 1,
    peaks = [],
    mask = null
  }) {
    Object.assign(this, { seed, color, base, amplitude, frequency, alpha, fade, edge, edgeAlpha, falloff, texture, trees, scale, peaks, mask });
    this.ridge = null;
  }

  computeRidge(width) {
    const random = new SeededRandom(this.seed);
    const low = new ValueNoise1D(random);
    const sharp = new ValueNoise1D(random);
    const ridge = new Float32Array(width);
    for (let x = 0; x < width; x++) {
      const t = x * this.frequency;
      const broad = low.fbm(t, 4);
      const crest = 1 - Math.abs(sharp.fbm(t * 2.4, 3) * 2 - 1);
      let y = this.base(x) - (0.62 * broad ** 1.35 + 0.38 * crest ** 2.2) * this.amplitude;
      for (const peak of this.peaks) {
        const d = Math.abs(x - peak.x) / peak.width;
        if (d < 1) y -= peak.height * (1 - d) ** (peak.sharpness ?? 1.7) * (0.85 + 0.3 * low.at(x * 0.05));
      }
      ridge[x] = y;
    }
    this.ridge = ridge;
    return ridge;
  }

  paint(ctx) {
    const { width, height } = ctx.canvas;
    const ridge = this.ridge ?? this.computeRidge(width);
    this.paintWash(ctx, ridge, width, height);
    if (this.texture) this.paintTexture(ctx, ridge, width);
    if (this.trees) this.paintTrees(ctx, ridge, width);
    return ridge;
  }

  weight(x) {
    return this.mask ? this.mask(x) : 1;
  }

  paintWash(ctx, ridge, width, height) {
    const streaks = new ValueNoise1D(new SeededRandom(this.seed * 7 + 3));
    const image = ctx.getImageData(0, 0, width, height);
    const data = image.data;
    const [r, g, b] = this.color;
    for (let x = 0; x < width; x++) {
      const weight = this.weight(x);
      if (weight <= 0.002) continue;
      const top = ridge[x];
      const streak = (0.82 + 0.36 * streaks.at(x * 0.045)) * weight;
      const yStart = Math.max(0, Math.floor(top));
      const yEnd = Math.min(height, Math.ceil(top + this.fade));
      for (let y = yStart; y < yEnd; y++) {
        const dy = y - top;
        if (dy < -1) continue;
        let a = this.alpha * Math.max(0, 1 - dy / this.fade) ** this.falloff;
        if (dy < this.edge) a += this.edgeAlpha * (1 - Math.max(0, dy) / this.edge);
        a *= streak * (0.8 + 0.4 * hash2(x, y)) * (dy < 0 ? 1 + dy : 1);
        if (a <= 0.004) continue;
        const i = (y * width + x) * 4;
        const under = data[i + 3] / 255;
        const over = Math.min(1, a);
        const out = over + under * (1 - over);
        data[i] = (r * over + data[i] * under * (1 - over)) / out;
        data[i + 1] = (g * over + data[i + 1] * under * (1 - over)) / out;
        data[i + 2] = (b * over + data[i + 2] * under * (1 - over)) / out;
        data[i + 3] = out * 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  }

  paintTexture(ctx, ridge, width) {
    const random = new SeededRandom(this.seed * 13 + 5);
    ctx.lineCap = "round";
    for (let x = 2; x < width - 2; x += 3) {
      if (random.next() > this.texture * this.weight(x)) continue;
      const slope = (ridge[x + 2] - ridge[x - 2]) / 4;
      const direction = Math.atan2(1, -slope * 1.4);
      const length = random.range(8, 34) * this.scale;
      const sy = ridge[x] + 1 + random.next() * 4 * this.scale;
      ctx.strokeStyle = rgba(this.color, random.range(0.1, 0.32) * (this.alpha + 0.3));
      ctx.lineWidth = random.range(0.5, 1.6) * this.scale;
      ctx.beginPath();
      ctx.moveTo(x, sy);
      ctx.quadraticCurveTo(
        x + Math.cos(direction) * length * 0.5 + (random.next() - 0.5) * 4,
        sy + Math.sin(direction) * length * 0.5,
        x + Math.cos(direction) * length,
        sy + Math.sin(direction) * length
      );
      ctx.stroke();
    }
  }

  paintTrees(ctx, ridge, width) {
    const random = new SeededRandom(this.seed * 31 + 9);
    const alpha = Math.min(1, this.alpha + 0.35);
    for (let x = 4; x < width - 4; x += 2) {
      if (random.next() > this.trees * this.weight(x)) continue;
      const onCrest = ridge[x] <= ridge[x - 3] + 1.5 && ridge[x] <= ridge[x + 3] + 1.5;
      if (!onCrest && random.next() > 0.25) continue;
      this.paintTinyPine(ctx, x, ridge[x] + 1.5 * this.scale, random.range(0.6, 1.4) * this.scale, alpha, random);
    }
  }

  paintTinyPine(ctx, x, y, size, alpha, random) {
    const height = random.range(7, 16) * size;
    ctx.strokeStyle = rgba(this.color, alpha * 0.9);
    ctx.lineWidth = 0.9 * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (random.next() - 0.5) * 2 * size, y - height);
    ctx.stroke();
    ctx.fillStyle = rgba(this.color, alpha * 0.85);
    const tiers = 3 + Math.floor(random.next() * 3);
    for (let i = 0; i < tiers; i++) {
      const ty = y - height * (0.3 + (i / tiers) * 0.75);
      const tw = (5.5 - i) * size * random.range(0.8, 1.3);
      ctx.beginPath();
      ctx.ellipse(x + (random.next() - 0.5) * 2 * size, ty, Math.max(1, tw), Math.max(0.8, 1.3 * size), 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
