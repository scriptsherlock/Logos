import { useLocation, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import { useBootstrap } from "../../hooks/useBootstrap";
import { getStudentGrowth } from "../../services/api";
import type { GrowthProfile } from "../../services/types";

export function StudentSkills() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.state?.path || 'industry';
  const { data, loading: bootstrapLoading, error: bootstrapError } = useBootstrap();
  const [profile, setProfile] = useState<GrowthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const studentId = data?.students?.[0]?.id;

  useEffect(() => {
    if (!studentId) return;
    let active = true;
    setLoading(true);
    getStudentGrowth(studentId)
      .then((response) => {
        if (!active) return;
        setProfile(response);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load skills.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [studentId]);

  const commonSkills = (profile?.groups.core || []).slice(0, 5).map((state) => state.skill?.name || state.skillId);
  const specializedSkills = (profile?.groups.path || []).slice(0, 5).map((state) => state.skill?.name || state.skillId);

  const toggleSkill = (skill: string) => {
    if (selected.includes(skill)) {
      setSelected(selected.filter(s => s !== skill));
    } else {
      if (selected.length < 3) {
        setSelected([...selected, skill]);
      }
    }
  };

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
            {(bootstrapLoading || loading ? ["Loading skills..."] : commonSkills).map(skill => (
              <div
                key={skill}
                className="px-5 py-3 rounded-md border border-stone-200 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-900/50 text-stone-700 dark:text-stone-300 text-sm font-medium flex items-center gap-2"
              >
                <Check className="w-3.5 h-3.5 text-stone-400" />
                {skill}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
            <div>
              <h3 className="text-xl font-medium capitalize">{path} Specialized Skills</h3>
              <p className="text-sm text-stone-500 italic mt-1">Select 3 additional personal skills to track through your work.</p>
            </div>
            <span className="text-xs uppercase tracking-widest text-stone-400 font-medium bg-stone-100 dark:bg-stone-900 px-3 py-1 rounded-sm">
              {selected.length} / 3
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {specializedSkills.map(skill => (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`p-6 rounded-md border text-left transition-all duration-300 flex flex-col justify-between min-h-[100px]
                  ${selected.includes(skill) 
                    ? 'border-stone-800 dark:border-stone-300 bg-stone-100 dark:bg-stone-800/40 text-stone-900 dark:text-white' 
                    : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-[#F9F8F6] dark:bg-[#1A1A1A] text-stone-600 dark:text-stone-400'
                  }
                  ${!selected.includes(skill) && selected.length >= 3 ? 'opacity-40 cursor-not-allowed hover:border-stone-200 dark:hover:border-stone-800' : ''}
                `}
              >
                <span className="text-sm font-medium leading-tight">{skill}</span>
                <div className={`mt-4 w-5 h-5 rounded-full border flex items-center justify-center transition-colors
                  ${selected.includes(skill) ? 'border-stone-800 dark:border-stone-300 bg-stone-800 dark:bg-stone-300 text-white dark:text-stone-900' : 'border-stone-300 dark:border-stone-700'}
                `}>
                  {selected.includes(skill) && <Check className="w-3 h-3" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-center md:justify-end pt-8">
          <button
            disabled={selected.length !== 3}
            onClick={() => navigate('/student/workspace')}
            className="flex items-center gap-3 px-8 py-3 bg-stone-900 dark:bg-stone-100 text-[#F4F3F0] dark:text-stone-900 rounded-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-700 dark:hover:bg-white transition-all duration-300"
          >
            Complete Setup <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
