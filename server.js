const http = require("http");
const fsSync = require("fs");
const fs = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");

const ROOT = __dirname;
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
      id: "ai_foundations",
      name: "AI Foundations",
      description: "Core AI, data, maths, ethics, and explanation skills.",
      sampleWork:
        "This work explains how a machine learning model can learn patterns from training data. I describe the inputs, the output, and the loss function, then explain why the model should be tested on unseen data. The main limitation is that biased data can create unfair predictions, so evaluation should include accuracy and ethical checks. A practical next step would be to compare model performance across different student groups and explain the trade-offs.",
      rubric: [
        {
          id: "technical_accuracy",
          title: "Technical concept accuracy",
          description: "Explains AI concepts, model behaviour, inputs, outputs, and limitations accurately.",
          skillLinks: [
            { skillId: "technical_understanding", weight: 1 },
            { skillId: "communication", weight: 0.5 },
          ],
          keywords: ["model", "algorithm", "training", "input", "output", "accuracy", "prediction", "loss", "classification"],
        },
        {
          id: "math_data_reasoning",
          title: "Mathematical and data reasoning",
          description: "Uses data, metrics, numerical reasoning, or evaluation logic to justify claims.",
          skillLinks: [
            { skillId: "mathematical_reasoning", weight: 0.8 },
            { skillId: "data_literacy", weight: 1 },
          ],
          keywords: ["data", "metric", "accuracy", "percentage", "mean", "bias", "sample", "dataset", "evaluate"],
        },
        {
          id: "decomposition",
          title: "Problem decomposition",
          description: "Breaks a technical problem into requirements, steps, components, or tests.",
          skillLinks: [
            { skillId: "problem_decomposition", weight: 1 },
            { skillId: "practical_problem_solving", weight: 0.8 },
            { skillId: "research_question_design", weight: 0.5 },
          ],
          keywords: ["step", "component", "requirement", "input", "output", "test", "compare", "next step"],
        },
        {
          id: "ethical_criticality",
          title: "Critical and ethical judgement",
          description: "Recognises assumptions, limitations, consequences, bias, or responsible use.",
          skillLinks: [
            { skillId: "critical_thinking", weight: 1 },
            { skillId: "ethical_awareness", weight: 1 },
            { skillId: "critical_evaluation", weight: 0.8 },
            { skillId: "real_world_impact", weight: 0.6 },
          ],
          keywords: ["limitation", "bias", "ethical", "fair", "risk", "assumption", "trade-off", "responsible"],
        },
      ],
    },
    {
      id: "research_methods",
      name: "Research Methods",
      description: "Research question, literature, method, evidence, and contribution skills.",
      sampleWork:
        "The research question asks whether adaptive feedback improves student confidence in introductory programming. Existing literature on formative assessment suggests that timely feedback can improve self-regulation, but there is less evidence about belongingness. I would use a mixed-method design with survey measures and short interviews. A limitation is that self-reported confidence may not match performance, so results should be interpreted carefully. The contribution is to understand how feedback affects both competency and identity.",
      rubric: [
        {
          id: "research_question",
          title: "Research question design",
          description: "Frames a focused, investigable question with clear scope.",
          skillLinks: [
            { skillId: "research_question_design", weight: 1 },
            { skillId: "problem_decomposition", weight: 0.5 },
          ],
          keywords: ["research question", "asks whether", "investigate", "scope", "hypothesis", "question"],
        },
        {
          id: "literature_synthesis",
          title: "Literature and evidence synthesis",
          description: "Connects sources, evidence, concepts, or prior work to the argument.",
          skillLinks: [
            { skillId: "literature_awareness", weight: 1 },
            { skillId: "evidence_synthesis", weight: 1 },
            { skillId: "academic_argumentation", weight: 0.6 },
          ],
          keywords: ["literature", "source", "study", "evidence", "prior work", "research", "suggests", "argues"],
        },
        {
          id: "method_reasoning",
          title: "Methodological reasoning",
          description: "Justifies data collection, analysis choices, and methodological fit.",
          skillLinks: [
            { skillId: "methodological_reasoning", weight: 1 },
            { skillId: "experiment_design", weight: 0.8 },
            { skillId: "data_literacy", weight: 0.5 },
          ],
          keywords: ["method", "design", "survey", "interview", "experiment", "sample", "analysis", "measure"],
        },
        {
          id: "contribution_criticality",
          title: "Critical evaluation and contribution",
          description: "Explains limits, implications, and the contribution to knowledge.",
          skillLinks: [
            { skillId: "critical_evaluation", weight: 1 },
            { skillId: "contribution_to_knowledge", weight: 1 },
            { skillId: "critical_thinking", weight: 0.6 },
          ],
          keywords: ["limitation", "contribution", "implication", "carefully", "validity", "future research", "identity"],
        },
      ],
    },
    {
      id: "industry_project",
      name: "Industry Project",
      description: "Stakeholder, delivery, testing, collaboration, and impact skills.",
      sampleWork:
        "The project responds to a stakeholder need: tutors want a quicker way to identify common learning gaps. I divided the work into a submission form, feedback records, analytics, and a teacher report. The prototype uses local storage first so we can test the workflow before connecting a database. I tested empty submissions, short submissions, and a full sample. The next delivery goal is to collect feedback from users and show the impact through a simple portfolio case study.",
      rubric: [
        {
          id: "stakeholder_problem",
          title: "Stakeholder problem definition",
          description: "Defines the user need, context, constraints, and success criteria.",
          skillLinks: [
            { skillId: "stakeholder_awareness", weight: 1 },
            { skillId: "communication", weight: 0.6 },
          ],
          keywords: ["stakeholder", "user", "need", "context", "criteria", "constraint", "success"],
        },
        {
          id: "solution_delivery",
          title: "Solution delivery",
          description: "Shows practical execution, component planning, and delivery decisions.",
          skillLinks: [
            { skillId: "delivery_execution", weight: 1 },
            { skillId: "practical_problem_solving", weight: 0.8 },
            { skillId: "tool_fluency", weight: 0.5 },
          ],
          keywords: ["prototype", "workflow", "database", "component", "build", "delivery", "tool", "implementation"],
        },
        {
          id: "testing_quality",
          title: "Testing and quality assurance",
          description: "Checks whether the solution works and explains testing evidence.",
          skillLinks: [
            { skillId: "testing_quality", weight: 1 },
            { skillId: "technical_understanding", weight: 0.6 },
          ],
          keywords: ["test", "tested", "quality", "empty", "edge", "validation", "bug", "works"],
        },
        {
          id: "impact_communication",
          title: "Impact and portfolio communication",
          description: "Communicates value, learning, collaboration, and real-world impact.",
          skillLinks: [
            { skillId: "real_world_impact", weight: 1 },
            { skillId: "portfolio_communication", weight: 0.8 },
            { skillId: "collaboration", weight: 0.5 },
          ],
          keywords: ["impact", "portfolio", "case study", "team", "collaboration", "feedback", "value", "users"],
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
  ],
  studentSkillStates: [],
  submissions: [],
  feedbackRecords: [],
  growthEvents: [],
  belongingnessCheckins: [],
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
  db.studentSkillStates ||= [];
  db.submissions ||= [];
  db.feedbackRecords ||= [];
  db.growthEvents ||= [];
  db.belongingnessCheckins ||= [];

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

  if (request.method === "GET" && pathname === "/api/health") {
    return sendJson(response, 200, { ok: true, service: "student-feedback-growth-coach" });
  }

  if (request.method === "GET" && pathname === "/api/brain/status") {
    return sendJson(response, 200, getBrainStatus());
  }

  if (request.method === "GET" && pathname === "/api/bootstrap") {
    return sendJson(response, 200, {
      ...db,
      brainStatus: getBrainStatus(),
      teacherAnalytics: buildTeacherAnalytics(db),
    });
  }

  if (request.method === "POST" && pathname === "/api/reset-demo") {
    const fresh = ensureDataShape(cloneData(seedData));
    await saveDb(fresh);
    return sendJson(response, 200, {
      ...fresh,
      brainStatus: getBrainStatus(),
      teacherAnalytics: buildTeacherAnalytics(fresh),
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

  return sendError(response, 404, "API route not found");
}

async function serveStatic(response, pathname) {
  const cleanPath = pathname === "/" ? "/index.html" : pathname;
  const absolutePath = path.normalize(path.join(ROOT, cleanPath));
  if (!absolutePath.startsWith(ROOT)) {
    return sendError(response, 403, "Forbidden");
  }

  try {
    const content = await fs.readFile(absolutePath);
    const extension = path.extname(absolutePath);
    response.writeHead(200, { "Content-Type": mimeTypes[extension] || "application/octet-stream" });
    response.end(content);
  } catch (error) {
    sendError(response, 404, "File not found");
  }
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
      rubric: module.rubric.map((criterion) => ({
        id: criterion.id,
        title: criterion.title,
        description: criterion.description,
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
        throw error;
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
  const module = db.modules.find((item) => item.id === payload.moduleId);
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
  const keywordHits = (criterion.keywords || []).reduce((total, keyword) => {
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

function buildTeacherAnalytics(db) {
  const gapCounts = new Map();
  const personaCounts = new Map();

  for (const record of db.feedbackRecords) {
    const persona = db.personas.find((item) => item.id === record.personaId);
    const module = db.modules.find((item) => item.id === record.moduleId);
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
    technical_accuracy: "Use concept explanation drills where students define input, process, output, and limitation.",
    math_data_reasoning: "Run a short data reasoning clinic using one metric, one chart, and one interpretation.",
    decomposition: "Ask students to map work into components, tests, and next steps before drafting.",
    ethical_criticality: "Use a limitation and consequence prompt in every technical explanation.",
    research_question: "Give Visionary students question frames that name population, variable, and purpose.",
    literature_synthesis: "Practise source-to-claim sentences that explain why each source matters.",
    method_reasoning: "Compare two possible methods and ask students to justify the better fit.",
    contribution_criticality: "Ask students to state what their work adds and what it cannot prove.",
    stakeholder_problem: "Have Challenger students interview or write for a specific stakeholder.",
    solution_delivery: "Use a delivery board with problem, prototype, test, and next release.",
    testing_quality: "Require at least three named tests before a project can be marked complete.",
    impact_communication: "Ask students to turn the work into a portfolio story with problem, action, impact.",
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
  console.log(`Student feedback growth coach running at http://localhost:${PORT}`);
});
