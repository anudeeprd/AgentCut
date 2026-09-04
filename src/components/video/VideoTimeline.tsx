import React, { useRef, useState } from 'react';
import { 
  Type, 
  Video as VideoIcon,
  Scissors,
  PlusCircle,
  Trash2,
  Undo2,
  Minus,
  Plus
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
  const rulerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headersScrollRef = useRef<HTMLDivElement>(null);
  const tracksScrollRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const hasMedia = !!project.source;
  const totalDuration = project.source?.duration || 10;
  const playheadPercent = hasMedia ? (project.playhead / totalDuration) * 100 : 0;
  const trimStartPercent = hasMedia ? (project.trim.start / totalDuration) * 100 : 0;
  const trimEndPercent = hasMedia ? (project.trim.end / totalDuration) * 100 : 100;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!hasMedia) return;
    setIsScrubbing(true);
    handleSeek(e);
    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!hasMedia || !isScrubbing) return;
    handleSeek(e);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!hasMedia) return;
    setIsScrubbing(false);
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleSeek = (e: React.PointerEvent) => {
    const targetEl = trackRef.current || rulerRef.current;
    if (!targetEl || !hasMedia) return;
    const rect = targetEl.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / width));
    const newTime = ratio * totalDuration;
    editorStore.setPlayhead(newTime);
  };

  const handleTracksScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (headersScrollRef.current) {
      headersScrollRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleHeadersWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (tracksScrollRef.current) {
      tracksScrollRef.current.scrollTop += e.deltaY;
    }
  };

  const handleSplit = () => {
    if (!hasMedia) return;
    editorStore.splitVideo(project.playhead);
  };

  const handleAddKeyframe = () => {
    if (!hasMedia) return;
    if (selectedTextId) {
      editorStore.addVideoKeyframe({
        targetType: 'text',
        targetId: selectedTextId,
        time: Number(project.playhead.toFixed(2)),
        properties: { scale: 1, opacity: 1 },
      });
    } else {
      editorStore.addVideoKeyframe({
        targetType: 'video',
        time: Number(project.playhead.toFixed(2)),
        properties: { scale: 1 },
      });
    }
  };

  const handleDeleteActiveSegment = () => {
    if (!hasMedia) return;
    if (selectedTextId) {
      editorStore.removeVideoText(selectedTextId);
      onSelectTextId(null);
    } else if (project.clips.length > 1) {
      const activeClip = project.clips.find(
        (c) => project.playhead >= c.start && project.playhead <= c.end
      );
      if (activeClip) {
        editorStore.deleteVideoSegment(activeClip.id);
      }
    }
  };

  const handleVideoUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    const vid = document.createElement('video');
    vid.preload = 'metadata';
    vid.onloadedmetadata = () => {
      editorStore.setMode('video');
      editorStore.loadVideo({
        fileName: file.name,
        duration: vid.duration || 10,
        width: vid.videoWidth || 1280,
        height: vid.videoHeight || 720,
        objectUrl: url,
      });
    };
    vid.src = url;
  };

  // Generate 1-second interval ruler ticks
  const ticks = [];
  for (let i = 0; i <= Math.ceil(totalDuration); i++) {
    ticks.push(i);
  }

  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 30);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-60 border-t border-[#E8E5DD] bg-white flex flex-col select-none text-xs shrink-0 shadow-panel z-10">
      {/* Top Timeline Toolbar */}
      <div className="h-10 border-b border-[#F0EEE8] px-4 flex items-center justify-between bg-white shrink-0">
        {/* Left Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => editorStore.undoVideo()}
            disabled={!hasMedia || project.history.length === 0}
            className="p-1.5 rounded-lg text-[#6B6B66] hover:text-zinc-900 hover:bg-[#FAF9F5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Undo"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleSplit}
            disabled={!hasMedia}
            className="p-1.5 rounded-lg text-[#6B6B66] hover:text-zinc-900 hover:bg-[#FAF9F5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Split clip at playhead"
          >
            <Scissors className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleAddKeyframe}
            disabled={!hasMedia}
            className="p-1.5 rounded-lg text-[#6B6B66] hover:text-zinc-900 hover:bg-[#FAF9F5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Add keyframe at playhead"
          >
            <PlusCircle className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDeleteActiveSegment}
            disabled={!hasMedia}
            className="p-1.5 rounded-lg text-[#6B6B66] hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Delete active segment or text"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center Timecode */}
        <div className="font-mono text-xs text-[#6B6B66] flex items-center gap-1">
          <span className="font-bold text-zinc-900">{formatTimecode(hasMedia ? project.playhead : 0)}</span>
          <span>/</span>
          <span>{formatTimecode(hasMedia ? totalDuration : 0)}</span>
        </div>

        {/* Right Zoom Control Slider */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
            className="text-[#6B6B66] hover:text-zinc-900 p-1"
          >
            <Minus className="w-3 h-3" />
          </button>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={zoomLevel}
            onChange={(e) => setZoomLevel(Number(e.target.value))}
            className="w-20 accent-[#F2B705]"
          />
          <button 
            onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))}
            className="text-[#6B6B66] hover:text-zinc-900 p-1"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Multi-Track Timeline Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers (Left sidebar) */}
        <div className="w-36 border-r border-[#E8E5DD] bg-[#FAF9F5] flex flex-col shrink-0">
          <div className="h-6 flex items-center px-3 text-[10px] text-[#6B6B66] font-mono uppercase font-semibold border-b border-[#E8E5DD] bg-[#FAF9F5] shrink-0">
            Ruler
          </div>

          <div
            ref={headersScrollRef}
            onWheel={handleHeadersWheel}
            className="flex-1 overflow-hidden flex flex-col"
          >
            {/* Video Track Header */}
            <div
              onClick={() => onSelectTextId(null)}
              title={hasMedia ? project.source?.fileName : 'Video'}
              data-testid="timeline-track-header-video"
              className="h-12 flex items-center px-3 gap-2 text-zinc-800 border-b border-[#F0EEE8] shrink-0 cursor-pointer hover:bg-[#F4F2EC] transition-colors"
            >
              <VideoIcon className="w-3.5 h-3.5 text-[#D99B00] shrink-0" />
              <span className="text-[11px] font-semibold truncate">
                {hasMedia ? project.source?.fileName : 'Video'}
              </span>
            </div>

            {/* Dynamic Text Track Headers — One per text layer */}
            {hasMedia && project.textLayers.map((layer) => {
              const isSelected = selectedTextId === layer.id;
              const displayLabel = layer.content?.trim() ? layer.content : 'Untitled Text';

              return (
                <div
                  key={layer.id}
                  onClick={() => onSelectTextId(layer.id)}
                  title={displayLabel}
                  data-testid={`timeline-track-header-${layer.id}`}
                  className={`h-10 flex items-center px-3 gap-2 border-b border-[#F0EEE8] shrink-0 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#FFF5D6] text-zinc-900 font-semibold'
                      : 'bg-[#FAF9F5] text-zinc-700 hover:bg-[#F4F2EC]'
                  }`}
                >
                  <Type className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#B8860B]' : 'text-[#8C887B]'}`} />
                  <span className="text-[11px] font-medium truncate">
                    {displayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Track Lanes Column (Right Area) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#FAF9F5]/40">
          {/* Time Ruler (Fixed Header) */}
          <div
            ref={rulerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className={`h-6 border-b border-[#E8E5DD] relative flex items-center bg-[#FAF9F5] shrink-0 ${
              hasMedia ? 'cursor-pointer' : 'cursor-default'
            }`}
          >
            {ticks.map((t) => {
              const posPercent = (t / totalDuration) * 100;
              return (
                <div
                  key={t}
                  className="absolute flex flex-col items-center -translate-x-1/2 pointer-events-none"
                  style={{ left: `${posPercent}%` }}
                >
                  <span className="text-[9px] font-mono text-[#6B6B66]">{t}s</span>
                  <div className="h-1.5 w-[1px] bg-[#D4D0C8] mt-0.5" />
                </div>
              );
            })}

            {/* Playhead Top Handle on Ruler */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none z-30 -translate-x-1/2 flex flex-col items-center justify-end pb-0.5"
              style={{ left: `${playheadPercent}%` }}
            >
              <div className="w-3.5 h-4.5 bg-zinc-900 rounded-sm shadow-md border border-zinc-700 flex items-center justify-center -mb-0.5">
                <div className="w-1 h-2 bg-[#F6C344] rounded-full" />
              </div>
            </div>
          </div>

          {/* Scrollable Tracks Area */}
          <div
            ref={tracksScrollRef}
            onScroll={handleTracksScroll}
            className="flex-1 overflow-y-auto overflow-x-hidden relative"
          >
            <div
              ref={trackRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className={`min-h-full relative flex flex-col ${
                hasMedia ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              {/* Video Track Lane */}
              <div
                onClick={() => onSelectTextId(null)}
                data-testid="timeline-track-lane-video"
                className="h-12 relative border-b border-[#E8E5DD] p-1 flex items-center shrink-0"
              >
                {hasMedia ? (
                  <>
                    {/* Dimmed Left Trim Out */}
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-zinc-900/40 pointer-events-none z-10 border-r-2 border-[#F6C344]"
                      style={{ width: `${trimStartPercent}%` }}
                    />

                    {/* Dimmed Right Trim Out */}
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-zinc-900/40 pointer-events-none z-10 border-l-2 border-[#F6C344]"
                      style={{ width: `${100 - trimEndPercent}%` }}
                    />

                    {/* Video Track Segments */}
                    <div className="w-full h-full rounded-lg bg-[#FAF9F5] border border-[#E8E5DD] relative overflow-hidden flex items-center shadow-xs">
                      {project.clips.map((clip) => {
                        const clipStartPercent = (clip.start / totalDuration) * 100;
                        const clipWidthPercent = ((clip.end - clip.start) / totalDuration) * 100;

                        return (
                          <div
                            key={clip.id}
                            className="absolute h-full bg-gradient-to-r from-amber-100/70 to-yellow-100/70 border-r border-[#E8E5DD] flex items-center px-2.5 text-[10px] text-zinc-900 font-mono font-medium truncate"
                            style={{
                              left: `${clipStartPercent}%`,
                              width: `${clipWidthPercent}%`,
                            }}
                          >
                            <div className="w-1.5 h-5 bg-[#F6C344] rounded-sm mr-2 shrink-0" />
                            <span className="truncate">{project.source?.fileName}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Video Keyframe Markers (Yellow Diamonds) */}
                    {(project.keyframes || [])
                      .filter((k) => k.targetType === 'video')
                      .map((kf) => {
                        const posPercent = (kf.time / totalDuration) * 100;
                        const tooltipLines = [`${kf.time.toFixed(1)}s`];
                        if (kf.properties.scale !== undefined) tooltipLines.push(`Scale ${kf.properties.scale}`);
                        if (kf.properties.x !== undefined) tooltipLines.push(`X ${kf.properties.x}`);
                        if (kf.properties.y !== undefined) tooltipLines.push(`Y ${kf.properties.y}`);
                        const tooltip = tooltipLines.join('\n');

                        return (
                          <div
                            key={kf.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              editorStore.setPlayhead(kf.time);
                              onSelectTextId(null);
                            }}
                            title={tooltip}
                            data-testid={`timeline-video-keyframe-${kf.id}`}
                            className="absolute z-20 cursor-pointer -translate-x-1/2 -translate-y-1/2 group"
                            style={{ left: `${posPercent}%`, top: '50%' }}
                          >
                            <div className="w-3.5 h-3.5 rotate-45 bg-[#F2B705] hover:bg-[#E9B332] border-2 border-white shadow-md transition-transform hover:scale-125" />
                          </div>
                        );
                      })}
                  </>
                ) : (
                  /* Empty Video Track Slot */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-full rounded-lg border border-dashed border-[#D8D4CC] bg-[#F7F6F2]/70 hover:border-[#F2B705] hover:bg-[#FFF5D6]/30 flex items-center justify-center cursor-pointer transition-colors text-[11px] text-[#6B6B66] font-medium gap-1.5"
                    title="Click to add video"
                  >
                    <VideoIcon className="w-3.5 h-3.5 text-[#B8860B]" />
                    <span>Drop or add video</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleVideoUpload(file);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Dynamic Text Track Lanes — Exactly one row per text layer */}
              {hasMedia && project.textLayers.map((layer) => {
                const isSelected = selectedTextId === layer.id;
                const startPercent = (layer.startTime / totalDuration) * 100;
                const widthPercent = Math.max(2, ((layer.endTime - layer.startTime) / totalDuration) * 100);
                const displayLabel = layer.content?.trim() ? layer.content : 'Untitled Text';
                const layerKeyframes = (project.keyframes || []).filter(
                  (k) => k.targetType === 'text' && k.targetId === layer.id
                );

                return (
                  <div
                    key={layer.id}
                    onClick={() => onSelectTextId(layer.id)}
                    data-testid={`timeline-track-lane-${layer.id}`}
                    className={`h-10 relative border-b border-[#E8E5DD] p-1 flex items-center shrink-0 transition-colors ${
                      isSelected ? 'bg-[#FFF9E6]/60' : 'hover:bg-[#FAF9F5]/80'
                    }`}
                  >
                    {/* Layer Timing Segment Bar */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTextId(layer.id);
                      }}
                      title={`${displayLabel} (${layer.startTime.toFixed(1)}s - ${layer.endTime.toFixed(1)}s)`}
                      data-testid={`timeline-timing-bar-${layer.id}`}
                      className={`h-7 absolute rounded-lg border px-2 flex items-center text-[10px] font-semibold truncate cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#FFF5D6] text-zinc-900 border-[#F2B705] shadow-xs ring-1 ring-[#F2B705]'
                          : 'bg-[#FAF9F5] border-[#E8E5DD] text-zinc-800 hover:bg-[#FFF5D6]/50'
                      }`}
                      style={{
                        left: `${startPercent}%`,
                        width: `${widthPercent}%`,
                      }}
                    >
                      <div className="w-1 h-3.5 bg-[#F6C344] rounded-xs mr-1.5 shrink-0" />
                      <Type className="w-3 h-3 mr-1 text-[#D99B00] shrink-0" />
                      <span className="truncate">{displayLabel}</span>
                      <span className="ml-1 text-[9px] text-[#6B6B66] font-mono shrink-0">
                        ({layer.startTime.toFixed(1)}s - {layer.endTime.toFixed(1)}s)
                      </span>
                    </div>

                    {/* Keyframe Markers belonging ONLY to this text layer */}
                    {layerKeyframes.map((kf) => {
                      const posPercent = (kf.time / totalDuration) * 100;
                      const tooltipLines = [`${kf.time.toFixed(1)}s`];
                      if (kf.properties.scale !== undefined) tooltipLines.push(`Scale ${kf.properties.scale}`);
                      if (kf.properties.opacity !== undefined) tooltipLines.push(`Opacity ${kf.properties.opacity}`);
                      if (kf.properties.x !== undefined) tooltipLines.push(`X ${kf.properties.x}`);
                      if (kf.properties.y !== undefined) tooltipLines.push(`Y ${kf.properties.y}`);
                      const tooltip = tooltipLines.join('\n');

                      return (
                        <div
                          key={kf.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            editorStore.setPlayhead(kf.time);
                            onSelectTextId(layer.id);
                          }}
                          title={tooltip}
                          data-testid={`timeline-keyframe-${kf.id}`}
                          className="absolute z-20 cursor-pointer -translate-x-1/2 -translate-y-1/2 group"
                          style={{ left: `${posPercent}%`, top: '50%' }}
                        >
                          <div className="w-3 h-3 rotate-45 bg-[#F2B705] hover:bg-[#E9B332] border border-white shadow-md transition-transform hover:scale-125" />
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Continuous Vertical Playhead Line Spanning all Tracks */}
              <div
                className="absolute top-0 bottom-0 pointer-events-none z-30 -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${playheadPercent}%` }}
              >
                <div className="w-[1.5px] h-full bg-zinc-900 shadow-xs" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
