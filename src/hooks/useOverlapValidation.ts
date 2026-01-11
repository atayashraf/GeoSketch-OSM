import { useCallback, useMemo, useRef } from 'react';
import type { Geometry } from 'geojson';
import { useFeatureStore } from '../store/featureStore';
import type { GeoFeature, ValidationResult } from '../types/geometry';
import {
  validatePolygonOverlap,
  isPolygonalShape,
} from '../utils/polygonUtils';

// Debounce timeout in milliseconds for validation operations
const VALIDATION_DEBOUNCE_MS = 50;

interface UseOverlapValidationReturn {
  validateNewPolygon: (
    geometry: Geometry,
    shapeType: string
  ) => ValidationResult;
  validateEditedPolygon: (
    geometry: Geometry,
    shapeType: string,
    featureId: string
  ) => ValidationResult;
  existingPolygonalFeatures: GeoFeature[];
}

export const useOverlapValidation = (): UseOverlapValidationReturn => {
  const features = useFeatureStore((state) => state.features);
  
  // Cache for validation results to avoid redundant computations
  const validationCache = useRef<Map<string, ValidationResult>>(new Map());
  const lastValidationTime = useRef<number>(0);

  // Memoize existing polygonal features to prevent unnecessary recalculations
  const existingPolygonalFeatures = useMemo(() => {
    return features.filter((f) => isPolygonalShape(f.shapeType));
  }, [features]);

  // Generate cache key for validation
  const getCacheKey = useCallback((geometry: Geometry, excludeId?: string): string => {
    return JSON.stringify({ geometry, excludeId, featureCount: features.length });
  }, [features.length]);

  const validateNewPolygon = useCallback(
    (geometry: Geometry, shapeType: string): ValidationResult => {
      if (!isPolygonalShape(shapeType as 'polygon' | 'rectangle' | 'circle' | 'line')) {
        return { isValid: true };
      }

      // Check cache first for performance
      const cacheKey = getCacheKey(geometry);
      const cachedResult = validationCache.current.get(cacheKey);
      const now = Date.now();
      
      if (cachedResult && (now - lastValidationTime.current) < VALIDATION_DEBOUNCE_MS) {
        return cachedResult;
      }

      const result = validatePolygonOverlap(geometry, features);
      
      // Update cache
      validationCache.current.set(cacheKey, result);
      lastValidationTime.current = now;
      
      // Limit cache size to prevent memory leaks
      if (validationCache.current.size > 100) {
        const firstKey = validationCache.current.keys().next().value;
        if (firstKey) validationCache.current.delete(firstKey);
      }

      return result;
    },
    [features, getCacheKey]
  );

  const validateEditedPolygon = useCallback(
    (geometry: Geometry, shapeType: string, featureId: string): ValidationResult => {
      if (!isPolygonalShape(shapeType as 'polygon' | 'rectangle' | 'circle' | 'line')) {
        return { isValid: true };
      }

      // Check cache first for performance
      const cacheKey = getCacheKey(geometry, featureId);
      const cachedResult = validationCache.current.get(cacheKey);
      const now = Date.now();
      
      if (cachedResult && (now - lastValidationTime.current) < VALIDATION_DEBOUNCE_MS) {
        return cachedResult;
      }

      const result = validatePolygonOverlap(geometry, features, featureId);
      
      // Update cache
      validationCache.current.set(cacheKey, result);
      lastValidationTime.current = now;

      return result;
    },
    [features, getCacheKey]
  );

  return {
    validateNewPolygon,
    validateEditedPolygon,
    existingPolygonalFeatures,
  };
};
