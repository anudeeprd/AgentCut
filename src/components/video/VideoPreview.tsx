import React, { useRef, useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  Maximize2, 
  ChevronDown, 
  FastForward, 
  Rewind
} from 'lucide-react';
import { useVideoProject } from '../../store/useEditorStore';
import { editorStore } from '../../store/editorStore';
import {
  interpolateTextLayerKeyframes,
  interpolateVideoKeyframes,
} from '../../utils/interpolation';

interface VideoPreviewProps {
  selectedTextId: string | null;
  onSelectTextId: (id: string | null) => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  selectedTextId,
  onSelectTextId,
}) => {
  const project = useVideoProject();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Transient preview playback time for smooth 60fps animation updates without full store churn
  const [previewTime, setPreviewTime] = useState<number>(project.playhead);

  // Sync previewTime when manually scrubbed or paused
  useEffect(() => {
    if (!project.isPlaying) {
      setPreviewTime(project.playhead);
    }
  }, [project.playhead, project.isPlaying]);

  // Sync playback rate
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = project.playbackRate;
    }
  }, [project.playbackRate]);

  // Sync volume and mute
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = project.volume / 100;
      videoRef.current.muted = project.muted;
    }
  }, [project.volume, project.muted]);

  // Frame-synchronized playback clock using requestVideoFrameCallback (with rAF fallback)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!project.isPlaying) {
      video.pause();
      return;
    }

    let callbackId: number | null = null;
    let isCancelled = false;
    let lastStoreUpdateTime = 0;

    const hasRvfc =
      'requestVideoFrameCallback' in video &&
      typeof (video as any).requestVideoFrameCallback === 'function';

    const onFrame = (_now: DOMHighResTimeStamp, metadata?: any) => {
      if (isCancelled) return;

      const mediaTime =
        metadata && typeof metadata.mediaTime === 'number'
          ? metadata.mediaTime
          : video.currentTime;

      // Constrain to trim range
      if (mediaTime >= project.trim.end) {
        video.currentTime = project.trim.start;
        setPreviewTime(project.trim.start);
        editorStore.setPlayhead(project.trim.start);
        video.pause();
        editorStore.setIsPlaying(false);
        return;
      }

      if (mediaTime < project.trim.start) {
        video.currentTime = project.trim.start;
      }

      // Update local preview animation time immediately at decoded frame rate
      setPreviewTime(mediaTime);

      // Throttled update to canonical project playhead so timeline scrubber is smooth without flooding store
      const nowMs = performance.now();
      if (nowMs - lastStoreUpdateTime >= 45) {
        lastStoreUpdateTime = nowMs;
        editorStore.setPlayhead(mediaTime);
      }

      // Schedule next frame callback
      if (hasRvfc) {
        callbackId = (video as any).requestVideoFrameCallback(onFrame);
      } else {
        callbackId = requestAnimationFrame((t) => onFrame(t));
      }
    };

    // Ensure video is playing
    video.play().catch(() => {
      editorStore.setIsPlaying(false);
    });

    // Start frame loop
    if (hasRvfc) {
      callbackId = (video as any).requestVideoFrameCallback(onFrame);
    } else {
      callbackId = requestAnimationFrame((t) => onFrame(t));
    }

    return () => {
      isCancelled = true;
      if (callbackId !== null) {
        if (hasRvfc && typeof (video as any).cancelVideoFrameCallback === 'function') {
          (video as any).cancelVideoFrameCallback(callbackId);
        } else {
          cancelAnimationFrame(callbackId);
        }
      }
    };
  }, [project.isPlaying, project.trim.start, project.trim.end]);

  // Sync playhead when manually scrubbed while paused
  useEffect(() => {
    if (videoRef.current && !project.isPlaying) {
      if (Math.abs(videoRef.current.currentTime - project.playhead) > 0.05) {
        videoRef.current.currentTime = project.playhead;
      }
    }
  }, [project.playhead, project.isPlaying]);

  // Aspect ratio styling
  const getAspectRatioStyle = () => {
    switch (project.aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] max-h-[56vh]';
      case '1:1':
        return 'aspect-square max-h-[52vh]';
      case '4:5':
        return 'aspect-[4/5] max-h-[54vh]';
      case '16:9':
      default:
        return 'aspect-video max-h-[50vh]';
    }
  };

  const handleVideoFile = (file: File) => {
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

  const handleImageFile = (file: File) => {
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      handleVideoFile(file);
    } else if (file.type.startsWith('image/')) {
      handleImageFile(file);
    }
  };

  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 30);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  // ----------------- CLEAN EMPTY PLAYER STATE ----------------- //
  if (!project.source) {
    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex-1 bg-[#F7F6F2] flex flex-col items-center justify-end pb-5 px-6 pt-4 overflow-hidden relative select-none ${
          isDragging ? 'ring-2 ring-inset ring-[#F2B705] bg-[#FFF5D6]/20' : ''
        }`}
      >

        {/* Sleek Light Bottom Control Bar (Visually present, disabled when empty) */}
        <div className="w-full max-w-2xl mt-3 px-4 py-2 rounded-xl bg-white border border-[#E8E5DD] shadow-card flex items-center justify-between text-xs text-[#171717] opacity-60">
          <div className="flex items-center gap-3">
            <button disabled className="p-1 rounded-md text-zinc-400 cursor-not-allowed">
              <Play className="w-4 h-4 fill-zinc-400" />
            </button>
            <div className="font-mono text-[11px] text-[#6B6B66] flex items-center gap-1">
              <span className="font-semibold text-zinc-500">00:00:00</span>
              <span>/</span>
              <span>00:00:00</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button disabled className="p-1.5 rounded-lg text-zinc-300 cursor-not-allowed">
              <Rewind className="w-4 h-4" />
            </button>
            <button disabled className="w-8 h-8 rounded-full bg-[#F3F1EB] text-zinc-400 flex items-center justify-center cursor-not-allowed">
              <Play className="w-4 h-4 fill-zinc-400 ml-0.5" />
            </button>
            <button disabled className="p-1.5 rounded-lg text-zinc-300 cursor-not-allowed">
              <FastForward className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FAF9F5] border border-[#E8E5DD] text-[11px] font-medium text-zinc-400 cursor-not-allowed">
              <span>Fit</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </div>
            <button disabled className="p-1.5 rounded-lg text-zinc-300 cursor-not-allowed">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------- LOADED VIDEO VIEWPORT ----------------- //

  // The active time used for animation: transient previewTime during playback, canonical playhead when paused
  const activeTime = project.isPlaying ? previewTime : project.playhead;

  // Compute active video animation transform
  const videoAnim = interpolateVideoKeyframes(project.keyframes || [], activeTime);

  // Filter text overlays active at current playhead time
  const visibleTextLayers = project.textLayers.filter(
    (layer) => activeTime >= layer.startTime && activeTime <= layer.endTime
  );

  const handleTogglePlay = () => {
    editorStore.setIsPlaying(!project.isPlaying);
  };

  const handleRewind = () => {
    const newTime = Math.max(project.trim.start, project.playhead - 1);
    editorStore.setPlayhead(newTime);
  };

  const handleFastForward = () => {
    const newTime = Math.min(project.trim.end, project.playhead + 1);
    editorStore.setPlayhead(newTime);
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen().catch(() => {});
      }
    }
  };

  return (
    <div
      onClick={() => onSelectTextId(null)}
      className="flex-1 bg-[#F7F6F2] flex flex-col items-center justify-end pb-5 px-6 pt-4 overflow-hidden relative select-none"
    >
      {/* Video Viewport Container */}
      <div
        ref={containerRef}
        className={`relative transition-all duration-200 rounded-2xl overflow-hidden shadow-card border border-[#E8E5DD] bg-black flex items-center justify-center ${getAspectRatioStyle()}`}
        style={{
          width: 'auto',
          height: 'auto',
          maxWidth: '100%',
        }}
      >
        <video
          ref={videoRef}
          src={project.source.objectUrl}
          playsInline
          onEnded={() => {
            editorStore.setIsPlaying(false);
            if (videoRef.current) {
              videoRef.current.currentTime = project.trim.start;
              editorStore.setPlayhead(project.trim.start);
              setPreviewTime(project.trim.start);
            }
          }}
          className="w-full h-full object-cover pointer-events-none"
          style={{
            transform: `translate(${videoAnim.x - 50}%, ${videoAnim.y - 50}%) scale(${videoAnim.scale})`,
            transformOrigin: 'center center',
            transition: project.isPlaying ? 'none' : 'transform 150ms ease-out',
          }}
        />

        {/* Timed Text Overlays */}
        {visibleTextLayers.map((layer) => {
          const isSelected = selectedTextId === layer.id;
          const anim = interpolateTextLayerKeyframes(layer, project.keyframes || [], activeTime);

          return (
            <div
              key={layer.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectTextId(layer.id);
              }}
              className={`absolute cursor-pointer px-3 py-1.5 rounded select-none ${
                project.isPlaying ? '' : 'transition-all duration-150'
              } ${
                isSelected
                  ? 'ring-2 ring-[#F2B705] bg-[#FFF5D6]/30 backdrop-blur-xs'
                  : 'hover:ring-1 hover:ring-white/80'
              }`}
              style={{
                left: `${anim.x}%`,
                top: `${anim.y}%`,
                opacity: anim.opacity,
                transform: `translate(-50%, -50%) scale(${anim.scale})`,
                transformOrigin: 'center center',
              }}
            >
              <span
                style={{
                  fontSize: `${layer.fontSize}px`,
                  fontWeight: layer.fontWeight,
                  fontFamily: `"${layer.fontFamily || 'Inter'}", -apple-system, sans-serif`,
                  color: layer.color || '#ffffff',
                  textShadow: '0 2px 10px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)',
                }}
                className="leading-none whitespace-nowrap block text-center"
              >
                {layer.content}
              </span>
            </div>
          );
        })}

        {/* Aspect Ratio Badge Overlay */}
        <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-mono text-white/90 pointer-events-none flex items-center gap-1.5 shadow-sm">
          <span>{project.aspectRatio.toUpperCase()}</span>
          <span>·</span>
          <span>{project.playbackRate}×</span>
        </div>
      </div>

      {/* Sleek Light Bottom Control Bar */}
      <div className="w-full max-w-2xl mt-3 px-4 py-2 rounded-xl bg-white border border-[#E8E5DD] shadow-card flex items-center justify-between text-xs text-[#171717]">
        {/* Left: Play/Pause button + Current / Total Time */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleTogglePlay}
            className="p-1 rounded-md hover:bg-[#FAF9F5] text-zinc-900 transition-colors"
            title={project.isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {project.isPlaying ? (
              <Pause className="w-4 h-4 fill-zinc-900" />
            ) : (
              <Play className="w-4 h-4 fill-zinc-900" />
            )}
          </button>
          <div className="font-mono text-[11px] text-[#6B6B66] flex items-center gap-1">
            <span className="font-semibold text-zinc-900">{formatTimecode(activeTime)}</span>
            <span>/</span>
            <span>{formatTimecode(project.source.duration || 10)}</span>
          </div>
        </div>

        {/* Center: Rewind, Large Play Button, Fast Forward */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRewind}
            className="p-1.5 rounded-lg hover:bg-[#FAF9F5] text-[#6B6B66] hover:text-zinc-900 transition-colors"
            title="Rewind 1s"
          >
            <Rewind className="w-4 h-4" />
          </button>
          <button
            onClick={handleTogglePlay}
            className="w-8 h-8 rounded-full bg-[#F6C344] hover:bg-[#E9B332] text-zinc-900 flex items-center justify-center shadow-xs transition-transform active:scale-95"
            title={project.isPlaying ? 'Pause' : 'Play'}
          >
            {project.isPlaying ? (
              <Pause className="w-4 h-4 fill-zinc-900" />
            ) : (
              <Play className="w-4 h-4 fill-zinc-900 ml-0.5" />
            )}
          </button>
          <button
            onClick={handleFastForward}
            className="p-1.5 rounded-lg hover:bg-[#FAF9F5] text-[#6B6B66] hover:text-zinc-900 transition-colors"
            title="Fast forward 1s"
          >
            <FastForward className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Fit dropdown + Fullscreen */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FAF9F5] border border-[#E8E5DD] text-[11px] font-medium text-zinc-700 cursor-pointer">
            <span>Fit</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </div>
          <button
            onClick={handleFullscreen}
            className="p-1.5 rounded-lg hover:bg-[#FAF9F5] text-[#6B6B66] hover:text-zinc-900 transition-colors"
            title="Toggle fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
