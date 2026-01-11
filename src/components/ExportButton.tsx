import React from 'react';
import { useFeatures } from '../store/featureStore';
import { downloadGeoJSON } from '../utils/geojson';

export const ExportButton: React.FC = () => {
  const features = useFeatures();

  const handleExport = () => {
    if (features.length === 0) {
      alert('No features to export. Draw some shapes first!');
      return;
    }
    downloadGeoJSON(features);
  };

  return (
    <button
      onClick={handleExport}
      className="export-button"
      disabled={features.length === 0}
      title={
        features.length === 0
          ? 'Draw shapes to enable export'
          : `Export ${features.length} feature(s)`
      }
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
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Export GeoJSON ({features.length})
    </button>
  );
};
