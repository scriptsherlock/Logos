import { Link, useNavigate } from "react-router";
import { Plus, Users, AlertTriangle, BookOpen, ChevronRight, BarChart, ChevronDown, FileText, Send } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { getTeacherDashboard, sendClassFeedback } from "../../services/api";
import { useActiveUser } from "../../hooks/useActiveUser";
import type { TeacherDashboardResponse } from "../../services/types";

export function TeacherDashboard() {
  const [dashboard, setDashboard] = useState<TeacherDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | undefined>(undefined);
  const [expandedCriterionIds, setExpandedCriterionIds] = useState<Set<string>>(new Set());
  const [classFeedback, setClassFeedback] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const { user } = useActiveUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== "teacher") navigate("/login/teacher");
  }, [navigate, user]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getTeacherDashboard(selectedModuleId)
      .then((response) => {
        if (!active) return;
        setDashboard(response);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load teacher dashboard.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedModuleId]);

  const modules = dashboard?.modules || [];
  const overview = dashboard?.overview;
  const weakest = overview?.weakestCriterion || dashboard?.criterionStatuses.find((status) => status.status === "alert");

  function toggleCriterion(criterionId: string) {
    setExpandedCriterionIds((current) => {
      const next = new Set(current);
      if (next.has(criterionId)) next.delete(criterionId);
      else next.add(criterionId);
      return next;
    });
  }

  async function handleSendClassFeedback() {
    if (!classFeedback.trim() || !dashboard?.selectedModule) return;
    setFeedbackSending(true);
    setFeedbackError(null);
    try {
      await sendClassFeedback({
        moduleId: dashboard.selectedModule.id,
        message: classFeedback,
      });
      setFeedbackSent(true);
      setClassFeedback("");
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : "Unable to send class feedback.");
      setFeedbackSent(false);
    } finally {
      setFeedbackSending(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-stone-200 dark:border-stone-800 pb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-stone-800 dark:text-stone-100">Faculty Dashboard</h2>
            <p className="text-stone-500 dark:text-stone-400 mt-2 italic">Module overview and cohort analytics.</p>
          </div>
          <Link 
            to="/teacher/setup"
            className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 dark:bg-stone-100 text-[#F4F3F0] dark:text-stone-900 rounded-sm text-xs font-medium uppercase tracking-widest hover:bg-stone-700 dark:hover:bg-white transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Initialize Module
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <h3 className="text-sm uppercase tracking-widest font-medium text-stone-500">Active Curricula</h3>
            <div className="grid gap-4">
              {loading && (
                <div className="bg-[#F9F8F6] dark:bg-[#1A1A1A] p-6 rounded-sm border border-stone-200 dark:border-stone-800 text-stone-500 italic">
                  Loading modules...
                </div>
              )}
              {error && (
                <div className="bg-[#F9F8F6] dark:bg-[#1A1A1A] p-6 rounded-sm border border-stone-200 dark:border-stone-800 text-stone-500 italic">
                  {error}
                </div>
              )}
              {modules.map((m, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  key={m.id} 
                  onClick={() => setSelectedModuleId(m.id)}
                  className={`bg-[#F9F8F6] dark:bg-[#1A1A1A] p-6 rounded-sm border flex items-center justify-between hover:border-stone-400 dark:hover:border-stone-600 transition-colors cursor-pointer group ${dashboard?.selectedModule?.id === m.id ? "border-stone-500 dark:border-stone-500" : "border-stone-200 dark:border-stone-800"}`}
                >
                  <div className="flex items-center gap-6">
                    <div className="text-stone-300 dark:text-stone-700 group-hover:text-stone-800 dark:group-hover:text-stone-300 transition-colors">
                      <BookOpen className="w-8 h-8 stroke-[1]" />
                    </div>
                    <div>
                      <h4 className="font-medium text-lg text-stone-800 dark:text-stone-100">{m.name}</h4>
                      <div className="flex items-center gap-6 text-xs text-stone-500 mt-2 font-medium uppercase tracking-widest">
                        <span className="flex items-center gap-2"><Users className="w-3.5 h-3.5" /> {m.submittedStudentCount ?? m.studentCount ?? 0} students</span>
                        <span className="flex items-center gap-2"><BarChart className="w-3.5 h-3.5" /> Average: {m.averageScore || 0}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-stone-300 dark:text-stone-700 group-hover:text-stone-800 dark:group-hover:text-stone-200 transition-colors" />
                </motion.div>
              ))}
            </div>

            <div className="bg-[#F9F8F6] dark:bg-[#1A1A1A] p-6 rounded-sm border border-stone-200 dark:border-stone-800 space-y-5">
              <div className="flex items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
                <div>
                  <h3 className="text-sm uppercase tracking-widest font-medium text-stone-800 dark:text-stone-200">Rubric Drill-Down</h3>
                  <p className="text-xs text-stone-500 italic mt-2">{dashboard?.selectedModule?.name || "Select a module"}</p>
                </div>
              </div>
              <div className="grid gap-3">
                {(dashboard?.criterionStatuses || []).map((criterion) => {
                  const expanded = expandedCriterionIds.has(criterion.criterionId);
                  return (
                  <div key={criterion.criterionId} className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-stone-800 rounded-sm">
                    <button
                      type="button"
                      onClick={() => toggleCriterion(criterion.criterionId)}
                      className="w-full text-left p-4 flex items-start justify-between gap-4 hover:bg-stone-50 dark:hover:bg-stone-900/40 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-stone-800 dark:text-stone-200">{criterion.title}</p>
                        <p className="text-xs text-stone-500 mt-1">{criterion.affectedStudents} students below threshold - average {criterion.averageScore ?? "N/A"}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] uppercase tracking-widest text-stone-400">{criterion.status}</span>
                        {expanded ? <ChevronDown className="w-4 h-4 text-stone-400" /> : <ChevronRight className="w-4 h-4 text-stone-400" />}
                      </div>
                    </button>
                    {expanded && (
                      <div className="px-4 pb-4 space-y-4">
                        <div className="border-t border-stone-100 dark:border-stone-800 pt-4">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <p className="text-[10px] uppercase tracking-widest font-medium text-stone-500">Mitigation</p>
                            {criterion.mitigationSource && (
                              <span className="text-[10px] uppercase tracking-widest text-stone-400">{criterion.mitigationSource}</span>
                            )}
                          </div>
                          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">{criterion.mitigationStep}</p>
                        </div>

                        {criterion.students.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-[10px] uppercase tracking-widest font-medium text-stone-500">Students and Latest Attempts</p>
                            {criterion.students.map((student) => (
                              <div key={`${student.studentId}-${student.feedbackRecordId || criterion.criterionId}`} className="border border-stone-100 dark:border-stone-800 rounded-sm p-3 text-xs text-stone-500">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5 text-stone-400" />
                                    <span className="font-medium text-stone-700 dark:text-stone-300">{student.studentName}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-x-4 gap-y-1 uppercase tracking-widest text-[10px]">
                                    <span>Attempt {student.attemptNumber}</span>
                                    <span>Rubric {student.criterionScore}/100</span>
                                    <span>Overall {student.overallScore}/100</span>
                                  </div>
                                </div>
                                <p className="mt-2 leading-relaxed">{student.message}</p>
                                {student.createdAt && (
                                  <p className="mt-2 text-[10px] uppercase tracking-widest text-stone-400">
                                    Latest submission {new Date(student.createdAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-stone-500 italic">No analysed submissions for this rubric yet.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
                })}
                {!dashboard?.criterionStatuses?.length && (
                  <div className="text-sm text-stone-500 italic">Rubric details will appear after students submit work.</div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <h3 className="text-sm uppercase tracking-widest font-medium text-stone-500">Cohort Insights</h3>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-stone-100/50 dark:bg-stone-900/30 p-6 rounded-sm border border-stone-200 dark:border-stone-800 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-stone-800 dark:bg-stone-400"></div>
              
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-5 h-5 text-stone-800 dark:text-stone-400 shrink-0 mt-0.5 stroke-[1.5]" />
                <div>
                  <h4 className="text-sm font-medium text-stone-800 dark:text-stone-300 uppercase tracking-widest mb-3">Feedback Alert</h4>
                  <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-6 font-light">
                    {weakest
                      ? <>Analytics indicate <strong>{weakest.affectedStudents} students</strong> are missing the "{weakest.title}" benchmarks in <em>{dashboard?.selectedModule?.name}</em>.</>
                      : <>Analytics will identify the most common benchmark gaps once students submit work.</>}
                  </p>
                  
                  <div className="bg-white dark:bg-[#121212] p-5 rounded-sm border border-stone-200 dark:border-stone-800">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <h5 className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Suggested Mitigation</h5>
                      {weakest?.mitigationSource && (
                        <span className="text-[10px] uppercase tracking-widest text-stone-400">{weakest.mitigationSource}</span>
                      )}
                    </div>
                    <ul className="text-xs text-stone-600 dark:text-stone-400 space-y-3 font-light">
                      <li className="flex gap-2"><span className="text-stone-400">-</span> {weakest?.mitigationStep || "Review the selected module rubric with the cohort."}</li>
                      <li className="flex gap-2"><span className="text-stone-400">-</span> Provide a short targeted practice task before the next submission.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08, duration: 0.5 }}
              className="bg-[#F9F8F6] dark:bg-[#1A1A1A] p-6 rounded-sm border border-stone-200 dark:border-stone-800 space-y-4"
            >
              <div>
                <h4 className="text-sm font-medium text-stone-800 dark:text-stone-200 mb-2 uppercase tracking-widest">Send Feedback to Class</h4>
                <p className="text-xs text-stone-500 font-light leading-relaxed">
                  Share a short cohort note for {dashboard?.selectedModule?.name || "the selected module"}.
                </p>
              </div>
              <textarea
                value={classFeedback}
                onChange={(event) => {
                  setClassFeedback(event.target.value);
                  setFeedbackSent(false);
                  setFeedbackError(null);
                }}
                rows={5}
                className="w-full resize-none bg-white dark:bg-[#121212] border border-stone-200 dark:border-stone-800 rounded-sm p-3 text-sm text-stone-700 dark:text-stone-300 font-light leading-relaxed outline-none focus:border-stone-500 dark:focus:border-stone-500 transition-colors"
                placeholder="Write a concise class-wide feedback note..."
              />
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-stone-400 italic font-light">
                  {feedbackError || (feedbackSent ? "Feedback note sent." : "Keep it concise and actionable.")}
                </p>
                <button
                  type="button"
                  onClick={handleSendClassFeedback}
                  disabled={!classFeedback.trim() || !dashboard?.selectedModule || feedbackSending}
                  className="flex items-center gap-2 px-4 py-2 bg-stone-900 dark:bg-stone-100 text-[#F4F3F0] dark:text-stone-900 rounded-sm text-xs font-medium uppercase tracking-widest hover:bg-stone-700 dark:hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" /> {feedbackSending ? "Sending" : "Send"}
                </button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="bg-[#F9F8F6] dark:bg-[#1A1A1A] p-6 rounded-sm border border-stone-200 dark:border-stone-800 flex items-start gap-4"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-stone-800 dark:bg-stone-400 mt-2 shrink-0"></div>
              <div>
                <h4 className="text-sm font-medium text-stone-800 dark:text-stone-200 mb-2 uppercase tracking-widest">Growth Trend</h4>
                <p className="text-sm text-stone-500 font-light leading-relaxed">
                  {overview?.feedbackCount
                    ? `${overview.atRiskCount} students are currently below the support threshold across the latest analysed work.`
                    : "Growth trends will appear after student submissions are analysed."}
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
