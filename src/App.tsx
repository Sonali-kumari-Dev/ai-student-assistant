import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { LoginPage } from './pages/auth/LoginPage.js';
import { RegisterPage } from './pages/auth/RegisterPage.js';
import { AppLayout } from './components/layout/AppLayout.js';
import { StudentDashboard } from './pages/dashboard/StudentDashboard.js';
import { TeacherDashboard } from './pages/dashboard/TeacherDashboard.js';
import { SubjectsPage } from './pages/subjects/SubjectsPage.js';
import { SubjectDetailPage } from './pages/subjects/SubjectDetailPage.js';
import { StudentsDirectoryPage } from './pages/students/StudentsDirectoryPage.js';
import { AttendancePage } from './pages/attendance/AttendancePage.js';
import { AssignmentsPage } from './pages/assignments/AssignmentsPage.js';
import { AssignmentDetailPage } from './pages/assignments/AssignmentDetailPage.js';
import { SubmissionsReviewPage } from './pages/assignments/SubmissionsReviewPage.js';
import { MaterialsPage } from './pages/materials/MaterialsPage.js';
import { ExamsPage } from './pages/exams/ExamsPage.js';
import { PlannerPage } from './pages/planner/PlannerPage.js';
import { AnnouncementsPage } from './pages/announcements/AnnouncementsPage.js';
import { ProgressPage } from './pages/progress/ProgressPage.js';
import { AIAssistantPage } from './pages/ai/AIAssistantPage.js';
import { ProfilePage } from './pages/profile/ProfilePage.js';
import { SettingsPage } from './pages/settings/SettingsPage.js';
import { LoadingSpinner } from './components/common/LoadingSpinner.js';

interface NavigationState {
  tab: string;
  contextId?: string;
  subView?: string;
}

const MainAppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  const [navState, setNavState] = useState<NavigationState>(() => {
    // Read from window.location.hash if present
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const parts = hash.split('/');
      return { tab: parts[0] || 'dashboard', subView: parts[1], contextId: parts[2] };
    }
    return { tab: 'dashboard' };
  });

  // Keep URL hash in sync for browser back/forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const parts = hash.split('/');
        setNavState({ tab: parts[0] || 'dashboard', subView: parts[1], contextId: parts[2] });
      } else {
        setNavState({ tab: 'dashboard' });
      }
    };
    window.addEventListener('popstate', handleHashChange);
    return () => window.removeEventListener('popstate', handleHashChange);
  }, []);

  const navigateTo = (tab: string, subView?: string, contextId?: string) => {
    setNavState({ tab, subView, contextId });
    let newHash = tab;
    if (subView) newHash += `/${subView}`;
    if (contextId) newHash += `/${contextId}`;
    window.location.hash = newHash;
  };

  if (isLoading) {
    return <LoadingSpinner fullPage message="Connecting to AI-Integrated Academic System..." />;
  }

  if (!isAuthenticated) {
    if (authView === 'register') {
      return <RegisterPage onGoToLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onGoToRegister={() => setAuthView('register')} />;
  }

  // Titles mapping
  const titles: Record<string, string> = {
    dashboard: 'Academic Overview Dashboard',
    subjects: 'Courses & Curriculum',
    students: 'Student Roster Directory',
    attendance: 'Attendance Roll-Call & Records',
    assignments: 'Coursework & Assignments',
    materials: 'Notes & Study Materials',
    exams: 'Examination Timetable',
    planner: 'Academic Goal Planner',
    announcements: 'Course Announcements',
    progress: 'Progress & Analytics',
    'ai-assistant': 'AI Academic Assistant',
    profile: 'Profile & Identity',
    settings: 'System & Theme Settings',
  };

  let pageTitle = titles[navState.tab] || 'Academic Portal';
  let backAction: { label: string; onBack: () => void } | null = null;

  if (navState.tab === 'subjects' && navState.subView === 'detail') {
    pageTitle = 'Course Curriculum';
    backAction = {
      label: '← Back to Courses',
      onBack: () => navigateTo('subjects'),
    };
  } else if (navState.tab === 'assignments' && navState.subView === 'detail') {
    pageTitle = 'Assignment Submission';
    backAction = {
      label: '← Back to Assignments',
      onBack: () => navigateTo('assignments'),
    };
  } else if (navState.tab === 'assignments' && navState.subView === 'submissions') {
    pageTitle = 'Review Student Submissions';
    backAction = {
      label: '← Back to Assignments',
      onBack: () => navigateTo('assignments'),
    };
  }

  // Render view
  const renderCurrentView = () => {
    switch (navState.tab) {
      case 'dashboard':
        return user?.role === 'teacher' ? (
          <TeacherDashboard onNavigate={(tabId, contextId) => navigateTo(tabId, contextId ? 'detail' : undefined, contextId)} />
        ) : (
          <StudentDashboard onNavigate={(tabId) => navigateTo(tabId)} />
        );

      case 'subjects':
        if (navState.subView === 'detail' && navState.contextId) {
          return (
            <SubjectDetailPage
              subjectId={navState.contextId}
              onBack={() => navigateTo('subjects')}
              onNavigateToTab={(targetTab, cId) => navigateTo(targetTab, cId ? 'detail' : undefined, cId)}
            />
          );
        }
        return (
          <SubjectsPage
            onSelectSubject={(subjectId) => navigateTo('subjects', 'detail', subjectId)}
          />
        );

      case 'students':
        return <StudentsDirectoryPage />;

      case 'attendance':
        return <AttendancePage />;

      case 'assignments':
        if (navState.subView === 'detail' && navState.contextId) {
          return (
            <AssignmentDetailPage
              assignmentId={navState.contextId}
              onBack={() => navigateTo('assignments')}
            />
          );
        }
        if (navState.subView === 'submissions' && navState.contextId) {
          return (
            <SubmissionsReviewPage
              assignmentId={navState.contextId}
              onBack={() => navigateTo('assignments')}
            />
          );
        }
        return (
          <AssignmentsPage
            onSelectAssignment={(id) => navigateTo('assignments', 'detail', id)}
            onReviewSubmissions={(id) => navigateTo('assignments', 'submissions', id)}
          />
        );

      case 'materials':
        return <MaterialsPage />;

      case 'exams':
        return <ExamsPage />;

      case 'planner':
        return <PlannerPage />;

      case 'announcements':
        return <AnnouncementsPage />;

      case 'progress':
        return <ProgressPage />;

      case 'ai-assistant':
        return <AIAssistantPage />;

      case 'profile':
        return <ProfilePage />;

      case 'settings':
        return <SettingsPage />;

      default:
        return user?.role === 'teacher' ? (
          <TeacherDashboard onNavigate={(tabId) => navigateTo(tabId)} />
        ) : (
          <StudentDashboard onNavigate={(tabId) => navigateTo(tabId)} />
        );
    }
  };

  return (
    <AppLayout
      currentTab={navState.tab}
      onSelectTab={(tab) => navigateTo(tab)}
      pageTitle={pageTitle}
      backAction={backAction}
    >
      {renderCurrentView()}
    </AppLayout>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
