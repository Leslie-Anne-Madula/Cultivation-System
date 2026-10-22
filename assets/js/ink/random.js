export class SeededRandom {
  constructor(seed = 1) {
    this.state = seed >>> 0;
  }

  next() {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min, max) {
    return min + (max - min) * this.next();
  }

  chance(probability) {
    return this.next() < probability;
  }
}

export function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const fade = (t) => t * t * (3 - 2 * t);

export class ValueNoise1D {
  constructor(random, size = 1024) {
    this.size = size;
    this.values = Float32Array.from({ length: size }, () => random.next());
  }

  at(x) {
    const i = Math.floor(x);
    const a = this.values[((i % this.size) + this.size) % this.size];
    const b = this.values[(((i + 1) % this.size) + this.size) % this.size];
    return a + (b - a) * fade(x - i);
  }

  fbm(x, octaves = 4) {
    let sum = 0, amplitude = 1, frequency = 1, norm = 0;
    for (let o = 0; o < octaves; o++) {
      sum += this.at(x * frequency + o * 17.3) * amplitude;
      norm += amplitude;
      amplitude *= 0.5;
      frequency *= 2.07;
    }
    return sum / norm;
  }
}

export class ValueNoise2D {
  constructor(seed = 0) {
    this.seed = seed;
  }

  at(x, y) {
    x += this.seed * 31.7;
    const xi = Math.floor(x), yi = Math.floor(y);
    const u = fade(x - xi), v = fade(y - yi);
    const a = hash2(xi, yi), b = hash2(xi + 1, yi);
    const c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
}
