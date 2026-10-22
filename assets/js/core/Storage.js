/**
 * JSON storage that never throws. Private windows, blocked cookies and
 * quota errors fall back to the provided default value.
 */
export class Storage {
  constructor(area = "local", prefix = "dao:") {
    this.area = area;
    this.prefix = prefix;
  }

  get backend() {
    try {
      return this.area === "session" ? window.sessionStorage : window.localStorage;
    } catch {
      return null;
    }
  }

  read(key, fallback = null) {
    try {
      const raw = this.backend?.getItem(this.prefix + key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  write(key, value) {
    try {
      this.backend?.setItem(this.prefix + key, JSON.stringify(value));
    } catch {
      /* storage unavailable */
    }
  }

  remove(key) {
    try {
      this.backend?.removeItem(this.prefix + key);
    } catch {
      /* storage unavailable */
    }
  }
}
