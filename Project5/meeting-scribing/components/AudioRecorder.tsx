'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, Square } from 'lucide-react';
import RecordRTC from 'recordrtc';

interface AudioRecorderProps {
  onRecordingStart: () => void;
  onTranscriptChange: (data: { text: string; type: 'partial' | 'final' }) => void;
  onRecordingStop: () => void;
  audioTranscript: string;
}

const AudioRecorder = ({ onRecordingStart, onTranscriptChange, onRecordingStop, audioTranscript }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<RecordRTC | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => cleanup();
  }, []);

  const cleanup = () => {
    setIsRecording(false);
    setIsLoading(false);
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    if (recorderRef.current) {
      recorderRef.current.destroy();
      recorderRef.current = null;
    }
    stopWaveform();
  };

  const startRecording = async () => {
    if (isRecording) return;

    onRecordingStart();
    setIsLoading(true);
    setError(null);

    try {
      // 1. Get user media first
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 2. Fetch token
      const response = await fetch('/api/assemblyai-token');
      const data = await response.json();
      if (response.status !== 200) throw new Error(data.error || 'Failed to fetch token');
      const token = data.token;

      // 3. Open WebSocket
      try {
                    const socket = new WebSocket(`wss://streaming.assemblyai.com/v3/ws?token=${token}`);
                    socketRef.current = socket;
              
                    socket.onmessage = (message) => {
                      const res = JSON.parse(message.data);
                      if (res.message_type === 'PartialTranscript' && res.text) {
                        onTranscriptChange({ text: res.text, type: 'partial' });
                      } else if (res.message_type === 'FinalTranscript' && res.text) {
                        onTranscriptChange({ text: res.text, type: 'final' });
                      }
                    };
              
                    socket.onerror = (event) => {
                      console.error("WebSocket error:", event);
                      setError("WebSocket 연결 오류가 발생했습니다.");
                      cleanup();
                    };
              
                    socket.onclose = (event) => {
                      console.log("WebSocket connection closed:", event);
                    };        socket.onopen = () => {
          console.log('WebSocket connection opened.');
          
          // Send configuration
          socket.send(JSON.stringify({
            sample_rate: 16000,
            language_code: "ko-KR"
          }));

          // 4. Start recording and sending data
          const recorder = new RecordRTC(stream, {
            type: 'audio',
            timeSlice: 450, // Recommended chunk size
            desiredSampRate: 16000,
            numberOfAudioChannels: 1,
            ondataavailable: (blob) => {
              const reader = new FileReader();
              reader.onload = () => {
                const base64data = (reader.result as string).split(',')[1];
                if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                  socketRef.current.send(JSON.stringify({ audio: base64data }));
                }
              };
              reader.readAsDataURL(blob);
            },
          });
          recorderRef.current = recorder;
          recorder.startRecording();
          
          setIsLoading(false);
          setIsRecording(true);
          startWaveform(stream);
        };
      } catch (e) {
        console.error("Failed to construct WebSocket:", e);
        throw e; // Re-throw the error to be caught by the outer catch block
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(`녹음 시작 실패: ${errorMessage}`);
      cleanup();
    }
  };

  const stopRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.stopRecording(() => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          // No termination message needed for v3, just close the socket.
        }
        cleanup();
        if (onRecordingStop) onRecordingStop();
      });
    } else {
      cleanup();
      if (onRecordingStop) onRecordingStop();
    }
  };

  const startWaveform = (stream: MediaStream) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;
    analyserRef.current = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyserRef.current);

    const draw = () => {
      if (!analyserRef.current || !canvasRef.current) return;
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteTimeDomainData(dataArray);
      const canvas = canvasRef.current;
      const canvasCtx = canvas.getContext('2d');
      if (!canvasCtx) return;
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = 'rgb(37, 99, 235)';
      canvasCtx.beginPath();
      const sliceWidth = canvas.width * 1.0 / analyserRef.current.frequencyBinCount;
      let x = 0;
      for (let i = 0; i < analyserRef.current.frequencyBinCount; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;
        if (i === 0) canvasCtx.moveTo(x, y); else canvasCtx.lineTo(x, y);
        x += sliceWidth;
      }
      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
      animationFrameRef.current = requestAnimationFrame(draw);
    };
    draw();
  };

  const stopWaveform = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">실시간 녹음 및 스크립트</h3>
      {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}
      <div className="space-y-4">
        <div className="w-full h-24 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
        <div className="flex items-center justify-center space-x-4">
          {!isRecording ? (
            <button onClick={startRecording} disabled={isLoading} className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
              <Mic className="w-5 h-5" />
              <span>{isLoading ? '연결 중...' : '녹음 시작'}</span>
            </button>
          ) : (
            <button onClick={stopRecording} className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
              <Square className="w-5 h-5" />
                          <span>녹음 중지</span>
                          </button>
                        )}
                      </div>
                      <div className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-lg min-h-[120px] bg-gray-50 dark:bg-gray-900">
                        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                          {audioTranscript}
                        </p>
                      </div>
                    </div>
    </div>
  );
};

export default AudioRecorder;
