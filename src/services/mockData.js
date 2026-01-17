/**
 * Mock Mode Configuration
 * 
 * When VITE_MOCK_MODE=true, the app will:
 * - Skip all backend API calls
 * - Use mock user data (auto-authenticated)
 * - Use mock mood entries, groups, and statistics
 * - Persist data to localStorage for the session
 * 
 * Usage: Set VITE_MOCK_MODE=true in .env.local or run:
 *   VITE_MOCK_MODE=true npm run dev
 */

// Check if mock mode is enabled
export const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true';

// LocalStorage keys for mock persistence
const STORAGE_KEYS = {
    ENTRIES: 'twilightio_mock_entries',
    GROUPS: 'twilightio_mock_groups',
    GOALS: 'twilightio_mock_goals',
};

// Mock user data
export const mockUser = {
    id: 'mock-user-001',
    name: 'Demo User',
    email: 'demo@mock.local',
    picture: '',
    created_at: new Date().toISOString(),
};

// Default mock mood entries
const defaultMockEntries = [
    {
        id: 'mock-entry-1',
        user_id: 'mock-user-001',
        mood: 5,
        note: "Had a fantastic day! Went for a long walk in the park and enjoyed the sunshine. Feeling grateful for the little things.",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        selections: [
            { id: 'sel-1', option_id: 'opt-1', option_name: 'Exercise', group_name: 'Activities' },
            { id: 'sel-2', option_id: 'opt-2', option_name: 'Nature', group_name: 'Activities' },
        ],
        media: [],
    },
    {
        id: 'mock-entry-2',
        user_id: 'mock-user-001',
        mood: 4,
        note: "Productive morning at work. Got through my to-do list and had a nice lunch with colleagues.",
        created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        selections: [
            { id: 'sel-3', option_id: 'opt-3', option_name: 'Work', group_name: 'Activities' },
            { id: 'sel-4', option_id: 'opt-4', option_name: 'Friends', group_name: 'Social' },
        ],
        media: [],
    },
    {
        id: 'mock-entry-3',
        user_id: 'mock-user-001',
        mood: 3,
        note: "Average day. Nothing special happened but nothing bad either. Spent the evening reading.",
        created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        updated_at: new Date(Date.now() - 172800000).toISOString(),
        selections: [
            { id: 'sel-5', option_id: 'opt-5', option_name: 'Reading', group_name: 'Hobbies' },
        ],
        media: [],
    },
    {
        id: 'mock-entry-4',
        user_id: 'mock-user-001',
        mood: 2,
        note: "Felt a bit stressed today. Work deadlines piling up. Need to focus on self-care this week.",
        created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        updated_at: new Date(Date.now() - 259200000).toISOString(),
        selections: [
            { id: 'sel-6', option_id: 'opt-3', option_name: 'Work', group_name: 'Activities' },
            { id: 'sel-7', option_id: 'opt-6', option_name: 'Stress', group_name: 'Emotions' },
        ],
        media: [],
    },
    {
        id: 'mock-entry-5',
        user_id: 'mock-user-001',
        mood: 4,
        note: "Great weekend! Tried a new recipe and it turned out amazing. Shared dinner with family.",
        created_at: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
        updated_at: new Date(Date.now() - 345600000).toISOString(),
        selections: [
            { id: 'sel-8', option_id: 'opt-7', option_name: 'Cooking', group_name: 'Hobbies' },
            { id: 'sel-9', option_id: 'opt-8', option_name: 'Family', group_name: 'Social' },
        ],
        media: [],
    },
];

// Default mock groups with options
const defaultMockGroups = [
    {
        id: 'group-1',
        name: 'Activities',
        icon: '🏃',
        user_id: 'mock-user-001',
        options: [
            { id: 'opt-1', name: 'Exercise', group_id: 'group-1' },
            { id: 'opt-2', name: 'Nature', group_id: 'group-1' },
            { id: 'opt-3', name: 'Work', group_id: 'group-1' },
        ],
    },
    {
        id: 'group-2',
        name: 'Social',
        icon: '👥',
        user_id: 'mock-user-001',
        options: [
            { id: 'opt-4', name: 'Friends', group_id: 'group-2' },
            { id: 'opt-8', name: 'Family', group_id: 'group-2' },
        ],
    },
    {
        id: 'group-3',
        name: 'Hobbies',
        icon: '🎨',
        user_id: 'mock-user-001',
        options: [
            { id: 'opt-5', name: 'Reading', group_id: 'group-3' },
            { id: 'opt-7', name: 'Cooking', group_id: 'group-3' },
        ],
    },
    {
        id: 'group-4',
        name: 'Emotions',
        icon: '💭',
        user_id: 'mock-user-001',
        options: [
            { id: 'opt-6', name: 'Stress', group_id: 'group-4' },
            { id: 'opt-9', name: 'Calm', group_id: 'group-4' },
            { id: 'opt-10', name: 'Excited', group_id: 'group-4' },
        ],
    },
];

// Default mock goals
const defaultMockGoals = [
    {
        id: 'goal-1',
        user_id: 'mock-user-001',
        title: 'Exercise regularly',
        description: 'Stay active and healthy',
        frequency_per_week: 3,
        frequency_type: 'weekly',
        target_count: 3,
        current_count: 2,
        created_at: new Date(Date.now() - 604800000).toISOString(),
    },
    {
        id: 'goal-2',
        user_id: 'mock-user-001',
        title: 'Read more',
        description: 'Read at least 30 minutes daily',
        frequency_per_week: 5,
        frequency_type: 'weekly',
        target_count: 5,
        current_count: 3,
        created_at: new Date(Date.now() - 604800000).toISOString(),
    },
];

// Mock statistics
export const mockStatistics = {
    total_entries: 5,
    average_mood: 3.6,
    mood_distribution: { 1: 0, 2: 1, 3: 1, 4: 2, 5: 1 },
    entries_this_week: 3,
    entries_this_month: 5,
    most_common_mood: 4,
    mood_trend: 'stable',
};

// Mock streak
export const mockStreak = {
    current_streak: 4,
    longest_streak: 7,
};

// Helper to get data from localStorage or use defaults
function getStoredData(key, defaultData) {
    try {
        const stored = localStorage.getItem(key);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.warn('[MOCK] Failed to parse stored data:', e);
    }
    return [...defaultData];
}

// Helper to save data to localStorage
function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.warn('[MOCK] Failed to save data:', e);
    }
}

// Simulated network delay
const delay = (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API service that mirrors the real API interface
export const mockApiService = {
    token: 'mock-token',

    setAuthToken() {
        // No-op in mock mode
    },

    // Auth
    async googleAuth() {
        await delay(300);
        return { token: 'mock-token', user: mockUser };
    },

    async localLogin() {
        await delay(300);
        return { token: 'mock-token', user: mockUser };
    },

    async verifyToken() {
        await delay(100);
        return { user: mockUser };
    },

    async getPublicConfig() {
        await delay(100);
        return { enable_google_oauth: false };
    },

    // Mood entries
    async getMoodEntries() {
        await delay(300);
        const entries = getStoredData(STORAGE_KEYS.ENTRIES, defaultMockEntries);
        return entries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    async createMoodEntry(entryData) {
        await delay(300);
        const entries = getStoredData(STORAGE_KEYS.ENTRIES, defaultMockEntries);
        const newEntry = {
            id: `mock-entry-${Date.now()}`,
            user_id: 'mock-user-001',
            mood: entryData.mood,
            content: entryData.content || entryData.note || '',
            date: entryData.date || new Date().toLocaleDateString(),
            time: entryData.time || new Date().toISOString(),
            created_at: entryData.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            selections: [],
            media: [],
        };
        entries.unshift(newEntry);
        saveData(STORAGE_KEYS.ENTRIES, entries);
        // Return format matching Flask backend: { entry: {...}, new_achievements: [] }
        return { entry: newEntry, new_achievements: [] };
    },

    async updateMoodEntry(entryId, entryData) {
        await delay(300);
        const entries = getStoredData(STORAGE_KEYS.ENTRIES, defaultMockEntries);
        const index = entries.findIndex(e => e.id === entryId);
        if (index !== -1) {
            entries[index] = { ...entries[index], ...entryData, updated_at: new Date().toISOString() };
            saveData(STORAGE_KEYS.ENTRIES, entries);
            // Return format matching Flask backend: { entry: {...} }
            return { entry: entries[index] };
        }
        throw new Error('Entry not found');
    },

    async deleteMoodEntry(entryId) {
        await delay(200);
        const entries = getStoredData(STORAGE_KEYS.ENTRIES, defaultMockEntries);
        const filtered = entries.filter(e => e.id !== entryId);
        saveData(STORAGE_KEYS.ENTRIES, filtered);
        return { success: true };
    },

    async getEntrySelections(entryId) {
        await delay(100);
        const entries = getStoredData(STORAGE_KEYS.ENTRIES, defaultMockEntries);
        const entry = entries.find(e => e.id === entryId);
        return entry?.selections || [];
    },

    async getEntryMedia(entryId) {
        await delay(100);
        const entries = getStoredData(STORAGE_KEYS.ENTRIES, defaultMockEntries);
        const entry = entries.find(e => e.id === entryId);
        return entry?.media || [];
    },

    // Statistics
    async getStatistics() {
        await delay(200);
        const entries = getStoredData(STORAGE_KEYS.ENTRIES, defaultMockEntries);
        const moodDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let total = 0;
        entries.forEach(e => {
            moodDist[e.mood] = (moodDist[e.mood] || 0) + 1;
            total += e.mood;
        });
        return {
            total_entries: entries.length,
            average_mood: entries.length ? (total / entries.length).toFixed(1) : 0,
            mood_distribution: moodDist,
            entries_this_week: entries.filter(e => new Date(e.created_at) > new Date(Date.now() - 7 * 86400000)).length,
            entries_this_month: entries.length,
            most_common_mood: Object.entries(moodDist).sort((a, b) => b[1] - a[1])[0]?.[0] || 3,
            mood_trend: 'stable',
        };
    },

    async getCurrentStreak() {
        await delay(100);
        return mockStreak;
    },

    async getStreakDetails() {
        await delay(100);
        return { ...mockStreak, streak_dates: [] };
    },

    // Groups
    async getGroups() {
        await delay(200);
        return getStoredData(STORAGE_KEYS.GROUPS, defaultMockGroups);
    },

    async createGroup(groupData) {
        await delay(300);
        const groups = getStoredData(STORAGE_KEYS.GROUPS, defaultMockGroups);
        const newGroup = {
            id: `group-${Date.now()}`,
            name: groupData.name || groupData,
            icon: groupData.icon || '📁',
            user_id: 'mock-user-001',
            options: [],
        };
        groups.push(newGroup);
        saveData(STORAGE_KEYS.GROUPS, groups);
        return newGroup;
    },

    async createGroupOption(groupId, optionData) {
        await delay(200);
        const groups = getStoredData(STORAGE_KEYS.GROUPS, defaultMockGroups);
        const group = groups.find(g => g.id === groupId);
        if (group) {
            const newOption = {
                id: `opt-${Date.now()}`,
                name: optionData.name || optionData,
                group_id: groupId,
            };
            group.options.push(newOption);
            saveData(STORAGE_KEYS.GROUPS, groups);
            return newOption;
        }
        throw new Error('Group not found');
    },

    async deleteGroupOption(optionId) {
        await delay(200);
        const groups = getStoredData(STORAGE_KEYS.GROUPS, defaultMockGroups);
        groups.forEach(g => {
            g.options = g.options.filter(o => o.id !== optionId);
        });
        saveData(STORAGE_KEYS.GROUPS, groups);
        return { success: true };
    },

    async moveGroupOption(optionId, newGroupId) {
        await delay(200);
        const groups = getStoredData(STORAGE_KEYS.GROUPS, defaultMockGroups);
        let option = null;
        groups.forEach(g => {
            const idx = g.options.findIndex(o => o.id === optionId);
            if (idx !== -1) {
                option = g.options.splice(idx, 1)[0];
            }
        });
        if (option) {
            const targetGroup = groups.find(g => g.id === newGroupId);
            if (targetGroup) {
                option.group_id = newGroupId;
                targetGroup.options.push(option);
            }
            saveData(STORAGE_KEYS.GROUPS, groups);
        }
        return { success: true };
    },

    async deleteGroup(groupId) {
        await delay(200);
        const groups = getStoredData(STORAGE_KEYS.GROUPS, defaultMockGroups);
        const filtered = groups.filter(g => g.id !== groupId);
        saveData(STORAGE_KEYS.GROUPS, filtered);
        return { success: true };
    },

    // Goals
    async getGoals() {
        await delay(200);
        return getStoredData(STORAGE_KEYS.GOALS, defaultMockGoals);
    },

    async createGoal(goalData) {
        await delay(300);
        const goals = getStoredData(STORAGE_KEYS.GOALS, defaultMockGoals);
        const newGoal = {
            id: `goal-${Date.now()}`,
            user_id: 'mock-user-001',
            ...goalData,
            current_count: 0,
            created_at: new Date().toISOString(),
        };
        goals.push(newGoal);
        saveData(STORAGE_KEYS.GOALS, goals);
        return newGoal;
    },

    async updateGoal(goalId, patch) {
        await delay(200);
        const goals = getStoredData(STORAGE_KEYS.GOALS, defaultMockGoals);
        const index = goals.findIndex(g => g.id === goalId);
        if (index !== -1) {
            goals[index] = { ...goals[index], ...patch };
            saveData(STORAGE_KEYS.GOALS, goals);
            return goals[index];
        }
        throw new Error('Goal not found');
    },

    async deleteGoal(goalId) {
        await delay(200);
        const goals = getStoredData(STORAGE_KEYS.GOALS, defaultMockGoals);
        const filtered = goals.filter(g => g.id !== goalId);
        saveData(STORAGE_KEYS.GOALS, filtered);
        return { success: true };
    },

    async incrementGoalProgress(goalId) {
        await delay(200);
        const goals = getStoredData(STORAGE_KEYS.GOALS, defaultMockGoals);
        const goal = goals.find(g => g.id === goalId);
        if (goal) {
            goal.current_count = (goal.current_count || 0) + 1;
            saveData(STORAGE_KEYS.GOALS, goals);
            return goal;
        }
        throw new Error('Goal not found');
    },

    async getGoalCompletions() {
        await delay(100);
        return [];
    },

    async toggleGoalCompletion(goalId) {
        await delay(200);
        return { success: true, goalId };
    },

    // Achievements
    async getUserAchievements() {
        await delay(200);
        return [];
    },

    async checkAchievements() {
        await delay(200);
        return { new_achievements: [] };
    },

    async getAchievementsProgress() {
        await delay(200);
        return [];
    },

    // Analytics
    async getAnalyticsCorrelations() {
        await delay(200);
        return [];
    },

    async getAnalyticsCoOccurrence() {
        await delay(200);
        return [];
    },

    async getMoodStability() {
        await delay(200);
        return { stability_score: 75, standard_deviation: 0.8 };
    },

    async getAnalyticsCoOccurrenceByMood() {
        await delay(200);
        return [];
    },

    async getAdvancedCorrelations() {
        await delay(200);
        return [];
    },

    // Mood Definitions
    async getMoodDefinitions() {
        await delay(100);
        return [
            { score: 1, label: 'Awful', color: '#ef4444', emoji: '😢' },
            { score: 2, label: 'Bad', color: '#f97316', emoji: '😕' },
            { score: 3, label: 'Okay', color: '#eab308', emoji: '😐' },
            { score: 4, label: 'Good', color: '#84cc16', emoji: '🙂' },
            { score: 5, label: 'Great', color: '#22c55e', emoji: '😄' },
        ];
    },

    async updateMoodDefinition(score, updates) {
        await delay(200);
        return { score, ...updates };
    },

    // Scales
    async getScales() {
        await delay(100);
        return [];
    },

    async createScale() {
        await delay(200);
        return { id: `scale-${Date.now()}` };
    },

    async updateScale() {
        await delay(200);
        return { success: true };
    },

    async deleteScale() {
        await delay(200);
        return { success: true };
    },

    async getScaleEntries() {
        await delay(100);
        return [];
    },

    async getEntryScales() {
        await delay(100);
        return [];
    },

    // Important Days
    async getImportantDays() {
        await delay(100);
        return [];
    },

    async createImportantDay() {
        await delay(200);
        return { id: `day-${Date.now()}` };
    },

    async updateImportantDay() {
        await delay(200);
        return { success: true };
    },

    async deleteImportantDay() {
        await delay(200);
        return { success: true };
    },

    async getUpcomingImportantDays() {
        await delay(100);
        return [];
    },

    // Settings
    async getUserSettings() {
        await delay(100);
        return { pin_enabled: false, lock_timeout: 300 };
    },

    async setPin() {
        await delay(200);
        return { success: true };
    },

    async removePin() {
        await delay(200);
        return { success: true };
    },

    async verifyPin() {
        await delay(200);
        return { valid: true };
    },

    async updateLockTimeout() {
        await delay(200);
        return { success: true };
    },

    // Media
    async uploadMedia() {
        await delay(500);
        return { id: `media-${Date.now()}`, url: '' };
    },

    async deleteMedia() {
        await delay(200);
        return { success: true };
    },

    // Data Management
    async importData() {
        await delay(500);
        return { success: true, imported: 0 };
    },

    async deleteAccount() {
        await delay(500);
        localStorage.removeItem(STORAGE_KEYS.ENTRIES);
        localStorage.removeItem(STORAGE_KEYS.GROUPS);
        localStorage.removeItem(STORAGE_KEYS.GOALS);
        return { success: true };
    },

    // Gallery
    async getGalleryPhotos() {
        await delay(200);
        return [];
    },
};

// Log when mock mode is active
if (isMockMode) {
    console.log(
        '%c🎭 MOCK MODE ENABLED',
        'background: #f59e0b; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
    );
    console.log('All backend calls are bypassed. Using localStorage + mock data.');
}
