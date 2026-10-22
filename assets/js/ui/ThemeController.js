const STORE_KEY = "theme";

/** Day paper or night ink. Emits theme:change with the new theme name. */
export class ThemeController {
  constructor({ storage, bus }) {
    this.storage = storage;
    this.bus = bus;
  }

  get theme() {
    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  }

  get isDark() {
    return this.theme === "dark";
  }

  toggle() {
    this.set(this.isDark ? "light" : "dark");
  }

  set(theme) {
    document.documentElement.dataset.theme = theme;
    this.storage.write(STORE_KEY, theme);
    this.bus.emit("theme:change", theme);
  }
}
