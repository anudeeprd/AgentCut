export type AspectRatio = 'original' | '1:1' | '4:5' | '16:9' | '9:16';

export type SemanticPosition = 
  | 'top-left' 
  | 'top-center' 
  | 'top-right' 
  | 'center' 
  | 'bottom-left' 
  | 'bottom-center' 
  | 'bottom-right';

export interface ImageAdjustments {
  brightness: number; // -100 to 100
  contrast: number;   // -100 to 100
  saturation: number; // -100 to 100
  grayscale: number;  // 0 to 100
  blur: number;       // 0 to 20
}

export interface ImageTransform {
  rotation: number;   // degrees (0, 90, 180, 270, etc.)
  flipX: boolean;
  flipY: boolean;
}

export interface TextLayer {
  id: string;
  content: string;
  x: number; // 0 to 100 (%)
  y: number; // 0 to 100 (%)
  position?: SemanticPosition;
  fontSize: number; // px
  fontWeight: 'normal' | 'bold' | '600' | '700';
  alignment: 'left' | 'center' | 'right';
  opacity: number; // 0 to 1
  color: string; // hex
  backgroundColor?: string;
}

export interface ImageSource {
  fileName: string;
  width: number;
  height: number;
  objectUrl: string;
  isDemo?: boolean;
}

export interface ImageSnapshot {
  canvas: {
    width: number;
    height: number;
    aspectRatio: AspectRatio;
  };
  transform: ImageTransform;
  adjustments: ImageAdjustments;
  textLayers: TextLayer[];
}

export interface VideoSource {
  fileName: string;
  duration: number;
  width: number;
  height: number;
  objectUrl: string;
  isDemo?: boolean;
}

export interface VideoClip {
  id: string;
  start: number; // source video start time in seconds
  end: number;   // source video end time in seconds
  label?: string;
}

export interface VideoTextLayer {
  id: string;
  content: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  position: SemanticPosition;
  x: number; // 0 to 100 (%)
  y: number; // 0 to 100 (%)
  fontSize: number;
  fontWeight: 'normal' | 'bold' | '600' | '700';
  opacity: number;
  color: string;
}

export type KeyframeTargetType = 'video' | 'text';

export interface VideoKeyframeProperties {
  x?: number;
  y?: number;
  scale?: number;
  opacity?: number;
}

export interface VideoKeyframe {
  id: string;
  targetType: KeyframeTargetType;
  // required only for text target
  targetId?: string;
  time: number;
  properties: VideoKeyframeProperties;
}

export interface VideoSnapshot {
  aspectRatio: AspectRatio;
  trim: {
    start: number;
    end: number;
  };
  clips: VideoClip[];
  playbackRate: number; // 0.5, 0.75, 1, 1.25, 1.5, 2
  volume: number;       // 0 to 100
  muted: boolean;
  textLayers: VideoTextLayer[];
  keyframes: VideoKeyframe[];
}

export interface EditHistoryEntry {
  id: string;
  mode: 'image' | 'video';
  type: string;
  label: string;
  timestamp: number;
}

export interface ImageProject extends ImageSnapshot {
  id: string;
  source: ImageSource | null;
  history: { entry: EditHistoryEntry; snapshot: ImageSnapshot }[];
  future: { entry: EditHistoryEntry; snapshot: ImageSnapshot }[];
}

export interface VideoProject extends VideoSnapshot {
  id: string;
  source: VideoSource | null;
  playhead: number;
  isPlaying: boolean;
  history: { entry: EditHistoryEntry; snapshot: VideoSnapshot }[];
  future: { entry: EditHistoryEntry; snapshot: VideoSnapshot }[];
}

export interface AgentToast {
  id: string;
  message: string;
  tool: string;
  mode: 'image' | 'video';
  timestamp: number;
}
