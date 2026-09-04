import { describe, it, expect, beforeEach } from 'vitest';
import { editorStore } from '../store/editorStore';
import { getAgentCutToolDefinitions } from '../webmcp/registerTools';

describe('UI Redesign & Modern Editor Layout Suite', () => {
  beforeEach(() => {
    editorStore.resetAll();
  });

  it('preserves exactly 29 WebMCP tools in the modernized editor', () => {
    const tools = getAgentCutToolDefinitions();
    expect(tools).toHaveLength(29);

    const imageTools = tools.filter((t) => t.name.includes('image'));
    const videoTools = tools.filter((t) => t.name.includes('video') || t.name === 'get_timeline');

    expect(imageTools).toHaveLength(11);
    expect(videoTools).toHaveLength(18);
  });

  it('defaults to Video mode on initial load and supports seamless mode switching', () => {
    expect(editorStore.getState().mode).toBe('video');

    editorStore.setMode('image');
    expect(editorStore.getState().mode).toBe('image');

    editorStore.setMode('video');
    expect(editorStore.getState().mode).toBe('video');
  });

  it('loads demo media correctly from empty viewport / Media panel', () => {
    // Demo image
    editorStore.setMode('image');
    editorStore.loadImage({
      fileName: 'sample-image.jpg',
      width: 1920,
      height: 1080,
      objectUrl: '/demo/sample-image.jpg',
      isDemo: true,
    });
    expect(editorStore.getState().image.source?.fileName).toBe('sample-image.jpg');
    expect(editorStore.getState().image.source?.isDemo).toBe(true);

    // Demo video
    editorStore.setMode('video');
    editorStore.loadVideo({
      fileName: 'sample-video.mp4',
      duration: 10.0,
      width: 1280,
      height: 720,
      objectUrl: '/demo/sample-video.mp4',
      isDemo: true,
    });
    expect(editorStore.getState().video.source?.fileName).toBe('sample-video.mp4');
    expect(editorStore.getState().video.source?.duration).toBe(10.0);
  });

  it('allows adding and editing text layers via left rail / properties inspector', () => {
    editorStore.setMode('image');
    editorStore.loadImage({
      fileName: 'sample-image.jpg',
      width: 1920,
      height: 1080,
      objectUrl: '/demo/sample-image.jpg',
    });

    const textId = editorStore.addImageText({
      content: 'Summer Vacation',
      position: 'top-center',
      fontSize: 54,
    });

    expect(editorStore.getState().image.textLayers).toHaveLength(1);
    expect(editorStore.getState().image.textLayers[0].content).toBe('Summer Vacation');
    expect(editorStore.getState().image.textLayers[0].fontSize).toBe(54);

    // Partial update from inspector slider
    editorStore.updateImageText(textId, { fontSize: 64 });
    expect(editorStore.getState().image.textLayers[0].fontSize).toBe(64);
    expect(editorStore.getState().image.textLayers[0].content).toBe('Summer Vacation');
  });

  it('supports keyframe motion in video mode via animation panel / timeline', () => {
    editorStore.setMode('video');
    editorStore.loadVideo({
      fileName: 'sample-video.mp4',
      duration: 10.0,
      width: 1280,
      height: 720,
      objectUrl: '/demo/sample-video.mp4',
    });

    const textId = editorStore.addVideoText({
      content: 'Golden Gate',
      startTime: 1.0,
      endTime: 5.0,
      position: 'center',
    });

    const kfId = editorStore.addVideoKeyframe({
      targetType: 'text',
      targetId: textId,
      time: 2.5,
      properties: { x: 50, y: 30, scale: 1.5, opacity: 0.9 },
    });

    expect(editorStore.getState().video.keyframes).toHaveLength(1);
    expect(editorStore.getState().video.keyframes[0].id).toBe(kfId);
    expect(editorStore.getState().video.keyframes[0].time).toBe(2.5);
    expect(editorStore.getState().video.keyframes[0].properties.scale).toBe(1.5);
  });

  it('allows setting video aspect ratio in inspector before media is loaded', () => {
    expect(editorStore.getState().video.source).toBeNull();
    expect(editorStore.getState().video.aspectRatio).toBe('16:9');

    editorStore.setVideoAspectRatio('9:16');
    expect(editorStore.getState().video.aspectRatio).toBe('9:16');

    editorStore.setVideoAspectRatio('1:1');
    expect(editorStore.getState().video.aspectRatio).toBe('1:1');
  });

  it('seamlessly transitions from empty video to demo video without mode change', () => {
    expect(editorStore.getState().mode).toBe('video');
    expect(editorStore.getState().video.source).toBeNull();

    editorStore.loadVideo({
      fileName: 'sample-video.mp4',
      duration: 10.0,
      width: 1280,
      height: 720,
      objectUrl: '/demo/sample-video.mp4',
      isDemo: true,
    });

    expect(editorStore.getState().mode).toBe('video');
    expect(editorStore.getState().video.source?.fileName).toBe('sample-video.mp4');
    expect(editorStore.getState().video.trim.end).toBe(10.0);
  });

  it('cleanly transitions to image mode when user chooses demo image from empty state', () => {
    expect(editorStore.getState().mode).toBe('video');

    editorStore.setMode('image');
    editorStore.loadImage({
      fileName: 'sample-image.jpg',
      width: 1920,
      height: 1080,
      objectUrl: '/demo/sample-image.jpg',
      isDemo: true,
    });

    expect(editorStore.getState().mode).toBe('image');
    expect(editorStore.getState().image.source?.fileName).toBe('sample-image.jpg');
  });
});
