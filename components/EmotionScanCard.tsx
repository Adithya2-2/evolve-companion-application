
import React, { useState } from 'react';
import CameraCapture from './CameraCapture';
import ImageUpload from './ImageUpload';
import { EmotionPrediction } from '../utils/emotionAnalyzer';

interface EmotionScanCardProps {
  onEmotionDetected?: (emotion: string, confidence: number) => void;
}

const EmotionScanCard: React.FC<EmotionScanCardProps> = ({ onEmotionDetected }) => {
  const [showCamera, setShowCamera] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [lastResult, setLastResult] = useState<EmotionPrediction | null>(null);

  const handleEmotionResult = (result: EmotionPrediction) => {
    setLastResult(result);
    onEmotionDetected?.(result.emotion, result.confidence);
  };

  const handleCameraClose = () => {
    setShowCamera(false);
  };

  const handleUploadClose = () => {
    setShowUpload(false);
  };
  return (
    <div className="bg-gradient-to-br from-surface-dark to-surface-dark/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-primary/30 transition-all">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <span className="material-symbols-outlined text-9xl text-primary">sentiment_satisfied</span>
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-primary font-bold text-lg flex items-center gap-2">
            <span className="material-symbols-outlined">sentiment_satisfied</span> Emotion Scan
          </h3>
        </div>
        <p className="text-slate-300 text-sm mb-6">Let Evolve analyze your expressions to track your emotional journey.</p>
        
        {/* Last result display */}
        {lastResult && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-primary">Last Detection</span>
              <span className="text-xs text-slate-400">
                {Math.round(lastResult.confidence * 100)}% confidence
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-light font-medium">{lastResult.emotion}</span>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowCamera(true)}
            className="aspect-[4/3] bg-black/40 rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center gap-2 relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 opacity-60"></div>
            <span className="material-symbols-outlined text-3xl text-slate-400 group-hover:text-primary transition-colors relative z-10">photo_camera</span>
            <span className="text-xs text-slate-400 font-medium relative z-10">Use Camera</span>
          </button>
          
          <button
            onClick={() => setShowUpload(true)}
            className="aspect-[4/3] bg-black/40 rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center gap-2 relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 opacity-60"></div>
            <span className="material-symbols-outlined text-3xl text-slate-400 group-hover:text-primary transition-colors relative z-10">upload_file</span>
            <span className="text-xs text-slate-400 font-medium relative z-10">Upload Photo</span>
          </button>
        </div>
      </div>
      
      {/* Camera and Upload modals */}
      {showCamera && (
        <CameraCapture
          onCapture={handleEmotionResult}
          onClose={handleCameraClose}
        />
      )}
      {showUpload && (
        <ImageUpload
          onUpload={handleEmotionResult}
          onClose={handleUploadClose}
        />
      )}
    </div>
  );
};

export default EmotionScanCard;
