import React from 'react';
import { useTheme } from '../../context/ThemeContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Sun, Moon, Check, Shield, Laptop, Lock, RefreshCw } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Application Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure interface appearance, visual theme mode, and session preferences
        </p>
      </div>

      {/* Theme Selection Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Interface Theme Mode
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select your preferred visual style. The theme applies instantly across all sidebars, tables, modals, cards, and AI chat.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Light Mode Option */}
          <div
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
              theme === 'light'
                ? 'border-blue-600 bg-blue-50/30 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Light Mode</span>
              </div>
              {theme === 'light' && (
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </div>

            {/* Light preview box */}
            <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 space-y-1.5">
              <div className="h-2 w-16 bg-blue-600 rounded" />
              <div className="h-2 w-24 bg-slate-300 rounded" />
              <div className="h-4 w-full bg-white rounded border border-slate-200" />
            </div>
            <p className="text-[11px] text-slate-500 mt-3">
              Crisp white and navy aesthetic optimized for daytime study.
            </p>
          </div>

          {/* Dark Mode Option */}
          <div
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
              theme === 'dark'
                ? 'border-blue-500 bg-slate-800/60 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-100 font-semibold text-xs">
                <Moon className="w-4 h-4 text-blue-400" />
                <span>Dark Mode</span>
              </div>
              {theme === 'dark' && (
                <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </div>

            {/* Dark preview box */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="h-2 w-16 bg-blue-400 rounded" />
              <div className="h-2 w-24 bg-slate-700 rounded" />
              <div className="h-4 w-full bg-slate-900 rounded border border-slate-800" />
            </div>
            <p className="text-[11px] text-slate-400 mt-3">
              Deep navy and charcoal palette engineered for low-light focus.
            </p>
          </div>
        </div>

        <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
          Current Setting: <strong className="text-slate-900 dark:text-slate-100 capitalize">{theme} Mode</strong> (Saved in browser storage)
        </div>
      </div>

      {/* Security & System Info Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Academic Management Architecture
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-400 uppercase font-mono text-[10px] block">Database Persistence</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">MongoDB with Mongoose Schemas</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-400 uppercase font-mono text-[10px] block">AI Engine</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Google Gemini 3.8 Flash SDK</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-400 uppercase font-mono text-[10px] block">Authentication Guard</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">JWT Token + BCrypt Password Hashing</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-400 uppercase font-mono text-[10px] block">Current User Role</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{user?.role} Access</span>
          </div>
        </div>
      </div>
    </div>
  );
};
