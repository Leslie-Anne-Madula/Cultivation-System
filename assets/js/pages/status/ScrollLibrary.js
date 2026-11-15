import { escapeHtml, formatDate, glyph } from "../../core/dom.js";

const MAX_ITEMS_PER_PAGE = 5;

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

/** Tabbed list of the user's own repositories and the repositories they contributed to. */
export class ScrollLibrary {
  constructor({ tabs, panel }, { username, notes }) {
    this.tabs = tabs;
    this.panel = panel;
    this.username = username;
    this.notes = notes;
    this.activeSection = 0;
  }

  render({ repos = [], contributedRepos = [] }) {
    this.sections = [
      { id: "own", label: "My repositories", items: repos, page: 0, renderItem: (repo) => this.ownItem(repo), empty: "No public repositories yet." },
      {
        id: "contributed",
        label: "Contributed to",
        items: contributedRepos,
        page: 0,
        renderItem: (entry) => this.contributedItem(entry),
        empty: "No contributions to other projects are recorded yet. New pull requests, issues and commits on other repositories appear here on their own."
      }
    ];
    this.tabs.innerHTML = this.sections.map((section, index) => `
      <button class="library-tab" type="button" role="tab" id="library-tab-${section.id}" data-section="${index}"
        aria-controls="library-panel" aria-selected="${index === 0}" data-sound="select" data-sound-index="${index * 3}">
        ${escapeHtml(section.label)}<span class="count tabular">${section.items.length}</span>
      </button>`).join("");
    this.panel.id = "library-panel";
    this.tabs.addEventListener("click", (event) => {
      const tab = event.target.closest("[data-section]");
      if (tab) this.show(Number(tab.dataset.section));
    });
    this.panel.addEventListener("click", (event) => {
      const button = event.target.closest("[data-page]");
      if (!button) return;
      const section = this.sections[this.activeSection];
      const totalPages = Math.max(1, Math.ceil(section.items.length / MAX_ITEMS_PER_PAGE));
      if (button.dataset.page === "prev") section.page = Math.max(0, section.page - 1);
      if (button.dataset.page === "next") section.page = Math.min(totalPages - 1, section.page + 1);
      this.show(this.activeSection);
    });
    this.show(0);
  }

  show(index) {
    this.activeSection = index;
    const section = this.sections[index];
    this.tabs.querySelectorAll("[data-section]").forEach((tab, i) => tab.setAttribute("aria-selected", String(i === index)));
    this.panel.setAttribute("aria-labelledby", `library-tab-${section.id}`);

    if (!section.items.length) {
      this.panel.innerHTML = `<p class="library-empty">${escapeHtml(section.empty)}</p>`;
      return;
    }

    const totalPages = Math.max(1, Math.ceil(section.items.length / MAX_ITEMS_PER_PAGE));
    const pageStart = section.page * MAX_ITEMS_PER_PAGE;
    const pageItems = section.items.slice(pageStart, pageStart + MAX_ITEMS_PER_PAGE);
    const pagination = totalPages > 1 ? `
      <div class="library-pagination" aria-label="Repository pages">
        <button class="library-page-btn" type="button" data-page="prev" ${section.page === 0 ? "disabled" : ""}>Previous</button>
        <span class="library-page-status">Page ${section.page + 1} / ${totalPages}</span>
        <button class="library-page-btn" type="button" data-page="next" ${section.page >= totalPages - 1 ? "disabled" : ""}>Next</button>
      </div>` : "";

    this.panel.innerHTML = `${pageItems.map(section.renderItem).join("")}${pagination}`;
  }

  ownItem(repo) {
    const note = this.notes[repo.name] ?? {};
    const origin = repo.private
      ? ["Private scroll", repo.commits && plural(repo.commits, "commit")].filter(Boolean).join(" · ")
      : repo.fork ? `Transcribed from ${note.source ?? "another sect"}` : "Original scroll";
    const details = [repo.language || note.language, repo.updatedAt && `updated ${formatDate(repo.updatedAt)}`].filter(Boolean).join(" · ");
    return this.item({
      url: repo.private ? null : repo.url || `https://github.com/${this.username}/${repo.name}`,
      mark: repo.private ? "秘" : "卷",
      name: repo.name,
      tags: [repo.private && "Private", repo.fork && "Fork"],
      text: repo.description || "No description written yet.",
      meta: [origin, details]
    });
  }

  contributedItem(entry) {
    const work = [
      entry.pullRequests && `${plural(entry.pullRequests, "pull request")}${entry.merged ? ` (${entry.merged} merged)` : ""}`,
      entry.commits && plural(entry.commits, "commit"),
      entry.issues && plural(entry.issues, "issue")
    ].filter(Boolean).join(" · ");
    const details = [entry.language, entry.lastActive && `last on ${formatDate(entry.lastActive)}`].filter(Boolean).join(" · ");
    return this.item({
      url: entry.private ? null : entry.highlight?.url ?? entry.url,
      mark: "助",
      name: entry.name,
      tags: [entry.private && "Private", entry.merged && "Merged"],
      text: entry.note || entry.highlight?.title || entry.description || "Contributed to this project.",
      meta: [work || "Contributor", details]
    });
  }

  /** Private repositories render without a link, since visitors can't open them. */
  item({ url, mark, name, tags, text, meta }) {
    const body = `
        ${glyph(mark)}
        <span><b>${escapeHtml(name)}</b>${tags.filter(Boolean).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}<p>${escapeHtml(text)}</p></span>
        <span class="meta">${meta.filter(Boolean).map(escapeHtml).join("<br>")}</span>`;
    return url
      ? `<a class="repo" href="${escapeHtml(url)}" target="_blank" rel="noopener">${body}</a>`
      : `<div class="repo private">${body}</div>`;
  }
}
