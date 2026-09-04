import React, { useRef, useState } from 'react';
import {
  FolderOpen,
  Type,
  SlidersHorizontal,
  Sparkles,
  History,
  X,
  Plus,
  Trash2,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Volume2,
  VolumeX,
  RotateCcw,
  Bold,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';
import { editorStore } from '../../store/editorStore';
import { AspectRatio, SemanticPosition } from '../../types/editor';
import { CURATED_FONTS } from '../../constants/fonts';

interface LeftToolRailProps {
  selectedTextId: string | null;
  onSelectTextId: (id: string | null) => void;
  onOpenAbout: () => void;
}

export type ToolTab = 'media' | 'text' | 'adjust' | 'animation' | 'history';

export const LeftToolRail: React.FC<LeftToolRailProps> = ({
  selectedTextId,
  onSelectTextId,
  onOpenAbout,
}) => {
  const { mode, image, video } = useEditorStore();
  const hasMedia = mode === 'image' ? !!image.source : !!video.source;
  const [activeTab, setActiveTab] = useState<ToolTab | null>(!hasMedia ? 'media' : null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // New text state for text panel
  const [newTextContent, setNewTextContent] = useState('');

  // Keyframe controls state for animation panel
  const [kfX, setKfX] = useState(50);
  const [kfY, setKfY] = useState(50);
  const [kfScale, setKfScale] = useState(1);
  const [kfOpacity, setKfOpacity] = useState(1);

  const toggleTab = (tab: ToolTab) => {
    setActiveTab((prev) => (prev === tab ? null : tab));
  };

  // Demo loaders
  const handleLoadDemoImage = () => {
    editorStore.setMode('image');
    editorStore.loadImage({
      fileName: 'sample-image.jpg',
      width: 1920,
      height: 1080,
      objectUrl: '/demo/sample-image.jpg',
      isDemo: true,
    });
  };

  const handleLoadDemoVideo = () => {
    editorStore.setMode('video');
    editorStore.loadVideo({
      fileName: 'sample-video.mp4',
      duration: 10.0,
      width: 1280,
      height: 720,
      objectUrl: '/demo/sample-video.mp4',
      isDemo: true,
    });
  };

  // Upload handlers
  const handleImageUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      editorStore.setMode('image');
      editorStore.loadImage({
        fileName: file.name,
        width: img.naturalWidth || 1920,
        height: img.naturalHeight || 1080,
        objectUrl: url,
      });
    };
    img.src = url;
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

  // Add text layer
  const handleAddText = (e: React.FormEvent) => {
    e.preventDefault();
    const content = newTextContent.trim() || 'New Text';
    if (mode === 'image') {
      const id = editorStore.addImageText({
        content,
        position: 'center',
        fontSize: 48,
      });
      onSelectTextId(id);
    } else {
      const startTime = video.playhead || 2;
      const endTime = Math.min((video.source?.duration || 10), startTime + 4);
      const id = editorStore.addVideoText({
        content,
        startTime,
        endTime,
        position: 'center',
        fontSize: 42,
      });
      onSelectTextId(id);
    }
    setNewTextContent('');
  };

  const selectedTextLayer =
    mode === 'image'
      ? image.textLayers.find((l) => l.id === selectedTextId)
      : video.textLayers.find((l) => l.id === selectedTextId);

  // Sync animation values when selected text layer changes
  React.useEffect(() => {
    if (selectedTextLayer && mode === 'video') {
      const vt = selectedTextLayer as any;
      setKfX(vt.x ?? 50);
      setKfY(vt.y ?? 50);
      setKfScale(1);
      setKfOpacity(vt.opacity ?? 1);
    }
    if (selectedTextId) {
      setActiveTab('text');
    }
  }, [selectedTextId, selectedTextLayer?.id, mode]);

  const ratios: AspectRatio[] =
    mode === 'image'
      ? ['original', '1:1', '4:5', '16:9', '9:16']
      : ['16:9', '9:16', '1:1', '4:5', 'original'];

  const positions: { label: string; value: SemanticPosition }[] = [
    { label: 'Top Left', value: 'top-left' },
    { label: 'Top Center', value: 'top-center' },
    { label: 'Top Right', value: 'top-right' },
    { label: 'Center', value: 'center' },
    { label: 'Bottom Left', value: 'bottom-left' },
    { label: 'Bottom Center', value: 'bottom-center' },
    { label: 'Bottom Right', value: 'bottom-right' },
  ];

  return (
    <aside className="flex h-full z-10 select-none">
      {/* Narrow Vertical Rail */}
      <div className="w-16 bg-white border-r border-[#E8E5DD] flex flex-col items-center justify-between py-3 shadow-subtle shrink-0">
        {/* Main Tool Items */}
        <div className="flex flex-col items-center gap-1.5 w-full px-1.5">
          {/* Media */}
          <button
            onClick={() => toggleTab('media')}
            title="Media (Upload / Demo)"
            className={`w-full flex flex-col items-center justify-center py-2.5 rounded-xl transition-all ${
              activeTab === 'media'
                ? 'bg-[#FFF5D6] text-zinc-900 border border-[#F2B705] font-semibold'
                : 'text-[#6B6B66] hover:text-[#171717] hover:bg-[#F7F6F2]'
            }`}
          >
            <FolderOpen className={`w-4 h-4 mb-1 ${activeTab === 'media' ? 'text-[#D99B00]' : ''}`} />
            <span className="text-[10px] tracking-tight">Media</span>
          </button>

          {/* Text */}
          <button
            onClick={() => toggleTab('text')}
            title="Text Layers"
            className={`w-full flex flex-col items-center justify-center py-2.5 rounded-xl transition-all ${
              activeTab === 'text'
                ? 'bg-[#FFF5D6] text-zinc-900 border border-[#F2B705] font-semibold'
                : 'text-[#6B6B66] hover:text-[#171717] hover:bg-[#F7F6F2]'
            }`}
          >
            <Type className={`w-4 h-4 mb-1 ${activeTab === 'text' ? 'text-[#D99B00]' : ''}`} />
            <span className="text-[10px] tracking-tight">Text</span>
          </button>

          {/* Adjust */}
          <button
            onClick={() => toggleTab('adjust')}
            title="Adjustments & Transforms"
            className={`w-full flex flex-col items-center justify-center py-2.5 rounded-xl transition-all ${
              activeTab === 'adjust'
                ? 'bg-[#FFF5D6] text-zinc-900 border border-[#F2B705] font-semibold'
                : 'text-[#6B6B66] hover:text-[#171717] hover:bg-[#F7F6F2]'
            }`}
          >
            <SlidersHorizontal className={`w-4 h-4 mb-1 ${activeTab === 'adjust' ? 'text-[#D99B00]' : ''}`} />
            <span className="text-[10px] tracking-tight">Adjust</span>
          </button>

          {/* Animation (Video mode only) */}
          {mode === 'video' && (
            <button
              onClick={() => toggleTab('animation')}
              title="Animation Keyframes"
              className={`w-full flex flex-col items-center justify-center py-2.5 rounded-xl transition-all ${
                activeTab === 'animation'
                  ? 'bg-[#FFF5D6] text-zinc-900 border border-[#F2B705] font-semibold'
                  : 'text-[#6B6B66] hover:text-[#171717] hover:bg-[#F7F6F2]'
              }`}
            >
              <Sparkles className={`w-4 h-4 mb-1 ${activeTab === 'animation' ? 'text-[#D99B00]' : ''}`} />
              <span className="text-[10px] tracking-tight">Motion</span>
            </button>
          )}

          {/* History */}
          <button
            onClick={() => toggleTab('history')}
            title="Edit History"
            className={`w-full flex flex-col items-center justify-center py-2.5 rounded-xl transition-all ${
              activeTab === 'history'
                ? 'bg-[#FFF5D6] text-zinc-900 border border-[#F2B705] font-semibold'
                : 'text-[#6B6B66] hover:text-[#171717] hover:bg-[#F7F6F2]'
            }`}
          >
            <History className={`w-4 h-4 mb-1 ${activeTab === 'history' ? 'text-[#D99B00]' : ''}`} />
            <span className="text-[10px] tracking-tight">History</span>
          </button>
        </div>

        {/* Bottom WebMCP Status */}
        <div className="w-full px-1 flex flex-col items-center">
          <button
            onClick={onOpenAbout}
            title="WebMCP is active. Click to view architecture & sample prompts."
            className="flex flex-col items-center justify-center p-1.5 rounded-lg text-[#6B6B66] hover:text-zinc-900 hover:bg-[#F7F6F2] transition-colors"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 animate-pulse mb-1" />
            <span className="text-[9px] font-medium text-emerald-700">Ready</span>
          </button>
        </div>
      </div>

      {/* Expandable Side Panel (280px wide) */}
      {activeTab && (
        <div className="w-72 bg-white border-r border-[#E8E5DD] flex flex-col h-full shadow-card animate-in slide-in-from-left duration-200 z-20">
          {/* Panel Header */}
          <div className="h-12 border-b border-[#F0EEE8] px-4 flex items-center justify-between bg-[#FAF9F5]/70 shrink-0">
            <span className="text-xs font-bold text-[#171717] uppercase tracking-wider">
              {activeTab === 'media' && 'Media'}
              {activeTab === 'text' && 'Text Layers'}
              {activeTab === 'adjust' && 'Adjust & Format'}
              {activeTab === 'animation' && 'Animation Motion'}
              {activeTab === 'history' && 'Edit History'}
            </span>
            <button
              onClick={() => setActiveTab(null)}
              className="text-[#6B6B66] hover:text-[#171717] p-1 rounded-md hover:bg-[#F0EEE8] transition-colors"
              title="Close panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Panel Content Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* 1. MEDIA PANEL */}
            {activeTab === 'media' && (
              <div className="space-y-4">
                {hasMedia ? (
                  <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E8E5DD] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-900 truncate">
                        {mode === 'image' ? image.source?.fileName : video.source?.fileName}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-[#E8E5DD] text-[#6B6B66]">
                        {mode.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#6B6B66] font-mono">
                      {mode === 'image'
                        ? `${image.source?.width} × ${image.source?.height} px`
                        : `${video.source?.width} × ${video.source?.height} px · ${video.source?.duration.toFixed(1)}s`}
                    </div>
                  </div>
                ) : (
                  <p className="text-[#6B6B66] text-xs">No media loaded yet.</p>
                )}

                {/* Add / Upload Media Actions */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-zinc-700">Add Media</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => videoInputRef.current?.click()}
                      className="py-2 px-3 rounded-xl bg-[#F6C344] hover:bg-[#E9B332] text-center text-zinc-900 font-semibold transition-colors shadow-subtle flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Video</span>
                    </button>
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="py-2 px-3 rounded-xl bg-white border border-[#E8E5DD] hover:bg-[#FAF9F5] text-center text-zinc-800 font-semibold transition-colors shadow-subtle flex items-center justify-center gap-1.5"
                    >
                      <span>Add Image</span>
                    </button>
                  </div>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                  />
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleVideoUpload(file);
                    }}
                  />
                </div>

                {/* Instant Demo */}
                <div className="space-y-2 pt-2 border-t border-[#F0EEE8]">
                  <span className="text-[11px] font-semibold text-zinc-700">Instant Demo</span>
                  <div className="space-y-1.5">
                    <button
                      onClick={handleLoadDemoVideo}
                      className="w-full text-left py-2 px-3 rounded-lg bg-[#FAF9F5] hover:bg-[#FFF5D6] hover:border-[#F2B705] border border-[#E8E5DD] text-zinc-800 font-medium transition-colors flex items-center justify-between shadow-2xs"
                    >
                      <span>Demo Video</span>
                      <span className="text-[10px] text-[#8C6200] font-mono font-semibold">MP4</span>
                    </button>
                    <button
                      onClick={handleLoadDemoImage}
                      className="w-full text-left py-2 px-3 rounded-lg bg-[#FAF9F5] hover:bg-[#FFF5D6] hover:border-[#F2B705] border border-[#E8E5DD] text-zinc-800 font-medium transition-colors flex items-center justify-between shadow-2xs"
                    >
                      <span>Demo Image</span>
                      <span className="text-[10px] text-[#8C6200] font-mono font-semibold">JPG</span>
                    </button>
                  </div>
                </div>

                {/* Drag and drop hint */}
                <p className="text-[11px] text-[#6B6B66] text-center pt-1">
                  or drag & drop media here
                </p>
              </div>
            )}

            {/* 2. TEXT PANEL */}
            {activeTab === 'text' && (
              <div className="space-y-4">
                {/* Add Text Input */}
                <form onSubmit={handleAddText} className="space-y-2">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Add text..."
                      value={newTextContent}
                      onChange={(e) => setNewTextContent(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-[#E8E5DD] bg-[#FAF9F5] text-zinc-900 focus:outline-none focus:border-[#F2B705] text-xs"
                    />
                    <button
                      type="submit"
                      disabled={!hasMedia}
                      className="px-3 py-1.5 rounded-lg bg-[#F6C344] hover:bg-[#E9B332] text-zinc-900 font-semibold disabled:opacity-40 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </form>

                {/* Layer List */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-zinc-700">
                    Layers ({mode === 'image' ? image.textLayers.length : video.textLayers.length})
                  </span>
                  {(mode === 'image' ? image.textLayers : video.textLayers).length === 0 ? (
                    <p className="text-[11px] text-[#6B6B66] italic py-2">No text layers added yet.</p>
                  ) : (
                    (mode === 'image' ? image.textLayers : video.textLayers).map((l: any) => {
                      const isSel = selectedTextId === l.id;
                      return (
                        <div
                          key={l.id}
                          onClick={() => onSelectTextId(l.id)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSel
                              ? 'bg-[#FFF5D6] border-[#F2B705] shadow-xs'
                              : 'bg-white border-[#E8E5DD] hover:bg-[#FAF9F5]'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-zinc-900 truncate text-xs">{l.content}</p>
                            <p className="text-[10px] text-[#6B6B66] font-mono">
                              {mode === 'video' ? `${l.startTime.toFixed(1)}s - ${l.endTime.toFixed(1)}s` : `${l.position || 'center'}`}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (mode === 'image') {
                                editorStore.removeImageText(l.id);
                              } else {
                                editorStore.removeVideoText(l.id);
                              }
                              if (selectedTextId === l.id) onSelectTextId(null);
                            }}
                            className="text-[#6B6B66] hover:text-red-500 p-1 transition-colors"
                            title="Remove text"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Selected Layer Settings */}
                {selectedTextLayer && (
                  <div className="pt-3 border-t border-[#F0EEE8] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-zinc-800 uppercase tracking-wider">
                        Selected Text
                      </span>
                      <span className="text-[10px] font-mono text-[#6B6B66] truncate max-w-[120px]">
                        {selectedTextLayer.content}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="space-y-1">
                      <label className="text-[11px] text-[#6B6B66] font-medium">Content</label>
                      <input
                        type="text"
                        value={selectedTextLayer.content}
                        onChange={(e) => {
                          if (mode === 'image') {
                            editorStore.updateImageText(selectedTextLayer.id, { content: e.target.value });
                          } else {
                            editorStore.updateVideoText(selectedTextLayer.id, { content: e.target.value });
                          }
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-[#E8E5DD] bg-[#FAF9F5] text-zinc-900 text-xs focus:outline-none focus:border-[#F2B705]"
                      />
                    </div>

                    {/* Font Dropdown */}
                    <div className="space-y-1">
                      <label className="text-[11px] text-[#6B6B66] font-medium">Font</label>
                      <select
                        value={selectedTextLayer.fontFamily || 'Inter'}
                        onChange={(e) => {
                          if (mode === 'image') {
                            editorStore.updateImageText(selectedTextLayer.id, { fontFamily: e.target.value });
                          } else {
                            editorStore.updateVideoText(selectedTextLayer.id, { fontFamily: e.target.value });
                          }
                        }}
                        style={{ fontFamily: selectedTextLayer.fontFamily || 'Inter' }}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-[#E8E5DD] bg-[#FAF9F5] text-zinc-900 text-xs focus:outline-none focus:border-[#F2B705] cursor-pointer"
                      >
                        {CURATED_FONTS.map((font) => (
                          <option key={font} value={font} style={{ fontFamily: font }}>
                            {font}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Size & Weight */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] text-[#6B6B66] font-medium">Size</label>
                        <input
                          type="number"
                          min="12"
                          max="160"
                          value={selectedTextLayer.fontSize}
                          onChange={(e) => {
                            const size = Number(e.target.value);
                            if (mode === 'image') {
                              editorStore.updateImageText(selectedTextLayer.id, { fontSize: size });
                            } else {
                              editorStore.updateVideoText(selectedTextLayer.id, { fontSize: size });
                            }
                          }}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-[#E8E5DD] bg-[#FAF9F5] text-zinc-900 font-mono text-xs focus:outline-none focus:border-[#F2B705]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-[#6B6B66] font-medium">Weight</label>
                        <button
                          type="button"
                          onClick={() => {
                            const nextWeight = selectedTextLayer.fontWeight === 'bold' ? 'normal' : 'bold';
                            if (mode === 'image') {
                              editorStore.updateImageText(selectedTextLayer.id, { fontWeight: nextWeight });
                            } else {
                              editorStore.updateVideoText(selectedTextLayer.id, { fontWeight: nextWeight });
                            }
                          }}
                          className={`w-full py-1.5 px-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                            selectedTextLayer.fontWeight === 'bold'
                              ? 'bg-[#FFF5D6] border-[#F2B705] text-zinc-900 shadow-xs'
                              : 'bg-white border-[#E8E5DD] text-zinc-700 hover:bg-[#FAF9F5]'
                          }`}
                        >
                          <Bold className="w-3.5 h-3.5" />
                          <span>Bold</span>
                        </button>
                      </div>
                    </div>

                    {/* Position */}
                    <div className="space-y-1">
                      <label className="text-[11px] text-[#6B6B66] font-medium">Position</label>
                      <select
                        value={selectedTextLayer.position || 'center'}
                        onChange={(e) => {
                          const pos = e.target.value as SemanticPosition;
                          if (mode === 'image') {
                            editorStore.updateImageText(selectedTextLayer.id, { position: pos });
                          } else {
                            editorStore.updateVideoText(selectedTextLayer.id, { position: pos });
                          }
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-[#E8E5DD] bg-[#FAF9F5] text-zinc-900 text-xs focus:outline-none focus:border-[#F2B705]"
                      >
                        {positions.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Alignment (Image mode) */}
                    {mode === 'image' && (
                      <div className="space-y-1">
                        <label className="text-[11px] text-[#6B6B66] font-medium">Alignment</label>
                        <div className="flex gap-1.5">
                          {(['left', 'center', 'right'] as const).map((align) => {
                            const isSel = ((selectedTextLayer as any).alignment || 'center') === align;
                            return (
                              <button
                                key={align}
                                type="button"
                                onClick={() => editorStore.updateImageText(selectedTextLayer.id, { alignment: align })}
                                className={`flex-1 py-1 rounded-lg border flex items-center justify-center transition-colors ${
                                  isSel
                                    ? 'bg-[#FFF5D6] border-[#F2B705] text-zinc-900 shadow-xs'
                                    : 'bg-white border-[#E8E5DD] text-zinc-600 hover:bg-[#FAF9F5]'
                                }`}
                              >
                                {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                                {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                                {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Timing (Video mode) */}
                    {mode === 'video' && (
                      <div className="space-y-1">
                        <span className="text-[11px] text-[#6B6B66] font-medium">Timing</span>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <span className="text-[10px] text-[#6B6B66]">Start</span>
                            <input
                              type="number"
                              min="0"
                              max={(selectedTextLayer as any).endTime - 0.1}
                              step="0.1"
                              value={Number(((selectedTextLayer as any).startTime || 0).toFixed(1))}
                              onChange={(e) => editorStore.updateVideoText(selectedTextLayer.id, { startTime: Number(e.target.value) })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-[#E8E5DD] bg-[#FAF9F5] text-zinc-900 font-mono text-xs focus:outline-none focus:border-[#F2B705]"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-[#6B6B66]">End</span>
                            <input
                              type="number"
                              min={((selectedTextLayer as any).startTime || 0) + 0.1}
                              max={video.source?.duration || 10}
                              step="0.1"
                              value={Number(((selectedTextLayer as any).endTime || 0).toFixed(1))}
                              onChange={(e) => editorStore.updateVideoText(selectedTextLayer.id, { endTime: Number(e.target.value) })}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-[#E8E5DD] bg-[#FAF9F5] text-zinc-900 font-mono text-xs focus:outline-none focus:border-[#F2B705]"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Opacity */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[11px] text-[#6B6B66]">
                        <span className="font-medium">Opacity</span>
                        <span className="font-mono">{Math.round((selectedTextLayer.opacity ?? 1) * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={selectedTextLayer.opacity ?? 1}
                        onChange={(e) => {
                          const opacity = Number(e.target.value);
                          if (mode === 'image') {
                            editorStore.updateImageText(selectedTextLayer.id, { opacity });
                          } else {
                            editorStore.updateVideoText(selectedTextLayer.id, { opacity });
                          }
                        }}
                        className="w-full accent-[#F2B705]"
                      />
                    </div>

                    {/* Color */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[11px] text-[#6B6B66]">
                        <span className="font-medium">Color</span>
                        <span className="font-mono text-[10px]">{selectedTextLayer.color || '#ffffff'}</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={selectedTextLayer.color || '#ffffff'}
                          onChange={(e) => {
                            if (mode === 'image') {
                              editorStore.updateImageText(selectedTextLayer.id, { color: e.target.value });
                            } else {
                              editorStore.updateVideoText(selectedTextLayer.id, { color: e.target.value });
                            }
                          }}
                          className="w-8 h-8 rounded-lg border border-[#E8E5DD] p-0.5 cursor-pointer bg-white shrink-0"
                        />
                        <input
                          type="text"
                          value={selectedTextLayer.color || '#ffffff'}
                          onChange={(e) => {
                            if (mode === 'image') {
                              editorStore.updateImageText(selectedTextLayer.id, { color: e.target.value });
                            } else {
                              editorStore.updateVideoText(selectedTextLayer.id, { color: e.target.value });
                            }
                          }}
                          className="flex-1 px-2.5 py-1.5 rounded-xl border border-[#E8E5DD] bg-[#FAF9F5] text-zinc-900 font-mono text-xs focus:outline-none focus:border-[#F2B705]"
                        />
                      </div>
                    </div>

                    {/* Remove Layer */}
                    <button
                      type="button"
                      onClick={() => {
                        if (mode === 'image') {
                          editorStore.removeImageText(selectedTextLayer.id);
                        } else {
                          editorStore.removeVideoText(selectedTextLayer.id);
                        }
                        onSelectTextId(null);
                      }}
                      className="w-full py-1.5 rounded-xl bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Layer</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3. ADJUST PANEL */}
            {activeTab === 'adjust' && (
              <div className="space-y-4">
                {/* Aspect Ratio */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-zinc-700">Aspect Ratio</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {ratios.map((r) => {
                      const cur = mode === 'image' ? image.canvas.aspectRatio : video.aspectRatio;
                      const isSel = cur === r;
                      return (
                        <button
                          key={r}
                          onClick={() => {
                            if (mode === 'image') {
                              editorStore.setImageAspectRatio(r);
                            } else {
                              editorStore.setVideoAspectRatio(r);
                            }
                          }}
                          className={`py-1.5 px-2 rounded-lg text-center font-mono text-xs transition-all ${
                            isSel
                              ? 'bg-[#FFF5D6] border border-[#F2B705] text-zinc-900 font-semibold shadow-xs'
                              : 'bg-[#FAF9F5] border border-[#E8E5DD] text-zinc-700 hover:bg-white'
                          }`}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Transforms (Image mode) */}
                {mode === 'image' && (
                  <div className="space-y-2 pt-2 border-t border-[#F0EEE8]">
                    <span className="text-[11px] font-semibold text-zinc-700">Transforms</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => editorStore.rotateImage(90)}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-[#FAF9F5] border border-[#E8E5DD] hover:bg-white text-zinc-800 flex items-center justify-center gap-1 text-xs"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>90°</span>
                      </button>
                      <button
                        onClick={() => editorStore.flipImage({ horizontal: !image.transform.flipX })}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-[#FAF9F5] border border-[#E8E5DD] hover:bg-white text-zinc-800 flex items-center justify-center gap-1 text-xs"
                      >
                        <FlipHorizontal className="w-3.5 h-3.5" />
                        <span>Flip H</span>
                      </button>
                      <button
                        onClick={() => editorStore.flipImage({ vertical: !image.transform.flipY })}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-[#FAF9F5] border border-[#E8E5DD] hover:bg-white text-zinc-800 flex items-center justify-center gap-1 text-xs"
                      >
                        <FlipVertical className="w-3.5 h-3.5" />
                        <span>Flip V</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Color Adjustments (Image mode) */}
                {mode === 'image' && (
                  <div className="space-y-3 pt-2 border-t border-[#F0EEE8]">
                    <span className="text-[11px] font-semibold text-zinc-700">Color Adjustments</span>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-[11px] text-[#6B6B66]">
                          <span>Brightness</span>
                          <span className="font-mono">{image.adjustments.brightness}</span>
                        </div>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={image.adjustments.brightness}
                          onChange={(e) => editorStore.adjustImage({ brightness: Number(e.target.value) })}
                          className="w-full accent-[#F2B705]"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] text-[#6B6B66]">
                          <span>Contrast</span>
                          <span className="font-mono">{image.adjustments.contrast}</span>
                        </div>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={image.adjustments.contrast}
                          onChange={(e) => editorStore.adjustImage({ contrast: Number(e.target.value) })}
                          className="w-full accent-[#F2B705]"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] text-[#6B6B66]">
                          <span>Saturation</span>
                          <span className="font-mono">{image.adjustments.saturation}</span>
                        </div>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={image.adjustments.saturation}
                          onChange={(e) => editorStore.adjustImage({ saturation: Number(e.target.value) })}
                          className="w-full accent-[#F2B705]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Video Playback Speed & Volume */}
                {mode === 'video' && (
                  <div className="space-y-3 pt-2 border-t border-[#F0EEE8]">
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-zinc-700">Playback Speed</span>
                      <div className="flex gap-1">
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                          <button
                            key={s}
                            onClick={() => editorStore.setVideoSpeed(s)}
                            className={`flex-1 py-1 rounded text-center font-mono text-[11px] border ${
                              video.playbackRate === s
                                ? 'bg-[#FFF5D6] border-[#F2B705] text-zinc-900 font-semibold'
                                : 'bg-[#FAF9F5] border-[#E8E5DD] text-zinc-700 hover:bg-white'
                            }`}
                          >
                            {s}×
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[11px] text-[#6B6B66]">
                        <span>Volume</span>
                        <span className="font-mono">{video.muted ? '0%' : `${video.volume}%`}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => editorStore.setVideoVolume(undefined, !video.muted)}
                          className="text-[#6B6B66] hover:text-zinc-900 p-1"
                        >
                          {video.muted || video.volume === 0 ? (
                            <VolumeX className="w-4 h-4 text-red-500" />
                          ) : (
                            <Volume2 className="w-4 h-4 text-[#F2B705]" />
                          )}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={video.muted ? 0 : video.volume}
                          onChange={(e) => editorStore.setVideoVolume(Number(e.target.value), false)}
                          className="flex-1 accent-[#F2B705]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. ANIMATION PANEL (Video mode only) */}
            {activeTab === 'animation' && mode === 'video' && (
              <div className="space-y-4">
                <div className="p-2.5 rounded-xl bg-[#FFF5D6]/40 border border-[#F2B705]/40 text-xs">
                  <p className="font-semibold text-zinc-900">
                    {selectedTextLayer ? `Text: "${selectedTextLayer.content}"` : 'Video Frame Motion'}
                  </p>
                  <p className="text-[11px] text-[#6B6B66]">
                    Playhead: <span className="font-mono font-bold text-zinc-900">{video.playhead.toFixed(2)}s</span>
                  </p>
                </div>

                {/* Keyframe Properties Inputs */}
                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-[11px] text-[#6B6B66]">
                      <span>X Position</span>
                      <span className="font-mono">{kfX}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={kfX}
                      onChange={(e) => setKfX(Number(e.target.value))}
                      className="w-full accent-[#F2B705]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-[#6B6B66]">
                      <span>Y Position</span>
                      <span className="font-mono">{kfY}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={kfY}
                      onChange={(e) => setKfY(Number(e.target.value))}
                      className="w-full accent-[#F2B705]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-[#6B6B66]">
                      <span>Scale</span>
                      <span className="font-mono">{kfScale.toFixed(2)}×</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="3"
                      step="0.05"
                      value={kfScale}
                      onChange={(e) => setKfScale(Number(e.target.value))}
                      className="w-full accent-[#F2B705]"
                    />
                  </div>

                  {selectedTextLayer && (
                    <div>
                      <div className="flex justify-between text-[11px] text-[#6B6B66]">
                        <span>Opacity</span>
                        <span className="font-mono">{kfOpacity.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={kfOpacity}
                        onChange={(e) => setKfOpacity(Number(e.target.value))}
                        className="w-full accent-[#F2B705]"
                      />
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (selectedTextLayer) {
                        editorStore.addVideoKeyframe({
                          targetType: 'text',
                          targetId: selectedTextLayer.id,
                          time: Number(video.playhead.toFixed(2)),
                          properties: { x: kfX, y: kfY, scale: kfScale, opacity: kfOpacity },
                        });
                      } else {
                        editorStore.addVideoKeyframe({
                          targetType: 'video',
                          time: Number(video.playhead.toFixed(2)),
                          properties: { x: kfX, y: kfY, scale: kfScale },
                        });
                      }
                    }}
                    className="w-full py-2 rounded-xl bg-[#F6C344] hover:bg-[#E9B332] text-zinc-900 font-semibold shadow-xs transition-colors mt-2"
                  >
                    + Add Keyframe at {video.playhead.toFixed(1)}s
                  </button>
                </div>

                {/* Keyframes List */}
                <div className="space-y-1.5 pt-2 border-t border-[#F0EEE8]">
                  <span className="text-[11px] font-semibold text-zinc-700">
                    Existing Keyframes (
                    {
                      (video.keyframes || []).filter((k) =>
                        selectedTextLayer
                          ? k.targetType === 'text' && k.targetId === selectedTextLayer.id
                          : k.targetType === 'video'
                      ).length
                    }
                    )
                  </span>
                  {(video.keyframes || [])
                    .filter((k) =>
                      selectedTextLayer
                        ? k.targetType === 'text' && k.targetId === selectedTextLayer.id
                        : k.targetType === 'video'
                    )
                    .map((kf) => (
                      <div
                        key={kf.id}
                        className="p-2 rounded-lg bg-[#FAF9F5] border border-[#E8E5DD] flex items-center justify-between text-xs"
                      >
                        <div
                          className="cursor-pointer"
                          onClick={() => editorStore.setPlayhead(kf.time)}
                        >
                          <span className="font-mono font-bold text-zinc-900">{kf.time.toFixed(1)}s</span>
                          <span className="ml-2 text-[10px] text-[#6B6B66]">
                            {kf.properties.scale ? `scale:${kf.properties.scale} ` : ''}
                            {kf.properties.opacity !== undefined ? `op:${kf.properties.opacity}` : ''}
                          </span>
                        </div>
                        <button
                          onClick={() => editorStore.removeVideoKeyframe(kf.id)}
                          className="text-[#6B6B66] hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 5. HISTORY PANEL */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => (mode === 'image' ? editorStore.undoImage() : editorStore.undoVideo())}
                    disabled={mode === 'image' ? image.history.length === 0 : video.history.length === 0}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-white border border-[#E8E5DD] hover:bg-[#FAF9F5] text-zinc-800 disabled:opacity-40 font-medium text-xs shadow-subtle flex items-center justify-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Undo</span>
                  </button>
                  <button
                    onClick={() => (mode === 'image' ? editorStore.redoImage() : editorStore.redoVideo())}
                    disabled={mode === 'image' ? image.future.length === 0 : video.future.length === 0}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-white border border-[#E8E5DD] hover:bg-[#FAF9F5] text-zinc-800 disabled:opacity-40 font-medium text-xs shadow-subtle flex items-center justify-center gap-1"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Redo</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-zinc-700">
                    Snapshots ({mode === 'image' ? image.history.length : video.history.length})
                  </span>
                  {(mode === 'image' ? image.history : video.history).length === 0 ? (
                    <p className="text-[11px] text-[#6B6B66] italic py-2">No past history edits yet.</p>
                  ) : (
                    (mode === 'image' ? image.history : video.history).map((_item, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-[#FAF9F5] border border-[#E8E5DD] text-xs flex items-center justify-between"
                      >
                        <span className="text-[#6B6B66]">Step #{idx + 1}</span>
                        <span className="text-[10px] text-[#8C6200] font-mono">Saved</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
