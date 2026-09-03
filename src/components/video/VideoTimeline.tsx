import React, { useRef, useState } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Type, 
  Video as VideoIcon,
  Scissors
} from 'lucide-react';
import { useVideoProject } from '../../store/useEditorStore';
import { editorStore } from '../../store/editorStore';

interface VideoTimelineProps {
  selectedTextId: string | null;
  onSelectTextId: (id: string | null) => void;
}

export const VideoTimeline: React.FC<VideoTimelineProps> = ({
  selectedTextId,
  onSelectTextId,
}) => {
  const project = useVideoProject();
  const trackRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  if (!project.source) return null;

  const totalDuration = project.source.duration || 10;
  const playheadPercent = (project.playhead / totalDuration) * 100;
  const trimStartPercent = (project.trim.start / totalDuration) * 100;
  const trimEndPercent = (project.trim.end / totalDuration) * 100;

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsScrubbing(true);
    handleSeek(e);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isScrubbing) return;
    handleSeek(e);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsScrubbing(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleSeek = (e: React.PointerEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = ratio * totalDuration;
    editorStore.setPlayhead(newTime);
  };

  const handleTogglePlay = () => {
    editorStore.setIsPlaying(!project.isPlaying);
  };

  const handleSplit = () => {
    editorStore.splitVideo(project.playhead);
  };

  // Generate 1-second interval ruler ticks
  const ticks = [];
  for (let i = 0; i <= Math.ceil(totalDuration); i++) {
    ticks.push(i);
  }

  return (
    <div className="h-64 border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md flex flex-col select-none text-xs">
      {/* Playback Controls Bar */}
      <div className="h-10 border-b border-zinc-800/80 px-4 flex items-center justify-between bg-zinc-900/40">
        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <button
            onClick={handleTogglePlay}
            className="w-7 h-7 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors shadow-sm"
            title={project.isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {project.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          {/* Time Display */}
          <div className="font-mono text-zinc-300 text-xs flex items-center gap-1">
            <span className="text-white font-semibold">{project.playhead.toFixed(1)}s</span>
            <span className="text-zinc-500">/</span>
            <span className="text-zinc-400">{totalDuration.toFixed(1)}s</span>
          </div>

          {/* Split at playhead */}
          <button
            onClick={handleSplit}
            className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors ml-2"
            title="Split clip at current playhead"
          >
            <Scissors className="w-3 h-3 text-purple-400" />
            <span className="text-[11px]">Split</span>
          </button>
        </div>

        {/* Right Controls: Speed, Volume, Trim Summary */}
        <div className="flex items-center gap-4">
          {/* Trim numeric readout & quick adjust */}
          <div className="flex items-center gap-1.5 bg-zinc-900 px-2 py-1 rounded border border-zinc-800 text-[11px]">
            <span className="text-zinc-500 font-mono">Trim:</span>
            <span className="font-mono text-indigo-400">{project.trim.start.toFixed(1)}s</span>
            <span className="text-zinc-600">→</span>
            <span className="font-mono text-indigo-400">{project.trim.end.toFixed(1)}s</span>
          </div>

          {/* Playback Speed */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400 text-[11px]">Speed</span>
            <select
              value={project.playbackRate}
              onChange={(e) => editorStore.setVideoSpeed(Number(e.target.value))}
              className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-indigo-500 font-mono"
            >
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                <option key={s} value={s}>
                  {s}×
                </option>
              ))}
            </select>
          </div>

          {/* Volume & Mute */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => editorStore.setVideoVolume(undefined, !project.muted)}
              className="text-zinc-400 hover:text-zinc-200 p-1"
              title={project.muted ? 'Unmute' : 'Mute'}
            >
              {project.muted || project.volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-red-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={project.muted ? 0 : project.volume}
              onChange={(e) => {
                editorStore.setVideoVolume(Number(e.target.value), false);
              }}
              className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Multi-Track Timeline Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers */}
        <div className="w-28 border-r border-zinc-800/80 bg-zinc-950 flex flex-col py-1 shrink-0">
          <div className="h-6 flex items-center px-3 text-[10px] text-zinc-500 font-mono uppercase">
            Ruler
          </div>
          <div className="h-16 flex items-center px-3 gap-1.5 text-zinc-400 border-t border-zinc-800/50">
            <VideoIcon className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[11px] font-medium">Video</span>
          </div>
          <div className="flex-1 flex items-center px-3 gap-1.5 text-zinc-400 border-t border-zinc-800/50">
            <Type className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] font-medium">Text ({project.textLayers.length})</span>
          </div>
        </div>

        {/* Interactive Track Area */}
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="flex-1 relative overflow-x-hidden bg-zinc-900/20 cursor-pointer flex flex-col"
        >
          {/* Time Ruler */}
          <div className="h-6 border-b border-zinc-800/80 relative flex items-center bg-zinc-950/50">
            {ticks.map((t) => {
              const posPercent = (t / totalDuration) * 100;
              return (
                <div
                  key={t}
                  className="absolute flex flex-col items-center -translate-x-1/2 pointer-events-none"
                  style={{ left: `${posPercent}%` }}
                >
                  <span className="text-[9px] font-mono text-zinc-500">{t}s</span>
                  <div className="h-1.5 w-[1px] bg-zinc-700 mt-0.5" />
                </div>
              );
            })}
          </div>

          {/* Video Track with Clip Segments & Trim Mask */}
          <div className="h-16 relative border-b border-zinc-800/50 p-1 flex items-center">
            {/* Dimmed Left Trim Out */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-black/70 pointer-events-none z-10 border-r border-indigo-500/80"
              style={{ width: `${trimStartPercent}%` }}
            />

            {/* Dimmed Right Trim Out */}
            <div
              className="absolute right-0 top-0 bottom-0 bg-black/70 pointer-events-none z-10 border-l border-indigo-500/80"
              style={{ width: `${100 - trimEndPercent}%` }}
            />

            {/* Video Track Segments */}
            <div className="w-full h-full rounded-md bg-purple-950/40 border border-purple-800/40 relative overflow-hidden flex items-center">
              {project.clips.map((clip) => {
                const clipStartPercent = (clip.start / totalDuration) * 100;
                const clipWidthPercent = ((clip.end - clip.start) / totalDuration) * 100;

                return (
                  <div
                    key={clip.id}
                    className="absolute h-full bg-purple-600/30 border-r border-purple-500/60 flex items-center px-2 text-[10px] text-purple-200 font-mono truncate"
                    style={{
                      left: `${clipStartPercent}%`,
                      width: `${clipWidthPercent}%`,
                    }}
                  >
                    {clip.label || 'Clip'} ({clip.start.toFixed(1)}s - {clip.end.toFixed(1)}s)
                  </div>
                );
              })}
            </div>
          </div>

          {/* Text Overlay Tracks */}
          <div className="flex-1 relative p-1 flex flex-col justify-center gap-1">
            {project.textLayers.map((layer) => {
              const startPercent = (layer.startTime / totalDuration) * 100;
              const widthPercent = Math.max(2, ((layer.endTime - layer.startTime) / totalDuration) * 100);
              const isSelected = selectedTextId === layer.id;

              return (
                <div
                  key={layer.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTextId(layer.id);
                  }}
                  className={`h-7 absolute rounded border px-2 flex items-center text-[10px] font-medium truncate cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-md ring-1 ring-white/50'
                      : 'bg-indigo-950/70 border-indigo-800/60 text-indigo-200 hover:bg-indigo-900/60'
                  }`}
                  style={{
                    left: `${startPercent}%`,
                    width: `${widthPercent}%`,
                  }}
                >
                  <Type className="w-3 h-3 mr-1 shrink-0" />
                  <span className="truncate">{layer.content}</span>
                  <span className="ml-1 text-[9px] opacity-70 font-mono">
                    ({layer.startTime.toFixed(1)}s - {layer.endTime.toFixed(1)}s)
                  </span>
                </div>
              );
            })}
          </div>

          {/* Playhead Scrubber */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-30 -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${playheadPercent}%` }}
          >
            <div className="w-3 h-3.5 bg-red-500 rotate-45 rounded-sm shadow-md -mb-1" />
            <div className="w-[2px] h-full bg-red-500 shadow-sm" />
          </div>
        </div>
      </div>
    </div>
  );
};
