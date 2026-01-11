/// <reference types="vite/client" />

declare module '*.png' {
  const value: string;
  export default value;
}

declare module 'leaflet/dist/images/marker-icon.png' {
  const value: string;
  export default value;
}

declare module 'leaflet/dist/images/marker-shadow.png' {
  const value: string;
  export default value;
}

declare module '@turf/turf' {
  export * from '@turf/helpers';
  export { default as circle } from '@turf/circle';
  export { default as area } from '@turf/area';
  export { default as bbox } from '@turf/bbox';
  export { default as length } from '@turf/length';
  export { default as intersect } from '@turf/intersect';
  export { default as difference } from '@turf/difference';
  export { polygon, multiPolygon, lineString, featureCollection } from '@turf/helpers';
}
