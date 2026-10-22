import { escapeHtml } from "../core/dom.js";

const MAX_VISIBLE = 3;

/** System notifications in the top-right corner. Emits toast { cue }. */
export class Notifier {
  constructor({ bus }) {
    this.bus = bus;
    this.container = null;
  }

  show(message, { glyph = "叮", label = "System", duration = 5600, cue = "notify" } = {}) {
    const container = this.ensureContainer();
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.innerHTML = `
      <span class="seal" translate="no" aria-hidden="true">${escapeHtml(glyph)}</span>
      <div><span class="label">${escapeHtml(label)}</span><p>${escapeHtml(message)}</p></div>`;
    container.appendChild(toast);
    while (container.children.length > MAX_VISIBLE) container.firstElementChild.remove();
    this.bus.emit("toast", { cue });

    const dismiss = () => {
      toast.classList.add("leaving");
      setTimeout(() => toast.remove(), 450);
    };
    const timer = setTimeout(dismiss, duration);
    toast.addEventListener("click", () => {
      clearTimeout(timer);
      dismiss();
    });
  }

  ensureContainer() {
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.className = "toasts";
      this.container.dataset.shell = "";
      this.container.setAttribute("aria-live", "polite");
      document.body.appendChild(this.container);
    }
    return this.container;
  }
}
