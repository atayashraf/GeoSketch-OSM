declare module 'react-leaflet-draw' {
  import { ControlPosition, FeatureGroup as LeafletFeatureGroup, LeafletEvent } from 'leaflet';
  import { FC } from 'react';

  interface DrawOptions {
    polygon?: boolean | {
      allowIntersection?: boolean;
      showArea?: boolean;
      shapeOptions?: {
        color?: string;
        weight?: number;
        fillOpacity?: number;
      };
    };
    rectangle?: boolean | {
      shapeOptions?: {
        color?: string;
        weight?: number;
        fillOpacity?: number;
      };
    };
    circle?: boolean | {
      shapeOptions?: {
        color?: string;
        weight?: number;
        fillOpacity?: number;
      };
    };
    polyline?: boolean | {
      shapeOptions?: {
        color?: string;
        weight?: number;
      };
    };
    marker?: boolean;
    circlemarker?: boolean;
  }

  interface EditOptions {
    featureGroup?: LeafletFeatureGroup;
    remove?: boolean;
    edit?: boolean | object;
  }

  interface EditControlProps {
    position?: ControlPosition;
    draw?: DrawOptions;
    edit?: EditOptions;
    onCreated?: (e: LeafletEvent) => void;
    onEdited?: (e: LeafletEvent) => void;
    onDeleted?: (e: LeafletEvent) => void;
    onDrawStart?: (e: LeafletEvent) => void;
    onDrawStop?: (e: LeafletEvent) => void;
    onEditStart?: (e: LeafletEvent) => void;
    onEditStop?: (e: LeafletEvent) => void;
    onDeleteStart?: (e: LeafletEvent) => void;
    onDeleteStop?: (e: LeafletEvent) => void;
  }

  export const EditControl: FC<EditControlProps>;
}
