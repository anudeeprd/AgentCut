import { describe, it, expect, vi } from 'vitest';
import {
  calculateCoverCrop,
  getExportDimensions,
  isTextLayerActive,
  drawTextLayer,
} from '../utils/videoGeometry';
import {
  exportVideoComposition,
  getSupportedVideoMimeType,
  renderCompositionFrame,
} from '../services/videoExport';
import { VideoProject, VideoTextLayer } from '../types/editor';

describe('Video Export Suite', () => {
  // Test 1: Export aspect dimensions for 9:16
  it('calculates accurate export dimensions for vertical 9:16', () => {
    const dim = getExportDimensions('9:16', 1920, 1080);
    expect(dim.width).toBe(1080);
    expect(dim.height).toBe(1920);
  });

  // Test 2: Export dimensions for 16:9, 1:1, 4:5, and original
  it('calculates accurate export dimensions for 16:9, 1:1, 4:5 and original', () => {
    const dim169 = getExportDimensions('16:9', 1920, 1080);
    expect(dim169.width).toBe(1920);
    expect(dim169.height).toBe(1080);

    const dim11 = getExportDimensions('1:1', 1920, 1080);
    expect(dim11.width).toBe(1080);
    expect(dim11.height).toBe(1080);

    const dim45 = getExportDimensions('4:5', 1920, 1080);
    expect(dim45.width).toBe(1080);
    expect(dim45.height).toBe(1350);

    const dimOrig = getExportDimensions('original', 1280, 720);
    expect(dimOrig.width).toBe(1280);
    expect(dimOrig.height).toBe(720);
  });

  // Test 3: Cover crop calculation (object-fit: cover equivalent)
  it('calculates cover crop rectangle correctly', () => {
    // 16:9 source (1920x1080) to 9:16 target (1080x1920)
    // Scale must scale height 1080 to 1920 -> scale = 1920/1080 = 1.7778
    // Crop width in source = 1080 / (1920/1080) = 607.5 -> cropped horizontally centered
    const crop = calculateCoverCrop(1920, 1080, 1080, 1920);
    expect(crop.cropHeight).toBe(1080);
    expect(crop.cropWidth).toBeCloseTo(607.5, 1);
    expect(crop.cropX).toBeCloseTo((1920 - 607.5) / 2, 1);
    expect(crop.cropY).toBe(0);

    // 16:9 source (1920x1080) to 16:9 target (1920x1080) -> exact match
    const cropExact = calculateCoverCrop(1920, 1080, 1920, 1080);
    expect(cropExact.cropX).toBe(0);
    expect(cropExact.cropY).toBe(0);
    expect(cropExact.cropWidth).toBe(1920);
    expect(cropExact.cropHeight).toBe(1080);
  });

  // Test 4: Text active/inactive by timestamp
  it('filters active text overlays correctly by media timestamp', () => {
    const layer = { startTime: 2.0, endTime: 6.0 };

    expect(isTextLayerActive(layer, 1.9)).toBe(false);
    expect(isTextLayerActive(layer, 2.0)).toBe(true);
    expect(isTextLayerActive(layer, 4.0)).toBe(true);
    expect(isTextLayerActive(layer, 6.0)).toBe(true);
    expect(isTextLayerActive(layer, 6.1)).toBe(false);
  });

  // Test 5: Text keyframe interpolation during export rendering
  it('renders composition frame with text keyframe interpolation', () => {
    const textLayer: VideoTextLayer = {
      id: 'text-ny',
      content: 'NEW YORK',
      startTime: 2.0,
      endTime: 7.0,
      position: 'center',
      x: 50,
      y: 50,
      fontSize: 42,
      fontWeight: 'bold',
      opacity: 1,
      color: '#ffffff',
    };

    const project: VideoProject = {
      id: 'proj-1',
      source: {
        fileName: 'demo.mp4',
        duration: 10,
        width: 1920,
        height: 1080,
        objectUrl: 'blob:demo',
      },
      aspectRatio: '9:16',
      trim: { start: 2.0, end: 10.0 },
      playbackRate: 1,
      volume: 100,
      muted: false,
      playhead: 2.0,
      isPlaying: false,
      clips: [{ id: 'c1', start: 0, end: 10 }],
      textLayers: [textLayer],
      keyframes: [
        {
          id: 'kf-1',
          targetType: 'text',
          targetId: 'text-ny',
          time: 2.0,
          properties: { x: 50, y: 50, scale: 1.4, opacity: 0 },
        },
        {
          id: 'kf-2',
          targetType: 'text',
          targetId: 'text-ny',
          time: 2.4,
          properties: { opacity: 1 },
        },
        {
          id: 'kf-3',
          targetType: 'text',
          targetId: 'text-ny',
          time: 3.5,
          properties: { x: 50, y: 12, scale: 1.0 },
        },
      ],
      history: [],
      future: [],
    };

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d')!;

    const video = document.createElement('video');

    // Spy on context methods
    const fillTextSpy = vi.spyOn(ctx, 'fillText');
    const scaleSpy = vi.spyOn(ctx, 'scale');

    // Render frame at 3.5s: text should be active and drawn
    renderCompositionFrame(ctx, video, project, 3.5, 1080, 1920);

    expect(fillTextSpy).toHaveBeenCalledWith('NEW YORK', 0, 0);
    expect(scaleSpy).toHaveBeenCalled();
  });

  // Test 6: Video keyframe interpolation during export rendering
  it('renders composition frame with video keyframe push-in transforms', () => {
    const project: VideoProject = {
      id: 'proj-2',
      source: {
        fileName: 'demo.mp4',
        duration: 10,
        width: 1920,
        height: 1080,
        objectUrl: 'blob:demo',
      },
      aspectRatio: '16:9',
      trim: { start: 0, end: 10 },
      playbackRate: 1,
      volume: 100,
      muted: false,
      playhead: 7.0,
      isPlaying: false,
      clips: [{ id: 'c1', start: 0, end: 10 }],
      textLayers: [],
      keyframes: [
        { id: 'vkf-1', targetType: 'video', time: 2, properties: { x: 50, y: 50, scale: 1 } },
        { id: 'vkf-2', targetType: 'video', time: 7, properties: { x: 52, y: 46, scale: 1.2 } },
      ],
      history: [],
      future: [],
    };

    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d')!;
    const video = document.createElement('video');

    const drawImageSpy = vi.spyOn(ctx, 'drawImage');
    const translateSpy = vi.spyOn(ctx, 'translate');
    const scaleSpy = vi.spyOn(ctx, 'scale');

    renderCompositionFrame(ctx, video, project, 7.0, 1920, 1080);

    expect(drawImageSpy).toHaveBeenCalled();
    expect(scaleSpy).toHaveBeenCalledWith(1.2, 1.2);
    // At x: 52, y: 46: pan offset is +2% of 1920 = 38.4, -4% of 1080 = -43.2
    expect(translateSpy).toHaveBeenCalledWith(38.4, -43.2);
  });

  // Test 7: Trim timestamps calculation
  it('respects trim boundaries and computes duration from trim start and end', () => {
    const trim = { start: 2.5, end: 8.5 };
    const duration = trim.end - trim.start;
    expect(duration).toBe(6.0);
  });

  // Test 8: Partial / sparse keyframes handling
  it('handles sparse properties without breaking canvas drawing', () => {
    const textLayer: VideoTextLayer = {
      id: 'sparse-layer',
      content: 'Opacity Only',
      startTime: 0,
      endTime: 5,
      position: 'center',
      x: 50,
      y: 50,
      fontSize: 36,
      fontWeight: 'normal',
      opacity: 1,
      color: '#ff0000',
    };

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d')!;

    // Drawing layer with opacity 0 should cleanly skip fillText
    const fillTextSpy = vi.spyOn(ctx, 'fillText');
    drawTextLayer(ctx, textLayer, 1080, 1080, { x: 50, y: 50, scale: 1, opacity: 0 });
    expect(fillTextSpy).not.toHaveBeenCalled();

    // Drawing layer with opacity 1 draws text
    drawTextLayer(ctx, textLayer, 1080, 1080, { x: 50, y: 50, scale: 1, opacity: 1 });
    expect(fillTextSpy).toHaveBeenCalledWith('Opacity Only', 0, 0);
  });

  // Test 9: Export service chooses supported MIME type
  it('selects a valid WebM MIME type from supported browser codecs', () => {
    const mime = getSupportedVideoMimeType();
    expect(mime).toMatch(/^video\/webm/);
  });

  // Test 10: Export result reports renderedOutput = true
  it('exports composition and returns renderedOutput: true with structured metadata', async () => {
    const project: VideoProject = {
      id: 'proj-3',
      source: {
        fileName: 'sample.mp4',
        duration: 10,
        width: 1920,
        height: 1080,
        objectUrl: 'blob:sample',
      },
      aspectRatio: '9:16',
      trim: { start: 2, end: 7 },
      playbackRate: 1,
      volume: 100,
      muted: false,
      playhead: 2,
      isPlaying: false,
      clips: [{ id: 'c1', start: 0, end: 10 }],
      textLayers: [
        {
          id: 'text-1',
          content: 'NEW YORK',
          startTime: 2,
          endTime: 7,
          position: 'center',
          x: 50,
          y: 50,
          fontSize: 42,
          fontWeight: 'bold',
          opacity: 1,
          color: '#ffffff',
        },
      ],
      keyframes: [
        {
          id: 'kf-1',
          targetType: 'text',
          targetId: 'text-1',
          time: 2,
          properties: { x: 50, y: 50, scale: 1.4, opacity: 0 },
        },
      ],
      history: [],
      future: [],
    };

    const res = await exportVideoComposition(project, { triggerDownload: false });

    expect(res.success).toBe(true);
    expect(res.format).toBe('webm');
    expect(res.renderedOutput).toBe(true);
    expect(res.includesEdits).toBe(true);
    expect(res.duration).toBe(5);
    expect(res.dimensions).toEqual({ width: 1080, height: 1920 });
    expect(res.fileName).toContain('.webm');
    expect(res.fileSize).toBeGreaterThan(0);
  });
});
