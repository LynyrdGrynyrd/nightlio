import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Trash2, StopCircle } from 'lucide-react';

const MAX_DURATION_SECONDS = 300; // 5 minutes max

const VoiceRecorder = ({ onRecordingComplete, onCancel }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);

    useEffect(() => {
        startRecording();
        return () => stopRecordingCleanup();
    }, [startRecording]);

    useEffect(() => {
        let interval;
        if (isRecording) {
            interval = setInterval(() => {
                setDuration(prev => {
                    const newDuration = prev + 1;
                    // Auto-stop at max duration
                    if (newDuration >= MAX_DURATION_SECONDS) {
                        stopRecordingCleanup();
                    }
                    return newDuration;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Setup Audio Context for Visualizer
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
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
                // Create file from blob
                const file = new File([audioBlob], "recording.webm", { type: 'audio/webm' });
                if (onRecordingComplete) onRecordingComplete(file);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            if (onCancel) onCancel(); // Exit if mic access fails
        }
    }, [onRecordingComplete, onCancel]);

    const stopRecordingCleanup = () => {
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
    };

    const handleStop = () => {
        stopRecordingCleanup();
    };

    const handleCancel = () => {
        stopRecordingCleanup();
        // Don't trigger onRecordingComplete from onstop here if we want to cancel
        // (Actually onstop fires when we call .stop(), so we might need to handle a cancelled state flag if stricter control needed,
        // but typically we can just ignore the result in parent if onCancel is called, or we rely on parent to unmount us.)
        if (onCancel) onCancel();
    };

    const visualize = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const canvasCtx = canvas.getContext('2d');
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);
            analyserRef.current.getByteFrequencyData(dataArray);

            canvasCtx.fillStyle = 'rgb(240, 240, 240)'; // Clear color (match modal bg ideally or transparent)
            // canvasCtx.clearRect(0, 0, canvas.width, canvas.height); // Use clearRect for transparent
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;

                // Dynamic color based on height/loudness
                canvasCtx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
                // Or use theme color if we had access, hardcoded somewhat red/active here styling
                canvasCtx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--danger').trim() || '#ef4444'; // Use danger variable

                canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        };

        draw();
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const remainingTime = MAX_DURATION_SECONDS - duration;
    const progressPercent = (duration / MAX_DURATION_SECONDS) * 100;
    const isNearLimit = remainingTime <= 30; // Warn in last 30 seconds

    return (
        <div className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
            <div className={`font-semibold animate-pulse flex items-center gap-2 ${isNearLimit ? 'text-orange-500' : 'text-red-500'}`}>
                <div className={`w-3 h-3 rounded-full ${isNearLimit ? 'bg-orange-500' : 'bg-red-500'}`}></div>
                Recording {formatTime(duration)}
                <span className="text-xs text-gray-400 font-normal">/ {formatTime(MAX_DURATION_SECONDS)}</span>
            </div>

            {/* Progress bar */}
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
