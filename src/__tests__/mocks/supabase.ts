import { vi } from 'vitest';

// Mock data for various entities
export const mockTracks = [
  {
    id: '1',
    name: 'Alpine Adventure Route',
    segments: {
      points: [
        { lat: 46.5197, lon: 6.6323, ele: 372, time: '2024-01-01T10:00:00Z' },
        { lat: 46.5287, lon: 6.6423, ele: 385, time: '2024-01-01T10:05:00Z' },
        { lat: 46.5377, lon: 6.6523, ele: 398, time: '2024-01-01T10:10:00Z' }
      ],
      bounds: {
        minLat: 46.5197,
        maxLat: 46.5377,
        minLon: 6.6323,
        maxLon: 6.6523
      }
    },
    distance_km: 2.5,
    source_type: 'gpx_upload',
    created_by: 'test-user-id',
    is_public: false,
    visible: true,
    description: 'Beautiful alpine route through Swiss countryside',
    difficulty: 'moderate',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  },
  {
    id: '2',
    name: 'City Circuit',
    segments: {
      points: [
        { lat: 47.3769, lon: 8.5417, ele: 408, time: '2024-01-02T14:00:00Z' },
        { lat: 47.3869, lon: 8.5517, ele: 420, time: '2024-01-02T14:05:00Z' }
      ],
      bounds: {
        minLat: 47.3769,
        maxLat: 47.3869,
        minLon: 8.5417,
        maxLon: 8.5517
      }
    },
    distance_km: 1.2,
    source_type: 'route_planner',
    created_by: 'test-user-id',
    is_public: true,
    visible: true,
    description: 'Quick urban route',
    difficulty: 'easy',
    created_at: '2024-01-02T14:00:00Z',
    updated_at: '2024-01-02T14:00:00Z'
  }
];

export const mockWaypoints = [
  {
    id: '1',
    name: 'Start Point',
    coords: [6.6323, 46.5197],
    type: 'start',
    description: 'Starting location',
    created_by: 'test-user-id',
    is_public: false,
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: '2',
    name: 'Scenic Viewpoint',
    coords: [6.6423, 46.5287],
    type: 'waypoint',
    description: 'Beautiful mountain view',
    created_by: 'test-user-id',
    is_public: true,
    created_at: '2024-01-01T10:05:00Z'
  }
];

export const mockTrips = [
  {
    id: '1',
    name: 'Weekend Adventure',
    description: 'Two-day trip in the Alps',
    created_by: 'test-user-id',
    is_public: false,
    start_date: '2024-01-01',
    end_date: '2024-01-02',
    created_at: '2024-01-01T10:00:00Z'
  }
];

// Mock Supabase client with realistic responses
export const createMockSupabaseClient = () => {
  let mockData: any = {
    tracks: [...mockTracks],
    waypoints: [...mockWaypoints],
    trips: [...mockTrips]
  };

  const mockSelect = vi.fn().mockImplementation(() => {
    const chain = {
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => {
        // Return first item for single() calls
        const data = mockData.tracks?.[0] || mockData.waypoints?.[0] || mockData.trips?.[0];
        return Promise.resolve({ data, error: null });
      }),
      then: vi.fn().mockImplementation((callback) => {
        // For direct promise resolution
        const result = { data: mockData.tracks || [], error: null };
        return callback(result);
      })
    };

    // Make the chain methods return the data appropriately
    Object.keys(chain).forEach(method => {
      if (method !== 'single' && method !== 'then') {
        chain[method].mockImplementation(() => {
          return Promise.resolve({ data: mockData.tracks || [], error: null });
        });
      }
    });

    return chain;
  });

  const mockInsert = vi.fn().mockImplementation((data) => {
    return {
      select: vi.fn().mockImplementation(() => ({
        single: vi.fn().mockImplementation(() => {
          const newItem = {
            id: `new-${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...data
          };
          return Promise.resolve({ data: newItem, error: null });
        })
      }))
    };
  });

  const mockUpdate = vi.fn().mockImplementation((data) => {
    return {
      eq: vi.fn().mockImplementation(() => ({
        single: vi.fn().mockImplementation(() => {
          const updatedItem = {
            id: '1',
            updated_at: new Date().toISOString(),
            ...mockData.tracks[0],
            ...data
          };
          return Promise.resolve({ data: updatedItem, error: null });
        })
      }))
    };
  });

  const mockDelete = vi.fn().mockImplementation(() => {
    return {
      eq: vi.fn().mockImplementation(() => {
        return Promise.resolve({ data: null, error: null });
      })
    };
  });

  const mockFrom = vi.fn().mockImplementation((table: string) => {
    return {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete
    };
  });

  const mockAuth = {
    getSession: vi.fn().mockResolvedValue({
      data: { 
        session: { 
          user: { 
            id: 'test-user-id', 
            email: 'test@example.com' 
          },
          access_token: 'mock-token'
        } 
      },
      error: null
    }),
    getUser: vi.fn().mockResolvedValue({
      data: { 
        user: { 
          id: 'test-user-id', 
          email: 'test@example.com' 
        }
      },
      error: null
    }),
    signInWithPassword: vi.fn().mockResolvedValue({
      data: { 
        user: { 
          id: 'test-user-id', 
          email: 'test@example.com' 
        },
        session: { access_token: 'mock-token' }
      },
      error: null
    }),
    signUp: vi.fn().mockResolvedValue({
      data: { 
        user: { 
          id: 'new-user-id', 
          email: 'newuser@example.com' 
        }
      },
      error: null
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockImplementation((callback) => {
      // Simulate auth state change
      setTimeout(() => {
        callback('SIGNED_IN', { 
          user: { id: 'test-user-id', email: 'test@example.com' },
          access_token: 'mock-token'
        });
      }, 100);
      
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn()
          }
        }
      };
    })
  };

  const mockStorage = {
    from: vi.fn().mockImplementation((bucket: string) => ({
      upload: vi.fn().mockResolvedValue({
        data: { path: `${bucket}/test-file.jpg` },
        error: null
      }),
      download: vi.fn().mockResolvedValue({
        data: new Blob(['mock file content']),
        error: null
      }),
      remove: vi.fn().mockResolvedValue({
        data: null,
        error: null
      }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: `https://mock-storage.com/${bucket}/test-file.jpg` }
      })
    }))
  };

  return {
    from: mockFrom,
    auth: mockAuth,
    storage: mockStorage,
    // Utility methods for tests
    __setMockData: (table: string, data: any[]) => {
      mockData[table] = data;
    },
    __getMockData: (table: string) => mockData[table],
    __resetMocks: () => {
      vi.clearAllMocks();
      mockData = {
        tracks: [...mockTracks],
        waypoints: [...mockWaypoints],
        trips: [...mockTrips]
      };
    }
  };
};

// Export mock instance
export const mockSupabase = createMockSupabaseClient();

// Mock the supabase client module
vi.mock('@/lib/supabase-client', () => ({
  supabase: mockSupabase
}));