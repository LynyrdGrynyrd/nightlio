// Prefer Vite envs; allow overriding API base via VITE_API_URL in any mode
function normalizeBaseUrl(raw) {
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
    ? import.meta.env.VITE_API_URL
    : '' // Use relative /api in both dev and prod; Vite proxy handles dev, nginx handles prod
);

class ApiService {
  constructor() {
    this.token = localStorage.getItem('twilightio_token');
  }

  setAuthToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    // Safe-join base + endpoint, honoring relative mode when base is empty
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    // If base is a relative prefix like '/api', and endpoint already starts with '/api',
    // avoid double-prefixing (i.e., '/api' + '/api/config' -> '/api/config').
    const base = API_BASE_URL;
    let url;
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
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (headers['Content-Type'] === undefined) {
      delete headers['Content-Type'];
    }

    const config = {
      headers,
      ...options,
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
      // console.log('API Request with token:', this.token.substring(0, 20) + '...');
    } else {
      // console.log('API Request WITHOUT token');
    }

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        // Try to parse JSON error, else include text snippet to aid debugging
        let errorMessage = `HTTP error! status: ${response.status}`;
        const ct = response.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const errorData = await response.json().catch(() => ({}));
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

  // Public config
  async getPublicConfig() {
    return this.request('/api/config');
  }

  // Authentication endpoints
  async googleAuth(googleToken) {
    return this.request('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ token: googleToken }),
    });
  }

  async localLogin() {
    return this.request('/api/auth/local/login', {
      method: 'POST',
    });
  }

  async verifyToken(token) {
    return this.request('/api/auth/verify', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Mood entries endpoints
  async getMoodEntries() {
    return this.request('/api/moods');
  }

  async createMoodEntry(entryData) {
    return this.request('/api/mood', {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
  }

  async updateMoodEntry(entryId, entryData) {
    return this.request(`/api/mood/${entryId}`, {
      method: 'PUT',
      body: JSON.stringify(entryData),
    });
  }

  async deleteMoodEntry(entryId) {
    return this.request(`/api/mood/${entryId}`, {
      method: 'DELETE',
    });
  }

  // Statistics endpoints
  async getStatistics() {
    return this.request('/api/statistics');
  }

  // Streak endpoint
  async getCurrentStreak() {
    return this.request('/api/streak');
  }

  // Streak details for visualizer
  async getStreakDetails() {
    return this.request('/api/streak/details');
  }

  // Groups endpoints
  async getGroups() {
    return this.request('/api/groups');
  }

  async createGroup(groupData) {
    return this.request('/api/groups', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
  }

  async createGroupOption(groupId, optionData) {
    return this.request(`/api/groups/${groupId}/options`, {
      method: 'POST',
      body: JSON.stringify(optionData),
    });
  }

  async deleteGroupOption(optionId) {
    return this.request(`/api/options/${optionId}`, {
      method: 'DELETE',
    });
  }

  async moveGroupOption(optionId, newGroupId) {
    return this.request(`/api/options/${optionId}/move`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_id: newGroupId }),
    });
  }

  async deleteGroup(groupId) {
    return this.request(`/api/groups/${groupId}`, {
      method: 'DELETE',
    });
  }

  // Entry selections endpoint
  async getEntrySelections(entryId) {
    return this.request(`/api/mood/${entryId}/selections`);
  }

  // Achievement endpoints
  async getUserAchievements() {
    return this.request('/api/achievements');
  }

  async checkAchievements() {
    return this.request('/api/achievements/check', {
      method: 'POST',
    });
  }

  async getAchievementsProgress() {
    return this.request('/api/achievements/progress');
  }

  // Web3 minting removed

  // -------- Goals endpoints --------
  async getGoals() {
    return this.request('/api/goals');
  }

  async createGoal(goal) {
    // Accept { title, description, frequency_per_week, frequency_type, target_count } 
    const payload = { ...goal };
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
    return this.request('/api/goals', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateGoal(goalId, patch) {
    const payload = { ...patch };
    if (payload.frequency && !payload.frequency_per_week) {
      const n = parseInt(String(payload.frequency).trim(), 10);
      if (!Number.isNaN(n)) payload.frequency_per_week = n;
      delete payload.frequency;
    }
    return this.request(`/api/goals/${goalId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteGoal(goalId) {
    return this.request(`/api/goals/${goalId}`, { method: 'DELETE' });
  }

  async incrementGoalProgress(goalId) {
    return this.request(`/api/goals/${goalId}/progress`, { method: 'POST' });
  }

  async getGoalCompletions(goalId, { start, end } = {}) {
    const params = new URLSearchParams();
    if (start) params.set('start', start);
    if (end) params.set('end', end);
    const q = params.toString();
    return this.request(`/api/goals/${goalId}/completions${q ? `?${q}` : ''}`);
  }

  async toggleGoalCompletion(goalId, date) {
    return this.request(`/api/goals/${goalId}/toggle-completion`, {
      method: 'POST',
      body: JSON.stringify({ date }),
    });
  }

  // Media endpoints
  async uploadMedia(entryId, file) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request(`/api/mood/${entryId}/media`, {
      method: 'POST',
      headers: {
        // multipart/form-data is set automatically by fetch when body is FormData
        'Content-Type': undefined,
      },
      body: formData,
    });
  }

  async getEntryMedia(entryId) {
    return this.request(`/api/mood/${entryId}/media`);
  }

  async deleteMedia(mediaId) {
    return this.request(`/api/media/${mediaId}`, { method: 'DELETE' });
  }

  // Analytics endpoints
  async getAnalyticsCorrelations() {
    return this.request('/api/analytics/correlations');
  }

  async getAnalyticsCoOccurrence() {
    return this.request('/api/analytics/co-occurrence');
  }

  async getMoodStability(days = 30) {
    return this.request(`/api/analytics/stability?days=${days}`);
  }

  async getAnalyticsCoOccurrenceByMood(mood) {
    return this.request(`/api/analytics/co-occurrence/${mood}`);
  }

  async getAdvancedCorrelations() {
    return this.request('/api/analytics/advanced-correlations');
  }

  // Custom Mood Definitions
  async getMoodDefinitions() {
    return this.request('/api/mood-definitions');
  }

  async updateMoodDefinition(score, updates) {
    return this.request(`/api/mood-definitions/${score}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Scale Tracking
  async getScales() {
    return this.request('/api/scales');
  }

  async createScale(data) {
    return this.request('/api/scales', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateScale(scaleId, updates) {
    return this.request(`/api/scales/${scaleId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteScale(scaleId) {
    return this.request(`/api/scales/${scaleId}`, { method: 'DELETE' });
  }

  async getScaleEntries(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/api/scales/entries${queryString}`);
  }

  async getEntryScales(entryId) {
    return this.request(`/api/entries/${entryId}/scales`);
  }

  // Important Days / Countdowns
  async getImportantDays() {
    return this.request('/api/important-days');
  }

  // --- Settings / App Lock ---
  async getUserSettings() {
    return this.request('/api/user/settings');
  }

  async setPin(pin) {
    return this.request('/api/auth/pin', {
      method: 'PUT',
      body: JSON.stringify({ pin }),
    });
  }

  async removePin() {
    return this.request('/api/auth/pin', {
      method: 'DELETE',
    });
  }

  async verifyPin(pin) {
    return this.request('/api/auth/verify-pin', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
  }

  async updateLockTimeout(seconds) {
    return this.request('/api/user/settings/lock-timeout', {
      method: 'PUT',
      body: JSON.stringify({ seconds }),
    });
  }

  async createImportantDay(data) {
    return this.request('/api/important-days', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateImportantDay(dayId, updates) {
    return this.request(`/api/important-days/${dayId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteImportantDay(dayId) {
    return this.request(`/api/important-days/${dayId}`, { method: 'DELETE' });
  }

  async getUpcomingImportantDays(daysAhead = 30) {
    return this.request(`/api/important-days/upcoming?days=${daysAhead}`);
  }

  // Data Management
  async importData(jsonData) {
    return this.request('/api/export/import', {
      method: 'POST',
      body: JSON.stringify(jsonData)
    });
  }

  async deleteAccount() {
    return this.request('/api/auth/user', {
      method: 'DELETE'
    });
  }

  // Photo Gallery
  async getGalleryPhotos({ limit = 50, offset = 0, startDate, endDate } = {}) {
    const params = new URLSearchParams();
    params.append('limit', limit);
    params.append('offset', offset);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return this.request(`/api/media/gallery?${params.toString()}`);
  }
}

const apiService = new ApiService();
export default apiService;