import { vi } from 'vitest';

// Mock OpenRouteService responses
export const mockOpenRouteDirectionsResponse = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        segments: [
          {
            distance: 2543.7,
            duration: 1801.2,
            steps: [
              {
                distance: 847.9,
                duration: 600.4,
                type: 11,
                instruction: 'Head northeast on Route de Lausanne',
                name: 'Route de Lausanne',
                way_points: [0, 15]
              },
              {
                distance: 1695.8,
                duration: 1200.8,
                type: 12,
                instruction: 'Continue straight on Chemin des Alpes',
                name: 'Chemin des Alpes',
                way_points: [15, 35]
              }
            ]
          }
        ],
        summary: {
          distance: 2543.7,
          duration: 1801.2
        },
        way_points: [0, 35],
        extras: {
          surface: {
            values: [
              [0, 10, 1], // paved
              [10, 25, 2], // unpaved
              [25, 35, 1]  // paved
            ],
            summary: [
              { value: 1, distance: 1500, amount: 60 },
              { value: 2, distance: 1043.7, amount: 40 }
            ]
          },
          steepness: {
            values: [
              [0, 15, 1], // flat
              [15, 25, 3], // moderate incline
              [25, 35, 1]  // flat
            ],
            summary: [
              { value: 1, distance: 2000, amount: 78.6 },
              { value: 3, distance: 543.7, amount: 21.4 }
            ]
          },
          waytype: {
            values: [
              [0, 20, 1], // highway
              [20, 35, 4]  // track
            ],
            summary: [
              { value: 1, distance: 1600, amount: 62.9 },
              { value: 4, distance: 943.7, amount: 37.1 }
            ]
          }
        }
      },
      geometry: {
        coordinates: [
          [6.6323, 46.5197, 372],
          [6.6333, 46.5207, 375],
          [6.6343, 46.5217, 378],
          [6.6353, 46.5227, 382],
          [6.6363, 46.5237, 385],
          [6.6373, 46.5247, 390],
          [6.6383, 46.5257, 395],
          [6.6393, 46.5267, 400],
          [6.6403, 46.5277, 405],
          [6.6413, 46.5287, 410],
          [6.6423, 46.5297, 415]
        ],
        type: 'LineString'
      }
    }
  ],
  bbox: [6.6323, 46.5197, 6.6423, 46.5297],
  metadata: {
    attribution: 'openrouteservice.org',
    service: 'routing',
    timestamp: Date.now(),
    query: {
      coordinates: [
        [6.6323, 46.5197],
        [6.6423, 46.5297]
      ],
      profile: 'driving-hgv',
      preference: 'recommended',
      format: 'geojson'
    },
    engine: {
      version: '8.0.0',
      build_date: '2024-01-15T12:30:00Z',
      graph_date: '2024-01-01T00:00:00Z'
    }
  }
};

export const mockOpenRouteGeocodingResponse = {
  type: 'FeatureCollection',
  geocoding: {
    version: '0.2',
    attribution: 'openrouteservice.org',
    query: 'Geneva, Switzerland',
    licence: 'https://creativecommons.org/licenses/by/4.0/'
  },
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'node/123456789',
        gid: 'openstreetmap:venue:node/123456789',
        layer: 'venue',
        source: 'openstreetmap',
        source_id: 'node/123456789',
        name: 'Geneva',
        housenumber: '',
        street: '',
        postalcode: '1200',
        confidence: 1,
        match_type: 'exact',
        accuracy: 'point',
        country: 'Switzerland',
        country_gid: 'whosonfirst:country:85633051',
        country_a: 'CHE',
        region: 'Geneva',
        region_gid: 'whosonfirst:region:85682607',
        locality: 'Geneva',
        locality_gid: 'whosonfirst:locality:101748581',
        label: 'Geneva, Geneva, Switzerland'
      },
      geometry: {
        type: 'Point',
        coordinates: [6.1432, 46.2044]
      },
      bbox: [6.0907, 46.1647, 6.2648, 46.2493]
    }
  ],
  bbox: [6.0907, 46.1647, 6.2648, 46.2493]
};

export const mockOpenRouteIsochroneResponse = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        group_index: 0,
        value: 600,
        center: [6.1432, 46.2044]
      },
      geometry: {
        coordinates: [[
          [6.1332, 46.1944],
          [6.1532, 46.1944],
          [6.1632, 46.2044],
          [6.1532, 46.2144],
          [6.1332, 46.2144],
          [6.1232, 46.2044],
          [6.1332, 46.1944]
        ]],
        type: 'Polygon'
      }
    }
  ],
  bbox: [6.1232, 46.1944, 6.1632, 46.2144],
  metadata: {
    attribution: 'openrouteservice.org',
    service: 'isochrones',
    timestamp: Date.now(),
    query: {
      locations: [[6.1432, 46.2044]],
      range: [600],
      range_type: 'time',
      profile: 'driving-hgv'
    }
  }
};

export const mockOpenRouteElevationResponse = {
  geometry: {
    coordinates: [
      [6.6323, 46.5197, 372.5],
      [6.6333, 46.5207, 375.2],
      [6.6343, 46.5217, 378.8],
      [6.6353, 46.5227, 382.1],
      [6.6363, 46.5237, 385.6]
    ],
    type: 'LineString'
  }
};

// Mock fetch for OpenRouteService API calls
export const mockOpenRouteFetch = vi.fn().mockImplementation((url: string) => {
  const urlString = url.toString();
  
  if (urlString.includes('/v2/directions/')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockOpenRouteDirectionsResponse)
    });
  }
  
  if (urlString.includes('/geocoding/')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockOpenRouteGeocodingResponse)
    });
  }
  
  if (urlString.includes('/v2/isochrones/')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockOpenRouteIsochroneResponse)
    });
  }
  
  if (urlString.includes('/elevation/')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockOpenRouteElevationResponse)
    });
  }
  
  // Default fallback
  return Promise.resolve({
    ok: false,
    status: 404,
    json: () => Promise.resolve({ error: 'Not found' })
  });
});

// Utility functions for testing different scenarios
export const openRouteTestUtils = {
  mockSuccessResponse: (endpoint: string, customResponse?: any) => {
    const responses = {
      directions: customResponse || mockOpenRouteDirectionsResponse,
      geocoding: customResponse || mockOpenRouteGeocodingResponse,
      isochrones: customResponse || mockOpenRouteIsochroneResponse,
      elevation: customResponse || mockOpenRouteElevationResponse
    };
    
    mockOpenRouteFetch.mockImplementationOnce((url: string) => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(responses[endpoint as keyof typeof responses])
      });
    });
  },
  
  mockErrorResponse: (statusCode: number = 400, errorMessage: string = 'Bad Request') => {
    mockOpenRouteFetch.mockImplementationOnce(() => {
      return Promise.resolve({
        ok: false,
        status: statusCode,
        json: () => Promise.resolve({ 
          error: {
            code: statusCode,
            message: errorMessage
          }
        })
      });
    });
  },
  
  mockNetworkError: () => {
    mockOpenRouteFetch.mockImplementationOnce(() => {
      return Promise.reject(new Error('Network error'));
    });
  },
  
  mockTimeoutError: () => {
    mockOpenRouteFetch.mockImplementationOnce(() => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 100);
      });
    });
  },
  
  mockRateLimitError: () => {
    mockOpenRouteFetch.mockImplementationOnce(() => {
      return Promise.resolve({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ 
          error: {
            code: 429,
            message: 'Rate limit exceeded'
          }
        })
      });
    });
  },
  
  getLastRequest: () => {
    const lastCall = mockOpenRouteFetch.mock.calls.slice(-1)[0];
    return lastCall ? lastCall[0] : null;
  },
  
  getRequestCount: () => {
    return mockOpenRouteFetch.mock.calls.length;
  },
  
  resetMocks: () => {
    mockOpenRouteFetch.mockClear();
  }
};

// Setup OpenRouteService mocks
export const setupOpenRouteMocks = () => {
  // Replace global fetch for OpenRouteService calls
  const originalFetch = global.fetch;
  
  global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    
    if (url.includes('openrouteservice.org') || url.includes('api.openrouteservice.org')) {
      return mockOpenRouteFetch(url);
    }
    
    // Fall back to original fetch for other URLs
    return originalFetch(input, init);
  }) as any;
};