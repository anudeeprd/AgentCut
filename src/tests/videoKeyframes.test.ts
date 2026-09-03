import { describe, it, expect, beforeEach } from 'vitest';
import { editorStore } from '../store/editorStore';
import {
  interpolateProperty,
  interpolateTextLayerKeyframes,
  interpolateVideoKeyframes,
} from '../utils/interpolation';
import { VideoKeyframe, VideoTextLayer } from '../types/editor';

describe('Video Keyframes Store Actions', () => {
  beforeEach(() => {
    editorStore.loadVideo({
      fileName: 'test-video.mp4',
      duration: 10,
      width: 1280,
      height: 720,
      objectUrl: 'blob:test-video',
    });
  });

  it('adds a valid text keyframe (Test 1)', () => {
    const textId = editorStore.addVideoText({
      content: 'NEW YORK',
      startTime: 2,
      endTime: 7,
      position: 'top-center',
      fontSize: 48,
    });

    const kfId = editorStore.addVideoKeyframe({
      targetType: 'text',
      targetId: textId,
      time: 2,
      properties: {
        x: 50,
        y: 50,
        scale: 1.4,
        opacity: 0,
      },
    });

    expect(kfId).toBeTruthy();
    const keyframes = editorStore.getState().video.keyframes;
    expect(keyframes).toHaveLength(1);
    expect(keyframes[0].id).toBe(kfId);
    expect(keyframes[0].targetType).toBe('text');
    expect(keyframes[0].targetId).toBe(textId);
    expect(keyframes[0].time).toBe(2);
    expect(keyframes[0].properties).toEqual({
      x: 50,
      y: 50,
      scale: 1.4,
      opacity: 0,
    });
  });

  it('adds a valid video keyframe (Test 2)', () => {
    const kfId = editorStore.addVideoKeyframe({
      targetType: 'video',
      time: 5,
      properties: {
        x: 52,
        y: 48,
        scale: 1.2,
      },
    });

    expect(kfId).toBeTruthy();
    const keyframes = editorStore.getState().video.keyframes;
    expect(keyframes).toHaveLength(1);
    expect(keyframes[0].targetType).toBe('video');
    expect(keyframes[0].time).toBe(5);
    expect(keyframes[0].properties.scale).toBe(1.2);
  });

  it('rejects invalid targetId for text keyframe (Test 3)', () => {
    const kfId = editorStore.addVideoKeyframe({
      targetType: 'text',
      targetId: 'non-existent-layer-id',
      time: 2,
      properties: {
        x: 50,
        y: 50,
      },
    });

    expect(kfId).toBeNull();
    expect(editorStore.getState().video.keyframes).toHaveLength(0);
  });

  it('rejects invalid timestamp beyond video duration or negative (Test 4)', () => {
    // Duration is 10s
    const kfIdBeyond = editorStore.addVideoKeyframe({
      targetType: 'video',
      time: 15,
      properties: { scale: 1.5 },
    });
    expect(kfIdBeyond).toBeNull();

    const kfIdNegative = editorStore.addVideoKeyframe({
      targetType: 'video',
      time: -1,
      properties: { scale: 1.5 },
    });
    expect(kfIdNegative).toBeNull();
  });

  it('rejects invalid scale outside 0.25 to 3 range (Test 5)', () => {
    const kfTooSmall = editorStore.addVideoKeyframe({
      targetType: 'video',
      time: 2,
      properties: { scale: 0.1 },
    });
    expect(kfTooSmall).toBeNull();

    const kfTooLarge = editorStore.addVideoKeyframe({
      targetType: 'video',
      time: 2,
      properties: { scale: 5 },
    });
    expect(kfTooLarge).toBeNull();
  });

  it('partial update preserves unspecified properties (Test 6)', () => {
    const kfId = editorStore.addVideoKeyframe({
      targetType: 'video',
      time: 2,
      properties: {
        x: 50,
        y: 50,
        scale: 1.2,
      },
    })!;

    // Partially update only scale
    const updated = editorStore.updateVideoKeyframe(kfId, {
      properties: {
        scale: 1.8,
      },
    });
    expect(updated).toBe(true);

    const kf = editorStore.getState().video.keyframes.find((k) => k.id === kfId)!;
    expect(kf.time).toBe(2);
    expect(kf.properties.x).toBe(50);
    expect(kf.properties.y).toBe(50);
    expect(kf.properties.scale).toBe(1.8);

    // Partially update only time
    editorStore.updateVideoKeyframe(kfId, {
      time: 3.5,
    });
    const kfAfterTime = editorStore.getState().video.keyframes.find((k) => k.id === kfId)!;
    expect(kfAfterTime.time).toBe(3.5);
    expect(kfAfterTime.properties.scale).toBe(1.8);
    expect(kfAfterTime.properties.x).toBe(50);
  });

  it('removes keyframe cleanly (Test 7)', () => {
    const kfId = editorStore.addVideoKeyframe({
      targetType: 'video',
      time: 4,
      properties: { scale: 1.5 },
    })!;

    expect(editorStore.getState().video.keyframes).toHaveLength(1);
    const removed = editorStore.removeVideoKeyframe(kfId);
    expect(removed).toBe(true);
    expect(editorStore.getState().video.keyframes).toHaveLength(0);
  });

  it('maintains chronological ordering regardless of addition order (Test 8)', () => {
    editorStore.addVideoKeyframe({ targetType: 'video', time: 7, properties: { scale: 1.5 } });
    editorStore.addVideoKeyframe({ targetType: 'video', time: 2, properties: { scale: 1.0 } });
    editorStore.addVideoKeyframe({ targetType: 'video', time: 4.5, properties: { scale: 1.2 } });

    const times = editorStore.getState().video.keyframes.map((k) => k.time);
    expect(times).toEqual([2, 4.5, 7]);
  });

  it('supports undo and redo for keyframe operations (Test 9 & 10)', () => {
    expect(editorStore.getState().video.keyframes).toHaveLength(0);

    const kf1 = editorStore.addVideoKeyframe({
      targetType: 'video',
      time: 2,
      properties: { scale: 1 },
    })!;
    const kf2 = editorStore.addVideoKeyframe({
      targetType: 'video',
      time: 7,
      properties: { scale: 1.5 },
    })!;

    expect(editorStore.getState().video.keyframes).toHaveLength(2);

    // Undo adding kf2
    editorStore.undoVideo();
    expect(editorStore.getState().video.keyframes).toHaveLength(1);
    expect(editorStore.getState().video.keyframes[0].id).toBe(kf1);

    // Redo adding kf2
    editorStore.redoVideo();
    expect(editorStore.getState().video.keyframes).toHaveLength(2);
    expect(editorStore.getState().video.keyframes[1].id).toBe(kf2);
  });

  it('cleans up associated keyframes when a text layer is removed', () => {
    const textId = editorStore.addVideoText({
      content: 'Fading Text',
      startTime: 1,
      endTime: 5,
      position: 'center',
    });

    editorStore.addVideoKeyframe({
      targetType: 'text',
      targetId: textId,
      time: 1,
      properties: { opacity: 0 },
    });
    editorStore.addVideoKeyframe({
      targetType: 'text',
      targetId: textId,
      time: 2,
      properties: { opacity: 1 },
    });
    editorStore.addVideoKeyframe({
      targetType: 'video',
      time: 3,
      properties: { scale: 1.1 },
    });

    expect(editorStore.getState().video.keyframes).toHaveLength(3);

    editorStore.removeVideoText(textId);
    expect(editorStore.getState().video.textLayers).toHaveLength(0);
    // Only video keyframe remains
    const remaining = editorStore.getState().video.keyframes;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].targetType).toBe('video');
  });
});

describe('Linear Interpolation Engine Tests', () => {
  it('interpolates scale and opacity linearly between surrounding keyframes', () => {
    const keyframeA: VideoKeyframe = {
      id: 'kf-a',
      targetType: 'text',
      targetId: 'text-1',
      time: 2,
      properties: {
        scale: 1,
        opacity: 0,
      },
    };

    const keyframeB: VideoKeyframe = {
      id: 'kf-b',
      targetType: 'text',
      targetId: 'text-1',
      time: 4,
      properties: {
        scale: 2,
        opacity: 1,
      },
    };

    const keyframes = [keyframeA, keyframeB];

    // At time 3: exactly midway
    const scaleMid = interpolateProperty(keyframes, 'scale', 3, 1);
    const opacityMid = interpolateProperty(keyframes, 'opacity', 3, 1);

    expect(scaleMid).toBeCloseTo(1.5, 5);
    expect(opacityMid).toBeCloseTo(0.5, 5);

    // At time 2.5: 25% progress
    expect(interpolateProperty(keyframes, 'scale', 2.5, 1)).toBeCloseTo(1.25, 5);
    expect(interpolateProperty(keyframes, 'opacity', 2.5, 1)).toBeCloseTo(0.25, 5);

    // Before time 2: clamp to first keyframe
    expect(interpolateProperty(keyframes, 'scale', 1, 1)).toBe(1);
    expect(interpolateProperty(keyframes, 'opacity', 1, 1)).toBe(0);

    // After time 4: clamp to last keyframe
    expect(interpolateProperty(keyframes, 'scale', 5, 1)).toBe(2);
    expect(interpolateProperty(keyframes, 'opacity', 5, 1)).toBe(1);
  });

  it('interpolates sparse properties independently against relevant surrounding keyframes', () => {
    // A: time 2, x 50, opacity 0
    // B: time 3, opacity 1
    // C: time 4, x 70
    const kfA: VideoKeyframe = {
      id: 'kf-a',
      targetType: 'text',
      targetId: 'text-1',
      time: 2,
      properties: { x: 50, opacity: 0 },
    };
    const kfB: VideoKeyframe = {
      id: 'kf-b',
      targetType: 'text',
      targetId: 'text-1',
      time: 3,
      properties: { opacity: 1 },
    };
    const kfC: VideoKeyframe = {
      id: 'kf-c',
      targetType: 'text',
      targetId: 'text-1',
      time: 4,
      properties: { x: 70 },
    };

    const keyframes = [kfA, kfB, kfC];

    // At time 3:
    // Opacity is defined in B at time 3 -> should be 1
    // X is defined in A (time 2, 50) and C (time 4, 70) -> midway at time 3 -> should be 60
    const opacityAt3 = interpolateProperty(keyframes, 'opacity', 3, 1);
    const xAt3 = interpolateProperty(keyframes, 'x', 3, 50);

    expect(opacityAt3).toBe(1);
    expect(xAt3).toBeCloseTo(60, 5);
  });

  it('interpolates full text layer with base values as fallbacks for un-keyframed properties', () => {
    const textLayer: VideoTextLayer = {
      id: 'video-text-1',
      content: 'NEW YORK',
      startTime: 2,
      endTime: 7,
      position: 'center',
      x: 50,
      y: 50,
      fontSize: 48,
      fontWeight: 'bold',
      opacity: 1,
      color: '#ffffff',
    };

    // Workflow 1:
    // 2.0 sec: { x: 50, y: 50, scale: 1.4, opacity: 0 }
    // 2.4 sec: { opacity: 1 }
    // 3.5 sec: { x: 50, y: 12, scale: 1 }
    const keyframes: VideoKeyframe[] = [
      {
        id: 'kf-1',
        targetType: 'text',
        targetId: 'video-text-1',
        time: 2.0,
        properties: { x: 50, y: 50, scale: 1.4, opacity: 0 },
      },
      {
        id: 'kf-2',
        targetType: 'text',
        targetId: 'video-text-1',
        time: 2.4,
        properties: { opacity: 1 },
      },
      {
        id: 'kf-3',
        targetType: 'text',
        targetId: 'video-text-1',
        time: 3.5,
        properties: { x: 50, y: 12, scale: 1 },
      },
    ];

    // At 2.0 sec
    const at2 = interpolateTextLayerKeyframes(textLayer, keyframes, 2.0);
    expect(at2.x).toBe(50);
    expect(at2.y).toBe(50);
    expect(at2.scale).toBe(1.4);
    expect(at2.opacity).toBe(0);

    // At 2.2 sec (halfway through fade)
    const at22 = interpolateTextLayerKeyframes(textLayer, keyframes, 2.2);
    expect(at22.opacity).toBeCloseTo(0.5, 5);
    // y should be moving from 50 towards 12: progress = (2.2 - 2.0) / (3.5 - 2.0) = 0.2 / 1.5 ≈ 0.1333
    expect(at22.y).toBeCloseTo(50 + (12 - 50) * (0.2 / 1.5), 4);

    // At 2.4 sec
    const at24 = interpolateTextLayerKeyframes(textLayer, keyframes, 2.4);
    expect(at24.opacity).toBe(1);

    // At 3.5 sec
    const at35 = interpolateTextLayerKeyframes(textLayer, keyframes, 3.5);
    expect(at35.x).toBe(50);
    expect(at35.y).toBe(12);
    expect(at35.scale).toBe(1);
    expect(at35.opacity).toBe(1);

    // At 5.0 sec (after keyframes): preserves final state
    const at5 = interpolateTextLayerKeyframes(textLayer, keyframes, 5.0);
    expect(at5.x).toBe(50);
    expect(at5.y).toBe(12);
    expect(at5.scale).toBe(1);
    expect(at5.opacity).toBe(1);
  });

  it('interpolates video push-in workflow accurately', () => {
    // 2 sec: { x: 50, y: 50, scale: 1 }
    // 7 sec: { x: 52, y: 46, scale: 1.2 }
    const keyframes: VideoKeyframe[] = [
      {
        id: 'vkf-1',
        targetType: 'video',
        time: 2,
        properties: { x: 50, y: 50, scale: 1 },
      },
      {
        id: 'vkf-2',
        targetType: 'video',
        time: 7,
        properties: { x: 52, y: 46, scale: 1.2 },
      },
    ];

    // At 2s: base
    const at2 = interpolateVideoKeyframes(keyframes, 2);
    expect(at2.x).toBe(50);
    expect(at2.y).toBe(50);
    expect(at2.scale).toBe(1);

    // At 4.5s: midway (progress = 2.5 / 5 = 0.5)
    const at45 = interpolateVideoKeyframes(keyframes, 4.5);
    expect(at45.x).toBeCloseTo(51, 5);
    expect(at45.y).toBeCloseTo(48, 5);
    expect(at45.scale).toBeCloseTo(1.1, 5);

    // At 7s: final
    const at7 = interpolateVideoKeyframes(keyframes, 7);
    expect(at7.x).toBe(52);
    expect(at7.y).toBe(46);
    expect(at7.scale).toBe(1.2);
  });

  it('interpolates WOW Workflow 3 (Explore More soft fade in and fade out)', () => {
    const textLayer: VideoTextLayer = {
      id: 'video-text-explore',
      content: 'Explore More',
      startTime: 4,
      endTime: 8,
      position: 'bottom-center',
      x: 50,
      y: 90,
      fontSize: 36,
      fontWeight: 'bold',
      opacity: 1,
      color: '#ffffff',
    };

    // 4.0: opacity 0
    // 4.5: opacity 1
    // 7.5: opacity 1
    // 8.0: opacity 0
    const keyframes: VideoKeyframe[] = [
      { id: 'kf-1', targetType: 'text', targetId: 'video-text-explore', time: 4.0, properties: { opacity: 0 } },
      { id: 'kf-2', targetType: 'text', targetId: 'video-text-explore', time: 4.5, properties: { opacity: 1 } },
      { id: 'kf-3', targetType: 'text', targetId: 'video-text-explore', time: 7.5, properties: { opacity: 1 } },
      { id: 'kf-4', targetType: 'text', targetId: 'video-text-explore', time: 8.0, properties: { opacity: 0 } },
    ];

    // At 4.0s: invisible (fade starts)
    expect(interpolateTextLayerKeyframes(textLayer, keyframes, 4.0).opacity).toBe(0);

    // At 4.25s: midway fade in
    expect(interpolateTextLayerKeyframes(textLayer, keyframes, 4.25).opacity).toBeCloseTo(0.5, 5);

    // At 4.5s: fully visible
    expect(interpolateTextLayerKeyframes(textLayer, keyframes, 4.5).opacity).toBe(1);

    // At 6.0s: stays fully visible
    expect(interpolateTextLayerKeyframes(textLayer, keyframes, 6.0).opacity).toBe(1);

    // At 7.5s: still fully visible (fade out starts)
    expect(interpolateTextLayerKeyframes(textLayer, keyframes, 7.5).opacity).toBe(1);

    // At 7.75s: midway fade out
    expect(interpolateTextLayerKeyframes(textLayer, keyframes, 7.75).opacity).toBeCloseTo(0.5, 5);

    // At 8.0s: invisible
    expect(interpolateTextLayerKeyframes(textLayer, keyframes, 8.0).opacity).toBe(0);
  });
});
