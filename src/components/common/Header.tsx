import React from 'react';
import { 
  Scissors, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Undo2, 
  Redo2, 
  HelpCircle, 
  Download,
  RotateCcw
} from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';
import { editorStore } from '../../store/editorStore';

interface HeaderProps {
  onOpenAbout: () => void;
  onExport: () => void;
  isExporting?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAbout, onExport, isExporting }) => {
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

  const handleReset = () => {
    if (mode === 'image') {
      editorStore.resetImage();
    } else {
      editorStore.resetVideo();
    }
  };

  const hasMedia = mode === 'image' ? !!image.source : !!video.source;

  return (
    <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-4 flex items-center justify-between z-20 select-none">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Scissors className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-white">AgentCut</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700/60 text-zinc-300 font-mono">
                WebMCP
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 hidden sm:block">Creative editing, agent-ready</p>
          </div>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center bg-zinc-900/90 p-0.5 rounded-lg border border-zinc-800">
        <button
          onClick={() => editorStore.setMode('image')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            mode === 'image'
              ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
          <span>Image</span>
        </button>
        <button
          onClick={() => editorStore.setMode('video')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            mode === 'video'
              ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <VideoIcon className="w-3.5 h-3.5 text-purple-400" />
          <span>Video</span>
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-zinc-900/80 rounded-md border border-zinc-800/80 p-0.5">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            title={`Undo ${mode} edit (Cmd+Z)`}
            className="p-1.5 rounded text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            title={`Redo ${mode} edit (Cmd+Shift+Z)`}
            className="p-1.5 rounded text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
          {hasMedia && (
            <button
              onClick={handleReset}
              title={`Reset ${mode} project`}
              className="p-1.5 rounded text-zinc-400 hover:text-zinc-100 transition-colors border-l border-zinc-800 ml-0.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* About Demo */}
        <button
          onClick={onOpenAbout}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden md:inline">About Demo</span>
        </button>

        {/* Export Button */}
        <button
          onClick={onExport}
          disabled={!hasMedia || isExporting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isExporting ? 'Exporting...' : 'Export'}</span>
        </button>
      </div>
    </header>
  );
};
