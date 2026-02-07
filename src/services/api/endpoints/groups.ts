/**
 * Group endpoints
 */

import { ApiClient } from '../apiClient';
import { Group, CreateGroupData, GroupOption, CreateGroupOptionData } from '../types';

export const createGroupEndpoints = (client: ApiClient) => ({
  /**
   * Get all groups
   */
  getGroups: (): Promise<Group[]> => {
    return client.request<Group[]>('/api/groups');
  },

  /**
   * Create a new group
   */
  createGroup: (groupData: CreateGroupData): Promise<Group> => {
    return client.request<Group>('/api/groups', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
  },

  /**
   * Create a new option in a group
   */
  createGroupOption: (groupId: number, optionData: CreateGroupOptionData): Promise<GroupOption> => {
    return client.request<GroupOption>(`/api/groups/${groupId}/options`, {
      method: 'POST',
      body: JSON.stringify(optionData),
    });
  },

  /**
   * Delete a group option
   */
  deleteGroupOption: (optionId: number): Promise<{ message: string }> => {
    return client.request<{ message: string }>(`/api/options/${optionId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Move an option to a different group
   */
  moveGroupOption: (optionId: number, newGroupId: number): Promise<GroupOption> => {
    return client.request<GroupOption>(`/api/options/${optionId}/move`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_id: newGroupId }),
    });
  },

  /**
   * Delete a group
   */
  deleteGroup: (groupId: number): Promise<{ message: string }> => {
    return client.request<{ message: string }>(`/api/groups/${groupId}`, {
      method: 'DELETE',
    });
  },
});
