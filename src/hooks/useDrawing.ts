import { useCallback, useRef, useEffect } from 'react';
import * as L from 'leaflet';
import type { FeatureGroup } from 'leaflet';
import type { Geometry, Position } from 'geojson';
import { useFeatureStore } from '../store/featureStore';
import { useOverlapValidation } from './useOverlapValidation';
import { circleToPolygon, isPolygonalShape } from '../utils/polygonUtils';
import type { ShapeType, GeoFeature } from '../types/geometry';

type LayerToFeatureMap = Map<number, string>;

interface UseDrawingReturn {
  handleCreated: (layer: L.Layer, layerType: string) => void;
  handleEdited: (layers: L.LayerGroup) => void;
  handleDeleted: (layers: L.LayerGroup) => void;
  registerLayer: (layer: L.Layer, featureId: string) => void;
  layerToFeatureMap: React.MutableRefObject<LayerToFeatureMap>;
  featureGroupRef: React.MutableRefObject<FeatureGroup | null>;
}

const mapLayerTypeToShapeType = (layerType: string): ShapeType => {
  switch (layerType) {
    case 'polygon':
      return 'polygon';
    case 'rectangle':
      return 'rectangle';
    case 'circle':
      return 'circle';
    case 'polyline':
      return 'line';
    default:
      return 'polygon';
  }
};

const extractGeometryFromLayer = (
  layer: L.Layer,
  layerType: string
): { geometry: Geometry; additionalProps?: Record<string, unknown> } | null => {
  if (layerType === 'circle' && layer instanceof L.Circle) {
    const center = layer.getLatLng();
    const radius = layer.getRadius();
    const centerPosition: Position = [center.lng, center.lat];

    // Convert circle to polygon for storage and validation
    const polygonFeature = circleToPolygon(centerPosition, radius);

    return {
      geometry: polygonFeature.geometry,
      additionalProps: {
        radius,
        center: centerPosition,
      },
    };
  }

  if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
    const latLngs = layer.getLatLngs()[0] as L.LatLng[];
    const coordinates: Position[] = latLngs.map((ll) => [ll.lng, ll.lat]);
    // Close the polygon
    if (coordinates.length > 0) {
      coordinates.push(coordinates[0]);
    }

    return {
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates],
      },
    };
  }

  if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
    const latLngs = layer.getLatLngs() as L.LatLng[];
    const coordinates: Position[] = latLngs.map((ll) => [ll.lng, ll.lat]);

    return {
      geometry: {
        type: 'LineString',
        coordinates,
      },
    };
  }

  return null;
};

export const useDrawing = (): UseDrawingReturn => {
  const { addFeature, updateFeature, removeFeature, setError, canAddFeature, addToast } =
    useFeatureStore();
  const { validateNewPolygon, validateEditedPolygon } = useOverlapValidation();

  const layerToFeatureMap = useRef<LayerToFeatureMap>(new Map());
  const featureGroupRef = useRef<FeatureGroup | null>(null);

  const registerLayer = useCallback((layer: L.Layer, featureId: string) => {
    const leafletId = L.Util.stamp(layer);
    layerToFeatureMap.current.set(leafletId, featureId);
  }, []);

  const handleCreated = useCallback(
    (layer: L.Layer, layerType: string) => {
      const shapeType = mapLayerTypeToShapeType(layerType);

      if (!canAddFeature(shapeType)) {
        setError(`Maximum limit reached for ${shapeType}s.`);
        addToast('error', `Limit reached: Maximum ${shapeType}s allowed.`);
        if (featureGroupRef.current) {
          featureGroupRef.current.removeLayer(layer);
        }
        return;
      }

      const extracted = extractGeometryFromLayer(layer, layerType);
      if (!extracted) {
        setError('Failed to extract geometry from drawn shape.');
        addToast('error', 'Failed to create shape. Please try again.');
        return;
      }

      let finalGeometry = extracted.geometry;
      let wasTrimmed = false;

      // Validate polygonal shapes for overlaps
      if (isPolygonalShape(shapeType)) {
        const validation = validateNewPolygon(finalGeometry, shapeType);

        if (!validation.isValid) {
          setError(validation.error || 'Invalid polygon placement.');
          addToast('error', validation.error || 'Cannot place polygon here due to overlap.');
          if (featureGroupRef.current) {
            featureGroupRef.current.removeLayer(layer);
          }
          return;
        }

        // Use trimmed geometry if overlap was auto-corrected
        if (validation.trimmedGeometry) {
          finalGeometry = validation.trimmedGeometry;
          wasTrimmed = true;
          setError(null);
        }
      }

      const featureId = addFeature(
        finalGeometry,
        shapeType,
        extracted.additionalProps
      );

      if (featureId) {
        registerLayer(layer, featureId);
        setError(null);
        
        // Show success toast with trimming info if applicable
        if (wasTrimmed) {
          addToast('warning', 'Shape was auto-trimmed to avoid overlap with existing polygons.');
        } else {
          addToast('success', `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} created successfully.`);
        }
      }
    },
    [addFeature, canAddFeature, registerLayer, setError, validateNewPolygon, addToast]
  );

  const handleEdited = useCallback(
    (layers: L.LayerGroup) => {
      let editCount = 0;
      
      layers.eachLayer((layer: L.Layer) => {
        const leafletId = L.Util.stamp(layer);
        const featureId = layerToFeatureMap.current.get(leafletId);

        if (!featureId) return;

        const features = useFeatureStore.getState().features;
        const feature = features.find((f: GeoFeature) => f.id === featureId);
        if (!feature) return;

        let layerType: string;
        if (layer instanceof L.Circle) {
          layerType = 'circle';
        } else if (layer instanceof L.Rectangle) {
          layerType = 'rectangle';
        } else if (layer instanceof L.Polygon) {
          layerType = 'polygon';
        } else {
          layerType = 'polyline';
        }

        const extracted = extractGeometryFromLayer(layer, layerType);
        if (!extracted) return;

        let finalGeometry = extracted.geometry;

        if (isPolygonalShape(feature.shapeType)) {
          const validation = validateEditedPolygon(
            finalGeometry,
            feature.shapeType,
            featureId
          );

          if (!validation.isValid) {
            setError(validation.error || 'Invalid edit - overlap detected.');
            addToast('error', validation.error || 'Edit rejected due to overlap.');
            return;
          }

          if (validation.trimmedGeometry) {
            finalGeometry = validation.trimmedGeometry;
            addToast('warning', 'Shape was auto-trimmed after edit.');
          }
        }

        updateFeature(featureId, finalGeometry);
        editCount++;
      });
      
      if (editCount > 0) {
        setError(null);
        addToast('success', `${editCount} shape(s) updated successfully.`);
      }
    },
    [updateFeature, setError, validateEditedPolygon, addToast]
  );

  const handleDeleted = useCallback(
    (layers: L.LayerGroup) => {
      let deleteCount = 0;
      
      layers.eachLayer((layer: L.Layer) => {
        const leafletId = L.Util.stamp(layer);
        const featureId = layerToFeatureMap.current.get(leafletId);

        if (featureId) {
          removeFeature(featureId);
          layerToFeatureMap.current.delete(leafletId);
          deleteCount++;
        }
      });
      
      setError(null);
      if (deleteCount > 0) {
        addToast('info', `${deleteCount} shape(s) deleted.`);
      }
    },
    [removeFeature, setError, addToast]
  );

  useEffect(() => {
    return () => {
      layerToFeatureMap.current.clear();
    };
  }, []);

  return {
    handleCreated,
    handleEdited,
    handleDeleted,
    registerLayer,
    layerToFeatureMap,
    featureGroupRef,
  };
};
