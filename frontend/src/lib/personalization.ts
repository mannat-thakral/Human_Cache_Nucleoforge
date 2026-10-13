/**
 * Universal Personalization & Learning Taxonomy Engine for Human Cache
 *
 * Supports learners across:
 * - Arts & Humanities
 * - Commerce & Business
 * - Sciences
 * - Engineering & Technology
 * - Medical & Healthcare
 * - Law, Public Admin, Education & Agriculture
 * - Competitive Examinations (UPSC, JEE, NEET, Banking, CA, GATE, GRE, etc.)
 * - Personal Skills & Development (Music, Writing, Speaking, Finance, etc.)
 * - General & Lifelong Learning
 */

export interface LearningGoalOption {
  id: string;
  label: string;
  desc: string;
  streamHint?: string[];
}

export interface LearnerRoleOption {
  id: string;
  label: string;
  desc: string;
}

export interface StreamCategory {
  id: string;
  label: string;
  iconName: string;
  color: string;
  subjects: string[];
}

export const UNIVERSAL_GOALS: LearningGoalOption[] = [
  { id: "school_studies", label: "School & Board Studies", desc: "Grade 6-12 syllabus, CBSE, ICSE, State Boards & NCERT" },
  { id: "college_university", label: "College & University Degree", desc: "Undergraduate / Postgraduate coursework & university exams" },
  { id: "competitive_exam", label: "Competitive Exam Preparation", desc: "UPSC, JEE, NEET, GATE, CAT, Banking, Law, SSC & civil services" },
  { id: "professional_career", label: "Professional Upskilling & Career", desc: "Industry expertise, certifications, career transition & leadership" },
  { id: "technical_craft", label: "Software, Engineering & Tech Craft", desc: "Programming, system design, data science, electronics & mechanics" },
  { id: "commerce_business", label: "Business, Finance & Entrepreneurship", desc: "Accounting, investments, market analysis & startup operations" },
  { id: "creative_arts", label: "Humanities, Creative Arts & Languages", desc: "History, psychology, writing, languages, design & social sciences" },
  { id: "personal_growth", label: "Personal Skills & Self-Development", desc: "Public speaking, productivity, financial literacy & communication" },
  { id: "academic_research", label: "Research, Papers & Deep Synthesis", desc: "Literature reviews, scientific papers, citations & thesis drafting" },
  { id: "lifelong_curiosity", label: "Curiosity & Lifelong Learning", desc: "Broad intellectual exploration, non-fiction reading & evergreen knowledge" },
  { id: "other", label: "+ Other Learning Purpose", desc: "Custom learning goal tailored specifically for you" }
];

export const UNIVERSAL_ROLES: LearnerRoleOption[] = [
  { id: "school_student", label: "School Student", desc: "Primary, middle or secondary school pupil" },
  { id: "college_student", label: "College / University Student", desc: "Pursuing bachelor's, master's or diploma degree" },
  { id: "competitive_aspirant", label: "Competitive Exam Aspirant", desc: "Preparing for national or state examinations" },
  { id: "working_professional", label: "Working Professional", desc: "Industry practitioner upgrading domain skills" },
  { id: "researcher_academic", label: "Researcher / Academic", desc: "Postdoc, faculty, scholar or thesis writer" },
  { id: "teacher_educator", label: "Teacher or Educator", desc: "Instructors creating curriculum and drill materials" },
  { id: "creative_artist", label: "Creative, Writer or Artist", desc: "Authors, designers, creators and musicians" },
  { id: "self_directed_learner", label: "Self-Directed / Lifelong Learner", desc: "Independent seeker mastering knowledge for curiosity" },
  { id: "other", label: "+ Other Role", desc: "Describe your personal learner identity" }
];

export const TAXONOMY_STREAMS: StreamCategory[] = [
  {
    id: "arts_humanities",
    label: "Arts & Humanities",
    iconName: "BookOpen",
    color: "#f97316",
    subjects: [
      "History",
      "Political Science & Civics",
      "Geography",
      "Sociology",
      "Psychology",
      "Philosophy & Ethics",
      "English Literature & Composition",
      "Languages & Linguistics",
      "Fine Arts & Art History",
      "Journalism & Mass Communication"
    ]
  },
  {
    id: "commerce_business",
    label: "Commerce & Business",
    iconName: "TrendingUp",
    color: "#f59e0b",
    subjects: [
      "Accountancy & Bookkeeping",
      "Economics (Micro & Macro)",
      "Business Studies & Management",
      "Finance & Financial Markets",
      "Taxation & Corporate Law",
      "Marketing & Branding",
      "Entrepreneurship & Startups",
      "Supply Chain & Operations"
    ]
  },
  {
    id: "sciences",
    label: "Science",
    iconName: "Atom",
    color: "#10b981",
    subjects: [
      "Physics",
      "Chemistry",
      "Mathematics & Statistics",
      "Biology & Life Sciences",
      "Environmental Science & Ecology",
      "Genetics & Evolution",
      "Astronomy & Astrophysics"
    ]
  },
  {
    id: "engineering_tech",
    label: "Engineering & Technology",
    iconName: "Code",
    color: "#6366f1",
    subjects: [
      "Computer Science & Algorithms",
      "Software Development & Programming",
      "Artificial Intelligence & Machine Learning",
      "Data Science & Analytics",
      "Mechanical Engineering",
      "Electrical & Electronics Engineering",
      "Civil & Structural Engineering",
      "Cybersecurity & Cloud Computing"
    ]
  },
  {
    id: "medical_health",
    label: "Medical & Healthcare",
    iconName: "Dna",
    color: "#f43f5e",
    subjects: [
      "Human Anatomy & Physiology",
      "Biochemistry & Pharmacology",
      "Pathology & Microbiology",
      "Clinical Medicine & Surgery",
      "Nursing & Patient Care",
      "Public Health & Epidemiology",
      "Nutrition & Dietetics"
    ]
  },
  {
    id: "law_governance",
    label: "Law, Governance & Public Administration",
    iconName: "Scale",
    color: "#8b5cf6",
    subjects: [
      "Constitutional Law & Jurisprudence",
      "Criminal Law & Penal Code",
      "Public Administration & Policy",
      "International Relations & Diplomacy",
      "Human Rights & Legal Ethics",
      "Corporate & Intellectual Property Law"
    ]
  },
  {
    id: "personal_skills",
    label: "Personal Skills & Practical Arts",
    iconName: "Sparkles",
    color: "#ec4899",
    subjects: [
      "Public Speaking & Debate",
      "Creative Writing & Storytelling",
      "Personal Financial Literacy & Investing",
      "Music Theory & Instruments",
      "Photography & Visual Design",
      "Productivity & Time Architecture",
      "Culinary Arts & Nutrition",
      "Critical Thinking & Logic"
    ]
  },
  {
    id: "general_knowledge",
    label: "General Knowledge & Interdisciplinary",
    iconName: "Globe",
    color: "#64748b",
    subjects: [
      "Indian Polity & Constitution",
      "World History & Geopolitics",
      "Current Affairs & Global Events",
      "Cognitive Science & Mental Models",
      "General Science & Everyday Tech"
    ]
  }
];

export const POPULAR_EXAMS: { group: string; exams: string[] }[] = [
  {
    group: "Civil Services & Governance",
    exams: ["UPSC Civil Services (CSE)", "State PCS / PSC", "SSC CGL / CHSL", "NDA / CDS"]
  },
  {
    group: "Engineering & Sciences",
    exams: ["JEE Advanced & Main", "GATE Engineering", "BITSAT / State CET", "JAM (M.Sc)"]
  },
  {
    group: "Medical & Health",
    exams: ["NEET UG", "NEET PG / INI-CET", "AIIMS Nursing"]
  },
  {
    group: "Commerce, Finance & Law",
    exams: ["CA (Foundation / Inter / Final)", "CLAT / Law Entrances", "CFA / FRM", "CS (Company Secretary)"]
  },
  {
    group: "Management & University Entrances",
    exams: ["CAT / XAT / MBA", "CUET UG & PG", "GRE / GMAT", "SAT / ACT"]
  },
  {
    group: "Banking, Insurance & Railways",
    exams: ["IBPS PO / Clerk", "SBI PO / Clerk", "RBI Grade B", "RRB Railways"]
  }
];

/**
 * Given selected goals, roles, and target exams, computes recommended subjects
 * without restricting users from picking any subjects from any stream.
 */
export function getRecommendedSubjects(
  goals: string[],
  roles: string[],
  targetExam?: string
): string[] {
  const recommended = new Set<string>();

  const examLower = (targetExam || "").toLowerCase();
  if (examLower.includes("jee")) {
    recommended.add("Physics");
    recommended.add("Chemistry");
    recommended.add("Mathematics & Statistics");
  } else if (examLower.includes("neet")) {
    recommended.add("Biology & Life Sciences");
    recommended.add("Chemistry");
    recommended.add("Physics");
  } else if (examLower.includes("upsc") || examLower.includes("pcs")) {
    recommended.add("History");
    recommended.add("Political Science & Civics");
    recommended.add("Geography");
    recommended.add("Economics (Micro & Macro)");
    recommended.add("Current Affairs & Global Events");
  } else if (examLower.includes("ca") || examLower.includes("cfa") || examLower.includes("banking") || examLower.includes("ibps")) {
    recommended.add("Accountancy & Bookkeeping");
    recommended.add("Finance & Financial Markets");
    recommended.add("Economics (Micro & Macro)");
    recommended.add("Taxation & Corporate Law");
  } else if (examLower.includes("clat") || examLower.includes("law")) {
    recommended.add("Constitutional Law & Jurisprudence");
    recommended.add("Critical Thinking & Logic");
    recommended.add("Current Affairs & Global Events");
  } else if (examLower.includes("gate") || examLower.includes("cat")) {
    recommended.add("Mathematics & Statistics");
    recommended.add("Computer Science & Algorithms");
    recommended.add("Critical Thinking & Logic");
  }

  // Goals-driven recommendations
  if (goals.includes("creative_arts")) {
    recommended.add("History");
    recommended.add("Psychology");
    recommended.add("Philosophy & Ethics");
    recommended.add("English Literature & Composition");
    recommended.add("Creative Writing & Storytelling");
  }
  if (goals.includes("commerce_business")) {
    recommended.add("Accountancy & Bookkeeping");
    recommended.add("Economics (Micro & Macro)");
    recommended.add("Business Studies & Management");
    recommended.add("Finance & Financial Markets");
  }
  if (goals.includes("technical_craft")) {
    recommended.add("Computer Science & Algorithms");
    recommended.add("Software Development & Programming");
    recommended.add("Artificial Intelligence & Machine Learning");
    recommended.add("Data Science & Analytics");
  }
  if (goals.includes("personal_growth")) {
    recommended.add("Public Speaking & Debate");
    recommended.add("Personal Financial Literacy & Investing");
    recommended.add("Productivity & Time Architecture");
    recommended.add("Cognitive Science & Mental Models");
  }
  if (goals.includes("school_studies")) {
    recommended.add("Mathematics & Statistics");
    recommended.add("Physics");
    recommended.add("Chemistry");
    recommended.add("Biology & Life Sciences");
    recommended.add("History");
    recommended.add("Geography");
  }

  // Roles-driven additions
  if (roles.includes("creative_artist")) {
    recommended.add("Creative Writing & Storytelling");
    recommended.add("Fine Arts & Art History");
    recommended.add("Music Theory & Instruments");
  }
  if (roles.includes("working_professional")) {
    recommended.add("Public Speaking & Debate");
    recommended.add("Business Studies & Management");
    recommended.add("Productivity & Time Architecture");
  }
  if (roles.includes("researcher_academic")) {
    recommended.add("Cognitive Science & Mental Models");
    recommended.add("Mathematics & Statistics");
  }

  // Fallback defaults if none matched
  if (recommended.size === 0) {
    recommended.add("Physics");
    recommended.add("Mathematics & Statistics");
    recommended.add("History");
    recommended.add("Economics (Micro & Macro)");
    recommended.add("Cognitive Science & Mental Models");
  }

  return Array.from(recommended);
}
