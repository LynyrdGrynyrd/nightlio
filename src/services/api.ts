// Type definitions for API requests and responses

// ========== Common Types ==========
export interface ApiError {
  error?: string;
  message?: string;
}

export interface User {
  id: number;
  email: string;
  name?: string;
  created_at: string;
}

export interface PublicConfig {
  google_client_id?: string;
  enable_google_oauth?: boolean;
  enable_registration?: boolean;
  features?: string[];
}

// ========== Auth Types ==========
export interface AuthResponse {
  token: string;
  user: User;
}

export interface VerifyTokenResponse {
  valid: boolean;
  user?: User;
}

// ========== Mood Entry Types ==========
export interface MoodEntry {
  id: number;
  user_id: number;
  score: number;
  note?: string;
  timestamp: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateMoodEntryData {
  score: number;
  note?: string;
  timestamp?: string;
  selections?: number[];
}

export interface UpdateMoodEntryData {
  score?: number;
  note?: string;
  timestamp?: string;
}

// ========== Statistics Types ==========
export interface Statistics {
  total_entries: number;
  average_mood: number;
  current_streak: number;
  best_streak: number;
  mood_distribution: Record<number, number>;
  weekly_average?: number;
  monthly_average?: number;
}

// ========== Streak Types ==========
export interface Streak {
  current: number;
  best: number;
}

export interface StreakDetails {
  current_streak: number;
  best_streak: number;
  streak_dates: string[];
  missing_dates: string[];
}

// ========== Group Types ==========
export interface GroupOption {
  id: number;
  group_id: number;
  name: string;
  icon?: string;
  emoji?: string;
  color?: string;
  order_index: number;
}

export interface Group {
  id: number;
  user_id: number;
  name: string;
  emoji?: string;
  options: GroupOption[];
}

export interface CreateGroupData {
  name: string;
  emoji?: string;
}

export interface CreateGroupOptionData {
  name: string;
  icon?: string;
  emoji?: string;
  color?: string;
}

// ========== Achievement Types ==========
export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon?: string;
  unlocked_at?: string;
}

export interface AchievementProgress {
  achievement_id: number;
  progress: number;
  target: number;
  percentage: number;
}

// ========== Goal Types ==========
export interface Goal {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  frequency_per_week?: number;
  frequency_type?: 'daily' | 'weekly' | 'count';
  target_count?: number;
  created_at: string;
  is_archived?: boolean;
}

export interface CreateGoalData {
  title: string;
  description?: string;
  frequency_per_week?: number;
  frequency_type?: 'daily' | 'weekly' | 'count';
  target_count?: number;
  frequency?: string; // Legacy: "3 days a week"
  frequencyNumber?: number; // Legacy
}

export interface UpdateGoalData {
  title?: string;
  description?: string;
  frequency_per_week?: number;
  frequency_type?: 'daily' | 'weekly' | 'count';
  target_count?: number;
  is_archived?: boolean;
  frequency?: string; // Legacy
}

export interface GoalCompletion {
  id: number;
  goal_id: number;
  date: string;
  created_at: string;
}

// ========== Media Types ==========
export interface Media {
  id: number;
  entry_id: number;
  file_path: string;
  file_type: string;
  created_at: string;
  thumbnail_path?: string;
}

export interface GalleryPhoto extends Media {
  entry_date: string;
  entry_mood: number;
}

export interface GalleryResponse {
  photos: GalleryPhoto[];
  total: number;
  has_more: boolean;
}

export interface GalleryQueryParams {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}

// ========== Analytics Types ==========
export interface Correlation {
  option_name: string;
  average_mood: number;
  count: number;
  correlation_strength: number;
}

export interface CoOccurrence {
  option1: string;
  option2: string;
  count: number;
  average_mood: number;
}

export interface MoodStability {
  stability_score: number;
  variance: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface AdvancedCorrelation {
  factor: string;
  correlation: number;
  confidence: number;
  sample_size: number;
}

// ========== Mood Definition Types ==========
export interface MoodDefinition {
  score: number;
  label: string;
  color: string;
  description?: string;
}

// ========== Scale Types ==========
export interface Scale {
  id: number;
  user_id: number;
  name: string;
  min_value: number;
  max_value: number;
  min_label?: string;
  max_label?: string;
  created_at: string;
}

export interface CreateScaleData {
  name: string;
  min_value: number;
  max_value: number;
  min_label?: string;
  max_label?: string;
}

export interface UpdateScaleData {
  name?: string;
  min_value?: number;
  max_value?: number;
  min_label?: string;
  max_label?: string;
}

export interface ScaleEntry {
  id: number;
  scale_id: number;
  entry_id: number;
  value: number;
  timestamp: string;
}

// ========== Important Days Types ==========
export interface ImportantDay {
  id: number;
  user_id: number;
  title: string;
  date: string;
  type: 'countdown' | 'anniversary' | 'reminder';
  emoji?: string;
  created_at: string;
}

export interface CreateImportantDayData {
  title: string;
  date: string;
  type: 'countdown' | 'anniversary' | 'reminder';
  emoji?: string;
}

export interface UpdateImportantDayData {
  title?: string;
  date?: string;
  type?: 'countdown' | 'anniversary' | 'reminder';
  emoji?: string;
}

// ========== User Settings Types ==========
export interface UserSettings {
  user_id: number;
  has_pin: boolean;
  lock_timeout_seconds?: number;
  theme?: string;
  notifications_enabled?: boolean;
}

// ========== Request Options ==========
interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

// ========== Helper Functions ==========

/**
 * Normalizes the base URL from environment variables
 */
function normalizeBaseUrl(raw: string | undefined): string {
  let v = raw ?? '';
  if (typeof v !== 'string') v = String(v);
  v = v.trim();
  // Handle cases like '""' or "''" injected by build-time env
  if (v === '""' || v === "''") v = '';
  // Strip surrounding quotes and any stray quotes
  v = v.replace(/^['"]+|['"]+$/g, '');
  v = v.replace(/["']/g, '');
  // Remove trailing slashes
  v = v.replace(/\/+$/g, '');
  return v;
}

const API_BASE_URL = normalizeBaseUrl(
  (typeof import.meta !== 'undefined' && import.meta.env && 'VITE_API_URL' in import.meta.env)
    ? import.meta.env.VITE_API_URL as string
    : '' // Use relative /api in both dev and prod; Vite proxy handles dev, nginx handles prod
);

// ========== API Service Class ==========

class ApiService {
  private token: string | null;

  constructor() {
    this.token = localStorage.getItem('twilightio_token');
  }

  setAuthToken(token: string): void {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    // Safe-join base + endpoint, honoring relative mode when base is empty
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    // If base is a relative prefix like '/api', and endpoint already starts with '/api',
    // avoid double-prefixing (i.e., '/api' + '/api/config' -> '/api/config').
    const base = API_BASE_URL;
    let url: string;
    if (!base) {
      url = path;
    } else if (/^https?:\/\//i.test(base)) {
      url = `${base}${path}`;
    } else {
      // Treat base as a path prefix
      const baseNoTrail = base.replace(/\/+$/g, '');
      if (path === baseNoTrail || path.startsWith(`${baseNoTrail}/`)) {
        url = path; // endpoint already includes the base prefix
      } else {
        url = `${baseNoTrail}${path}`;
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (headers['Content-Type'] === undefined) {
      delete headers['Content-Type'];
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    if (this.token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this.token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        // Try to parse JSON error, else include text snippet to aid debugging
        let errorMessage = `HTTP error! status: ${response.status}`;
        const ct = response.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const errorData = await response.json().catch(() => ({})) as ApiError;
          if (errorData && (errorData.error || errorData.message)) {
            errorMessage = errorData.error || errorData.message;
          }
        } else {
          const text = await response.text().catch(() => '');
          if (text) errorMessage += ` | body: ${text.slice(0, 200)}`;
        }
        throw new Error(errorMessage);
      }
      // Parse JSON safely
      const ct = response.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON but received: ${ct || 'unknown'} | body: ${text.slice(0, 200)}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // ========== Public Config ==========
  async getPublicConfig(): Promise<PublicConfig> {
    return this.request<PublicConfig>('/api/config');
  }

  // ========== Authentication ==========
  async googleAuth(googleToken: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ token: googleToken }),
    });
  }

  async localLogin(): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/local/login', {
      method: 'POST',
    });
  }

  async usernamePasswordAuth(username: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async register(username: string, password: string, email?: string, name?: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, email, name }),
    });
  }

  async verifyToken(token: string): Promise<VerifyTokenResponse> {
    return this.request<VerifyTokenResponse>('/api/auth/verify', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // ========== Mood Entries ==========
  async getMoodEntries(): Promise<MoodEntry[]> {
    return this.request<MoodEntry[]>('/api/moods');
  }

  async createMoodEntry(entryData: CreateMoodEntryData): Promise<MoodEntry> {
    return this.request<MoodEntry>('/api/mood', {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
  }

  async updateMoodEntry(entryId: number, entryData: UpdateMoodEntryData): Promise<MoodEntry> {
    return this.request<MoodEntry>(`/api/mood/${entryId}`, {
      method: 'PUT',
      body: JSON.stringify(entryData),
    });
  }

  async deleteMoodEntry(entryId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/mood/${entryId}`, {
      method: 'DELETE',
    });
  }

  // ========== Statistics ==========
  async getStatistics(): Promise<Statistics> {
    return this.request<Statistics>('/api/statistics');
  }

  // ========== Streak ==========
  async getCurrentStreak(): Promise<Streak> {
    return this.request<Streak>('/api/streak');
  }

  async getStreakDetails(): Promise<StreakDetails> {
    return this.request<StreakDetails>('/api/streak/details');
  }

  // ========== Groups ==========
  async getGroups(): Promise<Group[]> {
    return this.request<Group[]>('/api/groups');
  }

  async createGroup(groupData: CreateGroupData): Promise<Group> {
    return this.request<Group>('/api/groups', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
  }

  async createGroupOption(groupId: number, optionData: CreateGroupOptionData): Promise<GroupOption> {
    return this.request<GroupOption>(`/api/groups/${groupId}/options`, {
      method: 'POST',
      body: JSON.stringify(optionData),
    });
  }

  async deleteGroupOption(optionId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/options/${optionId}`, {
      method: 'DELETE',
    });
  }

  async moveGroupOption(optionId: number, newGroupId: number): Promise<GroupOption> {
    return this.request<GroupOption>(`/api/options/${optionId}/move`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_id: newGroupId }),
    });
  }

  async deleteGroup(groupId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/groups/${groupId}`, {
      method: 'DELETE',
    });
  }

  // ========== Entry Selections ==========
  async getEntrySelections(entryId: number): Promise<GroupOption[]> {
    return this.request<GroupOption[]>(`/api/mood/${entryId}/selections`);
  }

  // ========== Achievements ==========
  async getUserAchievements(): Promise<Achievement[]> {
    return this.request<Achievement[]>('/api/achievements');
  }

  async checkAchievements(): Promise<Achievement[]> {
    return this.request<Achievement[]>('/api/achievements/check', {
      method: 'POST',
    });
  }

  async getAchievementsProgress(): Promise<AchievementProgress[]> {
    return this.request<AchievementProgress[]>('/api/achievements/progress');
  }

  // ========== Goals ==========
  async getGoals(): Promise<Goal[]> {
    return this.request<Goal[]>('/api/goals');
  }

  async createGoal(goal: CreateGoalData): Promise<Goal> {
    // Accept { title, description, frequency_per_week, frequency_type, target_count }
    const payload: any = { ...goal };
    if (payload.frequency && !payload.frequency_per_week) {
      // frequency like '3 days a week' -> 3
      const n = parseInt(String(payload.frequency).trim(), 10);
      if (!Number.isNaN(n)) payload.frequency_per_week = n;
      delete payload.frequency;
    }
    // Map frequencyNumber to frequency_per_week if needed
    if (payload.frequencyNumber && !payload.frequency_per_week) {
      payload.frequency_per_week = payload.frequencyNumber;
      delete payload.frequencyNumber;
    }
    // Pass frequency_type and target_count directly
    return this.request<Goal>('/api/goals', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateGoal(goalId: number, patch: UpdateGoalData): Promise<Goal> {
    const payload: any = { ...patch };
    if (payload.frequency && !payload.frequency_per_week) {
      const n = parseInt(String(payload.frequency).trim(), 10);
      if (!Number.isNaN(n)) payload.frequency_per_week = n;
      delete payload.frequency;
    }
    return this.request<Goal>(`/api/goals/${goalId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteGoal(goalId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/goals/${goalId}`, { method: 'DELETE' });
  }

  async incrementGoalProgress(goalId: number): Promise<Goal> {
    return this.request<Goal>(`/api/goals/${goalId}/progress`, { method: 'POST' });
  }

  async getGoalCompletions(goalId: number, { start, end }: { start?: string; end?: string } = {}): Promise<GoalCompletion[]> {
    const params = new URLSearchParams();
    if (start) params.set('start', start);
    if (end) params.set('end', end);
    const q = params.toString();
    return this.request<GoalCompletion[]>(`/api/goals/${goalId}/completions${q ? `?${q}` : ''}`);
  }

  async toggleGoalCompletion(goalId: number, date: string): Promise<{ completed: boolean }> {
    return this.request<{ completed: boolean }>(`/api/goals/${goalId}/toggle-completion`, {
      method: 'POST',
      body: JSON.stringify({ date }),
    });
  }

  // ========== Media ==========
  async uploadMedia(entryId: number, file: File): Promise<Media> {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<Media>(`/api/mood/${entryId}/media`, {
      method: 'POST',
      headers: {
        // multipart/form-data is set automatically by fetch when body is FormData
        'Content-Type': undefined as any,
      },
      body: formData as any,
    });
  }

  async getEntryMedia(entryId: number): Promise<Media[]> {
    return this.request<Media[]>(`/api/mood/${entryId}/media`);
  }

  async deleteMedia(mediaId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/media/${mediaId}`, { method: 'DELETE' });
  }

  // ========== Analytics ==========
  async getAnalyticsCorrelations(): Promise<Correlation[]> {
    return this.request<Correlation[]>('/api/analytics/correlations');
  }

  async getAnalyticsCoOccurrence(): Promise<CoOccurrence[]> {
    return this.request<CoOccurrence[]>('/api/analytics/co-occurrence');
  }

  async getMoodStability(days: number = 30): Promise<MoodStability> {
    return this.request<MoodStability>(`/api/analytics/stability?days=${days}`);
  }

  async getAnalyticsCoOccurrenceByMood(mood: string): Promise<CoOccurrence[]> {
    return this.request<CoOccurrence[]>(`/api/analytics/co-occurrence/${mood}`);
  }

  async getAdvancedCorrelations(): Promise<AdvancedCorrelation[]> {
    return this.request<AdvancedCorrelation[]>('/api/analytics/advanced-correlations');
  }

  // ========== Custom Mood Definitions ==========
  async getMoodDefinitions(): Promise<MoodDefinition[]> {
    return this.request<MoodDefinition[]>('/api/mood-definitions');
  }

  async updateMoodDefinition(score: number, updates: Partial<MoodDefinition>): Promise<MoodDefinition> {
    return this.request<MoodDefinition>(`/api/mood-definitions/${score}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // ========== Scale Tracking ==========
  async getScales(): Promise<Scale[]> {
    return this.request<Scale[]>('/api/scales');
  }

  async createScale(data: CreateScaleData): Promise<Scale> {
    return this.request<Scale>('/api/scales', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateScale(scaleId: number, updates: UpdateScaleData): Promise<Scale> {
    return this.request<Scale>(`/api/scales/${scaleId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteScale(scaleId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/scales/${scaleId}`, { method: 'DELETE' });
  }

  async getScaleEntries(startDate?: string, endDate?: string): Promise<ScaleEntry[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<ScaleEntry[]>(`/api/scales/entries${queryString}`);
  }

  async getEntryScales(entryId: number): Promise<ScaleEntry[]> {
    return this.request<ScaleEntry[]>(`/api/entries/${entryId}/scales`);
  }

  // ========== Important Days / Countdowns ==========
  async getImportantDays(): Promise<ImportantDay[]> {
    return this.request<ImportantDay[]>('/api/important-days');
  }

  async createImportantDay(data: CreateImportantDayData): Promise<ImportantDay> {
    return this.request<ImportantDay>('/api/important-days', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateImportantDay(dayId: number, updates: UpdateImportantDayData): Promise<ImportantDay> {
    return this.request<ImportantDay>(`/api/important-days/${dayId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteImportantDay(dayId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/important-days/${dayId}`, { method: 'DELETE' });
  }

  async getUpcomingImportantDays(daysAhead: number = 30): Promise<ImportantDay[]> {
    return this.request<ImportantDay[]>(`/api/important-days/upcoming?days=${daysAhead}`);
  }

  // ========== Settings / App Lock ==========
  async getUserSettings(): Promise<UserSettings> {
    return this.request<UserSettings>('/api/user/settings');
  }

  async setPin(pin: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/auth/pin', {
      method: 'PUT',
      body: JSON.stringify({ pin }),
    });
  }

  async removePin(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/auth/pin', {
      method: 'DELETE',
    });
  }

  async verifyPin(pin: string): Promise<{ valid: boolean }> {
    return this.request<{ valid: boolean }>('/api/auth/verify-pin', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
  }

  async updateLockTimeout(seconds: number): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/user/settings/lock-timeout', {
      method: 'PUT',
      body: JSON.stringify({ seconds }),
    });
  }

  // ========== Data Management ==========
  async importData(jsonData: any): Promise<{ message: string; imported_counts: Record<string, number> }> {
    return this.request<{ message: string; imported_counts: Record<string, number> }>('/api/export/import', {
      method: 'POST',
      body: JSON.stringify(jsonData)
    });
  }

  async deleteAccount(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/auth/user', {
      method: 'DELETE'
    });
  }

  // ========== Photo Gallery ==========
  async getGalleryPhotos({ limit = 50, offset = 0, startDate, endDate }: GalleryQueryParams = {}): Promise<GalleryResponse> {
    const params = new URLSearchParams();
    params.append('limit', String(limit));
    params.append('offset', String(offset));
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return this.request<GalleryResponse>(`/api/media/gallery?${params.toString()}`);
  }
}

// Import mock mode support
import { isMockMode, mockApiService } from './mockData.js';

// Export the appropriate service based on mock mode
const apiService: ApiService = isMockMode ? mockApiService : new ApiService();
export default apiService;
