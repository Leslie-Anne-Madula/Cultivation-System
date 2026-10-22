const DAY_MS = 86400000;
const CALENDAR_DAYS = 371;

const byNewest = (key) => (a, b) => String(b[key] ?? "").localeCompare(String(a[key] ?? ""));

/**
 * Reads the private repository details saved by scripts/sync-private-repos.mjs
 * and merges them into the public GitHub data.
 */
export class PrivateRepoService {
  constructor({ url }) {
    this.url = url;
  }

  async load() {
    try {
      const response = await fetch(this.url, { cache: "no-cache" });
      if (!response.ok) return null;
      const data = await response.json();
      return data.generatedAt ? data : null;
    } catch {
      return null;
    }
  }

  merge(publicData, privateData) {
    if (!privateData) return publicData;
    const owned = privateData.repos.filter((repo) => repo.owned);
    const contributed = privateData.repos.filter((repo) => !repo.owned);
    return {
      ...publicData,
      privateRepos: owned.length,
      privateSyncedAt: privateData.generatedAt,
      contributionsLastYear: Math.max(publicData.contributionsLastYear ?? 0, privateData.calendar?.total ?? 0),
      calendar: this.mergeCalendars(publicData.calendar, privateData.calendar?.days),
      repos: [...publicData.repos, ...owned.map((repo) => this.toOwnRepo(repo))].sort(byNewest("updatedAt")),
      contributedRepos: this.mergeContributions(publicData.contributedRepos ?? [], contributed)
    };
  }

  toOwnRepo(repo) {
    return {
      name: repo.name,
      description: repo.description,
      fork: repo.fork,
      language: repo.language,
      url: null,
      updatedAt: repo.lastActive,
      commits: repo.commits,
      private: true
    };
  }

  mergeContributions(entries, contributed) {
    const byName = new Map(entries.map((entry) => [entry.name.toLowerCase(), entry]));
    for (const repo of contributed) {
      const key = repo.fullName.toLowerCase();
      const existing = byName.get(key);
      byName.set(key, {
        name: repo.fullName,
        url: null,
        note: existing?.note ?? null,
        description: repo.description,
        language: repo.language,
        pullRequests: repo.pullRequests,
        merged: repo.merged,
        issues: existing?.issues ?? 0,
        commits: repo.commits,
        lastActive: repo.lastActive,
        highlight: null,
        listed: existing?.listed ?? false,
        private: true
      });
    }
    return [...byName.values()].sort(byNewest("lastActive"));
  }

  /** Combines two daily calendars, keeping the higher count for each day. */
  mergeCalendars(publicDays, privateDays) {
    if (!privateDays?.length) return publicDays;
    const days = new Map((publicDays ?? []).map((day) => [day.date, day]));
    for (const day of privateDays) {
      const current = days.get(day.date);
      if (!current || day.count > current.count) days.set(day.date, day);
    }
    const since = new Date(Date.now() - CALENDAR_DAYS * DAY_MS).toISOString().slice(0, 10);
    return [...days.values()].filter((day) => day.date >= since).sort((a, b) => a.date.localeCompare(b.date));
  }
}
