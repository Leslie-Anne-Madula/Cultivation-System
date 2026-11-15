/** Certificates as graded treasures in the Treasure Pavilion. */

const CERTIFICATES = "assets/certificates/";

/*
 * Grades follow the opening line of the Thousand Character Classic and
 * rank how close a treasure sits to the Host's field, IT.
 */
export const grades = {
  heaven: { glyph: "天", name: "Heaven", meaning: "Core IT" },
  earth: { glyph: "地", name: "Earth", meaning: "Close to IT" },
  mystic: { glyph: "玄", name: "Mystic", meaning: "Loosely tied to IT" },
  yellow: { glyph: "黄", name: "Yellow", meaning: "Outside IT" }
};

/*
 * Ordered from highest grade to lowest. form: pendant | slip | talisman | token | scroll | pill.
 * `file` names the certificate's PDF and JPG preview in assets/certificates/, without the extension.
 */
const TREASURES = [
  {
    id: "nse2", glyph: "御", grade: "heaven", form: "pendant",
    item: "Second-Tier Guardian Pendant",
    title: "Fortinet NSE 2 · Certified in Cybersecurity",
    issuer: "Fortinet Training Institute",
    date: "24 Oct 2026",
    effect: "Fortinet's second certification tier in cybersecurity. Valid until 24 Oct 2028. Validation number 1545980720LA.",
    file: "fortinet-nse2-certified",
    verify: "https://training.fortinet.com/admin/tool/certificate/index.php"
  },
  {
    id: "nse1", glyph: "护", grade: "heaven", form: "pendant",
    item: "First-Tier Guardian Pendant",
    title: "Fortinet NSE 1 · Certified in Cybersecurity",
    issuer: "Fortinet Training Institute",
    date: "24 Oct 2026",
    effect: "Fortinet's first certification tier in cybersecurity. Valid until 24 Oct 2028. Validation number 8461966543LA.",
    file: "fortinet-nse1-certified",
    verify: "https://training.fortinet.com/admin/tool/certificate/index.php"
  },
  {
    id: "firewall", glyph: "阵", grade: "heaven", form: "scroll",
    item: "Barrier Formation Scroll",
    title: "Introduction to Next Generation Firewall 1.0 · Certificate of Course Completion",
    issuer: "Fortinet Training Institute",
    date: "24 Oct 2026",
    effect: "How next-generation firewalls inspect network traffic and stop threats before they get in.",
    file: "fortinet-nse2-course"
  },
  {
    id: "cyber-cloud", glyph: "守", grade: "heaven", form: "slip",
    item: "Jade Slip of Warding Basics",
    title: "Cybersecurity and Cloud Fundamentals 1.0 · Certificate of Course Completion",
    issuer: "Fortinet Training Institute",
    date: "24 Oct 2026",
    effect: "The basics of cybersecurity and cloud computing, and the common threats both have to guard against.",
    file: "fortinet-nse1-course"
  },
  {
    id: "azure", glyph: "丹", grade: "heaven", form: "pill",
    item: "Azure Insight Pill",
    title: "Microsoft Artificial Intelligence Course: Azure AI Fundamentals · Certificate of Completion",
    issuer: "TESDA Online Program",
    date: "22 Oct 2026",
    effect: "Fully refined. Core AI and machine-learning concepts on Microsoft Azure, completed through TESDA. Certificate code QRNIHRk4SA.",
    file: "tesda-azure-ai-fundamentals"
  },
  {
    id: "kiro", glyph: "灵", grade: "heaven", form: "talisman",
    item: "Spirit Companion Talisman",
    title: "“Build from the Clouds”: Kiroverse Workshop",
    issuer: "AWS Student Builder Group · University of Cabuyao",
    date: "8 Aug 2026",
    effect: "Hands-on practice in AI-assisted software development with Kiro.",
    file: "aws-kiro-workshop"
  },
  {
    id: "trailhead", glyph: "云", grade: "heaven", form: "talisman",
    item: "Cloud Trail Talisman",
    title: "“Build from the Clouds”: Trailhead",
    issuer: "AWS Student Builder Group · University of Cabuyao",
    date: "8 Aug 2026",
    effect: "A first walk through cloud technology on AWS, and an entry into its student builder community.",
    file: "aws-trailhead"
  },
  {
    id: "ignite", glyph: "商", grade: "earth", form: "slip",
    item: "Merchant Sage's Jade Slip",
    title: "Ignite Philippines · Certificate of Content Completion",
    issuer: "Wadhwani Foundation",
    date: "26 Mar 2026",
    effect: "42 hours of technopreneurship: turning an idea into a business model and a financial plan.",
    file: "wadhwani-ignite-philippines"
  },
  {
    id: "thesis", glyph: "卷", grade: "earth", form: "scroll",
    item: "Capstone Preparation Scroll",
    title: "Thesis & Capstone Ready: Preparing 3rd Year Students",
    issuer: "College of Computing Studies · University of Cabuyao",
    date: "10 Jan 2026",
    effect: "Readied the Host for the thesis and capstone project that every IT student must complete.",
    file: "thesis-capstone-ready"
  },
  {
    id: "orientation", glyph: "令", grade: "mystic", form: "token",
    item: "Sect Entry Token",
    title: "CCS Student Orientation · Certificate of Attendance",
    issuer: "College of Computing Studies · University of Cabuyao",
    date: "20 Jan 2026",
    effect: "Briefed on the sect's academic policies, services and student journey.",
    file: "ccs-student-orientation"
  },
  {
    id: "efset", glyph: "言", grade: "yellow", form: "pendant",
    item: "Jade Pendant of Ten Thousand Tongues",
    title: "EF SET English Certificate · C2 Proficient",
    issuer: "EF Standard English Test",
    date: "12 Jul 2024",
    effect: "Command of the common tongue at the highest CEFR tier. Score 82/100: Reading 73, Listening 79, Writing 100, Speaking 77.",
    file: "efset-english-c2",
    verify: "https://cert.efset.org/FERBL3"
  },
  {
    id: "scholar", glyph: "试", grade: "yellow", form: "token",
    item: "Flawless Examination Token",
    title: "Scholarship Exam Quiz · Certificate of Achievement",
    issuer: "ProProfs Quiz Maker",
    date: "7 Feb 2024",
    effect: "A perfect 100/100 on the scholarship exam quiz.",
    file: "scholarship-exam-quiz"
  }
];

/** Treasures with the paths of their preview image and PDF filled in from `file`. */
export const treasures = TREASURES.map(({ file, ...treasure }) =>
  file ? { ...treasure, image: `${CERTIFICATES}${file}.jpg`, pdf: `${CERTIFICATES}${file}.pdf` } : treasure
);

export const inventorySlots = 16;
