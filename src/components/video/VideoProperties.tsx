import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  ChevronDown, 
  Volume2, 
  VolumeX, 
  Plus, 
  Sparkles 
} from 'lucide-react';
import { useVideoProject } from '../../store/useEditorStore';
import { editorStore } from '../../store/editorStore';
import { AspectRatio } from '../../types/editor';

interface VideoPropertiesProps {
  selectedTextId: string | null;
  onSelectTextId: (id: string | null) => void;
}

export const VideoProperties: React.FC<VideoPropertiesProps> = ({
  selectedTextId,
  onSelectTextId: _onSelectTextId,
}) => {
  const project = useVideoProject();
  const [isAspectOpen, setIsAspectOpen] = useState(true);
  const [isTransformOpen, setIsTransformOpen] = useState(true);
  const [isAdjustOpen, setIsAdjustOpen] = useState(true);
  const [isTextOpen, setIsTextOpen] = useState(true);

  // Keyframe controls state
  const [textKfX, setTextKfX] = useState(50);
  const [textKfY, setTextKfY] = useState(50);
  const [textKfScale, setTextKfScale] = useState(1);
  const [textKfOpacity, setTextKfOpacity] = useState(1);

  const [videoKfX, setVideoKfX] = useState(50);
  const [videoKfY, setVideoKfY] = useState(50);
  const [videoKfScale, setVideoKfScale] = useState(1);

  const hasMedia = !!project.source;
  const totalDuration = project.source?.duration || 10;

  const ratios: { label: string; value: AspectRatio }[] = [
    { label: '16:9', value: '16:9' },
    { label: '9:16', value: '9:16' },
    { label: '1:1', value: '1:1' },
    { label: '4:5', value: '4:5' },
    { label: 'Original', value: 'original' },
  ];

  const selectedTextLayer = project.textLayers.find((l) => l.id === selectedTextId);

  useEffect(() => {
    if (selectedTextLayer) {
      setTextKfX(selectedTextLayer.x ?? 50);
      setTextKfY(selectedTextLayer.y ?? 50);
      setTextKfScale(1);
      setTextKfOpacity(selectedTextLayer.opacity !== undefined ? selectedTextLayer.opacity : 1);
    }
  }, [selectedTextLayer?.id]);

  const videoKeyframes = (project.keyframes || []).filter((k) => k.targetType === 'video');
  const textKeyframes = selectedTextLayer
    ? (project.keyframes || []).filter(
        (k) => k.targetType === 'text' && k.targetId === selectedTextLayer.id
      )
    : [];

  return (
    <aside className="w-80 border-l border-[#E8E5DD] bg-white flex flex-col h-full select-none text-xs shadow-subtle shrink-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* 1. ASPECT RATIO SECTION */}
        <div className="space-y-2.5">
          <button
            onClick={() => setIsAspectOpen(!isAspectOpen)}
            className="w-full flex items-center justify-between font-bold text-zinc-900 text-xs tracking-tight"
          >
            <span>Aspect Ratio</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#6B6B66] transition-transform ${isAspectOpen ? 'rotate-180' : ''}`} />
          </button>
          {isAspectOpen && (
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {ratios.map((r) => {
                const isSelected = project.aspectRatio === r.value;
                return (
                  <button
                    key={r.value}
                    onClick={() => editorStore.setVideoAspectRatio(r.value)}
                    className={`py-2 px-2 rounded-xl text-center text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-[#FFF5D6] border border-[#F2B705] text-zinc-900 font-semibold shadow-xs'
                        : 'bg-white border border-[#E8E5DD] text-zinc-700 hover:bg-[#FAF9F5]'
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. TRANSFORM & VIDEO KEYFRAME MOTION */}
        <div className="space-y-2.5 pt-2 border-t border-[#F0EEE8]">
          <button
            onClick={() => setIsTransformOpen(!isTransformOpen)}
            className="w-full flex items-center justify-between font-bold text-zinc-900 text-xs tracking-tight"
          >
            <span>Transform (Video Motion)</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#6B6B66] transition-transform ${isTransformOpen ? 'rotate-180' : ''}`} />
          </button>
          {isTransformOpen && (
            <div className={`space-y-3 pt-1 ${!hasMedia ? 'opacity-50' : ''}`}>
              {/* Pan X */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px] text-[#6B6B66]">
                  <span>Pan X</span>
                  <span className="font-mono text-zinc-800">{hasMedia ? `${videoKfX}%` : '—'}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={videoKfX}
                  disabled={!hasMedia}
                  onChange={(e) => setVideoKfX(Number(e.target.value))}
                  className="w-full accent-[#F2B705] disabled:cursor-not-allowed"
                />
              </div>

              {/* Pan Y */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px] text-[#6B6B66]">
                  <span>Pan Y</span>
                  <span className="font-mono text-zinc-800">{hasMedia ? `${videoKfY}%` : '—'}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={videoKfY}
                  disabled={!hasMedia}
                  onChange={(e) => setVideoKfY(Number(e.target.value))}
                  className="w-full accent-[#F2B705] disabled:cursor-not-allowed"
                />
              </div>

              {/* Scale */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px] text-[#6B6B66]">
                  <span>Zoom / Scale</span>
                  <span className="font-mono text-zinc-800">{hasMedia ? `${videoKfScale.toFixed(2)}×` : '—'}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.05"
                  value={videoKfScale}
                  disabled={!hasMedia}
                  onChange={(e) => setVideoKfScale(Number(e.target.value))}
                  className="w-full accent-[#F2B705] disabled:cursor-not-allowed"
                />
              </div>

              {/* Add Keyframe Button */}
              <button
                disabled={!hasMedia}
                onClick={() => {
                  if (!hasMedia) return;
                  editorStore.addVideoKeyframe({
                    targetType: 'video',
                    time: Number(project.playhead.toFixed(2)),
                    properties: { x: videoKfX, y: videoKfY, scale: videoKfScale },
                  });
                }}
                className="w-full py-2 rounded-xl bg-[#F6C344] hover:bg-[#E9B332] text-zinc-900 font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{hasMedia ? `Add Video Keyframe @ ${project.playhead.toFixed(1)}s` : 'Add media to animate'}</span>
              </button>

              {/* Keyframe listing */}
              {hasMedia && videoKeyframes.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] uppercase font-mono text-[#6B6B66]">Video Keyframes</span>
                  {videoKeyframes.map((kf) => (
                    <div
                      key={kf.id}
                      className="p-1.5 rounded-lg bg-[#FAF9F5] border border-[#E8E5DD] flex items-center justify-between text-xs"
                    >
                      <div
                        className="cursor-pointer font-mono"
                        onClick={() => editorStore.setPlayhead(kf.time)}
                      >
                        <span className="font-bold text-zinc-900">{kf.time.toFixed(1)}s</span>
                        <span className="ml-1.5 text-[10px] text-[#6B6B66]">
                          s:{kf.properties.scale} x:{kf.properties.x} y:{kf.properties.y}
                        </span>
                      </div>
                      <button
                        onClick={() => editorStore.removeVideoKeyframe(kf.id)}
                        className="text-[#6B6B66] hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. ADJUST (Playback, Audio, Trim) */}
        <div className="space-y-2.5 pt-2 border-t border-[#F0EEE8]">
          <button
            onClick={() => setIsAdjustOpen(!isAdjustOpen)}
            className="w-full flex items-center justify-between font-bold text-zinc-900 text-xs tracking-tight"
          >
            <span>Playback & Audio</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#6B6B66] transition-transform ${isAdjustOpen ? 'rotate-180' : ''}`} />
          </button>
          {isAdjustOpen && (
            <div className={`space-y-3 pt-1 ${!hasMedia ? 'opacity-50' : ''}`}>
              {/* Playback Speed */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-[#6B6B66] font-medium">Playback Speed</span>
                <div className="flex gap-1">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                    <button
                      key={s}
                      disabled={!hasMedia}
                      onClick={() => editorStore.setVideoSpeed(s)}
                      className={`flex-1 py-1 rounded-lg text-center font-mono text-[11px] transition-all disabled:cursor-not-allowed ${
                        project.playbackRate === s
                          ? 'bg-[#FFF5D6] border border-[#F2B705] text-zinc-900 font-semibold shadow-xs'
                          : 'bg-white border border-[#E8E5DD] text-zinc-700 hover:bg-[#FAF9F5]'
                      }`}
                    >
                      {s}×
                    </button>
                  ))}
                </div>
              </div>

              {/* Volume */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] text-[#6B6B66]">
                  <span className="font-medium">Volume</span>
                  <span className="font-mono text-zinc-800">{hasMedia ? (project.muted ? 'Muted' : `${project.volume}%`) : '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={!hasMedia}
                    onClick={() => editorStore.setVideoVolume(undefined, !project.muted)}
                    className="text-[#6B6B66] hover:text-zinc-900 p-1 disabled:cursor-not-allowed"
                  >
                    {project.muted || project.volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-red-500" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-[#F2B705]" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    disabled={!hasMedia}
                    value={project.muted ? 0 : project.volume}
                    onChange={(e) => editorStore.setVideoVolume(Number(e.target.value), false)}
                    className="flex-1 accent-[#F2B705] disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Trim Bounds */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] text-[#6B6B66] font-medium">Trim Boundaries</span>
                {hasMedia ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-[#6B6B66] font-mono">In Point</label>
                      <input
                        type="number"
                        min="0"
                        max={project.trim.end - 0.1}
                        step="0.1"
                        value={Number(project.trim.start.toFixed(1))}
                        onChange={(e) => editorStore.trimVideo(Number(e.target.value), project.trim.end)}
                        className="w-full px-2 py-1 rounded-lg border border-[#E8E5DD] bg-[#FAF9F5] font-mono text-xs focus:outline-none focus:border-[#F2B705]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#6B6B66] font-mono">Out Point</label>
                      <input
                        type="number"
                        min={project.trim.start + 0.1}
                        max={totalDuration}
                        step="0.1"
                        value={Number(project.trim.end.toFixed(1))}
                        onChange={(e) => editorStore.trimVideo(project.trim.start, Number(e.target.value))}
                        className="w-full px-2 py-1 rounded-lg border border-[#E8E5DD] bg-[#FAF9F5] font-mono text-xs focus:outline-none focus:border-[#F2B705]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="py-2 px-3 rounded-lg bg-[#FAF9F5] border border-[#E8E5DD] text-center font-mono text-[11px] text-[#6B6B66]">
                    — → —
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 4. TEXT ANIMATION / KEYFRAMES (When selected) */}
        {selectedTextLayer ? (
          <div className="space-y-3 pt-2 border-t border-[#F0EEE8]">
            <button
              onClick={() => setIsTextOpen(!isTextOpen)}
              className="w-full flex items-center justify-between font-bold text-zinc-900 text-xs tracking-tight"
            >
              <span className="flex items-center gap-1.5 truncate pr-2">
                <Sparkles className="w-3.5 h-3.5 text-[#F2B705] shrink-0" />
                <span className="truncate">Animate &ldquo;{selectedTextLayer.content}&rdquo;</span>
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#6B6B66] shrink-0 transition-transform ${isTextOpen ? 'rotate-180' : ''}`} />
            </button>

            {isTextOpen && (
              <div className="space-y-3 pt-1">
                <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E8E5DD] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#6B6B66] font-medium">Playhead Reference</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-[#E8E5DD] text-zinc-800 font-semibold">
                      {project.playhead.toFixed(2)}s
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-[#6B6B66]">X ({textKfX}%)</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={textKfX}
                        onChange={(e) => setTextKfX(Number(e.target.value))}
                        className="w-full accent-[#F2B705]"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B6B66]">Y ({textKfY}%)</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={textKfY}
                        onChange={(e) => setTextKfY(Number(e.target.value))}
                        className="w-full accent-[#F2B705]"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B6B66]">Scale ({textKfScale}x)</span>
                      <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.05"
                        value={textKfScale}
                        onChange={(e) => setTextKfScale(Number(e.target.value))}
                        className="w-full accent-[#F2B705]"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B6B66]">Opacity ({textKfOpacity})</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={textKfOpacity}
                        onChange={(e) => setTextKfOpacity(Number(e.target.value))}
                        className="w-full accent-[#F2B705]"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      editorStore.addVideoKeyframe({
                        targetType: 'text',
                        targetId: selectedTextLayer.id,
                        time: Number(project.playhead.toFixed(2)),
                        properties: { x: textKfX, y: textKfY, scale: textKfScale, opacity: textKfOpacity },
                      });
                    }}
                    className="w-full py-1.5 rounded-lg bg-[#F6C344] hover:bg-[#E9B332] text-zinc-900 font-semibold text-xs transition-colors flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Keyframe at {project.playhead.toFixed(1)}s</span>
                  </button>

                  {/* Text keyframes list */}
                  {textKeyframes.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-[#E8E5DD]/70">
                      <span className="text-[10px] font-semibold text-zinc-700">Existing Keyframes</span>
                      {textKeyframes.map((kf) => (
                        <div
                          key={kf.id}
                          className="p-1.5 rounded bg-white border border-[#E8E5DD] flex items-center justify-between text-xs"
                        >
                          <div
                            className="cursor-pointer font-mono text-[11px]"
                            onClick={() => editorStore.setPlayhead(kf.time)}
                            title="Click to jump to keyframe"
                          >
                            <span className="font-bold text-zinc-900">{kf.time.toFixed(1)}s:</span>
                            <span className="ml-1 text-[#6B6B66]">
                              {kf.properties.scale !== undefined ? `s:${kf.properties.scale} ` : ''}
                              {kf.properties.opacity !== undefined ? `op:${kf.properties.opacity} ` : ''}
                              {kf.properties.x !== undefined ? `x:${kf.properties.x}% ` : ''}
                              {kf.properties.y !== undefined ? `y:${kf.properties.y}%` : ''}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => editorStore.removeVideoKeyframe(kf.id)}
                            className="text-[#6B6B66] hover:text-red-500 p-0.5 rounded transition-colors"
                            title="Delete keyframe"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </aside>
  );
};
