import { describe, it, expect, vi } from 'vitest';
import { renderCompositionFrame, exportVideoComposition } from '../services/videoExport';
import { interpolateTextLayerKeyframes, interpolateVideoKeyframes } from '../utils/interpolation';
import { VideoProject, VideoTextLayer } from '../types/editor';

describe('NYC Project Manual & End-to-End Verification', () => {
  const textLayer: VideoTextLayer = {
    id: 'text-nyc',
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

  const nycProject: VideoProject = {
    id: 'project-nyc',
    source: {
      fileName: 'sample-video.mp4',
      duration: 10,
      width: 1920,
      height: 1080,
      objectUrl: 'blob:sample-video',
    },
    aspectRatio: '9:16',
    trim: { start: 2.0, end: 10.0 },
    playbackRate: 1,
    volume: 100,
    muted: false,
    playhead: 2.0,
    isPlaying: false,
    clips: [{ id: 'clip-1', start: 0, end: 10 }],
    textLayers: [textLayer],
    keyframes: [
      // NEW YORK motion keyframes
      {
        id: 'kf-1',
        targetType: 'text',
        targetId: 'text-nyc',
        time: 2.0,
        properties: { x: 50, y: 50, scale: 1.4, opacity: 0 },
      },
      {
        id: 'kf-2',
        targetType: 'text',
        targetId: 'text-nyc',
        time: 2.4,
        properties: { opacity: 1 },
      },
      {
        id: 'kf-3',
        targetType: 'text',
        targetId: 'text-nyc',
        time: 3.5,
        properties: { x: 50, y: 12, scale: 1.0 },
      },
      // Video push-in keyframes
      {
        id: 'vkf-1',
        targetType: 'video',
        time: 2.0,
        properties: { x: 50, y: 50, scale: 1.0 },
      },
      {
        id: 'vkf-2',
        targetType: 'video',
        time: 7.0,
        properties: { x: 52, y: 46, scale: 1.2 },
      },
    ],
    history: [],
    future: [],
  };

  it('verifies smooth frame progression across preview/export keyframe timeline', () => {
    // 2.0s: Video base, Text invisible
    const v2 = interpolateVideoKeyframes(nycProject.keyframes, 2.0);
    const t2 = interpolateTextLayerKeyframes(textLayer, nycProject.keyframes, 2.0);
    expect(v2.scale).toBe(1.0);
    expect(v2.x).toBe(50);
    expect(v2.y).toBe(50);
    expect(t2.opacity).toBe(0);
    expect(t2.scale).toBe(1.4);
    expect(t2.x).toBe(50);
    expect(t2.y).toBe(50);

    // 2.2s: Fade in midway (continuous, not stepped)
    const t22 = interpolateTextLayerKeyframes(textLayer, nycProject.keyframes, 2.2);
    expect(t22.opacity).toBeCloseTo(0.5, 5);

    // 2.4s: Text fully visible, scaling smoothly toward 3.5s
    const t24 = interpolateTextLayerKeyframes(textLayer, nycProject.keyframes, 2.4);
    expect(t24.opacity).toBe(1.0);
    expect(t24.scale).toBeCloseTo(1.293, 2);

    // 2.95s: Midway upward motion & scale down
    const t295 = interpolateTextLayerKeyframes(textLayer, nycProject.keyframes, 2.95);
    expect(t295.y).toBeLessThan(50);
    expect(t295.y).toBeGreaterThan(12);
    expect(t295.scale).toBeLessThan(1.4);
    expect(t295.scale).toBeGreaterThan(1.0);

    // 3.5s: Text at top center at scale 1.0
    const t35 = interpolateTextLayerKeyframes(textLayer, nycProject.keyframes, 3.5);
    expect(t35.x).toBe(50);
    expect(t35.y).toBe(12);
    expect(t35.scale).toBe(1.0);
    expect(t35.opacity).toBe(1.0);

    // 4.5s: Video push-in midway (scale 1.1, x 51, y 48)
    const v45 = interpolateVideoKeyframes(nycProject.keyframes, 4.5);
    expect(v45.scale).toBeCloseTo(1.1, 5);
    expect(v45.x).toBeCloseTo(51, 5);
    expect(v45.y).toBeCloseTo(48, 5);

    // 7.0s: Video push-in complete (scale 1.2, x 52, y 46)
    const v7 = interpolateVideoKeyframes(nycProject.keyframes, 7.0);
    expect(v7.scale).toBe(1.2);
    expect(v7.x).toBe(52);
    expect(v7.y).toBe(46);
  });

  it('renders all frames with canvas drawing calls matching vertical 9:16 resolution', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d')!;
    const video = document.createElement('video');

    const fillTextSpy = vi.spyOn(ctx, 'fillText');
    const drawImageSpy = vi.spyOn(ctx, 'drawImage');

    // Render at 3.5s: text at top
    renderCompositionFrame(ctx, video, nycProject, 3.5, 1080, 1920);

    expect(drawImageSpy).toHaveBeenCalled();
    expect(fillTextSpy).toHaveBeenCalledWith('NEW YORK', 0, 0);

    // Render at 8.0s: after layer ends (7.0s), text is not drawn
    fillTextSpy.mockClear();
    renderCompositionFrame(ctx, video, nycProject, 8.0, 1080, 1920);
    expect(fillTextSpy).not.toHaveBeenCalled();
  });

  it('exports NYC project composition into a real rendered WebM file', async () => {
    const res = await exportVideoComposition(nycProject, { triggerDownload: false });

    expect(res.success).toBe(true);
    expect(res.format).toBe('webm');
    expect(res.renderedOutput).toBe(true);
    expect(res.includesEdits).toBe(true);
    expect(res.dimensions).toEqual({ width: 1080, height: 1920 }); // Vertical 9:16
    expect(res.duration).toBe(8.0); // 10.0 - 2.0 trim
    expect(res.fileName).toContain('agentcut-export-');
    expect(res.fileName).toContain('.webm');
    expect(res.fileSize).toBeGreaterThan(0);
    expect(res.blob).toBeDefined();
  });
});
