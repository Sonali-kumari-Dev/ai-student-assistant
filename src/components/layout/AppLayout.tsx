import React, { useState } from 'react';
import { Sidebar } from './Sidebar.js';
import { Navbar } from './Navbar.js';
import { ArrowLeft } from 'lucide-react';

interface AppLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  pageTitle: string;
  backAction?: {
    label: string;
    onBack: () => void;
  } | null;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentTab,
  onSelectTab,
  pageTitle,
  backAction,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          currentPageTitle={pageTitle}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {/* Contextual Back Navigation */}
          {backAction && (
            <div className="mb-4">
              <button
                onClick={backAction.onBack}
                className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 py-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{backAction.label}</span>
              </button>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
};
