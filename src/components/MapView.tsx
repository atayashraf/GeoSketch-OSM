import { useEffect, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  FeatureGroup,
  useMap,
} from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { useDrawing } from '../hooks/useDrawing';

// Fix Leaflet default marker icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Default center: India
const INDIA_CENTER: [number, number] = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;

const MapEventHandler: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
  }, [map]);

  return null;
};

interface DrawControlsProps {
  onCreated: (layer: L.Layer, layerType: string) => void;
  onEdited: (layers: L.LayerGroup) => void;
  onDeleted: (layers: L.LayerGroup) => void;
  featureGroupRef: React.MutableRefObject<L.FeatureGroup | null>;
}

const DrawControls: React.FC<DrawControlsProps> = ({
  onCreated,
  onEdited,
  onDeleted,
  featureGroupRef,
}) => {
  const handleCreated = useCallback(
    (e: L.LeafletEvent) => {
      const event = e as unknown as { layer: L.Layer; layerType: string };
      onCreated(event.layer, event.layerType);
    },
    [onCreated]
  );

  const handleEdited = useCallback(
    (e: L.LeafletEvent) => {
      const event = e as unknown as { layers: L.LayerGroup };
      onEdited(event.layers);
    },
    [onEdited]
  );

  const handleDeleted = useCallback(
    (e: L.LeafletEvent) => {
      const event = e as unknown as { layers: L.LayerGroup };
      onDeleted(event.layers);
    },
    [onDeleted]
  );

  return (
    <FeatureGroup
      ref={(ref) => {
        featureGroupRef.current = ref;
      }}
    >
      <EditControl
        position="topright"
        onCreated={handleCreated}
        onEdited={handleEdited}
        onDeleted={handleDeleted}
        draw={{
          polygon: {
            allowIntersection: false,
            showArea: true,
            shapeOptions: {
              color: '#3388ff',
              weight: 2,
              fillOpacity: 0.3,
            },
          },
          rectangle: {
            shapeOptions: {
              color: '#ff7800',
              weight: 2,
              fillOpacity: 0.3,
            },
          },
          circle: {
            shapeOptions: {
              color: '#9c27b0',
              weight: 2,
              fillOpacity: 0.3,
            },
          },
          polyline: {
            shapeOptions: {
              color: '#4caf50',
              weight: 3,
            },
          },
          marker: false,
          circlemarker: false,
        }}
        edit={{
          featureGroup: featureGroupRef.current || undefined,
          remove: true,
        }}
      />
    </FeatureGroup>
  );
};

export const MapView: React.FC = () => {
  const {
    handleCreated,
    handleEdited,
    handleDeleted,
    featureGroupRef,
  } = useDrawing();

  return (
    <div className="map-container">
      <MapContainer
        center={INDIA_CENTER}
        zoom={DEFAULT_ZOOM}
        className="map"
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
        touchZoom={true}
        {...({ tap: false } as object)}
      >
        <MapEventHandler />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <DrawControls
          onCreated={handleCreated}
          onEdited={handleEdited}
          onDeleted={handleDeleted}
          featureGroupRef={featureGroupRef}
        />
      </MapContainer>
    </div>
  );
};
