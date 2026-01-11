import React, { useMemo } from 'react';
import { useFeatureStore } from '../store/featureStore';

const formatArea = (area: number | undefined): string => {
  if (!area) return 'N/A';
  if (area < 10000) {
    return `${area.toFixed(2)} m²`;
  }
  if (area < 1000000) {
    return `${(area / 10000).toFixed(2)} ha`;
  }
  return `${(area / 1000000).toFixed(2)} km²`;
};

const formatLength = (length: number | undefined): string => {
  if (!length) return 'N/A';
  if (length < 1) {
    return `${(length * 1000).toFixed(0)} m`;
  }
  return `${length.toFixed(2)} km`;
};

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

export const FeatureInfo: React.FC = () => {
  const features = useFeatureStore((state) => state.features);
  const selectedFeatureId = useFeatureStore((state) => state.selectedFeatureId);
  const selectFeature = useFeatureStore((state) => state.selectFeature);

  const selectedFeature = useMemo(() => {
    return features.find((f) => f.id === selectedFeatureId);
  }, [features, selectedFeatureId]);

  if (!selectedFeature) {
    return (
      <div className="feature-info">
        <div className="feature-info-empty">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p>Select a shape to view details</p>
        </div>
      </div>
    );
  }

  const { properties, shapeType, geometry } = selectedFeature;

  return (
    <div className="feature-info">
      <div className="feature-info-header">
        <h4>{properties.name || 'Unnamed Shape'}</h4>
        <button
          className="feature-info-close"
          onClick={() => selectFeature(null)}
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="feature-info-content">
        <div className="feature-info-row">
          <span className="feature-info-label">Type</span>
          <span className="feature-info-value">
            {shapeType.charAt(0).toUpperCase() + shapeType.slice(1)}
          </span>
        </div>

        {shapeType !== 'line' && (
          <div className="feature-info-row">
            <span className="feature-info-label">Area</span>
            <span className="feature-info-value">{formatArea(properties.area)}</span>
          </div>
        )}

        {shapeType === 'line' && (
          <div className="feature-info-row">
            <span className="feature-info-label">Length</span>
            <span className="feature-info-value">{formatLength(properties.length)}</span>
          </div>
        )}

        {shapeType === 'circle' && properties.radius && (
          <div className="feature-info-row">
            <span className="feature-info-label">Radius</span>
            <span className="feature-info-value">
              {properties.radius >= 1000
                ? `${(properties.radius / 1000).toFixed(2)} km`
                : `${properties.radius.toFixed(0)} m`}
            </span>
          </div>
        )}

        <div className="feature-info-row">
          <span className="feature-info-label">Geometry</span>
          <span className="feature-info-value">{geometry.type}</span>
        </div>

        <div className="feature-info-row">
          <span className="feature-info-label">Created</span>
          <span className="feature-info-value">{formatDate(properties.createdAt)}</span>
        </div>

        <div className="feature-info-row">
          <span className="feature-info-label">ID</span>
          <span className="feature-info-value feature-info-id">{properties.id}</span>
        </div>
      </div>
    </div>
  );
};
