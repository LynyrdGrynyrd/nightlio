/**
 * Settings and user management endpoints
 */

import { ApiClient } from '../apiClient';
import {
  UserSettings,
  Achievement,
  AchievementDefinition,
  AchievementProgressDTO,
  DaylioImportJob,
  Reminder,
  ReminderPayload,
  ReminderUpdatePayload,
} from '../types';

export const createSettingsEndpoints = (client: ApiClient) => ({
  /**
   * Get user settings
   */
  getUserSettings: (): Promise<UserSettings> => {
    return client.request<UserSettings>('/api/user/settings');
  },

  /**
   * Set PIN
   */
  setPin: (pin: string): Promise<{ message: string }> => {
    return client.request<{ message: string }>('/api/auth/pin', {
      method: 'PUT',
      body: JSON.stringify({ pin }),
    });
  },

  /**
   * Remove PIN
   */
  removePin: (): Promise<{ message: string }> => {
    return client.request<{ message: string }>('/api/auth/pin', {
      method: 'DELETE',
    });
  },

  /**
   * Verify PIN
   */
  verifyPin: (pin: string): Promise<{ valid: boolean }> => {
    return client.request<{ valid: boolean }>('/api/auth/verify-pin', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
  },

  /**
   * Update lock timeout
   */
  updateLockTimeout: (seconds: number): Promise<{ message: string }> => {
    return client.request<{ message: string }>('/api/user/settings/lock-timeout', {
      method: 'PUT',
      body: JSON.stringify({ seconds }),
    });
  },

  /**
   * Get user achievements
   */
  getUserAchievements: (): Promise<Achievement[]> => {
    return client.request<Achievement[]>('/api/achievements');
  },

  /**
   * Check for new achievements
   */
  checkAchievements: (): Promise<{ new_achievements: Achievement[]; count: number }> => {
    return client.request<{ new_achievements: Achievement[]; count: number }>('/api/achievements/check', {
      method: 'POST',
    });
  },

  /**
   * Get achievement definitions (backend source of truth)
   */
  getAchievementDefinitions: (): Promise<AchievementDefinition[]> => {
    return client.request<AchievementDefinition[]>('/api/achievements/definitions');
  },

  /**
   * Get achievement progress
   */
  getAchievementsProgress: (): Promise<AchievementProgressDTO[]> => {
    return client.request<AchievementProgressDTO[]>('/api/achievements/progress');
  },

  /**
   * Import data
   */
  importData: (jsonData: unknown): Promise<{ message: string; stats: Record<string, number> }> => {
    return client.request<{ message: string; stats: Record<string, number> }>('/api/export/import', {
      method: 'POST',
      body: JSON.stringify(jsonData),
    });
  },

  /**
   * Start Daylio import job
   */
  importDaylioBackup: (file: File, dryRun: boolean = false): Promise<{ job_id: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    return client.request<{ job_id: string }>(
      `/api/import/daylio${dryRun ? '?dry_run=true' : ''}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': undefined as unknown as string,
        },
        body: formData as unknown as string,
      }
    );
  },

  /**
   * Poll Daylio import job status
   */
  getDaylioImportJob: (jobId: string): Promise<DaylioImportJob> => {
    return client.request<DaylioImportJob>(`/api/import/daylio/${jobId}`);
  },

  /**
   * Push notifications
   */
  getPushVapidPublicKey: (): Promise<{ publicKey: string }> => {
    return client.request<{ publicKey: string }>('/api/push/vapid-public-key');
  },

  subscribePush: (subscription: unknown): Promise<{ status: string }> => {
    return client.request<{ status: string }>('/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
    });
  },

  sendTestPush: (): Promise<{ message?: string; error?: string }> => {
    return client.request<{ message?: string; error?: string }>('/api/push/test', {
      method: 'POST',
    });
  },

  /**
   * Reminder CRUD
   */
  getReminders: (): Promise<Reminder[]> => {
    return client.request<Reminder[]>('/api/reminders');
  },

  createReminder: (payload: ReminderPayload): Promise<{ status: string; id: number }> => {
    return client.request<{ status: string; id: number }>('/api/reminders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateReminder: (
    reminderId: number,
    payload: ReminderUpdatePayload
  ): Promise<{ status: string }> => {
    return client.request<{ status: string }>(`/api/reminders/${reminderId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteReminder: (reminderId: number): Promise<{ status: string }> => {
    return client.request<{ status: string }>(`/api/reminders/${reminderId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Delete account
   */
  deleteAccount: (): Promise<{ message: string }> => {
    return client.request<{ message: string }>('/api/auth/user', {
      method: 'DELETE',
    });
  },
});
