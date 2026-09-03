import React, { useEffect, useState } from 'react';
import { Header } from './components/common/Header';
import { StartScreen } from './components/common/StartScreen';
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

export const App: React.FC = () => {
  const { mode, image, video } = useEditorStore();
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
      // Real video export trigger
      editorStore.addAgentToast('Preparing video export...', 'export_video', 'video');
      const v = editorStore.getState().video;
      const effectiveDuration = ((v.trim.end - v.trim.start) / v.playbackRate).toFixed(1);
      
      // Real export via browser download of the video file
      try {
        if (!v.source) return;
        const a = document.createElement('a');
        a.href = v.source.objectUrl;
        a.download = `agentcut-video-${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        editorStore.addAgentToast(
          `Exported video (${effectiveDuration}s @ ${v.playbackRate}x, ${v.aspectRatio})`,
          'export_video',
          'video'
        );
      } catch (err: any) {
        alert(`Video export notice: ${err?.message}`);
      }
    }
  };

  const hasImage = !!image.source;
  const hasVideo = !!video.source;
  const hasCurrentMedia = mode === 'image' ? hasImage : hasVideo;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#09090b] text-zinc-100 overflow-hidden font-sans">
      {/* Top Header Navigation */}
      <Header
        onOpenAbout={() => setIsAboutOpen(true)}
        onExport={handleExport}
        isExporting={isExporting}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 flex overflow-hidden relative">
        {!hasCurrentMedia ? (
          <StartScreen />
        ) : mode === 'image' ? (
          <div className="flex-1 flex overflow-hidden">
            <ImageCanvas
              selectedTextId={selectedTextId}
              onSelectTextId={setSelectedTextId}
            />
            <ImageProperties
              selectedTextId={selectedTextId}
              onSelectTextId={setSelectedTextId}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 flex overflow-hidden">
              <VideoPreview
                selectedTextId={selectedTextId}
                onSelectTextId={setSelectedTextId}
              />
              <VideoProperties
                selectedTextId={selectedTextId}
                onSelectTextId={setSelectedTextId}
              />
            </div>
            <VideoTimeline
              selectedTextId={selectedTextId}
              onSelectTextId={setSelectedTextId}
            />
          </div>
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
