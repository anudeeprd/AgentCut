import React, { useState } from 'react';
import { 
  Sliders, 
  Type, 
  History as HistoryIcon, 
  Crop, 
  Plus, 
  Trash2,
  Clock
} from 'lucide-react';
import { useVideoProject } from '../../store/useEditorStore';
import { editorStore } from '../../store/editorStore';
import { AspectRatio, SemanticPosition } from '../../types/editor';

interface VideoPropertiesProps {
  selectedTextId: string | null;
  onSelectTextId: (id: string | null) => void;
}

export const VideoProperties: React.FC<VideoPropertiesProps> = ({
  selectedTextId,
  onSelectTextId,
}) => {
  const project = useVideoProject();
  const [activeTab, setActiveTab] = useState<'adjust' | 'text' | 'history'>('adjust');

  // New text state
  const [newContent, setNewContent] = useState('');
  const [newStartTime, setNewStartTime] = useState(2);
  const [newEndTime, setNewEndTime] = useState(6);
  const [newPosition, setNewPosition] = useState<SemanticPosition>('bottom-center');

  // Keyframe controls state
  const [textKfX, setTextKfX] = useState(50);
  const [textKfY, setTextKfY] = useState(50);
  const [textKfScale, setTextKfScale] = useState(1);
  const [textKfOpacity, setTextKfOpacity] = useState(1);

  const [videoKfX, setVideoKfX] = useState(50);
  const [videoKfY, setVideoKfY] = useState(50);
  const [videoKfScale, setVideoKfScale] = useState(1);

  if (!project.source) return null;

  const totalDuration = project.source.duration || 10;

  const ratios: { label: string; value: AspectRatio }[] = [
    { label: '16:9', value: '16:9' },
    { label: '9:16', value: '9:16' },
    { label: '1:1', value: '1:1' },
    { label: '4:5', value: '4:5' },
    { label: 'Original', value: 'original' },
  ];

  const positions: { label: string; value: SemanticPosition }[] = [
    { label: 'Top Left', value: 'top-left' },
    { label: 'Top Center', value: 'top-center' },
    { label: 'Top Right', value: 'top-right' },
    { label: 'Center', value: 'center' },
    { label: 'Bottom Left', value: 'bottom-left' },
    { label: 'Bottom Center', value: 'bottom-center' },
    { label: 'Bottom Right', value: 'bottom-right' },
  ];

  const selectedTextLayer = project.textLayers.find((l) => l.id === selectedTextId);

  React.useEffect(() => {
    if (selectedTextLayer) {
      setTextKfX(selectedTextLayer.x);
      setTextKfY(selectedTextLayer.y);
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

  const handleAddText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    const textId = editorStore.addVideoText({
      content: newContent.trim(),
      startTime: Number(newStartTime),
      endTime: Number(newEndTime),
      position: newPosition,
      fontSize: 42,
    });
    setNewContent('');
    onSelectTextId(textId);
    setActiveTab('text');
  };

  return (
    <aside className="w-80 border-l border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md flex flex-col h-full select-none text-xs">
      {/* Tabs */}
      <div className="flex border-b border-zinc-800/80 p-2 gap-1 bg-zinc-900/40">
        <button
          onClick={() => setActiveTab('adjust')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-all ${
            activeTab === 'adjust'
              ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-purple-400" />
          <span>Settings</span>
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-all ${
            activeTab === 'text'
              ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Type className="w-3.5 h-3.5 text-purple-400" />
          <span>Text ({project.textLayers.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-all ${
            activeTab === 'history'
              ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <HistoryIcon className="w-3.5 h-3.5 text-purple-400" />
          <span>History ({project.history.length})</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {activeTab === 'adjust' && (
          <>
            {/* Aspect Ratio */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <Crop className="w-3 h-3 text-purple-400" />
                  Aspect Ratio
                </span>
                <span className="font-mono text-[10px] text-zinc-400">{project.aspectRatio}</span>
              </div>
              <div className="grid grid-cols-5 gap-1 bg-zinc-900/60 p-1 rounded-lg border border-zinc-800">
                {ratios.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => editorStore.setVideoAspectRatio(r.value)}
                    className={`py-1.5 rounded text-center font-medium transition-all ${
                      project.aspectRatio === r.value
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Trim Controls */}
            <div className="space-y-3 border-t border-zinc-800/80 pt-4">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-zinc-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-purple-400" />
                Trim Range
              </span>

              {/* Start Time */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Trim Start</span>
                  <span className="font-mono text-zinc-300">{project.trim.start.toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.max(0, project.trim.end - 0.5)}
                  step="0.1"
                  value={project.trim.start}
                  onChange={(e) => editorStore.trimVideo(Number(e.target.value), project.trim.end)}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* End Time */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Trim End</span>
                  <span className="font-mono text-zinc-300">{project.trim.end.toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  min={project.trim.start + 0.5}
                  max={totalDuration}
                  step="0.1"
                  value={project.trim.end}
                  onChange={(e) => editorStore.trimVideo(project.trim.start, Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Playback Speed */}
            <div className="space-y-2 border-t border-zinc-800/80 pt-4">
              <div className="flex justify-between text-zinc-400">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Playback Speed</span>
                <span className="font-mono text-zinc-300">{project.playbackRate}×</span>
              </div>
              <div className="grid grid-cols-6 gap-1 bg-zinc-900/60 p-1 rounded-lg border border-zinc-800">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                  <button
                    key={s}
                    onClick={() => editorStore.setVideoSpeed(s)}
                    className={`py-1.5 rounded text-center font-medium font-mono text-[11px] transition-all ${
                      project.playbackRate === s
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Volume */}
            <div className="space-y-2 border-t border-zinc-800/80 pt-4">
              <div className="flex justify-between text-zinc-400">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Volume</span>
                <span className="font-mono text-zinc-300">{project.muted ? 'Muted' : `${project.volume}%`}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={project.muted ? 0 : project.volume}
                onChange={(e) => editorStore.setVideoVolume(Number(e.target.value), false)}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Video Animation Keyframes */}
            <div className="space-y-2.5 border-t border-zinc-800/80 pt-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-amber-400">
                  Video Animation
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  @ {project.playhead.toFixed(1)}s
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400">X (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={videoKfX}
                    onChange={(e) => setVideoKfX(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400">Y (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={videoKfY}
                    onChange={(e) => setVideoKfY(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400">Scale</label>
                  <input
                    type="number"
                    min="0.25"
                    max="3"
                    step="0.1"
                    value={videoKfScale}
                    onChange={(e) => setVideoKfScale(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  editorStore.addVideoKeyframe({
                    targetType: 'video',
                    time: Number(project.playhead.toFixed(2)),
                    properties: {
                      x: videoKfX,
                      y: videoKfY,
                      scale: videoKfScale,
                    },
                  });
                }}
                className="w-full py-1.5 rounded-lg bg-amber-600/80 hover:bg-amber-500 text-white font-medium text-[11px] flex items-center justify-center gap-1 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add video keyframe at playhead</span>
              </button>

              {/* List video keyframes */}
              {videoKeyframes.length > 0 && (
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {videoKeyframes.map((kf) => (
                    <div
                      key={kf.id}
                      className="flex items-center justify-between px-2 py-1 rounded bg-zinc-900/60 border border-zinc-800 text-[10px]"
                    >
                      <span className="font-mono text-amber-400">{kf.time.toFixed(1)}s</span>
                      <span className="text-zinc-400 font-mono text-[9px]">
                        {kf.properties.scale !== undefined && `S:${kf.properties.scale} `}
                        {kf.properties.x !== undefined && `X:${kf.properties.x} `}
                        {kf.properties.y !== undefined && `Y:${kf.properties.y}`}
                      </span>
                      <button
                        onClick={() => editorStore.removeVideoKeyframe(kf.id)}
                        className="text-red-400 hover:text-red-300 p-0.5 rounded hover:bg-red-500/10"
                        title="Delete keyframe"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'text' && (
          <div className="space-y-4">
            {/* Add Timed Text Overlay Form */}
            <form onSubmit={handleAddText} className="space-y-2.5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-zinc-400">
                Add Timed Text Overlay
              </span>
              <input
                type="text"
                placeholder="Enter text (e.g. Built with WebMCP)"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400">Start Time (s)</label>
                  <input
                    type="number"
                    min="0"
                    max={totalDuration}
                    step="0.5"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400">End Time (s)</label>
                  <input
                    type="number"
                    min="0.5"
                    max={totalDuration}
                    step="0.5"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-200"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <select
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value as SemanticPosition)}
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 focus:outline-none focus:border-purple-500"
                >
                  {positions.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!newContent.trim()}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-medium flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </form>

            {/* Selected Text Layer Inspector */}
            {selectedTextLayer ? (
              <div className="p-3 rounded-xl bg-zinc-900 border border-purple-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-purple-400">
                    Selected Text Overlay
                  </span>
                  <button
                    onClick={() => {
                      editorStore.removeVideoText(selectedTextLayer.id);
                      onSelectTextId(null);
                    }}
                    className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 transition-colors"
                    title="Delete layer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400">Content</label>
                  <input
                    type="text"
                    value={selectedTextLayer.content}
                    onChange={(e) =>
                      editorStore.updateVideoText(selectedTextLayer.id, {
                        content: e.target.value,
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-400">Start (s)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={selectedTextLayer.startTime}
                      onChange={(e) =>
                        editorStore.updateVideoText(selectedTextLayer.id, {
                          startTime: Number(e.target.value),
                        })
                      }
                      className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400">End (s)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={selectedTextLayer.endTime}
                      onChange={(e) =>
                        editorStore.updateVideoText(selectedTextLayer.id, {
                          endTime: Number(e.target.value),
                        })
                      }
                      className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-200"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400">Position</label>
                  <select
                    value={selectedTextLayer.position || 'bottom-center'}
                    onChange={(e) =>
                      editorStore.updateVideoText(selectedTextLayer.id, {
                        position: e.target.value as SemanticPosition,
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-300 focus:outline-none focus:border-purple-500"
                  >
                    {positions.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Text Animation Keyframes */}
                <div className="border-t border-zinc-800/80 pt-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold uppercase tracking-wider text-[10px] text-yellow-400">
                      Animation
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      @ {project.playhead.toFixed(1)}s
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-400">X (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={textKfX}
                        onChange={(e) => setTextKfX(Number(e.target.value))}
                        className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400">Y (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={textKfY}
                        onChange={(e) => setTextKfY(Number(e.target.value))}
                        className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400">Scale</label>
                      <input
                        type="number"
                        min="0.25"
                        max="3"
                        step="0.1"
                        value={textKfScale}
                        onChange={(e) => setTextKfScale(Number(e.target.value))}
                        className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400">Opacity</label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={textKfOpacity}
                        onChange={(e) => setTextKfOpacity(Number(e.target.value))}
                        className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-200"
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
                        properties: {
                          x: textKfX,
                          y: textKfY,
                          scale: textKfScale,
                          opacity: textKfOpacity,
                        },
                      });
                    }}
                    className="w-full py-1.5 rounded-lg bg-yellow-600/80 hover:bg-yellow-500 text-white font-medium text-[11px] flex items-center justify-center gap-1 transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add keyframe at playhead</span>
                  </button>

                  {/* List text layer keyframes */}
                  {textKeyframes.length > 0 && (
                    <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                      {textKeyframes.map((kf) => (
                        <div
                          key={kf.id}
                          className="flex items-center justify-between px-2 py-1 rounded bg-zinc-950 border border-zinc-800/80 text-[10px]"
                        >
                          <span className="font-mono text-yellow-400">{kf.time.toFixed(1)}s</span>
                          <span className="text-zinc-400 font-mono text-[9px]">
                            {kf.properties.scale !== undefined && `S:${kf.properties.scale} `}
                            {kf.properties.opacity !== undefined && `O:${kf.properties.opacity} `}
                            {kf.properties.x !== undefined && `X:${kf.properties.x} `}
                            {kf.properties.y !== undefined && `Y:${kf.properties.y}`}
                          </span>
                          <button
                            onClick={() => editorStore.removeVideoKeyframe(kf.id)}
                            className="text-red-400 hover:text-red-300 p-0.5 rounded hover:bg-red-500/10"
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
            ) : (
              <p className="text-center text-zinc-500 py-4">
                Click any text layer in the preview or timeline to edit it.
              </p>
            )}

            {/* List of layers */}
            <div className="space-y-1.5">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-zinc-400">
                All Overlays ({project.textLayers.length})
              </span>
              {project.textLayers.map((layer) => (
                <div
                  key={layer.id}
                  onClick={() => onSelectTextId(layer.id)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                    selectedTextId === layer.id
                      ? 'bg-zinc-900 border-purple-500 text-white'
                      : 'bg-zinc-900/40 border-zinc-800 text-zinc-300 hover:bg-zinc-900/80'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Type className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="font-medium truncate">{layer.content}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase shrink-0">
                    {layer.startTime}s - {layer.endTime}s
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-2">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-zinc-400">
              Video Edit History
            </span>
            {project.history.length === 0 ? (
              <p className="text-zinc-500 py-4 text-center">No video edits yet.</p>
            ) : (
              <div className="space-y-1">
                {project.history.map((h, i) => (
                  <div
                    key={h.entry.id}
                    className="p-2 rounded bg-zinc-900/50 border border-zinc-800/80 flex items-center justify-between"
                  >
                    <span className="text-zinc-200">{h.entry.label}</span>
                    <span className="font-mono text-[10px] text-zinc-500">#{i + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
