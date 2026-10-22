import { escapeHtml, glyph } from "../core/dom.js";

/** Floating quest button and panel. Announces quest progress through the notifier. */
export class QuestPanel {
  constructor({ quests, notifier, bus }) {
    Object.assign(this, { quests, notifier, bus });
  }

  mount() {
    this.toggleButton = document.createElement("button");
    this.toggleButton.type = "button";
    this.toggleButton.className = "quest-toggle";
    this.toggleButton.dataset.shell = "";
    this.toggleButton.dataset.sound = "open";
    this.toggleButton.setAttribute("aria-expanded", "false");
    this.toggleButton.setAttribute("aria-controls", "quest-panel");
    this.toggleButton.setAttribute("aria-label", "Quest log");
    this.toggleButton.title = "Quest log";
    this.toggleButton.innerHTML = `<span translate="no" aria-hidden="true">任</span><span class="quest-count"></span>`;

    this.panel = document.createElement("div");
    this.panel.className = "quest-panel";
    this.panel.dataset.shell = "";
    this.panel.id = "quest-panel";
    this.panel.hidden = true;
    document.body.append(this.toggleButton, this.panel);

    this.toggleButton.addEventListener("click", () => this.setOpen(this.panel.hidden));
    this.panel.addEventListener("click", (event) => {
      if (event.target.closest("[data-action='reset']")) this.quests.reset();
    });
    document.addEventListener("click", (event) => {
      const path = event.composedPath();
      if (!this.panel.hidden && !path.includes(this.panel) && !path.includes(this.toggleButton)) this.setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !this.panel.hidden) {
        this.setOpen(false);
        this.toggleButton.focus();
      }
    });

    this.bus.on("quest:completed", (detail) => this.announce(detail));
    this.bus.on("quest:reset", () => {
      this.render();
      this.notifier.show("Quest log cleared. The path begins again.", { glyph: "任", label: "Quest", cue: "tap" });
    });
    this.render();
  }

  setOpen(open) {
    this.panel.hidden = !open;
    this.toggleButton.setAttribute("aria-expanded", String(open));
    if (open) this.render();
  }

  render() {
    const { quests } = this;
    const done = quests.doneCount;
    this.toggleButton.querySelector(".quest-count").textContent = `${done}/${quests.total}`;
    const items = quests.quests.map((quest) => `
      <li class="${quests.isDone(quest.id) ? "done" : ""}">
        <span class="quest-box" aria-hidden="true"></span>
        <span><span class="quest-name">${escapeHtml(quest.text)}</span><small>${escapeHtml(quest.hint)}</small></span>
      </li>`).join("");
    this.panel.innerHTML = `
      <h2 class="h3">${glyph("任务")} Quest Log</h2>
      <p class="quest-rank">Your rank as a visitor: <b>${escapeHtml(quests.rank.name)}</b></p>
      <div class="quest-progress" role="progressbar" aria-label="Quests complete" aria-valuemin="0" aria-valuemax="${quests.total}" aria-valuenow="${done}">
        <span style="width:${(done / quests.total) * 100}%"></span>
      </div>
      <ul class="quest-list">${items}</ul>
      <div class="quest-footer"><span>Insight ${done * 10} / ${quests.total * 10}</span><button type="button" data-action="reset" data-sound="tap">Reset quests</button></div>`;
  }

  announce({ quest, done, total, rank, rankChanged }) {
    this.render();
    this.toggleButton.classList.remove("bump");
    void this.toggleButton.offsetWidth;
    this.toggleButton.classList.add("bump");

    this.notifier.show(`Quest complete: ${quest.text}. Insight +10 (${done}/${total}).`, { glyph: "任", label: "Quest", cue: "quest" });
    if (done === total) {
      setTimeout(() => this.notifier.show(`All quests complete. You are now an ${rank.name}. Thank you for walking this path with me.`, { glyph: "谢", label: "The Host", duration: 9000 }), 1100);
    } else if (rankChanged) {
      setTimeout(() => this.notifier.show(`Your visitor rank rose to ${rank.name}.`, { glyph: "升", label: "Breakthrough" }), 900);
    }
  }
}
