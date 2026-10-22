import { escapeHtml, glyph } from "../core/dom.js";
import { icons } from "./icons.js";

const NAV_ITEMS = [
  { page: "status", href: "status.html", glyph: "状态", label: "Status" },
  { page: "path", href: "path.html", glyph: "道途", label: "Path" },
  { page: "treasury", href: "treasury.html", glyph: "宝阁", label: "Treasury" }
];

export class SiteHeader {
  constructor({ page, theme, sound, invite, bus }) {
    Object.assign(this, { page, theme, sound, invite, bus });
  }

  mount() {
    this.element = document.createElement("header");
    this.element.className = "site-header";
    this.element.dataset.shell = "";
    this.element.innerHTML = this.template();
    document.body.prepend(this.element);

    this.themeButton = this.element.querySelector("[data-action='theme']");
    this.soundButton = this.element.querySelector("[data-action='sound']");
    this.themeButton.addEventListener("click", () => this.theme.toggle());
    this.soundButton.addEventListener("click", () => this.sound.toggle());
    this.element.querySelector("[data-action='invite']").addEventListener("click", () => this.invite.open());

    this.bus.on("theme:change", () => this.renderTheme());
    this.bus.on("sound:change", () => this.renderSound());
    this.bus.on("page:change", (page) => this.setCurrent(page));
    this.renderTheme();
    this.renderSound();

    const onScroll = () => this.element.classList.toggle("scrolled", window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  template() {
    const links = NAV_ITEMS.map((item) => {
      const current = item.page === this.page ? ' aria-current="page"' : "";
      return `<a href="${item.href}" data-sound="turn"${current}>${glyph(item.glyph)}${escapeHtml(item.label)}</a>`;
    }).join("");
    return `
      <div class="wrap header-row">
        <a class="brand" href="index.html" data-sound="turn" aria-label="Leslie Madula, home">
          <span class="seal" translate="no" aria-hidden="true">道</span><span class="brand-name">Leslie Madula</span>
        </a>
        <nav class="nav" aria-label="Main">${links}</nav>
        <div class="tools">
          <button class="icon-btn" type="button" data-action="theme" data-sound="theme"></button>
          <button class="icon-btn" type="button" data-action="sound" data-sound="none"></button>
          <button class="btn solid compact" type="button" data-action="invite" data-sound="open">Invite</button>
        </div>
      </div>`;
  }

  setCurrent(page) {
    this.page = page;
    this.element.querySelectorAll(".nav a").forEach((link, i) => {
      if (NAV_ITEMS[i].page === page) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  renderTheme() {
    const dark = this.theme.isDark;
    const label = dark ? "Switch to day mode" : "Switch to night mode";
    this.themeButton.innerHTML = dark ? icons.sun : icons.moon;
    this.themeButton.setAttribute("aria-label", label);
    this.themeButton.title = label;
  }

  renderSound() {
    const on = this.sound.isEnabled;
    this.soundButton.innerHTML = on ? icons.soundOn : icons.soundOff;
    this.soundButton.setAttribute("aria-pressed", String(on));
    this.soundButton.setAttribute("aria-label", "Sound and music");
    this.soundButton.title = on ? "Sound on" : "Sound off";
  }
}
