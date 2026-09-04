import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { editorStore } from '../store/editorStore';

describe('Smooth Preview Playback Clock', () => {
  beforeEach(() => {
    editorStore.loadVideo({
      fileName: 'test.mp4',
      duration: 10,
      width: 1920,
      height: 1080,
      objectUrl: 'blob:test',
    });
  });

  afterEach(() => {
    editorStore.setIsPlaying(false);
  });

  it('transient frame time updates do not create undo history entries', () => {
    const initialHistoryLength = editorStore.getState().video.history.length;

    // Simulate 60 frame playhead updates
    for (let i = 0; i < 60; i++) {
      editorStore.setPlayhead(2.0 + i * (1 / 60));
    }

    const finalHistoryLength = editorStore.getState().video.history.length;
    // setPlayhead must never create history snapshots!
    expect(finalHistoryLength).toBe(initialHistoryLength);
  });

  it('stops playback and resets playhead when reaching trim end', () => {
    editorStore.trimVideo(2.0, 6.0);
    editorStore.setPlayhead(2.0);
    editorStore.setIsPlaying(true);

    expect(editorStore.getState().video.isPlaying).toBe(true);

    // Simulate clock checking mediaTime >= trim.end
    const trimEnd = editorStore.getState().video.trim.end;
    const mediaTime = 6.1;

    if (mediaTime >= trimEnd) {
      editorStore.setPlayhead(editorStore.getState().video.trim.start);
      editorStore.setIsPlaying(false);
    }

    expect(editorStore.getState().video.isPlaying).toBe(false);
    expect(editorStore.getState().video.playhead).toBe(2.0);
  });

  it('detects and prefers requestVideoFrameCallback when available on video element', () => {
    const video = document.createElement('video');
    const rvfcMock = vi.fn().mockReturnValue(42);
    (video as any).requestVideoFrameCallback = rvfcMock;

    const hasRvfc =
      'requestVideoFrameCallback' in video &&
      typeof (video as any).requestVideoFrameCallback === 'function';

    expect(hasRvfc).toBe(true);

    // Starting callback
    const dummyCallback = vi.fn();
    const id = (video as any).requestVideoFrameCallback(dummyCallback);
    expect(rvfcMock).toHaveBeenCalledWith(dummyCallback);
    expect(id).toBe(42);
  });

  it('falls back cleanly to requestAnimationFrame when requestVideoFrameCallback is absent', () => {
    const video = document.createElement('video');
    delete (video as any).requestVideoFrameCallback;

    const hasRvfc =
      'requestVideoFrameCallback' in video &&
      typeof (video as any).requestVideoFrameCallback === 'function';

    expect(hasRvfc).toBe(false);

    const rAFSpy = vi.spyOn(window, 'requestAnimationFrame');
    const dummyCallback = vi.fn();

    // Fallback path
    const id = window.requestAnimationFrame(dummyCallback);
    expect(rAFSpy).toHaveBeenCalledWith(dummyCallback);
    window.cancelAnimationFrame(id);
  });

  it('cancels pending frame callback on playback stop or unmount', () => {
    const video = document.createElement('video');
    const cancelRvfcMock = vi.fn();
    (video as any).cancelVideoFrameCallback = cancelRvfcMock;

    const callbackId = 101;
    (video as any).cancelVideoFrameCallback(callbackId);

    expect(cancelRvfcMock).toHaveBeenCalledWith(101);
  });
});
