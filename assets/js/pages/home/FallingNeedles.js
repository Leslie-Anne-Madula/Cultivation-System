import { InkCanvas, readColor, rgba } from "../../ink/InkCanvas.js";
import { prefersReducedMotion } from "../../core/motion.js";

/** Pine needles and leaves drifting down across the hero. */
export class FallingNeedles {
  constructor(canvas, { bus, scope }) {
    this.surface = new InkCanvas(canvas);
    this.bus = bus;
    this.scope = scope;
    this.running = false;
  }

  start() {
    if (prefersReducedMotion()) return;
    this.surface.fit();
    this.color = readColor("--ink");
    this.particles = Array.from({ length: this.surface.width < 700 ? 8 : 15 }, () => this.spawn(true));
    this.scope.subscribe(this.bus, "theme:change", () => (this.color = readColor("--ink")));
    this.scope.on(window, "resize", () => this.surface.fit());
    this.scope.on(document, "visibilitychange", () => (document.hidden ? this.stop() : this.resume()));
    this.scope.add(() => this.stop());
    this.resume();
  }

  resume() {
    if (this.running) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      this.step();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
  }

  spawn(anywhere) {
    const { width, height } = this.surface;
    return {
      x: Math.random() * width * 0.95,
      y: anywhere ? Math.random() * height : -20 - Math.random() * 80,
      fall: 0.22 + Math.random() * 0.42,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.006 + Math.random() * 0.012,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.02,
      size: 6 + Math.random() * 8,
      isLeaf: Math.random() > 0.7,
      alpha: 0.3 + Math.random() * 0.4
    };
  }

  step() {
    const { ctx, width, height } = this.surface;
    ctx.clearRect(0, 0, width, height);
    this.particles.forEach((p, i) => {
      p.sway += p.swaySpeed;
      p.x += Math.sin(p.sway) * 0.55 + 0.18;
      p.y += p.fall;
      p.rotation += p.spin;
      if (p.y > height + 20 || p.x > width + 20) this.particles[i] = this.spawn(false);
      this.draw(ctx, p);
    });
  }

  draw(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.strokeStyle = ctx.fillStyle = rgba(this.color, p.alpha);
    if (p.isLeaf) {
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 0.55, p.size * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.lineWidth = 0.9;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(p.size, -p.size * 0.16);
      ctx.moveTo(0, 0);
      ctx.lineTo(p.size * 0.94, p.size * 0.14);
      ctx.stroke();
    }
    ctx.restore();
  }
}
