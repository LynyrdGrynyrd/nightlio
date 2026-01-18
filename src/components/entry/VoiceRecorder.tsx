import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Trash2 } from 'lucide-react';

// ========== Types ==========

interface VoiceRecorderProps {
  onRecordingComplete: (file: File) => void;
  onCancel: () => void;
}

// ========== Constants ==========

const MAX_DURATION_SECONDS = 300; // 5 minutes max

// ========== Component ==========

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

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Setup Audio Context for Visualizer
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
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
      if (onCancel) onCancel();
    }
  }, [onRecordingComplete, onCancel]);

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

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        canvasCtx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--danger').trim() || '#ef4444';

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
    <div className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
      <div className={`font-semibold animate-pulse flex items-center gap-2 ${isNearLimit ? 'text-orange-500' : 'text-red-500'}`}>
        <div className={`w-3 h-3 rounded-full ${isNearLimit ? 'bg-orange-500' : 'bg-red-500'}`}></div>
        Recording {formatTime(duration)}
        <span className="text-xs text-gray-400 font-normal">/ {formatTime(MAX_DURATION_SECONDS)}</span>
      </div>

      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${isNearLimit ? 'bg-orange-500' : 'bg-red-500'}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <canvas
        ref={canvasRef}
        width={300}
        height={60}
        className="w-full h-16 bg-gray-50 dark:bg-gray-900 rounded-lg"
      />

      <div className="flex gap-4">
        <button
          onClick={handleCancel}
          className="p-4 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
          title="Cancel"
        >
          <Trash2 size={24} />
        </button>
        <button
          onClick={handleStop}
          className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          title="Stop & Save"
        >
          <Square size={24} fill="currentColor" />
        </button>
      </div>
    </div>
  );
};

export default VoiceRecorder;
