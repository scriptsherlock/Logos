import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { motion } from 'motion/react';
import { TrendingUp, Award, Clock, FileText } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useBootstrap } from '../../hooks/useBootstrap';
import { useActiveUser } from '../../hooks/useActiveUser';
import { getStudentGrowth } from '../../services/api';
import type { BelongingnessInsight, GrowthProfile } from '../../services/types';

function buildLineData(profile: GrowthProfile | null, selectedSkill: string) {
  const events = [...(profile?.recentGrowthEvents || [])].reverse();
  const skills = Array.from(new Set(events.map((event) => event.skillName || event.skillId)));
  if (!events.length) {
    return {
      data: [{ name: "Start", Growth: 0 }],
      skills,
    };
  }

  const activeSkill = selectedSkill || skills[0] || "";
  let running = 0;
  const data = [{ name: "Start", Growth: 0 }];

  events.forEach((event, index) => {
    const skillName = event.skillName || event.skillId;
    if (skillName === activeSkill) {
      running += Math.max(event.changeAmount, 0);
    }
    data.push({
      name: `Event ${index + 1}`,
      Growth: running,
    });
  });

  return {
    data: data.slice(-8),
    skills,
  };
}

function buildRadarData(skills: GrowthProfile["groups"]["core"]) {
  if (!skills.length) {
    return [
      { subject: 'Crit. Thinking', A: 0, fullMark: 100 },
      { subject: 'Data Analysis', A: 0, fullMark: 100 },
      { subject: 'Sci. Writing', A: 0, fullMark: 100 },
      { subject: 'Prob. Solving', A: 0, fullMark: 100 },
      { subject: 'Communication', A: 0, fullMark: 100 },
    ];
  }
  return skills.map((state) => ({
    subject: (state.skill?.name || state.skillId).replace('Technical understanding', 'Technical').slice(0, 16),
    A: Math.round(state.current),
    fullMark: 100,
  }));
}

function generateBelongingnessMessage(profile: GrowthProfile | null): BelongingnessInsight {
  const coreSkills = profile?.groups.core || [];
  const personalSkills = profile?.groups.path || [];
  const allSkills = [
    ...coreSkills.map((state) => ({ ...state, type: "core" as const })),
    ...personalSkills.map((state) => ({ ...state, type: "personal" as const })),
  ];
  const improvedSkills = allSkills
    .filter((state) => state.growth > 0)
    .sort((a, b) => b.growth - a.growth)
    .slice(0, 2)
    .map((state) => ({
      skillId: state.skillId,
      skillName: state.skill?.name || state.skillId,
      improvement: Math.round(state.growth),
      type: state.type,
    }));
  const recentGrowthEventCount = profile?.recentGrowthEvents?.length || 0;
  const skillToKeepPracticing = allSkills.slice().sort((a, b) => a.current - b.current)[0];
  const latestModuleName = profile?.recentFeedback?.[0]?.moduleName;

  if (!profile || (!recentGrowthEventCount && !improvedSkills.length)) {
    return {
      headline: "Your growth pattern will become clearer soon.",
      message: "For now, focus on one visible improvement per revision: clearer evidence, a better explanation, or a more readable section.",
      mostImprovedSkills: [],
      recentGrowthEventCount,
      skillToKeepPracticing: skillToKeepPracticing
        ? {
            skillId: skillToKeepPracticing.skillId,
            skillName: skillToKeepPracticing.skill?.name || skillToKeepPracticing.skillId,
            reason: "This is a useful next focus for your next submission.",
          }
        : undefined,
      latestModuleName,
    };
  }

  const improvedNames = improvedSkills.map((skill) => skill.skillName);
  const practiceName = skillToKeepPracticing?.skill?.name || skillToKeepPracticing?.skillId || "";
  const modulePhrase = latestModuleName ? ` in ${latestModuleName}` : "";

  return {
    headline: "You are building momentum.",
    message: `Across your recent sessions${modulePhrase}, your strongest growth has been in ${improvedNames.join(" and ")}. ${practiceName ? `${practiceName} is still developing, giving you a clear next focus for the next submission.` : "Your revisions are strengthening how you reason, explain, and support your ideas."}`,
    mostImprovedSkills: improvedSkills,
    recentGrowthEventCount,
    skillToKeepPracticing: skillToKeepPracticing
      ? {
          skillId: skillToKeepPracticing.skillId,
          skillName: practiceName,
          reason: "This is a useful next focus for your next submission.",
        }
      : undefined,
    latestModuleName,
  };
}

export function StudentProgress() {
  const { loading: bootstrapLoading, error: bootstrapError } = useBootstrap();
  const { studentId, user } = useActiveUser();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<GrowthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skillTab, setSkillTab] = useState<"core" | "personal">("core");
  const [trajectorySkill, setTrajectorySkill] = useState("");
  useEffect(() => {
    if (!user || user.role !== "student") navigate("/login/student");
  }, [navigate, user]);

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
        setError(err instanceof Error ? err.message : "Unable to load growth data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [studentId]);

  const trajectorySkills = useMemo(() => Array.from(new Set((profile?.recentGrowthEvents || []).map((event) => event.skillName || event.skillId))), [profile]);
  useEffect(() => {
    if (!trajectorySkill && trajectorySkills[0]) setTrajectorySkill(trajectorySkills[0]);
  }, [trajectorySkill, trajectorySkills]);

  const lineChart = useMemo(() => buildLineData(profile, trajectorySkill), [profile, trajectorySkill]);
  const allSkills = [...(profile?.groups.core || []), ...(profile?.groups.path || [])];
  const displayedSkills = skillTab === "core" ? profile?.groups.core || [] : profile?.groups.path || [];
  const radarData = useMemo(() => buildRadarData(displayedSkills.slice(0, 5)), [displayedSkills]);
  const highestSkill = allSkills.slice().sort((a, b) => b.current - a.current)[0];
  const mostImproved = allSkills.slice().sort((a, b) => b.growth - a.growth)[0];
  const weakestSkill = displayedSkills.slice().sort((a, b) => a.current - b.current)[0];
  const totalGrowth = profile?.summary.totalGrowth || 0;
  const recentSubmissions = profile?.recentFeedback || [];
  const recentGrowthEvents = profile?.recentGrowthEvents || [];
  const learningReflection = useMemo(() => generateBelongingnessMessage(profile), [profile]);
  const isLoading = bootstrapLoading || loading;
  const activeTabLabel = skillTab === "core" ? "Core" : "Personal";

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(340px,520px)] gap-6 border-b border-stone-200 dark:border-stone-800 pb-6">
          <div className="flex flex-col justify-between gap-5">
            <div>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-stone-800 dark:text-stone-100">Growth Dashboard</h2>
            <p className="text-stone-500 dark:text-stone-400 mt-2 italic">Track your selected skills across all modules.</p>
            </div>
            <div className="w-fit px-4 py-2 bg-stone-100 text-stone-800 dark:bg-stone-900 dark:text-stone-300 rounded-sm text-xs uppercase tracking-widest font-medium flex items-center gap-3 border border-stone-200 dark:border-stone-800">
              <TrendingUp className="w-3.5 h-3.5" /> +{totalGrowth}% Overall Growth
            </div>
            {(bootstrapError || error) && <p className="text-sm text-stone-500 dark:text-stone-400 mt-3 italic">{bootstrapError || error}</p>}
          </div>
          <div className="bg-[#F9F8F6] dark:bg-[#1A1A1A] border border-stone-200 dark:border-stone-800 rounded-sm p-5 space-y-3 self-start">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-medium text-stone-500">Your Learning Reflection</p>
                <p className="text-sm font-medium text-stone-800 dark:text-stone-200 mt-2">{isLoading ? "Reading your recent growth pattern..." : learningReflection.headline}</p>
              </div>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed font-light">{learningReflection.message}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <div className="bg-[#F9F8F6] dark:bg-[#1A1A1A] p-6 rounded-sm border border-stone-200 dark:border-stone-800 flex items-center gap-5 min-h-28">
            <div className="text-stone-400">
              <Award className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-500 font-medium mb-1">Highest Skill</p>
              <p className="text-xl font-medium">{isLoading ? 'Loading...' : highestSkill?.skill?.name || 'No data yet'}</p>
            </div>
          </div>
          <div className="bg-[#F9F8F6] dark:bg-[#1A1A1A] p-6 rounded-sm border border-stone-200 dark:border-stone-800 flex items-center gap-5 min-h-28">
            <div className="text-stone-400">
              <TrendingUp className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-500 font-medium mb-1">Most Improved</p>
              <p className="text-xl font-medium">{isLoading ? 'Loading...' : mostImproved?.skill?.name || 'No data yet'}</p>
            </div>
          </div>
          <div className="bg-[#F9F8F6] dark:bg-[#1A1A1A] p-6 rounded-sm border border-stone-200 dark:border-stone-800 flex items-center gap-5 min-h-28">
            <div className="text-stone-400">
              <Clock className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-500 font-medium mb-1">Time Engaged</p>
              <p className="text-xl font-medium">{recentSubmissions.length} submissions</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-7">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-[#F9F8F6] dark:bg-[#1A1A1A] p-8 rounded-sm border border-stone-200 dark:border-stone-800"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 border-b border-stone-200 dark:border-stone-800 pb-4">
              <h3 className="text-sm uppercase tracking-widest font-medium text-stone-800 dark:text-stone-200">Skill Trajectory</h3>
              <select
                value={trajectorySkill}
                onChange={(event) => setTrajectorySkill(event.target.value)}
                disabled={!trajectorySkills.length}
                className="bg-white/70 dark:bg-[#121212] border border-stone-200 dark:border-stone-800 rounded-sm px-3 py-2 text-xs uppercase tracking-widest text-stone-600 dark:text-stone-300 outline-none disabled:opacity-40"
              >
                {trajectorySkills.length ? trajectorySkills.map((skill) => (
                  <option key={skill} value={skill}>{skill}</option>
                )) : (
                  <option value="">No growth events</option>
                )}
              </select>
            </div>
            <div className="h-80 w-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChart.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} stroke="#a8a29e" />
                  <XAxis dataKey="name" stroke="#78716c" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#78716c" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #44403c', borderRadius: '4px', color: '#f5f5f4', fontSize: '12px' }} 
                  />
                  <Line
                    type="monotone"
                    dataKey="Growth"
                    stroke="#44403c"
                    strokeWidth={1.5}
                    dot={{ r: 3, fill: '#44403c' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-[#F9F8F6] dark:bg-[#1A1A1A] p-8 rounded-sm border border-stone-200 dark:border-stone-800"
          >
            <div className="flex items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4 mb-8">
              <div>
                <h3 className="text-sm uppercase tracking-widest font-medium text-stone-800 dark:text-stone-200">Current Profile</h3>
                <p className="text-xs text-stone-500 italic mt-2">{activeTabLabel} skills view</p>
              </div>
              <div className="flex items-center border border-stone-200 dark:border-stone-800 rounded-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => setSkillTab("core")}
                  className={`px-4 py-2 text-xs uppercase tracking-widest transition-colors ${skillTab === "core" ? "bg-stone-900 text-[#F4F3F0] dark:bg-stone-100 dark:text-stone-900" : "text-stone-500 hover:bg-white dark:hover:bg-[#121212]"}`}
                >
                  Core
                </button>
                <button
                  type="button"
                  onClick={() => setSkillTab("personal")}
                  className={`px-4 py-2 text-xs uppercase tracking-widest transition-colors ${skillTab === "personal" ? "bg-stone-900 text-[#F4F3F0] dark:bg-stone-100 dark:text-stone-900" : "text-stone-500 hover:bg-white dark:hover:bg-[#121212]"}`}
                >
                  Personal
                </button>
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#a8a29e" opacity={0.3} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#78716c', fontSize: 10, textAnchor: 'middle' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Student" dataKey="A" stroke="#292524" strokeWidth={1} fill="#78716c" fillOpacity={0.15} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #44403c', borderRadius: '4px', color: '#f5f5f4', fontSize: '12px' }} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-xs uppercase tracking-widest font-medium text-stone-500">Selected {activeTabLabel} Skills</p>
                <p className="text-xs text-stone-400 italic">
                  {weakestSkill ? `Weakest: ${weakestSkill.skill?.name || weakestSkill.skillId}` : "No skills selected yet"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {displayedSkills.length ? displayedSkills.map((state) => (
                  <span key={state.skillId} className="px-3 py-1.5 border border-stone-200 dark:border-stone-800 rounded-sm text-xs text-stone-600 dark:text-stone-400 bg-white/50 dark:bg-[#121212]/50">
                    {state.skill?.name || state.skillId}
                  </span>
                )) : (
                  <span className="text-sm text-stone-500 italic">Choose personal skills during setup to populate this view.</span>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="bg-[#F9F8F6] dark:bg-[#1A1A1A] p-8 rounded-sm border border-stone-200 dark:border-stone-800"
        >
          <div className="flex items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4 mb-6">
            <div>
              <h3 className="text-sm uppercase tracking-widest font-medium text-stone-800 dark:text-stone-200">Recent Submissions</h3>
              <p className="text-xs text-stone-500 italic mt-2">Your latest analysed work and attempts.</p>
            </div>
            <FileText className="w-5 h-5 text-stone-400 stroke-[1.5]" />
          </div>

          <div className="grid gap-3">
            {recentSubmissions.length ? recentSubmissions.map((submission) => (
              <div key={submission.id} className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-stone-800 rounded-sm p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="font-medium text-stone-800 dark:text-stone-200">{submission.moduleName || submission.moduleId}</p>
                  <p className="text-sm text-stone-500 dark:text-stone-400 font-light mt-1 line-clamp-2">{submission.summary || "Feedback generated for this attempt."}</p>
                  <p className="text-[10px] uppercase tracking-widest text-stone-400 mt-3">
                    Attempt {submission.attemptNumber}
                    {submission.createdAt ? ` · ${new Date(submission.createdAt).toLocaleDateString()}` : ""}
                  </p>
                </div>
                <div className="text-left md:text-right shrink-0">
                  <p className="text-[10px] uppercase tracking-widest text-stone-500 font-medium mb-1">Score</p>
                  <p className="text-2xl font-medium text-stone-900 dark:text-stone-100">{submission.overallScore}<span className="text-sm text-stone-400">/100</span></p>
                </div>
              </div>
            )) : (
              <div className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-stone-800 rounded-sm p-6 text-sm text-stone-500 italic">
                Submitted work will appear here after you analyse an assignment.
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-[#F9F8F6] dark:bg-[#1A1A1A] p-8 rounded-sm border border-stone-200 dark:border-stone-800"
        >
          <div className="flex items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4 mb-6">
            <div>
              <h3 className="text-sm uppercase tracking-widest font-medium text-stone-800 dark:text-stone-200">Skill Growth Events</h3>
              <p className="text-xs text-stone-500 italic mt-2">Credits earned from meaningful rubric improvement.</p>
            </div>
            <TrendingUp className="w-5 h-5 text-stone-400 stroke-[1.5]" />
          </div>

          <div className="grid gap-3">
            {recentGrowthEvents.length ? recentGrowthEvents.map((event) => (
              <div key={event.id} className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-stone-800 rounded-sm p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="font-medium text-stone-800 dark:text-stone-200">{event.skillName || event.skillId}</p>
                  <p className="text-sm text-stone-500 dark:text-stone-400 font-light mt-1">{event.evidenceSummary}</p>
                  <p className="text-[10px] uppercase tracking-widest text-stone-400 mt-3">
                    {event.rubricName || "Rubric improvement"}
                    {event.createdAt ? ` · ${new Date(event.createdAt).toLocaleDateString()}` : ""}
                  </p>
                </div>
                <div className="text-left md:text-right shrink-0">
                  <p className="text-[10px] uppercase tracking-widest text-stone-500 font-medium mb-1">Growth</p>
                  <p className="text-2xl font-medium text-stone-900 dark:text-stone-100">+{event.changeAmount}</p>
                </div>
              </div>
            )) : (
              <div className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-stone-800 rounded-sm p-6 text-sm text-stone-500 italic">
                Growth credits appear after a rubric improves by at least 10 percentage points and reaches 60%.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
