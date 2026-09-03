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
      { name: 'add_video_keyframe', readOnly: false },
      { name: 'update_video_keyframe', readOnly: false },
      { name: 'remove_video_keyframe', readOnly: false },
      { name: 'get_video_keyframes', readOnly: true },
      { name: 'split_video', readOnly: false },
      { name: 'delete_video_segment', readOnly: false },
      { name: 'undo_video_edit', readOnly: false },
      { name: 'redo_video_edit', readOnly: false },
      { name: 'export_video', readOnly: false },
    ];

    expect(tools).toHaveLength(29);

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

  it('preserves unspecified properties on partial update_image_text (IMAGE regression test)', async () => {
    const addTextTool = toolMap.get('add_image_text')!;
    const updateTextTool = toolMap.get('update_image_text')!;

    // 1. Add image text:
    //    content = "NEW YORK", position = "top-center", fontSize = 48, opacity = 1
    const addRes = await addTextTool.execute({
      content: 'NEW YORK',
      position: 'top-center',
      fontSize: 48,
    });
    expect(addRes.success).toBe(true);
    const textId = addRes.textId;

    let layer = editorStore.getState().image.textLayers.find((l) => l.id === textId)!;
    expect(layer.content).toBe('NEW YORK');
    expect(layer.position).toBe('top-center');
    expect(layer.fontSize).toBe(48);
    expect(layer.opacity).toBe(1);

    // 2. Call update_image_text with ONLY: fontSize = 36
    const updateRes1 = await updateTextTool.execute({
      textId,
      fontSize: 36,
    });
    expect(updateRes1.success).toBe(true);

    // 3. Verify:
    //    content === "NEW YORK", position === "top-center", fontSize === 36, opacity === 1
    layer = editorStore.getState().image.textLayers.find((l) => l.id === textId)!;
    expect(layer.content).toBe('NEW YORK');
    expect(layer.position).toBe('top-center');
    expect(layer.fontSize).toBe(36);
    expect(layer.opacity).toBe(1);
    expect(Number.isNaN(layer.opacity)).toBe(false);

    // 4. Call update_image_text with ONLY: position = "top-left"
    const updateRes2 = await updateTextTool.execute({
      textId,
      position: 'top-left',
    });
    expect(updateRes2.success).toBe(true);

    // 5. Verify:
    //    content === "NEW YORK", position === "top-left", fontSize === 36, opacity === 1
    layer = editorStore.getState().image.textLayers.find((l) => l.id === textId)!;
    expect(layer.content).toBe('NEW YORK');
    expect(layer.position).toBe('top-left');
    expect(layer.fontSize).toBe(36);
    expect(layer.opacity).toBe(1);
    expect(Number.isNaN(layer.opacity)).toBe(false);

    // Verify undo and redo preserves values
    const undoTool = toolMap.get('undo_image_edit')!;
    const redoTool = toolMap.get('redo_image_edit')!;

    // Undo position
    await undoTool.execute({});
    layer = editorStore.getState().image.textLayers.find((l) => l.id === textId)!;
    expect(layer.content).toBe('NEW YORK');
    expect(layer.position).toBe('top-center');
    expect(layer.fontSize).toBe(36);
    expect(layer.opacity).toBe(1);

    // Undo fontSize
    await undoTool.execute({});
    layer = editorStore.getState().image.textLayers.find((l) => l.id === textId)!;
    expect(layer.content).toBe('NEW YORK');
    expect(layer.position).toBe('top-center');
    expect(layer.fontSize).toBe(48);
    expect(layer.opacity).toBe(1);

    // Redo fontSize
    await redoTool.execute({});
    layer = editorStore.getState().image.textLayers.find((l) => l.id === textId)!;
    expect(layer.fontSize).toBe(36);

    // Redo position
    await redoTool.execute({});
    layer = editorStore.getState().image.textLayers.find((l) => l.id === textId)!;
    expect(layer.position).toBe('top-left');
    expect(layer.fontSize).toBe(36);
    expect(layer.content).toBe('NEW YORK');
    expect(layer.opacity).toBe(1);
  });

  it('preserves unspecified properties on partial update_video_text (VIDEO regression test)', async () => {
    const addVideoTextTool = toolMap.get('add_video_text')!;
    const updateVideoTextTool = toolMap.get('update_video_text')!;

    // 1. Add:
    //    content = "NEW YORK", position = "top-center", startTime = 2, endTime = 6, fontSize = 72
    const addRes = await addVideoTextTool.execute({
      content: 'NEW YORK',
      position: 'top-center',
      startTime: 2,
      endTime: 6,
      fontSize: 72,
    });
    expect(addRes.success).toBe(true);
    const textId = addRes.textId;

    let layer = editorStore.getState().video.textLayers.find((l) => l.id === textId)!;
    expect(layer.content).toBe('NEW YORK');
    expect(layer.position).toBe('top-center');
    expect(layer.startTime).toBe(2);
    expect(layer.endTime).toBe(6);
    expect(layer.fontSize).toBe(72);

    // 2. Call update_video_text with ONLY: fontSize = 48
    const updateRes = await updateVideoTextTool.execute({
      textId,
      fontSize: 48,
    });
    expect(updateRes.success).toBe(true);

    // 3. Verify:
    //    content === "NEW YORK", position === "top-center", startTime === 2, endTime === 6, fontSize === 48
    layer = editorStore.getState().video.textLayers.find((l) => l.id === textId)!;
    expect(layer.content).toBe('NEW YORK');
    expect(layer.position).toBe('top-center');
    expect(layer.startTime).toBe(2);
    expect(layer.endTime).toBe(6);
    expect(layer.fontSize).toBe(48);

    // Verify undo and redo
    const undoTool = toolMap.get('undo_video_edit')!;
    const redoTool = toolMap.get('redo_video_edit')!;

    await undoTool.execute({});
    layer = editorStore.getState().video.textLayers.find((l) => l.id === textId)!;
    expect(layer.fontSize).toBe(72);
    expect(layer.content).toBe('NEW YORK');
    expect(layer.position).toBe('top-center');
    expect(layer.startTime).toBe(2);
    expect(layer.endTime).toBe(6);

    await redoTool.execute({});
    layer = editorStore.getState().video.textLayers.find((l) => l.id === textId)!;
    expect(layer.fontSize).toBe(48);
    expect(layer.content).toBe('NEW YORK');
    expect(layer.position).toBe('top-center');
    expect(layer.startTime).toBe(2);
    expect(layer.endTime).toBe(6);
  });

  it('executes video keyframe WebMCP tools with structured responses and undo/redo', async () => {
    const addTextTool = toolMap.get('add_video_text')!;
    const addKeyframeTool = toolMap.get('add_video_keyframe')!;
    const updateKeyframeTool = toolMap.get('update_video_keyframe')!;
    const removeKeyframeTool = toolMap.get('remove_video_keyframe')!;
    const getKeyframesTool = toolMap.get('get_video_keyframes')!;
    const getVideoStateTool = toolMap.get('get_video_state')!;
    const undoTool = toolMap.get('undo_video_edit')!;
    const redoTool = toolMap.get('redo_video_edit')!;

    // 1. Add text layer NEW YORK
    const textRes = await addTextTool.execute({
      content: 'NEW YORK',
      startTime: 2,
      endTime: 7,
      position: 'center',
    });
    const textId = textRes.textId;

    // 2. WOW Workflow 1: Animate NEW YORK
    // 2.0 sec: { x: 50, y: 50, scale: 1.4, opacity: 0 }
    const kf1Res = await addKeyframeTool.execute({
      targetType: 'text',
      targetId: textId,
      time: 2.0,
      properties: { x: 50, y: 50, scale: 1.4, opacity: 0 },
    });
    expect(kf1Res.success).toBe(true);
    expect(kf1Res.action).toBe('add_video_keyframe');
    expect(kf1Res.keyframeId).toBeTruthy();

    // 2.4 sec: { opacity: 1 }
    const kf2Res = await addKeyframeTool.execute({
      targetType: 'text',
      targetId: textId,
      time: 2.4,
      properties: { opacity: 1 },
    });
    expect(kf2Res.success).toBe(true);

    // 3.5 sec: { x: 50, y: 12, scale: 1 }
    const kf3Res = await addKeyframeTool.execute({
      targetType: 'text',
      targetId: textId,
      time: 3.5,
      properties: { x: 50, y: 12, scale: 1 },
    });
    expect(kf3Res.success).toBe(true);

    // 3. Inspect keyframes via get_video_keyframes
    const listRes = await getKeyframesTool.execute({ targetType: 'text', targetId: textId });
    expect(listRes.success).toBe(true);
    expect(listRes.keyframes).toHaveLength(3);
    expect(listRes.keyframes[0].targetContent).toBe('NEW YORK');
    expect(listRes.keyframes[0].properties.scale).toBe(1.4);
    expect(listRes.keyframes[0].properties.opacity).toBe(0);
    expect(listRes.keyframes[1].properties.opacity).toBe(1);
    expect(listRes.keyframes[2].properties.y).toBe(12);

    // 4. WOW Workflow 2: Video push-in
    // 2 sec: { x: 50, y: 50, scale: 1 }
    const vkf1Res = await addKeyframeTool.execute({
      targetType: 'video',
      time: 2,
      properties: { x: 50, y: 50, scale: 1 },
    });
    expect(vkf1Res.success).toBe(true);

    // 7 sec: { x: 52, y: 46, scale: 1.2 }
    const vkf2Res = await addKeyframeTool.execute({
      targetType: 'video',
      time: 7,
      properties: { x: 52, y: 46, scale: 1.2 },
    });
    expect(vkf2Res.success).toBe(true);

    // 5. Check get_video_state keyframesCount and animationSummary
    const stateRes = await getVideoStateTool.execute({});
    expect(stateRes.success).toBe(true);
    expect(stateRes.keyframesCount).toBe(5);
    expect(stateRes.animationSummary).toEqual([
      { target: 'video', keyframes: 2 },
      { target: 'NEW YORK', keyframes: 3 },
    ]);

    // 6. Safe partial update on vkf2 (only change scale)
    const updateRes = await updateKeyframeTool.execute({
      keyframeId: vkf2Res.keyframeId,
      properties: { scale: 1.5 },
    });
    expect(updateRes.success).toBe(true);
    expect(updateRes.keyframe.properties.scale).toBe(1.5);
    expect(updateRes.keyframe.properties.x).toBe(52); // preserved!
    expect(updateRes.keyframe.properties.y).toBe(46); // preserved!

    // 7. Undo the update
    await undoTool.execute({});
    let vkf2 = editorStore.getState().video.keyframes.find((k) => k.id === vkf2Res.keyframeId)!;
    expect(vkf2.properties.scale).toBe(1.2);

    // Redo the update
    await redoTool.execute({});
    vkf2 = editorStore.getState().video.keyframes.find((k) => k.id === vkf2Res.keyframeId)!;
    expect(vkf2.properties.scale).toBe(1.5);

    // 8. Remove a keyframe
    const removeRes = await removeKeyframeTool.execute({
      keyframeId: vkf2Res.keyframeId,
    });
    expect(removeRes.success).toBe(true);
    expect(editorStore.getState().video.keyframes).toHaveLength(4);

    // Undo removal
    await undoTool.execute({});
    expect(editorStore.getState().video.keyframes).toHaveLength(5);
  });
});
