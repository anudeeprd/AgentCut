import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Video as VideoIcon, Upload, Sparkles } from 'lucide-react';
import { editorStore } from '../../store/editorStore';

export const StartScreen: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleLoadDemoImage = () => {
    editorStore.setMode('image');
    editorStore.loadImage({
      fileName: 'sample-image.jpg',
      width: 1920,
      height: 1080,
      objectUrl: '/demo/sample-image.jpg',
      isDemo: true,
    });
  };

  const handleLoadDemoVideo = () => {
    editorStore.setMode('video');
    editorStore.loadVideo({
      fileName: 'sample-video.mp4',
      duration: 10.0,
      width: 1280,
      height: 720,
      objectUrl: '/demo/sample-video.mp4',
      isDemo: true,
    });
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG, PNG, WebP).');
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      editorStore.setMode('image');
      editorStore.loadImage({
        fileName: file.name,
        width: img.naturalWidth || 1920,
        height: img.naturalHeight || 1080,
        objectUrl: url,
      });
    };
    img.src = url;
  };

  const handleVideoFile = (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('Please upload a valid video file (MP4, WebM).');
      return;
    }
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      editorStore.setMode('video');
      editorStore.loadVideo({
        fileName: file.name,
        duration: video.duration || 10,
        width: video.videoWidth || 1280,
        height: video.videoHeight || 720,
        objectUrl: url,
      });
    };
    video.src = url;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      handleImageFile(file);
    } else if (file.type.startsWith('video/')) {
      handleVideoFile(file);
    } else {
      alert('Please drag & drop an image or video file.');
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 select-none">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`max-w-xl w-full p-8 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center text-center ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
            : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/40'
        }`}
      >
        <div className="w-14 h-14 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mb-4 text-zinc-300">
          <Upload className="w-7 h-7 text-indigo-400" />
        </div>

        <h2 className="text-xl font-semibold text-white tracking-tight mb-1">
          Create with AgentCut
        </h2>
        <p className="text-xs text-zinc-400 max-w-sm mb-6">
          Edit images and video yourself — or let an external AI agent operate the editor through structured WebMCP tools.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md mb-6">
          <button
            onClick={() => imageInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700/80 text-sm font-medium text-white transition-all shadow-sm"
          >
            <ImageIcon className="w-4 h-4 text-indigo-400" />
            <span>Edit an image</span>
          </button>
          <button
            onClick={() => videoInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700/80 text-sm font-medium text-white transition-all shadow-sm"
          >
            <VideoIcon className="w-4 h-4 text-purple-400" />
            <span>Edit a video</span>
          </button>
        </div>

        <p className="text-xs text-zinc-500 mb-6">
          or drag & drop media here
        </p>

        {/* Mandatory Quick Demo Assets */}
        <div className="w-full border-t border-zinc-800/80 pt-6 flex flex-col items-center">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Instant Judge Demos
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2.5 w-full">
            <button
              onClick={handleLoadDemoImage}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-xs font-medium text-indigo-300 transition-all"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Use demo image</span>
            </button>
            <button
              onClick={handleLoadDemoVideo}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 text-xs font-medium text-purple-300 transition-all"
            >
              <VideoIcon className="w-3.5 h-3.5" />
              <span>Use demo video</span>
            </button>
          </div>
        </div>

        {/* Hidden inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageFile(file);
          }}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4, video/webm"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleVideoFile(file);
          }}
        />
      </div>
    </div>
  );
};
