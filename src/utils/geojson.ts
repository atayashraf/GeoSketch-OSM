import type { Feature, FeatureCollection, Geometry, Position } from 'geojson';
import type { GeoFeature, FeatureProperties } from '../types/geometry';

export const createFeatureCollection = (
  features: GeoFeature[]
): FeatureCollection => {
  return {
    type: 'FeatureCollection',
    features: features.map((f) => createFeature(f)),
  };
};

export const createFeature = (
  geoFeature: GeoFeature
): Feature<Geometry, FeatureProperties> => {
  return {
    type: 'Feature',
    geometry: geoFeature.geometry,
    properties: {
      id: geoFeature.id,
      shapeType: geoFeature.shapeType,
      createdAt: geoFeature.properties.createdAt,
      ...(geoFeature.properties.radius && {
        radius: geoFeature.properties.radius,
      }),
      ...(geoFeature.properties.center && {
        center: geoFeature.properties.center,
      }),
    },
  };
};

export const downloadGeoJSON = (features: GeoFeature[]): void => {
  const featureCollection = createFeatureCollection(features);
  const dataStr = JSON.stringify(featureCollection, null, 2);
  const blob = new Blob([dataStr], { type: 'application/geo+json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `geosketch-export-${Date.now()}.geojson`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const generateFeatureId = (): string => {
  return `feature-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export const isValidCoordinate = (coord: Position): boolean => {
  const [lng, lat] = coord;
  return (
    typeof lng === 'number' &&
    typeof lat === 'number' &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
};
