import { describe, it, expect, beforeEach } from 'vitest';
import { semanticToCoords, coordsToSemantic } from '../utils/position';
import { editorStore } from '../store/editorStore';
import { getAgentCutToolDefinitions } from '../webmcp/registerTools';

describe('Tightened Semantic Text Position Presets Suite', () => {
  beforeEach(() => {
    editorStore.resetAll();
  });

  it('verifies exact coordinates for all 7 semantic presets', () => {
    // Top presets: y = 38
    expect(semanticToCoords('top-left')).toEqual({ x: 20, y: 38, alignment: 'left' });
    expect(semanticToCoords('top-center')).toEqual({ x: 50, y: 38, alignment: 'center' });
    expect(semanticToCoords('top-right')).toEqual({ x: 80, y: 38, alignment: 'right' });

    // Center preset: y = 50
    expect(semanticToCoords('center')).toEqual({ x: 50, y: 50, alignment: 'center' });

    // Bottom presets: y = 62
    expect(semanticToCoords('bottom-left')).toEqual({ x: 20, y: 62, alignment: 'left' });
    expect(semanticToCoords('bottom-center')).toEqual({ x: 50, y: 62, alignment: 'center' });
    expect(semanticToCoords('bottom-right')).toEqual({ x: 80, y: 62, alignment: 'right' });
  });

  it('verifies stacked title composition: "Welcome To" at Top Center and "Indonesia" at Center', () => {
    editorStore.setMode('video');
    editorStore.loadVideo({
      fileName: 'sample-video.mp4',
      duration: 10.0,
      width: 1280,
      height: 720,
      objectUrl: 'blob:sample-video',
    });

    const id1 = editorStore.addVideoText({
      content: 'WELCOME TO',
      position: 'top-center',
      startTime: 2,
      endTime: 6,
    });

    const id2 = editorStore.addVideoText({
      content: 'Indonesia',
      position: 'center',
      startTime: 2,
      endTime: 6,
    });

    const layer1 = editorStore.getState().video.textLayers.find((l) => l.id === id1)!;
    const layer2 = editorStore.getState().video.textLayers.find((l) => l.id === id2)!;

    expect(layer1.x).toBe(50);
    expect(layer1.y).toBe(38);

    expect(layer2.x).toBe(50);
    expect(layer2.y).toBe(50);

    // Tightened vertical gap between centers is 12% (instead of old 38%)
    const verticalGap = layer2.y - layer1.y;
    expect(verticalGap).toBe(12);
  });

  it('verifies image mode uses the exact same tightened preset coordinates', () => {
    editorStore.setMode('image');
    editorStore.loadImage({
      fileName: 'sample.jpg',
      width: 1920,
      height: 1080,
      objectUrl: 'blob:sample',
    });

    const idTopLeft = editorStore.addImageText({
      content: 'Heading Left',
      position: 'top-left',
    });
    const idBottomRight = editorStore.addImageText({
      content: 'Watermark Right',
      position: 'bottom-right',
    });

    const lTopLeft = editorStore.getState().image.textLayers.find((l) => l.id === idTopLeft)!;
    const lBottomRight = editorStore.getState().image.textLayers.find((l) => l.id === idBottomRight)!;

    expect(lTopLeft.x).toBe(20);
    expect(lTopLeft.y).toBe(38);

    expect(lBottomRight.x).toBe(80);
    expect(lBottomRight.y).toBe(62);
  });

  it('verifies updateVideoText and updateImageText recompute coordinates on position change', () => {
    editorStore.setMode('video');
    const vid = editorStore.addVideoText({
      content: 'Test',
      position: 'center',
      startTime: 0,
      endTime: 5,
    });

    expect(editorStore.getState().video.textLayers[0].y).toBe(50);

    editorStore.updateVideoText(vid, { position: 'top-center' });
    expect(editorStore.getState().video.textLayers[0].y).toBe(38);

    editorStore.updateVideoText(vid, { position: 'bottom-center' });
    expect(editorStore.getState().video.textLayers[0].y).toBe(62);

    editorStore.setMode('image');
    const img = editorStore.addImageText({
      content: 'Image Text',
      position: 'center',
    });

    expect(editorStore.getState().image.textLayers[0].y).toBe(50);

    editorStore.updateImageText(img, { position: 'top-right' });
    expect(editorStore.getState().image.textLayers[0].x).toBe(80);
    expect(editorStore.getState().image.textLayers[0].y).toBe(38);
  });

  it('verifies coordsToSemantic bidirectional classification', () => {
    expect(coordsToSemantic(20, 38)).toBe('top-left');
    expect(coordsToSemantic(50, 38)).toBe('top-center');
    expect(coordsToSemantic(80, 38)).toBe('top-right');
    expect(coordsToSemantic(50, 50)).toBe('center');
    expect(coordsToSemantic(20, 62)).toBe('bottom-left');
    expect(coordsToSemantic(50, 62)).toBe('bottom-center');
    expect(coordsToSemantic(80, 62)).toBe('bottom-right');
  });

  it('preserves exactly 29 WebMCP tools without any changes', () => {
    const tools = getAgentCutToolDefinitions();
    expect(tools).toHaveLength(29);
  });
});
