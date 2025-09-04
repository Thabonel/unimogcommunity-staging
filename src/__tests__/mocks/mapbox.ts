import { vi } from 'vitest';

// Mock Mapbox responses
export const mockDirectionsResponse = {
  routes: [{
    distance: 2543.7,
    duration: 420.5,
    geometry: {
      coordinates: [
        [6.6323, 46.5197],
        [6.6353, 46.5217],
        [6.6383, 46.5237],
        [6.6413, 46.5257],
        [6.6423, 46.5287]
      ],
      type: 'LineString'
    },
    legs: [{
      distance: 2543.7,
      duration: 420.5,
      summary: '',
      steps: [
        {
          distance: 847.9,
          duration: 140.2,
          geometry: {
            coordinates: [
              [6.6323, 46.5197],
              [6.6353, 46.5217],
              [6.6383, 46.5237]
            ],
            type: 'LineString'
          },
          name: 'Route de Lausanne',
          instruction: 'Head northeast on Route de Lausanne',
          maneuver: {
            type: 'depart',
            instruction: 'Head northeast on Route de Lausanne',
            location: [6.6323, 46.5197]
          }
        },
        {
          distance: 1695.8,
          duration: 280.3,
          geometry: {
            coordinates: [
              [6.6383, 46.5237],
              [6.6413, 46.5257],
              [6.6423, 46.5287]
            ],
            type: 'LineString'
          },
          name: 'Chemin des Alpes',
          instruction: 'Continue on Chemin des Alpes',
          maneuver: {
            type: 'continue',
            instruction: 'Continue on Chemin des Alpes',
            location: [6.6383, 46.5237]
          }
        }
      ]
    }],
    weight_name: 'routability',
    weight: 420.5
  }],
  waypoints: [
    {
      hint: 'mock-hint-1',
      distance: 0,
      name: 'Route de Lausanne',
      location: [6.6323, 46.5197]
    },
    {
      hint: 'mock-hint-2', 
      distance: 0,
      name: 'Chemin des Alpes',
      location: [6.6423, 46.5287]
    }
  ],
  code: 'Ok',
  uuid: 'mock-uuid-123'
};

export const mockGeocodingResponse = {
  type: 'FeatureCollection',
  query: ['geneva'],
  features: [
    {
      id: 'place.123',
      type: 'Feature',
      place_type: ['place'],
      relevance: 1,
      properties: {
        wikidata: 'Q71'
      },
      text: 'Geneva',
      place_name: 'Geneva, Switzerland',
      bbox: [6.0907, 46.1647, 6.2648, 46.2493],
      center: [6.1432, 46.2044],
      geometry: {
        type: 'Point',
        coordinates: [6.1432, 46.2044]
      },
      context: [
        {
          id: 'country.123',
          text: 'Switzerland'
        }
      ]
    }
  ],
  attribution: 'NOTICE: © 2024 Mapbox and its suppliers.'
};

export const mockIsochroneResponse = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        fill: '#bf4040',
        'fill-opacity': 0.33,
        color: '#bf4040',
        contour: 10
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [6.6223, 46.5097],
          [6.6323, 46.5097],
          [6.6423, 46.5197],
          [6.6423, 46.5297],
          [6.6323, 46.5397],
          [6.6223, 46.5297],
          [6.6223, 46.5097]
        ]]
      }
    }
  ]
};

export const mockElevationResponse = {
  results: [
    { elevation: 372 },
    { elevation: 385 },
    { elevation: 398 },
    { elevation: 410 },
    { elevation: 425 }
  ]
};

// Mock fetch for Mapbox API calls
export const mockMapboxFetch = vi.fn().mockImplementation((url: string) => {
  const urlString = url.toString();
  
  if (urlString.includes('directions/v5')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockDirectionsResponse)
    });
  }
  
  if (urlString.includes('geocoding/v5')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockGeocodingResponse)
    });
  }
  
  if (urlString.includes('isochrone/v1')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockIsochroneResponse)
    });
  }
  
  if (urlString.includes('elevation/v2')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockElevationResponse)
    });
  }
  
  // Default fallback
  return Promise.resolve({
    ok: false,
    status: 404,
    json: () => Promise.resolve({ error: 'Not found' })
  });
});

// Mock Mapbox GL JS Map
export const mockMapboxMap = {
  on: vi.fn(),
  off: vi.fn(),
  once: vi.fn(),
  addSource: vi.fn(),
  removeSource: vi.fn(),
  addLayer: vi.fn(),
  removeLayer: vi.fn(),
  getLayer: vi.fn(),
  getSource: vi.fn(),
  setData: vi.fn(),
  getCenter: vi.fn().mockReturnValue({ lng: 6.1432, lat: 46.2044 }),
  getZoom: vi.fn().mockReturnValue(10),
  setCenter: vi.fn(),
  setZoom: vi.fn(),
  fitBounds: vi.fn(),
  flyTo: vi.fn(),
  easeTo: vi.fn(),
  jumpTo: vi.fn(),
  getBounds: vi.fn().mockReturnValue({
    getNorth: () => 46.3,
    getSouth: () => 46.1,
    getEast: () => 6.3,
    getWest: () => 6.0
  }),
  project: vi.fn().mockReturnValue({ x: 100, y: 100 }),
  unproject: vi.fn().mockReturnValue({ lng: 6.1432, lat: 46.2044 }),
  queryRenderedFeatures: vi.fn().mockReturnValue([]),
  querySourceFeatures: vi.fn().mockReturnValue([]),
  resize: vi.fn(),
  remove: vi.fn(),
  loaded: vi.fn().mockReturnValue(true),
  areTilesLoaded: vi.fn().mockReturnValue(true),
  fire: vi.fn(),
  getContainer: vi.fn().mockReturnValue(document.createElement('div')),
  getCanvas: vi.fn().mockReturnValue(document.createElement('canvas')),
  getStyle: vi.fn().mockReturnValue({}),
  setStyle: vi.fn(),
  isStyleLoaded: vi.fn().mockReturnValue(true),
  addControl: vi.fn(),
  removeControl: vi.fn(),
  hasControl: vi.fn().mockReturnValue(false),
  // Add more methods as needed
  setPaintProperty: vi.fn(),
  setLayoutProperty: vi.fn(),
  getPaintProperty: vi.fn(),
  getLayoutProperty: vi.fn(),
  setFilter: vi.fn(),
  getFilter: vi.fn()
};

// Mock Mapbox GL JS constructor
export const MockMapboxGL = vi.fn().mockImplementation(() => mockMapboxMap);
MockMapboxGL.accessToken = 'pk.test-token';
MockMapboxGL.supported = vi.fn().mockReturnValue(true);

// Mock Mapbox controls
export const mockNavigationControl = {
  onAdd: vi.fn().mockReturnValue(document.createElement('div')),
  onRemove: vi.fn()
};

export const mockGeolocateControl = {
  onAdd: vi.fn().mockReturnValue(document.createElement('div')),
  onRemove: vi.fn(),
  trigger: vi.fn()
};

export const mockScaleControl = {
  onAdd: vi.fn().mockReturnValue(document.createElement('div')),
  onRemove: vi.fn()
};

// Utility functions for tests
export const mapboxTestUtils = {
  simulateMapLoad: () => {
    const loadCallback = mockMapboxMap.on.mock.calls
      .find(call => call[0] === 'load')?.[1];
    if (loadCallback) loadCallback();
  },
  
  simulateMapClick: (lngLat: { lng: number; lat: number }) => {
    const clickCallback = mockMapboxMap.on.mock.calls
      .find(call => call[0] === 'click')?.[1];
    if (clickCallback) clickCallback({ lngLat });
  },
  
  simulateSourceData: (sourceId: string) => {
    const sourceDataCallback = mockMapboxMap.on.mock.calls
      .find(call => call[0] === 'sourcedata')?.[1];
    if (sourceDataCallback) sourceDataCallback({ sourceId });
  },
  
  getLastAddedSource: () => {
    const lastCall = mockMapboxMap.addSource.mock.calls.slice(-1)[0];
    return lastCall ? { id: lastCall[0], data: lastCall[1] } : null;
  },
  
  getLastAddedLayer: () => {
    const lastCall = mockMapboxMap.addLayer.mock.calls.slice(-1)[0];
    return lastCall ? lastCall[0] : null;
  },
  
  resetMocks: () => {
    vi.clearAllMocks();
    Object.values(mockMapboxMap).forEach(fn => {
      if (typeof fn === 'function' && fn._isMockFunction) {
        fn.mockClear();
      }
    });
  }
};

// Setup global mocks
export const setupMapboxMocks = () => {
  // Mock global fetch for Mapbox API calls
  global.fetch = mockMapboxFetch;
  
  // Mock Mapbox GL
  vi.mock('mapbox-gl', () => ({
    default: MockMapboxGL,
    Map: MockMapboxGL,
    NavigationControl: vi.fn().mockImplementation(() => mockNavigationControl),
    GeolocateControl: vi.fn().mockImplementation(() => mockGeolocateControl),
    ScaleControl: vi.fn().mockImplementation(() => mockScaleControl),
    Marker: vi.fn().mockImplementation(() => ({
      setLngLat: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
      remove: vi.fn().mockReturnThis(),
      getElement: vi.fn().mockReturnValue(document.createElement('div'))
    })),
    Popup: vi.fn().mockImplementation(() => ({
      setLngLat: vi.fn().mockReturnThis(),
      setHTML: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
      remove: vi.fn().mockReturnThis(),
      isOpen: vi.fn().mockReturnValue(false)
    }))
  }));
};