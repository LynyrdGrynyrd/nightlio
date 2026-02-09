import { useState, useRef, useEffect, useCallback } from 'react';
import { useReducedMotion } from 'framer-motion';
import MoodPicker from '../components/mood/MoodPicker';
import MoodDisplay from '../components/mood/MoodDisplay';
import GroupSelector from '../components/groups/GroupSelector';
import GroupManager from '../components/groups/GroupManager';
import MDArea, { MarkdownAreaHandle } from '../components/MarkdownAreaLazy';
import apiService, { Group, Media, Scale, ScaleValuesMap } from '../services/api';
import { useToast } from '../components/ui/ToastProvider';
import PhotoPicker from '../components/media/PhotoPicker';
import TemplateSelector from '../components/entry/TemplateSelector';
import JournalPromptBar from '../components/entry/JournalPromptBar';
import WordCountIndicator from '../components/entry/WordCountIndicator';
import EntryVoiceNotes from '../components/entry/EntryVoiceNotes';
import ScaleSection from '../components/scales/ScaleSection';
import useEntrySubmit from '../hooks/useEntrySubmit';
import { ArrowLeft, Loader2, Save, CalendarIcon, PenLine } from 'lucide-react';
import { HistoryEntry } from '../types/entry';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { cn } from '@/lib/utils';
import { badgeVariants } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { isPositiveMood, launchMoodCelebration } from '@/utils/celebration';
import type { JournalPrompt } from '../data/journalPrompts';

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
  const prefersReducedMotion = useReducedMotion();
  const isEditing = Boolean(editingEntry);
  const isRetroactiveEntry = Boolean(targetDate) && !isEditing;
  const entryDate = targetDate || new Date().toLocaleDateString();
  const [selectedOptions, setSelectedOptions] = useState<number[]>(
    editingEntry?.selections?.map((selection) => selection.id) ?? []
  );
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [existingMedia, setExistingMedia] = useState<Media[]>([]);
  const [scales, setScales] = useState<Scale[]>([]);
  const [scaleValues, setScaleValues] = useState<ScaleValuesMap>({});
  const [scalesLoading, setScalesLoading] = useState(true);
  const markdownRef = useRef<MarkdownAreaHandle>(null);
  const [editorContent, setEditorContent] = useState('');
  const [weeklyWordCount, setWeeklyWordCount] = useState<number | undefined>();
  const { show } = useToast();

  const resetScaleValues = useCallback((scaleList: Scale[]) => {
    const resetValues: ScaleValuesMap = {};
    scaleList.forEach(s => { resetValues[s.id] = null; });
    setScaleValues(resetValues);
  }, []);

  const resetForm = useCallback(() => {
    setSelectedOptions([]);
    setSelectedPhotos([]);
    setAudioFiles([]);
  }, []);

  const { isSubmitting, submitMessage, handleSubmit } = useEntrySubmit({
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
  });

  useEffect(() => {
    if (!submitMessage || !isPositiveMood(selectedMood ?? null) || prefersReducedMotion) return;
    void launchMoodCelebration({
      mood: selectedMood ?? null,
      reducedMotion: false,
    });
  }, [submitMessage, selectedMood, prefersReducedMotion]);

  // Load weekly word count on mount
  useEffect(() => {
    let cancelled = false;
    apiService.getJournalStats()
      .then(stats => { if (!cancelled) setWeeklyWordCount(stats.weekly_word_count); })
      .catch(() => { /* endpoint may not exist yet */ });
    return () => { cancelled = true; };
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

  const handleApplyPrompt = useCallback((prompt: JournalPrompt) => {
    const instance = markdownRef.current?.getInstance?.();
    if (instance && typeof instance.setMarkdown === 'function') {
      instance.setMarkdown(`## ${prompt.text}\n\n`);
    }
  }, []);

  const handleInsertStarter = useCallback((text: string) => {
    const instance = markdownRef.current?.getInstance?.();
    if (instance && typeof instance.setMarkdown === 'function') {
      const current = markdownRef.current?.getMarkdown?.() || '';
      const trimmed = current.trim();
      // Replace default placeholder or append
      const isDefault = trimmed === '# How was your day?\n\nWrite about your thoughts, feelings, and experiences...'.trim()
        || trimmed === '# How was your day?\n\nWrite about your thoughts, feelings, and experiences...'
        || trimmed.length === 0;
      instance.setMarkdown(isDefault ? text : `${current}\n\n${text}`);
    }
  }, []);

  const handleMediaDeleted = async (mediaId: number) => {
    try {
      await apiService.deleteMedia(mediaId);
      setExistingMedia(prev => prev.filter(m => m.id !== mediaId));
      show('Photo removed.', 'success');
    } catch {
      show('Failed to remove photo.', 'error');
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
        <Card className="border-border/60 bg-card/80">
          <CardContent className="p-6 md:p-10 text-center space-y-7">
            <div className={cn("mx-auto h-28 w-28 rounded-full border border-border/60 bg-[color:var(--accent-bg-softer)] flex items-center justify-center", !prefersReducedMotion && "breathe-soft")}>
              <span className="font-journal text-sm text-muted-foreground">Take one breath</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold tracking-tight">How are you feeling right now?</h3>
              <p className="text-sm text-muted-foreground font-journal">Pick the feeling that matches this moment. You can add details right after.</p>
            </div>
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
          {isEditing ? 'Cancel Edit' : 'Back to Journal'}
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
                Editing reflection from <span className="font-semibold text-foreground">{editingEntry.date}</span>
              </div>
            )}
            {isRetroactiveEntry && (
              <div className={cn(badgeVariants({ variant: "outline" }), "bg-[color:var(--warning-soft)] border-[color:var(--warning)] text-[color:var(--warning)] gap-2 py-1.5 px-3 h-auto")}>
                <CalendarIcon size={14} aria-hidden="true" />
                Creating reflection for <span className="font-semibold">{entryDate}</span>
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
              <h3 className="font-semibold text-lg">Moments & Activities</h3>
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

          <EntryVoiceNotes
            existingMedia={existingMedia}
            audioFiles={audioFiles}
            onRecordingComplete={(file) => setAudioFiles(prev => [...prev, file])}
            onAudioFileRemove={(idx) => setAudioFiles(prev => prev.filter((_, i) => i !== idx))}
            onMediaDeleted={handleMediaDeleted}
          />
        </div>

        {/* RIGHT COLUMN: Editor */}
        <div className="lg:col-span-7 flex flex-col h-full space-y-4 lg:border-l lg:pl-8 min-h-[500px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">Journal Reflection</h3>
            <TemplateSelector
              onSelectTemplate={(content) => {
                const instance = markdownRef.current?.getInstance?.();
                if (instance && typeof instance.setMarkdown === 'function') {
                  instance.setMarkdown(content);
                }
              }}
            />
          </div>

          {selectedMood && (
            <JournalPromptBar
              mood={selectedMood}
              onInsertText={handleInsertStarter}
              onApplyPrompt={handleApplyPrompt}
              hasContent={editorContent.length > 20}
              isEditing={isEditing}
            />
          )}

          <div className="flex-1 border rounded-[calc(var(--radius)+2px)] overflow-hidden shadow-sm bg-card font-journal">
            <MDArea ref={markdownRef} onChange={setEditorContent} />
          </div>

          <WordCountIndicator content={editorContent} weeklyTotal={weeklyWordCount} />

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
                  {isEditing ? 'Save Changes' : 'Save Reflection'}
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
