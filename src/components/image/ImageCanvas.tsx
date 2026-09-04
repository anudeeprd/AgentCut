import React, { useRef, useState, useEffect } from 'react';
import { useImageProject } from '../../store/useEditorStore';
import { editorStore, getImageSnapshot } from '../../store/editorStore';
import { ImageSnapshot } from '../../types/editor';

interface ImageCanvasProps {
  selectedTextId: string | null;
  onSelectTextId: (id: string | null) => void;
}

export const ImageCanvas: React.FC<ImageCanvasProps> = ({
  selectedTextId,
  onSelectTextId,
}) => {
  const project = useImageProject();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [, setInitialDragSnapshot] = useState<ImageSnapshot | null>(null);
  const [displayedCanvasHeight, setDisplayedCanvasHeight] = useState<number>(0);

  // Measure actual displayed canvas/frame height using containerRef and ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => {
      if (containerRef.current) {
        const h = containerRef.current.clientHeight;
        if (h > 0) {
          setDisplayedCanvasHeight(h);
        }
      }
    };

    updateHeight();

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const h = entry.contentRect.height;
          if (h > 0) {
            setDisplayedCanvasHeight(h);
          }
        }
      });
      ro.observe(container);
      return () => ro.disconnect();
    } else {
      window.addEventListener('resize', updateHeight);
      return () => window.removeEventListener('resize', updateHeight);
    }
  }, [project.canvas.aspectRatio, project.source]);

  // Aspect ratio styling
  const getAspectRatioStyle = () => {
    switch (project.canvas.aspectRatio) {
      case '1:1':
        return 'aspect-square max-h-[72vh]';
      case '4:5':
        return 'aspect-[4/5] max-h-[74vh]';
      case '16:9':
        return 'aspect-[16/9] max-h-[66vh]';
      case '9:16':
        return 'aspect-[9/16] max-h-[76vh]';
      case 'original':
      default: {
        const source = project.source;
        const ar = source ? source.width / source.height : 16 / 9;
        return ar >= 1 ? 'aspect-video max-h-[70vh]' : 'aspect-[9/16] max-h-[76vh]';
      }
    }
  };

  const handleImageFile = (file: File) => {
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

  const handleVideoFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      editorStore.setMode('video');
      editorStore.loadVideo({
        fileName: file.name,
        duration: video.duration || 10,
        width: video.videoWidth || 1280,
        height: video.videoHeight || 720,
        objectUrl: url,
      });
    };
    video.src = url;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      handleImageFile(file);
    } else if (file.type.startsWith('video/')) {
      handleVideoFile(file);
    }
  };

  // ----------------- CLEAN EMPTY ARTBOARD STATE ----------------- //
  if (!project.source) {
    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex-1 bg-[#F7F6F2] flex items-center justify-center p-6 overflow-hidden relative select-none ${
          isDragging ? 'ring-2 ring-inset ring-[#F2B705] bg-[#FFF5D6]/20' : ''
        }`}
      />
    );
  }

  // ----------------- LOADED IMAGE CANVAS ----------------- //

  // CSS Filter string
  const adj = project.adjustments;
  const filterStyle = `brightness(${100 + adj.brightness}%) contrast(${100 + adj.contrast}%) saturate(${100 + adj.saturation}%) grayscale(${adj.grayscale}%) blur(${adj.blur}px)`;

  // Transform style
  const transformStyle = `rotate(${project.transform.rotation}deg) scale(${project.transform.flipX ? -1 : 1}, ${project.transform.flipY ? -1 : 1})`;

  // Handle dragging text layer
  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    onSelectTextId(id);
    setDraggingId(id);
    const snapshot = getImageSnapshot(editorStore.getState().image);
    setInitialDragSnapshot(snapshot);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));
    editorStore.updateImageText(draggingId, { x, y }, false);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggingId) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setDraggingId(null);
    setInitialDragSnapshot(null);
  };

  return (
    <div
      onClick={() => onSelectTextId(null)}
      className="flex-1 bg-[#F7F6F2] flex items-center justify-center p-6 overflow-hidden relative select-none"
    >
      {/* Canvas Viewport Frame */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`relative transition-all duration-200 rounded-2xl overflow-hidden shadow-card border border-[#E8E5DD] bg-white flex items-center justify-center ${getAspectRatioStyle()}`}
        style={{
          width: 'auto',
          height: 'auto',
          maxWidth: '100%',
        }}
      >
        {/* Rendered Source Image with Crop & Filters */}
        <img
          src={project.source.objectUrl}
          alt={project.source.fileName}
          className="w-full h-full object-cover transition-all duration-100 pointer-events-none"
          style={{
            filter: filterStyle,
            transform: transformStyle,
          }}
        />

        {/* Text Layers */}
        {(() => {
          const currentHeight =
            displayedCanvasHeight ||
            (containerRef.current ? containerRef.current.clientHeight : 0) ||
            1080;
          const previewScale = currentHeight / 1080;

          return project.textLayers.map((layer) => {
            const isSelected = selectedTextId === layer.id;

            // Alignment transform
            let translateClass = '-translate-x-1/2 -translate-y-1/2';
            if (layer.alignment === 'left') translateClass = 'translate-x-0 -translate-y-1/2';
            if (layer.alignment === 'right') translateClass = '-translate-x-full -translate-y-1/2';

            const displayFontSize = Math.max(1, layer.fontSize * previewScale);
            const shadowBlur = Math.max(1, 8 * previewScale);
            const shadowOffset = Math.max(0.5, 2 * previewScale);
            const padX = Math.round(6 * previewScale);
            const padY = Math.round(3 * previewScale);

            return (
              <div
                key={layer.id}
                onPointerDown={(e) => handlePointerDown(e, layer.id)}
                className={`absolute cursor-move transition-shadow duration-150 rounded select-none ${translateClass} ${
                  isSelected
                    ? 'ring-2 ring-[#F2B705] bg-[#FFF5D6]/40 backdrop-blur-xs'
                    : 'hover:ring-1 hover:ring-zinc-400/80'
                }`}
                style={{
                  left: `${layer.x}%`,
                  top: `${layer.y}%`,
                  opacity: layer.opacity,
                  padding: `${padY}px ${padX}px`,
                }}
              >
                <span
                  style={{
                    fontSize: `${displayFontSize}px`,
                    fontWeight: layer.fontWeight,
                    fontFamily: `"${layer.fontFamily || 'Inter'}", -apple-system, sans-serif`,
                    color: layer.color || '#ffffff',
                    textShadow: `0 ${shadowOffset}px ${shadowBlur}px rgba(0,0,0,0.8), 0 0 ${Math.max(1, 2 * previewScale)}px rgba(0,0,0,0.9)`,
                  }}
                  className="leading-none whitespace-nowrap block"
                >
                  {layer.content}
                </span>
              </div>
            );
          });
        })()}

        {/* Aspect Ratio Badge Overlay */}
        <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-white/90 backdrop-blur-md border border-[#E8E5DD] text-[10px] font-mono text-[#171717] font-semibold pointer-events-none shadow-xs">
          {project.canvas.aspectRatio.toUpperCase()} · {project.canvas.width}×{project.canvas.height}
        </div>
      </div>
    </div>
  );
};
