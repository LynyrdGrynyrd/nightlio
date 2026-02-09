import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService, { Group, CreateGroupData, CreateGroupOptionData } from '../services/api';
import { queryKeys } from '../lib/queryKeys';

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

const GROUPS_KEY = queryKeys.groups.list();

export const useGroups = (): UseGroupsReturn => {
  const queryClient = useQueryClient();

  const { data, isLoading, error: queryError } = useQuery({
    queryKey: GROUPS_KEY,
    queryFn: () => apiService.getGroups(),
  });

  const createGroupMutation = useMutation({
    mutationFn: (name: string) => {
      const groupData: CreateGroupData = { name };
      return apiService.createGroup(groupData);
    },
    onSuccess: (newGroup) => {
      queryClient.setQueryData<Group[]>(GROUPS_KEY, (prev) => [
        ...(prev ?? []),
        { ...newGroup, options: newGroup.options ?? [] },
      ]);
    },
  });

  const createGroupOptionMutation = useMutation({
    mutationFn: ({ groupId, name, icon }: { groupId: number; name: string; icon?: string }) => {
      const optionData: CreateGroupOptionData = { name, icon };
      return apiService.createGroupOption(groupId, optionData);
    },
    onSuccess: (newOption, { groupId }) => {
      queryClient.setQueryData<Group[]>(GROUPS_KEY, (prev) =>
        (prev ?? []).map((g) =>
          g.id === groupId ? { ...g, options: [...g.options, newOption] } : g
        ),
      );
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (groupId: number) => apiService.deleteGroup(groupId),
    onMutate: async (groupId) => {
      await queryClient.cancelQueries({ queryKey: GROUPS_KEY });
      const previous = queryClient.getQueryData<Group[]>(GROUPS_KEY);
      queryClient.setQueryData<Group[]>(GROUPS_KEY, (prev) =>
        (prev ?? []).filter((g) => g.id !== groupId),
      );
      return { previous };
    },
    onError: (_err, _groupId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(GROUPS_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });

  const moveGroupOptionMutation = useMutation({
    mutationFn: ({ optionId, newGroupId }: { optionId: number; newGroupId: number }) =>
      apiService.moveGroupOption(optionId, newGroupId),
    onMutate: async ({ optionId, newGroupId }) => {
      await queryClient.cancelQueries({ queryKey: GROUPS_KEY });
      const previous = queryClient.getQueryData<Group[]>(GROUPS_KEY);
      queryClient.setQueryData<Group[]>(GROUPS_KEY, (prev) => {
        if (!prev) return prev;
        let movedOption: Group['options'][0] | undefined;
        const updated = prev.map((g) => {
          const option = g.options.find((o) => o.id === optionId);
          if (option) {
            movedOption = option;
            return { ...g, options: g.options.filter((o) => o.id !== optionId) };
          }
          return g;
        });
        if (movedOption) {
          return updated.map((g) =>
            g.id === newGroupId ? { ...g, options: [...g.options, movedOption!] } : g
          );
        }
        return updated;
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(GROUPS_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });

  const createGroup = useCallback(async (name: string): Promise<boolean> => {
    try {
      await createGroupMutation.mutateAsync(name);
      return true;
    } catch {
      return false;
    }
  }, [createGroupMutation]);

  const createGroupOption = useCallback(async (groupId: number, name: string, icon?: string): Promise<boolean> => {
    try {
      await createGroupOptionMutation.mutateAsync({ groupId, name, icon });
      return true;
    } catch {
      return false;
    }
  }, [createGroupOptionMutation]);

  const deleteGroup = useCallback(async (groupId: number): Promise<boolean> => {
    try {
      await deleteGroupMutation.mutateAsync(groupId);
      return true;
    } catch {
      return false;
    }
  }, [deleteGroupMutation]);

  const moveGroupOption = useCallback(async (optionId: number, newGroupId: number): Promise<boolean> => {
    try {
      await moveGroupOptionMutation.mutateAsync({ optionId, newGroupId });
      return true;
    } catch {
      return false;
    }
  }, [moveGroupOptionMutation]);

  const refreshGroups = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
  }, [queryClient]);

  const mutationError = createGroupMutation.error || createGroupOptionMutation.error
    || deleteGroupMutation.error || moveGroupOptionMutation.error;

  return useMemo(() => ({
    groups: data ?? [],
    loading: isLoading,
    error: queryError ? 'Failed to load categories' : mutationError ? 'Operation failed' : null,
    createGroup,
    createGroupOption,
    deleteGroup,
    moveGroupOption,
    refreshGroups,
  }), [data, isLoading, queryError, mutationError, createGroup, createGroupOption, deleteGroup, moveGroupOption, refreshGroups]);
};
