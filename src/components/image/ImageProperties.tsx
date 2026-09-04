import React, { useState } from 'react';
import { 
  RotateCw, 
  FlipHorizontal, 
  FlipVertical, 
  ChevronDown,
  Sun,
  Contrast,
  Sparkles
} from 'lucide-react';
import { useImageProject } from '../../store/useEditorStore';
import { editorStore } from '../../store/editorStore';
import { AspectRatio } from '../../types/editor';

interface ImagePropertiesProps {
  selectedTextId?: string | null;
  onSelectTextId?: (id: string | null) => void;
}

export const ImageProperties: React.FC<ImagePropertiesProps> = () => {
  const project = useImageProject();
  const [isAspectOpen, setIsAspectOpen] = useState(true);
  const [isTransformOpen, setIsTransformOpen] = useState(true);
  const [isAdjustOpen, setIsAdjustOpen] = useState(true);

  const hasMedia = !!project.source;

  const ratios: { label: string; value: AspectRatio }[] = [
    { label: '16:9', value: '16:9' },
    { label: '9:16', value: '9:16' },
    { label: '1:1', value: '1:1' },
    { label: '4:5', value: '4:5' },
    { label: 'Original', value: 'original' },
  ];

  const handleResetAdjustments = () => {
    if (!hasMedia) return;
    editorStore.adjustImage({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      grayscale: 0,
      blur: 0,
    });
  };

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
                const isSelected = project.canvas.aspectRatio === r.value;
                return (
                  <button
                    key={r.value}
                    onClick={() => editorStore.setImageAspectRatio(r.value)}
                    className={`py-2 px-2.5 rounded-xl text-center text-xs font-medium transition-all ${
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

        {/* 2. TRANSFORM SECTION */}
        <div className="space-y-2.5 pt-2 border-t border-[#F0EEE8]">
          <button
            onClick={() => setIsTransformOpen(!isTransformOpen)}
            className="w-full flex items-center justify-between font-bold text-zinc-900 text-xs tracking-tight"
          >
            <span>Transform</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#6B6B66] transition-transform ${isTransformOpen ? 'rotate-180' : ''}`} />
          </button>
          {isTransformOpen && (
            <div className={`space-y-3 pt-1 ${!hasMedia ? 'opacity-50' : ''}`}>
              <div className="flex gap-1.5">
                <button
                  disabled={!hasMedia}
                  onClick={() => editorStore.rotateImage(90)}
                  className="flex-1 py-2 px-2.5 rounded-xl bg-white border border-[#E8E5DD] hover:bg-[#FAF9F5] text-zinc-800 flex items-center justify-center gap-1.5 text-xs font-medium shadow-subtle transition-colors disabled:cursor-not-allowed"
                >
                  <RotateCw className="w-3.5 h-3.5 text-[#F2B705]" />
                  <span>Rotate 90°</span>
                </button>
                <button
                  disabled={!hasMedia}
                  onClick={() => editorStore.flipImage({ horizontal: !project.transform.flipX })}
                  className={`flex-1 py-2 px-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1 shadow-subtle transition-colors disabled:cursor-not-allowed ${
                    project.transform.flipX
                      ? 'bg-[#FFF5D6] border-[#F2B705] text-zinc-900'
                      : 'bg-white border-[#E8E5DD] hover:bg-[#FAF9F5] text-zinc-800'
                  }`}
                >
                  <FlipHorizontal className="w-3.5 h-3.5 text-[#F2B705]" />
                  <span>Flip H</span>
                </button>
                <button
                  disabled={!hasMedia}
                  onClick={() => editorStore.flipImage({ vertical: !project.transform.flipY })}
                  className={`flex-1 py-2 px-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1 shadow-subtle transition-colors disabled:cursor-not-allowed ${
                    project.transform.flipY
                      ? 'bg-[#FFF5D6] border-[#F2B705] text-zinc-900'
                      : 'bg-white border-[#E8E5DD] hover:bg-[#FAF9F5] text-zinc-800'
                  }`}
                >
                  <FlipVertical className="w-3.5 h-3.5 text-[#F2B705]" />
                  <span>Flip V</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. ADJUST SECTION */}
        <div className="space-y-2.5 pt-2 border-t border-[#F0EEE8]">
          <button
            onClick={() => setIsAdjustOpen(!isAdjustOpen)}
            className="w-full flex items-center justify-between font-bold text-zinc-900 text-xs tracking-tight"
          >
            <span>Adjust</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#6B6B66] transition-transform ${isAdjustOpen ? 'rotate-180' : ''}`} />
          </button>
          {isAdjustOpen && (
            <div className={`space-y-3 pt-1 ${!hasMedia ? 'opacity-50' : ''}`}>
              {/* Brightness */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px] text-[#6B6B66]">
                  <span className="flex items-center gap-1 text-zinc-800 font-medium">
                    <Sun className="w-3.5 h-3.5 text-[#F2B705]" />
                    Brightness
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#FAF9F5] border border-[#E8E5DD] font-mono text-[10px] text-zinc-800">
                    {hasMedia ? project.adjustments.brightness : '0'}
                  </span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  disabled={!hasMedia}
                  value={hasMedia ? project.adjustments.brightness : 0}
                  onChange={(e) => editorStore.adjustImage({ brightness: Number(e.target.value) })}
                  className="w-full accent-[#F2B705] disabled:cursor-not-allowed"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px] text-[#6B6B66]">
                  <span className="flex items-center gap-1 text-zinc-800 font-medium">
                    <Contrast className="w-3.5 h-3.5 text-[#F2B705]" />
                    Contrast
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#FAF9F5] border border-[#E8E5DD] font-mono text-[10px] text-zinc-800">
                    {hasMedia ? project.adjustments.contrast : '0'}
                  </span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  disabled={!hasMedia}
                  value={hasMedia ? project.adjustments.contrast : 0}
                  onChange={(e) => editorStore.adjustImage({ contrast: Number(e.target.value) })}
                  className="w-full accent-[#F2B705] disabled:cursor-not-allowed"
                />
              </div>

              {/* Saturation */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px] text-[#6B6B66]">
                  <span className="flex items-center gap-1 text-zinc-800 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-[#F2B705]" />
                    Saturation
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#FAF9F5] border border-[#E8E5DD] font-mono text-[10px] text-zinc-800">
                    {hasMedia ? project.adjustments.saturation : '0'}
                  </span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  disabled={!hasMedia}
                  value={hasMedia ? project.adjustments.saturation : 0}
                  onChange={(e) => editorStore.adjustImage({ saturation: Number(e.target.value) })}
                  className="w-full accent-[#F2B705] disabled:cursor-not-allowed"
                />
              </div>

              {/* Blur */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px] text-[#6B6B66]">
                  <span className="text-zinc-800 font-medium">Blur</span>
                  <span className="px-2 py-0.5 rounded bg-[#FAF9F5] border border-[#E8E5DD] font-mono text-[10px] text-zinc-800">
                    {hasMedia ? `${project.adjustments.blur}px` : '0px'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  disabled={!hasMedia}
                  value={hasMedia ? project.adjustments.blur : 0}
                  onChange={(e) => editorStore.adjustImage({ blur: Number(e.target.value) })}
                  className="w-full accent-[#F2B705] disabled:cursor-not-allowed"
                />
              </div>

              <button
                disabled={!hasMedia}
                onClick={handleResetAdjustments}
                className="w-full py-1.5 rounded-lg border border-[#E8E5DD] hover:bg-[#FAF9F5] text-zinc-700 text-xs font-medium transition-colors disabled:cursor-not-allowed"
              >
                Reset Adjustments
              </button>
            </div>
          )}
        </div>

      </div>
    </aside>
  );
};
