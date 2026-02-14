import React, { useState, useRef, useCallback } from 'react';
import { EmotionPrediction, predictTopEmotion } from '../utils/emotionAnalyzer';

interface CameraCaptureProps {
  onCapture: (result: EmotionPrediction) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
      console.error('Camera error:', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !isStreaming) return;

    try {
      setIsAnalyzing(true);
      setError(null);

      const prediction = await predictTopEmotion(videoRef.current);

      if (!prediction) {
        setError('No face detected. Please ensure your face is clearly visible.');
        return;
      }

      onCapture(prediction);
      stopCamera();
      onClose();
    } catch (err) {
      setError('Failed to capture or analyze photo');
    } finally {
      setIsAnalyzing(false);
    }
  }, [isStreaming, onCapture, stopCamera, onClose]);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative bg-surface-dark border border-white/10 rounded-2xl shadow-2xl p-6 w-[90vw] max-w-2xl">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition-colors z-10"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-text-light mb-2">Emotion Scan</h3>
          <p className="text-slate-400">Position your face in the camera and capture to analyze your emotion</p>
        </div>

        {/* Video container */}
        <div className="relative mb-6">
          <div className="aspect-[4/3] bg-black rounded-xl overflow-hidden relative">
            {isStreaming ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <span className="material-symbols-outlined text-6xl text-slate-400 mb-4">photo_camera</span>
                  <p className="text-slate-400">Initializing camera...</p>
                </div>
              </div>
            )}
            
            {/* Overlay guide */}
            {isStreaming && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-primary/50 rounded-full"></div>
              </div>
            )}
          </div>

          {/* Loading overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white">Analyzing emotion...</p>
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-surface-dark hover:bg-white/10 text-slate-300 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={capturePhoto}
            disabled={!isStreaming || isAnalyzing}
            className="px-6 py-3 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span className="material-symbols-outlined">photo_camera</span>
            {isAnalyzing ? 'Analyzing...' : 'Capture'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
