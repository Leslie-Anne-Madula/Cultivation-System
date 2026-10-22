export function readColor(token) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  if (value.startsWith("#")) {
    let hex = value.slice(1);
    if (hex.length === 3) hex = [...hex].map((c) => c + c).join("");
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  }
  const parts = value.match(/[\d.]+/g);
  return parts ? parts.slice(0, 3).map(Number) : [30, 26, 22];
}

export function rgba([r, g, b], alpha) {
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
}

export class InkCanvas {
  constructor(canvas, { pixelRatio = 1 } = {}) {
    this.canvas = canvas;
    this.pixelRatio = pixelRatio;
    this.ctx = canvas.getContext("2d", { willReadFrequently: true });
  }

  fit(width, height) {
    const rect = this.canvas.getBoundingClientRect();
    const cssWidth = width ?? rect.width;
    const cssHeight = height ?? rect.height;
    this.canvas.width = Math.max(1, Math.round(cssWidth * this.pixelRatio));
    this.canvas.height = Math.max(1, Math.round(cssHeight * this.pixelRatio));
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    return this;
  }

  get width() {
    return this.canvas.width;
  }

  get height() {
    return this.canvas.height;
  }
}
