import { ImageProject } from '../types/editor';

export interface ImageExportResult {
  success: boolean;
  format: 'png' | 'jpg';
  dimensions: { width: number; height: number };
  fileName: string;
  dataUrl?: string;
  error?: string;
}

export async function exportImageCanvas(
  project: ImageProject,
  format: 'png' | 'jpg' = 'png',
  triggerDownload: boolean = true
): Promise<ImageExportResult> {
  if (!project.source) {
    return {
      success: false,
      format,
      dimensions: { width: 0, height: 0 },
      fileName: '',
      error: 'No image source loaded to export',
    };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const sourceW = img.naturalWidth || project.source!.width;
        const sourceH = img.naturalHeight || project.source!.height;

        // Calculate target export canvas dimensions based on aspect ratio
        let targetW = sourceW;
        let targetH = sourceH;

        if (project.canvas.aspectRatio === '1:1') {
          const side = Math.min(sourceW, sourceH);
          targetW = side;
          targetH = side;
        } else if (project.canvas.aspectRatio === '4:5') {
          const baseH = sourceH;
          const calculatedW = Math.round((baseH * 4) / 5);
          if (calculatedW <= sourceW) {
            targetW = calculatedW;
            targetH = baseH;
          } else {
            targetW = sourceW;
            targetH = Math.round((sourceW * 5) / 4);
          }
        } else if (project.canvas.aspectRatio === '16:9') {
          const baseW = sourceW;
          const calculatedH = Math.round((baseW * 9) / 16);
          if (calculatedH <= sourceH) {
            targetW = baseW;
            targetH = calculatedH;
          } else {
            targetH = sourceH;
            targetW = Math.round((sourceH * 16) / 9);
          }
        } else if (project.canvas.aspectRatio === '9:16') {
          const baseH = sourceH;
          const calculatedW = Math.round((baseH * 9) / 16);
          if (calculatedW <= sourceW) {
            targetW = calculatedW;
            targetH = baseH;
          } else {
            targetW = sourceW;
            targetH = Math.round((sourceW * 16) / 9);
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve({
            success: false,
            format,
            dimensions: { width: 0, height: 0 },
            fileName: '',
            error: 'Failed to create 2D canvas context',
          });
          return;
        }

        // Apply filters
        const adj = project.adjustments;
        const b = 100 + adj.brightness;
        const c = 100 + adj.contrast;
        const s = 100 + adj.saturation;
        const g = adj.grayscale;
        const blur = adj.blur;

        ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%) grayscale(${g}%) blur(${blur}px)`;

        // Prepare transform (rotation & flip) around canvas center
        ctx.save();
        ctx.translate(targetW / 2, targetH / 2);

        if (project.transform.rotation) {
          ctx.rotate((project.transform.rotation * Math.PI) / 180);
        }
        ctx.scale(
          project.transform.flipX ? -1 : 1,
          project.transform.flipY ? -1 : 1
        );

        // Center-crop drawing
        // Source crop rectangle
        const cropX = Math.max(0, (sourceW - targetW) / 2);
        const cropY = Math.max(0, (sourceH - targetH) / 2);
        const cropW = Math.min(sourceW, targetW);
        const cropH = Math.min(sourceH, targetH);

        ctx.drawImage(
          img,
          cropX,
          cropY,
          cropW,
          cropH,
          -targetW / 2,
          -targetH / 2,
          targetW,
          targetH
        );

        ctx.restore();

        // Remove filter for drawing text layers
        ctx.filter = 'none';

        // Draw text layers
        for (const layer of project.textLayers) {
          ctx.save();
          ctx.globalAlpha = layer.opacity;

          // Scale font size proportionally from reference 1080p
          const exportScale = targetH / 1080;
          const fontSize = Math.max(1, Math.round(layer.fontSize * exportScale));
          ctx.font = `${layer.fontWeight} ${fontSize}px Inter, -apple-system, sans-serif`;
          ctx.fillStyle = layer.color || '#ffffff';
          ctx.textAlign = layer.alignment;
          ctx.textBaseline = 'middle';

          const posX = (layer.x / 100) * targetW;
          const posY = (layer.y / 100) * targetH;

          // Subtle text shadow for high contrast legibility
          ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
          ctx.shadowBlur = Math.max(1, 8 * exportScale);
          ctx.shadowOffsetX = Math.max(0.5, 2 * exportScale);
          ctx.shadowOffsetY = Math.max(0.5, 2 * exportScale);

          ctx.fillText(layer.content, posX, posY);
          ctx.restore();
        }

        const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
        const dataUrl = canvas.toDataURL(mimeType, 0.95);
        const fileName = `agentcut-${Date.now()}.${format}`;

        if (triggerDownload && typeof document !== 'undefined') {
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }

        resolve({
          success: true,
          format,
          dimensions: { width: targetW, height: targetH },
          fileName,
          dataUrl,
        });
      } catch (err: any) {
        resolve({
          success: false,
          format,
          dimensions: { width: 0, height: 0 },
          fileName: '',
          error: err?.message || 'Export failed',
        });
      }
    };

    img.onerror = () => {
      resolve({
        success: false,
        format,
        dimensions: { width: 0, height: 0 },
        fileName: '',
        error: 'Failed to load source image for rendering',
      });
    };

    img.src = project.source!.objectUrl;
  });
}
