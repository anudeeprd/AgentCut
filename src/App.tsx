import React, { useEffect, useState } from 'react';
import { Header } from './components/common/Header';
import { LeftToolRail } from './components/common/LeftToolRail';
import { ToastContainer } from './components/common/ToastContainer';
import { AboutDemoModal } from './components/common/AboutDemoModal';
import { ImageCanvas } from './components/image/ImageCanvas';
import { ImageProperties } from './components/image/ImageProperties';
import { VideoPreview } from './components/video/VideoPreview';
import { VideoProperties } from './components/video/VideoProperties';
import { VideoTimeline } from './components/video/VideoTimeline';
import { useEditorStore } from './store/useEditorStore';
import { editorStore } from './store/editorStore';
import { registerAgentCutTools } from './webmcp/registerTools';
import { exportImageCanvas } from './services/imageExport';
import { exportVideoComposition } from './services/videoExport';

export const App: React.FC = () => {
  const { mode, image, video } = useEditorStore();
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // WebMCP Registration with AbortController for StrictMode safety
  useEffect(() => {
    const controller = new AbortController();
    const registered = registerAgentCutTools(controller.signal);
    if (registered) {
      console.log('[AgentCut] WebMCP tools registered imperatively.');
    }
    return () => {
      controller.abort();
    };
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      // Undo: Cmd+Z
      if (isCmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (mode === 'image') {
          editorStore.undoImage();
        } else {
          editorStore.undoVideo();
        }
      }

      // Redo: Cmd+Shift+Z or Cmd+Y
      if (
        (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'z') ||
        (isCmdOrCtrl && e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        if (mode === 'image') {
          editorStore.redoImage();
        } else {
          editorStore.redoVideo();
        }
      }

      // Space: Play / Pause in video mode
      if (e.key === ' ' && mode === 'video' && video.source) {
        e.preventDefault();
        editorStore.setIsPlaying(!video.isPlaying);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, video.source, video.isPlaying]);

  // Handle Export
  const handleExport = async () => {
    if (mode === 'image') {
      if (!image.source) return;
      setIsExporting(true);
      try {
        const result = await exportImageCanvas(image, 'png', true);
        if (result.success) {
          editorStore.addAgentToast(`Exported ${result.fileName}`, 'export_image', 'image');
        } else {
          alert(`Export failed: ${result.error}`);
        }
      } catch (err: any) {
        alert(`Export failed: ${err?.message}`);
      } finally {
        setIsExporting(false);
      }
    } else {
      if (!video.source) return;
      setIsExporting(true);
      setExportProgress(0);
      try {
        const v = editorStore.getState().video;
        const result = await exportVideoComposition(v, {
          triggerDownload: true,
          onProgress: (p) => setExportProgress(p),
        });

        if (result.success) {
          const formatLabel = result.format === 'mp4' ? 'MP4' : 'WebM';
          editorStore.addAgentToast(
            `Exported edited video as ${formatLabel}`,
            'export_video',
            'video'
          );
        } else {
          editorStore.addAgentToast('Video export failed', 'export_video', 'video');
          alert(`Video export failed: ${result.error}`);
        }
      } catch (err: any) {
        editorStore.addAgentToast('Video export failed', 'export_video', 'video');
        alert(`Video export failed: ${err?.message}`);
      } finally {
        setIsExporting(false);
        setExportProgress(0);
      }
    }
  };

  const handleDownloadOriginal = () => {
    const v = editorStore.getState().video;
    if (!v.source) return;
    try {
      const a = document.createElement('a');
      a.href = v.source.objectUrl;
      a.download = `agentcut-source-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      editorStore.addAgentToast(
        'Downloaded original source video',
        'export_video',
        'video'
      );
    } catch (err: any) {
      alert(`Download notice: ${err?.message}`);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#FAF9F5] text-[#171717] overflow-hidden font-sans select-none">
      {/* Top Header Navigation */}
      <Header
        onOpenAbout={() => setIsAboutOpen(true)}
        onExport={handleExport}
        isExporting={isExporting}
        exportProgress={exportProgress}
        onDownloadOriginal={handleDownloadOriginal}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Vertical Tool Rail & Expandable Panels */}
        <LeftToolRail
          selectedTextId={selectedTextId}
          onSelectTextId={setSelectedTextId}
          onOpenAbout={() => setIsAboutOpen(true)}
        />

        {/* Center Canvas Area + Bottom Timeline in Video Mode */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#F7F6F2]">
          {/* Center Canvas / Video Viewport */}
          <div className="flex-1 flex overflow-hidden relative">
            {mode === 'image' ? (
              <ImageCanvas
                selectedTextId={selectedTextId}
                onSelectTextId={setSelectedTextId}
              />
            ) : (
              <VideoPreview
                selectedTextId={selectedTextId}
                onSelectTextId={setSelectedTextId}
              />
            )}
          </div>

          {/* Bottom Video Timeline (always visible in video mode) */}
          {mode === 'video' && (
            <VideoTimeline
              selectedTextId={selectedTextId}
              onSelectTextId={setSelectedTextId}
            />
          )}
        </div>

        {/* Right Contextual Inspector */}
        {mode === 'image' ? (
          <ImageProperties
            selectedTextId={selectedTextId}
            onSelectTextId={setSelectedTextId}
          />
        ) : (
          <VideoProperties
            selectedTextId={selectedTextId}
            onSelectTextId={setSelectedTextId}
          />
        )}
      </main>

      {/* Subtle WebMCP Agent Action Toasts */}
      <ToastContainer />

      {/* About Demo Modal */}
      <AboutDemoModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  );
};
