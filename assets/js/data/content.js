import { grades as treasureGrades, treasures as treasureCatalog, inventorySlots as treasureInventorySlots } from "./treasures.js";

/**
 * Site content. Lists, links and numbers shown on the pages are read from here.
 */
export const content = {
  host: {
    name: "Leslie Anne M. Madula",
    title: "Seeker of Emerging Systems",
    email: "lesliemadula.official@gmail.com",
    github: "Leslie-Anne-Madula",
    location: "Sta. Rosa, Laguna, Philippines",
    resume: "assets/docs/Resume_Madula.pdf",
    sect: "College of Computing Studies, University of Cabuyao",
    spiritRoot: "Wood and Water: interfaces and data",
    dao: "Creation: building applications people enjoy using",
    condition: "Seeking a sect for internship"
  },

  realm: {
    name: "Golden Core",
    glyph: "金丹",
    next: "Nascent Soul",
    nextGlyph: "元婴",
    breakthrough: "internship",
    programStart: "2023-08-01",
    programEnd: "2027-06-30",
    stages: [
      { upTo: 40, name: "Early Stage", glyph: "初期" },
      { upTo: 70, name: "Middle Stage", glyph: "中期" },
      { upTo: 90, name: "Late Stage", glyph: "后期" },
      { upTo: 100, name: "Peak Stage", glyph: "圆满" }
    ]
  },

  attributes: [
    { glyph: "悟性", name: "Comprehension", value: 88, note: "Self-taught in most of the stack. New tools don't stay unfamiliar for long." },
    { glyph: "神识", name: "Spirit Sense", value: 85, note: "An eye for layout and detail. An app has to look right, not only work." },
    { glyph: "道心", name: "Dao Heart", value: 86, note: "Organized and dependable. Tasks get planned, tracked and finished." },
    { glyph: "应变", name: "Adaptability", value: 87, note: "Has moved from PHP to Java to Flutter to React, and kept up each time." },
    { glyph: "言灵", name: "Eloquence", value: 82, note: "EF SET 82/100, C2 Proficient. Sharpened further in sales and chat support." }
  ],

  mastery: [
    { level: 1, name: "Initiate", glyph: "入门" },
    { level: 2, name: "Minor Mastery", glyph: "小成" },
    { level: 3, name: "Major Mastery", glyph: "大成" },
    { level: 4, name: "Perfection", glyph: "圆满" }
  ],

  /*
   * Listed in the generating cycle, starting at the top of the wheel.
   * tag: short label under the wheel node; domain: manual heading.
   */
  elements: [
    {
      key: "fire", glyph: "火", name: "Fire", tag: "Mobile & AI", domain: "Mobile, AI and scripting",
      text: "Fire turns one thing into another. Here, that means apps for phones and putting AI to work.",
      techniques: [
        { tech: "Flutter / Dart", art: "Flying Dart Widget Art", level: 3, note: "Cross-platform mobile apps from a single codebase." },
        { tech: "Python", art: "Coiled Serpent Scripture", level: 3, note: "Scripting, automation and small AI experiments." },
        { tech: "Azure AI Fundamentals", art: "Azure Sky Insight", level: 4, note: "Core AI concepts on Microsoft Azure, completed through TESDA's Microsoft AI course." },
        { tech: "Kiro (AI-assisted dev)", art: "Spirit Companion Pact", level: 4, note: "AI-assisted software development, from the AWS Kiroverse workshop." }
      ]
    },
    {
      key: "earth", glyph: "土", name: "Earth", tag: "Deployment", domain: "Version control and deployment",
      text: "Earth is the ground a project stands on: code kept safe, shared with a team and running somewhere real.",
      techniques: [
        { tech: "Git & GitHub", art: "Archive of Ten Thousand Commits", level: 3, note: "Version control, branches and collaboration." },
        { tech: "Railway", art: "Cloud Rail Ascension", level: 2, note: "Deploying apps and databases to the cloud." },
        { tech: "AWS basics", art: "Cloud Trail Wayfinding", level: 4, note: "Cloud fundamentals from AWS Trailhead." }
      ]
    },
    {
      key: "metal", glyph: "金", name: "Metal", tag: "Back-end", domain: "Back-end languages",
      text: "Metal is hard and exact, like the server code and rules an app quietly runs on.",
      techniques: [
        { tech: "PHP", art: "Server Hall Scripture", level: 3, note: "Server-side pages, forms and sessions." },
        { tech: "Java", art: "Iron Object Body Tempering", level: 3, note: "Object-oriented programming fundamentals." },
        { tech: "C#", art: "Sharp Note Sword Art", level: 3, note: "Object-oriented apps in the .NET world." }
      ]
    },
    {
      key: "water", glyph: "水", name: "Water", tag: "Databases", domain: "Databases and data services",
      text: "Water takes the shape of whatever holds it and keeps what is poured in. In an app, that is the data.",
      techniques: [
        { tech: "MySQL", art: "Ten Thousand Tables Formation", level: 4, note: "Relational schemas, joins and queries." },
        { tech: "Supabase", art: "Spring Source Art", level: 2, note: "Postgres, auth and storage as a service." },
        { tech: "Firebase", art: "Flame Spring Paradox", level: 3, note: "Realtime data and auth. Despite its name, it flows with Water." }
      ]
    },
    {
      key: "wood", glyph: "木", name: "Wood", tag: "Front-end", domain: "Front-end",
      text: "Wood grows up toward the light, where it can be seen. These are the pages and screens people actually use.",
      techniques: [
        { tech: "HTML", art: "Skeleton Formation Art", level: 4, note: "Semantic, accessible page structure." },
        { tech: "CSS", art: "Silk Robe Weaving", level: 4, note: "Layout, responsive design and motion." },
        { tech: "Bootstrap", art: "Twelve-Column Array", level: 3, note: "Fast responsive layouts on Bootstrap's 12-column grid." },
        { tech: "JavaScript", art: "Myriad Events Scripture", level: 4, note: "DOM work, events and async logic in the browser." },
        { tech: "React", art: "Thousand Components Art", level: 2, note: "Component-based interfaces with state and hooks." }
      ]
    }
  ],
  defaultElement: "wood",

  cycle: {
    "wood-fire": "Wood feeds Fire. Front-end skills are what mobile apps are built from.",
    "fire-earth": "Fire leaves Earth behind. Once an app is made, it needs somewhere to live.",
    "earth-metal": "Earth bears Metal. Server code runs on the ground that deployment lays.",
    "metal-water": "Metal gathers Water. Back-end code is what reads and writes the data.",
    "water-wood": "Water nourishes Wood. Data gives every screen something to show."
  },

  path: [
    {
      glyph: "凡人", realm: "Mortal Origins", when: "SY 2020 – 2023", title: "Junior & Senior High School",
      text: "Before the path had a name, I studied steadily and finished both junior and senior high with honors.",
      merits: ["With Honors · Junior and Senior High School"]
    },
    {
      glyph: "历练", realm: "Worldly Trial", when: "Mar 8 – Jul 5, 2022", title: "Zai ML Apparel",
      text: "My first trial in the mortal market. I handled sales and customer chat support for an independent online store.",
      merits: ["Sales and Customer Chat Support"]
    },
    {
      glyph: "练气", realm: "Qi Refining", when: "2023", title: "Information and Communication Technology",
      text: "The first threads of qi. I began formal study of ICT at CITI Global College Inc.",
      merits: ["ICT · CITI Global College Inc."]
    },
    {
      glyph: "筑基", realm: "Foundation Establishment", when: "SY 2023 – 2024", title: "BSIT, University of Cabuyao · Year One",
      text: "I entered the sect and laid my foundation in programming, databases and teamwork.",
      merits: [
        "Vice President for Academic Affairs' Lister · First Year BSIT",
        "Best Group in Project Implementation · NSTP–CWTS",
        "Scholarship Exam Quiz · 100/100"
      ]
    },
    {
      glyph: "金丹", realm: "Golden Core", when: "2024 – present", title: "BSIT, University of Cabuyao · Years Two to Four",
      text: "Everything I learned condensed into a core: web, mobile, data and cloud, now refined toward graduation.",
      merits: [
        "Fortinet NSE 1 & 2 · Certified in Cybersecurity",
        "Azure AI Fundamentals · TESDA",
        "AWS Build from the Clouds · Trailhead & Kiroverse",
        "Ignite Philippines · Wadhwani Foundation",
        "Thesis & Capstone Ready",
        "EF SET English · C2 Proficient"
      ],
      current: true
    },
    {
      glyph: "元婴", realm: "Nascent Soul", when: "Next breakthrough", title: "Internship",
      text: "Breakthrough condition: join a sect as an intern. The next lessons are the ones only a real team can teach.",
      merits: [],
      locked: true
    }
  ],

  grades: treasureGrades,
  treasures: treasureCatalog,
  inventorySlots: treasureInventorySlots,

  /* Shown when GitHub can't be reached. */
  githubSnapshot: {
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
  },

  /*
   * Other people's repositories you contributed to. Public pull requests, issues
   * and commits are found automatically; list anything GitHub can't see here,
   * for example { repo: "teammate/capstone", note: "Built the attendance module." }
   */
  contributions: [],

  /* Extra details for your own repositories, matched by name. */
  repoNotes: {
    "MP2-productlisting": { language: "Kotlin", source: "joseph-cartagenas/productlisting" },
    "MP2-todoapp": { language: "Kotlin", source: "joseph-cartagenas/todoapp" },
    "Sim-Studio-AI": { language: "TypeScript", source: "simstudioai/sim" },
    "Tindafy": { language: "Kotlin", source: "joseph-cartagenas/Tindafy" }
  },

  quests: [
    { id: "awaken", text: "Awaken the System", hint: "Visit the home page." },
    { id: "status", text: "Read the Status Window", hint: "Open the Status page." },
    { id: "element", text: "Study an element's techniques", hint: "Pick an element on the Status page." },
    { id: "path", text: "Reach the end of the Path", hint: "Scroll to the Nascent Soul realm." },
    { id: "treasure", text: "Inspect a treasure", hint: "Open an item in the Treasury." },
    { id: "invite", text: "Draft a sect invitation", hint: "Press Invite in the top bar." }
  ],
  visitorRanks: [
    { min: 0, name: "Wandering Mortal" },
    { min: 2, name: "Outer Disciple" },
    { min: 4, name: "Inner Disciple" },
    { min: 6, name: "Honored Guest of the Sect" }
  ]
};
