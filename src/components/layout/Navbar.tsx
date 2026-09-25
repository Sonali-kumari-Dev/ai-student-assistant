import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { Sun, Moon, LogOut, Menu, User as UserIcon, GraduationCap, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  onMenuClick: () => void;
  currentPageTitle: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick, currentPageTitle }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between transition-colors">
      {/* Left: Mobile hamburger & Contextual Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            {currentPageTitle}
          </span>
          <span className="hidden sm:inline-block text-slate-300 dark:text-slate-700">|</span>
          <span className="hidden sm:inline-block text-xs font-mono text-slate-500 dark:text-slate-400">
            Fall 2026 Academic Term
          </span>
        </div>
      </div>

      {/* Right: Actions, Theme Switcher & User Profile */}
      <div className="flex items-center gap-3">
        {/* Role Pill */}
        {user && (
          <span
            className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
              user.role === 'teacher'
                ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/60'
                : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60'
            }`}
          >
            {user.role === 'teacher' ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5" /> Faculty
              </>
            ) : (
              <>
                <GraduationCap className="w-3.5 h-3.5" /> Roll {user.rollNumber || 'Student'}
              </>
            )}
          </span>
        )}

        {/* Global Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>

        {/* User Badge / Logout */}
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="hidden lg:block text-right">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                {user.name}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                {user.role === 'teacher' ? user.designation || 'Instructor' : user.course || 'Student'}
              </p>
            </div>

            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold text-xs">
              {user.name.charAt(0).toUpperCase()}
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-1"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
