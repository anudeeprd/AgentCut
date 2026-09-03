import { describe, it, expect, vi } from 'vitest';
import { getAgentCutToolDefinitions } from '../webmcp/registerTools';
import { editorStore } from '../store/editorStore';

describe('WebMCP to Store Reactivity', () => {
  const tools = getAgentCutToolDefinitions();
  const toolMap = new Map(tools.map((t) => [t.name, t]));

  it('triggers subscribers on image aspect ratio mutation', async () => {
    editorStore.loadImage({
      fileName: 'test.jpg',
      width: 1000,
      height: 1000,
      objectUrl: 'blob:test',
    });

    const listener = vi.fn();
    const unsubscribe = editorStore.subscribe(listener);

    const tool = toolMap.get('set_image_aspect_ratio')!;
    await tool.execute({ ratio: '4:5' });

    expect(listener).toHaveBeenCalled();
    expect(editorStore.getState().image.canvas.aspectRatio).toBe('4:5');
    unsubscribe();
  });

  it('triggers subscribers on image adjustments mutation', async () => {
    const listener = vi.fn();
    const unsubscribe = editorStore.subscribe(listener);

    const tool = toolMap.get('adjust_image')!;
    await tool.execute({ brightness: 15, contrast: 10 });

    expect(listener).toHaveBeenCalled();
    expect(editorStore.getState().image.adjustments.brightness).toBe(15);
    expect(editorStore.getState().image.adjustments.contrast).toBe(10);
    unsubscribe();
  });

  it('triggers subscribers on adding and updating image text', async () => {
    const listener = vi.fn();
    const unsubscribe = editorStore.subscribe(listener);

    const addTool = toolMap.get('add_image_text')!;
    const addRes = await addTool.execute({ content: 'Reactive Text' });

    expect(listener).toHaveBeenCalled();
    const textId = addRes.textId;

    const updateTool = toolMap.get('update_image_text')!;
    await updateTool.execute({ textId, content: 'Updated Text' });

    expect(editorStore.getState().image.textLayers[0].content).toBe('Updated Text');
    unsubscribe();
  });

  it('triggers subscribers on video trim and speed mutations', async () => {
    editorStore.loadVideo({
      fileName: 'vid.mp4',
      duration: 10,
      width: 1280,
      height: 720,
      objectUrl: 'blob:vid',
    });

    const listener = vi.fn();
    const unsubscribe = editorStore.subscribe(listener);

    const trimTool = toolMap.get('trim_video')!;
    await trimTool.execute({ startTime: 1, endTime: 9 });

    expect(listener).toHaveBeenCalled();
    expect(editorStore.getState().video.trim).toEqual({ start: 1, end: 9 });

    const speedTool = toolMap.get('set_video_speed')!;
    await speedTool.execute({ speed: 2 });

    expect(editorStore.getState().video.playbackRate).toBe(2);
    unsubscribe();
  });

  it('triggers subscribers on video text and undo mutations', async () => {
    const listener = vi.fn();
    const unsubscribe = editorStore.subscribe(listener);

    const textTool = toolMap.get('add_video_text')!;
    await textTool.execute({
      content: 'Hello World',
      startTime: 0,
      endTime: 5,
    });

    expect(listener).toHaveBeenCalled();
    expect(editorStore.getState().video.textLayers).toHaveLength(1);

    const undoTool = toolMap.get('undo_video_edit')!;
    await undoTool.execute({});

    expect(editorStore.getState().video.textLayers).toHaveLength(0);
    unsubscribe();
  });
});
