import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import apiService, { Group, CreateGroupData, CreateGroupOptionData } from '../services/api';

interface UseGroupsReturn {
  groups: Group[];
  loading: boolean;
  error: string | null;
  createGroup: (name: string) => Promise<boolean>;
  createGroupOption: (groupId: number, name: string, icon?: string) => Promise<boolean>;
  deleteGroup: (groupId: number) => Promise<boolean>;
  moveGroupOption: (optionId: number, newGroupId: number) => Promise<boolean>;
  refreshGroups: () => Promise<void>;
}

export const useGroups = (): UseGroupsReturn => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref to avoid stale closures in callbacks
  const groupsRef = useRef(groups);
  useEffect(() => { groupsRef.current = groups; }, [groups]);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiService.getGroups();
      setGroups(data);
    } catch (err) {
      console.error('Failed to load groups:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  const createGroup = useCallback(async (name: string): Promise<boolean> => {
    try {
      const groupData: CreateGroupData = { name };
      const newGroup = await apiService.createGroup(groupData);
      // Optimistic update: add the new group locally
      setGroups(prev => [...prev, { ...newGroup, options: newGroup.options ?? [] }]);
      return true;
    } catch (err) {
      console.error('Failed to create group:', err);
      setError('Failed to create category');
      return false;
    }
  }, []);

  const createGroupOption = useCallback(async (groupId: number, name: string, icon?: string): Promise<boolean> => {
    try {
      const optionData: CreateGroupOptionData = { name, icon };
      const newOption = await apiService.createGroupOption(groupId, optionData);
      // Optimistic update: add option to the correct group locally
      setGroups(prev => prev.map(g =>
        g.id === groupId
          ? { ...g, options: [...g.options, newOption] }
          : g
      ));
      return true;
    } catch (err) {
      console.error('Failed to create group option:', err);
      setError('Failed to create option');
      return false;
    }
  }, []);

  const deleteGroup = useCallback(async (groupId: number): Promise<boolean> => {
    const previousGroups = groupsRef.current;
    // Optimistic update: remove group locally
    setGroups(prev => prev.filter(g => g.id !== groupId));
    try {
      await apiService.deleteGroup(groupId);
      return true;
    } catch (err) {
      console.error('Failed to delete group:', err);
      setError('Failed to delete category');
      // Revert on failure
      setGroups(previousGroups);
      return false;
    }
  }, []);

  const moveGroupOption = useCallback(async (optionId: number, newGroupId: number): Promise<boolean> => {
    const previousGroups = groupsRef.current;
    // Optimistic update: move option between groups locally
    setGroups(prev => {
      let movedOption: typeof prev[0]['options'][0] | undefined;
      const updated = prev.map(g => {
        const option = g.options.find(o => o.id === optionId);
        if (option) {
          movedOption = option;
          return { ...g, options: g.options.filter(o => o.id !== optionId) };
        }
        return g;
      });
      if (movedOption) {
        return updated.map(g =>
          g.id === newGroupId
            ? { ...g, options: [...g.options, movedOption!] }
            : g
        );
      }
      return updated;
    });
    try {
      await apiService.moveGroupOption(optionId, newGroupId);
      return true;
    } catch (err) {
      console.error('Failed to move option:', err);
      setError('Failed to move option');
      // Revert on failure
      setGroups(previousGroups);
      return false;
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  return useMemo(() => ({
    groups,
    loading,
    error,
    createGroup,
    createGroupOption,
    deleteGroup,
    moveGroupOption,
    refreshGroups: loadGroups,
  }), [groups, loading, error, createGroup, createGroupOption, deleteGroup, moveGroupOption, loadGroups]);
};
