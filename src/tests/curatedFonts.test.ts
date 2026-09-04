import { describe, it, expect, beforeEach, vi } from 'vitest';
import { editorStore } from '../store/editorStore';
import { getAgentCutToolDefinitions } from '../webmcp/registerTools';
import { exportImageCanvas } from '../services/imageExport';
import { exportVideoComposition, renderCompositionFrame } from '../services/videoExport';
import { drawTextLayer } from '../utils/videoGeometry';
import { VideoProject, VideoTextLayer } from '../types/editor';

describe('Curated Fonts Support across Image, Video, Export, WebMCP, and History', () => {
  const tools = getAgentCutToolDefinitions();
  const toolMap = new Map(tools.map((t) => [t.name, t]));

  beforeEach(() => {
    // Reset store
    editorStore.loadImage({
      fileName: 'test.png',
      width: 1920,
      height: 1080,
      objectUrl: 'blob:test-img',
    });
    editorStore.loadVideo({
      fileName: 'test.mp4',
      duration: 10,
      width: 1280,
      height: 720,
      objectUrl: 'blob:test-video',
    });
  });

  // Requirement 1: image text defaults to Inter
  it('1. image text defaults to Inter', () => {
    const textId = editorStore.addImageText({
      content: 'Default Image Text',
    });
    const layer = editorStore.getState().image.textLayers.find((l) => l.id === textId);
    expect(layer).toBeDefined();
    expect(layer?.fontFamily).toBe('Inter');
  });

  // Requirement 2: video text defaults to Inter
  it('2. video text defaults to Inter', () => {
    const textId = editorStore.addVideoText({
      content: 'Default Video Text',
      startTime: 0,
      endTime: 5,
    });
    const layer = editorStore.getState().video.textLayers.find((l) => l.id === textId);
    expect(layer).toBeDefined();
    expect(layer?.fontFamily).toBe('Inter');
  });

  // Requirement 3: adding image text with Bebas Neue
  it('3. adding image text with Bebas Neue', async () => {
    const tool = toolMap.get('add_image_text')!;
    const res = await tool.execute({
      content: 'NEW YORK',
      fontFamily: 'Bebas Neue',
      fontSize: 64,
    });
    expect(res.success).toBe(true);
    expect(res.layer.fontFamily).toBe('Bebas Neue');

    const inStore = editorStore.getState().image.textLayers.find((l) => l.id === res.textId);
    expect(inStore?.fontFamily).toBe('Bebas Neue');
  });

  // Requirement 4: adding video text with Caveat
  it('4. adding video text with Caveat', async () => {
    const tool = toolMap.get('add_video_text')!;
    const res = await tool.execute({
      content: 'Explore More',
      startTime: 1,
      endTime: 4,
      fontFamily: 'Caveat',
      fontSize: 48,
    });
    expect(res.success).toBe(true);
    expect(res.layer.fontFamily).toBe('Caveat');

    const inStore = editorStore.getState().video.textLayers.find((l) => l.id === res.textId);
    expect(inStore?.fontFamily).toBe('Caveat');
  });

  // Requirement 5: changing only fontFamily preserves every other image text property
  it('5. changing only fontFamily preserves every other image text property', async () => {
    const textId = editorStore.addImageText({
      content: 'Preserve Image Props',
      position: 'top-left',
      fontSize: 52,
      color: '#FFCC00',
      opacity: 0.85,
    });

    const before = { ...editorStore.getState().image.textLayers.find((l) => l.id === textId)! };

    const updateTool = toolMap.get('update_image_text')!;
    const res = await updateTool.execute({
      textId,
      fontFamily: 'Playfair Display',
    });

    expect(res.success).toBe(true);
    const after = editorStore.getState().image.textLayers.find((l) => l.id === textId)!;

    // Only fontFamily changed
    expect(after.fontFamily).toBe('Playfair Display');
    expect(after.content).toBe(before.content);
    expect(after.position).toBe(before.position);
    expect(after.fontSize).toBe(before.fontSize);
    expect(after.color).toBe(before.color);
    expect(after.opacity).toBe(before.opacity);
    expect(after.x).toBe(before.x);
    expect(after.y).toBe(before.y);
    expect(after.alignment).toBe(before.alignment);
  });

  // Requirement 6: changing only fontFamily preserves every other video text property
  it('6. changing only fontFamily preserves every other video text property', async () => {
    const textId = editorStore.addVideoText({
      content: 'Preserve Video Props',
      startTime: 2,
      endTime: 8,
      position: 'top-right',
      fontSize: 38,
      opacity: 0.9,
    });

    const before = { ...editorStore.getState().video.textLayers.find((l) => l.id === textId)! };

    const updateTool = toolMap.get('update_video_text')!;
    const res = await updateTool.execute({
      textId,
      fontFamily: 'Pacifico',
    });

    expect(res.success).toBe(true);
    const after = editorStore.getState().video.textLayers.find((l) => l.id === textId)!;

    // Only fontFamily changed
    expect(after.fontFamily).toBe('Pacifico');
    expect(after.content).toBe(before.content);
    expect(after.startTime).toBe(before.startTime);
    expect(after.endTime).toBe(before.endTime);
    expect(after.position).toBe(before.position);
    expect(after.fontSize).toBe(before.fontSize);
    expect(after.opacity).toBe(before.opacity);
    expect(after.color).toBe(before.color);
    expect(after.x).toBe(before.x);
    expect(after.y).toBe(before.y);
  });

  // Requirement 7: get_image_state returns fontFamily
  it('7. get_image_state returns fontFamily', async () => {
    editorStore.addImageText({
      content: 'Headline',
      fontFamily: 'Bebas Neue',
    });
    editorStore.addImageText({
      content: 'Body',
      fontFamily: 'Montserrat',
    });

    const tool = toolMap.get('get_image_state')!;
    const res = await tool.execute({});
    expect(res.success).toBe(true);
    expect(res.textLayers).toHaveLength(2);
    expect(res.textLayers[0].fontFamily).toBe('Bebas Neue');
    expect(res.textLayers[1].fontFamily).toBe('Montserrat');
  });

  // Requirement 8: get_video_state returns fontFamily
  it('8. get_video_state returns fontFamily', async () => {
    editorStore.addVideoText({
      content: 'Intro',
      startTime: 0,
      endTime: 3,
      fontFamily: 'DM Serif Display',
    });
    editorStore.addVideoText({
      content: 'Outro',
      startTime: 4,
      endTime: 7,
      fontFamily: 'Caveat',
    });

    const tool = toolMap.get('get_video_state')!;
    const res = await tool.execute({});
    expect(res.success).toBe(true);
    expect(res.textLayers).toHaveLength(2);
    expect(res.textLayers[0].fontFamily).toBe('DM Serif Display');
    expect(res.textLayers[1].fontFamily).toBe('Caveat');
  });

  // Requirement 9: image export uses selected font
  it('9. image export uses selected font', async () => {
    const fontLoadSpy = vi.spyOn(document.fonts, 'load');

    editorStore.addImageText({
      content: 'Editorial Title',
      fontFamily: 'Playfair Display',
      fontSize: 50,
    });

    let assignedFont = '';
    const origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: any[]) {
      const ctx = (origGetContext as any).call(this, type, ...args);
      if (ctx) {
        Object.defineProperty(ctx, 'font', {
          set(val: string) {
            assignedFont = val;
          },
          get() {
            return assignedFont;
          },
          configurable: true,
        });
      }
      return ctx;
    };

    try {
      const exportRes = await exportImageCanvas(editorStore.getState().image, 'png', false);
      expect(exportRes.success).toBe(true);
      expect(fontLoadSpy).toHaveBeenCalledWith(expect.stringContaining('Playfair Display'));
      expect(assignedFont).toContain('Playfair Display');
    } finally {
      HTMLCanvasElement.prototype.getContext = origGetContext;
      fontLoadSpy.mockRestore();
    }
  });

  // Requirement 10: video export uses selected font
  it('10. video export uses selected font', async () => {
    const fontLoadSpy = vi.spyOn(document.fonts, 'load');

    const layer: VideoTextLayer = {
      id: 'video-text-font-test',
      content: 'Script Subtitle',
      startTime: 0,
      endTime: 5,
      position: 'center',
      x: 50,
      y: 50,
      fontSize: 40,
      fontWeight: 'bold',
      fontFamily: 'Caveat',
      opacity: 1,
      color: '#ffffff',
    };

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d')!;

    // Test drawTextLayer directly
    drawTextLayer(ctx, layer, 1080, 1080, { x: 50, y: 50, scale: 1, opacity: 1 });
    expect(ctx.font).toContain('Caveat');

    // Test renderCompositionFrame
    const videoElem = document.createElement('video');
    const project: VideoProject = {
      ...editorStore.getState().video,
      textLayers: [layer],
    };
    renderCompositionFrame(ctx, videoElem, project, 2.0, 1080, 1080);
    expect(ctx.font).toContain('Caveat');

    // Test exportVideoComposition preloads the font
    const exportRes = await exportVideoComposition(project, { triggerDownload: false });
    expect(exportRes.success).toBe(true);
    expect(fontLoadSpy).toHaveBeenCalledWith(expect.stringContaining('Caveat'));

    fontLoadSpy.mockRestore();
  });

  // Requirement 11: invalid WebMCP font rejected
  it('11. invalid WebMCP font rejected', async () => {
    const addImgTool = toolMap.get('add_image_text')!;
    const res1 = await addImgTool.execute({
      content: 'Bad Font',
      fontFamily: 'Comic Sans MS',
    });
    expect(res1.success).toBe(false);
    expect(res1.error).toContain('Invalid font "Comic Sans MS"');

    const textId = editorStore.addImageText({ content: 'Test' });
    const updateImgTool = toolMap.get('update_image_text')!;
    const res2 = await updateImgTool.execute({
      textId,
      fontFamily: 'Papyrus',
    });
    expect(res2.success).toBe(false);
    expect(res2.error).toContain('Invalid font "Papyrus"');

    const addVidTool = toolMap.get('add_video_text')!;
    const res3 = await addVidTool.execute({
      content: 'Bad Vid Font',
      startTime: 0,
      endTime: 2,
      fontFamily: 'Wingdings',
    });
    expect(res3.success).toBe(false);
    expect(res3.error).toContain('Invalid font "Wingdings"');

    const vidTextId = editorStore.addVideoText({ content: 'Test Vid', startTime: 0, endTime: 2 });
    const updateVidTool = toolMap.get('update_video_text')!;
    const res4 = await updateVidTool.execute({
      textId: vidTextId,
      fontFamily: 'Chalkboard',
    });
    expect(res4.success).toBe(false);
    expect(res4.error).toContain('Invalid font "Chalkboard"');
  });

  // Requirement 12: undo / redo font change
  it('12. undo / redo font change', async () => {
    // 1. Image undo/redo font change
    const imgTextId = editorStore.addImageText({
      content: 'Vintage Travel',
      fontFamily: 'Inter',
    });

    const updateImgTool = toolMap.get('update_image_text')!;
    await updateImgTool.execute({
      textId: imgTextId,
      fontFamily: 'Bebas Neue',
    });

    expect(editorStore.getState().image.textLayers.find((l) => l.id === imgTextId)?.fontFamily).toBe('Bebas Neue');

    // Undo restores Inter
    const undoImgTool = toolMap.get('undo_image_edit')!;
    await undoImgTool.execute({});
    expect(editorStore.getState().image.textLayers.find((l) => l.id === imgTextId)?.fontFamily).toBe('Inter');

    // Redo restores Bebas Neue
    const redoImgTool = toolMap.get('redo_image_edit')!;
    await redoImgTool.execute({});
    expect(editorStore.getState().image.textLayers.find((l) => l.id === imgTextId)?.fontFamily).toBe('Bebas Neue');

    // 2. Video undo/redo font change
    const vidTextId = editorStore.addVideoText({
      content: 'Sunset Drive',
      startTime: 0,
      endTime: 5,
      fontFamily: 'Inter',
    });

    const updateVidTool = toolMap.get('update_video_text')!;
    await updateVidTool.execute({
      textId: vidTextId,
      fontFamily: 'Caveat',
    });

    expect(editorStore.getState().video.textLayers.find((l) => l.id === vidTextId)?.fontFamily).toBe('Caveat');

    // Undo restores Inter
    const undoVidTool = toolMap.get('undo_video_edit')!;
    await undoVidTool.execute({});
    expect(editorStore.getState().video.textLayers.find((l) => l.id === vidTextId)?.fontFamily).toBe('Inter');

    // Redo restores Caveat
    const redoVidTool = toolMap.get('redo_video_edit')!;
    await redoVidTool.execute({});
    expect(editorStore.getState().video.textLayers.find((l) => l.id === vidTextId)?.fontFamily).toBe('Caveat');
  });

  // Requirement 13: total WebMCP tool count remains exactly 29
  it('13. total WebMCP tool count remains exactly 29', () => {
    expect(tools).toHaveLength(29);

    const toolNames = tools.map((t) => t.name);

    // Assert that no new font-specific tools were introduced
    expect(toolNames).not.toContain('set_font');
    expect(toolNames).not.toContain('change_font');
    expect(toolNames).not.toContain('font_tool');

    // Assert exact 29 known tools
    const expectedTools = [
      // Image (11)
      'get_image_state',
      'set_image_aspect_ratio',
      'rotate_image',
      'flip_image',
      'adjust_image',
      'add_image_text',
      'update_image_text',
      'remove_image_text',
      'undo_image_edit',
      'redo_image_edit',
      'export_image',
      // Video (18)
      'get_video_state',
      'get_timeline',
      'trim_video',
      'set_video_aspect_ratio',
      'set_video_speed',
      'set_video_volume',
      'add_video_text',
      'update_video_text',
      'remove_video_text',
      'add_video_keyframe',
      'update_video_keyframe',
      'remove_video_keyframe',
      'get_video_keyframes',
      'split_video',
      'delete_video_segment',
      'undo_video_edit',
      'redo_video_edit',
      'export_video',
    ];

    expect(toolNames.sort()).toEqual(expectedTools.sort());
  });
});
