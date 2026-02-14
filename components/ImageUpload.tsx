import React, { useState, useRef } from 'react';
import { EmotionPrediction, predictTopEmotion } from '../utils/emotionAnalyzer';

interface ImageUploadProps {
  onUpload: (result: EmotionPrediction) => void;
  onClose: () => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onUpload, onClose }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeFromPreviewUrl = async (previewUrl: string) => {
    try {
      setIsAnalyzing(true);
      setError(null);

      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Failed to load image'));
        image.src = previewUrl;
      });

      const prediction = await predictTopEmotion(img);
      if (!prediction) {
        setError('No face detected. Please use a clear photo of a face.');
        return;
      }

      onUpload(prediction);
      handleClose();
    } catch {
      setError('Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onFileChosen = (file: File, inputEl?: HTMLInputElement | null) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setError(null);

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    if (inputEl) {
      inputEl.value = '';
    }

    void analyzeFromPreviewUrl(objectUrl);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onFileChosen(file, event.target);
  };

  const handleAnalyze = async () => {
    if (!preview) {
      setError('Please select an image first.');
      return;
    }

    await analyzeFromPreviewUrl(preview);
  };

  const handleClose = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      onFileChosen(file, fileInputRef.current);
    }
  };

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
          <h3 className="text-2xl font-bold text-text-light mb-2">Upload Photo</h3>
          <p className="text-slate-400">Select a photo and we’ll analyze it automatically</p>
        </div>

        {/* Upload area */}
        <div className="mb-6">
          {!preview ? (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="aspect-[4/3] border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors bg-black/40"
            >
              <span className="material-symbols-outlined text-6xl text-slate-400 mb-4">upload_file</span>
              <p className="text-slate-300 font-medium mb-2">Click to upload or drag and drop</p>
              <p className="text-slate-500 text-sm">PNG, JPG, GIF up to 10MB</p>
            </div>
          ) : (
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-black">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

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
          {preview && (
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="px-6 py-3 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 animate-pulse"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">psychology</span>
                  Analyze Emotion
                </>
              )}
            </button>
          )}
        </div>
        
        {/* Debug info */}
        {preview && !isAnalyzing && !error && (
          <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-lg">
            <p className="text-primary text-sm text-center font-medium">
              If the analysis didn’t start, click "Analyze Emotion" above
            </p>
          </div>
        )}
        
        {isAnalyzing && (
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-blue-400 text-sm text-center">
              🤖 Analyzing your facial expression...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
