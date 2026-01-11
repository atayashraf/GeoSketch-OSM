import { create } from 'zustand';
import { devtools, subscribeWithSelector, persist } from 'zustand/middleware';
import type { Geometry } from 'geojson';
import type { GeoFeature, ShapeType, FeatureProperties } from '../types/geometry';
import { generateFeatureId } from '../utils/geojson';
import { shapeLimits } from '../config/shapeLimits';
import { calculateArea, calculateLength } from '../utils/polygonUtils';

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// History state for undo/redo
interface HistoryState {
  past: GeoFeature[][];
  present: GeoFeature[];
  future: GeoFeature[][];
}

interface FeatureState {
  features: GeoFeature[];
  selectedFeatureId: string | null;
  error: string | null;
  toasts: ToastMessage[];
  history: HistoryState;
  shapeCounts: Record<ShapeType, number>;
}

interface FeatureActions {
  addFeature: (
    geometry: Geometry,
    shapeType: ShapeType,
    additionalProps?: Partial<FeatureProperties>
  ) => string | null;
  updateFeature: (id: string, geometry: Geometry) => void;
  removeFeature: (id: string) => void;
  selectFeature: (id: string | null) => void;
  clearFeatures: () => void;
  setError: (error: string | null) => void;
  getFeaturesByType: (shapeType: ShapeType) => GeoFeature[];
  getFeatureCount: (shapeType: ShapeType) => number;
  canAddFeature: (shapeType: ShapeType) => boolean;
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  setFeatures: (features: GeoFeature[]) => void;
  importFeatures: (features: GeoFeature[]) => void;
}

type FeatureStore = FeatureState & FeatureActions;

const MAX_HISTORY_LENGTH = 50;

const generateToastId = (): string => {
  return `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
};

// Generate auto-incrementing name for shapes
const generateShapeName = (shapeType: ShapeType, count: number): string => {
  const prefix = shapeType.charAt(0).toUpperCase() + shapeType.slice(1);
  return `${prefix}-${count + 1}`;
};

// Calculate metadata based on shape type
const calculateMetadata = (
  geometry: Geometry,
  shapeType: ShapeType
): { area?: number; length?: number } => {
  if (shapeType === 'line') {
    return { length: calculateLength(geometry) };
  }
  return { area: calculateArea(geometry) };
};

// Helper to push current state to history
const pushToHistory = (history: HistoryState, newPresent: GeoFeature[]): HistoryState => {
  const newPast = [...history.past, history.present].slice(-MAX_HISTORY_LENGTH);
  return {
    past: newPast,
    present: newPresent,
    future: [], // Clear future when new action is performed
  };
};

export const useFeatureStore = create<FeatureStore>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        features: [],
        selectedFeatureId: null,
        error: null,
        toasts: [],
        history: {
          past: [],
          present: [],
          future: [],
        },
        shapeCounts: {
          polygon: 0,
          rectangle: 0,
          circle: 0,
          line: 0,
        },

        addFeature: (geometry, shapeType, additionalProps = {}) => {
          const state = get();
          const currentCount = state.features.filter(
            (f) => f.shapeType === shapeType
          ).length;

          if (currentCount >= shapeLimits[shapeType]) {
            const toastId = generateToastId();
            set((state) => ({
              error: `Maximum ${shapeLimits[shapeType]} ${shapeType}(s) allowed. Limit reached.`,
              toasts: [
                ...state.toasts,
                {
                  id: toastId,
                  type: 'error',
                  message: `Limit reached: Maximum ${shapeLimits[shapeType]} ${shapeType}(s) allowed.`,
                  duration: 4000,
                },
              ],
            }));
            return null;
          }

          const id = generateFeatureId();
          const name = generateShapeName(shapeType, currentCount);
          const metadata = calculateMetadata(geometry, shapeType);

          const newFeature: GeoFeature = {
            id,
            geometry,
            shapeType,
            properties: {
              id,
              shapeType,
              createdAt: Date.now(),
              name,
              ...metadata,
              ...additionalProps,
            },
          };

          const newFeatures = [...state.features, newFeature];

          set((state) => ({
            features: newFeatures,
            error: null,
            history: pushToHistory(state.history, newFeatures),
            shapeCounts: {
              ...state.shapeCounts,
              [shapeType]: state.shapeCounts[shapeType] + 1,
            },
          }));

          return id;
        },

        updateFeature: (id, geometry) => {
          const state = get();
          const feature = state.features.find((f) => f.id === id);
          if (!feature) return;

          const metadata = calculateMetadata(geometry, feature.shapeType);
          const newFeatures = state.features.map((f) =>
            f.id === id
              ? {
                  ...f,
                  geometry,
                  properties: { ...f.properties, ...metadata },
                }
              : f
          );

          set((state) => ({
            features: newFeatures,
            history: pushToHistory(state.history, newFeatures),
          }));
        },

        removeFeature: (id) => {
          const state = get();
          const newFeatures = state.features.filter((f) => f.id !== id);

          set((state) => ({
            features: newFeatures,
            selectedFeatureId:
              state.selectedFeatureId === id ? null : state.selectedFeatureId,
            history: pushToHistory(state.history, newFeatures),
          }));
        },

        selectFeature: (id) => {
          set({ selectedFeatureId: id });
        },

        clearFeatures: () => {
          const state = get();
          set({
            features: [],
            selectedFeatureId: null,
            error: null,
            history: pushToHistory(state.history, []),
            shapeCounts: { polygon: 0, rectangle: 0, circle: 0, line: 0 },
          });
        },

        setError: (error) => {
          set({ error });
        },

        getFeaturesByType: (shapeType) => {
          return get().features.filter((f) => f.shapeType === shapeType);
        },

        getFeatureCount: (shapeType) => {
          return get().features.filter((f) => f.shapeType === shapeType).length;
        },

        canAddFeature: (shapeType) => {
          const count = get().getFeatureCount(shapeType);
          return count < shapeLimits[shapeType];
        },

        addToast: (type, message, duration = 4000) => {
          const id = generateToastId();
          set((state) => ({
            toasts: [...state.toasts, { id, type, message, duration }],
          }));
        },

        removeToast: (id) => {
          set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
          }));
        },

        undo: () => {
          const state = get();
          if (state.history.past.length === 0) return;

          const previous = state.history.past[state.history.past.length - 1];
          const newPast = state.history.past.slice(0, -1);

          set({
            features: previous,
            history: {
              past: newPast,
              present: previous,
              future: [state.features, ...state.history.future],
            },
          });
        },

        redo: () => {
          const state = get();
          if (state.history.future.length === 0) return;

          const next = state.history.future[0];
          const newFuture = state.history.future.slice(1);

          set({
            features: next,
            history: {
              past: [...state.history.past, state.features],
              present: next,
              future: newFuture,
            },
          });
        },

        canUndo: () => {
          return get().history.past.length > 0;
        },

        canRedo: () => {
          return get().history.future.length > 0;
        },

        setFeatures: (features) => {
          set((state) => ({
            features,
            history: pushToHistory(state.history, features),
          }));
        },

        importFeatures: (features) => {
          const state = get();
          const newFeatures = [...state.features, ...features];
          set({
            features: newFeatures,
            history: pushToHistory(state.history, newFeatures),
          });
        },
      })),
      {
        name: 'geosketch-storage',
        partialize: (state) => ({
          features: state.features,
          shapeCounts: state.shapeCounts,
        }),
      }
    ),
    { name: 'feature-store' }
  )
);

export const useFeatures = () => useFeatureStore((state) => state.features);
export const useSelectedFeatureId = () =>
  useFeatureStore((state) => state.selectedFeatureId);
export const useError = () => useFeatureStore((state) => state.error);
