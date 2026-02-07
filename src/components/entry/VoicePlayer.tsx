import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Trash2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { cn } from '@/lib/utils';
import { Card } from '../ui/card';

interface VoicePlayerProps {
  src: string;
  onDelete?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  className?: string; // Added className prop for flexibility
}

const VoicePlayer = ({ src, onDelete, onPlay, onPause, className }: VoicePlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        if (onPause) onPause();
      } else {
        audioRef.current.play();
        if (onPlay) onPlay();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (values: number[]) => {
    const newVal = values[0];
    const newTime = (newVal / 100) * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setProgress(newVal);
    }
  };

  const formatTime = (time: number): string => {
    if (!time || isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <Card className={cn("flex items-center gap-3 p-3 w-full max-w-md", className)}>
      <audio ref={audioRef} src={src} preload="metadata" />

      <Button
        onClick={togglePlay}
        size="icon"
        className="h-10 w-10 shrink-0 rounded-full"
      >
        {isPlaying ? (
          <Pause size={18} fill="currentColor" />
        ) : (
          <Play size={18} fill="currentColor" className="ml-0.5" />
        )}
      </Button>

      <div className="flex-1 flex flex-col justify-center gap-1.5 px-1">
        <Slider
          value={[progress || 0]}
          max={100}
          step={0.1}
          onValueChange={handleSeek}
          className="cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground font-medium tabular-nums px-0.5">
          <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </Button>

        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            title="Delete recording"
          >
            <Trash2 size={16} />
          </Button>
        )}
      </div>
    </Card>
  );
};

export default VoicePlayer;
