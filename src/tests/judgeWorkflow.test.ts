import { describe, it, expect } from 'vitest';
import { getAgentCutToolDefinitions } from '../webmcp/registerTools';
import { editorStore } from '../store/editorStore';

describe('Hackathon Judge Workflow Tests', () => {
  const tools = getAgentCutToolDefinitions();
  const toolMap = new Map(tools.map((t) => [t.name, t]));

  it('executes exact Image Judge Workflow', async () => {
    // 1. Start demo image
    editorStore.loadImage({
      fileName: 'sample-image.jpg',
      width: 1920,
      height: 1080,
      objectUrl: '/demo/sample-image.jpg',
      isDemo: true,
    });

    // Verify initial
    expect(editorStore.getState().image.canvas.aspectRatio).toBe('original');

    // 2. Set aspect 4:5
    const setAspectTool = toolMap.get('set_image_aspect_ratio')!;
    const aspectRes = await setAspectTool.execute({ ratio: '4:5' });
    expect(aspectRes.success).toBe(true);
    expect(editorStore.getState().image.canvas.aspectRatio).toBe('4:5');

    // 3. Adjust brightness +10, contrast +8, saturation +12
    const adjustTool = toolMap.get('adjust_image')!;
    const adjRes = await adjustTool.execute({
      brightness: 10,
      contrast: 8,
      saturation: 12,
    });
    expect(adjRes.success).toBe(true);
    expect(editorStore.getState().image.adjustments.brightness).toBe(10);
    expect(editorStore.getState().image.adjustments.contrast).toBe(8);
    expect(editorStore.getState().image.adjustments.saturation).toBe(12);

    // 4. Add "Explore More" bottom-center 48px
    const addTextTool = toolMap.get('add_image_text')!;
    const textRes = await addTextTool.execute({
      content: 'Explore More',
      position: 'bottom-center',
      fontSize: 48,
    });
    expect(textRes.success).toBe(true);
    const createdTextId = textRes.textId;
    expect(createdTextId).toBeDefined();
    expect(editorStore.getState().image.textLayers).toHaveLength(1);
    expect(editorStore.getState().image.textLayers[0].content).toBe('Explore More');
    expect(editorStore.getState().image.textLayers[0].position).toBe('bottom-center');
    expect(editorStore.getState().image.textLayers[0].fontSize).toBe(48);

    // 5. Update text: move to top-left and make it 36px
    const updateTextTool = toolMap.get('update_image_text')!;
    const updateRes = await updateTextTool.execute({
      textId: createdTextId,
      position: 'top-left',
      fontSize: 36,
    });
    expect(updateRes.success).toBe(true);
    expect(editorStore.getState().image.textLayers[0].position).toBe('top-left');
    expect(editorStore.getState().image.textLayers[0].fontSize).toBe(36);

    // 6. Undo last edit
    const undoTool = toolMap.get('undo_image_edit')!;
    const undoRes = await undoTool.execute({});
    expect(undoRes.success).toBe(true);

    // Verify text layer returned to bottom-center and 48px!
    const restoredState = editorStore.getState().image;
    expect(restoredState.textLayers[0].position).toBe('bottom-center');
    expect(restoredState.textLayers[0].fontSize).toBe(48);

    // Verify previous edits remain intact
    expect(restoredState.canvas.aspectRatio).toBe('4:5');
    expect(restoredState.adjustments.brightness).toBe(10);
    expect(restoredState.adjustments.contrast).toBe(8);
    expect(restoredState.adjustments.saturation).toBe(12);
  });

  it('executes exact Video Judge Workflow', async () => {
    // 1. Start demo video (10s duration)
    editorStore.loadVideo({
      fileName: 'sample-video.mp4',
      duration: 10.0,
      width: 1280,
      height: 720,
      objectUrl: '/demo/sample-video.mp4',
      isDemo: true,
    });

    expect(editorStore.getState().video.aspectRatio).toBe('16:9');
    expect(editorStore.getState().video.trim).toEqual({ start: 0, end: 10 });
    expect(editorStore.getState().video.playbackRate).toBe(1);

    // 2. Remove first 2 seconds (trim: 2s -> 10s)
    const trimTool = toolMap.get('trim_video')!;
    const trimRes = await trimTool.execute({ startTime: 2, endTime: 10 });
    expect(trimRes.success).toBe(true);
    expect(editorStore.getState().video.trim).toEqual({ start: 2, end: 10 });

    // 3. Make this vertical for Reels: 9:16
    const aspectTool = toolMap.get('set_video_aspect_ratio')!;
    const aspectRes = await aspectTool.execute({ ratio: '9:16' });
    expect(aspectRes.success).toBe(true);
    expect(editorStore.getState().video.aspectRatio).toBe('9:16');

    // 4. Add "Built with WebMCP" at the bottom from 2 to 6 seconds
    const addTextTool = toolMap.get('add_video_text')!;
    const textRes = await addTextTool.execute({
      content: 'Built with WebMCP',
      startTime: 2,
      endTime: 6,
      position: 'bottom-center',
      fontSize: 42,
    });
    expect(textRes.success).toBe(true);
    expect(editorStore.getState().video.textLayers).toHaveLength(1);
    expect(editorStore.getState().video.textLayers[0].content).toBe('Built with WebMCP');
    expect(editorStore.getState().video.textLayers[0].startTime).toBe(2);
    expect(editorStore.getState().video.textLayers[0].endTime).toBe(6);

    // 5. Make the video 1.5x speed
    const speedTool = toolMap.get('set_video_speed')!;
    const speedRes = await speedTool.execute({ speed: 1.5 });
    expect(speedRes.success).toBe(true);
    expect(editorStore.getState().video.playbackRate).toBe(1.5);

    // 6. Agent inspects timeline and state
    const stateTool = toolMap.get('get_video_state')!;
    const stateRes = await stateTool.execute({});
    expect(stateRes.success).toBe(true);
    expect(stateRes.aspectRatio).toBe('9:16');
    expect(stateRes.playbackRate).toBe(1.5);
    expect(stateRes.trim).toEqual({ start: 2, end: 10 });
    expect(stateRes.textLayers).toHaveLength(1);

    // 7. Undo speed change
    const undoTool = toolMap.get('undo_video_edit')!;
    const undoRes = await undoTool.execute({});
    expect(undoRes.success).toBe(true);

    // Verify: speed returns to 1x, while trim, 9:16, and text remain!
    const finalVideo = editorStore.getState().video;
    expect(finalVideo.playbackRate).toBe(1);
    expect(finalVideo.trim).toEqual({ start: 2, end: 10 });
    expect(finalVideo.aspectRatio).toBe('9:16');
    expect(finalVideo.textLayers).toHaveLength(1);
    expect(finalVideo.textLayers[0].content).toBe('Built with WebMCP');
  });
});
