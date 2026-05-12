import { useEffect, useMemo, useState } from "react";
import { Upload, FilePlus, ChevronRight, Plus } from "lucide-react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { useBootstrap } from "../../hooks/useBootstrap";
import { createTeacherModule, extractRubrics, saveModuleRubric } from "../../services/api";
import { extractTextFromFile } from "../../services/fileText";
import { useActiveUser } from "../../hooks/useActiveUser";
import type { Rubric } from "../../services/types";
import { RubricEditor } from "./RubricEditor";

function toRubrics(rubrics: Rubric[] = []): Rubric[] {
  return rubrics.map((rubric) => ({
    ...rubric,
    id: rubric.id,
    name: rubric.name || rubric.title,
    title: rubric.title || rubric.name || "Rubric",
    scoringGuidance: rubric.scoringGuidance || rubric.expectedScoring || "",
    expectedScoring: rubric.expectedScoring || rubric.scoringGuidance || "",
    linkedSkillIds: rubric.linkedSkillIds || rubric.skillLinks?.map((link) => link.skillId) || [],
  }));
}

function blankRubric(): Rubric {
  const id = `manual_${Date.now()}`;
  return {
    id,
    name: "New rubric",
    title: "New rubric",
    description: "Describe what this rubric should assess.",
    lookingFor: "Describe the evidence to look for.",
    scoringGuidance: "High-scoring work should be explicit, accurate, and supported by evidence.",
    expectedScoring: "High-scoring work should be explicit, accurate, and supported by evidence.",
    weight: 1,
    skillLinks: [],
    linkedSkillIds: [],
  };
}

export function TeacherSetup() {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [moduleName, setModuleName] = useState("");
  const [description, setDescription] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data, loading } = useBootstrap();
  const { user } = useActiveUser();
  const navigate = useNavigate();
  const modules = data?.modules || [];
  const availableSkills = useMemo(() => data?.skills || [], [data?.skills]);
  const selectedModule = modules.find((module) => module.id === moduleId);

  useEffect(() => {
    if (!user || user.role !== "teacher") navigate("/login/teacher");
  }, [navigate, user]);

  useEffect(() => {
    if (!moduleId && modules[0]) {
      setModuleId(modules[0].id);
      setDescription(modules[0].teacherFocus || modules[0].description);
      setRubrics(toRubrics(modules[0].rubric));
    }
  }, [moduleId, modules]);

  function selectModule(nextModuleId: string) {
    const nextModule = modules.find((module) => module.id === nextModuleId);
    setModuleId(nextModuleId);
    if (nextModule) {
      setDescription(nextModule.teacherFocus || nextModule.description);
      setRubrics(toRubrics(nextModule.rubric));
    }
  }

  async function handleRubricUpload(file: File | null) {
    if (!file) return;
    setExtracting(true);
    setError(null);
    try {
      const textContent = await extractTextFromFile(file);
      const result = await extractRubrics({
        fileName: file.name,
        mimeType: file.type || "text/plain",
        textContent,
      });
      setRubrics(toRubrics(result.rubrics));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to extract rubrics from that file.");
    } finally {
      setExtracting(false);
    }
  }

  function applyTemplate(kind: "scientific" | "essay") {
    const templateRubrics =
      kind === "scientific"
        ? [
            {
              id: "template_method_evidence",
              name: "Method and evidence",
              title: "Method and evidence",
              description: "Explains the method clearly and uses observations, measurements, or results as evidence.",
              lookingFor: "method, observations, measurements, results, evidence",
              scoringGuidance: "High-scoring work links method choices to specific evidence and avoids unsupported claims.",
              expectedScoring: "High-scoring work links method choices to specific evidence and avoids unsupported claims.",
              weight: 1,
              linkedSkillIds: ["technical_understanding", "data_literacy"],
              skillLinks: [
                { skillId: "technical_understanding", weight: 1 },
                { skillId: "data_literacy", weight: 1 },
              ],
            },
            {
              id: "template_evaluation",
              name: "Evaluation and improvement",
              title: "Evaluation and improvement",
              description: "Evaluates limitations and explains realistic next improvements.",
              lookingFor: "limitations, errors, reliability, improvement",
              scoringGuidance: "High-scoring work identifies what limits the result and proposes a precise next step.",
              expectedScoring: "High-scoring work identifies what limits the result and proposes a precise next step.",
              weight: 1,
              linkedSkillIds: ["critical_thinking", "reflection"],
              skillLinks: [
                { skillId: "critical_thinking", weight: 1 },
                { skillId: "reflection", weight: 1 },
              ],
            },
          ]
        : [
            {
              id: "template_argument",
              name: "Argument and structure",
              title: "Argument and structure",
              description: "Builds a coherent argument with clear paragraph structure and evidence-led claims.",
              lookingFor: "argument, structure, claim, evidence, conclusion",
              scoringGuidance: "High-scoring work makes a claim, supports it with evidence, and explains why it matters.",
              expectedScoring: "High-scoring work makes a claim, supports it with evidence, and explains why it matters.",
              weight: 1,
              linkedSkillIds: ["communication", "academic_argumentation"],
              skillLinks: [
                { skillId: "communication", weight: 1 },
                { skillId: "academic_argumentation", weight: 1 },
              ],
            },
            {
              id: "template_analysis",
              name: "Critical analysis",
              title: "Critical analysis",
              description: "Compares evidence, considers limitations, and explains implications.",
              lookingFor: "compare, limitation, implication, analysis, evaluate",
              scoringGuidance: "High-scoring work moves beyond description by weighing evidence and explaining consequences.",
              expectedScoring: "High-scoring work moves beyond description by weighing evidence and explaining consequences.",
              weight: 1,
              linkedSkillIds: ["critical_thinking", "evidence_synthesis"],
              skillLinks: [
                { skillId: "critical_thinking", weight: 1 },
                { skillId: "evidence_synthesis", weight: 1 },
              ],
            },
          ];
    setRubrics(toRubrics(templateRubrics));
  }

  async function saveSetup() {
    setSaving(true);
    setError(null);
    try {
      if (mode === "new") {
        await createTeacherModule({
          name: moduleName,
          description,
          teacherFocus: description,
          criteria: rubrics,
        });
      } else if (selectedModule) {
        await saveModuleRubric(selectedModule.id, {
          teacherFocus: description || selectedModule.teacherFocus || selectedModule.description,
          criteria: rubrics,
        });
      }
      navigate("/teacher/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save module.");
    } finally {
      setSaving(false);
    }
  }

  const canSave = mode === "new" ? moduleName.trim().length > 2 && description.trim().length > 17 && rubrics.length >= 2 : Boolean(selectedModule && description.trim().length > 17 && rubrics.length >= 2);

  return (
    <div className="flex-1 overflow-y-auto p-6 flex justify-center py-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-3xl space-y-12"
      >
        <div className="text-center md:text-left border-b border-stone-200 dark:border-stone-800 pb-6">
          <h2 className="text-3xl md:text-4xl font-medium text-stone-800 dark:text-stone-100">{mode === "new" ? "Create New Module" : "Module Setup"}</h2>
          <p className="text-stone-500 dark:text-stone-400 mt-2 italic">Define the academic parameters and structural rubrics.</p>
        </div>

        <div className="bg-[#F9F8F6] dark:bg-[#1A1A1A] p-8 md:p-10 rounded-sm border border-stone-200 dark:border-stone-800 space-y-10">
          <div className="space-y-6">
            {mode === "existing" ? (
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium text-stone-500 mb-3">Existing Module</label>
                <div className="grid md:grid-cols-[1fr_auto] gap-3">
                  <select
                    value={moduleId}
                    onChange={(event) => selectModule(event.target.value)}
                    className="w-full p-4 border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#121212] focus:border-stone-800 dark:focus:border-stone-400 outline-none transition-all rounded-sm font-light text-stone-800 dark:text-stone-200"
                    disabled={loading}
                  >
                    {modules.map((module) => (
                      <option key={module.id} value={module.id}>
                        {module.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("new");
                      setModuleName("");
                      setDescription("");
                      setRubrics([]);
                    }}
                    className="flex items-center justify-center gap-2 px-5 py-3 border border-stone-300 dark:border-stone-700 rounded-sm text-sm font-medium text-stone-700 dark:text-stone-300 hover:border-stone-500 dark:hover:border-stone-500 transition-colors bg-transparent"
                  >
                    <Plus className="w-4 h-4 stroke-[1.5]" /> Add Module
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs uppercase tracking-widest font-medium text-stone-500 mb-3">New Module Name</label>
                <input
                  type="text"
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                  placeholder="e.g., Green Chemistry Design Brief"
                  className="w-full p-4 border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#121212] focus:border-stone-800 dark:focus:border-stone-400 outline-none transition-all rounded-sm font-light text-stone-800 dark:text-stone-200"
                />
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-stone-500 mb-3">Syllabus / Objective</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail the primary learning objectives..."
                className="w-full p-4 border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#121212] focus:border-stone-800 dark:focus:border-stone-400 outline-none transition-all h-32 resize-none rounded-sm font-light text-stone-800 dark:text-stone-200"
              />
              {error && <p className="text-sm text-stone-500 italic mt-3">{error}</p>}
            </div>
          </div>

          <div className="pt-8 border-t border-stone-200 dark:border-stone-800">
            <h3 className="text-sm uppercase tracking-widest font-medium mb-2 text-stone-800 dark:text-stone-200">Evaluation Rubrics</h3>
            <p className="text-sm text-stone-500 mb-6 italic font-light">Supply the core criteria against which AI will analyze submissions.</p>

            <label className="border border-dashed border-stone-300 dark:border-stone-700 rounded-sm p-12 flex flex-col items-center justify-center text-center hover:border-stone-500 dark:hover:border-stone-400 transition-colors cursor-pointer bg-white dark:bg-[#121212]">
              <input
                type="file"
                accept=".txt,.md,.csv,.json,.html,.doc,.docx,.pdf"
                className="sr-only"
                onChange={(event) => handleRubricUpload(event.target.files?.[0] || null)}
              />
              <Upload className="w-8 h-8 text-stone-400 mb-4 stroke-[1.5]" />
              <p className="font-medium text-stone-800 dark:text-stone-200">{extracting ? "Extracting rubrics..." : "Click to upload or drag and drop"}</p>
              <p className="text-xs text-stone-400 mt-2 font-light">Readable rubric files work best for this MVP</p>
            </label>
          </div>

          <div className="pt-8 border-t border-stone-200 dark:border-stone-800 space-y-6">
            <h3 className="text-sm uppercase tracking-widest font-medium text-stone-800 dark:text-stone-200">Or Select a Template</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <button type="button" onClick={() => applyTemplate("scientific")} className="flex items-start gap-4 p-5 border border-stone-200 dark:border-stone-700 rounded-sm text-left hover:border-stone-400 dark:hover:border-stone-500 hover:bg-white dark:hover:bg-[#121212] transition-all group bg-transparent">
                <div className="text-stone-400 group-hover:text-stone-800 dark:group-hover:text-stone-200 transition-colors mt-1">
                  <FilePlus className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div>
                  <p className="font-medium text-stone-800 dark:text-stone-200">Scientific Lab Report</p>
                  <p className="text-xs text-stone-500 mt-1 font-light leading-relaxed">Standardized metrics for empirical write-ups.</p>
                </div>
              </button>
              <button type="button" onClick={() => applyTemplate("essay")} className="flex items-start gap-4 p-5 border border-stone-200 dark:border-stone-700 rounded-sm text-left hover:border-stone-400 dark:hover:border-stone-500 hover:bg-white dark:hover:bg-[#121212] transition-all group bg-transparent">
                <div className="text-stone-400 group-hover:text-stone-800 dark:group-hover:text-stone-200 transition-colors mt-1">
                  <FilePlus className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div>
                  <p className="font-medium text-stone-800 dark:text-stone-200">Research Essay</p>
                  <p className="text-xs text-stone-500 mt-1 font-light leading-relaxed">Argumentative structure and citation rubrics.</p>
                </div>
              </button>
            </div>
          </div>

          <RubricEditor
            rubrics={rubrics}
            availableSkills={availableSkills}
            onChange={setRubrics}
            onAdd={() => setRubrics((current) => [...current, blankRubric()])}
            onRemove={(id) => setRubrics((current) => current.filter((rubric) => rubric.id !== id))}
          />
        </div>

        <div className="flex justify-end">
          <button
            disabled={!canSave || saving}
            onClick={saveSetup}
            className="flex items-center gap-3 px-8 py-3.5 bg-stone-900 dark:bg-stone-100 text-[#F4F3F0] dark:text-stone-900 rounded-sm font-medium transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-700 dark:hover:bg-white text-sm uppercase tracking-widest"
          >
            {saving ? "Saving..." : mode === "new" ? "Create Module" : "Save Module"} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
