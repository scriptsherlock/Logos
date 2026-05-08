import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, Send, Sparkles, CheckCircle2, ChevronRight, FileText } from "lucide-react";
import { analyseSubmission } from "../../services/api";
import { useBootstrap } from "../../hooks/useBootstrap";
import type { FeedbackRecord } from "../../services/types";

function feedbackToPanel(feedback: FeedbackRecord | null) {
  if (!feedback) return null;
  return {
    strengths: feedback.strengths?.length ? feedback.strengths : ["Clear problem statement"],
    weaknesses: feedback.gaps?.length
      ? feedback.gaps.map((gap) => gap.message)
      : ["No major weaknesses detected. Refine the work for precision."],
    hints: feedback.criteriaResults?.length
      ? feedback.criteriaResults.map((criterion) => criterion.nextStep || criterion.evidenceSummary).slice(0, 4)
      : [feedback.nextBestAction || "Incorporate these edits on the left and re-submit."],
  };
}

export function StudentWorkspace() {
  const { data, loading, error } = useBootstrap();
  const modules = data?.modules || [];
  const students = data?.students || [];
  const [module, setModule] = useState("");
  const [studentId, setStudentId] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<ReturnType<typeof feedbackToPanel>>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!module && modules[0]) setModule(modules[0].id);
    if (!studentId && students[0]) setStudentId(students[0].id);
  }, [module, modules, studentId, students]);

  const selectedModule = useMemo(() => modules.find((item) => item.id === module), [module, modules]);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitted(true);
    setIsAnalyzing(true);
    setSubmitError(null);

    try {
      const result = await analyseSubmission({
        studentId,
        moduleId: module,
        workText: content,
      });
      setScore(result.feedbackRecord.overallScore);
      setFeedback(feedbackToPanel(result.feedbackRecord));
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unable to analyse this submission.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleResubmit = async () => {
    await handleSubmit();
  };

  return (
    <div className="flex-1 flex overflow-hidden p-4 md:p-8">
      <div className="w-full max-w-7xl mx-auto flex gap-6 relative h-full">
        
        {/* Main Work Area */}
        <motion.div 
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`flex flex-col bg-[#F9F8F6] dark:bg-[#1A1A1A] border border-stone-200 dark:border-stone-800 rounded-sm shadow-sm overflow-hidden flex-1 ${isSubmitted ? 'w-1/2' : 'w-full max-w-4xl mx-auto'}`}
          style={{ maxWidth: isSubmitted ? '50%' : '56rem' }}
        >
          <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-white/50 dark:bg-black/20">
            <select 
              value={module}
              onChange={(e) => setModule(e.target.value)}
              className="bg-transparent font-medium text-lg outline-none focus:ring-0 rounded-none p-1 text-stone-800 dark:text-stone-200 cursor-pointer"
              disabled={loading || !modules.length}
            >
              {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            
            {!isSubmitted && (
              <button className="flex items-center gap-2 text-xs uppercase tracking-widest font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors">
                <Upload className="w-3.5 h-3.5" /> Upload File
              </button>
            )}
          </div>
          
          <div className="flex-1 p-6 md:p-8 flex flex-col relative bg-white dark:bg-[#121212]">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={selectedModule?.sampleWork || "Paste your work here or start typing..."}
              className="flex-1 w-full resize-none bg-transparent outline-none text-stone-800 dark:text-stone-200 leading-relaxed font-light"
            />
            {(error || submitError) && (
              <p className="mt-4 text-sm text-stone-500 dark:text-stone-400 italic">{error || submitError}</p>
            )}
          </div>
          
          <div className="p-4 border-t border-stone-200 dark:border-stone-800 flex justify-end bg-white/50 dark:bg-black/20">
            {isSubmitted ? (
              <button
                onClick={handleResubmit}
                disabled={isAnalyzing}
                className="flex items-center gap-3 px-6 py-2.5 border border-stone-300 dark:border-stone-700 bg-[#F4F3F0] hover:bg-stone-200 dark:bg-[#1A1A1A] dark:hover:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-sm font-medium transition-all duration-300 disabled:opacity-50 text-sm"
              >
                {isAnalyzing ? (
                  <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}><Sparkles className="w-4 h-4" /></motion.div> Analyzing...</>
                ) : (
                  <><Send className="w-4 h-4" /> Re-submit Changes</>
                )}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || loading || !module || !studentId || isAnalyzing}
                className="flex items-center gap-2 px-8 py-3 bg-stone-900 dark:bg-stone-100 text-[#F4F3F0] dark:text-stone-900 rounded-sm font-medium transition-all duration-300 disabled:opacity-30 hover:bg-stone-700 dark:hover:bg-white text-sm"
              >
                Submit for Analysis <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Analysis Pane */}
        <AnimatePresence>
          {isSubmitted && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
              className="flex-1 w-1/2 flex flex-col bg-[#F9F8F6] dark:bg-[#1A1A1A] border border-stone-200 dark:border-stone-800 rounded-sm shadow-sm overflow-hidden"
            >
              <div className="p-5 border-b border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-black/20 flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-stone-500" />
                <h3 className="font-medium text-lg">AI Feedback</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10">
                {isAnalyzing && !feedback ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-6 text-stone-500 font-light">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }}>
                      <Sparkles className="w-6 h-6 text-stone-400" />
                    </motion.div>
                    <p className="italic">Evaluating against module rubrics...</p>
                  </div>
                ) : feedback ? (
                  <>
                    <div className="flex items-center justify-between pb-8 border-b border-stone-200 dark:border-stone-800">
                      <div>
                        <h4 className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">Overall Assessment</h4>
                        <p className="text-5xl font-medium text-stone-900 dark:text-stone-100 font-serif tracking-tighter">
                          {score}<span className="text-2xl text-stone-400 font-light">/100</span>
                        </p>
                      </div>
                      <div className="w-20 h-20 rounded-full border border-stone-200 dark:border-stone-700 flex items-center justify-center relative bg-white dark:bg-[#121212]">
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                          <circle className="text-stone-800 dark:text-stone-300 stroke-current transition-all duration-1000 ease-out" strokeWidth="2" strokeDasharray={`${score * 2} 200`} fill="transparent" r="31" cx="40" cy="40" />
                        </svg>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div>
                        <h4 className="flex items-center gap-3 text-sm font-medium text-stone-800 dark:text-stone-200 mb-4 uppercase tracking-widest">
                          <CheckCircle2 className="w-4 h-4 text-stone-400" /> Strengths
                        </h4>
                        <ul className="space-y-3">
                          {feedback.strengths.map((s: string, i: number) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-stone-600 dark:text-stone-400 font-light">
                              <span className="w-1 h-1 rounded-full bg-stone-400 mt-2 shrink-0" /> {s}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="flex items-center gap-3 text-sm font-medium text-stone-800 dark:text-stone-200 mb-4 uppercase tracking-widest">
                          <FileText className="w-4 h-4 text-stone-400" /> Areas to Refine
                        </h4>
                        <ul className="space-y-3">
                          {feedback.weaknesses.map((w: string, i: number) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-stone-600 dark:text-stone-400 font-light">
                              <span className="w-1 h-1 rounded-full bg-stone-800 dark:bg-stone-300 mt-2 shrink-0" /> {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="pt-8 border-t border-stone-200 dark:border-stone-800">
                        <h4 className="text-sm font-medium mb-4 flex items-center gap-3 uppercase tracking-widest">
                          <Sparkles className="w-4 h-4 text-stone-400" /> Editorial Guidance
                        </h4>
                        <div className="space-y-4">
                          {feedback.hints.map((h: string, i: number) => (
                            <div key={i} className="p-5 bg-white dark:bg-[#121212] border border-stone-200 dark:border-stone-800 rounded-sm text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-light italic">
                              "{h}"
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-stone-400 mt-6 text-center italic font-light">Incorporate these edits on the left and re-submit.</p>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
