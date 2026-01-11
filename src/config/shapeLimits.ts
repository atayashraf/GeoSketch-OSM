import type { ShapeType } from '../types/geometry';

export interface ShapeLimits {
  polygon: number;
  rectangle: number;
  circle: number;
  line: number;
}

export const shapeLimits: ShapeLimits = {
  polygon: 10,
  rectangle: 5,
  circle: 5,
  line: 20,
};

export const getShapeLimit = (shapeType: ShapeType): number => {
  return shapeLimits[shapeType];
};

export const isLimitReached = (
  shapeType: ShapeType,
  currentCount: number
): boolean => {
  return currentCount >= shapeLimits[shapeType];
};
