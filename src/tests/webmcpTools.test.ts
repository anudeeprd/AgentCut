import { describe, it, expect, beforeEach } from 'vitest';
import { getAgentCutToolDefinitions } from '../webmcp/registerTools';
import { editorStore } from '../store/editorStore';

describe('WebMCP Tool Definitions and Execution', () => {
  const tools = getAgentCutToolDefinitions();
  const toolMap = new Map(tools.map((t) => [t.name, t]));

  beforeEach(() => {
    editorStore.loadImage({
      fileName: 'sample.jpg',
      width: 1920,
      height: 1080,
      objectUrl: 'blob:sample',
    });
    editorStore.loadVideo({
      fileName: 'sample.mp4',
      duration: 10,
      width: 1280,
      height: 720,
      objectUrl: 'blob:sample-video',
    });
  });

  it('contains all required Image tools with correct annotations', () => {
    const requiredImageTools = [
      { name: 'get_image_state', readOnly: true },
      { name: 'set_image_aspect_ratio', readOnly: false },
      { name: 'rotate_image', readOnly: false },
      { name: 'flip_image', readOnly: false },
      { name: 'adjust_image', readOnly: false },
      { name: 'add_image_text', readOnly: false },
      { name: 'update_image_text', readOnly: false },
      { name: 'remove_image_text', readOnly: false },
      { name: 'undo_image_edit', readOnly: false },
      { name: 'redo_image_edit', readOnly: false },
      { name: 'export_image', readOnly: false },
    ];

    for (const req of requiredImageTools) {
      const tool = toolMap.get(req.name);
      expect(tool).toBeDefined();
      expect(tool?.annotations.readOnlyHint).toBe(req.readOnly);
      expect(tool?.description).toBeTruthy();
      expect(tool?.inputSchema).toBeDefined();
    }
  });

  it('contains all required Video tools with correct annotations', () => {
    const requiredVideoTools = [
      { name: 'get_video_state', readOnly: true },
      { name: 'get_timeline', readOnly: true },
      { name: 'trim_video', readOnly: false },
      { name: 'set_video_aspect_ratio', readOnly: false },
      { name: 'set_video_speed', readOnly: false },
      { name: 'set_video_volume', readOnly: false },
      { name: 'add_video_text', readOnly: false },
      { name: 'update_video_text', readOnly: false },
      { name: 'remove_video_text', readOnly: false },
      { name: 'undo_video_edit', readOnly: false },
      { name: 'redo_video_edit', readOnly: false },
      { name: 'export_video', readOnly: false },
    ];

    for (const req of requiredVideoTools) {
      const tool = toolMap.get(req.name);
      expect(tool).toBeDefined();
      expect(tool?.annotations.readOnlyHint).toBe(req.readOnly);
      expect(tool?.description).toBeTruthy();
      expect(tool?.inputSchema).toBeDefined();
    }
  });

  it('executes get_image_state and returns structured JSON without binary blobs', async () => {
    const tool = toolMap.get('get_image_state')!;
    const res = await tool.execute({});
    expect(res.success).toBe(true);
    expect(res.mode).toBe('image');
    expect(res.canvas.aspectRatio).toBe('original');
    expect(res.adjustments).toBeDefined();
  });

  it('validates invalid inputs cleanly without throwing', async () => {
    // Invalid aspect ratio
    const aspectTool = toolMap.get('set_image_aspect_ratio')!;
    const resAspect = await aspectTool.execute({ ratio: 'invalid-ratio' });
    expect(resAspect.success).toBe(false);
    expect(resAspect.error).toContain('Invalid aspect ratio');

    // Invalid trim
    const trimTool = toolMap.get('trim_video')!;
    const resTrim = await trimTool.execute({ startTime: 10, endTime: 2 });
    expect(resTrim.success).toBe(false);
    expect(resTrim.error).toBeDefined();

    // Invalid speed
    const speedTool = toolMap.get('set_video_speed')!;
    const resSpeed = await speedTool.execute({ speed: 4.5 });
    expect(resSpeed.success).toBe(false);
    expect(resSpeed.error).toContain('Invalid speed');
  });

  it('mutates canonical store when tools are executed', async () => {
    const adjustTool = toolMap.get('adjust_image')!;
    await adjustTool.execute({ brightness: 15, saturation: 20 });

    const state = editorStore.getState().image;
    expect(state.adjustments.brightness).toBe(15);
    expect(state.adjustments.saturation).toBe(20);
  });

  it('reports truthful metadata on export_video without falsely claiming re-rendering', async () => {
    const exportVideoTool = toolMap.get('export_video')!;
    const res = await exportVideoTool.execute({});

    expect(res.success).toBe(true);
    expect(res.downloaded).toBe('source_media');
    expect(res.renderedOutput).toBe(false);
    expect(res.message).toContain('Full client-side video re-encoding');
    expect(res.projectState).toBeDefined();
  });
});
