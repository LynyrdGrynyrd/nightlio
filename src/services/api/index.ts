/**
 * API Service - Main facade that composes all endpoints
 * This provides backward compatibility with the original ApiService class
 */

import { ApiClient, API_BASE_URL } from './apiClient';
import {
  createAuthEndpoints,
  createMoodEndpoints,
  createStatisticsEndpoints,
  createGroupEndpoints,
  createGoalEndpoints,
  createMediaEndpoints,
  createAnalyticsEndpoints,
  createScaleEndpoints,
  createImportantDaysEndpoints,
  createSettingsEndpoints,
} from './endpoints';

// Re-export types
export * from './types';

// Re-export API_BASE_URL for components that need it
export { API_BASE_URL };

/**
 * API Service class that composes all endpoint modules
 */
class ApiService {
  private client: ApiClient;
  private auth: ReturnType<typeof createAuthEndpoints>;
  private moods: ReturnType<typeof createMoodEndpoints>;
  private statistics: ReturnType<typeof createStatisticsEndpoints>;
  private groups: ReturnType<typeof createGroupEndpoints>;
  private goals: ReturnType<typeof createGoalEndpoints>;
  private media: ReturnType<typeof createMediaEndpoints>;
  private analytics: ReturnType<typeof createAnalyticsEndpoints>;
  private scales: ReturnType<typeof createScaleEndpoints>;
  private importantDays: ReturnType<typeof createImportantDaysEndpoints>;
  private settings: ReturnType<typeof createSettingsEndpoints>;

  constructor() {
    this.client = new ApiClient();
    this.auth = createAuthEndpoints(this.client);
    this.moods = createMoodEndpoints(this.client);
    this.statistics = createStatisticsEndpoints(this.client);
    this.groups = createGroupEndpoints(this.client);
    this.goals = createGoalEndpoints(this.client);
    this.media = createMediaEndpoints(this.client);
    this.analytics = createAnalyticsEndpoints(this.client);
    this.scales = createScaleEndpoints(this.client);
    this.importantDays = createImportantDaysEndpoints(this.client);
    this.settings = createSettingsEndpoints(this.client);
  }

  // ========== Auth Token Management ==========
  setAuthToken(token: string): void {
    this.client.setAuthToken(token);
  }

  // ========== Public Config ==========
  getPublicConfig = () => this.auth.getPublicConfig();

  // ========== Authentication ==========
  googleAuth = (googleToken: string) => this.auth.googleAuth(googleToken);
  localLogin = () => this.auth.localLogin();
  usernamePasswordAuth = (username: string, password: string) =>
    this.auth.usernamePasswordAuth(username, password);
  register = (username: string, password: string, email?: string, name?: string) =>
    this.auth.register(username, password, email, name);
  verifyToken = (token: string) => this.auth.verifyToken(token);

  // ========== Mood Entries ==========
  getMoodEntries = (options?: { include?: ('selections' | 'media')[] }) =>
    this.moods.getMoodEntries(options);
  createMoodEntry = (entryData: Parameters<typeof this.moods.createMoodEntry>[0]) =>
    this.moods.createMoodEntry(entryData);
  updateMoodEntry = (entryId: number, entryData: Parameters<typeof this.moods.updateMoodEntry>[1]) =>
    this.moods.updateMoodEntry(entryId, entryData);
  deleteMoodEntry = (entryId: number) => this.moods.deleteMoodEntry(entryId);
  getEntrySelections = (entryId: number) => this.moods.getEntrySelections(entryId);
  getMoodDefinitions = () => this.moods.getMoodDefinitions();
  updateMoodDefinition = (
    score: number,
    updates: Parameters<typeof this.moods.updateMoodDefinition>[1]
  ) => this.moods.updateMoodDefinition(score, updates);
  getJournalStats = () => this.moods.getJournalStats();
  searchEntries = (params: Parameters<typeof this.moods.searchEntries>[0]) =>
    this.moods.searchEntries(params);

  // ========== Statistics ==========
  getStatistics = () => this.statistics.getStatistics();
  getCurrentStreak = () => this.statistics.getCurrentStreak();
  getStreakDetails = () => this.statistics.getStreakDetails();

  // ========== Groups ==========
  getGroups = () => this.groups.getGroups();
  createGroup = (groupData: Parameters<typeof this.groups.createGroup>[0]) =>
    this.groups.createGroup(groupData);
  createGroupOption = (groupId: number, optionData: Parameters<typeof this.groups.createGroupOption>[1]) =>
    this.groups.createGroupOption(groupId, optionData);
  deleteGroupOption = (optionId: number) => this.groups.deleteGroupOption(optionId);
  moveGroupOption = (optionId: number, newGroupId: number) =>
    this.groups.moveGroupOption(optionId, newGroupId);
  deleteGroup = (groupId: number) => this.groups.deleteGroup(groupId);

  // ========== Goals ==========
  getGoals = () => this.goals.getGoals();
  createGoal = (goal: Parameters<typeof this.goals.createGoal>[0]) =>
    this.goals.createGoal(goal);
  updateGoal = (goalId: number, patch: Parameters<typeof this.goals.updateGoal>[1]) =>
    this.goals.updateGoal(goalId, patch);
  deleteGoal = (goalId: number) => this.goals.deleteGoal(goalId);
  incrementGoalProgress = (goalId: number) => this.goals.incrementGoalProgress(goalId);
  getGoalCompletions = (goalId: number, range?: { start?: string; end?: string }) =>
    this.goals.getGoalCompletions(goalId, range);
  toggleGoalCompletion = (goalId: number, date: string) =>
    this.goals.toggleGoalCompletion(goalId, date);

  // ========== Media ==========
  uploadMedia = (entryId: number, file: File) => this.media.uploadMedia(entryId, file);
  getEntryMedia = (entryId: number) => this.media.getEntryMedia(entryId);
  deleteMedia = (mediaId: number) => this.media.deleteMedia(mediaId);
  getGalleryPhotos = (params?: Parameters<typeof this.media.getGalleryPhotos>[0]) =>
    this.media.getGalleryPhotos(params);

  // ========== Analytics ==========
  getAnalyticsCorrelations = () => this.analytics.getAnalyticsCorrelations();
  getAnalyticsCoOccurrence = () => this.analytics.getAnalyticsCoOccurrence();
  getMoodStability = (days?: number) => this.analytics.getMoodStability(days);
  getAnalyticsCoOccurrenceByMood = (mood: string) =>
    this.analytics.getAnalyticsCoOccurrenceByMood(mood);
  getAdvancedCorrelations = () => this.analytics.getAdvancedCorrelations();
  getAnalyticsBatch = () => this.analytics.getAnalyticsBatch();

  // ========== Scales ==========
  getScales = () => this.scales.getScales();
  createScale = (data: Parameters<typeof this.scales.createScale>[0]) =>
    this.scales.createScale(data);
  updateScale = (scaleId: number, updates: Parameters<typeof this.scales.updateScale>[1]) =>
    this.scales.updateScale(scaleId, updates);
  deleteScale = (scaleId: number) => this.scales.deleteScale(scaleId);
  getScaleEntries = (startDate?: string, endDate?: string) =>
    this.scales.getScaleEntries(startDate, endDate);
  getEntryScales = (entryId: number) => this.scales.getEntryScales(entryId);
  saveEntryScales = (entryId: number, scales: Record<number, number>) =>
    this.scales.saveEntryScales(entryId, scales);

  // ========== Important Days ==========
  getImportantDays = () => this.importantDays.getImportantDays();
  createImportantDay = (data: Parameters<typeof this.importantDays.createImportantDay>[0]) =>
    this.importantDays.createImportantDay(data);
  updateImportantDay = (dayId: number, updates: Parameters<typeof this.importantDays.updateImportantDay>[1]) =>
    this.importantDays.updateImportantDay(dayId, updates);
  deleteImportantDay = (dayId: number) => this.importantDays.deleteImportantDay(dayId);
  getUpcomingImportantDays = (daysAhead?: number) =>
    this.importantDays.getUpcomingImportantDays(daysAhead);

  // ========== Settings ==========
  getUserSettings = () => this.settings.getUserSettings();
  setPin = (pin: string) => this.settings.setPin(pin);
  removePin = () => this.settings.removePin();
  verifyPin = (pin: string) => this.settings.verifyPin(pin);
  updateLockTimeout = (seconds: number) => this.settings.updateLockTimeout(seconds);
  getUserAchievements = () => this.settings.getUserAchievements();
  checkAchievements = () => this.settings.checkAchievements();
  getAchievementDefinitions = () => this.settings.getAchievementDefinitions();
  getAchievementsProgress = () => this.settings.getAchievementsProgress();
  importData = (jsonData: unknown) => this.settings.importData(jsonData);
  importDaylioBackup = (file: File, dryRun?: boolean) =>
    this.settings.importDaylioBackup(file, dryRun);
  getDaylioImportJob = (jobId: string) => this.settings.getDaylioImportJob(jobId);
  getPushVapidPublicKey = () => this.settings.getPushVapidPublicKey();
  subscribePush = (subscription: unknown) => this.settings.subscribePush(subscription);
  sendTestPush = () => this.settings.sendTestPush();
  getReminders = () => this.settings.getReminders();
  createReminder = (payload: Parameters<typeof this.settings.createReminder>[0]) =>
    this.settings.createReminder(payload);
  updateReminder = (
    reminderId: number,
    payload: Parameters<typeof this.settings.updateReminder>[1]
  ) => this.settings.updateReminder(reminderId, payload);
  deleteReminder = (reminderId: number) => this.settings.deleteReminder(reminderId);
  deleteAccount = () => this.settings.deleteAccount();
}

// Import mock mode support
import { isMockMode, mockApiService } from '../mockData.js';

// Export the appropriate service based on mock mode
const apiService: ApiService = isMockMode ? (mockApiService as unknown as ApiService) : new ApiService();
export default apiService;
