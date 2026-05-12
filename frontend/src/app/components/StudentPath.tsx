import { useNavigate } from "react-router";
import { Building2, FlaskConical, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { updateStudentPersona, updateStudentSkills } from "../../services/api";
import { useActiveUser } from "../../hooks/useActiveUser";
import { useBootstrap } from "../../hooks/useBootstrap";

export function StudentPath() {
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { studentId, user } = useActiveUser();
  const { data, loading: bootstrapLoading } = useBootstrap();
  const navigate = useNavigate();
  const activeStudent = data?.students?.find((student) => student.id === studentId);
  const currentPath = activeStudent?.selectedPersonaId === "research" ? "research" : activeStudent?.selectedPersonaId === "industry" ? "industry" : null;
  const isSwitchingPath = Boolean(currentPath && selected && selected !== currentPath);
  const currentPathLabel = currentPath === "research" ? "Research" : "Industry";
  const selectedPathLabel = selected === "research" ? "Research" : "Industry";

  useEffect(() => {
    if (!user || user.role !== "student") navigate("/login/student");
  }, [navigate, user]);

  async function continueWithPath() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      if (studentId) {
        await updateStudentPersona(studentId, selected);
        if (isSwitchingPath) {
          await updateStudentSkills(studentId, { selectedPersonalSkillIds: [] });
        }
      }
      navigate('/student/skills', { state: { path: selected } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save your path.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="max-w-3xl w-full space-y-12"
      >
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-medium text-stone-800 dark:text-stone-100">Choose Your Path</h2>
          <p className="text-lg md:text-xl text-stone-500 dark:text-stone-400 italic">Tailor your Logos experience to your career goals.</p>
          {currentPath && (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {user?.name || "You"} currently has the <span className="font-medium text-stone-800 dark:text-stone-200">{currentPathLabel}</span> path selected.
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <button 
            onClick={() => setSelected('industry')}
            className={`text-left p-8 rounded-md border transition-all duration-500 ${selected === 'industry' ? 'border-stone-800 dark:border-stone-200 bg-stone-100 dark:bg-stone-800/40' : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-[#F9F8F6] dark:bg-[#1A1A1A]'}`}
          >
            <Building2 className={`w-8 h-8 mb-6 stroke-[1.5] transition-colors ${selected === 'industry' ? 'text-stone-800 dark:text-stone-200' : 'text-stone-400'}`} />
            <h3 className="text-2xl font-medium mb-3">Industry</h3>
            <p className="text-stone-500 dark:text-stone-400 mb-6 font-light leading-relaxed">Focus on practical applications and corporate skills. Build knowledge for the commercial sector.</p>
            <span className={`text-xs font-medium px-3 py-1.5 border rounded-full inline-block transition-colors ${selected === 'industry' ? 'border-stone-800 text-stone-800 dark:border-stone-200 dark:text-stone-200' : 'border-stone-300 text-stone-500 dark:border-stone-700 dark:text-stone-400'}`}>Professional Route</span>
          </button>

          <button 
            onClick={() => setSelected('research')}
            className={`text-left p-8 rounded-md border transition-all duration-500 ${selected === 'research' ? 'border-stone-800 dark:border-stone-200 bg-stone-100 dark:bg-stone-800/40' : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-[#F9F8F6] dark:bg-[#1A1A1A]'}`}
          >
            <FlaskConical className={`w-8 h-8 mb-6 stroke-[1.5] transition-colors ${selected === 'research' ? 'text-stone-800 dark:text-stone-200' : 'text-stone-400'}`} />
            <h3 className="text-2xl font-medium mb-3">Research</h3>
            <p className="text-stone-500 dark:text-stone-400 mb-6 font-light leading-relaxed">Focus on academic and exploratory skills. Dive deep into theoretical and scientific methodology.</p>
            <span className={`text-xs font-medium px-3 py-1.5 border rounded-full inline-block transition-colors ${selected === 'research' ? 'border-stone-800 text-stone-800 dark:border-stone-200 dark:text-stone-200' : 'border-stone-300 text-stone-500 dark:border-stone-700 dark:text-stone-400'}`}>Academic Route</span>
          </button>
        </div>

        {isSwitchingPath && (
          <div className="rounded-sm border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 px-5 py-4 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
            {user?.name || "This learner"} has already chosen the {currentPathLabel} path. To switch to {selectedPathLabel}, reset the personal skill selection and choose three {selectedPathLabel.toLowerCase()} skills next.
          </div>
        )}

        <div className="flex justify-center md:justify-end pt-8">
          {error && <p className="text-sm text-stone-500 italic mr-4 self-center">{error}</p>}
          <button
            disabled={!selected || saving || bootstrapLoading}
            onClick={continueWithPath}
            className="flex items-center gap-3 px-8 py-3 bg-stone-900 dark:bg-stone-100 text-[#F4F3F0] dark:text-stone-900 rounded-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-700 dark:hover:bg-white transition-all duration-300"
          >
            {saving ? "Saving..." : isSwitchingPath ? `Reset and switch to ${selectedPathLabel}` : "Continue"} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
