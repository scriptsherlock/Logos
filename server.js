const http = require("http");
const fsSync = require("fs");
const fs = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");

const ROOT = __dirname;
const FRONTEND_DIST = path.join(ROOT, "AI Collab", "dist");
loadEnvFile(path.join(ROOT, ".env"));
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.join(ROOT, "data");
const DB_PATH = path.join(DATA_DIR, "db.json");
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

    { id: "confidence_in_learning", name: "Confidence in learning", category: "belongingness" },
    { id: "help_seeking", name: "Help-seeking confidence", category: "belongingness" },
    { id: "sense_of_progress", name: "Sense of progress", category: "belongingness" },
    { id: "path_identity", name: "Identity with path", category: "belongingness" },
    { id: "feedback_clarity", name: "Clarity after feedback", category: "belongingness" },
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
  studentSkillStates: [],
  submissions: [],
  feedbackRecords: [],
  growthEvents: [],
  belongingnessCheckins: [],
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
  db.modules = cloneData(seedData.modules);
  db.studentSkillStates ||= [];
  db.submissions ||= [];
  db.feedbackRecords ||= [];
  db.growthEvents ||= [];
  db.belongingnessCheckins ||= [];
  db.teacherModuleConfigs = normaliseStoredTeacherModuleConfigs(db.teacherModuleConfigs, db.modules);
  db.quickFeedbackConfig = normaliseStoredQuickFeedbackConfig(db.quickFeedbackConfig);

  for (const student of db.students) {
    ensureStudentSkillStates(db, student.id);
  }
  return db;
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
  if (skill.category === "belongingness") return personaId === "visionary" ? 48 : 50;
  if (skill.category === "path_specific") return personaId === "visionary" ? 44 : 46;
  return 52;
}

function getTrackedSkillIds(db, student) {
  const core = db.skills.filter((skill) => skill.category === "core_stem").map((skill) => skill.id);
  const belonging = db.skills.filter((skill) => skill.category === "belongingness").map((skill) => skill.id);
  const persona = db.personas.find((item) => item.id === student.selectedPersonaId);
  return [...core, ...(persona?.skillIds || []), ...belonging];
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function sendError(response, statusCode, message) {
  sendJson(response, statusCode, { error: message });
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

  if (request.method === "GET" && pathname === "/api/quick-feedback/config") {
    return sendJson(response, 200, {
      config: db.quickFeedbackConfig,
      brainStatus: getBrainStatus(),
    });
  }

  if (request.method === "POST" && pathname === "/api/quick-feedback/config") {
    const payload = await readJsonBody(request);
    const result = saveQuickFeedbackConfig(db, payload);
    if (result.error) return sendError(response, result.status, result.error);
    await saveDb(db);
    return sendJson(response, 200, {
      config: db.quickFeedbackConfig,
      brainStatus: getBrainStatus(),
    });
  }

  if (request.method === "POST" && pathname === "/api/quick-feedback/analyse") {
    const payload = await readJsonBody(request);
    const result = await analyseQuickFeedback(db.quickFeedbackConfig, payload);
    if (result.error) return sendError(response, result.status, result.error);
    return sendJson(response, 201, {
      ...result,
      brainStatus: getBrainStatus(result.feedbackRecord.brain),
    });
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

  const teacherDashboardMatch = pathname.match(/^\/api\/teachers\/dashboard(?:\/([^/]+))?$/);
  if (request.method === "GET" && teacherDashboardMatch) {
    return sendJson(response, 200, buildTeacherDashboard(db, teacherDashboardMatch[1] || null));
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
      sendError(response, 404, "Frontend build not found. Run npm start to build AI Collab first.");
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
  const title = cleanText(criterion?.title || baseCriterion?.title || `Criterion ${index + 1}`);
  const description = cleanMultilineText(criterion?.description || baseCriterion?.description || "", 420);
  const lookingFor = cleanMultilineText(criterion?.lookingFor || defaultCriterionLookingFor(baseCriterion || criterion), 500);
  const expectedScoring = cleanMultilineText(
    criterion?.expectedScoring || defaultExpectedScoring(baseCriterion || criterion),
    520,
  );
  const skillLinks = Array.isArray(baseCriterion?.skillLinks) && baseCriterion.skillLinks.length ? baseCriterion.skillLinks : defaultSkillLinksForModule(moduleId);

  if (!title || !description || !lookingFor || !expectedScoring) {
    return null;
  }

  return {
    id: String(criterion?.id || baseCriterion?.id || `${moduleId}_${slugify(title) || `criterion_${index + 1}`}`),
    title,
    description,
    lookingFor,
    expectedScoring,
    skillLinks,
    keywords: buildCriterionKeywords({
      title,
      description,
      lookingFor,
      keywords: criterion?.keywords || baseCriterion?.keywords,
    }),
  };
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

function buildCriterionKeywords(criterion) {
  const signals = [
    ...(Array.isArray(criterion?.keywords) ? criterion.keywords : []),
    ...parseRubricSignals(criterion?.lookingFor),
    ...parseRubricSignals(criterion?.title),
  ];
  return Array.from(new Set(signals.map((item) => String(item || "").trim().toLowerCase()).filter(Boolean))).slice(0, 16);
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

function defaultQuickFeedbackConfig() {
  return {
    rubricFileName: "",
    rubricText: "",
    examples: [],
    isConfigured: false,
    updatedAt: null,
  };
}

function normaliseStoredQuickFeedbackConfig(config) {
  const base = defaultQuickFeedbackConfig();
  if (!config || typeof config !== "object") return base;

  const examples = Array.isArray(config.examples)
    ? config.examples
        .map((example) => normaliseQuickFeedbackExample(example))
        .filter((example) => example && example.workText && Number.isFinite(example.score) && example.reason)
        .slice(0, 6)
    : [];

  return {
    rubricFileName: String(config.rubricFileName || "").trim().slice(0, 200),
    rubricText: cleanMultilineText(config.rubricText, 12000),
    examples,
    isConfigured: Boolean(cleanMultilineText(config.rubricText, 12000) && examples.length),
    updatedAt: config.updatedAt || null,
  };
}

function normaliseQuickFeedbackExample(example) {
  if (!example || typeof example !== "object") return null;
  const score = Number(example.score);
  return {
    id: String(example.id || randomUUID()),
    workText: cleanMultilineText(example.workText, 4500),
    score: Number.isFinite(score) ? clamp(Math.round(score), 0, 100) : NaN,
    reason: cleanMultilineText(example.reason, 900),
  };
}

function saveQuickFeedbackConfig(db, payload) {
  const next = normaliseStoredQuickFeedbackConfig({
    rubricFileName: payload.rubricFileName,
    rubricText: payload.rubricText,
    examples: payload.examples,
    updatedAt: new Date().toISOString(),
  });

  if (next.rubricText.length < 60) {
    return {
      error: "Paste more of the rubric text so the model has a real scoring source of truth.",
      status: 400,
    };
  }

  if (next.examples.length < 1) {
    return {
      error: "Add at least one scored teacher example before unlocking student mode.",
      status: 400,
    };
  }

  const invalidExample = next.examples.find((example) => example.workText.length < 40 || example.reason.length < 12);
  if (invalidExample) {
    return {
      error: "Each teacher example needs some real sample text, a numeric score, and a short reason.",
      status: 400,
    };
  }

  next.isConfigured = true;
  db.quickFeedbackConfig = next;
  return { ok: true };
}

async function analyseQuickFeedback(config, payload) {
  const activeConfig = normaliseStoredQuickFeedbackConfig(config);
  const workText = cleanMultilineText(payload.workText, 8000);

  if (!activeConfig.isConfigured) {
    return {
      error: "Teacher mode has not been configured yet.",
      status: 400,
    };
  }

  if (workText.length < 40) {
    return {
      error: "Submission needs at least 40 characters for a useful review.",
      status: 400,
    };
  }

  if (!shouldUseOpenAiBrain()) {
    return {
      error: "Teacher-configured quick feedback needs an OpenAI-compatible brain. Add OPENAI_API_KEY or switch BRAIN_MODE.",
      status: 503,
    };
  }

  let brainResult;
  try {
    brainResult = await runQuickFeedbackOpenAi(activeConfig, workText);
  } catch (error) {
    return {
      error: `Teacher-configured scoring failed: ${error.message}`,
      status: 502,
    };
  }

  return {
    feedbackRecord: normaliseQuickFeedbackRecord(brainResult),
  };
}

async function runQuickFeedbackOpenAi(config, workText) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for teacher-configured quick feedback.");
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
          content: buildQuickFeedbackSystemPrompt(),
        },
        {
          role: "user",
          content: JSON.stringify({
            rubricFileName: config.rubricFileName || null,
            rubricText: config.rubricText,
            scoredExamples: config.examples.map((example) => ({
              score: example.score,
              reason: example.reason,
              workText: example.workText,
            })),
            submission: workText,
          }),
        },
      ],
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message || `AI provider returned ${response.status}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI provider returned no message content");
  }

  return {
    ...JSON.parse(content),
    mode: "openai",
    provider: "openai-compatible",
    model: OPENAI_MODEL,
  };
}

function buildQuickFeedbackSystemPrompt() {
  return [
    "You are the grading engine for a quick feedback coach.",
    "The rubric text is the source of truth.",
    "The scored examples are calibration references that show the teacher's grading style, score range, and reasoning.",
    "Assess the new submission against the rubric, not against generic writing advice.",
    "Be precise about what is present, what is missing, and what the next revision should do.",
    "Return JSON only with this shape:",
    "{",
    '  "overallScore": 0-100,',
    '  "overallReason": "...",',
    '  "strengths": ["..."],',
    '  "gaps": [{"label":"...","message":"...","nextStep":"..."}],',
    '  "criteriaResults": [{"title":"...","score":0-100,"evidenceSummary":"...","nextStep":"..."}],',
    '  "nextBestAction": "..."',
    "}",
  ].join("\n");
}

function normaliseQuickFeedbackRecord(brainResult) {
  const criteriaResults = normaliseQuickCriteria(brainResult.criteriaResults);
  const derivedOverallScore = Number.isFinite(Number(brainResult.overallScore))
    ? Number(brainResult.overallScore)
    : average(criteriaResults.map((criterion) => criterion.score));
  const overallScore = Math.round(clampNumber(derivedOverallScore, 0, 100));

  const strengths = normaliseQuickStringList(brainResult.strengths, 6).length
    ? normaliseQuickStringList(brainResult.strengths, 6)
    : criteriaResults
        .filter((criterion) => criterion.score >= 72)
        .map((criterion) => `Strong evidence for ${criterion.title.toLowerCase()}.`)
        .slice(0, 6);

  const gaps = normaliseQuickGaps(brainResult.gaps).length
    ? normaliseQuickGaps(brainResult.gaps)
    : criteriaResults
        .filter((criterion) => criterion.score < 68)
        .map((criterion) => ({
          label: criterion.title,
          message: `Develop ${criterion.title.toLowerCase()}: ${criterion.nextStep}`,
          nextStep: criterion.nextStep,
        }))
        .slice(0, 6);

  return {
    overallScore,
    overallReason: cleanText(brainResult.overallReason || brainResult.nextBestAction || "Feedback generated."),
    strengths: strengths.length ? strengths : ["This draft contains enough material to generate a targeted next step."],
    gaps,
    criteriaResults,
    nextBestAction: cleanText(brainResult.nextBestAction || gaps[0]?.nextStep || "Revise the weakest rubric area and submit again."),
    brain: {
      version: BRAIN_VERSION,
      mode: brainResult.mode,
      provider: brainResult.provider,
      model: brainResult.model,
      fallbackReason: null,
    },
  };
}

function normaliseQuickCriteria(criteria) {
  return Array.isArray(criteria)
    ? criteria.slice(0, 8).map((criterion, index) => ({
        id: `quick_criterion_${index + 1}`,
        title: cleanText(criterion?.title || `Criterion ${index + 1}`),
        score: Math.round(clampNumber(Number(criterion?.score ?? 50), 0, 100)),
        evidenceSummary: cleanText(criterion?.evidenceSummary || criterion?.evidence || "No evidence summary was returned."),
        nextStep: cleanText(criterion?.nextStep || "Add more direct evidence against this rubric point."),
      }))
    : [];
}

function normaliseQuickStringList(items, limit = 6) {
  return Array.isArray(items)
    ? items
        .map((item) => cleanText(item))
        .filter(Boolean)
        .slice(0, limit)
    : [];
}

function normaliseQuickGaps(gaps) {
  return Array.isArray(gaps)
    ? gaps
        .map((gap) => ({
          label: cleanText(gap?.label || "Gap"),
          message: cleanText(gap?.message || gap?.gap || "A rubric gap was detected."),
          nextStep: cleanText(gap?.nextStep || "Add direct evidence for this rubric area."),
        }))
        .filter((gap) => gap.message)
        .slice(0, 6)
    : [];
}

function getBrainStatus(lastRun = null) {
  const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY);
  const canUseOpenAi = BRAIN_MODE === "openai" || (BRAIN_MODE === "auto" && hasOpenAiKey);
  return {
    version: BRAIN_VERSION,
    configuredMode: BRAIN_MODE,
    activeMode: lastRun?.mode || (canUseOpenAi ? "openai" : "local"),
    provider: lastRun?.provider || (canUseOpenAi ? "openai-compatible" : "local-rubric-brain"),
    model: lastRun?.model || (canUseOpenAi ? OPENAI_MODEL : "deterministic-local"),
    hasOpenAiKey,
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
    throw new Error(data.error?.message || `AI provider returned ${response.status}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI provider returned no message content");
  }

  const parsed = JSON.parse(content);
  return {
    ...parsed,
    mode: "openai",
    provider: "openai-compatible",
    model: OPENAI_MODEL,
  };
}

function buildBrainSystemPrompt() {
  return [
    "You are the structured brain for a student growth coach.",
    "Analyse the submitted work only against the supplied module rubric.",
    "Connect feedback to competency, belongingness, and the student's selected persona path.",
    "Do not diagnose emotions or invent evidence. Belongingness feedback must be supportive, specific, and non-judgemental.",
    "Return JSON only with this shape:",
    "{",
    '  "rubricScores": [{"criterionId":"...","score":0-100,"evidence":"...","strength":"...","gap":"...","nextStep":"..."}],',
    '  "skillGrowthSignals": [{"skillId":"...","signal":"strong_positive|positive|neutral|needs_support","confidence":0-1,"reason":"..."}],',
    '  "belongingnessMessage":"...",',
    '  "nextBestAction":"..."',
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
    provider: "local-rubric-brain",
    model: "deterministic-local",
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

  return module.rubric.map((criterion) => {
    const localFallback = metrics ? scoreCriterion(criterion, metrics) : null;
    const item = byId.get(criterion.id) || localFallback || {};
    const score = clamp(Math.round(Number(item.score ?? localFallback?.score ?? 50)), 18, 96);
    return {
      id: criterion.id,
      title: criterion.title,
      description: criterion.description,
      score,
      keywordHits: Number(item.keywordHits || localFallback?.keywordHits || 0),
      skillLinks: criterion.skillLinks,
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
  const overallScore = Math.round(average(criteriaResults.map((criterion) => criterion.score)));
  const gapCriteria = criteriaResults.filter((criterion) => criterion.score < 68);
  const strongCriteria = criteriaResults.filter((criterion) => criterion.score >= 72);
  const skillGrowth = [];

  const submission = {
    id: randomUUID(),
    studentId: student.id,
    moduleId: module.id,
    workText,
    wordCount: brainContext.metrics.wordCount,
    createdAt: new Date().toISOString(),
  };
  db.submissions.unshift(submission);

  const feedbackRecord = {
    id: randomUUID(),
    submissionId: submission.id,
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
    },
    createdAt: new Date().toISOString(),
  };
  db.feedbackRecords.unshift(feedbackRecord);

  for (const criterion of criteriaResults) {
    for (const link of criterion.skillLinks) {
      if (!trackedSkillIds.has(link.skillId)) continue;
      const signal = feedbackRecord.skillSignals.find((item) => item.skillId === link.skillId);
      const event = updateSkillFromCriterion(db, student, link.skillId, criterion, link.weight, feedbackRecord.id, signal);
      if (event) skillGrowth.push(event);
    }
  }

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
    skillGrowth,
    growthProfile: buildGrowthProfile(db, student.id),
  };
}

function scoreCriterion(criterion, metrics) {
  const rubricSignals = buildCriterionKeywords(criterion);
  const keywordHits = rubricSignals.reduce((total, keyword) => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`\\b${escaped}\\b`, "gi");
    return total + (metrics.raw.match(pattern) || []).length;
  }, 0);

  const score =
    30 +
    clamp(Math.round(metrics.wordCount / 15), 0, 18) +
    clamp(keywordHits * 9, 0, 36) +
    clamp(metrics.signpostCount * 3, 0, 12) +
    clamp(metrics.evidenceCount * 3, 0, 12) +
    clamp(metrics.criticalCount * 3, 0, 10);

  const finalScore = clamp(Math.round(score), 18, 96);
  return {
    id: criterion.id,
    title: criterion.title,
    description: criterion.description,
    score: finalScore,
    keywordHits,
    skillLinks: criterion.skillLinks,
    evidenceSummary:
      keywordHits > 0
        ? `${keywordHits} rubric signal(s) detected, with ${metrics.evidenceCount} evidence signal(s) and ${metrics.criticalCount} critical signal(s).`
        : `Few direct signals found for this criterion. Add more explicit evidence for ${criterion.title.toLowerCase()}.`,
    strength:
      finalScore >= 72
        ? `The work shows clear evidence for ${criterion.title.toLowerCase()}.`
        : `There is an early attempt at ${criterion.title.toLowerCase()}.`,
    gap:
      finalScore >= 72
        ? `Keep sharpening ${criterion.title.toLowerCase()} by making the evidence more precise.`
        : `Develop ${criterion.title.toLowerCase()}: ${criterion.description}`,
    nextStep:
      finalScore >= 72
        ? `Add one more precise example to make ${criterion.title.toLowerCase()} even stronger.`
        : `Add a sentence that explicitly shows ${criterion.title.toLowerCase()} in this work.`,
  };
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
  const persona = db.personas.find((item) => item.id === student.selectedPersonaId);
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

  const groups = {
    core: states.filter((state) => state.skill.category === "core_stem"),
    path: states.filter((state) => state.skill.category === "path_specific" && persona.skillIds.includes(state.skillId)),
    belongingness: states.filter((state) => state.skill.category === "belongingness"),
  };

  const feedback = db.feedbackRecords.filter((record) => record.studentId === student.id);
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
    recentFeedback: feedback.slice(0, 6),
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
  const modules = getEffectiveModules(db).map((module) => ({
    id: module.id,
    name: module.name,
    description: module.description,
    teacherFocus: module.teacherFocus,
    rubricUpdatedAt: module.rubricUpdatedAt || null,
    rubric: module.rubric,
  }));

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
      studentCount: db.students.length,
      awaitingSubmission: db.students.length - scoredRecords.length,
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
        needsSupport: criterionResult.score < 68,
        message: gap?.message || criterionResult.nextStep || criterionResult.evidenceSummary,
      };
    })
    .filter(Boolean);

  const failingStudents = scoredStudents.filter((student) => student.needsSupport);
  const averageScore = scoredStudents.length ? Math.round(average(scoredStudents.map((student) => student.criterionScore))) : null;
  const threshold = Math.max(2, Math.ceil(Math.max(scoredStudents.length, 1) * 0.45));

  return {
    criterionId: criterion.id,
    title: criterion.title,
    description: criterion.description,
    lookingFor: criterion.lookingFor,
    expectedScoring: criterion.expectedScoring,
    averageScore,
    submissions: scoredStudents.length,
    affectedStudents: failingStudents.length,
    students: failingStudents.slice(0, 6),
    status:
      !scoredStudents.length ? "quiet" : failingStudents.length >= threshold ? "alert" : failingStudents.length ? "watch" : "healthy",
    mitigationStep: buildTeacherMitigationStep(module, criterion),
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

function buildTeacherMitigationStep(module, criterion) {
  const baseAction = teacherRecommendation(criterion.id, module.id);
  const scoringHint = criterion.expectedScoring ? ` Use the scoring guide: ${criterion.expectedScoring}` : "";
  return `${baseAction}${scoringHint}`.trim();
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
    sendError(response, 500, error.message || "Unexpected server error");
  }
});

server.listen(PORT, () => {
  console.log(`Logos feedback coach running at http://localhost:${PORT}`);
});
