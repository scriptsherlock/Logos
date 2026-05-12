import { useLocation, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import { useBootstrap } from "../../hooks/useBootstrap";
import { updateStudentSkills } from "../../services/api";
import { useActiveUser } from "../../hooks/useActiveUser";

export function StudentSkills() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data, loading: bootstrapLoading, error: bootstrapError } = useBootstrap();
  const { studentId, user } = useActiveUser();
  const activeStudent = data?.students?.find((student) => student.id === studentId);
  const savedProfile = data?.studentProfiles?.find((item) => item.studentId === studentId);
  const derivedPath = activeStudent?.selectedPersonaId === "research" ? "research" : "industry";
  const path = location.state?.path || derivedPath;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const commonSkills = (data?.skills || []).filter((skill) => skill.category === "core_stem").slice(0, 5);
  const specializedSkills = (data?.skills || []).filter((skill) => skill.category === "path_specific" && skill.path === path);
  const specializedSkillIds = new Set(specializedSkills.map((skill) => skill.id));
  const savedPersonalSkillIds = savedProfile?.selectedPersonalSkillIds || [];
  const savedSkillsFromAnotherPath = savedPersonalSkillIds.some((skillId) => !specializedSkillIds.has(skillId));

  useEffect(() => {
    if (!user || user.role !== "student") navigate("/login/student");
  }, [navigate, user]);

  useEffect(() => {
    setSelected(savedPersonalSkillIds.filter((skillId) => specializedSkillIds.has(skillId)).slice(0, 3));
  }, [path, data?.skills, savedProfile?.selectedPersonalSkillIds]);

  const toggleSkill = (skillId: string) => {
    if (selected.includes(skillId)) {
      setSelected(selected.filter(s => s !== skillId));
    } else {
      if (selected.length < 3) {
        setSelected([...selected, skillId]);
      }
    }
  };

  async function completeSetup() {
    if (!studentId || selected.length !== 3) return;
    setLoading(true);
    setError(null);
    try {
      await updateStudentSkills(studentId, { selectedPersonalSkillIds: selected });
      navigate("/student/progress");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save selected skills.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center py-12 px-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="max-w-4xl w-full space-y-16"
      >
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-medium text-stone-800 dark:text-stone-100">Personalize Your Growth</h2>
          <p className="text-lg text-stone-500 dark:text-stone-400 italic">We establish core STEM foundations and let you pick your specialized focus.</p>
          {(bootstrapError || error) && <p className="text-sm text-stone-500 italic">{bootstrapError || error}</p>}
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
            <h3 className="text-xl font-medium">Core STEM Skills</h3>
            <span className="text-xs uppercase tracking-widest text-stone-400 font-medium">Foundation</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {(bootstrapLoading ? [] : commonSkills).map(skill => (
              <div
                key={skill.id}
                className="px-5 py-3 rounded-md border border-stone-200 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-900/50 text-stone-700 dark:text-stone-300 text-sm font-medium flex items-center gap-2"
              >
                <Check className="w-3.5 h-3.5 text-stone-400" />
                {skill.name}
              </div>
            ))}
            {bootstrapLoading && <div className="text-sm text-stone-500 italic">Loading skills...</div>}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
            <div>
              <h3 className="text-xl font-medium capitalize">{path} Specialized Skills</h3>
              <p className="text-sm text-stone-500 italic mt-1">Select 3 additional personal skills to track through your work.</p>
              {savedSkillsFromAnotherPath && (
                <p className="text-sm text-stone-600 dark:text-stone-300 mt-3">
                  Your previous personal skills belonged to another path. Choose three {path} skills to reset this part of your journey.
                </p>
              )}
            </div>
            <span className="text-xs uppercase tracking-widest text-stone-400 font-medium bg-stone-100 dark:bg-stone-900 px-3 py-1 rounded-sm">
              {selected.length} / 3
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {specializedSkills.map(skill => (
              <button
                key={skill.id}
                onClick={() => toggleSkill(skill.id)}
                className={`p-6 rounded-md border text-left transition-all duration-300 flex flex-col justify-between min-h-[100px]
                  ${selected.includes(skill.id) 
                    ? 'border-stone-800 dark:border-stone-300 bg-stone-100 dark:bg-stone-800/40 text-stone-900 dark:text-white' 
                    : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-[#F9F8F6] dark:bg-[#1A1A1A] text-stone-600 dark:text-stone-400'
                  }
                  ${!selected.includes(skill.id) && selected.length >= 3 ? 'opacity-40 cursor-not-allowed hover:border-stone-200 dark:hover:border-stone-800' : ''}
                `}
              >
                <span className="text-sm font-medium leading-tight">{skill.name}</span>
                <div className={`mt-4 w-5 h-5 rounded-full border flex items-center justify-center transition-colors
                  ${selected.includes(skill.id) ? 'border-stone-800 dark:border-stone-300 bg-stone-800 dark:bg-stone-300 text-white dark:text-stone-900' : 'border-stone-300 dark:border-stone-700'}
                `}>
                  {selected.includes(skill.id) && <Check className="w-3 h-3" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-center md:justify-end pt-8">
          <button
            disabled={selected.length !== 3}
            onClick={completeSetup}
            className="flex items-center gap-3 px-8 py-3 bg-stone-900 dark:bg-stone-100 text-[#F4F3F0] dark:text-stone-900 rounded-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-700 dark:hover:bg-white transition-all duration-300"
          >
            Complete Setup <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
