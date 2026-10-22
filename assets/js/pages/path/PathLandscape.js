import { InkCanvas, readColor, rgba } from "../../ink/InkCanvas.js";
import { MountainRange } from "../../ink/MountainRange.js";
import { smoothstep } from "../../core/motion.js";

/** Rising ink landscape for the handscroll. Returns the ridge the stations sit on. */
export class PathLandscape {
  constructor(canvas) {
    this.surface = new InkCanvas(canvas);
  }

  paint({ width, height, lead, gap, summitX }) {
    this.surface.canvas.style.width = `${width}px`;
    const { ctx } = this.surface.fit(width, height);
    const color = readColor("--ink");
    const paper = readColor("--paper");
    const rise = (x) => height * (0.86 - 0.62 * smoothstep(0.12, 0.86, x / width));

    new MountainRange({
      seed: 3, color, base: (x) => rise(x) - height * 0.2, amplitude: height * 0.15, frequency: 1 / 210,
      alpha: 0.13, fade: height * 0.3, edge: 2, edgeAlpha: 0.08, texture: 0.05, trees: 0.02, scale: 0.8,
      peaks: [
        { x: summitX + gap * 0.15, width: gap * 0.42, height: height * 0.2 },
        { x: summitX - gap * 0.55, width: gap * 0.28, height: height * 0.1 },
        { x: lead + gap * 1.6, width: gap * 0.3, height: height * 0.08 }
      ]
    }).paint(ctx);

    new MountainRange({
      seed: 8, color, base: (x) => rise(x) - height * 0.08, amplitude: height * 0.12, frequency: 1 / 150,
      alpha: 0.2, fade: height * 0.24, edge: 2.5, edgeAlpha: 0.14, texture: 0.18, trees: 0.06, scale: 0.9
    }).paint(ctx);

    const near = new MountainRange({
      seed: 15, color, base: rise, amplitude: height * 0.06, frequency: 1 / 240,
      alpha: 0.36, fade: height * 0.22, edge: 3, edgeAlpha: 0.24, texture: 0.3, trees: 0.1, scale: 1
    });
    const ridge = near.paint(ctx);
    this.paintSummitClouds(ctx, paper, summitX, ridge[Math.min(width - 1, Math.round(summitX))], gap, height);
    return ridge;
  }

  paintSummitClouds(ctx, paper, x0, y0, gap, height) {
    for (let i = 0; i < 9; i++) {
      const x = x0 + (i - 4) * gap * 0.16 + Math.sin(i * 7.1) * 30;
      const y = y0 - height * (0.12 + 0.18 * Math.abs(Math.cos(i * 3.3)));
      const radius = gap * (0.16 + 0.016 * ((i * 37) % 5));
      const cloud = ctx.createRadialGradient(x, y, 0, x, y, radius);
      cloud.addColorStop(0, rgba(paper, 0.9));
      cloud.addColorStop(1, rgba(paper, 0));
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1.8, 0.55);
      ctx.translate(-x, -y);
      ctx.fillStyle = cloud;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
