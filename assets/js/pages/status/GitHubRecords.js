import { escapeHtml, formatDate } from "../../core/dom.js";
import { tween } from "../../core/motion.js";
import { ContributionMap } from "./ContributionMap.js";
import { ScrollLibrary } from "./ScrollLibrary.js";

const DAY_MS = 86400000;

/** Live GitHub numbers, the contribution map and the repository library. */
export class GitHubRecords {
  constructor(root, { github, privateRepos, content }) {
    this.root = root;
    this.github = github;
    this.privateRepos = privateRepos;
    this.stats = root.querySelector("[data-stats]");
    this.status = document.querySelector("[data-live]");
    this.map = new ContributionMap({
      grid: root.querySelector("[data-heat]"),
      months: root.querySelector("[data-heat-months]"),
      tip: root.querySelector("[data-heat-tip]"),
      profileUrl: github.profileUrl
    });
    this.library = new ScrollLibrary(
      { tabs: root.querySelector("[data-library-tabs]"), panel: root.querySelector("[data-library]") },
      { username: content.host.github, notes: content.repoNotes }
    );
  }

  async render() {
    const [publicData, privateData] = await Promise.all([this.github.load(), this.privateRepos.load()]);
    const data = this.privateRepos.merge(publicData, privateData);
    this.renderStats(data);
    this.renderStatus(data);
    this.map.render(data.calendar);
    this.library.render(data);
  }

  renderStats(data) {
    const days = data.createdAt ? Math.floor((Date.now() - new Date(data.createdAt).getTime()) / DAY_MS) : null;
    const items = [
      {
        value: data.publicRepos + (data.privateRepos ?? 0),
        name: "Scrolls held",
        caption: data.privateRepos ? `${data.publicRepos} public · ${data.privateRepos} private` : "Public repositories"
      },
      { value: data.contributionsLastYear, name: "Qi gathered", caption: "Contributions, past year" },
      { value: days, name: "Days cultivating", caption: "Since joining GitHub" },
      { value: data.followers, name: "Fellow Daoists", caption: "Followers" }
    ];
    this.stats.innerHTML = items.map((item) => `
      <div class="stat">
        <span class="number">${typeof item.value === "number" ? 0 : "—"}</span>
        <span class="name">${escapeHtml(item.name)}</span>
        <span class="caption">${escapeHtml(item.caption)}</span>
      </div>`).join("");
    const numbers = this.stats.querySelectorAll(".number");
    items.forEach((item, i) => {
      if (typeof item.value === "number") tween(1200, (p) => (numbers[i].textContent = Math.round(item.value * p)));
    });
  }

  renderStatus(data) {
    const label = this.status.querySelector("span");
    if (data.live) {
      this.status.classList.add("on");
      const time = new Date(data.syncedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      const privateNote = data.privateSyncedAt ? ` · private repositories as of ${formatDate(data.privateSyncedAt)}` : "";
      label.textContent = `Live from GitHub · synced ${time}${privateNote}`;
    } else {
      label.textContent = `GitHub unreachable · showing the record from ${formatDate(data.syncedAt)}`;
    }
  }
}
