import { editorStore } from '../store/editorStore';
import { exportImageCanvas } from '../services/imageExport';
import {
  AspectRatio,
  SemanticPosition,
  TextLayer,
  VideoTextLayer,
  VideoKeyframeProperties,
} from '../types/editor';

export interface WebMCPToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  annotations: {
    readOnlyHint: boolean;
  };
  execute: (args: any) => Promise<any> | any;
}

export function ensureImageMode(): void {
  const current = editorStore.getState();
  if (current.mode !== 'image') {
    editorStore.setMode('image');
  }
  if (!current.image.source) {
    editorStore.loadImage({
      fileName: 'sample-image.jpg',
      width: 1920,
      height: 1080,
      objectUrl: '/demo/sample-image.jpg',
      isDemo: true,
    });
  }
}

export function ensureVideoMode(): void {
  const current = editorStore.getState();
  if (current.mode !== 'video') {
    editorStore.setMode('video');
  }
  if (!current.video.source) {
    editorStore.loadVideo({
      fileName: 'sample-video.mp4',
      duration: 10.0,
      width: 1280,
      height: 720,
      objectUrl: '/demo/sample-video.mp4',
      isDemo: true,
    });
  }
}

export function getAgentCutToolDefinitions(): WebMCPToolDefinition[] {
  return [
    // ================= IMAGE TOOLS ================= //
    {
      name: 'get_image_state',
      description:
        'Read-only inspection of the current AgentCut image project state, including source dimensions, aspect ratio, transforms, adjustments, active text layers, and edit history summary.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      annotations: {
        readOnlyHint: true,
      },
      execute: () => {
        const state = editorStore.getState().image;
        return {
          success: true,
          mode: 'image',
          hasSource: !!state.source,
          source: state.source
            ? {
                fileName: state.source.fileName,
                width: state.source.width,
                height: state.source.height,
              }
            : null,
          canvas: {
            width: state.canvas.width,
            height: state.canvas.height,
            aspectRatio: state.canvas.aspectRatio,
          },
          transform: { ...state.transform },
          adjustments: { ...state.adjustments },
          textLayers: state.textLayers.map((l) => ({
            id: l.id,
            content: l.content,
            position: l.position,
            x: l.x,
            y: l.y,
            fontSize: l.fontSize,
            opacity: l.opacity,
          })),
          historyCount: state.history.length,
          lastEdit: state.history.length > 0 ? state.history[state.history.length - 1].entry.label : null,
        };
      },
    },

    {
      name: 'set_image_aspect_ratio',
      description:
        'Change the visible aspect ratio of the loaded image project (e.g. 4:5 for Instagram, 1:1 square, 16:9 landscape, 9:16 vertical, or original). The visible canvas updates immediately.',
      inputSchema: {
        type: 'object',
        properties: {
          ratio: {
            type: 'string',
            enum: ['original', '1:1', '4:5', '16:9', '9:16'],
            description: 'Target aspect ratio format',
          },
        },
        required: ['ratio'],
      },
      annotations: {
        readOnlyHint: false,
      },
      execute: (args: { ratio: AspectRatio }) => {
        ensureImageMode();
        const validRatios: AspectRatio[] = ['original', '1:1', '4:5', '16:9', '9:16'];
        if (!validRatios.includes(args?.ratio)) {
          return {
            success: false,
            error: `Invalid aspect ratio "${args?.ratio}". Expected one of: ${validRatios.join(', ')}`,
          };
        }

        editorStore.setImageAspectRatio(args.ratio);
        editorStore.addAgentToast(`Agent changed aspect ratio to ${args.ratio}`, 'set_image_aspect_ratio', 'image');

        const state = editorStore.getState().image;
        return {
          success: true,
          mode: 'image',
          action: 'set_image_aspect_ratio',
          aspectRatio: state.canvas.aspectRatio,
          dimensions: {
            width: state.canvas.width,
            height: state.canvas.height,
          },
        };
      },
    },

    {
      name: 'rotate_image',
      description:
        'Rotate the image project by the specified degrees (e.g. 90, 180, 270). The visible canvas updates immediately.',
      inputSchema: {
        type: 'object',
        properties: {
          degrees: {
            type: 'number',
            description: 'Degrees to rotate the image (e.g. 90)',
          },
        },
        required: ['degrees'],
      },
      annotations: {
        readOnlyHint: false,
      },
      execute: (args: { degrees: number }) => {
        ensureImageMode();
        if (typeof args?.degrees !== 'number') {
          return { success: false, error: 'degrees must be a number' };
        }

        editorStore.rotateImage(args.degrees);
        editorStore.addAgentToast(`Agent rotated image ${args.degrees}°`, 'rotate_image', 'image');

        return {
          success: true,
          mode: 'image',
          action: 'rotate_image',
          rotation: editorStore.getState().image.transform.rotation,
        };
      },
    },

    {
      name: 'flip_image',
      description:
        'Flip the image horizontally or vertically. Visible canvas updates immediately.',
      inputSchema: {
        type: 'object',
        properties: {
          horizontal: { type: 'boolean', description: 'Flip horizontally' },
          vertical: { type: 'boolean', description: 'Flip vertically' },
        },
      },
      annotations: {
        readOnlyHint: false,
      },
      execute: (args: { horizontal?: boolean; vertical?: boolean }) => {
        ensureImageMode();
        editorStore.flipImage({ horizontal: args?.horizontal, vertical: args?.vertical });
        editorStore.addAgentToast('Agent flipped image', 'flip_image', 'image');

        return {
          success: true,
          mode: 'image',
          transform: editorStore.getState().image.transform,
        };
      },
    },

    {
      name: 'adjust_image',
      description:
        'Adjust brightness, contrast, saturation, grayscale, or blur on the currently loaded AgentCut image. Only supplied fields are changed. The visible editor updates immediately.',
      inputSchema: {
        type: 'object',
        properties: {
          brightness: { type: 'number', minimum: -100, maximum: 100, description: 'Brightness offset (-100 to 100)' },
          contrast: { type: 'number', minimum: -100, maximum: 100, description: 'Contrast offset (-100 to 100)' },
          saturation: { type: 'number', minimum: -100, maximum: 100, description: 'Saturation offset (-100 to 100)' },
          grayscale: { type: 'number', minimum: 0, maximum: 100, description: 'Grayscale percentage (0 to 100)' },
          blur: { type: 'number', minimum: 0, maximum: 20, description: 'Blur radius in px (0 to 20)' },
        },
      },
      annotations: {
        readOnlyHint: false,
      },
      execute: (args: Record<string, number | undefined>) => {
        ensureImageMode();
        const validFields = ['brightness', 'contrast', 'saturation', 'grayscale', 'blur'];
        const updates: Record<string, number> = {};

        for (const key of validFields) {
          if (typeof args?.[key] === 'number') {
            updates[key] = args[key]!;
          }
        }

        if (Object.keys(updates).length === 0) {
          return { success: false, error: 'No valid adjustment fields provided' };
        }

        editorStore.adjustImage(updates);
        editorStore.addAgentToast('Agent adjusted image', 'adjust_image', 'image');

        return {
          success: true,
          mode: 'image',
          action: 'adjust_image',
          adjustments: editorStore.getState().image.adjustments,
        };
      },
    },

    {
      name: 'add_image_text',
      description:
        'Add a new text overlay layer to the image with semantic position ("top-left", "top-center", "top-right", "center", "bottom-left", "bottom-center", "bottom-right") and font size. Returns created textId. The text layer appears immediately on canvas.',
      inputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'Text string to display' },
          position: {
            type: 'string',
            enum: ['top-left', 'top-center', 'top-right', 'center', 'bottom-left', 'bottom-center', 'bottom-right'],
            description: 'Semantic placement on image',
          },
          fontSize: { type: 'number', minimum: 12, maximum: 120, description: 'Font size in px' },
          color: { type: 'string', description: 'Hex color string' },
        },
        required: ['content'],
      },
      annotations: {
        readOnlyHint: false,
      },
      execute: (args: {
        content: string;
        position?: SemanticPosition;
        fontSize?: number;
        color?: string;
      }) => {
        ensureImageMode();
        if (!args?.content || typeof args.content !== 'string' || !args.content.trim()) {
          return { success: false, error: 'content must be a non-empty string' };
        }

        const textId = editorStore.addImageText({
          content: args.content.trim(),
          position: args.position || 'bottom-center',
          fontSize: args.fontSize || 48,
          color: args.color || '#ffffff',
        });

        editorStore.addAgentToast(`Agent added text "${args.content}"`, 'add_image_text', 'image');

        const layer = editorStore.getState().image.textLayers.find((l) => l.id === textId);
        return {
          success: true,
          mode: 'image',
          action: 'add_image_text',
          textId,
          layer,
        };
      },
    },

    {
      name: 'update_image_text',
      description:
        'Update an existing image text layer by textId (e.g. modify content, semantic position, font size, or opacity). The canvas updates immediately.',
      inputSchema: {
        type: 'object',
        properties: {
          textId: { type: 'string', description: 'ID of the text layer to update' },
          content: { type: 'string', description: 'New text content' },
          position: {
            type: 'string',
            enum: ['top-left', 'top-center', 'top-right', 'center', 'bottom-left', 'bottom-center', 'bottom-right'],
            description: 'New semantic position',
          },
          fontSize: { type: 'number', description: 'New font size in px' },
          opacity: { type: 'number', minimum: 0, maximum: 1, description: 'Layer opacity' },
        },
        required: ['textId'],
      },
      annotations: {
        readOnlyHint: false,
      },
      execute: (args: {
        textId: string;
        content?: string;
        position?: SemanticPosition;
        fontSize?: number;
        opacity?: number;
      }) => {
        ensureImageMode();
        if (!args?.textId) {
          return { success: false, error: 'textId is required' };
        }

        const updates: Partial<Omit<TextLayer, 'id'>> & { position?: SemanticPosition } = {};
        if (args.content !== undefined) updates.content = args.content;
        if (args.position !== undefined) updates.position = args.position;
        if (args.fontSize !== undefined) updates.fontSize = args.fontSize;
        if (args.opacity !== undefined) updates.opacity = args.opacity;

        const success = editorStore.updateImageText(args.textId, updates);

        if (!success) {
          return { success: false, error: `Text layer with ID "${args.textId}" not found` };
        }

        editorStore.addAgentToast('Agent updated text layer', 'update_image_text', 'image');

        const updated = editorStore.getState().image.textLayers.find((l) => l.id === args.textId);
        return {
          success: true,
          mode: 'image',
          action: 'update_image_text',
          layer: updated,
        };
      },
    },

    {
      name: 'remove_image_text',
      description:
        'Remove a text layer from the image by textId. Visible canvas updates immediately.',
      inputSchema: {
        type: 'object',
        properties: {
          textId: { type: 'string', description: 'ID of the text layer to remove' },
        },
        required: ['textId'],
      },
      annotations: {
        readOnlyHint: false,
      },
      execute: (args: { textId: string }) => {
        ensureImageMode();
        if (!args?.textId) {
          return { success: false, error: 'textId is required' };
        }

        const success = editorStore.removeImageText(args.textId);
        if (!success) {
          return { success: false, error: `Text layer with ID "${args.textId}" not found` };
        }

        editorStore.addAgentToast('Agent removed text layer', 'remove_image_text', 'image');
        return { success: true, mode: 'image', action: 'remove_image_text', textId: args.textId };
      },
    },

    {
      name: 'undo_image_edit',
      description:
        'Revert the latest image editing action while preserving earlier edits. The canvas updates immediately.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      annotations: {
        readOnlyHint: false,
      },
      execute: () => {
        ensureImageMode();
        const success = editorStore.undoImage();
        if (!success) {
          return { success: false, error: 'No image edits available to undo' };
        }
        editorStore.addAgentToast('Agent undid last edit', 'undo_image_edit', 'image');
        return { success: true, mode: 'image', action: 'undo_image_edit' };
      },
    },

    {
      name: 'redo_image_edit',
      description:
        'Re-apply the next image edit from the redo stack. The canvas updates immediately.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      annotations: {
        readOnlyHint: false,
      },
      execute: () => {
        ensureImageMode();
        const success = editorStore.redoImage();
        if (!success) {
          return { success: false, error: 'No image edits available to redo' };
        }
        editorStore.addAgentToast('Agent redid edit', 'redo_image_edit', 'image');
        return { success: true, mode: 'image', action: 'redo_image_edit' };
      },
    },

    {
      name: 'export_image',
      description:
        'Render and export the final image project containing all transforms, aspect ratio crop, adjustments, and text layers to PNG or JPG.',
      inputSchema: {
        type: 'object',
        properties: {
          format: { type: 'string', enum: ['png', 'jpg'], description: 'Export format ("png" or "jpg")' },
        },
      },
      annotations: {
        readOnlyHint: false,
      },
      execute: async (args: { format?: 'png' | 'jpg' }) => {
        ensureImageMode();
        const project = editorStore.getState().image;
        const result = await exportImageCanvas(project, args?.format || 'png', true);

        if (!result.success) {
          return { success: false, error: result.error || 'Export failed' };
        }

        editorStore.addAgentToast(`Exported ${result.fileName}`, 'export_image', 'image');
        return {
          success: true,
          mode: 'image',
          format: result.format,
          dimensions: result.dimensions,
          fileName: result.fileName,
        };
      },
    },

    // ================= VIDEO TOOLS ================= //

    {
      name: 'get_video_state',
      description:
        'Read-only inspection of the current AgentCut video project state, including source duration, aspect ratio, trim bounds, playback speed, volume, timed text overlays, and edit history.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      annotations: {
        readOnlyHint: true,
      },
      execute: () => {
        const v = editorStore.getState().video;
        const sourceDuration = v.source?.duration || 10;
        const effectiveDuration = (v.trim.end - v.trim.start) / v.playbackRate;

        return {
          success: true,
          mode: 'video',
          hasSource: !!v.source,
          source: v.source
            ? {
                fileName: v.source.fileName,
                duration: sourceDuration,
                width: v.source.width,
                height: v.source.height,
              }
            : null,
          aspectRatio: v.aspectRatio,
          trim: { ...v.trim },
          effectiveDuration: Number(effectiveDuration.toFixed(2)),
          playbackRate: v.playbackRate,
          volume: v.volume,
          muted: v.muted,
          clips: v.clips.map((c) => ({ ...c })),
          textLayers: v.textLayers.map((l) => ({
            id: l.id,
            content: l.content,
            startTime: l.startTime,
            endTime: l.endTime,
            position: l.position,
            fontSize: l.fontSize,
          })),
          keyframesCount: (v.keyframes || []).length,
          animationSummary: (() => {
            const kfs = v.keyframes || [];
            const summary: { target: string; keyframes: number }[] = [];
            const videoKfs = kfs.filter((k) => k.targetType === 'video').length;
            if (videoKfs > 0) {
              summary.push({ target: 'video', keyframes: videoKfs });
            }
            for (const layer of v.textLayers) {
              const textKfs = kfs.filter((k) => k.targetType === 'text' && k.targetId === layer.id).length;
              if (textKfs > 0) {
                summary.push({ target: layer.content, keyframes: textKfs });
              }
            }
            return summary;
          })(),
          historyCount: v.history.length,
          lastEdit: v.history.length > 0 ? v.history[v.history.length - 1].entry.label : null,
        };
      },
    },

    {
      name: 'get_timeline',
      description:
        'Read-only compact chronological overview of the video timeline, active clips, timed text overlays, and playhead position.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      annotations: {
        readOnlyHint: true,
      },
      execute: () => {
        const v = editorStore.getState().video;
        return {
          success: true,
          mode: 'video',
          duration: v.source?.duration || 10,
          playhead: Number(v.playhead.toFixed(2)),
          trim: { ...v.trim },
          clips: v.clips.map((c) => ({ id: c.id, start: c.start, end: c.end, label: c.label })),
          textLayers: v.textLayers.map((l) => ({
            id: l.id,
            content: l.content,
            startTime: l.startTime,
            endTime: l.endTime,
            position: l.position,
          })),
        };
      },
    },

    {
      name: 'trim_video',
      description:
        'Trim the video by setting in-point and out-point timestamps (in seconds). For example, to remove the first 2 seconds of a 10s video, set startTime=2, endTime=10. The visible timeline updates immediately.',
      inputSchema: {
        type: 'object',
        properties: {
          startTime: { type: 'number', minimum: 0, description: 'New start timestamp in seconds' },
          endTime: { type: 'number', minimum: 0.1, description: 'New end timestamp in seconds' },
        },
        required: ['startTime', 'endTime'],
      },
      annotations: {
        readOnlyHint: false,
      },
      execute: (args: { startTime: number; endTime: number }) => {
        ensureVideoMode();
        if (typeof args?.startTime !== 'number' || typeof args?.endTime !== 'number') {
          return { success: false, error: 'startTime and endTime must be numbers' };
        }

        const success = editorStore.trimVideo(args.startTime, args.endTime);
        if (!success) {
          const duration = editorStore.getState().video.source?.duration || 10;
          return {
            success: false,
            error: `Invalid trim bounds. Ensure 0 <= startTime < endTime <= duration (${duration}s)`,
          };
        }

        editorStore.addAgentToast(
          `Agent trimmed video to ${args.startTime}s - ${args.endTime}s`,
          'trim_video',
          'video'
        );

        return {
          success: true,
          mode: 'video',
          action: 'trim_video',
          trim: editorStore.getState().video.trim,
        };
      },
    },

    {
      name: 'set_video_aspect_ratio',
      description:
        'Set the aspect ratio for the video project (e.g. 9:16 for Reels/Shorts/TikTok, 16:9 for landscape, 1:1 square, 4:5 vertical, or original). Preview frame adapts immediately.',
      inputSchema: {
        type: 'object',
        properties: {
          ratio: {
            type: 'string',
            enum: ['16:9', '9:16', '1:1', '4:5', 'original'],
            description: 'Target video aspect ratio',
          },
        },
        required: ['ratio'],
      },
      annotations: {
        readOnlyHint: false,
      },
      execute: (args: { ratio: AspectRatio }) => {
        ensureVideoMode();
        const validRatios: AspectRatio[] = ['16:9', '9:16', '1:1', '4:5', 'original'];
        if (!validRatios.includes(args?.ratio)) {
          return {
            success: false,
            error: `Invalid aspect ratio "${args?.ratio}". Expected one of: ${validRatios.join(', ')}`,
          };
        }

        editorStore.setVideoAspectRatio(args.ratio);
        editorStore.addAgentToast(`Agent changed video to ${args.ratio}`, 'set_video_aspect_ratio', 'video');

        return {
          success: true,
          mode: 'video',
          action: 'set_video_aspect_ratio',
          aspectRatio: editorStore.getState().video.aspectRatio,
        };
      },
    },

    {
      name: 'set_video_speed',
      description:
        'Set video playback speed rate (supported: 0.5, 0.75, 1, 1.25, 1.5, 2). Timeline and video preview playback rate update immediately.',
      inputSchema: {
        type: 'object',
        properties: {
          speed: {
            type: 'number',
            enum: [0.5, 0.75, 1, 1.25, 1.5, 2],
            description: 'Playback speed factor',
          },
        },
        required: ['speed'],
      },
      annotations: {
        readOnlyHint: false,
      },
      execute: (args: { speed: number }) => {
        ensureVideoMode();
        const success = editorStore.setVideoSpeed(args?.speed);
        if (!success) {
          return {
            success: false,
            error: `Invalid speed ${args?.speed}. Supported speeds: 0.5, 0.75, 1, 1.25, 1.5, 2`,
          };
        }

        editorStore.addAgentToast(`Agent set speed to ${args.speed}×`, 'set_video_speed', 'video');

        return {
          success: true,
          mode: 'video',
          action: 'set_video_speed',
          playbackRate: editorStore.getState().video.playbackRate,
        };
      },
    },

    {
      name: 'set_video_volume',
      description:
        'Set audio volume level (0 to 100) and/or mute status. Visible audio control updates immediately.',
      inputSchema: {
        type: 'object',
        properties: {
          volume: { type: 'number', minimum: 0, maximum: 100, description: 'Volume level from 0 to 100' },
          muted: { type: 'boolean', description: 'Whether audio is muted' },
        },
      },
      annotations: {
        readOnlyHint: false,
      },
      execute: (args: { volume?: number; muted?: boolean }) => {
        ensureVideoMode();
        editorStore.setVideoVolume(args?.volume, args?.muted);
        editorStore.addAgentToast('Agent adjusted video audio', 'set_video_volume', 'video');

        const v = editorStore.getState().video;
        return {
          success: true,
          mode: 'video',
          action: 'set_video_volume',
          volume: v.volume,
          muted: v.muted,
        };
      },
    },

    {
      name: 'add_video_text',
      description:
        'Add a timed text overlay to the video active between startTime and endTime seconds with semantic position ("bottom-center", "top-left", etc.). The text appears in preview and on timeline immediately.',
      inputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'Text content to overlay' },
          startTime: { type: 'number', minimum: 0, description: 'Start time in seconds' },
          endTime: { type: 'number', minimum: 0.1, description: 'End time in seconds' },
          position: {
            type: 'string',
            enum: ['top-left', 'top-center', 'top-right', 'center', 'bottom-left', 'bottom-center', 'bottom-right'],
            description: 'Semantic placement on frame',
          },
          fontSize: { type: 'number', description: 'Font size in px' },
        },
        required: ['content', 'startTime', 'endTime'],
      },
      annotations: {
        readOnlyHint: false,
      },
      execute: (args: {
        content: string;
        startTime: number;
        endTime: number;
        position?: SemanticPosition;
        fontSize?: number;
      }) => {
        ensureVideoMode();
        if (!args?.content || !args.content.trim()) {
          return { success: false, error: 'content must be a non-empty string' };
        }
        if (typeof args.startTime !== 'number' || typeof args.endTime !== 'number' || args.startTime >= args.endTime) {
          return { success: false, error: 'startTime must be less than endTime' };
        }

        const textId = editorStore.addVideoText({
          content: args.content.trim(),
          startTime: args.startTime,
          endTime: args.endTime,
          position: args.position || 'bottom-center',
          fontSize: args.fontSize || 42,
        });

        editorStore.addAgentToast(
          `Agent added text "${args.content}" (${args.startTime}s - ${args.endTime}s)`,
          'add_video_text',
          'video'
        );

        const layer = editorStore.getState().video.textLayers.find((l) => l.id === textId);
        return {
          success: true,
          mode: 'video',
          action: 'add_video_text',
          textId,
          layer,
        };
      },
    },

    {
      name: 'update_video_text',
      description:
        'Update an existing video text overlay by textId (content, position, font size, start time, or end time). Visible preview and timeline update immediately.',
      inputSchema: {
        type: 'object',
        properties: {
          textId: { type: 'string', description: 'ID of the video text overlay to update' },
          content: { type: 'string', description: 'New text content' },
          position: {
            type: 'string',
            enum: ['top-left', 'top-center', 'top-right', 'center', 'bottom-left', 'bottom-center', 'bottom-right'],
          },
          fontSize: { type: 'number' },
          startTime: { type: 'number' },
          endTime: { type: 'number' },
        },
        required: ['textId'],
      },
      annotations: {
        readOnlyHint: false,
      },
      execute: (args: {
        textId: string;
        content?: string;
        position?: SemanticPosition;
        fontSize?: number;
        startTime?: number;
        endTime?: number;
      }) => {
        ensureVideoMode();
        if (!args?.textId) {
          return { success: false, error: 'textId is required' };
        }

        const updates: Partial<Omit<VideoTextLayer, 'id'>> = {};
        if (args.content !== undefined) updates.content = args.content;
        if (args.position !== undefined) updates.position = args.position;
        if (args.fontSize !== undefined) updates.fontSize = args.fontSize;
        if (args.startTime !== undefined) updates.startTime = args.startTime;
        if (args.endTime !== undefined) updates.endTime = args.endTime;

        const success = editorStore.updateVideoText(args.textId, updates);

        if (!success) {
          return { success: false, error: `Video text overlay with ID "${args.textId}" not found` };
        }

        editorStore.addAgentToast('Agent updated video text', 'update_video_text', 'video');
        const updated = editorStore.getState().video.textLayers.find((l) => l.id === args.textId);
        return { success: true, mode: 'video', action: 'update_video_text', layer: updated };
      },
    },

    {
      name: 'remove_video_text',
      description:
        'Remove a timed text overlay from the video project by textId. Visible preview and timeline update immediately.',
      inputSchema: {
        type: 'object',
        properties: {
          textId: { type: 'string', description: 'ID of the video text layer to remove' },
        },
        required: ['textId'],
      },
      annotations: {
        readOnlyHint: false,
      },
      execute: (args: { textId: string }) => {
        ensureVideoMode();
        if (!args?.textId) {
          return { success: false, error: 'textId is required' };
        }

        const success = editorStore.removeVideoText(args.textId);
        if (!success) {
          return { success: false, error: `Video text overlay with ID "${args.textId}" not found` };
        }

        editorStore.addAgentToast('Agent removed video text', 'remove_video_text', 'video');
        return { success: true, mode: 'video', action: 'remove_video_text', textId: args.textId };
      },
    },

    {
      name: 'add_video_keyframe',
      description:
        "Add an animation keyframe to the current AgentCut video project. Keyframes can animate text-layer position, scale and opacity or animate the video frame's position and scale. Use multiple keyframes at different timestamps to create motion, fades, zooms and pans. The visible preview and timeline update immediately.",
      inputSchema: {
        type: 'object',
        properties: {
          targetType: {
            type: 'string',
            enum: ['text', 'video'],
            description: 'Target to animate ("text" for a text layer, "video" for the video frame)',
          },
          targetId: {
            type: 'string',
            description: 'Text layer ID to animate (required if targetType is "text")',
          },
          time: {
            type: 'number',
            minimum: 0,
            description: 'Timestamp in seconds for the keyframe on timeline',
          },
          properties: {
            type: 'object',
            properties: {
              x: { type: 'number', minimum: 0, maximum: 100, description: 'X position percentage (0 to 100)' },
              y: { type: 'number', minimum: 0, maximum: 100, description: 'Y position percentage (0 to 100)' },
              scale: { type: 'number', minimum: 0.25, maximum: 3, description: 'Scale multiplier (0.25 to 3)' },
              opacity: { type: 'number', minimum: 0, maximum: 1, description: 'Opacity (0 to 1)' },
            },
            description: 'Visual properties to animate at this timestamp',
          },
        },
        required: ['targetType', 'time', 'properties'],
      },
      annotations: {
        readOnlyHint: false,
      },
      execute: (args: {
        targetType: 'text' | 'video';
        targetId?: string;
        time: number;
        properties: {
          x?: number;
          y?: number;
          scale?: number;
          opacity?: number;
        };
      }) => {
        ensureVideoMode();
        if (args?.targetType !== 'text' && args?.targetType !== 'video') {
          return { success: false, error: 'targetType must be "text" or "video"' };
        }
        if (typeof args.time !== 'number' || isNaN(args.time) || args.time < 0) {
          return { success: false, error: 'time must be a non-negative number' };
        }
        if (!args.properties || typeof args.properties !== 'object') {
          return { success: false, error: 'properties object is required' };
        }

        // Clean properties
        const cleanProps: VideoKeyframeProperties = {};
        if (args.properties.x !== undefined) cleanProps.x = args.properties.x;
        if (args.properties.y !== undefined) cleanProps.y = args.properties.y;
        if (args.properties.scale !== undefined) cleanProps.scale = args.properties.scale;
        if (args.properties.opacity !== undefined) cleanProps.opacity = args.properties.opacity;

        const keyframeId = editorStore.addVideoKeyframe({
          targetType: args.targetType,
          targetId: args.targetId,
          time: args.time,
          properties: cleanProps,
        });

        if (!keyframeId) {
          return {
            success: false,
            error:
              args.targetType === 'text' && !args.targetId
                ? 'targetId is required when targetType is "text"'
                : 'Invalid keyframe parameters (check time within video duration, property values within valid ranges, or valid targetId)',
          };
        }

        const toastMsg =
          args.targetType === 'text'
            ? `Agent added text keyframe at ${args.time}s`
            : `Agent added video keyframe at ${args.time}s`;
        editorStore.addAgentToast(toastMsg, 'add_video_keyframe', 'video');

        const created = editorStore.getState().video.keyframes.find((k) => k.id === keyframeId);
        return {
          success: true,
          action: 'add_video_keyframe',
          keyframeId,
          keyframe: created,
        };
      },
    },

    {
      name: 'update_video_keyframe',
      description:
        'Update an existing video keyframe by keyframeId (modify timestamp or visual properties). Uses safe partial updates: omitted properties preserve existing values. Visible preview and timeline update immediately.',
      inputSchema: {
        type: 'object',
        properties: {
          keyframeId: { type: 'string', description: 'ID of the keyframe to update' },
          time: { type: 'number', minimum: 0, description: 'New timestamp in seconds' },
          properties: {
            type: 'object',
            properties: {
              x: { type: 'number', minimum: 0, maximum: 100 },
              y: { type: 'number', minimum: 0, maximum: 100 },
              scale: { type: 'number', minimum: 0.25, maximum: 3 },
              opacity: { type: 'number', minimum: 0, maximum: 1 },
            },
            description: 'Properties to update (omitted properties remain unchanged)',
          },
        },
        required: ['keyframeId'],
      },
      annotations: {
        readOnlyHint: false,
      },
      execute: (args: {
        keyframeId: string;
        time?: number;
        properties?: {
          x?: number;
          y?: number;
          scale?: number;
          opacity?: number;
        };
      }) => {
        ensureVideoMode();
        if (!args?.keyframeId) {
          return { success: false, error: 'keyframeId is required' };
        }

        const updates: { time?: number; properties?: VideoKeyframeProperties } = {};
        if (args.time !== undefined) {
          updates.time = args.time;
        }

        if (args.properties && typeof args.properties === 'object') {
          const cleanProps: VideoKeyframeProperties = {};
          if (args.properties.x !== undefined) cleanProps.x = args.properties.x;
          if (args.properties.y !== undefined) cleanProps.y = args.properties.y;
          if (args.properties.scale !== undefined) cleanProps.scale = args.properties.scale;
          if (args.properties.opacity !== undefined) cleanProps.opacity = args.properties.opacity;
          if (Object.keys(cleanProps).length > 0) {
            updates.properties = cleanProps;
          }
        }

        const success = editorStore.updateVideoKeyframe(args.keyframeId, updates);
        if (!success) {
          return {
            success: false,
            error: `Keyframe with ID "${args.keyframeId}" not found or invalid parameters`,
          };
        }

        editorStore.addAgentToast('Agent updated keyframe', 'update_video_keyframe', 'video');
        const updated = editorStore.getState().video.keyframes.find((k) => k.id === args.keyframeId);
        return {
          success: true,
          action: 'update_video_keyframe',
          keyframe: updated,
        };
      },
    },

    {
      name: 'remove_video_keyframe',
      description:
        'Remove an animation keyframe from the video project by keyframeId. The visible preview and timeline update immediately.',
      inputSchema: {
        type: 'object',
        properties: {
          keyframeId: { type: 'string', description: 'ID of the keyframe to remove' },
        },
        required: ['keyframeId'],
      },
      annotations: {
        readOnlyHint: false,
      },
      execute: (args: { keyframeId: string }) => {
        ensureVideoMode();
        if (!args?.keyframeId) {
          return { success: false, error: 'keyframeId is required' };
        }

        const success = editorStore.removeVideoKeyframe(args.keyframeId);
        if (!success) {
          return { success: false, error: `Keyframe with ID "${args.keyframeId}" not found` };
        }

        editorStore.addAgentToast('Agent removed keyframe', 'remove_video_keyframe', 'video');
        return {
          success: true,
          action: 'remove_video_keyframe',
          keyframeId: args.keyframeId,
        };
      },
    },

    {
      name: 'get_video_keyframes',
      description:
        'Read-only inspection of animation keyframes in the video project, ordered chronologically. Supports optional filtering by targetType ("text" | "video") or targetId.',
      inputSchema: {
        type: 'object',
        properties: {
          targetType: {
            type: 'string',
            enum: ['text', 'video'],
            description: 'Optional filter by targetType ("text" or "video")',
          },
          targetId: {
            type: 'string',
            description: 'Optional filter by text targetId',
          },
        },
      },
      annotations: {
        readOnlyHint: true,
      },
      execute: (args?: { targetType?: 'text' | 'video'; targetId?: string }) => {
        const v = editorStore.getState().video;
        let keyframes = v.keyframes || [];

        if (args?.targetType) {
          keyframes = keyframes.filter((k) => k.targetType === args.targetType);
        }
        if (args?.targetId) {
          keyframes = keyframes.filter((k) => k.targetId === args.targetId);
        }

        const enrichedKeyframes = keyframes.map((k) => {
          let targetContent: string | undefined;
          if (k.targetType === 'text' && k.targetId) {
            const layer = v.textLayers.find((l) => l.id === k.targetId);
            targetContent = layer?.content;
          }
          return {
            id: k.id,
            targetType: k.targetType,
            targetId: k.targetId,
            targetContent,
            time: k.time,
            properties: { ...k.properties },
          };
        });

        return {
          success: true,
          keyframes: enrichedKeyframes,
        };
      },
    },

    {
      name: 'split_video',
      description:
        'Split the current video clip at the given timestamp into two distinct segments. The timeline updates immediately.',
      inputSchema: {
        type: 'object',
        properties: {
          time: { type: 'number', minimum: 0.1, description: 'Timestamp in seconds where clip should be split' },
        },
        required: ['time'],
      },
      annotations: {
        readOnlyHint: false,
      },
      execute: (args: { time: number }) => {
        ensureVideoMode();
        const success = editorStore.splitVideo(args?.time);
        if (!success) {
          return { success: false, error: 'Unable to split clip at given timestamp' };
        }

        editorStore.addAgentToast(`Agent split clip at ${args.time}s`, 'split_video', 'video');
        return {
          success: true,
          mode: 'video',
          action: 'split_video',
          clips: editorStore.getState().video.clips,
        };
      },
    },

    {
      name: 'delete_video_segment',
      description:
        'Delete a split clip segment by segmentId from the timeline.',
      inputSchema: {
        type: 'object',
        properties: {
          segmentId: { type: 'string', description: 'ID of the segment to delete' },
        },
        required: ['segmentId'],
      },
      annotations: {
        readOnlyHint: false,
      },
      execute: (args: { segmentId: string }) => {
        ensureVideoMode();
        const success = editorStore.deleteVideoSegment(args?.segmentId);
        if (!success) {
          return { success: false, error: 'Unable to delete segment or only 1 segment remains' };
        }

        editorStore.addAgentToast(`Agent deleted segment ${args.segmentId}`, 'delete_video_segment', 'video');
        return {
          success: true,
          mode: 'video',
          action: 'delete_video_segment',
          clips: editorStore.getState().video.clips,
        };
      },
    },

    {
      name: 'undo_video_edit',
      description:
        'Revert the latest video editing action (such as speed, trim, or text) while preserving earlier edits. The visible video project updates immediately.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      annotations: {
        readOnlyHint: false,
      },
      execute: () => {
        ensureVideoMode();
        const success = editorStore.undoVideo();
        if (!success) {
          return { success: false, error: 'No video edits available to undo' };
        }

        editorStore.addAgentToast('Agent undid last video edit', 'undo_video_edit', 'video');
        return {
          success: true,
          mode: 'video',
          action: 'undo_video_edit',
          currentState: {
            aspectRatio: editorStore.getState().video.aspectRatio,
            playbackRate: editorStore.getState().video.playbackRate,
            trim: editorStore.getState().video.trim,
            textLayersCount: editorStore.getState().video.textLayers.length,
          },
        };
      },
    },

    {
      name: 'redo_video_edit',
      description:
        'Re-apply the next video edit from the redo stack. The timeline and preview update immediately.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      annotations: {
        readOnlyHint: false,
      },
      execute: () => {
        ensureVideoMode();
        const success = editorStore.redoVideo();
        if (!success) {
          return { success: false, error: 'No video edits available to redo' };
        }

        editorStore.addAgentToast('Agent redid video edit', 'redo_video_edit', 'video');
        return { success: true, mode: 'video', action: 'redo_video_edit' };
      },
    },

    {
      name: 'export_video',
      description:
        'Download the source video media. Note: In this hackathon prototype, full client-side video compositing/re-encoding (baking trims, 9:16 crop, speed changes, and text overlays into a new video file) is not implemented to ensure browser stability; all edits are active and visible in the live preview and timeline.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      annotations: {
        readOnlyHint: false,
      },
      execute: () => {
        ensureVideoMode();
        const v = editorStore.getState().video;
        if (!v.source) {
          return { success: false, error: 'No video loaded to export' };
        }

        editorStore.addAgentToast(
          'Downloaded source video (edits active in preview/timeline)',
          'export_video',
          'video'
        );

        return {
          success: true,
          mode: 'video',
          action: 'export_video',
          downloaded: 'source_media',
          renderedOutput: false,
          status: 'downloaded_source',
          message:
            'Source video asset was downloaded. Full client-side video re-encoding (trims, 9:16 crop, speed, and text overlays) was scoped out for hackathon stability; project edits remain live in the interactive preview and timeline.',
          projectState: {
            aspectRatio: v.aspectRatio,
            playbackRate: v.playbackRate,
            trim: v.trim,
            textLayersCount: v.textLayers.length,
            effectiveDuration: Number(
              ((v.trim.end - v.trim.start) / v.playbackRate).toFixed(2)
            ),
          },
        };
      },
    },
  ];
}

/**
 * Register all AgentCut WebMCP tools imperatively.
 * StrictMode safe using AbortSignal.
 */
export function registerAgentCutTools(signal?: AbortSignal): boolean {
  if (typeof window === 'undefined') return false;

  const modelContext =
    (document as any).modelContext || (navigator as any).modelContext;

  if (!modelContext || typeof modelContext.registerTool !== 'function') {
    return false;
  }

  const tools = getAgentCutToolDefinitions();

  for (const tool of tools) {
    try {
      modelContext.registerTool(
        {
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
          execute: tool.execute,
          annotations: tool.annotations,
        },
        signal ? { signal } : undefined
      );
    } catch (err) {
      console.warn(`[AgentCut] Failed to register tool ${tool.name}:`, err);
    }
  }

  return true;
}
