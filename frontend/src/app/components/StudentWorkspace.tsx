import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, Send, Sparkles, ChevronRight, FileText, LockKeyhole } from "lucide-react";
import { useNavigate } from "react-router";
import { analyseSubmission } from "../../services/api";
import { extractTextFromFile } from "../../services/fileText";
import { useBootstrap } from "../../hooks/useBootstrap";
import { useActiveUser } from "../../hooks/useActiveUser";
import type { AnalyseSubmissionResponse } from "../../services/types";

export function StudentWorkspace() {
  const { data, loading, error } = useBootstrap();
  const { studentId, user } = useActiveUser();
  const navigate = useNavigate();
  const modules = data?.modules || [];
  const [module, setModule] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<AnalyseSubmissionResponse | null>(null);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [openHints, setOpenHints] = useState<Record<string, boolean>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!module && modules[0]) setModule(modules[0].id);
  }, [module, modules]);

  useEffect(() => {
    if (!user || user.role !== "student") navigate("/login/student");
  }, [navigate, user]);

  useEffect(() => {
    setFeedback(null);
    setSessionId(undefined);
    setOpenHints({});
    setIsSubmitted(false);
  }, [module, studentId]);

  const selectedModule = useMemo(() => modules.find((item) => item.id === module), [module, modules]);
  const score = feedback?.overallScore ?? feedback?.feedbackRecord?.overallScore ?? 0;
  const hasRubricFeedback = Boolean(feedback?.rubricFeedback?.length);

  const handleSubmit = async () => {
    if (!content.trim() || !studentId) return;

    setIsSubmitted(true);
    setIsAnalyzing(true);
    setSubmitError(null);

    try {
      const result = await analyseSubmission({
        studentId,
        moduleId: module,
        workText: content,
        sessionId,
      });
      setFeedback(result);
      setSessionId(result.sessionId);
    } catch (err) {
      const apiError = err as Error & { status?: number; code?: string; providerStatus?: number };
      if (apiError.status === 503 || apiError.code === "ai_grading_unavailable") {
        setSubmitError(apiError.message || "AI grading is unavailable right now. Please try again shortly.");
      } else {
        setSubmitError(err instanceof Error ? err.message : "Unable to analyse this submission.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleResubmit = async () => {
    await handleSubmit();
  };

  async function handleFileUpload(file: File | null) {
    if (!file) return;
    setSubmitError(null);
    try {
      const text = await extractTextFromFile(file);
      setContent(text);
      setFeedback(null);
      setIsSubmitted(false);
      setOpenHints({});
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Unable to read that file. Try .txt, .md, .csv, .json, .html, .docx, .pptx, .xlsx, or paste the text directly. PDFs must contain selectable text."
      );
    }
  }

  return (
    <div className="h-full min-h-0 overflow-hidden p-4 md:p-8">
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-4 md:gap-6 relative h-full min-h-0 overflow-hidden">
        <motion.div
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`min-h-0 flex flex-col bg-[#F9F8F6] dark:bg-[#1A1A1A] border border-stone-200 dark:border-stone-800 rounded-sm shadow-sm overflow-hidden flex-1 ${isSubmitted ? "h-[42%] md:h-full md:w-1/2 md:max-w-none" : "h-full w-full max-w-4xl mx-auto"}`}
          style={{ maxWidth: isSubmitted ? undefined : "56rem" }}
        >
          <div className="shrink-0 p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-white/50 dark:bg-black/20">
            <select
              value={module}
              onChange={(e) => setModule(e.target.value)}
              className="bg-transparent font-medium text-lg outline-none focus:ring-0 rounded-none p-1 text-stone-800 dark:text-stone-200 cursor-pointer"
              disabled={loading || !modules.length}
            >
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            {!isSubmitted && (
              <label className="flex items-center gap-2 text-xs uppercase tracking-widest font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".txt,.md,.markdown,.csv,.tsv,.json,.jsonl,.html,.htm,.xml,.docx,.pptx,.xlsx,.pdf,.js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.cs,.r,.sql,.yaml,.yml,.log,text/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="sr-only"
                  onChange={(event) => handleFileUpload(event.target.files?.[0] || null)}
                />
                <Upload className="w-3.5 h-3.5" /> Upload File
              </label>
            )}
          </div>

          <div className="min-h-0 flex-1 p-6 md:p-8 flex flex-col relative bg-white dark:bg-[#121212] overflow-auto">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={selectedModule?.sampleWork || "Paste your work here or start typing..."}
              className="min-h-0 flex-1 w-full resize-none overflow-y-auto bg-transparent outline-none text-stone-800 dark:text-stone-200 leading-relaxed font-light"
            />
            {(error || submitError) && (
              <div className="mt-4 border border-stone-200 dark:border-stone-800 bg-[#F9F8F6] dark:bg-[#1A1A1A] px-4 py-3 text-sm text-stone-600 dark:text-stone-300 italic">
                {error || submitError}
              </div>
            )}
          </div>

          <div className="shrink-0 sticky bottom-0 p-4 border-t border-stone-200 dark:border-stone-800 flex justify-end bg-white/80 dark:bg-black/40 backdrop-blur-sm">
            {isSubmitted ? (
              <button
                onClick={handleResubmit}
                disabled={isAnalyzing}
                className="flex items-center gap-3 px-6 py-2.5 border border-stone-300 dark:border-stone-700 bg-[#F4F3F0] hover:bg-stone-200 dark:bg-[#1A1A1A] dark:hover:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-sm font-medium transition-all duration-300 disabled:opacity-50 text-sm"
              >
                {isAnalyzing ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                      <Sparkles className="w-4 h-4" />
                    </motion.div>{" "}
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Re-submit Changes
                  </>
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

        <AnimatePresence>
          {isSubmitted && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
              className="min-h-0 flex-1 h-[58%] md:h-full md:w-1/2 flex flex-col bg-[#F9F8F6] dark:bg-[#1A1A1A] border border-stone-200 dark:border-stone-800 rounded-sm shadow-sm overflow-hidden"
            >
              <div className="shrink-0 p-5 border-b border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-black/20 flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-stone-500" />
                <h3 className="font-medium text-lg">AI Feedback</h3>
              </div>

              <div className="min-h-0 flex-1 flex flex-col overflow-hidden">
                {isAnalyzing && !feedback ? (
                  <div className="min-h-0 flex-1 flex flex-col items-center justify-center p-6 md:p-8 space-y-6 text-stone-500 font-light">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }}>
                      <Sparkles className="w-6 h-6 text-stone-400" />
                    </motion.div>
                    <p className="italic">Evaluating against module rubrics...</p>
                  </div>
                ) : feedback ? (
                  <>
                    <div className="shrink-0 sticky top-0 z-10 p-6 md:p-8 pb-5 border-b border-stone-200 dark:border-stone-800 bg-[#F9F8F6]/95 dark:bg-[#1A1A1A]/95 backdrop-blur-sm space-y-4">
                      <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Score</p>
                      <p className="text-5xl font-medium text-stone-900 dark:text-stone-100 font-serif tracking-tighter">
                        {score}
                        <span className="text-2xl text-stone-400 font-light">/100</span>
                      </p>
                      <p className="text-sm text-stone-600 dark:text-stone-400 font-light italic leading-relaxed">{feedback.summary}</p>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                      {hasRubricFeedback ? (
                      <div className="space-y-5">
                        <h4 className="flex items-center gap-3 text-sm font-medium text-stone-800 dark:text-stone-200 uppercase tracking-widest">
                          <FileText className="w-4 h-4 text-stone-400" /> Rubrics
                        </h4>
                        {feedback.rubricFeedback.map((rubric) => {
                          const hintOpen = openHints[rubric.rubricId];
                          const unlocked = rubric.answerWithLogos?.unlocked;
                          return (
                            <div key={rubric.rubricId} className="p-5 bg-white dark:bg-[#121212] border border-stone-200 dark:border-stone-800 rounded-sm space-y-5">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="font-medium text-stone-800 dark:text-stone-200">{rubric.rubricName}</p>
                                  <p className="text-xs text-stone-400 mt-1 font-light">{rubric.evidenceSummary}</p>
                                </div>
                                <p className="text-sm font-medium text-stone-800 dark:text-stone-200 shrink-0">{rubric.score}/100</p>
                              </div>

                              <div className="space-y-4">
                                <div>
                                  <p className="text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-2">What's good</p>
                                  <p className="text-sm text-stone-600 dark:text-stone-400 font-light leading-relaxed">{rubric.whatsGood}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-2">What's missing</p>
                                  <p className="text-sm text-stone-600 dark:text-stone-400 font-light leading-relaxed">{rubric.whatsMissing}</p>
                                </div>
                              </div>

                              <div className="pt-2">
                                <button
                                  type="button"
                                  disabled={!unlocked}
                                  onClick={() => setOpenHints((current) => ({ ...current, [rubric.rubricId]: !current[rubric.rubricId] }))}
                                  className="flex items-center gap-2 px-4 py-2 border border-stone-300 dark:border-stone-700 rounded-sm text-xs uppercase tracking-widest font-medium text-stone-700 dark:text-stone-300 hover:border-stone-500 dark:hover:border-stone-500 transition-colors disabled:opacity-45 disabled:cursor-not-allowed bg-transparent"
                                >
                                  {unlocked ? <Sparkles className="w-3.5 h-3.5" /> : <LockKeyhole className="w-3.5 h-3.5" />}
                                  Answer with Logos
                                </button>
                                {!unlocked && rubric.answerWithLogos?.lockedReason && (
                                  <p className="text-xs text-stone-400 mt-3 font-light italic">{rubric.answerWithLogos.lockedReason}</p>
                                )}
                                {unlocked && hintOpen && rubric.answerWithLogos?.hint && (
                                  <div className="mt-4 p-4 bg-[#F9F8F6] dark:bg-[#1A1A1A] border border-stone-200 dark:border-stone-800 rounded-sm text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-light italic">
                                    {rubric.answerWithLogos.hint.split(/\n\n+/).map((part) => (
                                      <p key={part} className="mb-3 last:mb-0 whitespace-pre-line">{part}</p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {(feedback.genericFeedback?.strengths || feedback.feedbackRecord.strengths || []).map((strength, index) => (
                          <div key={index} className="p-5 bg-white dark:bg-[#121212] border border-stone-200 dark:border-stone-800 rounded-sm text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-light">
                            {strength}
                          </div>
                        ))}
                        {(feedback.genericFeedback?.gaps || feedback.feedbackRecord.gaps || []).map((gap) => (
                          <div key={gap.criterionId} className="p-5 bg-white dark:bg-[#121212] border border-stone-200 dark:border-stone-800 rounded-sm text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-light">
                            {gap.message}
                          </div>
                        ))}
                      </div>
                    )}

                    {feedback.skillGrowthEvents?.length > 0 && (
                      <p className="text-xs text-stone-400 text-center italic font-light">
                        {feedback.skillGrowthEvents.map((event) => `${event.skillName || event.skillId} +${event.changeAmount}`).join(" · ")}
                      </p>
                    )}
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
