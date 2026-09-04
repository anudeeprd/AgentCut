import { AspectRatio, VideoTextLayer } from '../types/editor';

export interface CropRect {
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

/**
 * Calculate export canvas dimensions based on target aspect ratio and source dimensions.
 * Targets ~1080p output for crisp rendering while remaining reliable in browser MediaRecorder.
 */
export function getExportDimensions(
  aspectRatio: AspectRatio,
  sourceW: number = 1920,
  sourceH: number = 1080
): Dimensions {
  switch (aspectRatio) {
    case '9:16':
      return { width: 1080, height: 1920 };
    case '16:9':
      return { width: 1920, height: 1080 };
    case '1:1':
      return { width: 1080, height: 1080 };
    case '4:5':
      return { width: 1080, height: 1350 };
    case 'original':
    default: {
      const sw = sourceW > 0 ? sourceW : 1920;
      const sh = sourceH > 0 ? sourceH : 1080;
      const minDim = Math.min(sw, sh);
      // Scale so smaller dimension is ~1080
      const scale = minDim > 1080 ? 1080 / minDim : 1;
      return {
        width: Math.round((sw * scale) / 2) * 2,
        height: Math.round((sh * scale) / 2) * 2,
      };
    }
  }
}

/**
 * Calculate object-fit: cover source crop rectangle
 */
export function calculateCoverCrop(
  sourceW: number,
  sourceH: number,
  targetW: number,
  targetH: number
): CropRect {
  if (sourceW <= 0 || sourceH <= 0 || targetW <= 0 || targetH <= 0) {
    return { cropX: 0, cropY: 0, cropWidth: sourceW, cropHeight: sourceH };
  }

  const scale = Math.max(targetW / sourceW, targetH / sourceH);
  const cropWidth = Math.min(sourceW, targetW / scale);
  const cropHeight = Math.min(sourceH, targetH / scale);
  const cropX = Math.max(0, (sourceW - cropWidth) / 2);
  const cropY = Math.max(0, (sourceH - cropHeight) / 2);

  return { cropX, cropY, cropWidth, cropHeight };
}

/**
 * Check if a text overlay layer is active at given timestamp
 */
export function isTextLayerActive(
  layer: { startTime: number; endTime: number },
  time: number
): boolean {
  return time >= layer.startTime && time <= layer.endTime;
}

/**
 * Draw a video frame onto canvas with cover crop and keyframe transforms
 */
export function drawVideoFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  crop: CropRect,
  targetW: number,
  targetH: number,
  anim: { x: number; y: number; scale: number }
): void {
  ctx.save();
  // Translate to center
  ctx.translate(targetW / 2, targetH / 2);

  // Apply pan offsets ((x - 50)% and (y - 50)% of canvas dimensions)
  const offsetX = ((anim.x - 50) / 100) * targetW;
  const offsetY = ((anim.y - 50) / 100) * targetH;
  ctx.translate(offsetX, offsetY);

  // Apply scale
  ctx.scale(anim.scale, anim.scale);

  // Draw source video frame centered
  ctx.drawImage(
    video,
    crop.cropX,
    crop.cropY,
    crop.cropWidth,
    crop.cropHeight,
    -targetW / 2,
    -targetH / 2,
    targetW,
    targetH
  );

  ctx.restore();
}

/**
 * Draw a text layer onto canvas with center-anchored keyframe transforms and drop shadow
 */
export function drawTextLayer(
  ctx: CanvasRenderingContext2D,
  layer: VideoTextLayer,
  targetW: number,
  targetH: number,
  anim: { x: number; y: number; scale: number; opacity: number },
  fontOverride?: string
): void {
  // If fully transparent, skip drawing
  if (anim.opacity <= 0.001) return;

  const posX = (anim.x / 100) * targetW;
  const posY = (anim.y / 100) * targetH;

  // Scale font size proportionally from reference 540p dimension
  const scaleFactor = Math.min(targetW, targetH) / 540;
  const scaledFontSize = Math.max(12, Math.round(layer.fontSize * scaleFactor));

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, anim.opacity));

  // Translate to text center
  ctx.translate(posX, posY);
  ctx.scale(anim.scale, anim.scale);

  const fontFamily = fontOverride || layer.fontFamily || 'Inter';
  ctx.font = `${layer.fontWeight || 'bold'} ${scaledFontSize}px "${fontFamily}", -apple-system, sans-serif`;
  ctx.fillStyle = layer.color || '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Crisp text drop shadow matching preview
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = Math.round(10 * (scaleFactor / 2));
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.round(2 * (scaleFactor / 2));

  ctx.fillText(layer.content, 0, 0);

  ctx.restore();
}
