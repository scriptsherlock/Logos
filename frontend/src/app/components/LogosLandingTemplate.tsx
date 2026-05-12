import { Link } from "react-router";
import { ArrowRight, Bot, BookOpenCheck, Network, Route, Sparkles } from "lucide-react";
import { motion } from "motion/react";

const storyNodes = [
  {
    title: "Teacher rubrics",
    detail: "Criteria set the target.",
    className: "left-1/2 top-0 -translate-x-1/2",
    animate: { y: [0, -8, 0] },
    delay: 0,
  },
  {
    title: "AI feedback",
    detail: "Suggestions from your work.",
    className: "right-0 top-1/2 -translate-y-1/2",
    animate: { x: [0, 8, 0] },
    delay: 0.2,
  },
  {
    title: "Career skills",
    detail: "Growth follows your path.",
    className: "left-1/2 bottom-0 -translate-x-1/2",
    animate: { y: [0, 8, 0] },
    delay: 0.4,
  },
  {
    title: "Answer with Logos",
    detail: "Guidance, not shortcuts.",
    className: "left-0 top-1/2 -translate-y-1/2",
    animate: { x: [0, -8, 0] },
    delay: 0.6,
  },
];

const productCards = [
  {
    number: "01",
    title: "Teacher-student collaboration",
    body: "Students are assessed against rubrics their teachers actually set. When many students miss the same criterion, the teacher dashboard surfaces that pattern early.",
    label: "Rubric loop",
    icon: BookOpenCheck,
  },
  {
    number: "02",
    title: "Personalised AI feedback",
    body: "Logos reads the student's own work and turns feedback into specific revision moves, not generic advice.",
    label: "Feedback from evidence",
    icon: Sparkles,
  },
  {
    number: "03",
    title: "Career-specific skill growth",
    body: "Every learner can track the skills that matter for their path. Your Logos reflects the skills you want to grow.",
    label: "Your Logos, your path",
    icon: Route,
  },
  {
    number: "04",
    title: "Answer with Logos",
    body: "AI does not write the answer. It gives rubric-aware suggestions so students learn the reason behind the next revision.",
    label: "Learn the reason",
    icon: Bot,
  },
];

export function LogosLandingTemplate() {
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="max-w-6xl mx-auto space-y-14"
      >
        <section className="grid lg:grid-cols-[minmax(0,1fr)_520px] gap-10 lg:gap-14 items-center border-b border-stone-200 dark:border-stone-800 pb-12">
          <div className="space-y-8">
            <div className="space-y-5">
              <p className="text-[10px] uppercase tracking-[0.22em] font-medium text-stone-500">A personal Logos for your STEM path</p>
              <h2 className="max-w-4xl text-4xl md:text-6xl font-medium tracking-tight leading-[1.06] text-stone-900 dark:text-stone-100">
                Feedback that connects <span className="text-stone-600 dark:text-amber-200">teacher rubrics</span>,{" "}
                <span className="text-stone-600 dark:text-amber-200">AI guidance</span>, and the{" "}
                <span className="text-stone-600 dark:text-amber-200">skills</span> that shape your future.
              </h2>
              <p className="max-w-3xl text-lg md:text-xl text-stone-600 dark:text-stone-400 leading-relaxed font-light">
                Logos helps students revise with evidence, gives teachers an early view of class-wide struggle points, and turns repeated attempts into visible growth across the skills each learner chooses to develop.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/intro"
                className="inline-flex items-center justify-center gap-3 px-7 py-3 bg-stone-900 dark:bg-stone-100 text-[#F4F3F0] dark:text-stone-900 rounded-sm text-xs uppercase tracking-widest font-medium hover:bg-stone-700 dark:hover:bg-white transition-colors"
              >
                Start journey <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-[#F9F8F6] dark:bg-[#1A1A1A] border border-stone-200 dark:border-stone-800 rounded-sm p-6">
            <div className="flex items-center gap-3 border-b border-stone-200 dark:border-stone-800 pb-4 mb-6">
              <Network className="w-4 h-4 text-stone-400" />
              <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-stone-500">How Logos connects the journey</p>
            </div>
            <div className="relative h-[420px] max-w-[420px] mx-auto">
              <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 420 420" aria-hidden="true">
                {[
                  "M210 112 L210 146",
                  "M308 210 L278 210",
                  "M210 308 L210 274",
                  "M112 210 L142 210",
                ].map((path, index) => (
                  <motion.path
                    key={path}
                    d={path}
                    fill="none"
                    className="stroke-stone-300 dark:stroke-stone-700"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    animate={{ opacity: [0.45, 0.9, 0.45] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: index * 0.2 }}
                  />
                ))}
              </svg>
              <motion.div
                className="absolute left-1/2 top-1/2 size-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-stone-900 dark:bg-stone-100 text-[#F4F3F0] dark:text-stone-900 flex items-center justify-center text-center text-2xl leading-tight font-medium shadow-sm"
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              >
                Student<br />work
              </motion.div>
              {storyNodes.map((node) => (
                <motion.div
                  key={node.title}
                  className={`absolute ${node.className} w-28 h-28 rounded-full border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#121212] flex flex-col items-center justify-center text-center px-4 shadow-sm`}
                  animate={{ ...node.animate, borderColor: ["rgb(231 229 228)", "rgb(168 162 158)", "rgb(231 229 228)"] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: node.delay }}
                >
                  <p className="text-sm font-medium leading-tight text-stone-800 dark:text-stone-200">{node.title}</p>
                  <p className="mt-1 text-[11px] leading-snug text-stone-500 dark:text-stone-400">{node.detail}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          {productCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="bg-[#F9F8F6] dark:bg-[#1A1A1A] border border-stone-200 dark:border-stone-800 rounded-sm p-6 md:p-7">
                <div className="flex items-start gap-5">
                  <div className="flex flex-col items-center gap-4 text-stone-400 shrink-0">
                    <span className="text-[10px] uppercase tracking-widest font-medium">{card.number}</span>
                    <Icon className="w-5 h-5 stroke-[1.5]" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-medium tracking-tight text-stone-900 dark:text-stone-100">{card.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400 font-light">{card.body}</p>
                    <div className="mt-5 inline-flex px-3 py-1.5 border border-stone-200 dark:border-stone-800 rounded-sm text-[10px] uppercase tracking-widest text-stone-500 bg-white/60 dark:bg-[#121212]/60">
                      {card.label}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </motion.div>
    </div>
  );
}
