import { useEffect, useState } from "react";
import { Upload, FilePlus, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { useBootstrap } from "../../hooks/useBootstrap";
import { saveModuleRubric } from "../../services/api";

export function TeacherSetup() {
  const [moduleName, setModuleName] = useState("");
  const [description, setDescription] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data, loading } = useBootstrap();
  const navigate = useNavigate();
  const modules = data?.modules || [];
  const selectedModule = modules.find((module) => module.id === moduleId);

  useEffect(() => {
    if (!moduleId && modules[0]) {
      setModuleId(modules[0].id);
      setModuleName(modules[0].name);
      setDescription(modules[0].teacherFocus || modules[0].description);
    }
  }, [moduleId, modules]);

  async function createModule() {
    if (!selectedModule) return;
    setSaving(true);
    setError(null);
    try {
      await saveModuleRubric(selectedModule.id, {
        teacherFocus: description || selectedModule.teacherFocus || selectedModule.description,
        criteria: selectedModule.rubric,
      });
      navigate('/teacher/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to initialize module.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 flex justify-center py-12">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-3xl space-y-12"
      >
        <div className="text-center md:text-left border-b border-stone-200 dark:border-stone-800 pb-6">
          <h2 className="text-3xl md:text-4xl font-medium text-stone-800 dark:text-stone-100">Create New Module</h2>
          <p className="text-stone-500 dark:text-stone-400 mt-2 italic">Define the academic parameters and structural rubrics.</p>
        </div>

        <div className="bg-[#F9F8F6] dark:bg-[#1A1A1A] p-8 md:p-10 rounded-sm border border-stone-200 dark:border-stone-800 space-y-10">
          <div className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-stone-500 mb-3">Module Name</label>
              <input 
                type="text" 
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                placeholder="e.g., Biology 101 - Lab Report"
                className="w-full p-4 border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#121212] focus:border-stone-800 dark:focus:border-stone-400 outline-none transition-all rounded-sm font-light text-stone-800 dark:text-stone-200"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-stone-500 mb-3">Existing Module</label>
              <select
                value={moduleId}
                onChange={(event) => {
                  const nextModule = modules.find((module) => module.id === event.target.value);
                  setModuleId(event.target.value);
                  if (nextModule) {
                    setModuleName(nextModule.name);
                    setDescription(nextModule.teacherFocus || nextModule.description);
                  }
                }}
                className="w-full p-4 border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#121212] focus:border-stone-800 dark:focus:border-stone-400 outline-none transition-all rounded-sm font-light text-stone-800 dark:text-stone-200"
                disabled={loading}
              >
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>{module.name}</option>
                ))}
              </select>
            </div>
            
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
            
            <div className="border border-dashed border-stone-300 dark:border-stone-700 rounded-sm p-12 flex flex-col items-center justify-center text-center hover:border-stone-500 dark:hover:border-stone-400 transition-colors cursor-pointer bg-white dark:bg-[#121212]">
              <Upload className="w-8 h-8 text-stone-400 mb-4 stroke-[1.5]" />
              <p className="font-medium text-stone-800 dark:text-stone-200">Click to upload or drag and drop</p>
              <p className="text-xs text-stone-400 mt-2 font-light">PDF, DOCX, or CSV (Max 10MB)</p>
            </div>
          </div>

          <div className="pt-8 border-t border-stone-200 dark:border-stone-800 space-y-6">
            <h3 className="text-sm uppercase tracking-widest font-medium text-stone-800 dark:text-stone-200">Or Select a Template</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <button className="flex items-start gap-4 p-5 border border-stone-200 dark:border-stone-700 rounded-sm text-left hover:border-stone-400 dark:hover:border-stone-500 hover:bg-white dark:hover:bg-[#121212] transition-all group bg-transparent">
                <div className="text-stone-400 group-hover:text-stone-800 dark:group-hover:text-stone-200 transition-colors mt-1">
                  <FilePlus className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div>
                  <p className="font-medium text-stone-800 dark:text-stone-200">Scientific Lab Report</p>
                  <p className="text-xs text-stone-500 mt-1 font-light leading-relaxed">Standardized metrics for empirical write-ups.</p>
                </div>
              </button>
              <button className="flex items-start gap-4 p-5 border border-stone-200 dark:border-stone-700 rounded-sm text-left hover:border-stone-400 dark:hover:border-stone-500 hover:bg-white dark:hover:bg-[#121212] transition-all group bg-transparent">
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
        </div>

        <div className="flex justify-end">
          <button 
            disabled={!moduleName || !selectedModule || saving}
            onClick={createModule}
            className="flex items-center gap-3 px-8 py-3.5 bg-stone-900 dark:bg-stone-100 text-[#F4F3F0] dark:text-stone-900 rounded-sm font-medium transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-700 dark:hover:bg-white text-sm uppercase tracking-widest"
          >
            {saving ? "Creating..." : "Create Module"} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
