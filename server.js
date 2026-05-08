const http = require("http");
const fsSync = require("fs");
const fs = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");

const ROOT = __dirname;
const FRONTEND_DIST = path.join(ROOT, "frontend", "dist");
loadEnvFile(path.join(ROOT, ".env"));
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.join(ROOT, "data");
const DB_PATH = process.env.LOGOS_DB_PATH
  ? path.resolve(ROOT, process.env.LOGOS_DB_PATH)
  : path.join(DATA_DIR, "logos.db.json");
const BRAIN_VERSION = "growth-brain-v1";
const BRAIN_MODE = process.env.BRAIN_MODE || "auto";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_API_URL = process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

const seedData = {
  skills: [
    { id: "technical_understanding", name: "Technical understanding", category: "core_stem", stageLabels: ["Emerging", "Building", "Confident", "Strong"] },
    { id: "mathematical_reasoning", name: "Mathematical reasoning", category: "core_stem", stageLabels: ["Emerging", "Building", "Confident", "Strong"] },
    { id: "data_literacy", name: "Data literacy", category: "core_stem", stageLabels: ["Emerging", "Building", "Confident", "Strong"] },
    { id: "problem_decomposition", name: "Problem decomposition", category: "core_stem", stageLabels: ["Emerging", "Building", "Confident", "Strong"] },
    { id: "critical_thinking", name: "Critical thinking", category: "core_stem", stageLabels: ["Emerging", "Building", "Confident", "Strong"] },
    { id: "communication", name: "Communication", category: "core_stem", stageLabels: ["Emerging", "Building", "Confident", "Strong"] },
    { id: "reflection", name: "Reflection", category: "core_stem", stageLabels: ["Emerging", "Building", "Confident", "Strong"] },
    { id: "ethical_awareness", name: "Ethical awareness", category: "core_stem", stageLabels: ["Emerging", "Building", "Confident", "Strong"] },

    { id: "stakeholder_awareness", name: "Stakeholder awareness", category: "path_specific", path: "challenger" },
    { id: "practical_problem_solving", name: "Practical problem solving", category: "path_specific", path: "challenger" },
    { id: "delivery_execution", name: "Delivery and execution", category: "path_specific", path: "challenger" },
    { id: "testing_quality", name: "Testing and quality", category: "path_specific", path: "challenger" },
    { id: "tool_fluency", name: "Tool fluency", category: "path_specific", path: "challenger" },
    { id: "collaboration", name: "Team collaboration", category: "path_specific", path: "challenger" },
    { id: "portfolio_communication", name: "Portfolio communication", category: "path_specific", path: "challenger" },
    { id: "real_world_impact", name: "Real-world impact", category: "path_specific", path: "challenger" },

    { id: "research_question_design", name: "Research question design", category: "path_specific", path: "visionary" },
    { id: "literature_awareness", name: "Literature awareness", category: "path_specific", path: "visionary" },
    { id: "methodological_reasoning", name: "Methodological reasoning", category: "path_specific", path: "visionary" },
    { id: "experiment_design", name: "Experiment design", category: "path_specific", path: "visionary" },
    { id: "evidence_synthesis", name: "Evidence synthesis", category: "path_specific", path: "visionary" },
    { id: "critical_evaluation", name: "Critical evaluation", category: "path_specific", path: "visionary" },
    { id: "academic_argumentation", name: "Academic argumentation", category: "path_specific", path: "visionary" },
    { id: "contribution_to_knowledge", name: "Contribution to knowledge", category: "path_specific", path: "visionary" },

  ],
  personas: [
    {
      id: "challenger",
      name: "Challenger",
      pathLabel: "Industry-focused path",
      identityMessage: "I solve practical problems and turn knowledge into useful outcomes.",
      tone: "direct, practical, outcome-focused",
      skillIds: [
        "stakeholder_awareness",
        "practical_problem_solving",
        "delivery_execution",
        "testing_quality",
        "tool_fluency",
        "collaboration",
        "portfolio_communication",
        "real_world_impact",
      ],
    },
    {
      id: "visionary",
      name: "Visionary",
      pathLabel: "Research-focused path",
      identityMessage: "I investigate complex questions and create new understanding.",
      tone: "curious, evidence-led, research-focused",
      skillIds: [
        "research_question_design",
        "literature_awareness",
        "methodological_reasoning",
        "experiment_design",
        "evidence_synthesis",
        "critical_evaluation",
        "academic_argumentation",
        "contribution_to_knowledge",
      ],
    },
  ],
  modules: [
    {
      id: "natural_language_processing",
      name: "Natural Language Processing",
      description: "Language data, model explanation, evaluation, error analysis, and responsible communication.",
      sampleWork:
        "This report builds a sentiment classifier for short movie reviews using tokenisation, TF-IDF features, and logistic regression. I explain how the text is cleaned, how the model learns weighted word patterns, and why F1 score is useful when the classes are uneven. The model performs well on clear positive or negative reviews, but it struggles with sarcasm and mixed opinions. A responsible next step would be to inspect false positives and false negatives, compare performance across review types, and discuss bias in the training data.",
      rubric: [
        {
          id: "nlp_pipeline_explanation",
          title: "NLP pipeline explanation",
          description: "Explains text preprocessing, feature representation, model choice, and prediction flow accurately.",
          skillLinks: [
            { skillId: "technical_understanding", weight: 1 },
            { skillId: "communication", weight: 0.6 },
          ],
          keywords: ["tokenisation", "preprocessing", "tf-idf", "embedding", "feature", "model", "classifier", "prediction", "pipeline"],
        },
        {
          id: "evaluation_metrics",
          title: "Evaluation and metrics",
          description: "Uses appropriate metrics, validation evidence, and numerical reasoning to interpret performance.",
          skillLinks: [
            { skillId: "mathematical_reasoning", weight: 0.8 },
            { skillId: "data_literacy", weight: 1 },
          ],
          keywords: ["accuracy", "precision", "recall", "f1", "confusion matrix", "validation", "test set", "metric", "baseline"],
        },
        {
          id: "error_analysis",
          title: "Error analysis and limitations",
          description: "Identifies model failures, explains likely causes, and proposes realistic improvements.",
          skillLinks: [
            { skillId: "critical_thinking", weight: 1 },
            { skillId: "data_literacy", weight: 0.7 },
            { skillId: "critical_evaluation", weight: 0.8 },
          ],
          keywords: ["error", "false positive", "false negative", "sarcasm", "limitation", "bias", "misclassified", "improvement"],
        },
        {
          id: "academic_communication",
          title: "Academic communication",
          description: "Presents the NLP work in a clear report structure with precise terminology and evidence-led claims.",
          skillLinks: [
            { skillId: "communication", weight: 1 },
            { skillId: "academic_argumentation", weight: 0.7 },
            { skillId: "reflection", weight: 0.4 },
          ],
          keywords: ["report", "methodology", "results", "evidence", "terminology", "argument", "conclusion", "reference"],
        },
      ],
    },
    {
      id: "green_chemistry",
      name: "Green Chemistry",
      description: "Sustainable chemical design, reaction efficiency, evidence use, risk, and environmental impact.",
      sampleWork:
        "This proposal compares two synthesis routes for an ester and argues that the greener route should use a safer solvent, lower temperature, and a catalyst that can be recovered. I calculate atom economy and discuss why yield alone is not enough to judge sustainability. The main risk is that replacing a solvent may reduce reaction rate, so the method should be tested with small-scale trials and waste measurements. The final recommendation balances product quality, energy use, toxicity, and disposal impact.",
      rubric: [
        {
          id: "green_principles",
          title: "Green chemistry principles",
          description: "Applies relevant green chemistry principles to explain safer, lower-waste chemical choices.",
          skillLinks: [
            { skillId: "technical_understanding", weight: 0.8 },
            { skillId: "ethical_awareness", weight: 1 },
            { skillId: "real_world_impact", weight: 0.6 },
          ],
          keywords: ["green chemistry", "safer solvent", "renewable", "waste", "toxicity", "catalyst", "sustainability", "hazard"],
        },
        {
          id: "quantitative_sustainability",
          title: "Quantitative sustainability reasoning",
          description: "Uses calculations or data such as atom economy, yield, energy use, or waste to justify decisions.",
          skillLinks: [
            { skillId: "mathematical_reasoning", weight: 1 },
            { skillId: "data_literacy", weight: 0.8 },
            { skillId: "critical_thinking", weight: 0.5 },
          ],
          keywords: ["atom economy", "yield", "energy", "temperature", "mass", "waste", "percentage", "metric", "compare"],
        },
        {
          id: "reaction_design_tradeoffs",
          title: "Reaction design trade-offs",
          description: "Compares feasible synthesis choices and explains trade-offs between efficiency, safety, cost, and quality.",
          skillLinks: [
            { skillId: "problem_decomposition", weight: 0.9 },
            { skillId: "practical_problem_solving", weight: 0.8 },
            { skillId: "methodological_reasoning", weight: 0.6 },
          ],
          keywords: ["route", "reaction", "trade-off", "solvent", "catalyst", "rate", "quality", "cost", "scale"],
        },
        {
          id: "environmental_argument",
          title: "Environmental argument and communication",
          description: "Builds a clear evidence-led recommendation about environmental impact and responsible practice.",
          skillLinks: [
            { skillId: "communication", weight: 0.9 },
            { skillId: "academic_argumentation", weight: 0.7 },
            { skillId: "real_world_impact", weight: 0.8 },
          ],
          keywords: ["environmental impact", "recommendation", "evidence", "risk", "responsible", "disposal", "safety", "conclusion"],
        },
      ],
    },
  ],
  students: [
    {
      id: "maya",
      name: "Maya Evans",
      programme: "BSc AI and Data Science",
      selectedPersonaId: "visionary",
      signUpGoals: ["Build confidence as a researcher", "Explain evidence more clearly", "Feel like I belong in technical modules"],
    },
    {
      id: "daniel",
      name: "Daniel Shah",
      programme: "BSc Computing",
      selectedPersonaId: "challenger",
      signUpGoals: ["Build a strong project portfolio", "Improve testing habits", "Connect technical work to user needs"],
    },
    {
      id: "aisha",
      name: "Aisha Rahman",
      programme: "BSc Applied Data Science",
      selectedPersonaId: "visionary",
      signUpGoals: ["Write sharper technical reports", "Learn how to evaluate models critically", "See progress in communication"],
    },
    {
      id: "leo",
      name: "Leo Bennett",
      programme: "BSc Software Engineering",
      selectedPersonaId: "challenger",
      signUpGoals: ["Ship stronger prototypes", "Explain trade-offs more clearly", "Turn assignments into portfolio stories"],
    },
    {
      id: "sana",
      name: "Sana Patel",
      programme: "BSc Intelligent Systems",
      selectedPersonaId: "visionary",
      signUpGoals: ["Improve methodological reasoning", "Strengthen academic tone", "Track my growth across modules"],
    },
  ],
  users: [],
  studentProfiles: [],
  studentSkillStates: [],
  submissions: [],
  submissionSessions: [],
  feedbackRecords: [],
  growthEvents: [],
  belongingnessCheckins: [],
  customModules: [],
  teacherModuleConfigs: [],
};

async function loadDb() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const db = JSON.parse(raw);
    return ensureDataShape(db);
  } catch (error) {
    const fresh = ensureDataShape(cloneData(seedData));
    await saveDb(fresh);
    return fresh;
  }
}

async function saveDb(db) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

function ensureDataShape(db) {
  mergeStoredModules(db);
  db.users ||= [];
  db.studentProfiles ||= [];
  db.studentSkillStates ||= [];
  db.submissions ||= [];
  db.submissionSessions ||= [];
  db.feedbackRecords ||= [];
  db.growthEvents ||= [];
  db.belongingnessCheckins ||= [];
  db.teacherModuleConfigs = normaliseStoredTeacherModuleConfigs(db.teacherModuleConfigs, db.modules);
  delete db.quickFeedbackConfig;
  ensureDemoStudentProfiles(db);

  for (const student of db.students) {
    ensureStudentSkillStates(db, student.id);
  }
  return db;
}

function mergeStoredModules(db) {
  const storedModules = Array.isArray(db.modules) && db.modules.length ? db.modules : cloneData(seedData.modules);
  const customModules = normaliseStoredCustomModules(db.customModules);
  const customIds = new Set(customModules.map((module) => module.id));
  const baseModules = normaliseStoredCustomModules(storedModules).filter((module) => !customIds.has(module.id));
  db.customModules = customModules;
  db.modules = [...baseModules, ...customModules];
}

function ensureDemoStudentProfiles(db) {
  for (const student of db.students) {
    const email = `${student.id}@logos.local`;
    let user = db.users.find((item) => item.role === "student" && item.studentId === student.id);
    if (!user) {
      user = {
        id: `user_${student.id}`,
        name: student.name,
        email,
        role: "student",
        studentId: student.id,
        createdAt: new Date().toISOString(),
      };
      db.users.push(user);
    }
    if (!db.studentProfiles.some((profile) => profile.studentId === student.id)) {
      db.studentProfiles.push(defaultStudentProfile(db, user.id, student.id));
    }
  }
}

function defaultStudentProfile(db, userId, studentId) {
  const coreSkillIds = db.skills.filter((skill) => skill.category === "core_stem").map((skill) => skill.id).slice(0, 5);
  return {
    id: `profile_${studentId}`,
    userId,
    studentId,
    selectedCoreSkillIds: coreSkillIds,
    selectedPersonalSkillIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function ensureStudentSkillStates(db, studentId) {
  const student = db.students.find((item) => item.id === studentId);
  if (!student) return;

  const trackedSkillIds = getTrackedSkillIds(db, student);
  for (const skillId of trackedSkillIds) {
    const exists = db.studentSkillStates.some((state) => state.studentId === studentId && state.skillId === skillId);
    if (!exists) {
      const skill = db.skills.find((item) => item.id === skillId);
      const baseline = baselineForSkill(skill, student.selectedPersonaId);
      db.studentSkillStates.push({
        studentId,
        skillId,
        baseline,
        current: baseline,
        target: Math.min(baseline + 32, 88),
        updatedAt: new Date().toISOString(),
      });
    }
  }
}

function baselineForSkill(skill, personaId) {
  if (skill.category === "belongingness") return personaId === "research" || personaId === "visionary" ? 48 : 50;
  if (skill.category === "path_specific") return personaId === "research" || personaId === "visionary" ? 44 : 46;
  return 52;
}

function getTrackedSkillIds(db, student) {
  const core = db.skills.filter((skill) => skill.category === "core_stem").map((skill) => skill.id);
  const profile = db.studentProfiles?.find((item) => item.studentId === student.id);
  const selectedCore = profile?.selectedCoreSkillIds?.length ? profile.selectedCoreSkillIds : core;
  const selectedPersonal = profile?.selectedPersonalSkillIds?.length ? profile.selectedPersonalSkillIds : getPersonaSkillIds(db, student.selectedPersonaId);
  return [...selectedCore, ...selectedPersonal];
}

function getPersonaSkillIds(db, personaId) {
  const persona = db.personas.find((item) => item.id === personaId);
  if (Array.isArray(persona?.skillIds)) return persona.skillIds;

  const personaPath = personaId === "visionary" ? "research" : personaId === "challenger" ? "industry" : personaId;
  return db.skills
    .filter((skill) => skill.category === "path_specific" && skill.path === personaPath)
    .map((skill) => skill.id);
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function sendError(response, statusCode, message, details = {}) {
  sendJson(response, statusCode, { error: message, ...details });
}

async function readJsonBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 1_000_000) {
      throw new Error("Request body is too large");
    }
  }
  return body ? JSON.parse(body) : {};
}

async function routeApi(request, response, pathname) {
  const db = await loadDb();
  const effectiveModules = getEffectiveModules(db);

  if (request.method === "GET" && pathname === "/api/health") {
    return sendJson(response, 200, { ok: true, service: "logos-feedback-coach" });
  }

  if (request.method === "GET" && pathname === "/api/brain/status") {
    return sendJson(response, 200, getBrainStatus());
  }

  if (request.method === "GET" && pathname === "/api/bootstrap") {
    return sendJson(response, 200, {
      ...db,
      modules: effectiveModules,
      brainStatus: getBrainStatus(),
      teacherAnalytics: buildTeacherAnalytics(db),
    });
  }

  if (request.method === "POST" && pathname === "/api/auth/login") {
    const payload = await readJsonBody(request);
    const result = loginOrCreateUser(db, payload);
    if (result.error) return sendError(response, result.status, result.error);
    await saveDb(db);
    return sendJson(response, 200, result);
  }

  if (request.method === "POST" && pathname === "/api/reset-demo") {
    const fresh = ensureDataShape(cloneData(seedData));
    await saveDb(fresh);
    return sendJson(response, 200, {
      ...fresh,
      modules: getEffectiveModules(fresh),
      brainStatus: getBrainStatus(),
      teacherAnalytics: buildTeacherAnalytics(fresh),
    });
  }

  if (request.method === "POST" && pathname === "/api/rubrics/extract") {
    const payload = await readJsonBody(request);
    const result = extractRubricsFromPayload(db, payload);
    if (result.error) return sendError(response, result.status, result.error);
    return sendJson(response, 200, result);
  }

  if (request.method === "GET" && pathname === "/api/quick-feedback/config") {
    return sendError(response, 410, "Legacy quick feedback has been removed from Logos.");
  }

  if (request.method === "POST" && pathname === "/api/quick-feedback/config") {
    return sendError(response, 410, "Legacy quick feedback has been removed from Logos.");
  }

  if (request.method === "POST" && pathname === "/api/quick-feedback/analyse") {
    return sendError(response, 410, "Legacy quick feedback has been removed from Logos.");
  }

  const personaMatch = pathname.match(/^\/api\/students\/([^/]+)\/persona$/);
  if (request.method === "PATCH" && personaMatch) {
    const studentId = personaMatch[1];
    const payload = await readJsonBody(request);
    const student = db.students.find((item) => item.id === studentId);
    const persona = db.personas.find((item) => item.id === payload.personaId);
    if (!student) return sendError(response, 404, "Student not found");
    if (!persona) return sendError(response, 400, "Persona not found");

    student.selectedPersonaId = persona.id;
    ensureStudentSkillStates(db, student.id);
    await saveDb(db);
    return sendJson(response, 200, {
      student,
      growthProfile: buildGrowthProfile(db, student.id),
      teacherAnalytics: buildTeacherAnalytics(db),
    });
  }

  const growthMatch = pathname.match(/^\/api\/students\/([^/]+)\/growth$/);
  if (request.method === "GET" && growthMatch) {
    const studentId = growthMatch[1];
    const student = db.students.find((item) => item.id === studentId);
    if (!student) return sendError(response, 404, "Student not found");
    return sendJson(response, 200, buildGrowthProfile(db, studentId));
  }

  const checkinMatch = pathname.match(/^\/api\/students\/([^/]+)\/belongingness-checkins$/);
  if (request.method === "POST" && checkinMatch) {
    const studentId = checkinMatch[1];
    const payload = await readJsonBody(request);
    const result = recordBelongingnessCheckin(db, studentId, payload);
    if (result.error) return sendError(response, result.status, result.error);
    await saveDb(db);
    return sendJson(response, 201, result);
  }

  if (request.method === "POST" && pathname === "/api/submissions/analyse") {
    const payload = await readJsonBody(request);
    const result = await analyseSubmission(db, payload);
    if (result.error) return sendError(response, result.status, result.error);
    await saveDb(db);
    return sendJson(response, 201, {
      ...result,
      brainStatus: getBrainStatus(result.feedbackRecord.brain),
      teacherAnalytics: buildTeacherAnalytics(db),
    });
  }

  if (request.method === "GET" && pathname === "/api/teachers/analytics") {
    return sendJson(response, 200, buildTeacherAnalytics(db));
  }

  const skillsMatch = pathname.match(/^\/api\/students\/([^/]+)\/skills$/);
  if (request.method === "PATCH" && skillsMatch) {
    const studentId = skillsMatch[1];
    const payload = await readJsonBody(request);
    const result = saveStudentSkillSelection(db, studentId, payload);
    if (result.error) return sendError(response, result.status, result.error);
    await saveDb(db);
    return sendJson(response, 200, result);
  }

  const teacherDashboardMatch = pathname.match(/^\/api\/teachers\/dashboard(?:\/([^/]+))?$/);
  if (request.method === "GET" && teacherDashboardMatch) {
    return sendJson(response, 200, buildTeacherDashboard(db, teacherDashboardMatch[1] || null));
  }

  if (request.method === "POST" && pathname === "/api/teachers/modules") {
    const payload = await readJsonBody(request);
    const result = createTeacherModule(db, payload);
    if (result.error) return sendError(response, result.status, result.error);
    await saveDb(db);
    return sendJson(response, 201, {
      module: getEffectiveModule(db, result.module.id),
      dashboard: buildTeacherDashboard(db, result.module.id),
      brainStatus: getBrainStatus(),
    });
  }

  const teacherRubricMatch = pathname.match(/^\/api\/teachers\/modules\/([^/]+)\/rubric$/);
  if ((request.method === "PUT" || request.method === "PATCH") && teacherRubricMatch) {
    const moduleId = teacherRubricMatch[1];
    const payload = await readJsonBody(request);
    const result = saveTeacherModuleConfig(db, moduleId, payload);
    if (result.error) return sendError(response, result.status, result.error);
    await saveDb(db);
    return sendJson(response, 200, {
      module: getEffectiveModule(db, moduleId),
      dashboard: buildTeacherDashboard(db, moduleId),
      brainStatus: getBrainStatus(),
    });
  }

  return sendError(response, 404, "API route not found");
}

function loginOrCreateUser(db, payload) {
  const role = payload?.role === "teacher" ? "teacher" : payload?.role === "student" ? "student" : null;
  const name = cleanText(payload?.name || "").slice(0, 80);
  const email = cleanText(payload?.email || "").toLowerCase().slice(0, 120);
  if (!role) return { error: "Choose student or teacher before logging in.", status: 400 };
  if (name.length < 2) return { error: "Add your name to continue.", status: 400 };
  if (!email.includes("@")) return { error: "Add a valid email to continue.", status: 400 };

  let user = db.users.find((item) => item.role === role && item.email.toLowerCase() === email);
  if (!user) {
    user = {
      id: `user_${slugify(email) || randomUUID()}`,
      name,
      email,
      role,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
  } else if (user.name !== name) {
    user.name = name;
  }

  if (role === "student") {
    const student = ensureStudentForUser(db, user);
    user.studentId = student.id;
    ensureStudentSkillStates(db, student.id);
    const profile = ensureStudentProfileForUser(db, user.id, student.id);
    return { user, student, studentProfile: profile, growthProfile: buildGrowthProfile(db, student.id) };
  }

  return { user };
}

function ensureStudentForUser(db, user) {
  if (user.studentId) {
    const existing = db.students.find((student) => student.id === user.studentId);
    if (existing) return existing;
  }

  const baseId = `student_${slugify(user.email.split("@")[0]) || slugify(user.name) || Date.now()}`;
  let id = baseId;
  let suffix = 2;
  while (db.students.some((student) => student.id === id)) {
    id = `${baseId}_${suffix}`;
    suffix += 1;
  }

  const student = {
    id,
    name: user.name,
    programme: "Logos learner",
    selectedPersonaId: "industry",
    signUpGoals: [],
  };
  db.students.push(student);
  user.studentId = student.id;
  return student;
}

function ensureStudentProfileForUser(db, userId, studentId) {
  let profile = db.studentProfiles.find((item) => item.userId === userId || item.studentId === studentId);
  if (!profile) {
    profile = defaultStudentProfile(db, userId, studentId);
    db.studentProfiles.push(profile);
  }
  profile.userId = userId;
  profile.studentId = studentId;
  return profile;
}

function saveStudentSkillSelection(db, studentId, payload) {
  const student = db.students.find((item) => item.id === studentId);
  if (!student) return { error: "Student not found", status: 404 };
  const validSkillIds = new Set(db.skills.map((skill) => skill.id));
  const user = db.users.find((item) => item.studentId === studentId);
  const profile = ensureStudentProfileForUser(db, user?.id || `user_${studentId}`, studentId);
  const selectedPersonalSkillIds = Array.isArray(payload.selectedPersonalSkillIds)
    ? payload.selectedPersonalSkillIds.filter((skillId) => validSkillIds.has(skillId)).slice(0, 8)
    : profile.selectedPersonalSkillIds;
  const selectedCoreSkillIds = Array.isArray(payload.selectedCoreSkillIds)
    ? payload.selectedCoreSkillIds.filter((skillId) => validSkillIds.has(skillId)).slice(0, 8)
    : profile.selectedCoreSkillIds;

  profile.selectedCoreSkillIds = selectedCoreSkillIds;
  profile.selectedPersonalSkillIds = selectedPersonalSkillIds;
  profile.updatedAt = new Date().toISOString();
  ensureStudentSkillStates(db, studentId);
  return { studentProfile: profile, growthProfile: buildGrowthProfile(db, studentId) };
}

async function serveStatic(response, pathname) {
  const cleanPath = pathname === "/" ? "/index.html" : pathname;
  const absolutePath = path.normalize(path.join(FRONTEND_DIST, cleanPath));
  if (!absolutePath.startsWith(FRONTEND_DIST)) {
    return sendError(response, 403, "Forbidden");
  }

  try {
    const content = await fs.readFile(absolutePath);
    const extension = path.extname(absolutePath);
    response.writeHead(200, { "Content-Type": mimeTypes[extension] || "application/octet-stream" });
    response.end(content);
  } catch (error) {
    try {
      const content = await fs.readFile(path.join(FRONTEND_DIST, "index.html"));
      response.writeHead(200, { "Content-Type": mimeTypes[".html"] });
      response.end(content);
    } catch (fallbackError) {
      sendError(response, 404, "Frontend build not found. Run npm start to build frontend first.");
    }
  }
}

function normaliseStoredTeacherModuleConfigs(configs, modules = []) {
  if (!Array.isArray(configs)) return [];

  return configs
    .map((config) => {
      const baseModule = modules.find((module) => module.id === config?.moduleId);
      if (!baseModule) return null;
      return normaliseTeacherModuleConfig(config, baseModule);
    })
    .filter(Boolean);
}

function normaliseStoredCustomModules(modules) {
  if (!Array.isArray(modules)) return [];
  return modules
    .map((module, index) => normaliseCustomModule(module, index))
    .filter(Boolean)
    .slice(0, 20);
}

function normaliseCustomModule(module, index) {
  const name = cleanText(module?.name || `Custom Module ${index + 1}`).slice(0, 90);
  const id = String(module?.id || slugify(name) || `custom_module_${index + 1}`).slice(0, 80);
  const description = cleanMultilineText(module?.description || module?.teacherFocus || "Teacher-created Logos module.", 600);
  const rubric = Array.isArray(module?.rubric)
    ? module.rubric.map((criterion, criterionIndex) => normaliseTeacherCriterion(criterion, null, id, criterionIndex)).filter(Boolean).slice(0, 10)
    : [];

  if (!id || !name) return null;
  return {
    id,
    name,
    description,
    sampleWork: cleanMultilineText(module?.sampleWork || "", 4000),
    rubric: rubric.length ? rubric : defaultRubricsForModule(id, name),
    createdAt: module?.createdAt || new Date().toISOString(),
  };
}

function normaliseTeacherModuleConfig(config, baseModule, options = {}) {
  const fallbackToBase = options.fallbackToBase !== false;
  const criteria = Array.isArray(config?.criteria)
    ? config.criteria
        .map((criterion, index) =>
          normaliseTeacherCriterion(criterion, baseModule.rubric[index] || baseModule.rubric.find((item) => item.id === criterion?.id), baseModule.id, index),
        )
        .filter(Boolean)
        .slice(0, 10)
    : [];

  return {
    moduleId: baseModule.id,
    teacherFocus: cleanMultilineText(config?.teacherFocus || defaultTeacherFocus(baseModule), 600),
    criteria: criteria.length
      ? criteria
      : fallbackToBase
        ? baseModule.rubric.map((criterion, index) => normaliseTeacherCriterion(criterion, criterion, baseModule.id, index))
        : [],
    updatedAt: config?.updatedAt || null,
  };
}

function normaliseTeacherCriterion(criterion, baseCriterion, moduleId, index) {
  const title = cleanText(criterion?.title || criterion?.name || baseCriterion?.title || baseCriterion?.name || `Criterion ${index + 1}`);
  const description = cleanMultilineText(criterion?.description || baseCriterion?.description || "", 420);
  const lookingFor = cleanMultilineText(criterion?.lookingFor || defaultCriterionLookingFor(baseCriterion || criterion), 500);
  const expectedScoring = cleanMultilineText(
    criterion?.expectedScoring ||
      criterion?.scoringGuidance ||
      baseCriterion?.expectedScoring ||
      baseCriterion?.scoringGuidance ||
      defaultExpectedScoring(baseCriterion || criterion),
    520,
  );
  const skillLinks = normaliseCriterionSkillLinks(criterion, baseCriterion, moduleId);
  const weight = clampNumber(Number(criterion?.weight ?? baseCriterion?.weight ?? 1), 0, 100);

  if (!title || !description || !lookingFor || !expectedScoring) {
    return null;
  }

  return {
    id: String(criterion?.id || baseCriterion?.id || `${moduleId}_${slugify(title) || `criterion_${index + 1}`}`),
    name: title,
    title,
    description,
    lookingFor,
    scoringGuidance: expectedScoring,
    expectedScoring,
    weight,
    skillLinks,
    linkedSkillIds: skillLinks.map((link) => link.skillId),
    keywords: buildCriterionKeywords({
      title,
      description,
      lookingFor,
      keywords: criterion?.keywords || baseCriterion?.keywords,
    }),
  };
}

function normaliseCriterionSkillLinks(criterion, baseCriterion, moduleId) {
  const linkedSkillIds = Array.isArray(criterion?.linkedSkillIds)
    ? criterion.linkedSkillIds
    : Array.isArray(criterion?.skillLinks)
      ? criterion.skillLinks.map((link) => (typeof link === "string" ? link : link.skillId))
      : null;

  const sourceLinks = linkedSkillIds
    ? linkedSkillIds.map((skillId) => ({ skillId, weight: 1 }))
    : Array.isArray(baseCriterion?.skillLinks) && baseCriterion.skillLinks.length
      ? baseCriterion.skillLinks
      : defaultSkillLinksForModule(moduleId);

  return sourceLinks
    .map((link) => ({
      skillId: String(typeof link === "string" ? link : link.skillId || "").trim(),
      weight: clampNumber(Number(typeof link === "string" ? 1 : link.weight || 1), 0.1, 3),
    }))
    .filter((link) => link.skillId)
    .slice(0, 5);
}

function getTeacherModuleConfig(db, moduleId) {
  return db.teacherModuleConfigs.find((config) => config.moduleId === moduleId) || null;
}

function getEffectiveModules(db) {
  return db.modules.map((module) => getEffectiveModule(db, module.id)).filter(Boolean);
}

function getEffectiveModule(db, moduleId) {
  const baseModule = db.modules.find((module) => module.id === moduleId);
  if (!baseModule) return null;

  const stored = getTeacherModuleConfig(db, moduleId);
  const normalised = normaliseTeacherModuleConfig(stored || {}, baseModule);

  return {
    id: baseModule.id,
    name: baseModule.name,
    description: baseModule.description,
    sampleWork: baseModule.sampleWork,
    teacherFocus: normalised.teacherFocus,
    rubric: normalised.criteria,
    rubricUpdatedAt: normalised.updatedAt,
  };
}

function saveTeacherModuleConfig(db, moduleId, payload) {
  const baseModule = db.modules.find((module) => module.id === moduleId);
  if (!baseModule) {
    return { error: "Module not found", status: 404 };
  }

  const next = normaliseTeacherModuleConfig(
    {
      moduleId,
      teacherFocus: payload.teacherFocus,
      criteria: payload.criteria,
      updatedAt: new Date().toISOString(),
    },
    baseModule,
    { fallbackToBase: false },
  );

  if (next.teacherFocus.length < 18) {
    return {
      error: "Add a short note for what you are looking for in this module before saving.",
      status: 400,
    };
  }

  if (next.criteria.length < 2) {
    return {
      error: "Add at least two rubric criteria so the module has a meaningful scoring frame.",
      status: 400,
    };
  }

  const invalidCriterion = next.criteria.find(
    (criterion) =>
      criterion.title.length < 3 ||
      criterion.description.length < 12 ||
      criterion.lookingFor.length < 12 ||
      criterion.expectedScoring.length < 12,
  );

  if (invalidCriterion) {
    return {
      error: "Each rubric row needs a name, what it requires, what to look for, and expected scoring guidance.",
      status: 400,
    };
  }

  const existingIndex = db.teacherModuleConfigs.findIndex((config) => config.moduleId === moduleId);
  if (existingIndex >= 0) {
    db.teacherModuleConfigs[existingIndex] = next;
  } else {
    db.teacherModuleConfigs.push(next);
  }

  return { ok: true, config: next };
}

function createTeacherModule(db, payload) {
  const name = cleanText(payload?.name || payload?.moduleName || "").slice(0, 90);
  const description = cleanMultilineText(payload?.description || payload?.teacherFocus || "", 600);
  if (name.length < 3) {
    return { error: "Add a module name before creating the module.", status: 400 };
  }
  if (description.length < 18) {
    return { error: "Add a short syllabus or objective before creating the module.", status: 400 };
  }

  const baseId = slugify(name) || `module_${Date.now()}`;
  const existingIds = new Set(db.modules.map((module) => module.id));
  let id = baseId;
  let suffix = 2;
  while (existingIds.has(id)) {
    id = `${baseId}_${suffix}`;
    suffix += 1;
  }

  const module = normaliseCustomModule(
    {
      id,
      name,
      description,
      teacherFocus: payload.teacherFocus || description,
      rubric: Array.isArray(payload.criteria) ? payload.criteria : [],
      createdAt: new Date().toISOString(),
    },
    db.customModules.length,
  );

  if (!module || module.rubric.length < 2) {
    return { error: "Add at least two rubric criteria before creating the module.", status: 400 };
  }

  db.customModules.push(module);
  mergeStoredModules(db);
  const configResult = saveTeacherModuleConfig(db, module.id, {
    teacherFocus: payload.teacherFocus || description,
    criteria: module.rubric,
  });
  if (configResult.error) return configResult;
  return { ok: true, module };
}

function defaultTeacherFocus(module) {
  return `In ${module.name}, I am looking for work that shows ${module.description.toLowerCase()}`;
}

function defaultCriterionLookingFor(criterion) {
  const signals = Array.isArray(criterion?.keywords) ? criterion.keywords.join(", ") : "";
  return signals || criterion?.description || "";
}

function defaultExpectedScoring(criterion) {
  const description = String(criterion?.description || "").replace(/\.$/, "");
  return description
    ? `High-scoring work clearly demonstrates that it ${description.toLowerCase()} with specific evidence and precise explanation.`
    : "High-scoring work should be explicit, precise, and supported by evidence from the report.";
}

function defaultSkillLinksForModule(moduleId) {
  if (moduleId === "natural_language_processing") {
    return [
      { skillId: "technical_understanding", weight: 1 },
      { skillId: "communication", weight: 0.6 },
      { skillId: "critical_thinking", weight: 0.5 },
    ];
  }
  if (moduleId === "green_chemistry") {
    return [
      { skillId: "ethical_awareness", weight: 0.9 },
      { skillId: "mathematical_reasoning", weight: 0.7 },
      { skillId: "real_world_impact", weight: 0.6 },
    ];
  }
  return [
    { skillId: "technical_understanding", weight: 0.8 },
    { skillId: "communication", weight: 0.6 },
    { skillId: "critical_thinking", weight: 0.5 },
  ];
}

function defaultRubricsForModule(moduleId, moduleName = "Module") {
  return [
    {
      id: `${moduleId}_conceptual_understanding`,
      name: "Conceptual understanding",
      title: "Conceptual understanding",
      description: `Explains the central ideas in ${moduleName} accurately and in the student's own words.`,
      lookingFor: "accurate concepts, precise terminology, relevant examples",
      scoringGuidance: "High-scoring work connects core concepts to the task with specific evidence and clear terminology.",
      expectedScoring: "High-scoring work connects core concepts to the task with specific evidence and clear terminology.",
      weight: 1,
      skillLinks: defaultSkillLinksForModule(moduleId).slice(0, 2),
      linkedSkillIds: defaultSkillLinksForModule(moduleId).slice(0, 2).map((link) => link.skillId),
      keywords: ["concept", "evidence", "explain", "example"],
    },
    {
      id: `${moduleId}_evidence_reasoning`,
      name: "Evidence and reasoning",
      title: "Evidence and reasoning",
      description: "Uses evidence, calculations, examples, or data to justify claims and choices.",
      lookingFor: "evidence, data, calculations, justification, comparison",
      scoringGuidance: "High-scoring work explains why the evidence supports the conclusion, not just what the answer is.",
      expectedScoring: "High-scoring work explains why the evidence supports the conclusion, not just what the answer is.",
      weight: 1,
      skillLinks: defaultSkillLinksForModule(moduleId),
      linkedSkillIds: defaultSkillLinksForModule(moduleId).map((link) => link.skillId),
      keywords: ["evidence", "data", "because", "therefore", "compare"],
    },
  ];
}

function extractRubricsFromPayload(db, payload) {
  const text = cleanMultilineText(payload?.textContent || "", 12000);
  const fileName = cleanText(payload?.fileName || "uploaded rubric");
  if (!text && !fileName) {
    return { error: "Upload a readable rubric file or paste rubric text first.", status: 400 };
  }

  const knownSkillIds = new Set(db.skills.map((skill) => skill.id));
  const skillNameMap = buildSkillNameMap(db.skills);
  const structuredRubrics = parseStructuredRubricText(text, knownSkillIds, skillNameMap);
  const rubrics = structuredRubrics.length >= 2 ? structuredRubrics : parseLooseRubricText(text, knownSkillIds);

  return { rubrics, source: { fileName, extractor: "local-placeholder" } };
}

function parseStructuredRubricText(text, knownSkillIds, skillNameMap) {
  const rubricText = text.includes("# Evaluation Rubrics") ? text.split("# Evaluation Rubrics").slice(1).join("# Evaluation Rubrics") : text;
  const metadataKeys = new Set(["description", "strong evidence", "what strong looks like", "score range", "weight", "skill tags", "keywords"]);
  const blocks = [];
  let current = null;

  for (const rawLine of rubricText.split(/\n+/)) {
    const line = rawLine.trim();
    if (!line || line === "---" || line.startsWith("#")) continue;
    const headingMatch = line.match(/^(?:#{1,4}\s*)?(?:R\d+[\).\s-]*)?([^:]+):$/i);
    const fieldMatch = line.match(/^([^:]+):\s*(.+)$/);
    const possibleHeading = headingMatch && !metadataKeys.has(headingMatch[1].trim().toLowerCase());

    if (possibleHeading) {
      if (current) blocks.push(current);
      current = { title: cleanText(headingMatch[1]) };
      continue;
    }

    if (!current || !fieldMatch) continue;
    const key = fieldMatch[1].trim().toLowerCase();
    const value = cleanMultilineText(fieldMatch[2], 900);
    if (key === "description") current.description = value;
    if (key === "strong evidence" || key === "what strong looks like") current.lookingFor = value;
    if (key === "score range") current.scoreRange = value;
    if (key === "weight") current.weight = value;
    if (key === "skill tags") current.skillTags = value;
    if (key === "keywords") current.keywords = value;
  }
  if (current) blocks.push(current);

  return blocks
    .map((block, index) => {
      const description = cleanMultilineText(block.description || block.lookingFor || "", 420);
      if (!block.title || !description) return null;
      const parsedWeight = parseRubricWeight(block.weight, block.scoreRange);
      const skillLinks = parseSkillTags(block.skillTags, knownSkillIds, skillNameMap);
      const fallbackLinks = inferSkillLinksForRubric(block.title, `${description} ${block.lookingFor || ""}`, knownSkillIds);
      const scoringGuidance = [
        block.lookingFor ? `Strong evidence: ${block.lookingFor}` : "",
        block.scoreRange ? `Score range: ${block.scoreRange}` : "",
      ]
        .filter(Boolean)
        .join(" ");

      return normaliseTeacherCriterion(
        {
          id: `extracted_${slugify(block.title) || index + 1}`,
          name: block.title,
          title: block.title,
          description,
          lookingFor: block.lookingFor || description,
          scoringGuidance: scoringGuidance || defaultExpectedScoring({ description }),
          weight: parsedWeight,
          skillLinks: skillLinks.length ? skillLinks : fallbackLinks,
          keywords: parseRubricSignals(block.keywords),
        },
        null,
        "uploaded_rubric",
        index,
      );
    })
    .filter(Boolean)
    .slice(0, 10);
}

function parseLooseRubricText(text, knownSkillIds) {
  const sections = text
    .split(/\n(?=\s*(?:\d+[\).\s]|[-*]\s|[A-Z][A-Za-z\s/&-]{4,}:))/g)
    .map((section) => cleanMultilineText(section, 900))
    .filter((section) => section.length >= 18)
    .slice(0, 8);

  const rubricSource = sections.length >= 2 ? sections : [
    "Conceptual understanding: Accurately explains the relevant concepts, terminology, and task requirements.",
    "Evidence and reasoning: Uses evidence, calculations, examples, or data to justify the response.",
    "Communication and reflection: Presents ideas clearly and identifies what could be improved next.",
  ];

  return rubricSource.map((section, index) => {
    const [heading, ...rest] = section.split(/:\s+/);
    const rawTitle = cleanText(rest.length ? heading.replace(/^\d+[\).\s-]*/, "").replace(/^[-*]\s*/, "") : `Rubric ${index + 1}`);
    const description = cleanMultilineText(rest.length ? rest.join(": ") : section.replace(/^\d+[\).\s-]*/, "").replace(/^[-*]\s*/, ""), 420);
    const title = rawTitle.length >= 3 ? rawTitle : `Rubric ${index + 1}`;
    const skillLinks = inferSkillLinksForRubric(title, description, knownSkillIds);
    return normaliseTeacherCriterion(
      {
        id: `extracted_${slugify(title) || index + 1}`,
        name: title,
        title,
        description,
        lookingFor: description,
        scoringGuidance: defaultExpectedScoring({ description }),
        weight: 1,
        skillLinks,
      },
      null,
      "uploaded_rubric",
      index,
    );
  }).filter(Boolean);
}

function buildSkillNameMap(skills) {
  const map = new Map();
  for (const skill of skills) {
    map.set(slugify(skill.id), skill.id);
    map.set(slugify(skill.name), skill.id);
  }
  return map;
}

function parseSkillTags(value, knownSkillIds, skillNameMap) {
  return parseRubricSignals(value)
    .map((tag) => skillNameMap.get(slugify(tag)) || slugify(tag))
    .filter((skillId) => knownSkillIds.has(skillId))
    .map((skillId) => ({ skillId, weight: 1 }))
    .slice(0, 5);
}

function parseRubricWeight(weight, scoreRange) {
  const explicit = Number(String(weight || "").match(/\d+(?:\.\d+)?/)?.[0]);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const rangeParts = String(scoreRange || "").match(/\d+(?:\.\d+)?/g);
  if (rangeParts?.length) {
    const max = Number(rangeParts[rangeParts.length - 1]);
    if (Number.isFinite(max) && max > 0) return max;
  }
  return 1;
}

function inferSkillLinksForRubric(title, description, knownSkillIds) {
  const text = `${title} ${description}`.toLowerCase();
  const candidates = [];
  if (/data|metric|calculation|quant|score|evidence/.test(text)) candidates.push("data_literacy", "mathematical_reasoning");
  if (/argument|communicat|structure|explain|clarity|report/.test(text)) candidates.push("communication", "academic_argumentation");
  if (/ethical|responsib|impact|sustain|green|safety/.test(text)) candidates.push("ethical_awareness", "real_world_impact");
  if (/error|limit|critic|evaluate|trade|improve/.test(text)) candidates.push("critical_thinking", "critical_evaluation");
  if (/method|design|pipeline|model|technical|concept/.test(text)) candidates.push("technical_understanding", "problem_decomposition");
  const unique = Array.from(new Set(candidates)).filter((skillId) => knownSkillIds.has(skillId));
  return (unique.length ? unique : ["technical_understanding", "communication"]).map((skillId) => ({ skillId, weight: 1 })).slice(0, 4);
}

function buildCriterionKeywords(criterion) {
  const signals = [
    ...(Array.isArray(criterion?.keywords) ? criterion.keywords : []),
    ...parseRubricSignals(criterion?.lookingFor),
    ...parseRubricSignals(criterion?.description),
    ...parseRubricSignals(criterion?.scoringGuidance || criterion?.expectedScoring),
    ...parseRubricSignals(criterion?.title),
  ];
  return Array.from(new Set(signals.map((item) => String(item || "").trim().toLowerCase()).filter((item) => item && item.length <= 80))).slice(0, 18);
}

function parseRubricSignals(value) {
  return String(value || "")
    .split(/\n|,|;|\|/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}

function getBrainStatus(lastRun = null) {
  const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY);
  const canUseOpenAi = BRAIN_MODE === "openai" || (BRAIN_MODE === "auto" && hasOpenAiKey);
  const localProvider = BRAIN_MODE === "local" || BRAIN_MODE === "mock" ? "deterministic-dev-fallback" : "local-rubric-brain";
  return {
    version: BRAIN_VERSION,
    configuredMode: BRAIN_MODE,
    activeMode: lastRun?.mode || (canUseOpenAi ? "openai" : "local"),
    provider: lastRun?.provider || (canUseOpenAi ? "openai-compatible" : localProvider),
    model: lastRun?.model || (canUseOpenAi ? OPENAI_MODEL : "deterministic-local"),
    hasOpenAiKey,
    strictAi: BRAIN_MODE === "openai",
  };
}

function buildBrainContext(db, student, persona, module, workText, payload) {
  const growthProfile = buildGrowthProfile(db, student.id);
  const metrics = measureWork(workText);
  const recentFeedback = db.feedbackRecords
    .filter((record) => record.studentId === student.id)
    .slice(0, 4)
    .map((record) => ({
      moduleId: record.moduleId,
      personaId: record.personaId,
      overallScore: record.overallScore,
      gaps: record.gaps?.map((gap) => gap.label) || [],
      createdAt: record.createdAt,
    }));
  const recentCheckins = db.belongingnessCheckins
    .filter((checkin) => checkin.studentId === student.id)
    .slice(0, 4)
    .map((checkin) => ({
      confidenceScore: checkin.confidenceScore,
      clarityScore: checkin.clarityScore,
      belongingScore: checkin.belongingScore,
      createdAt: checkin.createdAt,
    }));

  return {
    student: {
      id: student.id,
      name: student.name,
      programme: student.programme,
      signUpGoals: student.signUpGoals,
    },
    persona: {
      id: persona.id,
      name: persona.name,
      pathLabel: persona.pathLabel,
      identityMessage: persona.identityMessage,
      tone: persona.tone,
    },
    module: {
      id: module.id,
      name: module.name,
      description: module.description,
      teacherFocus: module.teacherFocus || null,
      rubric: module.rubric.map((criterion) => ({
        id: criterion.id,
        title: criterion.title,
        description: criterion.description,
        lookingFor: criterion.lookingFor || "",
        weight: criterion.weight || 1,
        maxPoints: criterion.weight || 100,
        expectedScoring: criterion.expectedScoring || "",
        skillLinks: criterion.skillLinks,
        keywords: criterion.keywords,
      })),
    },
    growthSnapshot: {
      core: compactSkillStates(growthProfile.groups.core),
      path: compactSkillStates(growthProfile.groups.path),
      belongingness: compactSkillStates(growthProfile.groups.belongingness),
      summary: growthProfile.summary,
    },
    recentFeedback,
    recentCheckins,
    currentCheckin: {
      confidenceBefore: Number(payload.confidenceBefore || 3),
      clarityAfter: Number(payload.clarityAfter || 3),
      pathBelonging: Number(payload.pathBelonging || 3),
    },
    metrics,
    workText,
  };
}

function compactSkillStates(states) {
  return states.map((state) => ({
    skillId: state.skillId,
    name: state.skill.name,
    category: state.skill.category,
    current: state.current,
    baseline: state.baseline,
    growth: state.growth,
    stage: state.stage,
  }));
}

async function runFeedbackBrain(context) {
  if (shouldUseOpenAiBrain()) {
    try {
      return await runOpenAiBrain(context);
    } catch (error) {
      if (BRAIN_MODE === "openai") {
        const providerStatus = error.providerStatus || null;
        const wrapped = new Error(
          providerStatus
            ? `AI grading is unavailable right now. Provider returned ${providerStatus}. Please try again shortly.`
            : `AI grading is unavailable right now. ${error.message || "Please try again shortly."}`
        );
        wrapped.status = providerStatus === 400 ? 502 : 503;
        wrapped.code = "ai_grading_unavailable";
        wrapped.providerStatus = providerStatus;
        throw wrapped;
      }
      const fallback = runLocalBrain(context);
      fallback.fallbackReason = `OpenAI-compatible brain failed: ${error.message}`;
      return fallback;
    }
  }

  return runLocalBrain(context);
}

function shouldUseOpenAiBrain() {
  if (BRAIN_MODE === "local" || BRAIN_MODE === "mock") return false;
  if (BRAIN_MODE === "openai") return true;
  return Boolean(process.env.OPENAI_API_KEY);
}

async function runOpenAiBrain(context) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required when BRAIN_MODE=openai");
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: buildBrainSystemPrompt(),
        },
        {
          role: "user",
          content: JSON.stringify(context),
        },
      ],
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error?.message || `AI provider returned ${response.status}`);
    error.providerStatus = response.status;
    error.code = "ai_provider_error";
    throw error;
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI provider returned no message content");
  }

  const parsed = parseModelJson(content);
  return {
    ...parsed,
    mode: "openai",
    provider: "openai-compatible",
    model: OPENAI_MODEL,
  };
}

function parseModelJson(content) {
  const raw = String(content || "").trim();
  const withoutThoughts = raw
    .replace(/<thought>[\s\S]*?<\/thought>/gi, "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .trim();

  const candidates = [
    withoutThoughts,
    extractFencedJson(withoutThoughts),
    extractJsonObject(withoutThoughts),
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try the next recovery strategy.
    }
  }

  const error = new Error("AI provider returned text instead of valid JSON. Try a model with JSON mode support or remove reasoning/thought output from the provider settings.");
  error.code = "ai_invalid_json";
  throw error;
}

function extractFencedJson(value) {
  const match = String(value).match(/```(?:json)?\s*([\s\S]*?)```/i);
  return match ? match[1].trim() : "";
}

function extractJsonObject(value) {
  const text = String(value);
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start >= 0 && end > start ? text.slice(start, end + 1).trim() : "";
}

function buildBrainSystemPrompt() {
  return [
    "You are Logos, an evidence-based STEM rubric assessor.",
    "Output must be a single valid JSON object. Do not include markdown fences, XML tags, <thought>, <think>, analysis, commentary, or any text before or after the JSON.",
    "Your job is to grade the submitted work by inference against the supplied module rubrics. Do not grade by keyword matching.",
    "The module rubric is the source of truth. If rubrics are supplied, do not give generic writing feedback except where a rubric explicitly asks for communication quality.",
    "Evaluate every rubric independently. For each rubric, use its id, title, description, scoring guidance, weight/maxPoints, and skill links.",
    "Read the whole submission and infer whether the student has provided evidence that satisfies each rubric. The same sentence may help multiple rubrics, but each rubric still needs its own judgement.",
    "Cite specific evidence from the submission using short quoted phrases or section references. Do not invent evidence.",
    "If evidence is missing, say what type of evidence is missing. Score conservatively when the submission does not show enough evidence.",
    "Return every rubric score as a normalized percentage from 0 to 100. Do not return raw points such as 8/10, 12/15, or 18/20.",
    "Do not assign the same score to every rubric unless your independent reasoning shows the submission is genuinely equally strong or weak on every rubric.",
    "Skill growth signals should describe evidence quality, not effort or repetition. Use only skill ids present in the supplied context.",
    "Do not diagnose emotions. Belongingness feedback must be supportive, specific, and non-judgemental.",
    "Return JSON only with this shape:",
    "{",
    '  "rubricScores": [',
    '    {"criterionId":"...","score":0-100,"evidence":"short quote or section reference","strength":"what meets this rubric","gap":"what is missing for this rubric","nextStep":"one concrete revision step"}',
    "  ],",
    '  "skillGrowthSignals": [{"skillId":"...","signal":"strong_positive|positive|neutral|needs_support","confidence":0-1,"reason":"rubric evidence behind this signal"}],',
    '  "belongingnessMessage":"supportive one-sentence message tied to the work, not a diagnosis",',
    '  "nextBestAction":"the single highest-impact next revision across rubrics"',
    "}",
  ].join("\n");
}

function runLocalBrain(context) {
  const module = context.module;
  const metrics = context.metrics;
  const criteriaResults = module.rubric.map((criterion) => scoreCriterion(criterion, metrics));
  const overallScore = Math.round(average(criteriaResults.map((criterion) => criterion.score)));
  const weakest = [...criteriaResults].sort((a, b) => a.score - b.score)[0];
  const strongest = [...criteriaResults].sort((a, b) => b.score - a.score)[0];
  const skillGrowthSignals = buildLocalSkillSignals(criteriaResults);

    return {
      mode: "local",
      provider: "deterministic-dev-fallback",
      model: "local-pattern-scorer",
    rubricScores: criteriaResults.map((criterion) => ({
      criterionId: criterion.id,
      score: criterion.score,
      evidence: criterion.evidenceSummary,
      strength: criterion.strength,
      gap: criterion.gap,
      nextStep: criterion.nextStep,
    })),
    skillGrowthSignals,
    belongingnessMessage: buildBelongingnessMessage(context.persona, overallScore, criteriaResults.filter((criterion) => criterion.score < 68)),
    nextBestAction: weakest
      ? `${weakest.nextStep} This builds from your strongest current area: ${strongest.title.toLowerCase()}.`
      : "Keep refining the work by connecting evidence to the chosen path.",
  };
}

function buildLocalSkillSignals(criteriaResults) {
  const signals = new Map();
  for (const criterion of criteriaResults) {
    for (const link of criterion.skillLinks) {
      const existing = signals.get(link.skillId);
      const score = criterion.score;
      const signal = score >= 78 ? "strong_positive" : score >= 66 ? "positive" : score >= 54 ? "neutral" : "needs_support";
      const confidence = clampNumber((score / 100) * link.weight, 0.35, 0.9);
      const candidate = {
        skillId: link.skillId,
        signal,
        confidence,
        reason: `${criterion.title}: ${criterion.evidenceSummary}`,
        score,
      };
      if (!existing || candidate.score > existing.score) {
        signals.set(link.skillId, candidate);
      }
    }
  }
  return Array.from(signals.values()).map(({ score, ...signal }) => signal);
}

function normaliseBrainCriteria(brainResult, module) {
  const byId = new Map((brainResult.rubricScores || []).map((item) => [item.criterionId, item]));
  const metrics = brainResult.metrics || null;
  const twentyPointResponse = shouldScaleTwentyPointBrainScores(brainResult, module);

  return module.rubric.map((criterion) => {
    const localFallback = metrics ? scoreCriterion(criterion, metrics) : null;
    const item = byId.get(criterion.id) || localFallback || {};
    const score = normaliseCriterionScore(item.score ?? localFallback?.score ?? 50, criterion, brainResult, twentyPointResponse);
    return {
      id: criterion.id,
      name: criterion.title,
      title: criterion.title,
      description: criterion.description,
      scoringGuidance: criterion.scoringGuidance || criterion.expectedScoring,
      expectedScoring: criterion.expectedScoring,
      weight: criterion.weight || 1,
      score,
      keywordHits: Number(item.keywordHits || localFallback?.keywordHits || 0),
      skillLinks: criterion.skillLinks,
      linkedSkillIds: (criterion.skillLinks || []).map((link) => link.skillId),
      evidenceSummary: cleanText(item.evidence || item.evidenceSummary || localFallback?.evidenceSummary || "No direct evidence summary was returned."),
      strength: cleanText(item.strength || localFallback?.strength || `There is some evidence for ${criterion.title.toLowerCase()}.`),
      gap: cleanText(item.gap || localFallback?.gap || `Develop ${criterion.title.toLowerCase()}: ${criterion.description}`),
      nextStep: cleanText(item.nextStep || localFallback?.nextStep || `Add one specific example that proves ${criterion.title.toLowerCase()}.`),
    };
  });
}

function normaliseSkillSignals(brainResult, db, trackedSkillIds) {
  const validSkills = new Set(db.skills.map((skill) => skill.id));
  return (brainResult.skillGrowthSignals || [])
    .filter((signal) => validSkills.has(signal.skillId) && trackedSkillIds.has(signal.skillId))
    .map((signal) => ({
      skillId: signal.skillId,
      signal: ["strong_positive", "positive", "neutral", "needs_support"].includes(signal.signal) ? signal.signal : "neutral",
      confidence: clampNumber(Number(signal.confidence || 0.55), 0.1, 1),
      reason: cleanText(signal.reason || "Skill signal detected from rubric evidence."),
    }))
    .slice(0, 16);
}

async function analyseSubmission(db, payload) {
  const student = db.students.find((item) => item.id === payload.studentId);
  const module = getEffectiveModule(db, payload.moduleId);
  const workText = String(payload.workText || "").trim();

  if (!student) return { error: "Student not found", status: 404 };
  if (!module) return { error: "Module not found", status: 400 };
  if (workText.length < 40) return { error: "Submission needs at least 40 characters for a useful test analysis", status: 400 };

  ensureStudentSkillStates(db, student.id);
  const persona = db.personas.find((item) => item.id === student.selectedPersonaId);
  const trackedSkillIds = new Set(getTrackedSkillIds(db, student));
  const brainContext = buildBrainContext(db, student, persona, module, workText, payload);
  const brainResult = await runFeedbackBrain(brainContext);
  brainResult.metrics = brainContext.metrics;
  const criteriaResults = normaliseBrainCriteria(brainResult, module);
  const overallScore = weightedRubricAverage(criteriaResults);
  const gapCriteria = criteriaResults.filter((criterion) => criterion.score < 68);
  const strongCriteria = criteriaResults.filter((criterion) => criterion.score >= 72);
  const session = getSubmissionSession(db, student.id, module.id, payload.sessionId);
  const attemptNumber = session.attemptCount + 1;

  const submission = {
    id: randomUUID(),
    studentId: student.id,
    moduleId: module.id,
    sessionId: session.id,
    attemptNumber,
    workText,
    wordCount: brainContext.metrics.wordCount,
    createdAt: new Date().toISOString(),
  };
  db.submissions.unshift(submission);

  const feedbackRecord = {
    id: randomUUID(),
    submissionId: submission.id,
    sessionId: session.id,
    attemptNumber,
    studentId: student.id,
    personaId: student.selectedPersonaId,
    moduleId: module.id,
    overallScore,
    strengths: strongCriteria.length
      ? strongCriteria.map((criterion) => criterion.strength || `Strong evidence for ${criterion.title.toLowerCase()}.`)
      : ["This submission gives enough detail to create a useful next step."],
    gaps: gapCriteria.length
      ? gapCriteria.map((criterion) => ({
          criterionId: criterion.id,
          label: criterion.title,
          message: criterion.gap || `Develop ${criterion.title.toLowerCase()}: ${criterion.description}`,
          nextStep: criterion.nextStep,
        }))
      : [],
    criteriaResults,
    nextBestAction: brainResult.nextBestAction,
    skillSignals: normaliseSkillSignals(brainResult, db, trackedSkillIds),
    belongingnessMessage: brainResult.belongingnessMessage || buildBelongingnessMessage(persona, overallScore, gapCriteria),
    brain: {
      version: BRAIN_VERSION,
      mode: brainResult.mode,
      provider: brainResult.provider,
      model: brainResult.model,
      fallbackReason: brainResult.fallbackReason || null,
      scoringDiagnostics: buildScoringDiagnostics(criteriaResults, brainResult),
    },
    createdAt: new Date().toISOString(),
  };
  db.feedbackRecords.unshift(feedbackRecord);

  const skillGrowthResult = applyImprovementGatedSkillGrowth(db, student, trackedSkillIds, session, criteriaResults, feedbackRecord.id);
  const skillGrowth = skillGrowthResult.events;
  session.attemptCount = attemptNumber;
  session.updatedAt = submission.createdAt;

  if (payload.confidenceBefore || payload.clarityAfter || payload.pathBelonging) {
    recordBelongingnessCheckin(db, student.id, {
      confidenceScore: payload.confidenceBefore,
      clarityScore: payload.clarityAfter,
      belongingScore: payload.pathBelonging,
      reflectionText: payload.reflectionText || "Check-in captured during submission analysis.",
      sourceFeedbackId: feedbackRecord.id,
    });
  }

  return {
    submission,
    feedbackRecord,
    overallScore,
    summary: buildFeedbackSummary(overallScore, strongCriteria, gapCriteria),
    rubricFeedback: buildRubricFeedback(criteriaResults, attemptNumber),
    genericFeedback: buildGenericFeedback(feedbackRecord),
    skillGrowth,
    skillGrowthEvents: skillGrowth,
    skillGrowthDiagnostics: skillGrowthResult.diagnostics,
    sessionId: session.id,
    attemptNumber,
    growthProfile: buildGrowthProfile(db, student.id),
  };
}

function getSubmissionSession(db, studentId, moduleId, requestedSessionId) {
  const requested = requestedSessionId
    ? db.submissionSessions.find((session) => session.id === requestedSessionId && session.studentId === studentId && session.moduleId === moduleId)
    : null;
  if (requested) return requested;

  const latestForModule = db.submissionSessions
    .filter((session) => session.studentId === studentId && session.moduleId === moduleId)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))[0];
  if (latestForModule) return latestForModule;

  const session = {
    id: randomUUID(),
    studentId,
    moduleId,
    attemptCount: 0,
    initialRubricScores: {},
    bestRubricScores: {},
    awardedSkillCredits: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.submissionSessions.unshift(session);
  return session;
}

function applyImprovementGatedSkillGrowth(db, student, trackedSkillIds, session, criteriaResults, feedbackRecordId) {
  const events = [];
  const diagnostics = [];
  const skillById = new Map(db.skills.map((skill) => [skill.id, skill]));
  session.initialRubricScores ||= {};
  session.bestRubricScores ||= {};
  session.awardedSkillCredits ||= [];

  for (const criterion of criteriaResults) {
    const score = clamp(Math.round(Number(criterion.score || 0)), 0, 100);
    if (!Number.isFinite(session.initialRubricScores[criterion.id])) {
      session.initialRubricScores[criterion.id] = score;
    }
    const previousBest = Number.isFinite(session.bestRubricScores[criterion.id]) ? session.bestRubricScores[criterion.id] : score;
    const nextBest = Math.max(previousBest, score);
    session.bestRubricScores[criterion.id] = nextBest;
    const improvement = nextBest - session.initialRubricScores[criterion.id];
    const linkedSkillIds = (criterion.skillLinks || []).map((link) => link.skillId);
    const diagnostic = {
      rubricId: criterion.id,
      rubricName: criterion.title,
      score,
      initialScore: session.initialRubricScores[criterion.id],
      previousBest,
      bestScore: nextBest,
      improvement,
      linkedSkillIds,
      awarded: [],
      blockedReason: "",
    };
    diagnostics.push(diagnostic);

    if (improvement < 10) {
      diagnostic.blockedReason = "Improvement is below 10 percentage points.";
      continue;
    }
    if (nextBest < 60) {
      diagnostic.blockedReason = "Best rubric score is still below 60%.";
      continue;
    }

    for (const link of criterion.skillLinks || []) {
      if (!trackedSkillIds.has(link.skillId)) {
        diagnostic.blockedReason ||= "Linked skill is not currently tracked by this student.";
        continue;
      }
      const creditKey = `${criterion.id}:${link.skillId}`;
      if (session.awardedSkillCredits.includes(creditKey)) {
        diagnostic.blockedReason ||= "Growth credit was already awarded for this rubric and skill in this session.";
        continue;
      }

      const skillState = db.studentSkillStates.find((state) => state.studentId === student.id && state.skillId === link.skillId);
      if (!skillState) {
        diagnostic.blockedReason ||= "No student skill state exists for the linked skill.";
        continue;
      }
      const changeAmount = growthCreditForImprovement(improvement);
      const previousScore = skillState.current;
      const newScore = clamp(previousScore + changeAmount, skillState.baseline - 6, 100);
      skillState.current = newScore;
      skillState.updatedAt = new Date().toISOString();
      session.awardedSkillCredits.push(creditKey);

      const event = {
        id: randomUUID(),
        studentId: student.id,
        skillId: link.skillId,
        skillName: skillById.get(link.skillId)?.name || link.skillId,
        feedbackRecordId,
        sessionId: session.id,
        rubricId: criterion.id,
        rubricName: criterion.title,
        previousScore,
        newScore,
        changeAmount,
        evidenceSummary: `${criterion.title} improved by ${Math.round(improvement)} percentage points and reached ${nextBest}/100.`,
        brainVersion: BRAIN_VERSION,
        createdAt: new Date().toISOString(),
      };
      db.growthEvents.unshift(event);
      events.push(event);
      diagnostic.awarded.push({ skillId: link.skillId, changeAmount });
      diagnostic.blockedReason = "";
    }
  }
  return { events, diagnostics };
}

function growthCreditForImprovement(improvement) {
  if (improvement >= 60) return 4;
  if (improvement >= 35) return 3;
  if (improvement >= 20) return 2;
  return 1;
}

function buildFeedbackSummary(overallScore, strongCriteria, gapCriteria) {
  if (gapCriteria.length) {
    return `Score ${overallScore}/100. Strongest next move: ${gapCriteria[0].nextStep || `develop ${gapCriteria[0].title.toLowerCase()}`}`;
  }
  if (strongCriteria.length) {
    return `Score ${overallScore}/100. This is solid work; keep making the evidence more precise.`;
  }
  return `Score ${overallScore}/100. There is enough here to start improving the response with focused evidence.`;
}

function weightedRubricAverage(criteriaResults) {
  const totalWeight = criteriaResults.reduce((sum, criterion) => sum + Math.max(Number(criterion.weight || 1), 0), 0);
  if (!totalWeight) return Math.round(average(criteriaResults.map((criterion) => criterion.score)));
  const weightedScore = criteriaResults.reduce((sum, criterion) => sum + criterion.score * Math.max(Number(criterion.weight || 1), 0), 0) / totalWeight;
  return Math.round(weightedScore);
}

function buildRubricFeedback(criteriaResults, attemptNumber) {
  return criteriaResults.map((criterion) => {
    const unlocked = attemptNumber >= 3 && criterion.score < 70;
    return {
      rubricId: criterion.id,
      criterionId: criterion.id,
      rubricName: criterion.title,
      name: criterion.title,
      score: criterion.score,
      maxScore: 100,
      normalizedScore: criterion.score,
      whatsGood: criterion.strength || `There is some evidence for ${criterion.title.toLowerCase()}.`,
      whatsMissing: criterion.gap || `Develop ${criterion.title.toLowerCase()}: ${criterion.description}`,
      evidenceSummary: criterion.evidenceSummary,
      linkedSkillIds: (criterion.skillLinks || []).map((link) => link.skillId),
      answerWithLogos: {
        unlocked,
        lockedReason: unlocked ? "" : "Answer with Logos unlocks after three attempts when this rubric is still below 70%.",
        hint: unlocked ? buildAnswerWithLogosHint(criterion) : "",
      },
    };
  });
}

function buildAnswerWithLogosHint(criterion) {
  const issue = criterion.gap || `The submission needs stronger evidence for ${criterion.title.toLowerCase()}.`;
  const evidence = criterion.evidenceSummary && !/no direct evidence/i.test(criterion.evidenceSummary)
    ? criterion.evidenceSummary
    : "No strong matching passage was isolated.";
  const revision = criterion.nextStep || `Add one concrete sentence that directly proves ${criterion.title.toLowerCase()}.`;
  return [
    `Relevant issue: ${issue}`,
    `Current evidence: ${evidence}`,
    `Suggested revision or insertion: ${revision}`,
    `Why this helps: it gives the assessor direct evidence for the "${criterion.title}" rubric without rewriting the full answer.`,
  ].join("\n\n");
}

function buildScoringDiagnostics(criteriaResults, brainResult) {
  const scores = criteriaResults.map((criterion) => criterion.score);
  const uniqueScores = new Set(scores);
  const identicalScores = scores.length > 1 && uniqueScores.size === 1;
  const tightBand = scores.length > 1 && Math.max(...scores) - Math.min(...scores) <= 3;
  return {
    mode: brainResult.mode,
    rubricCount: criteriaResults.length,
    identicalScores,
    tightScoreBand: tightBand,
    scoreSpread: scores.length ? Math.max(...scores) - Math.min(...scores) : 0,
    warning:
      identicalScores || tightBand
        ? "Rubric scores are unusually similar. Review scoring evidence if this was not expected."
        : "",
  };
}

function shouldScaleTwentyPointBrainScores(brainResult, module) {
  if (brainResult.mode !== "openai") return false;
  const scores = (brainResult.rubricScores || [])
    .map((item) => Number(item.score))
    .filter((score) => Number.isFinite(score));
  if (!scores.length) return false;
  const rubricUsesPointWeights = module.rubric.some((criterion) => Number(criterion.weight || 1) > 1 && Number(criterion.weight || 1) <= 20);
  return rubricUsesPointWeights && Math.max(...scores) <= 20 && average(scores) <= 20;
}

function normaliseCriterionScore(rawScore, criterion, brainResult, twentyPointResponse) {
  const numericScore = Number(rawScore);
  if (!Number.isFinite(numericScore)) return 50;
  if (brainResult.mode === "openai") {
    if (twentyPointResponse) {
      return clamp(Math.round((numericScore / 20) * 100), 0, 100);
    }
    const maxPoints = Number(criterion.weight || 0);
    if (maxPoints > 1 && maxPoints <= 100 && numericScore <= maxPoints) {
      return clamp(Math.round((numericScore / maxPoints) * 100), 0, 100);
    }
  }
  return clamp(Math.round(numericScore), 0, 100);
}

function buildGenericFeedback(feedbackRecord) {
  return {
    strengths: feedbackRecord.strengths || [],
    gaps: feedbackRecord.gaps || [],
    nextBestAction: feedbackRecord.nextBestAction || "",
    belongingnessMessage: feedbackRecord.belongingnessMessage || "",
  };
}

function scoreCriterion(criterion, metrics) {
  const rubricSignals = buildCriterionKeywords(criterion);
  const signalScores = scoreRubricSignals(rubricSignals, metrics.raw);
  const evidenceSnippet = findRubricEvidenceSnippet(metrics.raw, rubricSignals);
  const missingSignals = rubricSignals.filter((signal) => !signalScores.matchedSignals.includes(signal)).slice(0, 4);
  const rubricSpecificQuality = rubricQualityForCriterion(criterion, metrics);
  const score =
    18 +
    clamp(Math.round(metrics.wordCount / 28), 0, 10) +
    clamp(Math.round(signalScores.coverage * 42), 0, 42) +
    clamp(Math.round(Math.log2(signalScores.totalHits + 1) * 7), 0, 18) +
    rubricSpecificQuality;

  const finalScore = clamp(Math.round(score), 12, 98);
  return {
    id: criterion.id,
    title: criterion.title,
    description: criterion.description,
    score: finalScore,
    keywordHits: signalScores.totalHits,
    skillLinks: criterion.skillLinks,
    evidenceSummary:
      signalScores.totalHits > 0
        ? `${signalScores.matchedSignals.length}/${rubricSignals.length || 1} rubric signal(s) matched. ${evidenceSnippet ? `Evidence: "${evidenceSnippet}"` : "Evidence is present but not easy to isolate."}`
        : `Few direct signals found for this criterion. Add more explicit evidence for ${criterion.title.toLowerCase()}.`,
    strength:
      finalScore >= 72
        ? `The work shows clear evidence for ${criterion.title.toLowerCase()}${evidenceSnippet ? `, especially around "${evidenceSnippet}"` : ""}.`
        : `There is an early attempt at ${criterion.title.toLowerCase()}, but the evidence is still thin.`,
    gap:
      finalScore >= 72
        ? `Keep sharpening ${criterion.title.toLowerCase()} by making the evidence more precise.`
        : `Develop ${criterion.title.toLowerCase()}: ${missingSignals.length ? `make ${missingSignals.join(", ")} explicit.` : criterion.description}`,
    nextStep:
      finalScore >= 72
        ? `Add one more precise example to make ${criterion.title.toLowerCase()} even stronger.`
        : `Add a sentence that directly addresses ${missingSignals[0] || criterion.title.toLowerCase()} for this rubric.`,
  };
}

function scoreRubricSignals(signals, text) {
  const matchedSignals = [];
  let totalHits = 0;
  for (const signal of signals) {
    const hits = countSignalHits(text, signal);
    if (hits > 0) matchedSignals.push(signal);
    totalHits += hits;
  }
  return {
    matchedSignals,
    totalHits,
    coverage: signals.length ? matchedSignals.length / signals.length : 0,
  };
}

function countSignalHits(text, signal) {
  const normalized = String(signal || "").trim();
  if (!normalized) return 0;
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const boundary = /^[a-z0-9 -]+$/i.test(normalized) ? "\\b" : "";
  const pattern = new RegExp(`${boundary}${escaped}${boundary}`, "gi");
  return (text.match(pattern) || []).length;
}

function findRubricEvidenceSnippet(text, signals) {
  const sentences = String(text || "")
    .split(/(?<=[.!?])\s+|\n+/g)
    .map((sentence) => cleanText(sentence).slice(0, 220))
    .filter(Boolean);
  let best = null;
  for (const sentence of sentences) {
    const hits = signals.reduce((sum, signal) => sum + (countSignalHits(sentence, signal) > 0 ? 1 : 0), 0);
    if (!best || hits > best.hits) best = { sentence, hits };
  }
  return best?.hits ? best.sentence : "";
}

function rubricQualityForCriterion(criterion, metrics) {
  const text = `${criterion.title} ${criterion.description} ${criterion.lookingFor || ""}`.toLowerCase();
  let score = 0;
  if (/metric|evaluation|evidence|data|accuracy|precision|recall|f1|confusion/.test(text)) {
    score += clamp(metrics.evidenceCount * 4, 0, 14);
  }
  if (/error|limitation|critical|responsible|bias|risk|trade|iteration/.test(text)) {
    score += clamp(metrics.criticalCount * 4, 0, 14);
  }
  if (/communication|structure|clarity|framing|argument|report/.test(text)) {
    score += clamp(metrics.signpostCount * 3, 0, 10);
  }
  if (/method|technical|pipeline|preprocessing|feature|model/.test(text)) {
    score += clamp((metrics.evidenceCount + metrics.signpostCount) * 2, 0, 12);
  }
  return clamp(score, 0, 20);
}

function updateSkillFromCriterion(db, student, skillId, criterion, weight, feedbackRecordId, signal = null) {
  const skillState = db.studentSkillStates.find((state) => state.studentId === student.id && state.skillId === skillId);
  if (!skillState) return null;

  const previousScore = skillState.current;
  const signalNudge = signal ? signalNudgeFor(signal.signal) : 0;
  const confidence = signal ? signal.confidence : 0.65;
  const weightedTarget = Math.round((criterion.score - previousScore) * (0.13 * weight) * confidence) + signalNudge;
  const changeAmount = clamp(weightedTarget, -2, 6);
  const newScore = clamp(previousScore + changeAmount, skillState.baseline - 6, 100);

  skillState.current = newScore;
  skillState.updatedAt = new Date().toISOString();

  const event = {
    id: randomUUID(),
    studentId: student.id,
    skillId,
    feedbackRecordId,
    previousScore,
    newScore,
    changeAmount,
    evidenceSummary: signal?.reason || `${criterion.title}: ${criterion.evidenceSummary}`,
    brainVersion: BRAIN_VERSION,
    createdAt: new Date().toISOString(),
  };
  db.growthEvents.unshift(event);
  return event;
}

function signalNudgeFor(signal) {
  if (signal === "strong_positive") return 2;
  if (signal === "positive") return 1;
  if (signal === "needs_support") return -1;
  return 0;
}

function recordBelongingnessCheckin(db, studentId, payload) {
  const student = db.students.find((item) => item.id === studentId);
  if (!student) return { error: "Student not found", status: 404 };

  const checkin = {
    id: randomUUID(),
    studentId,
    confidenceScore: clamp(Number(payload.confidenceScore || 3), 1, 5),
    clarityScore: clamp(Number(payload.clarityScore || 3), 1, 5),
    belongingScore: clamp(Number(payload.belongingScore || 3), 1, 5),
    reflectionText: String(payload.reflectionText || "").slice(0, 500),
    sourceFeedbackId: payload.sourceFeedbackId || null,
    createdAt: new Date().toISOString(),
  };

  db.belongingnessCheckins.unshift(checkin);
  updateBelongingSkill(db, studentId, "confidence_in_learning", checkin.confidenceScore, checkin.id);
  updateBelongingSkill(db, studentId, "feedback_clarity", checkin.clarityScore, checkin.id);
  updateBelongingSkill(db, studentId, "path_identity", checkin.belongingScore, checkin.id);

  return {
    checkin,
    growthProfile: buildGrowthProfile(db, studentId),
  };
}

function updateBelongingSkill(db, studentId, skillId, fivePointScore, checkinId) {
  const skillState = db.studentSkillStates.find((state) => state.studentId === studentId && state.skillId === skillId);
  if (!skillState) return;

  const previousScore = skillState.current;
  const signalScore = fivePointScore * 20;
  const changeAmount = clamp(Math.round((signalScore - previousScore) * 0.12), -2, 5);
  const newScore = clamp(previousScore + changeAmount, skillState.baseline - 6, 100);
  skillState.current = newScore;
  skillState.updatedAt = new Date().toISOString();

  db.growthEvents.unshift({
    id: randomUUID(),
    studentId,
    skillId,
    feedbackRecordId: null,
    checkinId,
    previousScore,
    newScore,
    changeAmount,
    evidenceSummary: `Belongingness check-in signal: ${fivePointScore}/5.`,
    createdAt: new Date().toISOString(),
  });
}

function buildGrowthProfile(db, studentId) {
  const student = db.students.find((item) => item.id === studentId);
  if (!student) return null;
  const persona = db.personas.find((item) => item.id === student.selectedPersonaId) || null;
  ensureStudentSkillStates(db, student.id);

  const skillById = new Map(db.skills.map((skill) => [skill.id, skill]));
  const states = db.studentSkillStates
    .filter((state) => state.studentId === student.id && getTrackedSkillIds(db, student).includes(state.skillId))
    .map((state) => ({
      ...state,
      skill: skillById.get(state.skillId),
      growth: state.current - state.baseline,
      stage: stageForScore(state.current),
    }));

  const personaSkillIds = getPersonaSkillIds(db, student.selectedPersonaId);
  const groups = {
    core: states.filter((state) => state.skill.category === "core_stem"),
    path: states.filter((state) => state.skill.category === "path_specific" && personaSkillIds.includes(state.skillId)),
    belongingness: states.filter((state) => state.skill.category === "belongingness"),
  };

  const feedback = db.feedbackRecords.filter((record) => record.studentId === student.id);
  const recentGrowthEvents = db.growthEvents
    .filter((event) => event.studentId === student.id && event.changeAmount > 0)
    .slice(0, 12)
    .map((event) => {
      const skill = skillById.get(event.skillId);
      return {
        id: event.id,
        skillId: event.skillId,
        skillName: skill?.name || event.skillId,
        rubricId: event.rubricId || null,
        rubricName: event.rubricName || null,
        sessionId: event.sessionId || null,
        changeAmount: event.changeAmount,
        previousScore: event.previousScore,
        newScore: event.newScore,
        evidenceSummary: event.evidenceSummary,
        createdAt: event.createdAt,
      };
    });
  const latestCheckin = db.belongingnessCheckins.find((checkin) => checkin.studentId === student.id) || null;

  return {
    student,
    persona,
    groups,
    summary: {
      coreAverage: Math.round(average(groups.core.map((state) => state.current))),
      pathAverage: Math.round(average(groups.path.map((state) => state.current))),
      belongingnessAverage: Math.round(average(groups.belongingness.map((state) => state.current))),
      totalGrowth: states.reduce((sum, state) => sum + Math.max(state.growth, 0), 0),
      latestCheckin,
    },
    timeline: buildStudentTimeline(db, student.id),
    recentGrowthEvents,
    recentFeedback: feedback.map((record) => {
      const module = getEffectiveModule(db, record.moduleId);
      return {
        id: record.id,
        submissionId: record.submissionId,
        moduleId: record.moduleId,
        moduleName: module?.name || record.moduleId,
        overallScore: record.overallScore,
        attemptNumber: record.attemptNumber || 1,
        createdAt: record.createdAt,
        summary: record.nextBestAction || record.gaps[0]?.message || "Feedback generated.",
      };
    }),
  };
}

function buildStudentTimeline(db, studentId) {
  const byDay = new Map();
  const events = [...db.growthEvents].filter((event) => event.studentId === studentId).reverse();
  let running = 0;

  for (const event of events) {
    running += Math.max(event.changeAmount, 0);
    const day = event.createdAt.slice(0, 10);
    byDay.set(day, running);
  }

  return Array.from(byDay.entries()).map(([date, value]) => ({ date, value }));
}

function buildTeacherDashboard(db, selectedModuleId = null) {
  const modules = getEffectiveModules(db).map((module) => buildTeacherModuleSummary(db, module));

  const selectedModule = modules.find((module) => module.id === selectedModuleId) || modules[0] || null;
  if (!selectedModule) {
    return {
      modules: [],
      selectedModule: null,
      overview: null,
      criterionStatuses: [],
      studentStatuses: [],
      generatedAt: new Date().toISOString(),
    };
  }

  const latestRecords = latestModuleFeedbackByStudent(db, selectedModule.id);
  const scoredRecords = Array.from(latestRecords.values());
  const criterionStatuses = selectedModule.rubric.map((criterion) =>
    buildTeacherCriterionStatus(db, selectedModule, criterion, latestRecords),
  );
  const scoredCriteria = criterionStatuses.filter((criterion) => Number.isFinite(criterion.averageScore));
  const weakestCriterion = scoredCriteria.slice().sort((a, b) => a.averageScore - b.averageScore)[0] || null;
  const strongestCriterion = scoredCriteria.slice().sort((a, b) => b.averageScore - a.averageScore)[0] || null;

  return {
    modules,
    selectedModule,
    overview: {
      feedbackCount: scoredRecords.length,
      studentCount: scoredRecords.length,
      awaitingSubmission: Math.max(db.students.length - scoredRecords.length, 0),
      averageScore: scoredRecords.length ? Math.round(average(scoredRecords.map((record) => record.overallScore))) : 0,
      atRiskCount: scoredRecords.filter((record) => record.overallScore < 68).length,
      strongestCriterion,
      weakestCriterion,
    },
    criterionStatuses,
    studentStatuses: db.students
      .map((student) => buildTeacherStudentStatus(student, latestRecords.get(student.id)))
      .sort((left, right) => {
        if (left.latestOverallScore === null && right.latestOverallScore !== null) return 1;
        if (left.latestOverallScore !== null && right.latestOverallScore === null) return -1;
        return (left.latestOverallScore || 0) - (right.latestOverallScore || 0);
      }),
    generatedAt: new Date().toISOString(),
  };
}

function buildTeacherModuleSummary(db, module) {
  const latestRecords = latestModuleFeedbackByStudent(db, module.id);
  const moduleRecords = db.feedbackRecords.filter((record) => record.moduleId === module.id);
  const scoredRecords = Array.from(latestRecords.values());
  const submittedStudentCount = new Set(moduleRecords.map((record) => record.studentId)).size;
  return {
    id: module.id,
    name: module.name,
    description: module.description,
    teacherFocus: module.teacherFocus,
    rubricUpdatedAt: module.rubricUpdatedAt || null,
    rubric: module.rubric,
    studentCount: submittedStudentCount,
    submittedStudentCount,
    submissionCount: moduleRecords.length,
    averageScore: scoredRecords.length ? Math.round(average(scoredRecords.map((record) => record.overallScore))) : 0,
    latestActivityAt: moduleRecords[0]?.createdAt || null,
  };
}

function latestModuleFeedbackByStudent(db, moduleId) {
  const latestRecords = new Map();
  for (const record of db.feedbackRecords) {
    if (record.moduleId !== moduleId) continue;
    if (!latestRecords.has(record.studentId)) {
      latestRecords.set(record.studentId, record);
    }
  }
  return latestRecords;
}

function buildTeacherCriterionStatus(db, module, criterion, latestRecords) {
  const scoredStudents = Array.from(latestRecords.values())
    .map((record) => {
      const criterionResult = record.criteriaResults.find((item) => item.id === criterion.id);
      if (!criterionResult) return null;
      const student = db.students.find((item) => item.id === record.studentId);
      const gap = record.gaps.find((item) => item.criterionId === criterion.id);
      return {
        studentId: record.studentId,
        studentName: student?.name || record.studentId,
        overallScore: record.overallScore,
        criterionScore: criterionResult.score,
        attemptNumber: record.attemptNumber || 1,
        sessionId: record.sessionId || null,
        submissionId: record.submissionId || null,
        feedbackRecordId: record.id,
        createdAt: record.createdAt || null,
        needsSupport: criterionResult.score < 68,
        evidenceSummary: criterionResult.evidenceSummary || "",
        message: gap?.message || criterionResult.nextStep || criterionResult.evidenceSummary,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.criterionScore - right.criterionScore);

  const failingStudents = scoredStudents.filter((student) => student.needsSupport);
  const averageScore = scoredStudents.length ? Math.round(average(scoredStudents.map((student) => student.criterionScore))) : null;
  const threshold = Math.max(2, Math.ceil(Math.max(scoredStudents.length, 1) * 0.45));
  const commonMissingEvidence = summariseMissingEvidence(failingStudents);

  return {
    criterionId: criterion.id,
    title: criterion.title,
    description: criterion.description,
    lookingFor: criterion.lookingFor,
    expectedScoring: criterion.expectedScoring,
    averageScore,
    submissions: scoredStudents.length,
    affectedStudents: failingStudents.length,
    students: scoredStudents,
    status:
      !scoredStudents.length ? "quiet" : failingStudents.length >= threshold ? "alert" : failingStudents.length ? "watch" : "healthy",
    commonMissingEvidence,
    mitigationStep: buildTeacherFallbackMitigationStep(module, criterion, failingStudents.length, commonMissingEvidence),
  };
}

function buildTeacherStudentStatus(student, record) {
  if (!record) {
    return {
      studentId: student.id,
      name: student.name,
      programme: student.programme,
      latestOverallScore: null,
      likelyGrade: "No submission yet",
      weakestCriterion: "Awaiting a module submission",
      nextStep: "Ask this student to submit a draft so the dashboard can surface targeted support.",
      needsAttention: false,
    };
  }

  const weakestCriterion = [...record.criteriaResults].sort((left, right) => left.score - right.score)[0] || null;

  return {
    studentId: student.id,
    name: student.name,
    programme: student.programme,
    latestOverallScore: record.overallScore,
    likelyGrade: likelyGradeLabel(record.overallScore),
    weakestCriterion: weakestCriterion?.title || "No weakest criterion found",
    nextStep: weakestCriterion?.nextStep || record.nextBestAction || "Keep iterating on the report.",
    needsAttention: record.overallScore < 68,
  };
}

function summariseMissingEvidence(students) {
  const messages = students
    .map((student) => cleanText(student.message, 180))
    .filter(Boolean)
    .slice(0, 3);
  return messages.length ? messages.join(" ") : "No common missing evidence has been identified yet.";
}

function buildTeacherFallbackMitigationStep(module, criterion, affectedStudents = 0, commonMissingEvidence = "") {
  const baseAction = teacherRecommendation(criterion.id, module.id);
  const scoringHint = criterion.expectedScoring ? ` Use the scoring guide: ${criterion.expectedScoring}` : "";
  if (!affectedStudents) {
    return `Keep using the current ${criterion.title.toLowerCase()} rubric as a review checkpoint.${scoringHint}`.trim();
  }
  return [
    `${affectedStudents} student${affectedStudents === 1 ? " is" : "s are"} currently below threshold for ${criterion.title}.`,
    commonMissingEvidence ? `Common missing evidence: ${commonMissingEvidence}` : "",
    baseAction,
    scoringHint.trim(),
  ].filter(Boolean).join(" ");
}

function buildTeacherAnalytics(db) {
  const gapCounts = new Map();
  const personaCounts = new Map();

  for (const record of db.feedbackRecords) {
    const persona = db.personas.find((item) => item.id === record.personaId);
    const module = getEffectiveModule(db, record.moduleId);
    personaCounts.set(record.personaId, (personaCounts.get(record.personaId) || 0) + 1);

    for (const gap of record.gaps) {
      const key = `${record.personaId}:${gap.criterionId}`;
      const existing = gapCounts.get(key) || {
        key,
        personaId: record.personaId,
        personaName: persona?.name || record.personaId,
        moduleName: module?.name || record.moduleId,
        criterionId: gap.criterionId,
        label: gap.label,
        count: 0,
        students: new Set(),
        recommendedAction: teacherRecommendation(gap.criterionId, record.personaId),
      };
      existing.count += 1;
      existing.students.add(record.studentId);
      gapCounts.set(key, existing);
    }
  }

  const commonGaps = Array.from(gapCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((gap) => ({
      ...gap,
      affectedStudents: gap.students.size,
      students: undefined,
    }));

  const averageScore = db.feedbackRecords.length
    ? Math.round(average(db.feedbackRecords.map((record) => record.overallScore)))
    : 0;

  return {
    feedbackCount: db.feedbackRecords.length,
    averageScore,
    personaCounts: Object.fromEntries(personaCounts),
    commonGaps,
    generatedAt: new Date().toISOString(),
  };
}

function teacherRecommendation(criterionId, personaId) {
  const recommendations = {
    nlp_pipeline_explanation: "Ask students to draw the pipeline from raw text to prediction, naming each transformation.",
    evaluation_metrics: "Run a metrics clinic using one confusion matrix, then require a precision/recall/F1 interpretation.",
    error_analysis: "Have students label false positives and false negatives, then write one cause and one improvement for each.",
    academic_communication: "Use a report skeleton with method, result, error analysis, limitation, and recommendation sections.",
    green_principles: "Revisit the green chemistry principles and ask students to justify which principles apply to their route.",
    quantitative_sustainability: "Give a short atom economy and waste comparison exercise before students revise their claim.",
    reaction_design_tradeoffs: "Ask students to compare two synthesis routes across safety, efficiency, cost, and product quality.",
    environmental_argument: "Require a final recommendation paragraph that links evidence to environmental impact and risk.",
  };
  return recommendations[criterionId] || `Review this gap with ${personaId} students in the next workshop.`;
}

function buildBelongingnessMessage(persona, overallScore, gaps) {
  const personaName = persona?.name || "learner";
  if (overallScore >= 75) {
    return `You are showing real ${personaName} momentum. The feedback is now about sharpening the work, not starting over.`;
  }
  if (gaps.length <= 1) {
    return `You already have a route into this path. One focused improvement will make the work feel much stronger.`;
  }
  return `This draft has clear starting evidence. Belonging here means being able to see the next step, and the next step is specific rather than mysterious.`;
}

function measureWork(workText) {
  const words = workText.match(/\b[\w'-]+\b/g) || [];
  return {
    raw: workText,
    wordCount: words.length,
    signpostCount: countMatches(workText, /\b(first|second|next|therefore|however|because|finally|overall|for example)\b/gi),
    evidenceCount: countMatches(workText, /\b(evidence|data|research|study|source|example|result|survey|metric|tested)\b/gi),
    criticalCount: countMatches(workText, /\b(limitation|bias|assumption|risk|ethical|carefully|cannot|trade-off|alternative|validity)\b/gi),
  };
}

function stageForScore(score) {
  if (score >= 80) return "Strong";
  if (score >= 65) return "Confident";
  if (score >= 50) return "Building";
  return "Emerging";
}

function likelyGradeLabel(score) {
  if (score >= 70) return "Likely First";
  if (score >= 60) return "Likely 2:1";
  if (score >= 50) return "Likely 2:2";
  if (score >= 40) return "Likely Third";
  return "Rework needed";
}

function countMatches(text, pattern) {
  return (text.match(pattern) || []).length;
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clampNumber(value, min, max) {
  const safeValue = Number.isFinite(value) ? value : min;
  return Math.max(min, Math.min(max, safeValue));
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 900);
}

function cleanMultilineText(value, max = 4000) {
  return String(value || "").replace(/\r\n?/g, "\n").trim().slice(0, max);
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadEnvFile(envPath) {
  if (!fsSync.existsSync(envPath)) return;
  const lines = fsSync.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...parts] = trimmed.split("=");
    if (process.env[key]) continue;
    process.env[key] = parts.join("=").replace(/^["']|["']$/g, "");
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  try {
    if (url.pathname.startsWith("/api/")) {
      await routeApi(request, response, url.pathname);
      return;
    }
    await serveStatic(response, decodeURIComponent(url.pathname));
  } catch (error) {
    console.error(error);
    sendError(response, error.status || 500, error.message || "Unexpected server error", {
      code: error.code || "server_error",
      providerStatus: error.providerStatus || undefined,
    });
  }
});

server.listen(PORT, () => {
  console.log(`Logos feedback coach running at http://localhost:${PORT}`);
});
