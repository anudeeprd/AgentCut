import { describe, it, expect, beforeEach } from 'vitest';
import { editorStore } from '../store/editorStore';

describe('Image Store Actions and State', () => {
  beforeEach(() => {
    editorStore.loadImage({
      fileName: 'test-image.jpg',
      width: 1920,
      height: 1080,
      objectUrl: 'blob:test-image',
    });
  });

  it('loads demo image source cleanly', () => {
    const state = editorStore.getState().image;
    expect(state.source).not.toBeNull();
    expect(state.source?.fileName).toBe('test-image.jpg');
    expect(state.canvas.aspectRatio).toBe('original');
    expect(state.adjustments.brightness).toBe(0);
    expect(state.textLayers).toHaveLength(0);
  });

  it('changes aspect ratio to 4:5 and updates dimensions', () => {
    editorStore.setImageAspectRatio('4:5');
    const state = editorStore.getState().image;
    expect(state.canvas.aspectRatio).toBe('4:5');
    expect(state.canvas.width).toBe(864);
    expect(state.canvas.height).toBe(1080);
  });

  it('updates adjustments correctly', () => {
    editorStore.adjustImage({
      brightness: 10,
      contrast: 8,
      saturation: 12,
    });
    const state = editorStore.getState().image;
    expect(state.adjustments.brightness).toBe(10);
    expect(state.adjustments.contrast).toBe(8);
    expect(state.adjustments.saturation).toBe(12);
    expect(state.adjustments.grayscale).toBe(0);
  });

  it('adds, updates, and removes text layers', () => {
    const textId = editorStore.addImageText({
      content: 'Explore More',
      position: 'bottom-center',
      fontSize: 48,
    });

    let state = editorStore.getState().image;
    expect(state.textLayers).toHaveLength(1);
    expect(state.textLayers[0].id).toBe(textId);
    expect(state.textLayers[0].content).toBe('Explore More');
    expect(state.textLayers[0].position).toBe('bottom-center');

    // Update text layer
    editorStore.updateImageText(textId, {
      content: 'Weekend Escape',
      position: 'top-left',
      fontSize: 36,
    });

    state = editorStore.getState().image;
    expect(state.textLayers[0].content).toBe('Weekend Escape');
    expect(state.textLayers[0].position).toBe('top-left');
    expect(state.textLayers[0].fontSize).toBe(36);

    // Remove text layer
    editorStore.removeImageText(textId);
    state = editorStore.getState().image;
    expect(state.textLayers).toHaveLength(0);
  });

  it('supports independent undo and redo', () => {
    expect(editorStore.getState().image.history).toHaveLength(0);

    editorStore.adjustImage({ brightness: 25 });
    expect(editorStore.getState().image.adjustments.brightness).toBe(25);
    expect(editorStore.getState().image.history).toHaveLength(1);

    editorStore.undoImage();
    expect(editorStore.getState().image.adjustments.brightness).toBe(0);
    expect(editorStore.getState().image.future).toHaveLength(1);

    editorStore.redoImage();
    expect(editorStore.getState().image.adjustments.brightness).toBe(25);
  });
});
