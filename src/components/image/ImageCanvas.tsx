import React, { useRef, useState, useEffect } from 'react';
import { useImageProject } from '../../store/useEditorStore';
import { editorStore } from '../../store/editorStore';

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
  const [draggingId, setDraggingId] = useState<string | null>(null);
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

  if (!project.source) return null;

  // Aspect ratio styling
  const getAspectRatioStyle = () => {
    switch (project.canvas.aspectRatio) {
      case '1:1':
        return 'aspect-square max-h-[70vh]';
      case '4:5':
        return 'aspect-[4/5] max-h-[72vh]';
      case '16:9':
        return 'aspect-[16/9] max-h-[65vh]';
      case '9:16':
        return 'aspect-[9/16] max-h-[75vh]';
      case 'original':
      default: {
        const source = project.source;
        const ar = source ? source.width / source.height : 16 / 9;
        return ar >= 1 ? 'aspect-video max-h-[68vh]' : 'aspect-[9/16] max-h-[75vh]';
      }
    }
  };

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
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));
    editorStore.updateImageText(draggingId, { x, y });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingId) {
      setDraggingId(null);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // pointer capture release ignore
      }
    }
  };

  return (
    <div
      onClick={() => onSelectTextId(null)}
      className="flex-1 bg-zinc-950/60 flex items-center justify-center p-6 overflow-hidden relative select-none"
    >
      {/* Canvas Frame Container */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`relative transition-all duration-300 rounded-xl overflow-hidden shadow-2xl border border-zinc-800/80 bg-zinc-900 ${getAspectRatioStyle()}`}
        style={{
          width: 'auto',
          height: 'auto',
          maxWidth: '100%',
        }}
      >
        {/* Background Image with transforms and filters */}
        <img
          src={project.source.objectUrl}
          alt={project.source.fileName}
          className="w-full h-full object-cover transition-transform duration-200 pointer-events-none"
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
                    ? 'ring-2 ring-indigo-500 bg-indigo-500/20 backdrop-blur-sm'
                    : 'hover:ring-1 hover:ring-zinc-400/60'
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
                    fontFamily: 'Inter, -apple-system, sans-serif',
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
        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-zinc-300 pointer-events-none">
          {project.canvas.aspectRatio.toUpperCase()} · {project.canvas.width}×{project.canvas.height}
        </div>
      </div>
    </div>
  );
};
