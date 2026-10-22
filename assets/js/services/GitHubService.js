const CACHE_KEY = "github-v2";
const CACHE_TTL = 30 * 60 * 1000;
const DETAIL_LIMIT = 6;
const API = "https://api.github.com";
const WEIGHT = { merged: 4, pull: 3, commit: 2, issue: 1 };

/**
 * Loads a public GitHub profile, its repositories, the contribution calendar
 * and the other repositories the user has contributed to. Results are cached;
 * a bundled snapshot is used when GitHub can't be reached.
 */
export class GitHubService {
  /**
   * @param {object} options
   * @param {string} options.username
   * @param {import("../core/Storage.js").Storage} options.storage
   * @param {object} options.snapshot  offline fallback
   * @param {{repo: string, note?: string}[]} [options.listed] contributions GitHub can't detect
   */
  constructor({ username, storage, snapshot, listed = [] }) {
    this.username = username;
    this.storage = storage;
    this.snapshot = snapshot;
    this.listed = listed;
  }

  get profileUrl() {
    return `https://github.com/${this.username}`;
  }

  async load() {
    const cached = this.storage.read(CACHE_KEY);
    if (cached && Date.now() - cached.savedAt < CACHE_TTL) return { ...cached.data, live: true, syncedAt: cached.savedAt };

    try {
      const data = await this.fetchAll();
      const savedAt = Date.now();
      this.storage.write(CACHE_KEY, { savedAt, data });
      return { ...data, live: true, syncedAt: savedAt };
    } catch {
      if (cached) return { ...cached.data, live: false, syncedAt: cached.savedAt };
      return {
        ...this.snapshot,
        contributedRepos: this.listed.map((item) => this.createEntry(item.repo, item.note)),
        live: false,
        syncedAt: new Date(this.snapshot.takenAt).getTime()
      };
    }
  }

  async fetchAll() {
    const user = this.username;
    const [profile, repos, calendar, contributedRepos] = await Promise.all([
      this.fetchJson(`${API}/users/${user}`),
      this.fetchJson(`${API}/users/${user}/repos?per_page=100&sort=updated`),
      this.fetchJson(`https://github-contributions-api.jogruber.de/v4/${user}?y=last`).catch(() => null),
      this.fetchContributedRepos()
    ]);
    return {
      publicRepos: profile.public_repos,
      followers: profile.followers,
      createdAt: profile.created_at,
      contributionsLastYear: calendar?.total?.lastYear ?? null,
      calendar: calendar?.contributions ?? null,
      repos: repos.map((repo) => ({
        name: repo.name,
        description: repo.description,
        fork: repo.fork,
        language: repo.language,
        url: repo.html_url,
        updatedAt: repo.pushed_at || repo.updated_at
      })),
      contributedRepos
    };
  }

  /** Repositories owned by others that received the user's pull requests, issues or commits. */
  async fetchContributedRepos() {
    const query = (q) => encodeURIComponent(q);
    const [pulls, issues, commits] = await Promise.all([
      this.search(`issues?q=${query(`type:pr author:${this.username}`)}`),
      this.search(`issues?q=${query(`type:issue author:${this.username}`)}`),
      this.search(`commits?q=${query(`author:${this.username}`)}`)
    ]);

    const entries = new Map();
    const entryFor = (name) => {
      if (!entries.has(name)) entries.set(name, this.createEntry(name));
      return entries.get(name);
    };

    for (const pull of pulls) {
      const name = pull.repository_url.split("/repos/")[1];
      if (this.isOwn(name)) continue;
      const entry = entryFor(name);
      entry.pullRequests += 1;
      const merged = Boolean(pull.pull_request?.merged_at);
      if (merged) entry.merged += 1;
      this.track(entry, { title: pull.title, url: pull.html_url, date: pull.created_at, weight: merged ? WEIGHT.merged : WEIGHT.pull });
    }
    for (const issue of issues) {
      const name = issue.repository_url.split("/repos/")[1];
      if (this.isOwn(name)) continue;
      const entry = entryFor(name);
      entry.issues += 1;
      this.track(entry, { title: issue.title, url: issue.html_url, date: issue.created_at, weight: WEIGHT.issue });
    }
    for (const commit of commits) {
      const name = commit.repository?.full_name;
      if (!name || commit.repository.fork || this.isOwn(name)) continue;
      const entry = entryFor(name);
      entry.commits += 1;
      this.track(entry, { title: commit.commit.message.split("\n")[0], url: commit.html_url, date: commit.commit.author?.date, weight: WEIGHT.commit });
    }
    for (const { repo, note } of this.listed) {
      const entry = entryFor(repo);
      entry.note = note ?? entry.note;
      entry.listed = true;
    }

    const list = [...entries.values()].sort((a, b) => (b.lastActive ?? "").localeCompare(a.lastActive ?? ""));
    await Promise.all(list.slice(0, DETAIL_LIMIT).map((entry) => this.addDetails(entry)));
    return list;
  }

  createEntry(name, note = null) {
    return { name, url: `https://github.com/${name}`, note, description: null, language: null, pullRequests: 0, merged: 0, issues: 0, commits: 0, lastActive: null, highlight: null, listed: Boolean(note) };
  }

  /** Keeps the most recent activity date and the most meaningful piece of work to feature. */
  track(entry, item) {
    if (!item.date) return;
    if (!entry.lastActive || item.date > entry.lastActive) entry.lastActive = item.date;
    const best = entry.highlight;
    if (!best || item.weight > best.weight || (item.weight === best.weight && item.date > best.date)) entry.highlight = item;
  }

  async addDetails(entry) {
    try {
      const repo = await this.fetchJson(`${API}/repos/${entry.name}`);
      entry.description = repo.description;
      entry.language = repo.language;
    } catch {
      /* details are optional */
    }
  }

  isOwn(fullName) {
    return fullName.split("/")[0].toLowerCase() === this.username.toLowerCase();
  }

  async search(path) {
    try {
      const result = await this.fetchJson(`${API}/search/${path}&per_page=100`);
      return result.items ?? [];
    } catch {
      return [];
    }
  }

  async fetchJson(url) {
    const response = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    return response.json();
  }
}
