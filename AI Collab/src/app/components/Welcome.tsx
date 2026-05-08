import { Link } from "react-router";
import { User, GraduationCap } from "lucide-react";
import { motion } from "motion/react";

export function Welcome() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="max-w-2xl w-full text-center space-y-16"
      >
        <div className="space-y-4">
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-stone-800 dark:text-stone-100">Welcome to Logos</h2>
          <p className="text-xl md:text-2xl text-stone-500 dark:text-stone-400 italic font-light">Are you a student or a teacher?</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-lg mx-auto">
          <Link to="/student/path" className="group relative flex flex-col items-center p-10 rounded-md border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-500 bg-[#F9F8F6] dark:bg-[#1A1A1A] transition-all duration-500">
            <div className="mb-6 transform group-hover:scale-110 transition-transform duration-500 text-stone-700 dark:text-stone-300">
              <User className="w-10 h-10 stroke-[1.5]" />
            </div>
            <h3 className="text-xl font-medium mb-2">Student</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 text-center font-light leading-relaxed">Improve your skills and track your growth through guided analysis.</p>
          </Link>

          <Link to="/teacher/setup" className="group relative flex flex-col items-center p-10 rounded-md border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-500 bg-[#F9F8F6] dark:bg-[#1A1A1A] transition-all duration-500">
            <div className="mb-6 transform group-hover:scale-110 transition-transform duration-500 text-stone-700 dark:text-stone-300">
              <GraduationCap className="w-10 h-10 stroke-[1.5]" />
            </div>
            <h3 className="text-xl font-medium mb-2">Teacher</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 text-center font-light leading-relaxed">Manage modules, define rubrics, and view overall class feedback.</p>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
