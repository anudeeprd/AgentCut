import { describe, it, expect, beforeEach } from 'vitest';
import { editorStore } from '../store/editorStore';

describe('Video Store Actions and State', () => {
  beforeEach(() => {
    editorStore.loadVideo({
      fileName: 'test-video.mp4',
      duration: 10,
      width: 1280,
      height: 720,
      objectUrl: 'blob:test-video',
    });
  });

  it('loads video source cleanly', () => {
    const state = editorStore.getState().video;
    expect(state.source).not.toBeNull();
    expect(state.source?.duration).toBe(10);
    expect(state.aspectRatio).toBe('16:9');
    expect(state.playbackRate).toBe(1);
    expect(state.volume).toBe(100);
    expect(state.trim.start).toBe(0);
    expect(state.trim.end).toBe(10);
  });

  it('trims video and rejects invalid bounds', () => {
    const valid = editorStore.trimVideo(2, 8);
    expect(valid).toBe(true);
    expect(editorStore.getState().video.trim).toEqual({ start: 2, end: 8 });

    // Invalid bounds: end beyond duration
    const invalidEnd = editorStore.trimVideo(2, 15);
    expect(invalidEnd).toBe(false);

    // Invalid bounds: start >= end
    const invalidOrder = editorStore.trimVideo(5, 3);
    expect(invalidOrder).toBe(false);
  });

  it('sets aspect ratio to 9:16', () => {
    editorStore.setVideoAspectRatio('9:16');
    expect(editorStore.getState().video.aspectRatio).toBe('9:16');
  });

  it('sets playback speed only for supported speeds', () => {
    const validSpeed = editorStore.setVideoSpeed(1.5);
    expect(validSpeed).toBe(true);
    expect(editorStore.getState().video.playbackRate).toBe(1.5);

    const invalidSpeed = editorStore.setVideoSpeed(3.0);
    expect(invalidSpeed).toBe(false);
  });

  it('sets volume and mute status', () => {
    editorStore.setVideoVolume(60, false);
    expect(editorStore.getState().video.volume).toBe(60);
    expect(editorStore.getState().video.muted).toBe(false);

    editorStore.setVideoVolume(undefined, true);
    expect(editorStore.getState().video.muted).toBe(true);
  });

  it('adds, updates, and removes timed text overlays', () => {
    const textId = editorStore.addVideoText({
      content: 'Built with WebMCP',
      startTime: 2,
      endTime: 6,
      position: 'bottom-center',
      fontSize: 42,
    });

    let state = editorStore.getState().video;
    expect(state.textLayers).toHaveLength(1);
    expect(state.textLayers[0].id).toBe(textId);
    expect(state.textLayers[0].content).toBe('Built with WebMCP');
    expect(state.textLayers[0].startTime).toBe(2);
    expect(state.textLayers[0].endTime).toBe(6);

    editorStore.updateVideoText(textId, {
      content: 'AgentCut Video',
      position: 'top-center',
    });

    state = editorStore.getState().video;
    expect(state.textLayers[0].content).toBe('AgentCut Video');
    expect(state.textLayers[0].position).toBe('top-center');

    editorStore.removeVideoText(textId);
    state = editorStore.getState().video;
    expect(state.textLayers).toHaveLength(0);
  });

  it('splits clip and allows deleting segment', () => {
    expect(editorStore.getState().video.clips).toHaveLength(1);

    const splitOk = editorStore.splitVideo(4);
    expect(splitOk).toBe(true);
    expect(editorStore.getState().video.clips).toHaveLength(2);

    const firstSegmentId = editorStore.getState().video.clips[0].id;
    const deleteOk = editorStore.deleteVideoSegment(firstSegmentId);
    expect(deleteOk).toBe(true);
    expect(editorStore.getState().video.clips).toHaveLength(1);
  });

  it('supports independent video undo/redo without affecting image project', () => {
    // Modify image state
    editorStore.loadImage({
      fileName: 'img.jpg',
      width: 100,
      height: 100,
      objectUrl: 'blob:img',
    });
    editorStore.adjustImage({ brightness: 50 });
    const imgHistoryLengthBefore = editorStore.getState().image.history.length;

    // Modify video state
    editorStore.setVideoSpeed(1.5);
    expect(editorStore.getState().video.playbackRate).toBe(1.5);

    // Undo video
    editorStore.undoVideo();
    expect(editorStore.getState().video.playbackRate).toBe(1);

    // Verify image state and history are untouched!
    expect(editorStore.getState().image.adjustments.brightness).toBe(50);
    expect(editorStore.getState().image.history.length).toBe(imgHistoryLengthBefore);
  });
});
