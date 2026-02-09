import { useState } from 'react';
import { Mic } from 'lucide-react';
import { Media, API_BASE_URL } from '../../services/api';
import VoiceRecorder from './VoiceRecorder';
import VoicePlayer from './VoicePlayer';
import { Button } from '../ui/button';

interface EntryVoiceNotesProps {
  existingMedia: Media[];
  audioFiles: File[];
  onRecordingComplete: (file: File) => void;
  onAudioFileRemove: (index: number) => void;
  onMediaDeleted: (mediaId: number) => void;
}

const EntryVoiceNotes = ({
  existingMedia,
  audioFiles,
  onRecordingComplete,
  onAudioFileRemove,
  onMediaDeleted,
}: EntryVoiceNotesProps) => {
  const [showRecorder, setShowRecorder] = useState(false);

  const existingAudio = existingMedia.filter(m => !m.file_type.startsWith('image/'));

  return (
    <div className="space-y-4">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Mic size={16} aria-hidden="true" />
        Voice Notes
      </h4>

      {showRecorder ? (
        <VoiceRecorder
          onRecordingComplete={(file) => {
            onRecordingComplete(file);
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
        {existingAudio.map((media) => (
          <VoicePlayer
            key={media.id}
            src={`${API_BASE_URL}/uploads/${media.file_path}`}
            onDelete={() => onMediaDeleted(media.id)}
          />
        ))}

        {audioFiles.map((file, idx) => (
          <VoicePlayer
            key={`new-${idx}`}
            src={URL.createObjectURL(file)}
            onDelete={() => onAudioFileRemove(idx)}
          />
        ))}
      </div>
    </div>
  );
};

export default EntryVoiceNotes;
