import {
  ImageProject,
  VideoProject,
  ImageSnapshot,
  VideoSnapshot,
  ImageSource,
  VideoSource,
  VideoClip,
  AspectRatio,
  ImageAdjustments,
  TextLayer,
  VideoTextLayer,
  EditHistoryEntry,
  AgentToast,
  SemanticPosition,
} from '../types/editor';
import { semanticToCoords } from '../utils/position';

export interface EditorState {
  mode: 'image' | 'video';
  image: ImageProject;
  video: VideoProject;
  toasts: AgentToast[];
}

const initialImageSnapshot: ImageSnapshot = {
  canvas: {
    width: 1920,
    height: 1080,
    aspectRatio: 'original',
  },
  transform: {
    rotation: 0,
    flipX: false,
    flipY: false,
  },
  adjustments: {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    grayscale: 0,
    blur: 0,
  },
  textLayers: [],
};

const initialVideoSnapshot: VideoSnapshot = {
  aspectRatio: '16:9',
  trim: {
    start: 0,
    end: 10,
  },
  clips: [
    {
      id: 'clip-1',
      start: 0,
      end: 10,
      label: 'Main clip',
    },
  ],
  playbackRate: 1,
  volume: 100,
  muted: false,
  textLayers: [],
};

function createInitialState(): EditorState {
  return {
    mode: 'image',
    image: {
      id: 'image-project-1',
      source: null,
      ...initialImageSnapshot,
      history: [],
      future: [],
    },
    video: {
      id: 'video-project-1',
      source: null,
      playhead: 0,
      isPlaying: false,
      ...initialVideoSnapshot,
      history: [],
      future: [],
    },
    toasts: [],
  };
}

let state: EditorState = createInitialState();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function getImageSnapshot(image: ImageProject): ImageSnapshot {
  return {
    canvas: { ...image.canvas },
    transform: { ...image.transform },
    adjustments: { ...image.adjustments },
    textLayers: image.textLayers.map((l) => ({ ...l })),
  };
}

function getVideoSnapshot(video: VideoProject): VideoSnapshot {
  return {
    aspectRatio: video.aspectRatio,
    trim: { ...video.trim },
    clips: video.clips.map((c) => ({ ...c })),
    playbackRate: video.playbackRate,
    volume: video.volume,
    muted: video.muted,
    textLayers: video.textLayers.map((l) => ({ ...l })),
  };
}

let textCounter = 1;
let videoTextCounter = 1;
let historyCounter = 1;

export const editorStore = {
  getState(): EditorState {
    return state;
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  setMode(mode: 'image' | 'video') {
    state = { ...state, mode };
    notify();
  },

  // Toast Management
  addAgentToast(message: string, tool: string, mode: 'image' | 'video') {
    const toast: AgentToast = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      message,
      tool,
      mode,
      timestamp: Date.now(),
    };
    state = {
      ...state,
      toasts: [...state.toasts, toast],
    };
    notify();

    setTimeout(() => {
      editorStore.removeToast(toast.id);
    }, 2800);
  },

  removeToast(id: string) {
    state = {
      ...state,
      toasts: state.toasts.filter((t) => t.id !== id),
    };
    notify();
  },

  // ---------------- IMAGE ACTIONS ---------------- //

  loadImage(source: ImageSource) {
    const snapshot = initialImageSnapshot;
    state = {
      ...state,
      image: {
        id: `img-proj-${Date.now()}`,
        source,
        ...snapshot,
        canvas: {
          width: source.width || 1920,
          height: source.height || 1080,
          aspectRatio: 'original',
        },
        history: [],
        future: [],
      },
    };
    notify();
  },

  recordImageHistory(type: string, label: string) {
    const entry: EditHistoryEntry = {
      id: `edit-${historyCounter++}`,
      mode: 'image',
      type,
      label,
      timestamp: Date.now(),
    };
    const currentSnapshot = getImageSnapshot(state.image);

    state = {
      ...state,
      image: {
        ...state.image,
        history: [...state.image.history, { entry, snapshot: currentSnapshot }],
        future: [], // clear redo stack on new modification
      },
    };
  },

  setImageAspectRatio(ratio: AspectRatio) {
    if (state.image.canvas.aspectRatio === ratio) return;
    editorStore.recordImageHistory('set_aspect_ratio', `Changed aspect ratio to ${ratio}`);

    let width = state.image.source?.width || 1920;
    let height = state.image.source?.height || 1080;

    if (ratio === '1:1') {
      const min = Math.min(width, height);
      width = min;
      height = min;
    } else if (ratio === '4:5') {
      const base = Math.min(width, height);
      width = Math.round(base * 0.8);
      height = base;
    } else if (ratio === '16:9') {
      const base = Math.min(width, height);
      width = Math.round((base * 16) / 9);
      height = base;
    } else if (ratio === '9:16') {
      const base = Math.min(width, height);
      width = Math.round((base * 9) / 16);
      height = base;
    }

    state = {
      ...state,
      image: {
        ...state.image,
        canvas: {
          width,
          height,
          aspectRatio: ratio,
        },
      },
    };
    notify();
  },

  rotateImage(degrees: number) {
    editorStore.recordImageHistory('rotate_image', `Rotated image ${degrees}°`);
    const newRotation = (state.image.transform.rotation + degrees) % 360;
    state = {
      ...state,
      image: {
        ...state.image,
        transform: {
          ...state.image.transform,
          rotation: newRotation,
        },
      },
    };
    notify();
  },

  flipImage(options: { horizontal?: boolean; vertical?: boolean }) {
    const h = options.horizontal !== undefined ? options.horizontal : state.image.transform.flipX;
    const v = options.vertical !== undefined ? options.vertical : state.image.transform.flipY;
    editorStore.recordImageHistory('flip_image', `Flipped image (${h ? 'H' : ''} ${v ? 'V' : ''})`);

    state = {
      ...state,
      image: {
        ...state.image,
        transform: {
          ...state.image.transform,
          flipX: h,
          flipY: v,
        },
      },
    };
    notify();
  },

  adjustImage(adjustments: Partial<ImageAdjustments>) {
    const changes: string[] = [];
    if (adjustments.brightness !== undefined) changes.push(`Brightness ${adjustments.brightness > 0 ? '+' : ''}${adjustments.brightness}`);
    if (adjustments.contrast !== undefined) changes.push(`Contrast ${adjustments.contrast > 0 ? '+' : ''}${adjustments.contrast}`);
    if (adjustments.saturation !== undefined) changes.push(`Saturation ${adjustments.saturation > 0 ? '+' : ''}${adjustments.saturation}`);
    if (adjustments.grayscale !== undefined) changes.push(`Grayscale ${adjustments.grayscale}%`);
    if (adjustments.blur !== undefined) changes.push(`Blur ${adjustments.blur}px`);

    editorStore.recordImageHistory('adjust_image', changes.join(', ') || 'Adjusted image');

    state = {
      ...state,
      image: {
        ...state.image,
        adjustments: {
          ...state.image.adjustments,
          ...adjustments,
        },
      },
    };
    notify();
  },

  addImageText(params: {
    content: string;
    position?: SemanticPosition;
    fontSize?: number;
    color?: string;
    fontWeight?: 'normal' | 'bold' | '600' | '700';
    opacity?: number;
    x?: number;
    y?: number;
  }): string {
    const textId = `text-${textCounter++}`;
    const pos = params.position || 'center';
    const coords = semanticToCoords(pos);

    editorStore.recordImageHistory('add_image_text', `Added text "${params.content}"`);

    const newLayer: TextLayer = {
      id: textId,
      content: params.content,
      position: pos,
      x: params.x !== undefined ? params.x : coords.x,
      y: params.y !== undefined ? params.y : coords.y,
      fontSize: params.fontSize || 48,
      fontWeight: params.fontWeight || 'bold',
      alignment: coords.alignment,
      opacity: params.opacity !== undefined ? params.opacity : 1,
      color: params.color || '#ffffff',
    };

    state = {
      ...state,
      image: {
        ...state.image,
        textLayers: [...state.image.textLayers, newLayer],
      },
    };
    notify();
    return textId;
  },

  updateImageText(
    textId: string,
    updates: Partial<Omit<TextLayer, 'id'>> & { position?: SemanticPosition }
  ): boolean {
    const exists = state.image.textLayers.find((l) => l.id === textId);
    if (!exists) return false;

    editorStore.recordImageHistory('update_image_text', `Updated text layer "${exists.content}"`);

    let x = updates.x;
    let y = updates.y;
    let alignment = updates.alignment;

    if (updates.position) {
      const coords = semanticToCoords(updates.position);
      if (x === undefined) x = coords.x;
      if (y === undefined) y = coords.y;
      if (alignment === undefined) alignment = coords.alignment;
    }

    state = {
      ...state,
      image: {
        ...state.image,
        textLayers: state.image.textLayers.map((l) => {
          if (l.id !== textId) return l;
          return {
            ...l,
            ...updates,
            x: x !== undefined ? x : l.x,
            y: y !== undefined ? y : l.y,
            alignment: alignment !== undefined ? alignment : l.alignment,
          };
        }),
      },
    };
    notify();
    return true;
  },

  removeImageText(textId: string): boolean {
    const exists = state.image.textLayers.find((l) => l.id === textId);
    if (!exists) return false;

    editorStore.recordImageHistory('remove_image_text', `Removed text layer "${exists.content}"`);

    state = {
      ...state,
      image: {
        ...state.image,
        textLayers: state.image.textLayers.filter((l) => l.id !== textId),
      },
    };
    notify();
    return true;
  },

  undoImage(): boolean {
    if (state.image.history.length === 0) return false;

    const currentSnapshot = getImageSnapshot(state.image);
    const lastHistoryItem = state.image.history[state.image.history.length - 1];
    const previousSnapshot = lastHistoryItem.snapshot;

    state = {
      ...state,
      image: {
        ...state.image,
        ...previousSnapshot,
        history: state.image.history.slice(0, -1),
        future: [
          {
            entry: lastHistoryItem.entry,
            snapshot: currentSnapshot,
          },
          ...state.image.future,
        ],
      },
    };
    notify();
    return true;
  },

  redoImage(): boolean {
    if (state.image.future.length === 0) return false;

    const currentSnapshot = getImageSnapshot(state.image);
    const nextFutureItem = state.image.future[0];
    const nextSnapshot = nextFutureItem.snapshot;

    state = {
      ...state,
      image: {
        ...state.image,
        ...nextSnapshot,
        future: state.image.future.slice(1),
        history: [
          ...state.image.history,
          {
            entry: nextFutureItem.entry,
            snapshot: currentSnapshot,
          },
        ],
      },
    };
    notify();
    return true;
  },

  resetImage(): void {
    if (!state.image.source) return;
    editorStore.recordImageHistory('reset_image', 'Reset image to original');
    state = {
      ...state,
      image: {
        ...state.image,
        ...initialImageSnapshot,
        canvas: {
          width: state.image.source.width,
          height: state.image.source.height,
          aspectRatio: 'original',
        },
      },
    };
    notify();
  },

  // ---------------- VIDEO ACTIONS ---------------- //

  loadVideo(source: VideoSource) {
    const duration = source.duration || 10;
    state = {
      ...state,
      video: {
        id: `vid-proj-${Date.now()}`,
        source,
        ...initialVideoSnapshot,
        trim: {
          start: 0,
          end: duration,
        },
        clips: [
          {
            id: 'clip-1',
            start: 0,
            end: duration,
            label: 'Main clip',
          },
        ],
        playhead: 0,
        isPlaying: false,
        history: [],
        future: [],
      },
    };
    notify();
  },

  recordVideoHistory(type: string, label: string) {
    const entry: EditHistoryEntry = {
      id: `vid-edit-${historyCounter++}`,
      mode: 'video',
      type,
      label,
      timestamp: Date.now(),
    };
    const currentSnapshot = getVideoSnapshot(state.video);

    state = {
      ...state,
      video: {
        ...state.video,
        history: [...state.video.history, { entry, snapshot: currentSnapshot }],
        future: [], // clear redo stack on new modification
      },
    };
  },

  trimVideo(start: number, end: number): boolean {
    const duration = state.video.source?.duration || 10;
    if (start < 0 || end > duration || start >= end) {
      return false;
    }

    editorStore.recordVideoHistory('trim_video', `Trimmed to ${start}s - ${end}s`);

    state = {
      ...state,
      video: {
        ...state.video,
        trim: { start, end },
        playhead: Math.max(start, Math.min(state.video.playhead, end)),
      },
    };
    notify();
    return true;
  },

  setVideoAspectRatio(ratio: AspectRatio) {
    if (state.video.aspectRatio === ratio) return;
    editorStore.recordVideoHistory('set_aspect_ratio', `Changed aspect ratio to ${ratio}`);

    state = {
      ...state,
      video: {
        ...state.video,
        aspectRatio: ratio,
      },
    };
    notify();
  },

  setVideoSpeed(speed: number): boolean {
    const validSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    if (!validSpeeds.includes(speed)) return false;

    editorStore.recordVideoHistory('set_speed', `Set playback speed to ${speed}×`);

    state = {
      ...state,
      video: {
        ...state.video,
        playbackRate: speed,
      },
    };
    notify();
    return true;
  },

  setVideoVolume(volume?: number, muted?: boolean) {
    const changes: string[] = [];
    if (volume !== undefined) changes.push(`Volume ${volume}%`);
    if (muted !== undefined) changes.push(muted ? 'Muted' : 'Unmuted');

    editorStore.recordVideoHistory('set_volume', changes.join(', ') || 'Adjusted audio');

    state = {
      ...state,
      video: {
        ...state.video,
        volume: volume !== undefined ? Math.max(0, Math.min(100, volume)) : state.video.volume,
        muted: muted !== undefined ? muted : state.video.muted,
      },
    };
    notify();
  },

  addVideoText(params: {
    content: string;
    startTime: number;
    endTime: number;
    position?: SemanticPosition;
    fontSize?: number;
    color?: string;
    opacity?: number;
  }): string {
    const textId = `video-text-${videoTextCounter++}`;
    const pos = params.position || 'bottom-center';
    const coords = semanticToCoords(pos);

    editorStore.recordVideoHistory('add_video_text', `Added text "${params.content}" (${params.startTime}s - ${params.endTime}s)`);

    const newLayer: VideoTextLayer = {
      id: textId,
      content: params.content,
      startTime: params.startTime,
      endTime: params.endTime,
      position: pos,
      x: coords.x,
      y: coords.y,
      fontSize: params.fontSize || 42,
      fontWeight: 'bold',
      opacity: params.opacity !== undefined ? params.opacity : 1,
      color: params.color || '#ffffff',
    };

    state = {
      ...state,
      video: {
        ...state.video,
        textLayers: [...state.video.textLayers, newLayer],
      },
    };
    notify();
    return textId;
  },

  updateVideoText(
    textId: string,
    updates: Partial<Omit<VideoTextLayer, 'id'>>
  ): boolean {
    const exists = state.video.textLayers.find((l) => l.id === textId);
    if (!exists) return false;

    editorStore.recordVideoHistory('update_video_text', `Updated text layer "${exists.content}"`);

    let x = updates.x;
    let y = updates.y;
    if (updates.position) {
      const coords = semanticToCoords(updates.position);
      if (x === undefined) x = coords.x;
      if (y === undefined) y = coords.y;
    }

    state = {
      ...state,
      video: {
        ...state.video,
        textLayers: state.video.textLayers.map((l) => {
          if (l.id !== textId) return l;
          return {
            ...l,
            ...updates,
            x: x !== undefined ? x : l.x,
            y: y !== undefined ? y : l.y,
          };
        }),
      },
    };
    notify();
    return true;
  },

  removeVideoText(textId: string): boolean {
    const exists = state.video.textLayers.find((l) => l.id === textId);
    if (!exists) return false;

    editorStore.recordVideoHistory('remove_video_text', `Removed text layer "${exists.content}"`);

    state = {
      ...state,
      video: {
        ...state.video,
        textLayers: state.video.textLayers.filter((l) => l.id !== textId),
      },
    };
    notify();
    return true;
  },

  splitVideo(time: number): boolean {
    const duration = state.video.source?.duration || 10;
    if (time <= 0 || time >= duration) return false;

    editorStore.recordVideoHistory('split_video', `Split clip at ${time.toFixed(1)}s`);

    const clipIndex = state.video.clips.findIndex((c) => time > c.start && time < c.end);
    if (clipIndex === -1) return false;

    const clipToSplit = state.video.clips[clipIndex];
    const segment1: VideoClip = {
      id: `${clipToSplit.id}-a`,
      start: clipToSplit.start,
      end: time,
      label: `${clipToSplit.label || 'Segment'} (Part 1)`,
    };
    const segment2: VideoClip = {
      id: `${clipToSplit.id}-b`,
      start: time,
      end: clipToSplit.end,
      label: `${clipToSplit.label || 'Segment'} (Part 2)`,
    };

    const newClips = [...state.video.clips];
    newClips.splice(clipIndex, 1, segment1, segment2);

    state = {
      ...state,
      video: {
        ...state.video,
        clips: newClips,
      },
    };
    notify();
    return true;
  },

  deleteVideoSegment(segmentId: string): boolean {
    if (state.video.clips.length <= 1) return false;
    const exists = state.video.clips.find((c) => c.id === segmentId);
    if (!exists) return false;

    editorStore.recordVideoHistory('delete_segment', `Deleted segment ${segmentId}`);

    state = {
      ...state,
      video: {
        ...state.video,
        clips: state.video.clips.filter((c) => c.id !== segmentId),
      },
    };
    notify();
    return true;
  },

  setPlayhead(time: number) {
    state = {
      ...state,
      video: {
        ...state.video,
        playhead: time,
      },
    };
    notify();
  },

  setIsPlaying(isPlaying: boolean) {
    state = {
      ...state,
      video: {
        ...state.video,
        isPlaying,
      },
    };
    notify();
  },

  undoVideo(): boolean {
    if (state.video.history.length === 0) return false;

    const currentSnapshot = getVideoSnapshot(state.video);
    const lastHistoryItem = state.video.history[state.video.history.length - 1];
    const previousSnapshot = lastHistoryItem.snapshot;

    state = {
      ...state,
      video: {
        ...state.video,
        ...previousSnapshot,
        history: state.video.history.slice(0, -1),
        future: [
          {
            entry: lastHistoryItem.entry,
            snapshot: currentSnapshot,
          },
          ...state.video.future,
        ],
      },
    };
    notify();
    return true;
  },

  redoVideo(): boolean {
    if (state.video.future.length === 0) return false;

    const currentSnapshot = getVideoSnapshot(state.video);
    const nextFutureItem = state.video.future[0];
    const nextSnapshot = nextFutureItem.snapshot;

    state = {
      ...state,
      video: {
        ...state.video,
        ...nextSnapshot,
        future: state.video.future.slice(1),
        history: [
          ...state.video.history,
          {
            entry: nextFutureItem.entry,
            snapshot: currentSnapshot,
          },
        ],
      },
    };
    notify();
    return true;
  },

  resetVideo(): void {
    if (!state.video.source) return;
    editorStore.recordVideoHistory('reset_video', 'Reset video to original');
    const duration = state.video.source.duration || 10;
    state = {
      ...state,
      video: {
        ...state.video,
        ...initialVideoSnapshot,
        trim: {
          start: 0,
          end: duration,
        },
        clips: [
          {
            id: 'clip-1',
            start: 0,
            end: duration,
            label: 'Main clip',
          },
        ],
        playhead: 0,
        isPlaying: false,
      },
    };
    notify();
  },
};
