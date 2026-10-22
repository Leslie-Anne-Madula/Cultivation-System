import { prefersReducedMotion } from "../core/motion.js";

const PAGE_TITLES = { home: "天道", status: "状态", path: "道途", treasury: "宝阁" };
const PAGE_FILE = /^(index|status|path|treasury)\.html$/;
const INTERNAL_LINK = /^(?:\.\/)?(index|status|path|treasury)\.html(#[\w-]*)?$/;
const PAGE_STYLE = 'link[rel="stylesheet"][href*="css/pages/"]';
const STORE_KEY = "veil";
const COVER_MS = 560;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Moves between pages without reloading, so music and sounds carry on.
 * The ink veil covers the swap. If a page can't be fetched, it falls back
 * to a normal page load.
 */
export class Router {
  /**
   * @param {object} options
   * @param {Function} options.onLeave  unmounts the current page
   * @param {Function} options.onEnter  mounts the page with the given name
   */
  constructor({ session, sound, bus, onLeave, onEnter }) {
    Object.assign(this, { session, sound, bus, onLeave, onEnter });
    this.pages = new Map();
    this.busy = false;
  }

  mount(page) {
    this.page = page;
    this.veil = document.createElement("div");
    this.veil.className = "veil";
    this.veil.dataset.shell = "";
    this.veil.setAttribute("aria-hidden", "true");
    this.veil.innerHTML = '<span translate="no"></span>';
    this.word = this.veil.firstElementChild;
    document.body.appendChild(this.veil);
    this.revealAfterLoad();

    history.scrollRestoration = "manual";
    history.replaceState({ page }, "", location.href);
    document.addEventListener("click", (event) => this.onClick(event));
    document.addEventListener("pointerover", (event) => this.prefetch(event.target.closest?.("a[href]")));
    window.addEventListener("popstate", () => this.go(location.href, { push: false }));
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) this.veil.className = "veil";
    });
  }

  /** Reveals the page after a full load that started with an ink cover. */
  revealAfterLoad() {
    const root = document.documentElement;
    if (root.classList.contains("arriving")) {
      this.word.textContent = PAGE_TITLES[this.page] ?? "";
      this.veil.style.clipPath = "circle(150% at 50% 50%)";
      root.classList.remove("arriving");
      requestAnimationFrame(() => {
        this.veil.style.clipPath = "";
        this.uncover();
      });
    }
    this.session.remove(STORE_KEY);
  }

  onClick(event) {
    const link = event.target.closest("a[href]");
    if (!link || event.defaultPrevented) return;
    if (link.target === "_blank" || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!INTERNAL_LINK.test(link.getAttribute("href"))) return;
    event.preventDefault();
    this.go(link.href, { from: event });
  }

  pageName(href) {
    const url = new URL(href, location.href);
    if (url.origin !== location.origin) return null;
    const match = (url.pathname.split("/").pop() || "index.html").match(PAGE_FILE);
    if (!match) return null;
    return match[1] === "index" ? "home" : match[1];
  }

  async go(href, { push = true, from = null } = {}) {
    const name = this.pageName(href);
    if (!name || this.busy || (push && name === this.page)) return;
    this.busy = true;
    if (!from) this.sound.play("turn");
    const animate = !prefersReducedMotion();

    try {
      const loading = this.load(href);
      if (animate) await this.cover(name, from);
      const next = await loading;
      const staleStyle = await this.applyStyle(next.style);
      this.onLeave();
      this.swap(next, staleStyle);
      if (push) history.pushState({ page: name }, "", href);
      this.page = name;
      window.scrollTo(0, 0);
      this.bus.emit("page:change", name);
      await this.onEnter(name);
      if (animate) this.uncover();
    } catch {
      this.session.write(STORE_KEY, true);
      window.location.href = href;
    } finally {
      this.busy = false;
    }
  }

  prefetch(link) {
    if (!link || !INTERNAL_LINK.test(link.getAttribute("href"))) return;
    this.fetchHtml(link.href).catch(() => {});
  }

  fetchHtml(href) {
    const key = new URL(href, location.href).pathname;
    if (!this.pages.has(key)) {
      const request = fetch(href).then((response) => {
        if (!response.ok) throw new Error(`${response.status} ${href}`);
        return response.text();
      });
      request.catch(() => this.pages.delete(key));
      this.pages.set(key, request);
    }
    return this.pages.get(key);
  }

  async load(href) {
    const html = await this.fetchHtml(href);
    const doc = new DOMParser().parseFromString(html, "text/html");
    return {
      title: doc.title,
      bodyClass: doc.body.className,
      page: doc.body.dataset.page,
      style: doc.querySelector(PAGE_STYLE)?.getAttribute("href") ?? null,
      nodes: [...doc.body.children]
    };
  }

  /** Loads the next page's stylesheet before the swap; returns the old one to remove. */
  async applyStyle(href) {
    const current = document.querySelector(PAGE_STYLE);
    if (!href || current?.getAttribute("href") === href) return null;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    await new Promise((resolve) => {
      link.onload = link.onerror = resolve;
      document.head.appendChild(link);
    });
    return current;
  }

  swap(next, staleStyle) {
    const footer = document.querySelector(".site-footer");
    for (const element of [...document.body.children]) {
      if (!element.hasAttribute("data-shell")) element.remove();
    }
    for (const node of next.nodes) document.body.insertBefore(document.adoptNode(node), footer);
    staleStyle?.remove();
    document.title = next.title;
    document.body.className = next.bodyClass;
    document.body.dataset.page = next.page;
    document.documentElement.style.overflow = "";
    const main = document.querySelector("main");
    if (main) {
      main.tabIndex = -1;
      main.focus({ preventScroll: true });
    }
  }

  async cover(name, from) {
    this.word.textContent = PAGE_TITLES[name] ?? "";
    this.veil.style.setProperty("--vx", from ? `${from.clientX}px` : "50%");
    this.veil.style.setProperty("--vy", from ? `${from.clientY}px` : "50%");
    this.veil.className = "veil cover";
    await delay(COVER_MS);
  }

  uncover() {
    this.veil.className = "veil reveal";
    this.veil.addEventListener("animationend", () => (this.veil.className = "veil"), { once: true });
  }
}
