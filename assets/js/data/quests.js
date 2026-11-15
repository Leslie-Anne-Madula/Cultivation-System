/** The visitor quest log, and the rank a visitor earns by completing quests. */

export const quests = [
  { id: "awaken", text: "Awaken the System", hint: "Visit the home page." },
  { id: "status", text: "Read the Status Window", hint: "Open the Status page." },
  { id: "element", text: "Study an element's techniques", hint: "Pick an element on the Status page." },
  { id: "path", text: "Reach the end of the Path", hint: "Scroll to the Nascent Soul realm." },
  { id: "treasure", text: "Inspect a treasure", hint: "Open an item in the Treasury." },
  { id: "invite", text: "Draft a sect invitation", hint: "Press Invite in the top bar." }
];

export const visitorRanks = [
  { min: 0, name: "Wandering Mortal" },
  { min: 2, name: "Outer Disciple" },
  { min: 4, name: "Inner Disciple" },
  { min: 6, name: "Honored Guest of the Sect" }
];
