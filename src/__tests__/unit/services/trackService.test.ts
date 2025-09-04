import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  saveTrack, 
  fetchUserTracks, 
  fetchNearbyTracks, 
  deleteTrack, 
  updateTrackVisibility, 
  savePlannedRoute,
  convertTrackToTrip 
} from '@/services/trackService';
import { mockSupabase } from '@/../../__tests__/mocks/supabase';
import { ParsedTrack } from '@/utils/gpxParser';
import { Waypoint } from '@/types/waypoint';
import { DirectionsRoute } from '@/services/mapboxDirections';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

// Mock supabase client
vi.mock('@/lib/supabase-client', () => ({
  supabase: mockSupabase
}));

// Mock route name generator
vi.mock('@/utils/routeNameGenerator', () => ({
  generateUniqueRouteName: vi.fn().mockReturnValue('Generated Route Name'),
  generateRouteDescription: vi.fn().mockReturnValue('Generated route description')
}));

describe('TrackService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.__resetMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('saveTrack', () => {
    const mockParsedTrack: ParsedTrack = {
      name: 'Test Track',
      points: [
        { lat: 46.5197, lon: 6.6323, ele: 372, time: '2024-01-01T10:00:00Z' },
        { lat: 46.5287, lon: 6.6423, ele: 385, time: '2024-01-01T10:05:00Z' }
      ],
      totalDistance: 2.5,
      bounds: {
        minLat: 46.5197,
        maxLat: 46.5287,
        minLon: 6.6323,
        maxLon: 6.6423
      }
    };

    it('should save track successfully', async () => {
      const mockTrackData = {
        id: 'new-track-id',
        name: 'Test Track',
        segments: {
          points: mockParsedTrack.points,
          bounds: mockParsedTrack.bounds
        },
        distance_km: 2.5,
        source_type: 'gpx_upload',
        created_by: 'test-user-id',
        is_public: false,
        visible: true,
        description: 'Uploaded track: Test Track',
        difficulty: 'moderate',
        created_at: '2024-01-01T10:00:00Z'
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockTrackData,
              error: null
            })
          })
        })
      });

      const result = await saveTrack(mockParsedTrack, 'test-user-id');

      expect(result).toEqual(mockTrackData);
      expect(mockSupabase.from).toHaveBeenCalledWith('tracks');
    });

    it('should handle database error', async () => {
      const { toast } = await import('sonner');
      
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      });

      const result = await saveTrack(mockParsedTrack, 'test-user-id');

      expect(result).toBeNull();
      expect(toast.error).toHaveBeenCalledWith('Failed to save track');
    });

    it('should handle exceptions', async () => {
      const { toast } = await import('sonner');
      
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await saveTrack(mockParsedTrack, 'test-user-id');

      expect(result).toBeNull();
      expect(toast.error).toHaveBeenCalledWith('Failed to save track');
    });

    it('should format track data correctly', async () => {
      const insertSpy = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'test' },
            error: null
          })
        })
      });

      mockSupabase.from.mockReturnValue({
        insert: insertSpy
      });

      await saveTrack(mockParsedTrack, 'test-user-id');

      expect(insertSpy).toHaveBeenCalledWith({
        name: 'Test Track',
        segments: {
          points: mockParsedTrack.points,
          bounds: mockParsedTrack.bounds
        },
        distance_km: 2.5,
        source_type: 'gpx_upload',
        created_by: 'test-user-id',
        is_public: false,
        visible: true,
        description: 'Uploaded track: Test Track',
        difficulty: 'moderate'
      });
    });
  });

  describe('fetchUserTracks', () => {
    it('should fetch user tracks successfully', async () => {
      const mockTracks = [
        { id: '1', name: 'Track 1', created_by: 'test-user-id' },
        { id: '2', name: 'Track 2', created_by: 'test-user-id' }
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockTracks,
              error: null
            })
          })
        })
      });

      const result = await fetchUserTracks('test-user-id');

      expect(result).toEqual(mockTracks);
      expect(mockSupabase.from).toHaveBeenCalledWith('tracks');
    });

    it('should return empty array on error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      });

      const result = await fetchUserTracks('test-user-id');

      expect(result).toEqual([]);
    });

    it('should handle exceptions', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await fetchUserTracks('test-user-id');

      expect(result).toEqual([]);
    });
  });

  describe('fetchNearbyTracks', () => {
    it('should fetch nearby public tracks', async () => {
      const mockTracks = [
        { id: '1', name: 'Public Track 1', is_public: true },
        { id: '2', name: 'Public Track 2', is_public: true }
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockTracks,
              error: null
            })
          })
        })
      });

      const result = await fetchNearbyTracks(46.2044, 6.1432, 50);

      expect(result).toEqual(mockTracks);
      expect(mockSupabase.from).toHaveBeenCalledWith('tracks');
    });

    it('should use default radius of 50km', async () => {
      const limitSpy = vi.fn().mockResolvedValue({
        data: [],
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: limitSpy
          })
        })
      });

      await fetchNearbyTracks(46.2044, 6.1432);

      expect(limitSpy).toHaveBeenCalledWith(20);
    });

    it('should return empty array on error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      });

      const result = await fetchNearbyTracks(46.2044, 6.1432);

      expect(result).toEqual([]);
    });
  });

  describe('deleteTrack', () => {
    it('should delete track successfully', async () => {
      const { toast } = await import('sonner');
      
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        })
      });

      const result = await deleteTrack('track-id', 'test-user-id');

      expect(result).toBe(true);
      expect(toast.success).toHaveBeenCalledWith('Track deleted');
    });

    it('should handle delete error', async () => {
      const { toast } = await import('sonner');
      
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Delete failed' }
            })
          })
        })
      });

      const result = await deleteTrack('track-id', 'test-user-id');

      expect(result).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Failed to delete track');
    });

    it('should ensure user owns the track', async () => {
      const deleteSpy = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      });

      mockSupabase.from.mockReturnValue({
        delete: deleteSpy
      });

      await deleteTrack('track-id', 'test-user-id');

      expect(deleteSpy().eq).toHaveBeenCalledWith('id', 'track-id');
      expect(deleteSpy().eq().eq).toHaveBeenCalledWith('created_by', 'test-user-id');
    });
  });

  describe('updateTrackVisibility', () => {
    it('should update track visibility successfully', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        })
      });

      const result = await updateTrackVisibility('track-id', true, 'test-user-id');

      expect(result).toBe(true);
    });

    it('should handle update error', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Update failed' }
            })
          })
        })
      });

      const result = await updateTrackVisibility('track-id', true, 'test-user-id');

      expect(result).toBe(false);
    });

    it('should ensure user owns the track', async () => {
      const updateSpy = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      });

      mockSupabase.from.mockReturnValue({
        update: updateSpy
      });

      await updateTrackVisibility('track-id', false, 'test-user-id');

      expect(updateSpy).toHaveBeenCalledWith({ visible: false });
    });
  });

  describe('savePlannedRoute', () => {
    const mockWaypoints: Waypoint[] = [
      { id: '1', name: 'Start', coords: [6.6323, 46.5197], type: 'start' },
      { id: '2', name: 'End', coords: [6.6423, 46.5287], type: 'destination' }
    ];

    const mockRoute: DirectionsRoute = {
      distance: 2543.7,
      duration: 420.5,
      geometry: {
        coordinates: [[6.6323, 46.5197], [6.6423, 46.5287]],
        type: 'LineString'
      }
    };

    it('should save planned route successfully', async () => {
      const mockSavedRoute = {
        id: 'new-route-id',
        name: 'Generated Route Name',
        created_at: '2024-01-01T10:00:00Z'
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSavedRoute,
              error: null
            })
          })
        })
      });

      const result = await savePlannedRoute(
        mockWaypoints,
        mockRoute,
        'test-user-id',
        'driving'
      );

      expect(result).toEqual(mockSavedRoute);
    });

    it('should reject insufficient waypoints', async () => {
      const { toast } = await import('sonner');
      
      const result = await savePlannedRoute(
        [mockWaypoints[0]], // Only one waypoint
        mockRoute,
        'test-user-id',
        'driving'
      );

      expect(result).toBeNull();
      expect(toast.error).toHaveBeenCalledWith('Need at least 2 waypoints to save a route');
    });

    it('should use provided additional data', async () => {
      const insertSpy = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'test' },
            error: null
          })
        })
      });

      mockSupabase.from.mockReturnValue({
        insert: insertSpy
      });

      const additionalData = {
        name: 'Custom Route Name',
        description: 'Custom description',
        difficulty: 'hard',
        isPublic: true,
        imageUrl: 'https://example.com/image.jpg',
        notes: 'Custom notes'
      };

      await savePlannedRoute(
        mockWaypoints,
        mockRoute,
        'test-user-id',
        'cycling',
        additionalData
      );

      expect(insertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Custom Route Name',
          description: 'Custom description',
          difficulty: 'hard',
          is_public: true,
          metadata: expect.objectContaining({
            profile: 'cycling',
            image_url: 'https://example.com/image.jpg',
            notes: 'Custom notes'
          })
        })
      );
    });

    it('should handle route without geometry', async () => {
      const routeWithoutGeometry = { ...mockRoute, geometry: null };
      
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'test' },
              error: null
            })
          })
        })
      });

      const result = await savePlannedRoute(
        mockWaypoints,
        routeWithoutGeometry,
        'test-user-id',
        'driving'
      );

      expect(result).not.toBeNull();
    });

    it('should calculate bounds correctly', async () => {
      const insertSpy = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'test' },
            error: null
          })
        })
      });

      mockSupabase.from.mockReturnValue({
        insert: insertSpy
      });

      await savePlannedRoute(
        mockWaypoints,
        mockRoute,
        'test-user-id',
        'driving'
      );

      const insertData = insertSpy.mock.calls[0][0];
      expect(insertData.segments.bounds).toEqual({
        minLat: 46.5197,
        maxLat: 46.5287,
        minLon: 6.6323,
        maxLon: 6.6423
      });
    });
  });

  describe('convertTrackToTrip', () => {
    it('should convert track to trip successfully', async () => {
      const { toast } = await import('sonner');
      const mockTrack = {
        id: 'track-id',
        name: 'Test Track',
        description: 'Test track description',
        created_by: 'test-user-id'
      };

      const mockTrip = {
        id: 'trip-id',
        name: 'Test Track',
        description: 'Test track description',
        created_by: 'test-user-id'
      };

      // Mock track fetch
      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockTrack,
                  error: null
                })
              })
            })
          })
        })
        // Mock trip creation
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockTrip,
                error: null
              })
            })
          })
        })
        // Mock track update
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        });

      const result = await convertTrackToTrip('track-id', 'test-user-id');

      expect(result).toEqual(mockTrip);
      expect(toast.success).toHaveBeenCalledWith('Track saved as trip');
    });

    it('should handle track not found', async () => {
      const { toast } = await import('sonner');
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' }
              })
            })
          })
        })
      });

      const result = await convertTrackToTrip('track-id', 'test-user-id');

      expect(result).toBeNull();
      expect(toast.error).toHaveBeenCalledWith('Track not found');
    });

    it('should handle trip creation error', async () => {
      const { toast } = await import('sonner');
      const mockTrack = {
        id: 'track-id',
        name: 'Test Track',
        created_by: 'test-user-id'
      };

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockTrack,
                  error: null
                })
              })
            })
          })
        })
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Creation failed' }
              })
            })
          })
        });

      const result = await convertTrackToTrip('track-id', 'test-user-id');

      expect(result).toBeNull();
      expect(toast.error).toHaveBeenCalledWith('Failed to create trip');
    });
  });
});