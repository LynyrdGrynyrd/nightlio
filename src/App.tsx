import { useCallback, useEffect, lazy, Suspense, useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Location, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import { AuthProvider } from './contexts/AuthContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Header from './components/Header';
import Sidebar from './components/navigation/Sidebar';
import BottomNav from './components/navigation/BottomNav';
import DesktopCommandPalette from './components/navigation/DesktopCommandPalette';
import { SmartFAB } from './components/FAB';
import DashboardHome from './components/dashboard/DashboardHome';
import { ToastProvider, useToast } from './components/ui/ToastProvider';
import { useMoodData } from './hooks/useMoodData';
import { useGroups } from './hooks/useGroups';
import { useStatistics } from './hooks/useStatistics';
import OfflineIndicator from './components/ui/OfflineIndicator';
import { MoodDefinitionsProvider } from './contexts/MoodDefinitionsContext';
import ReminderManager from './components/reminders/ReminderManager';
import { LockProvider } from './contexts/LockContext';
import LockScreen from './components/auth/LockScreen';
import { useOfflineSync } from './hooks/useOfflineSync';
import ErrorBoundary from './components/ErrorBoundary';
import PageTransition from './components/ui/PageTransition';
import useHotkeys from './hooks/useHotkeys';
import { HistoryEntry, EntryWithSelections } from './types/entry';
import { cn } from '@/lib/utils';
import PageShell from './components/layout/PageShell';
import { Button } from './components/ui/button';
import { getTodayISO } from './utils/dateUtils';
import { toNumber } from './utils/dashboardUtils';
import apiService from './services/api';

// Lazy-loaded heavy routes for reduced initial bundle
const EntryView = lazy(() => import('./views/EntryView'));
const JournalView = lazy(() => import('./views/JournalView'));
const DiscoverView = lazy(() => import('./views/DiscoverView'));
// Lazy-loaded routes for reduced initial bundle
const LoginPage = lazy(() => import('./components/auth/LoginPage'));
const NotFound = lazy(() => import('./views/NotFound'));
const SettingsView = lazy(() => import('./views/SettingsView'));
const AboutPage = lazy(() => import('./views/AboutPage'));
const UiDemo = lazy(() => import('./views/UiDemo'));
const MoodModelSandbox = lazy(() => import('./views/MoodModelSandbox'));
const ForgotPasswordPage = lazy(() => import('./components/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./components/auth/ResetPasswordPage'));

interface LocationState {
  mood?: number;
  entry?: HistoryEntry;
  targetDate?: string;
}


const SyncManager = () => {
  useOfflineSync();
  return null;
};

const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation() as Location<LocationState>;
  const { show } = useToast();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const { pastEntries, setPastEntries, loading: historyLoading, error: historyError, refreshHistory } = useMoodData();
  const { groups, createGroup, createGroupOption, moveGroupOption } = useGroups();
  const { statistics, currentStreak, loading: statsLoading, error: statsError, loadStatistics } = useStatistics();

  const openGlobalSearch = useCallback(() => {
    window.dispatchEvent(new Event('twilightio:open-search'));
  }, []);

  const completePriorityGoal = useCallback(async () => {
    const today = getTodayISO();

    try {
      const goals = await apiService.getGoals();
      const activeGoals = (goals || []).filter((goal) => !goal.is_archived);

      if (activeGoals.length === 0) {
        show('No active goals to complete yet.', 'info');
        navigate('/dashboard');
        return;
      }

      const candidates = activeGoals
        .map((goal) => {
          const resolvedTarget = Math.max(
            1,
            toNumber(goal.target_count) ?? toNumber(goal.frequency_per_week) ?? 1
          );
          const resolvedCompleted = Math.max(0, toNumber(goal.completed) ?? 0);
          const doneToday = goal.last_completed_date === today || goal.already_completed_today === true;
          const remaining = Math.max(0, resolvedTarget - resolvedCompleted);
          const progressRatio = resolvedTarget > 0 ? resolvedCompleted / resolvedTarget : 0;

          return {
            goal,
            remaining,
            progressRatio,
            doneToday,
          };
        })
        .filter((item) => !item.doneToday && item.remaining > 0)
        .sort((a, b) => {
          if (b.progressRatio !== a.progressRatio) {
            return b.progressRatio - a.progressRatio;
          }
          return a.remaining - b.remaining;
        });

      if (candidates.length === 0) {
        show('All active goals are already completed for today.', 'info');
        navigate('/dashboard');
        return;
      }

      const priorityGoal = candidates[0].goal;
      await apiService.toggleGoalCompletion(priorityGoal.id, today);
      show(`Marked ${priorityGoal.title} complete for today.`, 'success');
      navigate('/dashboard');
    } catch {
      show('Could not complete a goal right now.', 'error');
    }
  }, [navigate, show]);

  useHotkeys('c', () => navigate('/dashboard/entry'), [navigate]);
  useHotkeys('j', () => navigate('/dashboard/journal'), [navigate]);
  useHotkeys('d', () => navigate('/dashboard/discover'), [navigate]);
  useHotkeys('cmd+k', () => setIsCommandPaletteOpen((prev) => !prev));
  useHotkeys('ctrl+k', () => setIsCommandPaletteOpen((prev) => !prev));
  useHotkeys('shift+g', () => {
    void completePriorityGoal();
  }, [completePriorityGoal]);

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
    setPastEntries((prev) => prev.filter((entry) => entry.id !== deletedEntryId));
  };

  const handleStartEdit = (entry: HistoryEntry | EntryWithSelections) => {
    if (!entry.id || entry.mood === undefined) return;

    const fullEntry = entry as HistoryEntry;
    navigate('entry', { state: { entry: fullEntry, mood: fullEntry.mood } });
  };

  const handleEditById = (entryData: { id: number }) => {
    const entry = pastEntries.find((e) => e.id === entryData.id);
    if (entry) handleStartEdit(entry);
  };

  const handleEditMoodSelect = (moodValue: number) => {
    navigate('.', { state: { ...location.state, mood: moodValue }, replace: true });
  };

  const handleEntryUpdated = (updatedEntry: HistoryEntry) => {
    setPastEntries((prev) => prev.map((entry) => (
      entry.id === updatedEntry.id ? { ...entry, ...updatedEntry } : entry
    )));
    navigate('/dashboard');
    refreshHistory();
  };

  const handleCalendarDayClick = (dateString: string) => {
    navigate('entry', { state: { targetDate: dateString } });
  };

  const locationState = location.state || {};
  const { mood: selectedMood, entry: editingEntry, targetDate } = locationState;
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
      <DesktopCommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
        onOpenToday={() => navigate('/dashboard')}
        onOpenSearch={openGlobalSearch}
        onOpenEntry={() => navigate('/dashboard/entry')}
        onOpenJournal={() => navigate('/dashboard/journal')}
        onOpenDiscover={() => navigate('/dashboard/discover')}
        onOpenSettings={() => navigate('/dashboard/settings')}
        onCompleteGoal={() => {
          void completePriorityGoal();
        }}
      />

      <div className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-primary/20">
        {!isEntryView && <Sidebar onLoadStatistics={loadStatistics} />}

        <div className={cn(
          'flex flex-col min-h-screen transition-all duration-300 ease-in-out',
          !isEntryView && 'md:pl-64 xl:pl-72 2xl:pl-80'
        )}>
          <Header currentStreak={currentStreak} />

          <main className="flex-1 pb-20 md:pb-8">
            <AnimatePresence mode="wait">
              <Routes>
                <Route
                  index
                  element={
                    <PageTransition>
                      <PageShell variant="default" maxWidthToken="content" gutterToken="normal">
                        <DashboardHome
                          pastEntries={pastEntries}
                          historyLoading={historyLoading}
                          historyError={historyError}
                          currentStreak={currentStreak}
                          onMoodSelect={handleMoodSelect}
                          onDelete={handleEntryDeleted}
                          onEdit={handleStartEdit}
                          onNavigateToEntry={() => navigate('entry')}
                          onNavigateToJournal={() => navigate('journal')}
                          onNavigateToDiscover={() => navigate('discover')}
                        />
                      </PageShell>
                    </PageTransition>
                  }
                />
                <Route
                  path="entry"
                  element={
                    <PageTransition>
                      <PageShell variant="editor" maxWidthToken="editor" gutterToken="compact" className="!py-0">
                        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading…</div>}>
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
                        </Suspense>
                      </PageShell>
                    </PageTransition>
                  }
                />
                <Route
                  path="journal"
                  element={
                    <PageTransition>
                      <PageShell variant="default" maxWidthToken="content" gutterToken="normal">
                        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading…</div>}>
                          <JournalView
                            pastEntries={pastEntries}
                            historyLoading={historyLoading}
                            historyError={historyError}
                            onDelete={handleEntryDeleted}
                            onEdit={handleStartEdit}
                            onEntryClick={handleEditById}
                          />
                        </Suspense>
                      </PageShell>
                    </PageTransition>
                  }
                />
                <Route
                  path="discover"
                  element={
                    <PageTransition>
                      <PageShell variant="analytics" maxWidthToken="wide" gutterToken="normal">
                        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading…</div>}>
                          <DiscoverView
                            statistics={statistics}
                            pastEntries={pastEntries}
                            statsLoading={statsLoading}
                            statsError={statsError ?? undefined}
                            onDayClick={handleCalendarDayClick}
                            onEntryClick={handleStartEdit}
                          />
                        </Suspense>
                      </PageShell>
                    </PageTransition>
                  }
                />
                {/* Legacy redirects */}
                <Route path="stats" element={<Navigate to="/dashboard/discover" replace />} />
                <Route path="achievements" element={<Navigate to="/dashboard/discover?tab=achievements" replace />} />
                <Route path="goals" element={<Navigate to="/dashboard" replace />} />
                <Route path="gallery" element={<Navigate to="/dashboard/journal" replace />} />
                <Route
                  path="settings"
                  element={
                    <PageTransition>
                      <PageShell variant="default" maxWidthToken="content" gutterToken="normal">
                        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading…</div>}>
                          <SettingsView />
                        </Suspense>
                      </PageShell>
                    </PageTransition>
                  }
                />
                <Route
                  path="ui-demo"
                  element={
                    <PageTransition>
                      <PageShell variant="default" maxWidthToken="wide" gutterToken="normal">
                        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading…</div>}>
                          <UiDemo />
                        </Suspense>
                      </PageShell>
                    </PageTransition>
                  }
                />
              </Routes>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {!isEntryView && <BottomNav onLoadStatistics={loadStatistics} />}

      <div className={cn('fixed right-4 bottom-32 z-50', !isEntryView ? 'md:hidden' : '')}>
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
      </div>

      {!isEntryView ? (
        <div data-testid="desktop-action-bar" className="hidden xl:flex fixed right-6 bottom-6 z-40 items-center gap-2 rounded-full border border-border/80 bg-card/95 backdrop-blur px-2 py-2 shadow-lg max-w-[calc(100vw-3rem)]">
          <Button size="sm" className="h-8" onClick={() => navigate('/dashboard/entry')}>
            New Entry
          </Button>
          <Button size="sm" variant="outline" className="h-8" onClick={() => navigate('/dashboard/journal')}>
            Journal
          </Button>
          <Button size="sm" variant="outline" className="h-8" onClick={() => navigate('/dashboard/discover')}>
            Discover
          </Button>
          <Button size="sm" variant="outline" className="h-8" onClick={() => {
            void completePriorityGoal();
          }}>
            Complete Goal
          </Button>
          <span className="px-1 text-[11px] text-muted-foreground whitespace-nowrap">
            C • J • D • ⇧G • ⌘K
          </span>
        </div>
      ) : null}
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
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
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/about" element={<Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading…</div>}><AboutPage /></Suspense>} />
                    <Route path="/ui-demo" element={<Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading…</div>}><UiDemo /></Suspense>} />
                    <Route path="/ui-demo/mood-model" element={<Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading…</div>}><MoodModelSandbox /></Suspense>} />
                    <Route path="/login" element={<Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading…</div>}><LoginPage /></Suspense>} />
                    <Route path="/forgot-password" element={<Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading…</div>}><ForgotPasswordPage /></Suspense>} />
                    <Route path="/reset-password" element={<Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading…</div>}><ResetPasswordPage /></Suspense>} />
                    <Route
                      path="/dashboard/*"
                      element={
                        <ProtectedRoute>
                          <AppContent />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading…</div>}><NotFound /></Suspense>} />
                  </Routes>
                </MoodDefinitionsProvider>
              </LockProvider>
            </AuthProvider>
          </ToastProvider>
          <OfflineIndicator />
        </ThemeProvider>
      </ConfigProvider>
    </ErrorBoundary>
  );
}

export default App;
