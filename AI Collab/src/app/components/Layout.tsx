import { Outlet, Link, useLocation } from "react-router";
import { Moon, Sun, Menu, X, Home } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export function Layout() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMounted(true), []);

  const isTeacherRoute = location.pathname.startsWith('/teacher');
  const isStudentRoute = location.pathname.startsWith('/student');

  return (
    <div 
      className="min-h-screen bg-[#F4F3F0] dark:bg-[#121212] text-stone-900 dark:text-stone-100 transition-colors duration-500 flex flex-col font-light selection:bg-stone-300 dark:selection:bg-stone-700"
      style={{ fontFamily: '"Newsreader", serif' }}
    >
      <header className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-800/60 bg-[#F4F3F0]/90 dark:bg-[#121212]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
          <Link to="/" className="p-2 rounded-full hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors">
            <Home className="w-4 h-4" />
          </Link>
        </div>
        
        <h1 className="text-2xl font-medium tracking-tight absolute left-1/2 -translate-x-1/2">
          Logos <span className="hidden sm:inline text-sm font-light text-stone-500 dark:text-stone-400 italic">your stem companion</span>
        </h1>

        <div className="relative">
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-full hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          {menuOpen && (
            <div className="absolute right-0 mt-3 w-60 bg-[#F4F3F0] dark:bg-[#1A1A1A] border border-stone-200 dark:border-stone-800 rounded-md shadow-2xl overflow-hidden z-50">
              <div className="py-2 flex flex-col text-sm">
                <Link to="/" onClick={() => setMenuOpen(false)} className="px-5 py-3 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors">Home</Link>
                {isStudentRoute && (
                  <>
                    <Link to="/student/workspace" onClick={() => setMenuOpen(false)} className="px-5 py-3 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors">Workspace</Link>
                    <Link to="/student/progress" onClick={() => setMenuOpen(false)} className="px-5 py-3 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors">My Progress Dashboard</Link>
                  </>
                )}
                {isTeacherRoute && (
                  <>
                    <Link to="/teacher/dashboard" onClick={() => setMenuOpen(false)} className="px-5 py-3 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors">Dashboard</Link>
                    <Link to="/teacher/setup" onClick={() => setMenuOpen(false)} className="px-5 py-3 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors">New Module</Link>
                  </>
                )}
                {!isStudentRoute && !isTeacherRoute && (
                  <>
                    <div className="px-5 py-2 mt-2 text-[10px] font-medium text-stone-400 uppercase tracking-widest">Quick Links</div>
                    <Link to="/student/workspace" onClick={() => setMenuOpen(false)} className="px-5 py-3 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors">Demo Student View</Link>
                    <Link to="/teacher/dashboard" onClick={() => setMenuOpen(false)} className="px-5 py-3 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors">Demo Teacher View</Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
      
      <main className="flex-1 flex flex-col overflow-auto relative">
        <Outlet />
      </main>
    </div>
  );
}
