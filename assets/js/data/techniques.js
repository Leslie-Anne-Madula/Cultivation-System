/** The tech stack as Five Element techniques on the Status page. */

export const mastery = [
  { level: 1, name: "Initiate", glyph: "入门" },
  { level: 2, name: "Minor Mastery", glyph: "小成" },
  { level: 3, name: "Major Mastery", glyph: "大成" },
  { level: 4, name: "Perfection", glyph: "圆满" }
];

/*
 * Listed in the generating cycle, starting at the top of the wheel.
 * tag: short label under the wheel node; domain: manual heading;
 * level: a mastery level from 1 to 4.
 */
export const elements = [
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
];

export const defaultElement = "wood";

/** How each element feeds the next, shown on the wheel's arcs. */
export const cycle = {
  "wood-fire": "Wood feeds Fire. Front-end skills are what mobile apps are built from.",
  "fire-earth": "Fire leaves Earth behind. Once an app is made, it needs somewhere to live.",
  "earth-metal": "Earth bears Metal. Server code runs on the ground that deployment lays.",
  "metal-water": "Metal gathers Water. Back-end code is what reads and writes the data.",
  "water-wood": "Water nourishes Wood. Data gives every screen something to show."
};
