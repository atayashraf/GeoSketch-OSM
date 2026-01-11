import type { Geometry, Position } from 'geojson';

export type ShapeType = 'polygon' | 'rectangle' | 'circle' | 'line';

export interface FeatureProperties {
  id: string;
  shapeType: ShapeType;
  createdAt: number;
  name?: string;
  area?: number; // Square meters for polygonal shapes
  length?: number; // Kilometers for LineStrings
  radius?: number; // For circles, store original radius in meters
  center?: Position; // For circles, store original center
}

export interface GeoFeature {
  id: string;
  geometry: Geometry;
  shapeType: ShapeType;
  properties: FeatureProperties;
}

export interface DrawEvent {
  layer: L.Layer;
  layerType: string;
}

export interface EditEvent {
  layers: L.LayerGroup;
}

export interface DeleteEvent {
  layers: L.LayerGroup;
}

export type PolygonalShapeType = Extract<ShapeType, 'polygon' | 'rectangle' | 'circle'>;

export interface ValidationResult {
  isValid: boolean;
  trimmedGeometry?: Geometry | null;
  error?: string;
}

export interface CircleGeometry {
  center: Position;
  radius: number;
}
