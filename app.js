const api = {
  bootstrap: "/api/bootstrap",
  brainStatus: "/api/brain/status",
  reset: "/api/reset-demo",
  analyse: "/api/submissions/analyse",
  teacherAnalytics: "/api/teachers/analytics",
  studentGrowth: (studentId) => `/api/students/${studentId}/growth`,
  studentPersona: (studentId) => `/api/students/${studentId}/persona`,
};

const elements = {
  studentSelect: document.querySelector("#studentSelect"),
  resetBtn: document.querySelector("#resetBtn"),
  pathTitle: document.querySelector("#pathTitle"),
  pathMessage: document.querySelector("#pathMessage"),
  personaGrid: document.querySelector("#personaGrid"),
  moduleSelect: document.querySelector("#moduleSelect"),
  workInput: document.querySelector("#workInput"),
  confidenceSlider: document.querySelector("#confidenceSlider"),
  confidenceValue: document.querySelector("#confidenceValue"),
  claritySlider: document.querySelector("#claritySlider"),
  clarityValue: document.querySelector("#clarityValue"),
  belongingSlider: document.querySelector("#belongingSlider"),
  belongingValue: document.querySelector("#belongingValue"),
  sampleBtn: document.querySelector("#sampleBtn"),
  analyseBtn: document.querySelector("#analyseBtn"),
  feedbackPanel: document.querySelector(".feedback-panel"),
  feedbackToggle: document.querySelector("#feedbackToggle"),
  brainMode: document.querySelector("#brainMode"),
  latestScore: document.querySelector("#latestScore"),
  feedbackContent: document.querySelector("#feedbackContent"),
  growthTitle: document.querySelector("#growthTitle"),
  summaryMetrics: document.querySelector("#summaryMetrics"),
  growthChart: document.querySelector("#growthChart"),
  pathSkillsTitle: document.querySelector("#pathSkillsTitle"),
  coreSkills: document.querySelector("#coreSkills"),
  pathSkills: document.querySelector("#pathSkills"),
  belongingSkills: document.querySelector("#belongingSkills"),
  teacherGrid: document.querySelector("#teacherGrid"),
  teacherMeta: document.querySelector("#teacherMeta"),
  toast: document.querySelector("#toast"),
};

let state = {
  students: [],
  personas: [],
  modules: [],
  skills: [],
  brainStatus: null,
  teacherAnalytics: null,
  selectedStudentId: null,
  selectedModuleId: null,
  growthProfile: null,
  latestFeedback: null,
};

initialise();

async function initialise() {
  bindEvents();
  await loadBootstrap();
}

function bindEvents() {
  elements.studentSelect.addEventListener("change", async () => {
    state.selectedStudentId = elements.studentSelect.value;
    await refreshGrowth();
    render();
  });

  elements.moduleSelect.addEventListener("change", () => {
    state.selectedModuleId = elements.moduleSelect.value;
  });

  elements.sampleBtn.addEventListener("click", () => {
    const module = selectedModule();
    elements.workInput.value = module?.sampleWork || "";
    elements.workInput.focus();
  });

  elements.analyseBtn.addEventListener("click", async () => {
    await analyseSubmission();
  });

  elements.feedbackToggle.addEventListener("click", () => {
    const isCollapsed = elements.feedbackPanel.classList.toggle("collapsed");
    elements.feedbackToggle.textContent = isCollapsed ? "Show" : "Hide";
    elements.feedbackToggle.setAttribute("aria-expanded", String(!isCollapsed));
  });

  elements.resetBtn.addEventListener("click", async () => {
    const data = await postJson(api.reset, {});
    hydrate(data);
    showToast("Demo data reset");
    render();
  });

  [
    [elements.confidenceSlider, elements.confidenceValue],
    [elements.claritySlider, elements.clarityValue],
    [elements.belongingSlider, elements.belongingValue],
  ].forEach(([slider, value]) => {
    slider.addEventListener("input", () => {
      value.textContent = slider.value;
    });
  });
}

async function loadBootstrap() {
  const data = await fetchJson(api.bootstrap);
  hydrate(data);
  await refreshGrowth();
  render();
}

function hydrate(data) {
  state.students = data.students || [];
  state.personas = data.personas || [];
  state.modules = data.modules || [];
  state.skills = data.skills || [];
  state.brainStatus = data.brainStatus || state.brainStatus;
  state.teacherAnalytics = data.teacherAnalytics || null;
  state.selectedStudentId ||= state.students[0]?.id;
  state.selectedModuleId ||= state.modules[0]?.id;
  state.latestFeedback = data.feedbackRecords?.[0] || state.latestFeedback;
  renderSelectors();
}

function renderSelectors() {
  elements.studentSelect.innerHTML = state.students
    .map((student) => `<option value="${student.id}">${escapeHtml(student.name)}</option>`)
    .join("");
  elements.studentSelect.value = state.selectedStudentId;

  elements.moduleSelect.innerHTML = state.modules
    .map((module) => `<option value="${module.id}">${escapeHtml(module.name)}</option>`)
    .join("");
  elements.moduleSelect.value = state.selectedModuleId;
}

async function refreshGrowth() {
  if (!state.selectedStudentId) return;
  state.growthProfile = await fetchJson(api.studentGrowth(state.selectedStudentId));
  state.latestFeedback = state.growthProfile.recentFeedback?.[0] || state.latestFeedback;
}

function render() {
  if (!state.growthProfile) return;
  renderPersona();
  renderFeedback();
  renderGrowth();
  renderTeacherAnalytics();
}

function renderPersona() {
  const { student, persona } = state.growthProfile;
  elements.pathTitle.textContent = `${student.name} is on the ${persona.name} path`;
  elements.pathMessage.textContent = `${persona.identityMessage} This path shapes the growth chart, skill priorities, and feedback language.`;

  elements.personaGrid.innerHTML = state.personas
    .map((item) => {
      const active = item.id === persona.id;
      return `
        <button class="persona-card ${active ? "active" : ""}" type="button" data-persona-id="${item.id}">
          <span class="persona-tag">${escapeHtml(item.pathLabel)}</span>
          <strong>${escapeHtml(item.name)}</strong>
          <p>${escapeHtml(item.identityMessage)}</p>
        </button>
      `;
    })
    .join("");

  elements.personaGrid.querySelectorAll("[data-persona-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const personaId = button.dataset.personaId;
      await patchJson(api.studentPersona(state.selectedStudentId), { personaId });
      await refreshGrowth();
      showToast(`Path updated to ${button.querySelector("strong").textContent}`);
      render();
    });
  });
}

function renderFeedback() {
  const feedback = state.latestFeedback;
  if (!feedback || feedback.studentId !== state.selectedStudentId) {
    elements.latestScore.textContent = "--";
    elements.brainMode.textContent = state.brainStatus?.activeMode || "local";
    elements.feedbackContent.className = "empty-state";
    elements.feedbackContent.textContent = "No feedback yet for this student. Analyse a submission to create the first record.";
    return;
  }

  elements.latestScore.textContent = `${feedback.overallScore}`;
  const brain = feedback.brain || state.brainStatus || {};
  elements.brainMode.textContent = `${brain.mode || brain.activeMode || "local"} brain`;
  elements.feedbackContent.className = "feedback-stack";
  elements.feedbackContent.innerHTML = `
    <section class="feedback-box">
      <h3>Brain pipeline</h3>
      <p>${escapeHtml(brain.provider || state.brainStatus?.provider || "local-rubric-brain")} - ${escapeHtml(brain.model || state.brainStatus?.model || "deterministic-local")}</p>
      ${brain.fallbackReason ? `<p>${escapeHtml(brain.fallbackReason)}</p>` : ""}
    </section>
    <section class="feedback-box">
      <h3>Belongingness message</h3>
      <p>${escapeHtml(feedback.belongingnessMessage)}</p>
    </section>
    <section class="feedback-box">
      <h3>Next best action</h3>
      <p>${escapeHtml(feedback.nextBestAction || "Use the rubric feedback to make one focused revision.")}</p>
    </section>
    <section class="feedback-box">
      <h3>Strengths</h3>
      ${renderList(feedback.strengths)}
    </section>
    <section class="feedback-box">
      <h3>Growth gaps</h3>
      ${
        feedback.gaps.length
          ? renderList(feedback.gaps.map((gap) => gap.message))
          : "<p>No major gaps were detected in the latest analysis.</p>"
      }
    </section>
    <section class="feedback-box">
      <h3>Rubric evidence</h3>
      <div class="criteria-list">
        ${feedback.criteriaResults.map(renderCriterion).join("")}
      </div>
    </section>
    <section class="feedback-box">
      <h3>Skill signals</h3>
      ${
        feedback.skillSignals?.length
          ? `<div class="criteria-list">${feedback.skillSignals.slice(0, 6).map(renderSkillSignal).join("")}</div>`
          : "<p>No explicit skill signals were returned for this record.</p>"
      }
    </section>
  `;
}

function renderCriterion(criterion) {
  const color = criterion.score >= 75 ? "var(--green)" : criterion.score >= 60 ? "var(--amber)" : "var(--red)";
  return `
    <article class="criterion-row">
      <div class="row-main">
        <strong>${escapeHtml(criterion.title)}</strong>
        <span>${criterion.score}/100</span>
      </div>
      <div class="meter"><span style="--value: ${criterion.score}%; --bar-color: ${color};"></span></div>
      <div class="muted">${escapeHtml(criterion.evidenceSummary)}</div>
      ${criterion.nextStep ? `<div class="muted">Next: ${escapeHtml(criterion.nextStep)}</div>` : ""}
    </article>
  `;
}

function renderSkillSignal(signal) {
  return `
    <article class="criterion-row">
      <div class="row-main">
        <strong>${escapeHtml(skillName(signal.skillId))}</strong>
        <span>${escapeHtml(signal.signal)}</span>
      </div>
      <div class="muted">${escapeHtml(signal.reason)}</div>
    </article>
  `;
}

function renderGrowth() {
  const { student, persona, groups, summary, timeline } = state.growthProfile;
  elements.growthTitle.textContent = `${student.name}'s ${persona.name} growth map`;
  elements.pathSkillsTitle.textContent = `${persona.name} skills`;

  elements.summaryMetrics.innerHTML = [
    ["Core STEM", summary.coreAverage],
    [persona.name, summary.pathAverage],
    ["Belonging", summary.belongingnessAverage],
    ["Total growth", `+${summary.totalGrowth}`],
  ]
    .map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`)
    .join("");

  elements.growthChart.innerHTML = `
    <section class="chart-card">
      <h3>Competency and belonging averages</h3>
      ${renderAverageBars(summary, persona.name)}
    </section>
    <section class="chart-card">
      <h3>Growth over time</h3>
      ${renderTimeline(timeline)}
    </section>
  `;

  elements.coreSkills.innerHTML = groups.core.map(renderSkillRow).join("");
  elements.pathSkills.innerHTML = groups.path.map(renderSkillRow).join("");
  elements.belongingSkills.innerHTML = groups.belongingness.map(renderSkillRow).join("");
}

function renderAverageBars(summary, personaName) {
  const rows = [
    ["Core STEM", summary.coreAverage, "var(--teal)"],
    [personaName, summary.pathAverage, "var(--blue)"],
    ["Belongingness", summary.belongingnessAverage, "var(--green)"],
  ];

  return `
    <div class="skill-list">
      ${rows
        .map(
          ([label, value, color]) => `
            <article class="skill-row">
              <div class="row-main">
                <strong>${escapeHtml(label)}</strong>
                <span>${value}/100</span>
              </div>
              <div class="meter"><span style="--value: ${value}%; --bar-color: ${color};"></span></div>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderTimeline(timeline) {
  const points = timeline.length ? timeline : [{ date: "Start", value: 0 }];
  const maxValue = Math.max(10, ...points.map((point) => point.value));
  const width = 520;
  const height = 210;
  const pad = 28;
  const coords = points.map((point, index) => {
    const x = points.length === 1 ? width / 2 : pad + (index * (width - pad * 2)) / (points.length - 1);
    const y = height - pad - (point.value / maxValue) * (height - pad * 2);
    return { ...point, x, y };
  });

  const line = coords.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${pad},${height - pad} ${line} ${width - pad},${height - pad}`;

  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Growth timeline">
      <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="#d8e1e4" stroke-width="2" />
      <polyline points="${area}" fill="rgba(20, 117, 111, 0.08)" stroke="none"></polyline>
      <polyline points="${line}" fill="none" stroke="#14756f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></polyline>
      ${coords
        .map(
          (point) => `
            <circle cx="${point.x}" cy="${point.y}" r="5" fill="#14756f"></circle>
            <text x="${point.x}" y="${Math.max(18, point.y - 10)}" text-anchor="middle" font-size="12" fill="#607076">${point.value}</text>
          `,
        )
        .join("")}
      <text x="${pad}" y="${height - 6}" font-size="12" fill="#607076">Start</text>
      <text x="${width - pad}" y="${height - 6}" text-anchor="end" font-size="12" fill="#607076">Now</text>
    </svg>
  `;
}

function renderSkillRow(stateItem) {
  const value = stateItem.current;
  const color =
    stateItem.skill.category === "belongingness"
      ? "var(--green)"
      : stateItem.skill.category === "path_specific"
        ? "var(--blue)"
        : "var(--teal)";
  return `
    <article class="skill-row">
      <div class="row-main">
        <strong>${escapeHtml(stateItem.skill.name)}</strong>
        <span class="stage">${escapeHtml(stateItem.stage)}</span>
      </div>
      <div class="meter"><span style="--value: ${value}%; --bar-color: ${color};"></span></div>
      <div class="row-main muted">
        <span>Start ${stateItem.baseline} - Now ${stateItem.current} - Target ${stateItem.target}</span>
        <span class="delta">+${Math.max(stateItem.growth, 0)}</span>
      </div>
    </article>
  `;
}

function renderTeacherAnalytics() {
  const analytics = state.teacherAnalytics;
  if (!analytics) return;
  elements.teacherMeta.textContent = `${analytics.feedbackCount} feedback record(s) - average ${analytics.averageScore}/100`;

  if (!analytics.commonGaps.length) {
    elements.teacherGrid.innerHTML = `<div class="empty-state">No shared gaps yet. Run a few analyses to populate the teacher view.</div>`;
    return;
  }

  elements.teacherGrid.innerHTML = analytics.commonGaps
    .map(
      (gap) => `
        <article class="teacher-row">
          <span class="count">${gap.count} seen</span>
          <strong>${escapeHtml(gap.label)}</strong>
          <div class="muted">${escapeHtml(gap.personaName)} - ${escapeHtml(gap.moduleName)} - ${gap.affectedStudents} student(s)</div>
          <div class="muted">${escapeHtml(gap.recommendedAction)}</div>
        </article>
      `,
    )
    .join("");
}

async function analyseSubmission() {
  const workText = elements.workInput.value.trim();
  if (!workText) {
    showToast("Paste or load some work first");
    return;
  }

  elements.analyseBtn.disabled = true;
  elements.analyseBtn.textContent = "Analysing...";

  try {
    const result = await postJson(api.analyse, {
      studentId: state.selectedStudentId,
      moduleId: state.selectedModuleId,
      workText,
      confidenceBefore: Number(elements.confidenceSlider.value),
      clarityAfter: Number(elements.claritySlider.value),
      pathBelonging: Number(elements.belongingSlider.value),
    });

    state.growthProfile = result.growthProfile;
    state.latestFeedback = result.feedbackRecord;
    state.brainStatus = result.brainStatus || state.brainStatus;
    state.teacherAnalytics = result.teacherAnalytics;
    showToast("Feedback saved and growth chart updated");
    render();
  } catch (error) {
    showToast(error.message);
  } finally {
    elements.analyseBtn.disabled = false;
    elements.analyseBtn.textContent = "Analyse and save growth";
  }
}

function selectedModule() {
  return state.modules.find((module) => module.id === state.selectedModuleId);
}

function skillName(skillId) {
  return state.skills.find((skill) => skill.id === skillId)?.name || skillId;
}

function renderList(items) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

async function fetchJson(url) {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

async function postJson(url, body) {
  return writeJson(url, "POST", body);
}

async function patchJson(url, body) {
  return writeJson(url, "PATCH", body);
}

async function writeJson(url, method, body) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 2200);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
