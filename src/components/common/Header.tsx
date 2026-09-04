import React from 'react';
import { 
  Undo2, 
  Redo2, 
  Download, 
  ChevronDown,
  HelpCircle,
} from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';
import { editorStore } from '../../store/editorStore';

interface HeaderProps {
  onOpenAbout: () => void;
  onExport: () => void;
  isExporting?: boolean;
  exportProgress?: number;
  onDownloadOriginal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAbout,
  onExport,
  isExporting,
  exportProgress = 0,
  onDownloadOriginal,
}) => {
  const { mode, image, video } = useEditorStore();

  const canUndo = mode === 'image' ? image.history.length > 0 : video.history.length > 0;
  const canRedo = mode === 'image' ? image.future.length > 0 : video.future.length > 0;

  const handleUndo = () => {
    if (mode === 'image') {
      editorStore.undoImage();
    } else {
      editorStore.undoVideo();
    }
  };

  const handleRedo = () => {
    if (mode === 'image') {
      editorStore.redoImage();
    } else {
      editorStore.redoVideo();
    }
  };

  const hasMedia = mode === 'image' ? !!image.source : !!video.source;

  return (
    <header className="h-14 border-b border-[#E8E5DD] bg-white px-5 flex items-center justify-between z-30 select-none shadow-subtle shrink-0">
      {/* Left: Brand & WebMCP Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {/* Yellow Folded Logo Mark */}
          <div className="w-7 h-7 rounded-lg bg-[#F6C344] flex items-center justify-center shadow-xs">
            <svg className="w-4 h-4 text-zinc-900" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 19.5h5.5l4.5-8 4.5 8H22L12 2z" />
            </svg>
          </div>
          <span className="font-bold text-base tracking-tight text-[#171717]">
            AgentCut
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FFF5D6] border border-[#F6C344]/50 text-[#8C6200] font-semibold">
            WebMCP
          </span>
        </div>
      </div>

      {/* Center: Mode Segmented Switch + Undo / Redo */}
      <div className="flex items-center gap-3">
        {/* Mode Toggle */}
        <div className="flex items-center bg-[#F3F1EB] p-1 rounded-xl border border-[#E8E5DD]">
          <button
            onClick={() => editorStore.setMode('image')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              mode === 'image'
                ? 'bg-white text-[#171717] shadow-xs'
                : 'text-[#6B6B66] hover:text-[#171717]'
            }`}
          >
            Image
          </button>
          <button
            onClick={() => editorStore.setMode('video')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              mode === 'video'
                ? 'bg-white text-[#D99B00] shadow-xs'
                : 'text-[#6B6B66] hover:text-[#171717]'
            }`}
          >
            Video
          </button>
        </div>

        {/* Undo / Redo Actions */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            title={`Undo ${mode} edit (Cmd+Z)`}
            className="p-1.5 rounded-lg text-[#6B6B66] hover:text-[#171717] hover:bg-[#F7F6F2] disabled:opacity-30 transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            title={`Redo ${mode} edit (Cmd+Shift+Z)`}
            className="p-1.5 rounded-lg text-[#6B6B66] hover:text-[#171717] hover:bg-[#F7F6F2] disabled:opacity-30 transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right: About Demo, Download Original, Export CTA */}
      <div className="flex items-center gap-2.5">
        {/* About Demo Button */}
        <button
          onClick={onOpenAbout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-700 bg-white hover:bg-[#FAF9F5] border border-[#E8E5DD] shadow-subtle transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5 text-zinc-500" />
          <span>About Demo</span>
        </button>

        {/* Secondary Download Original (video mode only) */}
        {mode === 'video' && hasMedia && onDownloadOriginal && (
          <button
            onClick={onDownloadOriginal}
            disabled={isExporting}
            title="Download original unedited source video file"
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-700 bg-white hover:bg-[#FAF9F5] border border-[#E8E5DD] shadow-subtle disabled:opacity-40 transition-colors"
          >
            <span>Download Original</span>
          </button>
        )}

        {/* Primary Yellow Export Button */}
        <button
          onClick={onExport}
          disabled={!hasMedia || isExporting}
          title={
            mode === 'image'
              ? 'Export edited image with all adjustments, crops, and text layers'
              : 'Export rendered video composition (MP4/WebM) with trims, crops, keyframe motion, and text overlays'
          }
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-zinc-900 bg-[#F6C344] hover:bg-[#E9B332] active:bg-[#D99B00] shadow-subtle disabled:opacity-40 transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>
            {mode === 'image'
              ? isExporting
                ? 'Exporting...'
                : 'Export'
              : isExporting
              ? `Rendering… ${exportProgress}%`
              : 'Export'}
          </span>
          <ChevronDown className="w-3 h-3 opacity-70" />
        </button>
      </div>
    </header>
  );
};
