import { useEffect } from "react";
import { Routes, Route, useNavigate, useLocation, Location } from "react-router-dom";
import LoginPage from "./components/auth/LoginPage";
import NotFound from "./views/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import { ConfigProvider } from "./contexts/ConfigContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Header from "./components/Header";
import Sidebar from "./components/navigation/Sidebar";
import BottomNav from "./components/navigation/BottomNav";
import FAB, { SmartFAB } from "./components/FAB";
import HistoryView from "./views/HistoryView";
import HistoryList from "./components/history/HistoryList";
import GoalsSection from "./components/goals/GoalsSection";
import EntryView from "./views/EntryView";
import StatisticsView from "./components/stats/StatisticsView";
import SettingsView from "./views/SettingsView";
import GoalsView from "./views/GoalsView";
import { ToastProvider } from "./components/ui/ToastProvider";
import AchievementsView from "./views/AchievementsView";
import LandingPage from "./views/LandingPage";
import AboutPage from "./views/AboutPage";
import GalleryView from "./views/GalleryView";
import UiDemo from "./views/UiDemo";
import { useMoodData } from "./hooks/useMoodData";
import { useGroups } from "./hooks/useGroups";
import { useStatistics } from "./hooks/useStatistics";
import OfflineIndicator from "./components/ui/OfflineIndicator";
import { MoodDefinitionsProvider } from "./contexts/MoodDefinitionsContext";
import ReminderManager from "./components/reminders/ReminderManager";
import { LockProvider } from "./contexts/LockContext";
import LockScreen from "./components/auth/LockScreen";
import "./App.css";

import { useOfflineSync } from './hooks/useOfflineSync';
import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/ui/PageTransition';
import useHotkeys from './hooks/useHotkeys';
import { HistoryEntry } from './types/entry';

// ========== Types ==========

interface LocationState {
  mood?: number;
  entry?: HistoryEntry;
  targetDate?: string;
}

// ========== Components ==========

const SyncManager = () => {
  useOfflineSync();
  return null;
};

const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation() as Location<LocationState>;

  // Custom hooks
  const { pastEntries, setPastEntries, loading: historyLoading, error: historyError, refreshHistory } = useMoodData();
  const { groups, createGroup, createGroupOption, moveGroupOption } = useGroups();
  const { statistics, currentStreak, loading: statsLoading, error: statsError, loadStatistics } = useStatistics();

  // Hotkeys
  useHotkeys('c', () => navigate('entry'));
  useHotkeys('cmd+k', () => {
    navigate('/dashboard');
  });
  useHotkeys('g', () => navigate('goals'));

  const handleMoodSelect = (moodValue: number) => {
    navigate('entry', { state: { mood: moodValue } });
  };

  const handleBackToHistory = () => {
    navigate('/dashboard');
  };

  const handleEntrySubmitted = () => {
    navigate('/dashboard');
    refreshHistory();
  };

  const handleEntryDeleted = (deletedEntryId: number) => {
    // Remove the deleted entry from the local state
    setPastEntries(prev => prev.filter(entry => entry.id !== deletedEntryId));
  };

  const handleStartEdit = (entry: HistoryEntry) => {
    navigate('entry', { state: { entry: entry, mood: entry.mood } });
  };

  const handleEditMoodSelect = (moodValue: number) => {
    navigate('.', { state: { ...location.state, mood: moodValue }, replace: true });
  };

  const handleEntryUpdated = (updatedEntry: HistoryEntry) => {
    setPastEntries(prev => prev.map(entry => (
      entry.id === updatedEntry.id ? { ...entry, ...updatedEntry } : entry
    )));
    navigate('/dashboard');
    refreshHistory();
  };

  // Handler for clicking an empty day in the calendar - create entry for that date
  const handleCalendarDayClick = (dateString: string) => {
    navigate('entry', { state: { targetDate: dateString } });
  };

  // Helper to get state from location
  const locationState = location.state || {};
  const { mood: selectedMood, entry: editingEntry, targetDate } = locationState;

  // Determine if we are in entry view for layout purposes (no sidebar)
  const isEntryView = location.pathname.endsWith('/entry');

  useEffect(() => {
    const handler = () => {
      if (!location.pathname.startsWith('/dashboard')) {
        navigate('/dashboard');
        return;
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('twilightio:new-entry', handler);
    return () => window.removeEventListener('twilightio:new-entry', handler);
  }, [location.pathname, navigate]);

  return (
    <>
      <div className={`app-page ${isEntryView ? 'no-sidebar' : ''}`}>
        <Sidebar
          onLoadStatistics={loadStatistics}
        />

        <div className="app-shell">
          <Header currentStreak={currentStreak} />

          <div className="app-layout">

            <main className="app-main">
              <AnimatePresence mode="wait">
                <Routes key={location.pathname}>
                  <Route index element={
                    <PageTransition>
                      <HistoryView
                        pastEntries={pastEntries}
                        loading={historyLoading}
                        error={historyError}
                        onMoodSelect={handleMoodSelect}
                        onDelete={handleEntryDeleted}
                        onEdit={handleStartEdit}
                        renderOnlyHeader={true}
                      />
                    </PageTransition>
                  } />
                  <Route path="entry" element={
                    <PageTransition>
                      <EntryView
                        selectedMood={selectedMood}
                        groups={groups}
                        onBack={handleBackToHistory}
                        onCreateGroup={createGroup}
                        onCreateOption={createGroupOption}
                        onMoveOption={moveGroupOption}
                        onEntrySubmitted={handleEntrySubmitted}
                        editingEntry={editingEntry}
                        onEntryUpdated={handleEntryUpdated}
                        onEditMoodSelect={handleEditMoodSelect}
                        onSelectMood={handleMoodSelect}
                        targetDate={targetDate}
                      />
                    </PageTransition>
                  } />
                  <Route path="stats" element={
                    <PageTransition>
                      <StatisticsView
                        statistics={statistics}
                        pastEntries={pastEntries}
                        loading={statsLoading}
                        error={statsError}
                        onDayClick={handleCalendarDayClick}
                        onEntryClick={handleStartEdit}
                      />
                    </PageTransition>
                  } />
                  <Route path="achievements" element={<PageTransition><AchievementsView /></PageTransition>} />
                  <Route path="goals" element={<PageTransition><GoalsView /></PageTransition>} />
                  <Route path="gallery" element={<PageTransition><GalleryView onEntryClick={handleStartEdit} /></PageTransition>} />
                  <Route path="settings" element={<PageTransition><SettingsView /></PageTransition>} />
                  <Route path="ui-demo" element={<PageTransition><UiDemo /></PageTransition>} />
                </Routes>
              </AnimatePresence>
            </main>

            <Routes>
              <Route index element={
                <>
                  <section className="app-wide" aria-label="Goals section">
                    <GoalsSection onNavigateToGoals={() => navigate('goals')} />
                  </section>
                  <section className="app-wide" aria-label="History entries">
                    <h2 style={{ margin: '0 0 var(--space-1) 0', paddingLeft: 'calc(var(--space-1) / 2)', paddingTop: 0, paddingBottom: 'calc(var(--space-1) / 2)', color: 'var(--text)' }}>History</h2>
                    <HistoryList
                      entries={pastEntries}
                      loading={historyLoading}
                      error={historyError}
                      onDelete={handleEntryDeleted}
                      onEdit={handleStartEdit}
                    />
                  </section>
                </>
              } />
            </Routes>
          </div>
        </div>
      </div>

      <BottomNav
        onLoadStatistics={loadStatistics}
      />

      <SmartFAB
        onCreateEntry={() => {
          if (location.pathname === '/dashboard' || location.pathname === '/dashboard/') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            navigate('/dashboard');
          }
        }}
        onCreateEntryForDate={() => {
          navigate('/dashboard');
        }}
      />
    </>
  );
};

function App() {
  return (
    <ConfigProvider>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <LockProvider>
              <MoodDefinitionsProvider>
                <SyncManager />
                <ReminderManager />
                <LockScreen />
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route
                    path="/dashboard/*"
                    element={
                      <ProtectedRoute>
                        <AppContent />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </MoodDefinitionsProvider>
            </LockProvider>
          </AuthProvider>
        </ToastProvider>
        <OfflineIndicator />
      </ThemeProvider>
    </ConfigProvider>
  );
}

export default App;
