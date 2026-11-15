/** Who the Host is: identity, cultivation realm and attributes on the Status page. */

export const host = {
  name: "Leslie Anne M. Madula",
  title: "Seeker of Emerging Systems",
  email: "lesliemadula.official@gmail.com",
  github: "leslie-anne-madula",
  location: "Sta. Rosa, Laguna, Philippines",
  resume: "assets/docs/Resume_Madula.pdf",
  sect: "College of Computing Studies, University of Cabuyao",
  spiritRoot: "Wood and Water: interfaces and data",
  dao: "Creation: building applications people enjoy using",
  condition: "Seeking a sect for internship"
};

/** The stage (Early to Peak) is worked out from how far today falls between programStart and programEnd. */
export const realm = {
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
};

/** Radar values out of 100. */
export const attributes = [
  { glyph: "悟性", name: "Comprehension", value: 88, note: "Self-taught in most of the stack. New tools don't stay unfamiliar for long." },
  { glyph: "神识", name: "Spirit Sense", value: 85, note: "An eye for layout and detail. An app has to look right, not only work." },
  { glyph: "道心", name: "Dao Heart", value: 86, note: "Organized and dependable. Tasks get planned, tracked and finished." },
  { glyph: "应变", name: "Adaptability", value: 87, note: "Has moved from PHP to Java to Flutter to React, and kept up each time." },
  { glyph: "言灵", name: "Eloquence", value: 82, note: "EF SET 82/100, C2 Proficient. Sharpened further in sales and chat support." }
];
