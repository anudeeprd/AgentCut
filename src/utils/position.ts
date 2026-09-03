import { SemanticPosition } from '../types/editor';

export interface PositionCoordinates {
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  alignment: 'left' | 'center' | 'right';
}

export function semanticToCoords(position: SemanticPosition): PositionCoordinates {
  switch (position) {
    case 'top-left':
      return { x: 10, y: 12, alignment: 'left' };
    case 'top-center':
      return { x: 50, y: 12, alignment: 'center' };
    case 'top-right':
      return { x: 90, y: 12, alignment: 'right' };
    case 'center':
      return { x: 50, y: 50, alignment: 'center' };
    case 'bottom-left':
      return { x: 10, y: 88, alignment: 'left' };
    case 'bottom-center':
      return { x: 50, y: 88, alignment: 'center' };
    case 'bottom-right':
      return { x: 90, y: 88, alignment: 'right' };
    default:
      return { x: 50, y: 50, alignment: 'center' };
  }
}

export function coordsToSemantic(x: number, y: number): SemanticPosition {
  const isTop = y < 33;
  const isBottom = y > 66;
  const isLeft = x < 33;
  const isRight = x > 66;

  if (isTop && isLeft) return 'top-left';
  if (isTop && isRight) return 'top-right';
  if (isTop) return 'top-center';
  if (isBottom && isLeft) return 'bottom-left';
  if (isBottom && isRight) return 'bottom-right';
  if (isBottom) return 'bottom-center';
  return 'center';
}

export function calculateCanvasDimensions(
  sourceWidth: number,
  sourceHeight: number,
  ratio: string
): { width: number; height: number } {
  if (ratio === 'original' || !ratio) {
    return { width: sourceWidth, height: sourceHeight };
  }
  
  // Calculate target aspect ratio
  let targetAspect = sourceWidth / sourceHeight;
  if (ratio === '1:1') targetAspect = 1;
  else if (ratio === '4:5') targetAspect = 4 / 5;
  else if (ratio === '16:9') targetAspect = 16 / 9;
  else if (ratio === '9:16') targetAspect = 9 / 16;

  // Fit inside bounding dimensions based on max side
  const baseDim = 1080;
  if (targetAspect >= 1) {
    return {
      width: Math.round(baseDim * targetAspect),
      height: baseDim
    };
  } else {
    return {
      width: baseDim,
      height: Math.round(baseDim / targetAspect)
    };
  }
}
