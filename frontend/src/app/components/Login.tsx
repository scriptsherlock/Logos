import { FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowRight, GraduationCap, User } from "lucide-react";
import { motion } from "motion/react";
import { loginUser } from "../../services/api";
import { useActiveUser } from "../../hooks/useActiveUser";

export function Login() {
  const params = useParams();
  const role = params.role === "teacher" ? "teacher" : "student";
  const navigate = useNavigate();
  const { saveUser } = useActiveUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await loginUser({ role, name, email });
      saveUser(response.user);
      navigate(role === "student" ? "/student/progress" : "/teacher/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to continue.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-xl bg-[#F9F8F6] dark:bg-[#1A1A1A] border border-stone-200 dark:border-stone-800 rounded-sm p-8 md:p-10 space-y-8"
      >
        <div className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full border border-stone-200 dark:border-stone-800 flex items-center justify-center text-stone-500">
            {role === "student" ? <User className="w-5 h-5 stroke-[1.5]" /> : <GraduationCap className="w-5 h-5 stroke-[1.5]" />}
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-medium text-stone-800 dark:text-stone-100">{role === "student" ? "Student Login" : "Teacher Login"}</h2>
            <p className="text-stone-500 dark:text-stone-400 mt-2 italic">Create or reopen your Logos profile.</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-widest font-medium text-stone-500 mb-3">Name</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full p-4 border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#121212] focus:border-stone-800 dark:focus:border-stone-400 outline-none transition-all rounded-sm font-light text-stone-800 dark:text-stone-200"
              placeholder={role === "student" ? "Maya Evans" : "Dr Taylor"}
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest font-medium text-stone-500 mb-3">Email</label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              className="w-full p-4 border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#121212] focus:border-stone-800 dark:focus:border-stone-400 outline-none transition-all rounded-sm font-light text-stone-800 dark:text-stone-200"
              placeholder={role === "student" ? "student@example.com" : "teacher@example.com"}
            />
          </div>
          {error && <p className="text-sm text-stone-500 italic">{error}</p>}
        </div>

        <div className="flex justify-end">
          <button
            disabled={saving || !name.trim() || !email.trim()}
            className="flex items-center gap-3 px-8 py-3 bg-stone-900 dark:bg-stone-100 text-[#F4F3F0] dark:text-stone-900 rounded-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-700 dark:hover:bg-white transition-all duration-300"
          >
            {saving ? "Saving..." : "Continue"} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.form>
    </div>
  );
}
