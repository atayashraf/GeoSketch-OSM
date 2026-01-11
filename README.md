# GeoSketch OSM

A production-ready web application for drawing, editing, validating, and exporting geographical features on OpenStreetMap tiles.

![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)
![Vite](https://img.shields.io/badge/Vite-5-purple)
![License](https://img.shields.io/badge/License-MIT-green)

## 🌟 Features

- **Interactive Map**: Full-screen responsive OpenStreetMap with smooth zoom and pan
- **Drawing Tools**: Create Polygons, Rectangles, Circles, and Lines
- **Spatial Validation**: Automatic polygon overlap detection and trimming
- **Shape Limits**: Configurable limits for each shape type
- **GeoJSON Export**: One-click export of all features as valid GeoJSON
- **GeoJSON Import**: Upload and validate GeoJSON files with automatic shape detection
- **Edit & Delete**: Modify or remove existing shapes
- **Undo/Redo**: Full history support with keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z)
- **Auto-Persistence**: Features saved to localStorage and restored on reload
- **Shape Metadata**: Auto-naming, area/length calculation for each feature
- **Toast Notifications**: Real-time feedback for all user actions
- **Keyboard Shortcuts**: Ctrl+Z (undo), Ctrl+Shift+Z (redo), Ctrl+E (export)

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| TypeScript (Strict) | Type Safety |
| Vite | Build Tool |
| Leaflet | Map Rendering |
| React-Leaflet | React Integration |
| Leaflet Draw | Drawing Tools |
| Turf.js | Spatial Operations |
| Zustand | State Management |
| ESLint + Prettier | Code Quality |

## 📁 Project Structure

```
src/
├── components/
│   ├── MapView.tsx        # Main map component with drawing controls
│   ├── Toolbar.tsx        # Side panel with shape counts, undo/redo & feature list
│   ├── ExportButton.tsx   # GeoJSON export button
│   ├── ImportButton.tsx   # GeoJSON import with validation
│   ├── FeatureInfo.tsx    # Selected feature metadata display
│   └── Toast.tsx          # Toast notification system
├── hooks/
│   ├── useDrawing.ts      # Drawing event handlers & layer management
│   └── useOverlapValidation.ts # Polygon overlap validation with caching
├── store/
│   └── featureStore.ts    # Zustand state with history & persistence
├── utils/
│   ├── geojson.ts         # GeoJSON utilities & export
│   └── polygonUtils.ts    # Polygon operations with Turf.js
├── config/
│   └── shapeLimits.ts     # Configurable shape limits
├── types/
│   └── geometry.ts        # TypeScript type definitions
├── App.tsx                # Main application component
├── App.css                # Application styles
└── main.tsx              # Entry point
```

## 🚀 Setup & Run Instructions

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/atayashraf/GeoSketch-OSM.git
cd GeoSketch-OSM

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
npm run format   # Format code with Prettier
```

## 🔷 Polygon Overlap Handling

The application implements sophisticated spatial validation for polygonal shapes (Polygon, Rectangle, Circle):

### Validation Rules

1. **No Full Containment**: 
   - A new polygon cannot be fully contained within an existing polygon
   - A new polygon cannot fully contain an existing polygon
   - Both cases result in an error message

2. **Auto-Trimming for Partial Overlap**:
   - When a new polygon partially overlaps with existing polygons, it is automatically trimmed
   - Uses `turf.difference()` to subtract overlapping areas
   - The resulting non-overlapping portion is saved

3. **Line Exemption**:
   - LineStrings are exempt from overlap validation
   - Lines can freely cross polygons and other lines

### Implementation Details

```typescript
// Validation flow in polygonUtils.ts
1. Convert the new shape to a polygon (circles → 64-segment polygon)
2. For each existing polygonal feature:
   a. Calculate intersection using turf.intersect()
   b. Check containment ratios (>99% = full containment)
   c. If partial overlap, apply turf.difference()
3. Return trimmed geometry or error
```

## 📊 Sample GeoJSON Output

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [78.9629, 20.5937],
            [79.5, 20.5937],
            [79.5, 21.0],
            [78.9629, 21.0],
            [78.9629, 20.5937]
          ]
        ]
      },
      "properties": {
        "id": "feature-1704067200000-abc123",
        "shapeType": "rectangle",
        "createdAt": 1704067200000
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          // 64-point circle approximation
        ]
      },
      "properties": {
        "id": "feature-1704067300000-def456",
        "shapeType": "circle",
        "createdAt": 1704067300000,
        "radius": 50000,
        "center": [77.5946, 12.9716]
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [72.8777, 19.076],
          [77.1025, 28.7041],
          [88.3639, 22.5726]
        ]
      },
      "properties": {
        "id": "feature-1704067400000-ghi789",
        "shapeType": "line",
        "createdAt": 1704067400000
      }
    }
  ]
}
```

## ⚙️ Configuration

### Shape Limits

Edit `src/config/shapeLimits.ts` to adjust limits:

```typescript
export const shapeLimits: ShapeLimits = {
  polygon: 10,    // Maximum 10 polygons
  rectangle: 5,   // Maximum 5 rectangles
  circle: 5,      // Maximum 5 circles
  line: 20,       // Maximum 20 lines
};
```

### Map Configuration

Edit the constants in `src/components/MapView.tsx`:

```typescript
const INDIA_CENTER: [number, number] = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;
```

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

This creates a `dist/` folder with optimized static files.

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Netlify

1. Push code to GitHub
2. Connect repository to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`

### Deploy to GitHub Pages

```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
"deploy": "npm run build && gh-pages -d dist"

# Deploy
npm run deploy
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build and run
docker build -t geosketch-osm .
docker run -p 8080:80 geosketch-osm
```

## � Design Decisions

### Why Turf.js for Spatial Operations

**Decision**: Use Turf.js as the primary library for all spatial computations.

**Rationale**:
1. **GeoJSON Native**: Turf.js works directly with GeoJSON, which is our data format. No conversion needed between library formats.
2. **Comprehensive API**: Provides `intersect()`, `difference()`, `area()`, `length()`, `circle()`, and `booleanContains()` — all essential for our overlap validation and metadata calculations.
3. **Browser-Friendly**: Pure JavaScript with no native dependencies. Works reliably in all browsers without WASM or WebGL requirements.
4. **Well-Maintained**: Part of the Mapbox ecosystem with active maintenance, extensive documentation, and widespread community adoption.
5. **Modular**: Tree-shakeable ES modules mean we only bundle what we use, keeping the final bundle size reasonable.

**Alternatives Considered**:
- **JSTS (JavaScript Topology Suite)**: More powerful but significantly larger bundle size and steeper learning curve.
- **OpenLayers Built-ins**: Would require switching map libraries entirely.

---

### Why Zustand for State Management

**Decision**: Use Zustand instead of Redux, Context API, or other state management solutions.

**Rationale**:
1. **Minimal Boilerplate**: No providers, reducers, or action creators. Define state and actions in a single store file.
2. **TypeScript-First**: Excellent TypeScript support with full type inference. Our strict mode configuration works seamlessly.
3. **Built-in Middleware**: Native support for `persist` (localStorage) and `devtools` (Redux DevTools) without additional packages.
4. **Selective Subscriptions**: Components only re-render when their specific subscribed state changes, improving performance for our feature-heavy map.
5. **Small Bundle**: ~1KB minified — trivial addition to bundle size.
6. **History Support**: Easy to implement undo/redo with simple past/present/future arrays.

**Implementation Pattern**:
```typescript
// Our store supports history with minimal code
interface HistoryState {
  past: Feature[][];
  present: Feature[];
  future: Feature[][];
}

const pushToHistory = (state: State) => ({
  past: [...state.past, state.present].slice(-50),
  future: [],
});
```

**Alternatives Considered**:
- **Redux Toolkit**: More complex setup, overkill for our scope.
- **Context + useReducer**: Performance issues with frequent map updates.
- **Jotai/Recoil**: Atomic model less suited to our feature collection pattern.

---

### How Polygon Trimming Prevents Invalid Geometries

**Decision**: Automatically trim overlapping portions rather than rejecting new shapes outright.

**Rationale**:
1. **Better UX**: Users don't lose their work when polygons partially overlap. The valid portion is preserved.
2. **Predictable Behavior**: Users learn that overlaps are handled gracefully, encouraging experimentation.
3. **Clean Data**: Exported GeoJSON never contains overlapping polygons, ensuring data integrity for downstream systems.

**Implementation Flow**:
```
User draws polygon → Convert to Turf polygon → For each existing polygon:
  ├── Check intersection exists?
  │     ├── No → Continue to next
  │     └── Yes → Calculate overlap ratio
  │           ├── >99% overlap → Error (full containment)
  │           └── <99% overlap → Apply turf.difference()
  └── Final result = original minus all intersections
```

**Edge Cases Handled**:
- **Circle Conversion**: Circles are converted to 64-segment polygons for accurate intersection calculations.
- **MultiPolygon Results**: When `difference()` produces a MultiPolygon (shape split by overlap), we preserve the largest polygon.
- **Geometry Collapse**: If trimming would eliminate the shape entirely (area → 0), we reject with an error message.

**Visual Feedback**:
- Toast notification explains when trimming occurred
- Area calculation shows the final (trimmed) size
- User can undo if the result isn't what they wanted

---

### Why LineStrings Are Excluded from Overlap Rules

**Decision**: Lines (LineStrings) can freely intersect with polygons and other lines without validation or trimming.

**Rationale**:
1. **Dimensional Difference**: Lines are 1D features; polygons are 2D. A line crossing a polygon doesn't "occupy" the same space — it's a different kind of spatial relationship.
2. **Common Use Cases**: Lines typically represent routes, boundaries, or connections that naturally cross polygon areas (roads crossing parks, rivers through cities).
3. **No Meaningful Trim**: Unlike polygon-polygon overlaps where you can subtract area, there's no intuitive way to "trim" a line that crosses a polygon.
4. **Performance**: Validating line-polygon intersections for every line segment would significantly slow down drawing operations with minimal benefit.

**Implementation**:
```typescript
// In useOverlapValidation.ts
const needsValidation = (shapeType: ShapeType): boolean => {
  return shapeType !== 'line';
};
```

**User Expectation**: Lines behave like annotation layers that sit "above" the polygon layer, which matches common GIS application behavior.

---

### Persistence Strategy

**Decision**: Use Zustand's `persist` middleware with localStorage for automatic save/restore.

**Rationale**:
1. **Zero Configuration**: Works immediately without backend setup.
2. **Instant Restore**: Features appear instantly on page load (no loading spinner needed).
3. **Offline-Ready**: Data persists even without network connectivity.
4. **Selective Persistence**: Only `present` features are persisted, not the entire history stack (keeps storage reasonable).

**Storage Format**:
```json
{
  "state": {
    "present": [/* GeoJSON Features */],
    "selectedFeatureId": null
  },
  "version": 0
}
```

**Limitations & Mitigations**:
- **5MB localStorage limit**: Unlikely to hit with typical usage, but we could add IndexedDB fallback if needed.
- **No cross-device sync**: Documented as a local-only feature; cloud sync would require backend integration.

## �🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenStreetMap](https://www.openstreetmap.org/) for free map tiles
- [Leaflet](https://leafletjs.com/) for the mapping library
- [Turf.js](https://turfjs.org/) for spatial operations
