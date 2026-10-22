import { glyph } from "../../core/dom.js";

const TYPE_SPEED_MS = 15;
const STAMP_MS = 620;

/**
 * The "system binding" intro shown once per browser session. It types its
 * lines, then waits for the visitor to press Enter before revealing the page.
 * A click or key press while typing shows every line at once.
 */
export class AwakeningSequence {
  constructor({ content, sound }) {
    this.sound = sound;
    this.lines = [
      { text: "【System】 A spiritual root has been detected.", system: true },
      { text: `Host: ${content.host.name}` },
      { text: "Affinity: Information Technology · Wood and Water" },
      { text: "Binding the Heavenly Dao System…", pause: 1500, fillsBar: true },
      { text: "【System】 Binding complete. A visitor has arrived.", system: true },
      { text: "Welcome, fellow Daoist." }
    ];
    this.timers = [];
    this.state = "typing";
  }

  run() {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.render();
      this.schedule();
    });
  }

  render() {
    this.element = document.createElement("div");
    this.element.className = "awakening";
    this.element.setAttribute("role", "dialog");
    this.element.setAttribute("aria-modal", "true");
    this.element.setAttribute("aria-label", "System awakening");
    this.element.innerHTML = `
      <div class="awakening-panel">
        <button class="awakening-skip" type="button" data-sound="none">Skip</button>
        <div class="awakening-head"><span class="seal" translate="no" aria-hidden="true">叮</span><span class="label">Heavenly Dao System</span></div>
        <div class="awakening-lines" aria-live="polite"></div>
        <div class="awakening-bar"><span></span></div>
        <div class="awakening-foot">
          <span class="awakening-hint">Awaiting confirmation</span>
          <button class="btn solid" type="button" data-sound="none">${glyph("入")}Enter</button>
        </div>
        <span class="seal stamp" translate="no" aria-hidden="true">入</span>
      </div>`;
    document.body.appendChild(this.element);
    document.documentElement.style.overflow = "hidden";

    this.linesBox = this.element.querySelector(".awakening-lines");
    this.bar = this.element.querySelector(".awakening-bar span");
    this.enterButton = this.element.querySelector(".awakening-foot .btn");
    this.stamp = this.element.querySelector(".stamp");

    this.element.querySelector(".awakening-skip").addEventListener("click", (event) => {
      event.stopPropagation();
      this.leave();
    });
    this.enterButton.addEventListener("click", (event) => {
      event.stopPropagation();
      this.enter();
    });
    this.element.addEventListener("click", () => this.revealAll());
    this.onKey = (event) => {
      if (event.key === "Escape") this.leave();
      else if (this.state === "typing" && event.key !== "Tab") this.revealAll();
      else if (this.state === "waiting" && event.key === "Enter" && event.target !== this.enterButton) this.enter();
    };
    document.addEventListener("keydown", this.onKey);
  }

  schedule() {
    let at = 300;
    this.lines.forEach((line, index) => {
      this.later(() => this.typeLine(line, index), at);
      at += line.text.length * TYPE_SPEED_MS + (line.pause ?? 380);
    });
    this.later(() => this.awaitEntry(true), at);
  }

  typeLine(line, index) {
    const paragraph = this.addLine(line);
    this.linesBox.querySelectorAll(".caret").forEach((caret) => caret.remove());
    this.sound.play("hover", { index: index * 2 });
    if (line.fillsBar) this.later(() => (this.bar.style.width = "100%"), 200);

    let count = 0;
    const type = () => {
      if (this.state !== "typing") return;
      paragraph.textContent = line.text.slice(0, ++count);
      const caret = document.createElement("span");
      caret.className = "caret";
      paragraph.appendChild(caret);
      if (count < line.text.length) this.later(type, TYPE_SPEED_MS);
    };
    type();
  }

  addLine(line) {
    const paragraph = document.createElement("p");
    if (line.system) paragraph.className = "system";
    paragraph.textContent = line.text;
    this.linesBox.appendChild(paragraph);
    return paragraph;
  }

  revealAll() {
    if (this.state !== "typing") return;
    this.clearTimers();
    this.linesBox.replaceChildren();
    this.lines.forEach((line) => this.addLine(line));
    this.bar.style.transition = "none";
    this.bar.style.width = "100%";
    this.awaitEntry(false);
  }

  awaitEntry(chime) {
    if (this.state !== "typing") return;
    this.state = "waiting";
    this.linesBox.querySelectorAll(".caret").forEach((caret) => caret.remove());
    this.element.classList.add("ready");
    this.enterButton.focus({ preventScroll: true, focusVisible: false });
    if (chime) this.sound.play("notify");
  }

  enter() {
    if (this.state !== "waiting") return;
    this.state = "entering";
    this.stamp.classList.add("down");
    this.sound.play("stamp");
    this.later(() => this.leave(), STAMP_MS);
  }

  leave() {
    if (this.state === "gone") return;
    this.state = "gone";
    this.clearTimers();
    document.removeEventListener("keydown", this.onKey);
    document.documentElement.style.overflow = "";
    this.element.classList.add("leaving");
    setTimeout(() => this.element.remove(), 1150);
    this.resolve();
  }

  later(fn, ms) {
    this.timers.push(setTimeout(fn, ms));
  }

  clearTimers() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }
}
