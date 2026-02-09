import { useState, useCallback } from 'react';
import apiService, { ScaleValuesMap } from '../services/api';
import { offlineStorage } from '../services/offlineStorage';
import { useToast } from '../components/ui/ToastProvider';
import { TIMEOUTS } from '../constants/appConstants';
import { HistoryEntry } from '../types/entry';
import { MarkdownAreaHandle } from '../components/MarkdownAreaLazy';

const DEFAULT_MARKDOWN = `# How was your day?

Write about your thoughts, feelings, and experiences...`;

function getNonNullScaleEntries(values: ScaleValuesMap): Record<number, number> {
  return Object.entries(values).reduce((acc, [id, value]) => {
    if (value !== null) acc[Number(id)] = value;
    return acc;
  }, {} as Record<number, number>);
}

interface UseEntrySubmitParams {
  selectedMood: number | undefined;
  selectedOptions: number[];
  selectedPhotos: File[];
  audioFiles: File[];
  scaleValues: ScaleValuesMap;
  scales: import('../services/api').Scale[];
  entryDate: string;
  isEditing: boolean;
  editingEntry: HistoryEntry | null | undefined;
  markdownRef: React.RefObject<MarkdownAreaHandle | null>;
  onEntryUpdated?: (entry: HistoryEntry) => void;
  onBack: () => void;
  onEntrySubmitted: () => void;
  resetForm: () => void;
  resetScaleValues: (scaleList: import('../services/api').Scale[]) => void;
}

interface UseEntrySubmitReturn {
  isSubmitting: boolean;
  submitMessage: string;
  handleSubmit: () => Promise<void>;
}

function useEntrySubmit({
  selectedMood,
  selectedOptions,
  selectedPhotos,
  audioFiles,
  scaleValues,
  scales,
  entryDate,
  isEditing,
  editingEntry,
  markdownRef,
  onEntryUpdated,
  onBack,
  onEntrySubmitted,
  resetForm,
  resetScaleValues,
}: UseEntrySubmitParams): UseEntrySubmitReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const { show } = useToast();

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      if (!selectedMood) {
        show('Pick a mood before saving your entry.', 'error');
        setIsSubmitting(false);
        return;
      }

      const markdownContent = markdownRef.current?.getMarkdown?.() || '';
      if (!markdownContent.trim()) {
        show('Write a few thoughts before saving.', 'error');
        setIsSubmitting(false);
        return;
      }

      let entryId: number;
      let finalEntry: Record<string, unknown> = {};

      try {
        if (isEditing && editingEntry) {
          const response = await apiService.updateMoodEntry(editingEntry.id, {
            mood: selectedMood,
            content: markdownContent,
            selected_options: selectedOptions,
          });

          entryId = editingEntry.id;
          finalEntry = response.entry as Record<string, unknown>;
        } else {
          const now = new Date();
          const response = await apiService.createMoodEntry({
            mood: selectedMood,
            date: entryDate,
            timestamp: now.toISOString(),
            content: markdownContent,
            selected_options: selectedOptions,
          });

          entryId = response.entry_id;
        }

        if (selectedPhotos.length > 0) {
          await Promise.all(selectedPhotos.map(file => apiService.uploadMedia(entryId, file)));
        }

        if (audioFiles.length > 0) {
          await Promise.all(audioFiles.map(file => apiService.uploadMedia(entryId, file)));
        }

        const nonNullScales = getNonNullScaleEntries(scaleValues);
        if (Object.keys(nonNullScales).length > 0) {
          await apiService.saveEntryScales(entryId, nonNullScales);
        }

        if (isEditing) {
          if (typeof onEntryUpdated === 'function') {
            onEntryUpdated({
              ...editingEntry,
              ...finalEntry,
              selections: (finalEntry.selections as HistoryEntry['selections']) ?? [],
            } as HistoryEntry);
          }
          if (typeof onBack === 'function') onBack();
          show('Entry updated successfully!', 'success');
        } else {
          setSubmitMessage('Entry saved successfully! 🎉');
          markdownRef.current?.getInstance?.()?.setMarkdown(DEFAULT_MARKDOWN);
          resetForm();
          resetScaleValues(scales);
          setTimeout(() => onEntrySubmitted(), TIMEOUTS.REDIRECT_DELAY_MS);
        }

      } catch (networkError: unknown) {
        const netErrMsg = networkError instanceof Error ? networkError.message : String(networkError);
        if (!navigator.onLine || netErrMsg.includes('Failed to fetch')) {
          const now = new Date();
          const offlineScaleEntries = getNonNullScaleEntries(scaleValues);

          const payload = {
            mood: selectedMood,
            date: entryDate,
            time: now.toISOString(),
            content: markdownContent,
            selected_options: selectedOptions,
            scale_entries: offlineScaleEntries,
            photos: selectedPhotos,
            audio: audioFiles,
            id: isEditing ? editingEntry?.id : undefined,
            updates: isEditing ? {
              mood: selectedMood,
              content: markdownContent,
              selected_options: selectedOptions,
              scale_entries: offlineScaleEntries
            } : undefined
          };

          const type = isEditing ? 'UPDATE_ENTRY' : 'CREATE_ENTRY';
          await offlineStorage.addToQueue({ type, payload });

          show('Saved offline. Will sync when online.', 'info');

          if (isEditing) {
            if (typeof onBack === 'function') onBack();
          } else {
            setSubmitMessage('Saved offline.');
            markdownRef.current?.getInstance?.()?.setMarkdown(DEFAULT_MARKDOWN);
            resetForm();
            resetScaleValues(scales);
            setTimeout(() => onEntrySubmitted(), TIMEOUTS.REDIRECT_DELAY_MS);
          }
          return;
        }
        throw networkError;
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('Failed to save entry:', error);
      show(`Failed to save entry: ${errMsg}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedMood,
    selectedOptions,
    selectedPhotos,
    audioFiles,
    scaleValues,
    scales,
    entryDate,
    isEditing,
    editingEntry,
    markdownRef,
    onEntryUpdated,
    onBack,
    onEntrySubmitted,
    resetForm,
    resetScaleValues,
    show,
  ]);

  return { isSubmitting, submitMessage, handleSubmit };
}

export { DEFAULT_MARKDOWN };
export type { UseEntrySubmitParams, UseEntrySubmitReturn };
export default useEntrySubmit;
