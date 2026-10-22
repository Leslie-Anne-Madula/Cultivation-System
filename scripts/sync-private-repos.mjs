/**
 * Collects public-safe details about the private repositories you own or
 * contributed to, plus your full contribution calendar, and saves them to
 * assets/data/private-repos.json for the Status page.
 *
 * Usage: PORTFOLIO_TOKEN=<classic token with repo scope> node scripts/sync-private-repos.mjs
 * Optional: PORTFOLIO_AUTHOR_EMAILS=<comma-separated commit emails> counts commits by email
 * instead of by account, and keeps those addresses out of the repository.
 * Only names, descriptions, languages and counts are saved. No code leaves GitHub.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_PATH = resolve(ROOT, "assets/data/private-repos.json");
const CONFIG_PATH = resolve(ROOT, "scripts/private-repos.config.json");
const MAX_PAGES = 10;
const LEVELS = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

const VIEWER_QUERY = `
  query {
    viewer {
      login
      id
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks { contributionDays { date contributionCount contributionLevel } }
        }
      }
    }
  }`;

const REPOSITORIES_QUERY = `
  query($cursor: String, $author: CommitAuthor!) {
    viewer {
      repositories(
        first: 50
        after: $cursor
        privacy: PRIVATE
        affiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER]
        ownerAffiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER]
        orderBy: { field: PUSHED_AT, direction: DESC }
      ) {
        pageInfo { hasNextPage endCursor }
        nodes {
          nameWithOwner
          name
          description
          isFork
          pushedAt
          owner { login }
          primaryLanguage { name }
          defaultBranchRef { target { ... on Commit { history(author: $author) { totalCount } } } }
        }
      }
    }
  }`;

const PULL_REQUESTS_QUERY = `
  query($search: String!) {
    search(query: $search, type: ISSUE, first: 100) {
      nodes { ... on PullRequest { merged repository { nameWithOwner isPrivate } } }
    }
  }`;

export class GitHubGraphQL {
  constructor(token) {
    this.token = token;
  }

  async query(query, variables = {}) {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { Authorization: `bearer ${this.token}`, "Content-Type": "application/json", "User-Agent": "portfolio-private-sync" },
      body: JSON.stringify({ query, variables })
    });
    const body = await response.json();
    if (!response.ok || body.errors) {
      throw new Error(body.errors?.map((error) => error.message).join("; ") || `GitHub responded with ${response.status}`);
    }
    return body.data;
  }
}

export class PrivateRepoSync {
  /**
   * @param {object} options
   * @param {{query: Function}} options.client
   * @param {{hide: string[], showDescriptions: boolean, authorEmails: string[]}} options.config
   */
  constructor({ client, config }) {
    this.client = client;
    this.config = config;
  }

  async run() {
    const { viewer } = await this.client.query(VIEWER_QUERY);
    const author = this.config.authorEmails.length ? { emails: this.config.authorEmails } : { id: viewer.id };
    const [repositories, pullRequests] = await Promise.all([this.fetchRepositories(author), this.fetchPullRequests(viewer.login)]);
    return {
      generatedAt: new Date().toISOString(),
      calendar: this.toCalendar(viewer.contributionsCollection.contributionCalendar),
      repos: this.toRepos(repositories, pullRequests, viewer.login)
    };
  }

  async fetchRepositories(author) {
    const repositories = [];
    let cursor = null;
    for (let page = 0; page < MAX_PAGES; page++) {
      const { viewer } = await this.client.query(REPOSITORIES_QUERY, { cursor, author });
      repositories.push(...viewer.repositories.nodes);
      if (!viewer.repositories.pageInfo.hasNextPage) break;
      cursor = viewer.repositories.pageInfo.endCursor;
    }
    return repositories;
  }

  async fetchPullRequests(login) {
    const { search } = await this.client.query(PULL_REQUESTS_QUERY, { search: `is:pr author:${login} is:private` });
    return search.nodes.filter((pull) => pull.repository?.isPrivate);
  }

  toCalendar({ totalContributions, weeks }) {
    return {
      total: totalContributions,
      days: weeks.flatMap((week) => week.contributionDays).map((day) => ({
        date: day.date,
        count: day.contributionCount,
        level: LEVELS[day.contributionLevel] ?? 0
      }))
    };
  }

  toRepos(repositories, pullRequests, login) {
    const hidden = new Set(this.config.hide.map((name) => name.toLowerCase()));
    const pullsByRepo = new Map();
    for (const pull of pullRequests) {
      const key = pull.repository.nameWithOwner;
      const counts = pullsByRepo.get(key) ?? { total: 0, merged: 0 };
      counts.total += 1;
      if (pull.merged) counts.merged += 1;
      pullsByRepo.set(key, counts);
    }

    return repositories
      .filter((repo) => !hidden.has(repo.nameWithOwner.toLowerCase()))
      .map((repo) => {
        const pulls = pullsByRepo.get(repo.nameWithOwner) ?? { total: 0, merged: 0 };
        return {
          fullName: repo.nameWithOwner,
          name: repo.name,
          owner: repo.owner.login,
          owned: repo.owner.login.toLowerCase() === login.toLowerCase(),
          fork: repo.isFork,
          description: this.config.showDescriptions ? repo.description : null,
          language: repo.primaryLanguage?.name ?? null,
          commits: repo.defaultBranchRef?.target?.history?.totalCount ?? 0,
          pullRequests: pulls.total,
          merged: pulls.merged,
          lastActive: repo.pushedAt
        };
      })
      .filter((repo) => repo.owned || repo.commits > 0 || repo.pullRequests > 0);
  }
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

async function main() {
  const token = process.env.PORTFOLIO_TOKEN;
  if (!token) {
    console.error("Set PORTFOLIO_TOKEN to a classic GitHub token with the repo scope.");
    process.exitCode = 1;
    return;
  }
  const config = { hide: [], showDescriptions: true, authorEmails: [], ...(await readJson(CONFIG_PATH, {})) };
  const privateEmails = (process.env.PORTFOLIO_AUTHOR_EMAILS ?? "").split(",").map((email) => email.trim()).filter(Boolean);
  config.authorEmails = [...new Set([...config.authorEmails, ...privateEmails])];
  const data = await new PrivateRepoSync({ client: new GitHubGraphQL(token), config }).run();

  const previous = await readJson(OUTPUT_PATH, {});
  const unchanged = JSON.stringify({ ...previous, generatedAt: null }) === JSON.stringify({ ...data, generatedAt: null });
  if (unchanged) {
    console.log("Private repository data is already up to date.");
    return;
  }
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Saved ${data.repos.length} private repositories and ${data.calendar.total} contributions.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message.includes("401") ? "GitHub rejected the token. Check that it is a classic token with the repo scope." : error.message);
    process.exitCode = 1;
  });
}
