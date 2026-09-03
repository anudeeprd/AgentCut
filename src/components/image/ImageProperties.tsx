import React, { useState } from 'react';
import { 
  RotateCw, 
  FlipHorizontal, 
  FlipVertical, 
  Type, 
  Plus, 
  Trash2, 
  Sliders, 
  Crop
} from 'lucide-react';
import { useImageProject } from '../../store/useEditorStore';
import { editorStore } from '../../store/editorStore';
import { AspectRatio, SemanticPosition } from '../../types/editor';

interface ImagePropertiesProps {
  selectedTextId: string | null;
  onSelectTextId: (id: string | null) => void;
}

export const ImageProperties: React.FC<ImagePropertiesProps> = ({
  selectedTextId,
  onSelectTextId,
}) => {
  const project = useImageProject();
  const [activeTab, setActiveTab] = useState<'adjust' | 'text'>('adjust');
  const [newTextContent, setNewTextContent] = useState('');
  const [newTextPosition, setNewTextPosition] = useState<SemanticPosition>('bottom-center');

  if (!project.source) return null;

  const ratios: { label: string; value: AspectRatio }[] = [
    { label: 'Original', value: 'original' },
    { label: '1:1', value: '1:1' },
    { label: '4:5', value: '4:5' },
    { label: '16:9', value: '16:9' },
    { label: '9:16', value: '9:16' },
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

  const handleAddText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTextContent.trim()) return;
    const textId = editorStore.addImageText({
      content: newTextContent.trim(),
      position: newTextPosition,
      fontSize: 48,
    });
    setNewTextContent('');
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
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          <span>Adjust</span>
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-all ${
            activeTab === 'text'
              ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <Type className="w-3.5 h-3.5 text-indigo-400" />
          <span>Text ({project.textLayers.length})</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {activeTab === 'adjust' && (
          <>
            {/* Aspect Ratio */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <Crop className="w-3 h-3 text-indigo-400" />
                  Aspect Ratio
                </span>
                <span className="font-mono text-[10px] text-zinc-400">{project.canvas.aspectRatio}</span>
              </div>
              <div className="grid grid-cols-5 gap-1 bg-zinc-900/60 p-1 rounded-lg border border-zinc-800">
                {ratios.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => editorStore.setImageAspectRatio(r.value)}
                    className={`py-1.5 rounded text-center font-medium transition-all ${
                      project.canvas.aspectRatio === r.value
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Transforms */}
            <div className="space-y-2">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-zinc-400">
                Transform
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => editorStore.rotateImage(90)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Rotate 90°</span>
                </button>
                <button
                  onClick={() => editorStore.flipImage({ horizontal: !project.transform.flipX })}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border transition-colors ${
                    project.transform.flipX
                      ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                      : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span>Flip H</span>
                </button>
                <button
                  onClick={() => editorStore.flipImage({ vertical: !project.transform.flipY })}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border transition-colors ${
                    project.transform.flipY
                      ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                      : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <FlipVertical className="w-3.5 h-3.5" />
                  <span>Flip V</span>
                </button>
              </div>
            </div>

            {/* Adjustments */}
            <div className="space-y-3.5 border-t border-zinc-800/80 pt-4">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-zinc-400">
                Adjustments
              </span>

              {/* Brightness */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Brightness</span>
                  <span className="font-mono text-zinc-300">{project.adjustments.brightness > 0 ? `+${project.adjustments.brightness}` : project.adjustments.brightness}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={project.adjustments.brightness}
                  onChange={(e) => editorStore.adjustImage({ brightness: Number(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Contrast</span>
                  <span className="font-mono text-zinc-300">{project.adjustments.contrast > 0 ? `+${project.adjustments.contrast}` : project.adjustments.contrast}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={project.adjustments.contrast}
                  onChange={(e) => editorStore.adjustImage({ contrast: Number(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Saturation */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Saturation</span>
                  <span className="font-mono text-zinc-300">{project.adjustments.saturation > 0 ? `+${project.adjustments.saturation}` : project.adjustments.saturation}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={project.adjustments.saturation}
                  onChange={(e) => editorStore.adjustImage({ saturation: Number(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Grayscale */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Grayscale</span>
                  <span className="font-mono text-zinc-300">{project.adjustments.grayscale}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={project.adjustments.grayscale}
                  onChange={(e) => editorStore.adjustImage({ grayscale: Number(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Blur */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Blur</span>
                  <span className="font-mono text-zinc-300">{project.adjustments.blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={project.adjustments.blur}
                  onChange={(e) => editorStore.adjustImage({ blur: Number(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </>
        )}

        {activeTab === 'text' && (
          <div className="space-y-4">
            {/* Add New Text Form */}
            <form onSubmit={handleAddText} className="space-y-2.5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-zinc-400">
                Add Text Layer
              </span>
              <input
                type="text"
                placeholder="Enter text (e.g. Explore More)"
                value={newTextContent}
                onChange={(e) => setNewTextContent(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex gap-2">
                <select
                  value={newTextPosition}
                  onChange={(e) => setNewTextPosition(e.target.value as SemanticPosition)}
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 focus:outline-none focus:border-indigo-500"
                >
                  {positions.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!newTextContent.trim()}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </form>

            {/* Selected Layer Properties */}
            {selectedTextLayer ? (
              <div className="p-3 rounded-xl bg-zinc-900 border border-indigo-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-indigo-400">
                    Selected Text Layer
                  </span>
                  <button
                    onClick={() => {
                      editorStore.removeImageText(selectedTextLayer.id);
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
                      editorStore.updateImageText(selectedTextLayer.id, {
                        content: e.target.value,
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400">Position</label>
                  <select
                    value={selectedTextLayer.position || 'center'}
                    onChange={(e) =>
                      editorStore.updateImageText(selectedTextLayer.id, {
                        position: e.target.value as SemanticPosition,
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-300 focus:outline-none focus:border-indigo-500"
                  >
                    {positions.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-zinc-400 text-[10px]">
                    <span>Font Size</span>
                    <span className="font-mono text-zinc-300">{selectedTextLayer.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="16"
                    max="120"
                    value={selectedTextLayer.fontSize}
                    onChange={(e) =>
                      editorStore.updateImageText(selectedTextLayer.id, {
                        fontSize: Number(e.target.value),
                      })
                    }
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-zinc-400 text-[10px]">
                    <span>Opacity</span>
                    <span className="font-mono text-zinc-300">{Math.round(selectedTextLayer.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={selectedTextLayer.opacity * 100}
                    onChange={(e) =>
                      editorStore.updateImageText(selectedTextLayer.id, {
                        opacity: Number(e.target.value) / 100,
                      })
                    }
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            ) : (
              <p className="text-center text-zinc-500 py-4">
                Click any text on the canvas to edit its properties.
              </p>
            )}

            {/* Text Layers List */}
            <div className="space-y-1.5">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-zinc-400">
                All Layers ({project.textLayers.length})
              </span>
              {project.textLayers.map((layer) => (
                <div
                  key={layer.id}
                  onClick={() => onSelectTextId(layer.id)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                    selectedTextId === layer.id
                      ? 'bg-zinc-900 border-indigo-500 text-white'
                      : 'bg-zinc-900/40 border-zinc-800 text-zinc-300 hover:bg-zinc-900/80'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Type className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="font-medium truncate">{layer.content}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase shrink-0">
                    {layer.position}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
