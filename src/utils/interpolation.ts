import { VideoKeyframe, VideoKeyframeProperties, VideoTextLayer } from '../types/editor';

/**
 * Linearly interpolate a single property across keyframes that define it.
 * If no keyframe defines the property, returns defaultValue.
 * If currentTime is before the first keyframe defining it, returns the first keyframe's value.
 * If currentTime is after the last keyframe defining it, returns the last keyframe's value.
 */
export function interpolateProperty(
  keyframes: VideoKeyframe[],
  propName: keyof VideoKeyframeProperties,
  currentTime: number,
  defaultValue: number
): number {
  const matching = keyframes
    .filter(
      (k) => k.properties[propName] !== undefined && typeof k.properties[propName] === 'number'
    )
    .sort((a, b) => a.time - b.time);

  if (matching.length === 0) {
    return defaultValue;
  }

  // Clamping outside the keyframe range
  if (currentTime <= matching[0].time) {
    return matching[0].properties[propName]!;
  }
  if (currentTime >= matching[matching.length - 1].time) {
    return matching[matching.length - 1].properties[propName]!;
  }

  // Find surrounding keyframes
  for (let i = 0; i < matching.length - 1; i++) {
    const prev = matching[i];
    const next = matching[i + 1];

    if (currentTime >= prev.time && currentTime <= next.time) {
      const timeDiff = next.time - prev.time;
      if (Math.abs(timeDiff) < 1e-6) {
        return prev.properties[propName]!;
      }
      const progress = (currentTime - prev.time) / timeDiff;
      const prevVal = prev.properties[propName]!;
      const nextVal = next.properties[propName]!;
      return prevVal + (nextVal - prevVal) * progress;
    }
  }

  return defaultValue;
}

export interface InterpolatedTextProperties {
  x: number;
  y: number;
  scale: number;
  opacity: number;
}

/**
 * Compute active interpolated values for a text layer at currentTime.
 */
export function interpolateTextLayerKeyframes(
  layer: VideoTextLayer,
  allKeyframes: VideoKeyframe[],
  currentTime: number
): InterpolatedTextProperties {
  const targetKeyframes = (allKeyframes || []).filter(
    (k) => k.targetType === 'text' && k.targetId === layer.id
  );

  const x = interpolateProperty(targetKeyframes, 'x', currentTime, layer.x);
  const y = interpolateProperty(targetKeyframes, 'y', currentTime, layer.y);
  const scale = interpolateProperty(targetKeyframes, 'scale', currentTime, 1);
  const opacity = interpolateProperty(
    targetKeyframes,
    'opacity',
    currentTime,
    layer.opacity !== undefined ? layer.opacity : 1
  );

  return { x, y, scale, opacity };
}

export interface InterpolatedVideoProperties {
  x: number;
  y: number;
  scale: number;
}

/**
 * Compute active interpolated values for the video frame at currentTime.
 */
export function interpolateVideoKeyframes(
  allKeyframes: VideoKeyframe[],
  currentTime: number
): InterpolatedVideoProperties {
  const targetKeyframes = (allKeyframes || []).filter((k) => k.targetType === 'video');

  const x = interpolateProperty(targetKeyframes, 'x', currentTime, 50);
  const y = interpolateProperty(targetKeyframes, 'y', currentTime, 50);
  const scale = interpolateProperty(targetKeyframes, 'scale', currentTime, 1);

  return { x, y, scale };
}
