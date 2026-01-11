import * as turf from '@turf/turf';
import type {
  Feature,
  Polygon,
  MultiPolygon,
  Position,
  Geometry,
} from 'geojson';
import type { GeoFeature, ValidationResult, ShapeType } from '../types/geometry';

const CIRCLE_SEGMENTS = 64;

export const circleToPolygon = (
  center: Position,
  radiusInMeters: number
): Feature<Polygon> => {
  return turf.circle(center, radiusInMeters / 1000, {
    steps: CIRCLE_SEGMENTS,
    units: 'kilometers',
  });
};

export const isPolygonalShape = (shapeType: ShapeType): boolean => {
  return ['polygon', 'rectangle', 'circle'].includes(shapeType);
};

export const getPolygonFromGeometry = (
  geometry: Geometry
): Feature<Polygon | MultiPolygon> | null => {
  if (geometry.type === 'Polygon') {
    return turf.polygon(geometry.coordinates);
  }
  if (geometry.type === 'MultiPolygon') {
    return turf.multiPolygon(geometry.coordinates);
  }
  return null;
};

/**
 * Validates a new polygon against existing polygons for overlap constraints.
 * 
 * Validation Rules:
 * 1. If new polygon is fully contained within an existing polygon -> BLOCK
 * 2. If new polygon fully contains an existing polygon -> BLOCK
 * 3. If partial overlap exists -> AUTO-TRIM using turf.difference
 * 4. If no overlap -> ALLOW
 */
export const validatePolygonOverlap = (
  newGeometry: Geometry,
  existingFeatures: GeoFeature[],
  excludeId?: string
): ValidationResult => {
  const newPolygonFeature = getPolygonFromGeometry(newGeometry);

  if (!newPolygonFeature) {
    return { isValid: true };
  }

  const existingPolygons = existingFeatures
    .filter((f) => isPolygonalShape(f.shapeType) && f.id !== excludeId)
    .map((f) => ({
      id: f.id,
      polygon: getPolygonFromGeometry(f.geometry),
    }))
    .filter((p) => p.polygon !== null);

  let currentPolygon: Feature<Polygon | MultiPolygon> = newPolygonFeature;
  let wasTrimmed = false;

  for (const existing of existingPolygons) {
    if (!existing.polygon) continue;

    try {
      const intersection = turf.intersect(currentPolygon, existing.polygon);

      if (!intersection) {
        continue;
      }

      const currentArea = turf.area(currentPolygon);
      const existingArea = turf.area(existing.polygon);
      const intersectionArea = turf.area(intersection);

      // Check if new polygon is fully contained within existing (>99% overlap with new)
      const newContainedRatio = intersectionArea / currentArea;
      if (newContainedRatio > 0.99) {
        return {
          isValid: false,
          error: 'Cannot create a polygon that is fully contained within an existing polygon.',
        };
      }

      // Check if new polygon fully contains existing (>99% overlap with existing)
      const existingContainedRatio = intersectionArea / existingArea;
      if (existingContainedRatio > 0.99) {
        return {
          isValid: false,
          error: 'Cannot create a polygon that fully contains an existing polygon.',
        };
      }

      // Partial overlap: trim the new polygon using difference
      const difference = turf.difference(currentPolygon, existing.polygon);

      if (!difference) {
        return {
          isValid: false,
          error: 'Polygon would be completely removed after trimming overlaps.',
        };
      }

      currentPolygon = difference as Feature<Polygon | MultiPolygon>;
      wasTrimmed = true;
    } catch (error) {
      console.error('Error during polygon validation:', error);
      return {
        isValid: false,
        error: 'Failed to validate polygon overlap. Please try again.',
      };
    }
  }

  return {
    isValid: true,
    trimmedGeometry: wasTrimmed ? currentPolygon.geometry : null,
  };
};

export const calculateArea = (geometry: Geometry): number => {
  const polygon = getPolygonFromGeometry(geometry);
  if (!polygon) return 0;
  return turf.area(polygon);
};

export const calculateLength = (geometry: Geometry): number => {
  if (geometry.type === 'LineString') {
    const line = turf.lineString(geometry.coordinates);
    return turf.length(line, { units: 'kilometers' });
  }
  return 0;
};

export const getBoundingBox = (
  geometry: Geometry
): [number, number, number, number] | null => {
  try {
    return turf.bbox(geometry) as [number, number, number, number];
  } catch {
    return null;
  }
};
