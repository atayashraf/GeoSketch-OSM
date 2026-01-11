import React from 'react';
import { useFeatureStore } from '../store/featureStore';
import { shapeLimits } from '../config/shapeLimits';
import type { ShapeType } from '../types/geometry';
import { FeatureInfo } from './FeatureInfo';

interface ShapeCountProps {
  shapeType: ShapeType;
  icon: React.ReactNode;
  label: string;
}

const ShapeCount: React.FC<ShapeCountProps> = ({ shapeType, icon, label }) => {
  const count = useFeatureStore((state) =>
    state.features.filter((f) => f.shapeType === shapeType).length
  );
  const limit = shapeLimits[shapeType];
  const isAtLimit = count >= limit;

  return (
    <div className={`shape-count ${isAtLimit ? 'at-limit' : ''}`}>
      <span className="shape-icon">{icon}</span>
      <span className="shape-label">{label}</span>
      <span className="shape-counter">
        {count}/{limit}
      </span>
    </div>
  );
};

const UndoRedoButtons: React.FC = () => {
  const undo = useFeatureStore((state) => state.undo);
  const redo = useFeatureStore((state) => state.redo);
  const canUndo = useFeatureStore((state) => state.canUndo);
  const canRedo = useFeatureStore((state) => state.canRedo);

  return (
    <div className="undo-redo-buttons">
      <button
        onClick={undo}
        disabled={!canUndo()}
        className="undo-redo-btn"
        title="Undo (Ctrl+Z)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 7v6h6" />
          <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
        </svg>
        Undo
      </button>
      <button
        onClick={redo}
        disabled={!canRedo()}
        className="undo-redo-btn"
        title="Redo (Ctrl+Y)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 7v6h-6" />
          <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
        </svg>
        Redo
      </button>
    </div>
  );
};

const FeatureList: React.FC = () => {
  const features = useFeatureStore((state) => state.features);
  const selectedFeatureId = useFeatureStore((state) => state.selectedFeatureId);
  const selectFeature = useFeatureStore((state) => state.selectFeature);

  if (features.length === 0) return null;

  return (
    <div className="feature-list">
      <h3>Features ({features.length})</h3>
      <ul>
        {features.map((feature) => (
          <li
            key={feature.id}
            className={`feature-list-item ${selectedFeatureId === feature.id ? 'selected' : ''}`}
            onClick={() => selectFeature(feature.id)}
          >
            <span className={`feature-type-badge ${feature.shapeType}`}>
              {feature.shapeType.charAt(0).toUpperCase()}
            </span>
            <span className="feature-name">{feature.properties.name || 'Unnamed'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const Toolbar: React.FC = () => {
  const error = useFeatureStore((state) => state.error);
  const clearFeatures = useFeatureStore((state) => state.clearFeatures);
  const features = useFeatureStore((state) => state.features);

  return (
    <div className="toolbar">
      <div className="toolbar-header">
        <h2>GeoSketch OSM</h2>
        <p className="toolbar-subtitle">Draw & Export GeoJSON</p>
      </div>

      <div className="toolbar-section">
        <h3>Shape Limits</h3>
        <div className="shape-counts">
          <ShapeCount
            shapeType="polygon"
            icon={
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
              </svg>
            }
            label="Polygon"
          />
          <ShapeCount
            shapeType="rectangle"
            icon={
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <rect x="3" y="5" width="18" height="14" />
              </svg>
            }
            label="Rectangle"
          />
          <ShapeCount
            shapeType="circle"
            icon={
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <circle cx="12" cy="12" r="10" />
              </svg>
            }
            label="Circle"
          />
          <ShapeCount
            shapeType="line"
            icon={
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                width="16"
                height="16"
              >
                <line x1="3" y1="21" x2="21" y2="3" />
              </svg>
            }
            label="Line"
          />
        </div>
      </div>

      {error && (
        <div className="toolbar-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="toolbar-section">
        <h3>Instructions</h3>
        <ul className="instructions-list">
          <li>Use the drawing tools on the map to create shapes</li>
          <li>Polygons cannot overlap - they will be auto-trimmed</li>
          <li>Lines can overlap freely</li>
          <li>Click Edit to modify existing shapes</li>
          <li>Click Delete to remove shapes</li>
        </ul>
      </div>

      <div className="toolbar-section">
        <h3>History</h3>
        <UndoRedoButtons />
      </div>

      <FeatureList />
      
      <FeatureInfo />

      {features.length > 0 && (
        <div className="toolbar-section">
          <button onClick={clearFeatures} className="clear-button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Clear All Shapes
          </button>
        </div>
      )}

      <div className="toolbar-footer">
        <p>Total Features: {features.length}</p>
        <p className="storage-note">Data auto-saved to browser</p>
      </div>
    </div>
  );
};
