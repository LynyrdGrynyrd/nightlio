import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Trash2, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';
import { Progress } from '../ui/progress';
import { useToast } from '../ui/ToastProvider';

interface VoiceRecorderProps {
  onRecordingComplete: (file: File) => void;
  onCancel: () => void;
}

const MAX_DURATION_SECONDS = 300; // 5 minutes max

const VoiceRecorder = ({ onRecordingComplete, onCancel }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const { show } = useToast();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Setup Audio Context for Visualizer
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      visualize();

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], "recording.webm", { type: 'audio/webm' });
        if (onRecordingComplete) onRecordingComplete(file);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      show('Could not access microphone. Please check permissions.', 'error');
      if (onCancel) onCancel();
    }
  }, [onRecordingComplete, onCancel, show]);

  const stopRecordingCleanup = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsRecording(false);
  }, []);

  const visualize = () => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserRef.current) return;

    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current!.getByteFrequencyData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      const dangerColor = getComputedStyle(document.documentElement).getPropertyValue('--destructive').trim() || 'rgb(239, 68, 68)';

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 2) * (canvas.height / 128); // Scale to canvas height

        canvasCtx.fillStyle = dangerColor;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();
  };

  useEffect(() => {
    startRecording();
    return () => stopRecordingCleanup();
  }, [startRecording, stopRecordingCleanup]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= MAX_DURATION_SECONDS) {
            stopRecordingCleanup();
          }
          return newDuration;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, stopRecordingCleanup]);

  const handleStop = () => {
    stopRecordingCleanup();
  };

  const handleCancel = () => {
    stopRecordingCleanup();
    if (onCancel) onCancel();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const remainingTime = MAX_DURATION_SECONDS - duration;
  const progressPercent = (duration / MAX_DURATION_SECONDS) * 100;
  const isNearLimit = remainingTime <= 30;

  return (
    <Card className="flex flex-col items-center gap-4 p-6 animate-in fade-in zoom-in duration-200">
      <div className={cn(
        "font-semibold animate-pulse flex items-center gap-2",
        isNearLimit ? "text-[color:var(--warning)]" : "text-destructive"
      )}>
        <div className={cn(
          "w-3 h-3 rounded-full",
          isNearLimit ? "bg-[color:var(--warning)]" : "bg-destructive"
        )} />
        Recording {formatTime(duration)}
        <span className="text-xs text-muted-foreground font-normal">/ {formatTime(MAX_DURATION_SECONDS)}</span>
      </div>

      <Progress
        value={progressPercent}
        className="w-full h-1.5"
        indicatorClassName={cn(isNearLimit ? "bg-[color:var(--warning)]" : "bg-destructive")}
      />

      <div className="w-full bg-muted/50 rounded-lg overflow-hidden border">
        <canvas
          ref={canvasRef}
          width={300}
          height={60}
          className="w-full h-16"
        />
      </div>

      <div className="flex gap-4">
        <Button
          variant="secondary"
          size="icon"
          className="h-12 w-12 rounded-full"
          onClick={handleCancel}
          aria-label="Cancel recording"
          title="Cancel"
        >
          <Trash2 size={20} aria-hidden="true" />
        </Button>
        <Button
          variant="destructive"
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg hover:scale-105 transition-transform"
          onClick={handleStop}
          aria-label="Stop and save recording"
          title="Stop & Save"
        >
          <Square size={20} fill="currentColor" aria-hidden="true" />
        </Button>
      </div>
    </Card>
  );
};

export default VoiceRecorder;
