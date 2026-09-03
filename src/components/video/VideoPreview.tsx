import React, { useRef, useEffect } from 'react';
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

  // Sync isPlaying
  useEffect(() => {
    if (!videoRef.current) return;
    if (project.isPlaying) {
      videoRef.current.play().catch(() => {
        editorStore.setIsPlaying(false);
      });
    } else {
      videoRef.current.pause();
    }
  }, [project.isPlaying]);

  // Handle video time update
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;

    // Constrain to trim range
    if (time >= project.trim.end) {
      videoRef.current.currentTime = project.trim.start;
      editorStore.setPlayhead(project.trim.start);
      videoRef.current.pause();
      editorStore.setIsPlaying(false);
      return;
    }

    if (time < project.trim.start) {
      videoRef.current.currentTime = project.trim.start;
    }

    editorStore.setPlayhead(time);
  };

  // Sync playhead when manually scrubbed while paused
  useEffect(() => {
    if (videoRef.current && !project.isPlaying) {
      if (Math.abs(videoRef.current.currentTime - project.playhead) > 0.1) {
        videoRef.current.currentTime = project.playhead;
      }
    }
  }, [project.playhead, project.isPlaying]);

  if (!project.source) return null;

  // Aspect ratio styling
  const getAspectRatioStyle = () => {
    switch (project.aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] max-h-[58vh]';
      case '1:1':
        return 'aspect-square max-h-[55vh]';
      case '4:5':
        return 'aspect-[4/5] max-h-[56vh]';
      case '16:9':
      default:
        return 'aspect-video max-h-[52vh]';
    }
  };

  // Compute active video animation transform
  const videoAnim = interpolateVideoKeyframes(project.keyframes || [], project.playhead);

  // Filter text overlays active at current playhead time
  const visibleTextLayers = project.textLayers.filter(
    (layer) => project.playhead >= layer.startTime && project.playhead <= layer.endTime
  );

  return (
    <div
      onClick={() => onSelectTextId(null)}
      className="flex-1 bg-zinc-950/60 flex items-center justify-center p-4 overflow-hidden relative select-none"
    >
      {/* Video Viewport Container */}
      <div
        className={`relative transition-all duration-300 rounded-xl overflow-hidden shadow-2xl border border-zinc-800/80 bg-black flex items-center justify-center ${getAspectRatioStyle()}`}
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
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => {
            editorStore.setIsPlaying(false);
            if (videoRef.current) {
              videoRef.current.currentTime = project.trim.start;
              editorStore.setPlayhead(project.trim.start);
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
          const anim = interpolateTextLayerKeyframes(layer, project.keyframes || [], project.playhead);

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
                  ? 'ring-2 ring-purple-500 bg-purple-500/20 backdrop-blur-sm'
                  : 'hover:ring-1 hover:ring-zinc-400/60'
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
        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-zinc-300 pointer-events-none flex items-center gap-1.5">
          <span>{project.aspectRatio.toUpperCase()}</span>
          <span>·</span>
          <span>{project.playbackRate}×</span>
        </div>
      </div>
    </div>
  );
};
