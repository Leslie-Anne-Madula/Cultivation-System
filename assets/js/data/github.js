/** GitHub details for the Status page's records and Scroll Library. Live data replaces these when GitHub can be reached. */

/** Shown when GitHub can't be reached. */
export const githubSnapshot = {
  takenAt: "2026-10-19",
  publicRepos: 5,
  followers: 0,
  createdAt: "2025-03-06T06:59:22Z",
  contributionsLastYear: 4,
  calendar: null,
  repos: [
    { name: "MP2-productlisting", description: null, fork: true, updatedAt: "2026-03-06T01:04:17Z" },
    { name: "MP2-todoapp", description: "Resilient Networking with Paging 3 and OkHttp", fork: true, updatedAt: "2026-02-26T15:18:13Z" },
    { name: "Sim-Studio-AI", description: "Open-source platform to build and deploy AI agent workflows.", fork: true, updatedAt: "2026-02-06T14:23:33Z" },
    { name: "Tindafy", description: "Error state and advance use of composable components", fork: true, updatedAt: "2026-01-29T14:40:33Z" },
    { name: "Kohi-Anne", description: "A school project about WYSIWYG", fork: false, language: "CSS", updatedAt: "2025-03-13T14:39:12Z" }
  ]
};

/*
 * Other people's repositories you contributed to. Public pull requests, issues
 * and commits are found automatically; list anything GitHub can't see here,
 * for example { repo: "teammate/capstone", note: "Built the attendance module." }
 */
export const contributions = [];

/** Extra details for your own repositories, matched by name. */
export const repoNotes = {
  "MP2-productlisting": { language: "Kotlin", source: "joseph-cartagenas/productlisting" },
  "MP2-todoapp": { language: "Kotlin", source: "joseph-cartagenas/todoapp" },
  "Sim-Studio-AI": { language: "TypeScript", source: "simstudioai/sim" },
  "Tindafy": { language: "Kotlin", source: "joseph-cartagenas/Tindafy" }
};
