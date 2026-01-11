import React, { useCallback, useRef } from 'react';
import type { FeatureCollection, Feature, Geometry } from 'geojson';
import { useFeatureStore } from '../store/featureStore';
import { useOverlapValidation } from '../hooks/useOverlapValidation';
import { isPolygonalShape } from '../utils/polygonUtils';
import { generateFeatureId } from '../utils/geojson';
import type { GeoFeature, ShapeType, FeatureProperties } from '../types/geometry';
import { shapeLimits } from '../config/shapeLimits';

const detectShapeType = (geometry: Geometry): ShapeType | null => {
  switch (geometry.type) {
    case 'Polygon':
      return 'polygon';
    case 'LineString':
      return 'line';
    case 'MultiPolygon':
      return 'polygon';
    default:
      return null;
  }
};

export const ImportButton: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast, features, importFeatures, getFeatureCount } = useFeatureStore();
  const { validateNewPolygon } = useOverlapValidation();

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.name.endsWith('.geojson') && !file.name.endsWith('.json')) {
        addToast('error', 'Please select a valid GeoJSON file (.geojson or .json)');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const geojson = JSON.parse(content) as FeatureCollection | Feature;

          let featuresToImport: Feature[] = [];

          if (geojson.type === 'FeatureCollection') {
            featuresToImport = geojson.features;
          } else if (geojson.type === 'Feature') {
            featuresToImport = [geojson];
          } else {
            addToast('error', 'Invalid GeoJSON format. Expected Feature or FeatureCollection.');
            return;
          }

          const importedFeatures: GeoFeature[] = [];
          let skippedCount = 0;
          let trimmedCount = 0;

          for (const feature of featuresToImport) {
            if (!feature.geometry) {
              skippedCount++;
              continue;
            }

            const shapeType = detectShapeType(feature.geometry);
            if (!shapeType) {
              skippedCount++;
              continue;
            }

            // Check shape limits
            const currentCount = getFeatureCount(shapeType) + 
              importedFeatures.filter(f => f.shapeType === shapeType).length;
            
            if (currentCount >= shapeLimits[shapeType]) {
              skippedCount++;
              continue;
            }

            let finalGeometry = feature.geometry;

            // Validate polygonal shapes for overlaps
            if (isPolygonalShape(shapeType)) {
              const validation = validateNewPolygon(finalGeometry, shapeType);

              if (!validation.isValid) {
                skippedCount++;
                continue;
              }

              if (validation.trimmedGeometry) {
                finalGeometry = validation.trimmedGeometry;
                trimmedCount++;
              }
            }

            const id = generateFeatureId();
            const existingName = feature.properties?.name as string | undefined;
            const name = existingName || `Imported-${shapeType}-${importedFeatures.length + 1}`;

            const newFeature: GeoFeature = {
              id,
              geometry: finalGeometry,
              shapeType,
              properties: {
                id,
                shapeType,
                createdAt: Date.now(),
                name,
                ...(feature.properties as Partial<FeatureProperties>),
              },
            };

            importedFeatures.push(newFeature);
          }

          if (importedFeatures.length > 0) {
            importFeatures(importedFeatures);
            
            let message = `Successfully imported ${importedFeatures.length} feature(s).`;
            if (trimmedCount > 0) {
              message += ` ${trimmedCount} were trimmed to avoid overlaps.`;
            }
            if (skippedCount > 0) {
              message += ` ${skippedCount} were skipped.`;
            }
            
            addToast('success', message);
          } else {
            addToast('warning', 'No valid features found to import.');
          }
        } catch (error) {
          console.error('Import error:', error);
          addToast('error', 'Failed to parse GeoJSON file. Please check the format.');
        }
      };

      reader.onerror = () => {
        addToast('error', 'Failed to read file.');
      };

      reader.readAsText(file);

      // Reset input to allow re-importing same file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [addToast, features, importFeatures, getFeatureCount, validateNewPolygon]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".geojson,.json"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <button
        onClick={handleClick}
        className="import-button"
        title="Import GeoJSON file"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        Import GeoJSON
      </button>
    </>
  );
};
