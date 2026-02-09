import { useState } from 'react';
import {
  LineChart as RechartsLineChart,
  BarChart as RechartsBarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Skeleton as ShadcnSkeleton } from '@/components/ui/Skeleton';
import { Toaster } from '@/components/ui/toaster';
import { toast as shadcnToast } from '@/components/ui/use-toast';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import ProgressBar from '../components/ui/ProgressBar';
import Skeleton from '@/components/ui/Skeleton';
import { useToast } from '../components/ui/ToastProvider';
import './UiDemo.css';

// Demo data
const demoChartData = [
  { day: 'Mon', mood: 3 },
  { day: 'Tue', mood: 4 },
  { day: 'Wed', mood: 2 },
  { day: 'Thu', mood: 5 },
  { day: 'Fri', mood: 4 },
  { day: 'Sat', mood: 3 },
  { day: 'Sun', mood: 4 },
];

const moodDistribution = [
  { mood: 'Awful', count: 2, color: 'var(--mood-1)' },
  { mood: 'Bad', count: 5, color: 'var(--mood-2)' },
  { mood: 'Meh', count: 8, color: 'var(--mood-3)' },
  { mood: 'Good', count: 12, color: 'var(--mood-4)' },
  { mood: 'Great', count: 7, color: 'var(--mood-5)' },
];

const activityTags = ['Exercise', 'Work', 'Family', 'Sleep', 'Reading'];

const demoTableData = [
  { id: 1, date: '2026-01-30', mood: 'Great', tags: ['Exercise', 'Family'], note: 'Had a great workout' },
  { id: 2, date: '2026-01-29', mood: 'Good', tags: ['Work'], note: 'Productive day at work' },
  { id: 3, date: '2026-01-28', mood: 'Meh', tags: ['Sleep'], note: 'Tired, didn\'t sleep well' },
  { id: 4, date: '2026-01-27', mood: 'Good', tags: ['Reading', 'Family'], note: 'Relaxing weekend' },
  { id: 5, date: '2026-01-26', mood: 'Bad', tags: ['Work'], note: 'Stressful deadline' },
];

const moodColors: Record<string, string> = {
  'Great': 'var(--mood-5)',
  'Good': 'var(--mood-4)',
  'Meh': 'var(--mood-3)',
  'Bad': 'var(--mood-2)',
  'Awful': 'var(--mood-1)',
};

const UiDemo = () => {
  const { show } = useToast();
  const [legacyModalOpen, setLegacyModalOpen] = useState(false);

  // State for components
  const [currentTab, setCurrentTab] = useState(0);
  const [shadcnTab, setShadcnTab] = useState('week');
  const [toggleOn, setToggleOn] = useState(false);
  const [shadcnToggle, setShadcnToggle] = useState(false);
  const [selectValue, setSelectValue] = useState('week');
  const [inputValue, setInputValue] = useState('');
  const [shadcnInput, setShadcnInput] = useState('');

  return (
    <div className="ui-demo">
      <header className="ui-demo__header">
        <p className="ui-demo__eyebrow">UI Demo</p>
        <h1>Component comparisons</h1>
        <p className="ui-demo__subtitle">
          Side-by-side examples of the current components vs shadcn/ui.
        </p>
        <div className="mt-3">
          <Button asChild size="sm" variant="outline">
            <Link to="/ui-demo/mood-model">Try mood model sandbox</Link>
          </Button>
        </div>
      </header>

      <div className="ui-demo__columns ui-demo__columns--two">
        {/* ===== CURRENT UI COLUMN ===== */}
        <section className="ui-demo__column">
          <h2>Current UI</h2>

          <div className="ui-demo__section">
            <h3>Buttons</h3>
            <div className="ui-demo__inline">
              <button type="button">Secondary</button>
              <button className="primary" type="button">
                Primary
              </button>
            </div>
          </div>

          <div className="ui-demo__section">
            <h3>Dialog</h3>
            <button
              className="primary"
              type="button"
              onClick={() => setLegacyModalOpen(true)}
            >
              Open dialog
            </button>
            <Modal
              open={legacyModalOpen}
              onClose={() => setLegacyModalOpen(false)}
              title="Custom dialog"
            >
              <p>This dialog uses the existing modal component.</p>
              <div className="ui-demo__inline">
                <button type="button" onClick={() => setLegacyModalOpen(false)}>
                  Close
                </button>
              </div>
            </Modal>
          </div>

          <div className="ui-demo__section">
            <h3>Toast</h3>
            <div className="ui-demo__inline">
              <button type="button" onClick={() => show('Custom toast notification', 'info')}>
                Info toast
              </button>
              <button
                className="primary"
                type="button"
                onClick={() => show('Success toast notification', 'success')}
              >
                Success toast
              </button>
            </div>
          </div>

          <div className="ui-demo__section">
            <h3>Tabs</h3>
            <div className="ui-demo__tabs">
              {['Week', 'Month', 'Year'].map((tab, i) => (
                <button
                  key={tab}
                  type="button"
                  className={currentTab === i ? 'active' : ''}
                  onClick={() => setCurrentTab(i)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <p className="ui-demo__tab-content">
              Showing {['Week', 'Month', 'Year'][currentTab]} view
            </p>
          </div>

          <div className="ui-demo__section">
            <h3>Chips / Tags</h3>
            <div className="ui-demo__inline">
              {activityTags.slice(0, 3).map((tag) => (
                <span key={tag} className="ui-demo__chip">{tag}</span>
              ))}
            </div>
          </div>

          <div className="ui-demo__section">
            <h3>Select</h3>
            <select
              value={selectValue}
              name="demo-select"
              autoComplete="off"
              onChange={(e) => setSelectValue(e.target.value)}
              className="ui-demo__select"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>

          <div className="ui-demo__section">
            <h3>Switch</h3>
            <label className="ui-demo__switch-label">
              <span className="ui-demo__switch-track" data-on={toggleOn}>
                <span className="ui-demo__switch-thumb" />
              </span>
              <input
                type="checkbox"
                name="demo-toggle"
                checked={toggleOn}
                onChange={() => setToggleOn(!toggleOn)}
                className="sr-only"
              />
              Enable notifications
            </label>
          </div>

          <div className="ui-demo__section">
            <h3>Input</h3>
            <input
              type="text"
              name="demo-search"
              autoComplete="off"
              placeholder="Search entries..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="ui-demo__input"
            />
          </div>

          <div className="ui-demo__section">
            <h3>Skeleton</h3>
            <div className="ui-demo__stack">
              <Skeleton height={16} width="80%" />
              <Skeleton height={36} width="100%" />
              <Skeleton height={80} radius={12} />
            </div>
          </div>

          <div className="ui-demo__section">
            <h3>Progress</h3>
            <ProgressBar value={62} max={100} label="Syncing entries" />
          </div>

          <div className="ui-demo__section">
            <h3>Empty state</h3>
            <EmptyState
              title="No entries yet"
              message="Start journaling to see insights here."
              actionLabel="Create entry"
              onAction={() => show('Create entry clicked', 'info')}
            />
          </div>

          <div className="ui-demo__section">
            <h3>Line Chart</h3>
            <div style={{ height: 180, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={demoChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} domain={[1, 5]} />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="mood" stroke="var(--accent-600)" strokeWidth={2} dot={{ r: 4 }} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="ui-demo__section">
            <h3>Bar Chart</h3>
            <div style={{ height: 180, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={moodDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="mood" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                  <RechartsTooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {moodDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="ui-demo__section">
            <h3>Data Table</h3>
            <div className="ui-demo__table-wrapper">
              <table className="ui-demo__table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Mood</th>
                    <th>Tags</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {demoTableData.map((row) => (
                    <tr key={row.id}>
                      <td>{row.date}</td>
                      <td>
                        <span
                          className="ui-demo__mood-dot"
                          style={{ background: moodColors[row.mood] }}
                        />
                        {row.mood}
                      </td>
                      <td>
                        <div className="ui-demo__inline ui-demo__inline--tight">
                          {row.tags.map((tag) => (
                            <span key={tag} className="ui-demo__chip ui-demo__chip--sm">{tag}</span>
                          ))}
                        </div>
                      </td>
                      <td className="ui-demo__table-note">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ===== SHADCN/UI COLUMN ===== */}
        <section className="ui-demo__column">
          <h2>shadcn/ui</h2>

          <div className="ui-demo__section">
            <h3>Buttons</h3>
            <div className="ui-demo__inline">
              <Button variant="secondary">Secondary</Button>
              <Button>Primary</Button>
            </div>
          </div>

          <div className="ui-demo__section">
            <h3>Dialog</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>shadcn/ui dialog</DialogTitle>
                  <DialogDescription>
                    This dialog uses shadcn/ui primitives mapped to shared tokens.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="secondary" type="button">
                    Done
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="ui-demo__section">
            <h3>Toast</h3>
            <Button
              type="button"
              onClick={() =>
                shadcnToast({
                  title: 'shadcn/ui toast',
                  description: 'Styled with the shared theme tokens.',
                })
              }
            >
              Show toast
            </Button>
          </div>

          <div className="ui-demo__section">
            <h3>Tabs</h3>
            <div className="ui-demo__tabs ui-demo__tabs--shadcn">
              {[
                { id: 'week', label: 'Week' },
                { id: 'month', label: 'Month' },
                { id: 'year', label: 'Year' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={shadcnTab === tab.id ? 'active' : ''}
                  onClick={() => setShadcnTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <p className="ui-demo__tab-content">
              Showing {shadcnTab.charAt(0).toUpperCase() + shadcnTab.slice(1)} view
            </p>
          </div>

          <div className="ui-demo__section">
            <h3>Chips / Tags</h3>
            <div className="ui-demo__inline">
              {activityTags.slice(0, 3).map((tag) => (
                <span key={tag} className="ui-demo__badge">{tag}</span>
              ))}
            </div>
          </div>

          <div className="ui-demo__section">
            <h3>Select</h3>
            <select
              className="ui-demo__select ui-demo__select--shadcn"
              name="demo-shadcn-select"
              autoComplete="off"
              defaultValue="week"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>

          <div className="ui-demo__section">
            <h3>Switch</h3>
            <label className="ui-demo__switch-label ui-demo__switch-label--shadcn">
              <button
                type="button"
                role="switch"
                aria-checked={shadcnToggle}
                className={`ui-demo__switch-root ${shadcnToggle ? 'checked' : ''}`}
                onClick={() => setShadcnToggle(!shadcnToggle)}
              >
                <span className="ui-demo__switch-thumb-shadcn" />
              </button>
              Enable notifications
            </label>
          </div>

          <div className="ui-demo__section">
            <h3>Input</h3>
            <input
              type="text"
              name="demo-shadcn-search"
              autoComplete="off"
              placeholder="Search entries..."
              value={shadcnInput}
              onChange={(e) => setShadcnInput(e.target.value)}
              className="ui-demo__input ui-demo__input--shadcn"
            />
          </div>

          <div className="ui-demo__section">
            <h3>Skeleton</h3>
            <div className="ui-demo__stack">
              <ShadcnSkeleton className="h-4 w-4/5" />
              <ShadcnSkeleton className="h-9 w-full" />
              <ShadcnSkeleton className="h-20 w-full" />
            </div>
          </div>

          <div className="ui-demo__section">
            <h3>Progress</h3>
            <Progress value={68} />
          </div>

          <div className="ui-demo__section">
            <h3>Empty state</h3>
            <div className="ui-demo__empty">
              <div>
                <p className="ui-demo__empty-title">No entries yet</p>
                <p className="ui-demo__empty-text">Start journaling to see insights here.</p>
              </div>
              <Button size="sm">Create entry</Button>
            </div>
          </div>

          <div className="ui-demo__section">
            <h3>Line Chart (themed)</h3>
            <div style={{ height: 180, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={demoChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                    domain={[1, 5]}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border)',
                      borderRadius: 'var(--radius)',
                      color: 'var(--text)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="mood"
                    stroke="var(--accent-600)"
                    strokeWidth={2}
                    dot={false}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="ui-demo__section">
            <h3>Bar Chart (themed)</h3>
            <div style={{ height: 180, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={moodDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="mood"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border)',
                      borderRadius: 'var(--radius)',
                      color: 'var(--text)',
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {moodDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="ui-demo__section">
            <h3>Data Table (themed)</h3>
            <div className="ui-demo__table-wrapper ui-demo__table-wrapper--shadcn">
              <table className="ui-demo__table ui-demo__table--shadcn">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Mood</th>
                    <th>Tags</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {demoTableData.map((row) => (
                    <tr key={row.id}>
                      <td>{row.date}</td>
                      <td>
                        <span
                          className="ui-demo__mood-dot"
                          style={{ background: moodColors[row.mood] }}
                        />
                        {row.mood}
                      </td>
                      <td>
                        <div className="ui-demo__inline ui-demo__inline--tight">
                          {row.tags.map((tag) => (
                            <span key={tag} className="ui-demo__badge ui-demo__badge--sm">{tag}</span>
                          ))}
                        </div>
                      </td>
                      <td className="ui-demo__table-note">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      <Toaster />
    </div>
  );
};

export default UiDemo;
