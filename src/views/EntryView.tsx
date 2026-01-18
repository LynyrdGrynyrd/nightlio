import { useState, useRef, useEffect, CSSProperties } from 'react';
import MoodPicker from '../components/mood/MoodPicker';
import MoodDisplay from '../components/mood/MoodDisplay';
import GroupSelector from '../components/groups/GroupSelector';
import GroupManager from '../components/groups/GroupManager';
import MDArea from '../components/MarkdownArea.jsx';
import apiService, { Group, Media } from '../services/api';
import { useToast } from '../components/ui/ToastProvider';
import PhotoPicker from '../components/media/PhotoPicker';
import TemplateSelector from '../components/entry/TemplateSelector';
import VoiceRecorder from '../components/entry/VoiceRecorder';
import VoicePlayer from '../components/entry/VoicePlayer';
import { offlineStorage } from '../services/offlineStorage';
import { Mic } from 'lucide-react';
import { useConfig } from '../contexts/ConfigContext';
import { TIMEOUTS } from '../constants/appConstants';
import { HistoryEntry } from '../types/entry';

// ========== Types ==========

interface MarkdownEditorHandle {
  getInstance?: () => {
    setMarkdown: (content: string) => void;
  };
  getMarkdown?: () => string;
}

interface EntryViewProps {
  selectedMood?: number;
  groups: Group[];
  onBack: () => void;
  onCreateGroup: (name: string) => Promise<void>;
  onCreateOption: (groupId: number, name: string, icon: string) => Promise<void>;
  onMoveOption: (optionId: number, fromGroupId: number, toGroupId: number) => Promise<void>;
  onEntrySubmitted: () => void;
  onSelectMood: (mood: number) => void;
  editingEntry?: HistoryEntry | null;
  onEntryUpdated?: (entry: HistoryEntry) => void;
  onEditMoodSelect?: (mood: number) => void;
  targetDate?: string | null;
}

// ========== Constants ==========

const DEFAULT_MARKDOWN = `# How was your day?

Write about your thoughts, feelings, and experiences...`;

// ========== Component ==========

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
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [showRecorder, setShowRecorder] = useState(false);
  const [existingMedia, setExistingMedia] = useState<Media[]>([]);
  const { API_BASE_URL } = useConfig();
  const markdownRef = useRef<MarkdownEditorHandle>(null);
  const { show } = useToast();

  useEffect(() => {
    if (!isEditing || !editingEntry) return;

    setSelectedOptions(editingEntry.selections?.map((selection) => selection.id) ?? []);

    // Load existing media
    apiService.getEntryMedia(editingEntry.id).then(setExistingMedia).catch(console.error);

    const instance = markdownRef.current?.getInstance?.();
    if (instance && typeof instance.setMarkdown === 'function') {
      instance.setMarkdown(editingEntry.content || '');
    }
  }, [isEditing, editingEntry]);

  const handleOptionToggle = (optionId: number) => {
    setSelectedOptions(prev => (prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]));
  };

  const handleMoodSelection = (moodValue: number) => {
    if (isEditing) {
      if (typeof onEditMoodSelect === 'function') {
        onEditMoodSelect(moodValue);
      }
      setShowMoodPicker(false);
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
      let finalEntry: any;

      // Online logic attempt
      try {
        if (isEditing && editingEntry) {
          const response = await apiService.updateMoodEntry(editingEntry.id, {
            mood: selectedMood,
            content: markdownContent,
            selected_options: selectedOptions,
          });
          entryId = editingEntry.id;
          finalEntry = response.entry;
        } else {
          const now = new Date();
          const response = await apiService.createMoodEntry({
            mood: selectedMood,
            date: entryDate,
            time: now.toISOString(),
            content: markdownContent,
            selected_options: selectedOptions,
          });
          entryId = response.entry.id;
          finalEntry = response.entry;

          if (response.new_achievements && response.new_achievements.length > 0) {
            // Achievements toast handled by response usually or we can show it
          }
        }

        // Upload photos
        if (selectedPhotos.length > 0) {
          await Promise.all(selectedPhotos.map(file => apiService.uploadMedia(entryId, file)));
        }

        // Upload audio
        if (audioFiles.length > 0) {
          await Promise.all(audioFiles.map(file => apiService.uploadMedia(entryId, file)));
        }

        // Success Handling
        if (isEditing) {
          if (typeof onEntryUpdated === 'function') {
            onEntryUpdated({
              ...editingEntry,
              ...finalEntry,
              selections: finalEntry.selections ?? [],
            });
          }
          if (typeof onBack === 'function') onBack();
          show('Entry updated successfully!', 'success');
        } else {
          setSubmitMessage('Entry saved successfully! 🎉');
          markdownRef.current?.getInstance?.()?.setMarkdown(DEFAULT_MARKDOWN);
          setSelectedOptions([]);
          setSelectedPhotos([]);
          setAudioFiles([]);
          setTimeout(() => onEntrySubmitted(), TIMEOUTS.REDIRECT_DELAY_MS);
        }

      } catch (networkError: any) {
        // OFFLINE FALLBACK
        if (!navigator.onLine || (networkError.message && networkError.message.includes('Failed to fetch'))) {
          const now = new Date();
          const payload = {
            mood: selectedMood,
            date: entryDate,
            time: now.toISOString(),
            content: markdownContent,
            selected_options: selectedOptions,
            photos: selectedPhotos,
            audio: audioFiles,
            id: isEditing ? editingEntry?.id : undefined,
            updates: isEditing ? {
              mood: selectedMood,
              content: markdownContent,
              selected_options: selectedOptions
            } : undefined
          };

          const type = isEditing ? 'UPDATE_ENTRY' : 'CREATE_ENTRY';
          await offlineStorage.addToQueue({ type, payload });

          show('Saved offline. Will sync when online.', 'info');

          // Mimic success UI
          if (isEditing) {
            if (typeof onBack === 'function') onBack();
          } else {
            setSubmitMessage('Saved offline.');
            markdownRef.current?.getInstance?.()?.setMarkdown(DEFAULT_MARKDOWN);
            setSelectedOptions([]);
            setSelectedPhotos([]);
            setAudioFiles([]);
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

  const buttonStyle: CSSProperties = {
    padding: '0.5rem 1rem',
    background: 'var(--accent-bg)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-pill)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    boxShadow: 'var(--shadow-md)',
  };

  if (!selectedMood && !isEditing) {
    return (
      <div style={{ marginTop: '1rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <button onClick={onBack} style={buttonStyle}>
            {isEditing ? '← Cancel Edit' : '← Back'}
          </button>
        </div>
        <h3 style={{ marginTop: 0 }}>
          {isEditing ? 'Pick a new mood for this entry' : 'Pick your mood to start an entry'}
        </h3>
        <MoodPicker onMoodSelect={handleMoodSelection} />
      </div>
    );
  }

  return (
    <div className="entry-container" style={{ marginTop: '1rem', position: 'relative' }}>
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={onBack} style={buttonStyle}>
          {isEditing ? '← Cancel Edit' : '← Back to History'}
        </button>
      </div>

      <div className="entry-grid">
        <div className="entry-left">
          {isEditing && editingEntry && (
            <div style={{
              marginBottom: '0.75rem',
              fontSize: '0.85rem',
              color: 'color-mix(in oklab, var(--text), transparent 40%)'
            }}>
              Editing entry from <strong style={{ color: 'var(--text)' }}>{editingEntry.date}</strong>
            </div>
          )}
          {isRetroactiveEntry && (
            <div style={{
              marginBottom: '0.75rem',
              padding: '0.6rem 1rem',
              borderRadius: '12px',
              background: 'var(--accent-bg-softer)',
              border: '1px solid var(--accent-200)',
              fontSize: '0.9rem',
              color: 'var(--text)'
            }}>
              📅 Creating entry for <strong style={{ color: 'var(--accent-600)' }}>{entryDate}</strong>
            </div>
          )}
          <div style={{ marginBottom: '1rem' }}>
            <MoodDisplay moodValue={selectedMood} />
            {isEditing && (
              <button
                type="button"
                onClick={() => setShowMoodPicker(true)}
                style={{
                  marginTop: '0.75rem',
                  padding: '0.4rem 0.9rem',
                  borderRadius: '999px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                }}
              >
                Change mood
              </button>
            )}
          </div>
          {isEditing && showMoodPicker && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '1rem',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <p style={{ marginTop: 0, marginBottom: '0.75rem', fontWeight: 600, color: 'var(--text)' }}>
                Pick a new mood
              </p>
              <MoodPicker
                onMoodSelect={handleMoodSelection}
                selectedMood={selectedMood}
              />
              <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={() => setShowMoodPicker(false)}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '999px',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    color: 'color-mix(in oklab, var(--text), transparent 30%)'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          <GroupSelector
            groups={groups}
            selectedOptions={selectedOptions}
            onOptionToggle={handleOptionToggle}
          />
          <div style={{ marginTop: '1rem' }}>
            <GroupManager
              groups={groups}
              onCreateGroup={onCreateGroup}
              onCreateOption={onCreateOption}
              onMoveOption={onMoveOption}
            />
          </div>
          <PhotoPicker
            existingMedia={existingMedia.filter(m => m.file_type.startsWith('image/'))}
            onFilesSelected={setSelectedPhotos}
            onMediaDeleted={handleMediaDeleted}
          />

          {/* Voice Recording Section */}
          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] mb-3">
              <Mic size={16} />
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
              <button
                onClick={() => setShowRecorder(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--accent-bg-soft)] hover:text-[var(--accent-600)] hover:border-[var(--accent-600)] transition-all w-full justify-center"
              >
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center">
                  <Mic size={18} />
                </div>
                <span>Record a voice note</span>
              </button>
            )}

            <div className="flex flex-col gap-3 mt-4">
              {/* Existing Audio */}
              {existingMedia.filter(m => !m.file_type.startsWith('image/')).map((media) => (
                <VoicePlayer
                  key={media.id}
                  src={`${API_BASE_URL}/uploads/${media.file_path}`}
                  onDelete={() => handleMediaDeleted(media.id)}
                />
              ))}

              {/* New Audio (Before Upload) */}
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

        <div className="entry-right">
          <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
            <TemplateSelector
              onSelectTemplate={(content) => {
                const instance = markdownRef.current?.getInstance?.();
                if (instance && typeof instance.setMarkdown === 'function') {
                  instance.setMarkdown(content);
                }
              }}
            />
          </div>
          <MDArea ref={markdownRef} />
          <div className="entry-savebar">
            <button
              disabled={isSubmitting}
              onClick={handleSubmit}
              style={{
                padding: '0.9rem 2rem',
                fontSize: '1rem',
                background: 'linear-gradient(135deg, var(--accent-bg), var(--accent-bg-2))',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                cursor: !isSubmitting ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                fontWeight: '600',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Save Entry'}
            </button>
          </div>
        </div>
      </div>

      {submitMessage && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            zIndex: 10,
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              padding: '2rem',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-3)',
              border: '1px solid var(--border)',
              textAlign: 'center',
              minWidth: '300px',
              maxWidth: 'min(560px, 90%)',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <div style={{
              color: submitMessage.includes('achievement') ? 'var(--accent-600)' : 'var(--text)',
              fontWeight: '600',
              fontSize: '1.1rem',
              lineHeight: '1.4'
            }}>
              {submitMessage}
            </div>
          </div>
        </div>
      )}

      {submitMessage && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--overlay)',
            zIndex: 5
          }}
        />
      )}
    </div>
  );
};

export default EntryView;
