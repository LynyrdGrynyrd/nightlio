import { useState, useRef, useEffect, useCallback } from 'react';
import MoodPicker from '../components/mood/MoodPicker';
import MoodDisplay from '../components/mood/MoodDisplay';
import GroupSelector from '../components/groups/GroupSelector';
import GroupManager from '../components/groups/GroupManager';
import MDArea, { MarkdownAreaHandle } from '../components/MarkdownAreaLazy';
import apiService, { Group, Media, API_BASE_URL, Scale, ScaleValuesMap } from '../services/api';
import { useToast } from '../components/ui/ToastProvider';
import PhotoPicker from '../components/media/PhotoPicker';
import TemplateSelector from '../components/entry/TemplateSelector';
import VoiceRecorder from '../components/entry/VoiceRecorder';
import VoicePlayer from '../components/entry/VoicePlayer';
import ScaleSection from '../components/scales/ScaleSection';
import { offlineStorage } from '../services/offlineStorage';
import { Mic, ArrowLeft, Loader2, Save, CalendarIcon, PenLine } from 'lucide-react';
import { TIMEOUTS } from '../constants/appConstants';
import { HistoryEntry } from '../types/entry';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { cn } from '@/lib/utils';
import { badgeVariants } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

/**
 * Extract non-null scale entries from the values map.
 * Used for saving to API and offline storage.
 */
const getNonNullScaleEntries = (values: ScaleValuesMap): Record<number, number> => {
  return Object.entries(values).reduce((acc, [id, value]) => {
    if (value !== null) acc[Number(id)] = value;
    return acc;
  }, {} as Record<number, number>);
};

interface EntryViewProps {
  selectedMood?: number;
  groups: Group[];
  onBack: () => void;
  onCreateGroup: (name: string) => Promise<boolean>;
  onCreateOption: (groupId: number, name: string, icon?: string) => Promise<boolean>;
  onMoveOption: (optionId: number, newGroupId: number) => Promise<void | boolean>;
  onEntrySubmitted: () => void;
  onSelectMood: (mood: number) => void;
  editingEntry?: HistoryEntry | null;
  onEntryUpdated?: (entry: HistoryEntry) => void;
  onEditMoodSelect?: (mood: number) => void;
  targetDate?: string | null;
}

const DEFAULT_MARKDOWN = `# How was your day?

Write about your thoughts, feelings, and experiences...`;

const EntryView = ({
  selectedMood,
  groups,
  onBack,
  onCreateGroup,
  onCreateOption,
  onMoveOption,
  onEntrySubmitted,
  onSelectMood,
  editingEntry = null,
  onEntryUpdated,
  onEditMoodSelect,
  targetDate = null,
}: EntryViewProps) => {
  const isEditing = Boolean(editingEntry);
  const isRetroactiveEntry = Boolean(targetDate) && !isEditing;
  const entryDate = targetDate || new Date().toLocaleDateString();
  const [selectedOptions, setSelectedOptions] = useState<number[]>(
    editingEntry?.selections?.map((selection) => selection.id) ?? []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [showRecorder, setShowRecorder] = useState(false);
  const [existingMedia, setExistingMedia] = useState<Media[]>([]);
  const [scales, setScales] = useState<Scale[]>([]);
  const [scaleValues, setScaleValues] = useState<ScaleValuesMap>({});
  const [scalesLoading, setScalesLoading] = useState(true);
  // API_BASE_URL imported directly
  const markdownRef = useRef<MarkdownAreaHandle>(null);
  const { show } = useToast();

  // Helper to reset scale values to null (skipped state)
  const resetScaleValues = useCallback((scaleList: Scale[]) => {
    const resetValues: ScaleValuesMap = {};
    scaleList.forEach(s => { resetValues[s.id] = null; });
    setScaleValues(resetValues);
  }, []);

  // Load scales on mount
  useEffect(() => {
    let cancelled = false;

    const loadScales = async () => {
      try {
        const fetchedScales = await apiService.getScales();
        if (cancelled) return;
        setScales(fetchedScales);
        // Initialize all scales as null (skipped)
        const initial: ScaleValuesMap = {};
        fetchedScales.forEach(s => { initial[s.id] = null; });
        setScaleValues(initial);
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load scales:', error);
        }
      } finally {
        if (!cancelled) {
          setScalesLoading(false);
        }
      }
    };
    loadScales();

    return () => { cancelled = true; };
  }, []);

  // Load existing scale values when editing
  useEffect(() => {
    if (!isEditing || !editingEntry || scales.length === 0) return;

    let cancelled = false;

    const loadExistingScaleValues = async () => {
      try {
        const existing = await apiService.getEntryScales(editingEntry.id);
        if (cancelled) return;
        const valuesMap: ScaleValuesMap = {};
        // Initialize all scales as null
        scales.forEach(s => { valuesMap[s.id] = null; });
        // Set existing values
        existing.forEach(se => { valuesMap[se.scale_id] = se.value; });
        setScaleValues(valuesMap);
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load existing scale values:', error);
        }
      }
    };
    loadExistingScaleValues();

    return () => { cancelled = true; };
  }, [isEditing, editingEntry, scales]);

  useEffect(() => {
    if (!isEditing || !editingEntry) return;

    setSelectedOptions(editingEntry.selections?.map((selection) => selection.id) ?? []);

    // Use inline media from hydrated entry (no extra API call needed)
    setExistingMedia(editingEntry.media ?? []);

    const instance = markdownRef.current?.getInstance?.();
    if (instance && typeof instance.setMarkdown === 'function') {
      instance.setMarkdown(editingEntry.content || '');
    }
  }, [isEditing, editingEntry]);

  const handleOptionToggle = (optionId: number) => {
    setSelectedOptions(prev => (prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]));
  };

  const handleScaleChange = (scaleId: number, value: number | null) => {
    setScaleValues(prev => ({ ...prev, [scaleId]: value }));
  };

  const handleMoodSelection = (moodValue: number) => {
    if (isEditing) {
      if (typeof onEditMoodSelect === 'function') {
        onEditMoodSelect(moodValue);
      }
    } else if (typeof onSelectMood === 'function') {
      onSelectMood(moodValue);
    }
  };

  const handleMediaDeleted = async (mediaId: number) => {
    try {
      await apiService.deleteMedia(mediaId);
      setExistingMedia(prev => prev.filter(m => m.id !== mediaId));
      show('Photo removed.', 'success');
    } catch {
      show('Failed to remove photo.', 'error');
    }
  };

  const handleSubmit = async () => {
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

        // Upload photos
        if (selectedPhotos.length > 0) {
          await Promise.all(selectedPhotos.map(file => apiService.uploadMedia(entryId, file)));
        }

        // Upload audio
        if (audioFiles.length > 0) {
          await Promise.all(audioFiles.map(file => apiService.uploadMedia(entryId, file)));
        }

        // Save scale entries
        const nonNullScales = getNonNullScaleEntries(scaleValues);
        if (Object.keys(nonNullScales).length > 0) {
          await apiService.saveEntryScales(entryId, nonNullScales);
        }

        // Success Handling
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
          setSelectedOptions([]);
          setSelectedPhotos([]);
          setAudioFiles([]);
          resetScaleValues(scales);
          setTimeout(() => onEntrySubmitted(), TIMEOUTS.REDIRECT_DELAY_MS);
        }

      } catch (networkError: any) {
        // OFFLINE FALLBACK
        if (!navigator.onLine || (networkError.message && networkError.message.includes('Failed to fetch'))) {
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
            setSelectedOptions([]);
            setSelectedPhotos([]);
            setAudioFiles([]);
            resetScaleValues(scales);
            setTimeout(() => onEntrySubmitted(), TIMEOUTS.REDIRECT_DELAY_MS);
          }
          return;
        }
        throw networkError;
      }
    } catch (error: any) {
      console.error('Failed to save entry:', error);
      show(`Failed to save entry: ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedMood && !isEditing) {
    return (
      <div className="max-w-4xl mx-auto py-4 md:py-6 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="gap-2" onClick={onBack}>
            <ArrowLeft size={18} aria-hidden="true" />
            Back
          </Button>
        </div>
        <Card className="border-0 shadow-none bg-transparent">
          <CardContent className="p-0 text-center space-y-6 pt-12">
            <h3 className="text-2xl font-bold tracking-tight">How are you feeling right now?</h3>
            <div className="flex justify-center">
              <MoodPicker onMoodSelect={handleMoodSelection} selectedMood={null} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] py-4 md:py-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={18} aria-hidden="true" />
          {isEditing ? 'Cancel Edit' : 'Back to History'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Metadata & Options */}
        <div className="lg:col-span-5 space-y-8">
          {/* Header Info */}
          <div className="space-y-4">
            {isEditing && editingEntry && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg w-fit">
                <PenLine size={14} aria-hidden="true" />
                Editing entry from <span className="font-semibold text-foreground">{editingEntry.date}</span>
              </div>
            )}
            {isRetroactiveEntry && (
              <div className={cn(badgeVariants({ variant: "outline" }), "bg-[color:var(--warning-soft)] border-[color:var(--warning)] text-[color:var(--warning)] gap-2 py-1.5 px-3 h-auto")}>
                <CalendarIcon size={14} aria-hidden="true" />
                Creating entry for <span className="font-semibold">{entryDate}</span>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <MoodDisplay moodValue={selectedMood ?? 3} />
              {isEditing && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-fit rounded-full">
                      Change Mood
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Pick a new mood</h4>
                      <MoodPicker onMoodSelect={handleMoodSelection} selectedMood={selectedMood || null} />
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Activities</h3>
            </div>
            <GroupSelector
              groups={groups}
              selectedOptions={selectedOptions}
              onOptionToggle={handleOptionToggle}
            />
            <GroupManager
              groups={groups}
              onCreateGroup={onCreateGroup}
              onCreateOption={onCreateOption}
              onMoveOption={onMoveOption}
            />
          </div>

          <Separator />

          <ScaleSection
            scales={scales}
            values={scaleValues}
            onChange={handleScaleChange}
            loading={scalesLoading}
            disabled={isSubmitting}
            defaultExpanded={Object.values(scaleValues).some(v => v !== null)}
          />

          <Separator />

          <PhotoPicker
            existingMedia={existingMedia.filter(m => m.file_type.startsWith('image/'))}
            onFilesSelected={setSelectedPhotos}
            onMediaDeleted={handleMediaDeleted}
          />

          <Separator />

          {/* Voice Notes */}
          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Mic size={16} aria-hidden="true" />
              Voice Notes
            </h4>

            {showRecorder ? (
              <VoiceRecorder
                onRecordingComplete={(file) => {
                  setAudioFiles(prev => [...prev, file]);
                  setShowRecorder(false);
                }}
                onCancel={() => setShowRecorder(false)}
              />
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3 gap-3 border-dashed hover:border-primary/50 hover:bg-muted/50"
                onClick={() => setShowRecorder(true)}
              >
                <div className="w-8 h-8 rounded-full bg-[color:var(--destructive-soft)] text-destructive flex items-center justify-center shrink-0">
                  <Mic size={16} aria-hidden="true" />
                </div>
                <div className="flex flex-col items-start text-sm">
                  <span className="font-medium text-foreground">Record a voice note</span>
                  <span className="text-xs text-muted-foreground">Tap to start recording</span>
                </div>
              </Button>
            )}

            <div className="space-y-2">
              {existingMedia.filter(m => !m.file_type.startsWith('image/')).map((media) => (
                <VoicePlayer
                  key={media.id}
                  src={`${API_BASE_URL}/uploads/${media.file_path}`}
                  onDelete={() => handleMediaDeleted(media.id)}
                />
              ))}

              {audioFiles.map((file, idx) => (
                <VoicePlayer
                  key={`new-${idx}`}
                  src={URL.createObjectURL(file)}
                  onDelete={() => setAudioFiles(prev => prev.filter((_, i) => i !== idx))}
                />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Editor */}
        <div className="lg:col-span-7 flex flex-col h-full space-y-4 lg:border-l lg:pl-8 min-h-[500px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">Journal</h3>
            <TemplateSelector
              onSelectTemplate={(content) => {
                const instance = markdownRef.current?.getInstance?.();
                if (instance && typeof instance.setMarkdown === 'function') {
                  instance.setMarkdown(content);
                }
              }}
            />
          </div>

          <div className="flex-1 border rounded-xl overflow-hidden shadow-sm bg-card">
            <MDArea ref={markdownRef} />
          </div>

          <div className="pt-4 flex justify-end sticky bottom-6 z-10">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              size="lg"
              className="rounded-full shadow-xl px-8 h-12 text-base font-semibold bg-gradient-to-r from-primary to-[color:var(--accent-bg-2)] hover:brightness-95 transition-all font-sans"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" aria-hidden="true" />
                  {isEditing ? 'Save Changes' : 'Save Entry'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {submitMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
            <Card className="w-full max-w-md mx-6 border-none shadow-2xl bg-card">
              <CardContent className="flex flex-col items-center p-10 text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-[color:var(--success-soft)] text-[color:var(--success)] flex items-center justify-center text-4xl animate-bounce">
                🎉
              </div>
              <h3 className="text-2xl font-bold tracking-tight">{submitMessage}</h3>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EntryView;
