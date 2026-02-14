
import React, { useEffect, useMemo, useRef, useState } from 'react';

interface AudioJournalCardProps {
  onTranscript: (finalText: string) => void;
  language?: string;
}

const AudioJournalCard: React.FC<AudioJournalCardProps> = ({ onTranscript, language = 'en-US' }) => {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const wantsRecordingRef = useRef(false);
  const startingRef = useRef(false);
  const lastErrorRef = useRef<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<string>('unknown');
  const [activeDeviceLabel, setActiveDeviceLabel] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [events, setEvents] = useState<string[]>([]);

  const SpeechRecognitionCtor = useMemo(() => {
    return window.SpeechRecognition || window.webkitSpeechRecognition;
  }, []);

  useEffect(() => {
    if (!SpeechRecognitionCtor) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;

    const pushEvent = (msg: string) => {
      setEvents(prev => {
        const next = [`${new Date().toLocaleTimeString()} - ${msg}`, ...prev];
        return next.slice(0, 8);
      });
    };

    const rAny = recognition as any;
    rAny.onstart = () => pushEvent('recognition start');
    rAny.onaudiostart = () => pushEvent('recognition audiostart');
    rAny.onspeechstart = () => pushEvent('recognition speechstart');
    rAny.onspeechend = () => pushEvent('recognition speechend');
    rAny.onaudioend = () => pushEvent('recognition audioend');

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      pushEvent('recognition result');
      let finalChunk = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = (result[0]?.transcript || '').trim();
        if (!transcript) continue;

        if (result.isFinal) {
          finalChunk += (finalChunk ? ' ' : '') + transcript;
        } else {
          interim = transcript;
        }
      }

      if (finalChunk) {
        setInterimText('');
        onTranscript(finalChunk + '\n');
      } else {
        setInterimText(interim);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const code = event.error || 'Speech recognition error';
      lastErrorRef.current = code;
      pushEvent(`recognition error: ${code}`);

      if (code === 'no-speech') {
        setError('No speech detected. Check your mic and try speaking a bit louder/closer.');
        return;
      }

      if (code === 'not-allowed' || code === 'service-not-allowed') {
        setError('Microphone permission blocked. Allow mic access in your browser site settings and try again.');
      } else if (code === 'audio-capture') {
        setError('No microphone detected. Make sure a mic is connected and selected as the active input device.');
      } else {
        setError(code);
      }

      wantsRecordingRef.current = false;
      setIsRecording(false);
    };

    recognition.onend = () => {
      pushEvent('recognition end');
      setInterimText('');
      if (!wantsRecordingRef.current) {
        setIsRecording(false);
        return;
      }

      const shouldRestart = lastErrorRef.current === 'no-speech' || lastErrorRef.current === null;
      if (!shouldRestart) {
        setIsRecording(false);
        wantsRecordingRef.current = false;
        return;
      }

      window.setTimeout(() => {
        if (!wantsRecordingRef.current) return;
        const r = recognitionRef.current;
        if (!r) return;
        try {
          r.start();
          setIsRecording(true);
        } catch {
          setError('Could not restart speech recognition. Please stop and start again.');
          wantsRecordingRef.current = false;
          setIsRecording(false);
        }
      }, 300);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch {
        // ignore
      }
      try {
        mediaStreamRef.current?.getTracks().forEach(t => t.stop());
      } catch {
        // ignore
      }
      mediaStreamRef.current = null;
      try {
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
        }
      } catch {
        // ignore
      }
      rafIdRef.current = null;
      try {
        audioContextRef.current?.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
      analyserRef.current = null;
      recognitionRef.current = null;
    };
  }, [SpeechRecognitionCtor, language, onTranscript]);

  useEffect(() => {
    const run = async () => {
      try {
        const permsAny = (navigator as any).permissions;
        if (!permsAny?.query) {
          setPermissionState('unsupported');
          return;
        }
        const status = await permsAny.query({ name: 'microphone' });
        setPermissionState(status.state || 'unknown');
        status.onchange = () => setPermissionState(status.state || 'unknown');
      } catch {
        setPermissionState('unknown');
      }
    };
    void run();
  }, []);

  const startMeter = (stream: MediaStream) => {
    try {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    } catch {
      // ignore
    }
    rafIdRef.current = null;

    try {
      audioContextRef.current?.close();
    } catch {
      // ignore
    }

    const AudioContextCtor = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
    if (!AudioContextCtor) return;

    const ctx = new AudioContextCtor();
    audioContextRef.current = ctx;

    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyserRef.current = analyser;
    source.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      const a = analyserRef.current;
      if (!a) return;
      a.getByteTimeDomainData(data);
      let sumSq = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sumSq += v * v;
      }
      const rms = Math.sqrt(sumSq / data.length);
      setAudioLevel(rms);
      rafIdRef.current = requestAnimationFrame(tick);
    };
    rafIdRef.current = requestAnimationFrame(tick);
  };

  const startRecording = async () => {
    if (!isSupported) return;
    if (!recognitionRef.current) return;
    if (startingRef.current) return;

    startingRef.current = true;
    lastErrorRef.current = null;
    setError(null);
    setInterimText('');

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Microphone access is not available in this browser.');
        wantsRecordingRef.current = false;
        setIsRecording(false);
        return;
      }

      if (!mediaStreamRef.current) {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const track = mediaStreamRef.current.getAudioTracks()[0];
      setActiveDeviceLabel(track?.label || '');
      startMeter(mediaStreamRef.current);

      recognitionRef.current.start();
      setIsRecording(true);
    } catch (e: any) {
      const message = typeof e?.message === 'string' ? e.message : 'Could not start speech recognition.';
      setError(message);
      wantsRecordingRef.current = false;
      setIsRecording(false);
      try {
        mediaStreamRef.current?.getTracks().forEach(t => t.stop());
      } catch {
        // ignore
      }
      mediaStreamRef.current = null;
      try {
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
        }
      } catch {
        // ignore
      }
      rafIdRef.current = null;
      try {
        audioContextRef.current?.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
      analyserRef.current = null;
      setAudioLevel(0);
    } finally {
      startingRef.current = false;
    }
  };

  const stopRecording = () => {
    const recognition = recognitionRef.current;
    try {
      recognition?.stop();
    } catch {
      // ignore
    }
    try {
      mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    } catch {
      // ignore
    }
    mediaStreamRef.current = null;
    try {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    } catch {
      // ignore
    }
    rafIdRef.current = null;
    try {
      audioContextRef.current?.close();
    } catch {
      // ignore
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    setIsRecording(false);
    setInterimText('');
    setAudioLevel(0);
  };

  const toggleRecording = () => {
    if (!isSupported) return;

    if (wantsRecordingRef.current || isRecording) {
      wantsRecordingRef.current = false;
      stopRecording();
      return;
    }

    wantsRecordingRef.current = true;
    void startRecording();
  };

  return (
    <div className="bg-gradient-to-br from-surface-dark to-surface-dark/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-accent-teal/30 transition-all">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <span className="material-symbols-outlined text-9xl text-accent-teal">mic</span>
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-accent-teal font-bold text-lg flex items-center gap-2">
            <span className="material-symbols-outlined">mic</span> Audio Journal
          </h3>
          <button
            onClick={() => setShowDiagnostics(v => !v)}
            className="bg-accent-teal/10 text-accent-teal text-xs px-2 py-1 rounded-full border border-accent-teal/20 hover:bg-accent-teal/15"
          >
            {showDiagnostics ? 'Hide' : 'Show'}
          </button>
        </div>
        <p className="text-slate-300 text-sm mb-4">Speak your mind. We'll transcribe your thoughts directly into your journal.</p>

        {!isSupported ? (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-300 text-xs">
              Speech recognition is not supported in this browser. Try Chrome or Edge.
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-center py-4">
              <button
                onClick={toggleRecording}
                className={`group/mic relative w-20 h-20 rounded-full bg-surface-dark border-2 flex items-center justify-center transition-all duration-300 ${
                  isRecording
                    ? 'border-red-400 shadow-[0_0_30px_rgba(248,113,113,0.35)]'
                    : 'border-accent-teal shadow-[0_0_20px_rgba(46,196,182,0.2)] hover:shadow-[0_0_30px_rgba(46,196,182,0.4)]'
                }`}
              >
                {isRecording && (
                  <div className="absolute inset-0 bg-red-400 rounded-full opacity-10 animate-ping"></div>
                )}
                <span
                  className={`material-symbols-outlined text-4xl transition-transform ${
                    isRecording ? 'text-red-300' : 'text-accent-teal group-hover/mic:scale-110'
                  }`}
                >
                  {isRecording ? 'stop_circle' : 'mic'}
                </span>
              </button>
            </div>

            <p className="text-center text-xs text-slate-500 mt-1">
              {isRecording ? 'Listening… speak now (click to stop)' : 'Tap to start recording'}
            </p>

            {showDiagnostics && (
              <div className="mt-4 p-3 bg-surface-dark/40 border border-white/10 rounded-lg">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Permission</span>
                    <span className="text-xs text-slate-200">{permissionState}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Input device</span>
                    <span className="text-xs text-slate-200 truncate max-w-[180px]">{activeDeviceLabel || '—'}</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">Audio level</span>
                      <span className="text-xs text-slate-200">{Math.round(audioLevel * 100)}</span>
                    </div>
                    <div className="h-2 rounded bg-white/10 overflow-hidden">
                      <div
                        className="h-2 bg-accent-teal"
                        style={{ width: `${Math.min(100, Math.round(audioLevel * 400))}%` }}
                      ></div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      If this stays at 0 while you speak, Edge is not receiving mic audio.
                    </p>
                  </div>

                  {events.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Recognition events</p>
                      <div className="max-h-28 overflow-auto bg-black/20 rounded p-2 border border-white/5">
                        {events.map((e, idx) => (
                          <div key={idx} className="text-[11px] text-slate-300 whitespace-nowrap">
                            {e}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {interimText && (
              <div className="mt-4 p-3 bg-accent-teal/10 border border-accent-teal/20 rounded-lg">
                <p className="text-slate-200 text-sm">{interimText}</p>
                <p className="text-xs text-slate-500 mt-1">(live transcript)</p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-300 text-xs">{error}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AudioJournalCard;
