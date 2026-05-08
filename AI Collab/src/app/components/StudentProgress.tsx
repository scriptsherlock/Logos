import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { motion } from 'motion/react';
import { TrendingUp, Award, Clock } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useBootstrap } from '../../hooks/useBootstrap';
import { getStudentGrowth } from '../../services/api';
import type { GrowthProfile } from '../../services/types';

function buildLineData(profile: GrowthProfile | null) {
  const points = profile?.timeline?.length ? profile.timeline : [{ date: 'Start', value: 0 }];
  return points.slice(-5).map((point, index) => ({
    name: point.date === 'Start' ? 'Start' : `Week ${index + 1}`,
    'Critical Thinking': Math.min(100, point.value + (profile?.summary.coreAverage || 0)),
    'Data Analysis': Math.min(100, point.value + (profile?.summary.pathAverage || 0)),
    'Scientific Writing': Math.min(100, point.value + (profile?.summary.belongingnessAverage || 0)),
  }));
}

function buildRadarData(profile: GrowthProfile | null) {
  const skills = [...(profile?.groups.core || []), ...(profile?.groups.path || [])].slice(0, 5);
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

export function StudentProgress() {
  const { data, loading: bootstrapLoading, error: bootstrapError } = useBootstrap();
  const [profile, setProfile] = useState<GrowthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        setError(err instanceof Error ? err.message : "Unable to load growth data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [studentId]);

  const lineData = useMemo(() => buildLineData(profile), [profile]);
  const radarData = useMemo(() => buildRadarData(profile), [profile]);
  const allSkills = [...(profile?.groups.core || []), ...(profile?.groups.path || [])];
  const highestSkill = allSkills.slice().sort((a, b) => b.current - a.current)[0];
  const mostImproved = allSkills.slice().sort((a, b) => b.growth - a.growth)[0];
  const totalGrowth = profile?.summary.totalGrowth || 0;
  const isLoading = bootstrapLoading || loading;

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-stone-200 dark:border-stone-800 pb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-stone-800 dark:text-stone-100">Growth Dashboard</h2>
            <p className="text-stone-500 dark:text-stone-400 mt-2 italic">Track your selected skills across all modules.</p>
            {(bootstrapError || error) && <p className="text-sm text-stone-500 dark:text-stone-400 mt-3 italic">{bootstrapError || error}</p>}
          </div>
          <div className="px-4 py-2 bg-stone-100 text-stone-800 dark:bg-stone-900 dark:text-stone-300 rounded-sm text-xs uppercase tracking-widest font-medium flex items-center gap-3 border border-stone-200 dark:border-stone-800 self-start sm:self-auto">
            <TrendingUp className="w-3.5 h-3.5" /> +{totalGrowth}% Overall Growth
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-[#F9F8F6] dark:bg-[#1A1A1A] p-8 rounded-sm border border-stone-200 dark:border-stone-800 flex items-center gap-6">
            <div className="text-stone-400">
              <Award className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-500 font-medium mb-1">Highest Skill</p>
              <p className="text-xl font-medium">{isLoading ? 'Loading...' : highestSkill?.skill?.name || 'No data yet'}</p>
            </div>
          </div>
          <div className="bg-[#F9F8F6] dark:bg-[#1A1A1A] p-8 rounded-sm border border-stone-200 dark:border-stone-800 flex items-center gap-6">
            <div className="text-stone-400">
              <TrendingUp className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-500 font-medium mb-1">Most Improved</p>
              <p className="text-xl font-medium">{isLoading ? 'Loading...' : mostImproved?.skill?.name || 'No data yet'}</p>
            </div>
          </div>
          <div className="bg-[#F9F8F6] dark:bg-[#1A1A1A] p-8 rounded-sm border border-stone-200 dark:border-stone-800 flex items-center gap-6">
            <div className="text-stone-400">
              <Clock className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-500 font-medium mb-1">Time Engaged</p>
              <p className="text-xl font-medium">{profile?.timeline?.length || 0} submissions</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 pt-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-[#F9F8F6] dark:bg-[#1A1A1A] p-8 rounded-sm border border-stone-200 dark:border-stone-800"
          >
            <h3 className="text-sm uppercase tracking-widest font-medium mb-8 text-stone-800 dark:text-stone-200 border-b border-stone-200 dark:border-stone-800 pb-4">Skill Trajectory</h3>
            <div className="h-80 w-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} stroke="#a8a29e" />
                  <XAxis dataKey="name" stroke="#78716c" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#78716c" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #44403c', borderRadius: '4px', color: '#f5f5f4', fontSize: '12px' }} 
                  />
                  <Legend wrapperStyle={{ paddingTop: '30px', fontSize: '12px', color: '#78716c' }} iconType="circle" />
                  <Line type="monotone" dataKey="Critical Thinking" stroke="#78716c" strokeWidth={1.5} dot={{ r: 3, fill: '#78716c' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Data Analysis" stroke="#a8a29e" strokeWidth={1.5} dot={{ r: 3, fill: '#a8a29e' }} />
                  <Line type="monotone" dataKey="Scientific Writing" stroke="#d6d3d1" strokeWidth={1.5} dot={{ r: 3, fill: '#d6d3d1' }} />
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
            <h3 className="text-sm uppercase tracking-widest font-medium mb-8 text-stone-800 dark:text-stone-200 border-b border-stone-200 dark:border-stone-800 pb-4">Current Profile</h3>
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
          </motion.div>
        </div>
      </div>
    </div>
  );
}
