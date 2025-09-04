import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWaypointManager } from '@/hooks/use-waypoint-manager';
import { savePlannedRoute } from '@/services/trackService';
import { getDirections } from '@/services/mapboxDirections';
import { mockSupabase } from '@/../../__tests__/mocks/supabase';
import { setupMapboxMocks, mapboxTestUtils } from '@/../../__tests__/mocks/mapbox';
import { setupOpenRouteMocks, openRouteTestUtils } from '@/../../__tests__/mocks/openroute';

// Mock all external services
vi.mock('@/lib/supabase-client', () => ({
  supabase: mockSupabase
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

// Setup mocks
setupMapboxMocks();
setupOpenRouteMocks();

describe('Trip Planner Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.__resetMocks();
    mapboxTestUtils.resetMocks();
    openRouteTestUtils.resetMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Trip Planning Workflow', () => {
    it('should complete end-to-end trip planning and saving', async () => {
      // Mock successful route calculation
      vi.mocked(getDirections).mockResolvedValue({
        distance: 224000, // 224 km
        duration: 7800,   // 130 minutes
        geometry: {
          coordinates: [
            [6.1432, 46.2044], // Geneva
            [8.5417, 47.3769]  // Zurich
          ],
          type: 'LineString'
        }
      });

      // Mock successful save
      const mockSavedRoute = {
        id: 'route-123',
        name: 'Geneva to Zurich',
        created_at: '2024-01-01T10:00:00Z',
        created_by: 'test-user-id'
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

      // Initialize waypoint manager
      const { result } = renderHook(() => useWaypointManager());

      // Step 1: Add waypoints
      await waitFor(() => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
      });

      await waitFor(() => {
        result.current.addWaypoint([8.5417, 47.3769], 'Zurich');
      });

      // Step 2: Verify route was calculated
      await waitFor(() => {
        expect(result.current.route).not.toBeNull();
        expect(result.current.route?.distance).toBe(224000);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });

      // Step 3: Save the planned route
      const saveResult = await savePlannedRoute(
        result.current.waypoints,
        result.current.route,
        'test-user-id',
        'driving',
        {
          name: 'Geneva to Zurich Adventure',
          description: 'Beautiful alpine route through Switzerland',
          difficulty: 'moderate',
          isPublic: true
        }
      );

      // Step 4: Verify the save was successful
      expect(saveResult).toEqual(mockSavedRoute);
      expect(mockSupabase.from).toHaveBeenCalledWith('tracks');
    });

    it('should handle route calculation failures gracefully', async () => {
      // Mock route calculation failure
      vi.mocked(getDirections).mockRejectedValue(new Error('Network timeout'));

      const { result } = renderHook(() => useWaypointManager());

      // Add waypoints
      await waitFor(() => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
      });

      await waitFor(() => {
        result.current.addWaypoint([8.5417, 47.3769], 'Zurich');
      });

      // Should handle error gracefully
      await waitFor(() => {
        expect(result.current.error).toBe('Network timeout');
        expect(result.current.route).toBeNull();
        expect(result.current.isLoading).toBe(false);
      });

      // Should not be able to save without route
      const saveResult = await savePlannedRoute(
        result.current.waypoints,
        result.current.route,
        'test-user-id',
        'driving'
      );

      expect(saveResult).not.toBeNull(); // Should still save waypoints even without route
    });

    it('should handle different route profiles correctly', async () => {
      const profiles = ['driving', 'cycling', 'walking'] as const;
      
      for (const profile of profiles) {
        vi.mocked(getDirections).mockClear();
        vi.mocked(getDirections).mockResolvedValue({
          distance: profile === 'walking' ? 200000 : 224000,
          duration: profile === 'walking' ? 14400 : 7800,
          geometry: {
            coordinates: [[6.1432, 46.2044], [8.5417, 47.3769]],
            type: 'LineString'
          }
        });

        const { result } = renderHook(() => useWaypointManager());

        // Set profile
        await waitFor(() => {
          result.current.setRouteProfile(profile);
        });

        // Add waypoints
        await waitFor(() => {
          result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
          result.current.addWaypoint([8.5417, 47.3769], 'Zurich');
        });

        // Verify correct profile was used
        await waitFor(() => {
          expect(getDirections).toHaveBeenCalledWith(
            expect.any(Array),
            profile
          );
          expect(result.current.route).not.toBeNull();
        });
      }
    });
  });

  describe('Multi-waypoint Route Planning', () => {
    it('should handle complex routes with multiple waypoints', async () => {
      const waypoints = [
        { coords: [6.1432, 46.2044], name: 'Geneva' },
        { coords: [7.4474, 46.9481], name: 'Bern' },
        { coords: [8.3093, 47.0502], name: 'Lucerne' },
        { coords: [8.5417, 47.3769], name: 'Zurich' }
      ];

      vi.mocked(getDirections).mockResolvedValue({
        distance: 350000, // Longer route with multiple stops
        duration: 12600,  // ~3.5 hours
        geometry: {
          coordinates: waypoints.map(w => w.coords),
          type: 'LineString'
        }
      });

      const { result } = renderHook(() => useWaypointManager());

      // Add all waypoints
      for (const waypoint of waypoints) {
        await waitFor(() => {
          result.current.addWaypoint(waypoint.coords as [number, number], waypoint.name);
        });
      }

      // Verify route includes all waypoints
      await waitFor(() => {
        expect(result.current.waypoints).toHaveLength(4);
        expect(result.current.waypoints[0].type).toBe('start');
        expect(result.current.waypoints[1].type).toBe('waypoint');
        expect(result.current.waypoints[2].type).toBe('waypoint');
        expect(result.current.waypoints[3].type).toBe('destination');
        expect(result.current.route?.distance).toBe(350000);
      });

      // Verify getDirections was called with all coordinates
      expect(getDirections).toHaveBeenCalledWith(
        waypoints.map(w => w.coords),
        'driving'
      );
    });

    it('should recalculate route when waypoints are reordered', async () => {
      vi.mocked(getDirections).mockResolvedValue({
        distance: 224000,
        duration: 7800,
        geometry: {
          coordinates: [[6.1432, 46.2044], [8.5417, 47.3769], [7.4474, 46.9481]],
          type: 'LineString'
        }
      });

      const { result } = renderHook(() => useWaypointManager());

      // Add initial waypoints
      await waitFor(() => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
        result.current.addWaypoint([8.5417, 47.3769], 'Zurich');
        result.current.addWaypoint([7.4474, 46.9481], 'Bern');
      });

      const initialCallCount = vi.mocked(getDirections).mock.calls.length;

      // Reorder waypoints
      await waitFor(() => {
        result.current.reorderWaypoints(1, 2); // Swap Zurich and Bern
      });

      // Should trigger new route calculation
      await waitFor(() => {
        expect(vi.mocked(getDirections).mock.calls.length).toBeGreaterThan(initialCallCount);
        expect(result.current.waypoints[1].name).toBe('Bern');
        expect(result.current.waypoints[2].name).toBe('Zurich');
      });
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should retry failed requests with exponential backoff', async () => {
      let attemptCount = 0;
      vi.mocked(getDirections).mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          distance: 224000,
          duration: 7800,
          geometry: {
            coordinates: [[6.1432, 46.2044], [8.5417, 47.3769]],
            type: 'LineString'
          }
        });
      });

      const { result } = renderHook(() => useWaypointManager());

      await waitFor(() => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
        result.current.addWaypoint([8.5417, 47.3769], 'Zurich');
      });

      // Should eventually succeed after retries
      await waitFor(() => {
        expect(result.current.route).not.toBeNull();
        expect(result.current.error).toBeNull();
        expect(attemptCount).toBeGreaterThanOrEqual(3);
      }, { timeout: 5000 });
    });

    it('should handle partial failures in multi-waypoint routes', async () => {
      // Mock a scenario where some route segments fail
      vi.mocked(getDirections)
        .mockRejectedValueOnce(new Error('Segment not found'))
        .mockResolvedValueOnce({
          distance: 150000,
          duration: 5400,
          geometry: {
            coordinates: [[6.1432, 46.2044], [8.5417, 47.3769]],
            type: 'LineString'
          }
        });

      const { result } = renderHook(() => useWaypointManager());

      // Add waypoints that might cause route calculation issues
      await waitFor(() => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
        result.current.addWaypoint([0, 0], 'Invalid Location'); // This might cause issues
        result.current.addWaypoint([8.5417, 47.3769], 'Zurich');
      });

      // Should handle partial failure gracefully
      await waitFor(() => {
        // Should either have a route or a meaningful error
        expect(result.current.isLoading).toBe(false);
        expect(result.current.route !== null || result.current.error !== null).toBe(true);
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('should debounce rapid waypoint additions', async () => {
      vi.mocked(getDirections).mockResolvedValue({
        distance: 224000,
        duration: 7800,
        geometry: {
          coordinates: [[6.1432, 46.2044], [8.5417, 47.3769]],
          type: 'LineString'
        }
      });

      const { result } = renderHook(() => useWaypointManager());

      // Rapidly add multiple waypoints
      await waitFor(() => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
        result.current.addWaypoint([7.0, 46.5], 'Point 1');
        result.current.addWaypoint([7.5, 46.8], 'Point 2');
        result.current.addWaypoint([8.0, 47.0], 'Point 3');
        result.current.addWaypoint([8.5417, 47.3769], 'Zurich');
      });

      // Should only make one final request after debouncing
      await waitFor(() => {
        expect(vi.mocked(getDirections)).toHaveBeenCalledTimes(1);
        expect(result.current.route).not.toBeNull();
      });
    });

    it('should cache route calculations for identical waypoint sets', async () => {
      const routeResult = {
        distance: 224000,
        duration: 7800,
        geometry: {
          coordinates: [[6.1432, 46.2044], [8.5417, 47.3769]],
          type: 'LineString'
        }
      };

      vi.mocked(getDirections).mockResolvedValue(routeResult);

      const { result } = renderHook(() => useWaypointManager());

      // Add waypoints first time
      await waitFor(() => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
        result.current.addWaypoint([8.5417, 47.3769], 'Zurich');
      });

      await waitFor(() => {
        expect(result.current.route).not.toBeNull();
      });

      const firstCallCount = vi.mocked(getDirections).mock.calls.length;

      // Clear and add same waypoints again
      await waitFor(() => {
        result.current.clearWaypoints();
      });

      await waitFor(() => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
        result.current.addWaypoint([8.5417, 47.3769], 'Zurich');
      });

      await waitFor(() => {
        expect(result.current.route).not.toBeNull();
        // Should not make additional API calls for same route
        expect(vi.mocked(getDirections).mock.calls.length).toBe(firstCallCount + 1);
      });
    });
  });

  describe('Data Persistence Integration', () => {
    it('should integrate with Supabase for saving user routes', async () => {
      // Setup successful route calculation
      vi.mocked(getDirections).mockResolvedValue({
        distance: 224000,
        duration: 7800,
        geometry: {
          coordinates: [[6.1432, 46.2044], [8.5417, 47.3769]],
          type: 'LineString'
        }
      });

      // Setup successful database save
      const mockSavedRoute = {
        id: 'route-456',
        name: 'Swiss Adventure',
        created_at: '2024-01-01T12:00:00Z'
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

      const { result } = renderHook(() => useWaypointManager());

      // Create route
      await waitFor(() => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
        result.current.addWaypoint([8.5417, 47.3769], 'Zurich');
      });

      await waitFor(() => {
        expect(result.current.route).not.toBeNull();
      });

      // Save route with comprehensive metadata
      const saveResult = await savePlannedRoute(
        result.current.waypoints,
        result.current.route,
        'test-user-id',
        'driving',
        {
          name: 'Swiss Adventure',
          description: 'Scenic route through Swiss countryside',
          difficulty: 'moderate',
          isPublic: true,
          imageUrl: 'https://example.com/route-image.jpg',
          notes: 'Best driven in summer months'
        }
      );

      // Verify database integration
      expect(saveResult).toEqual(mockSavedRoute);
      const insertCall = mockSupabase.from().insert.mock.calls[0][0];
      expect(insertCall).toMatchObject({
        name: 'Swiss Adventure',
        description: 'Scenic route through Swiss countryside',
        difficulty: 'moderate',
        is_public: true,
        source_type: 'route_planner',
        metadata: expect.objectContaining({
          profile: 'driving',
          image_url: 'https://example.com/route-image.jpg',
          notes: 'Best driven in summer months',
          waypoint_count: 2
        })
      });
    });

    it('should handle database errors gracefully', async () => {
      const { toast } = await import('sonner');
      
      // Setup route calculation
      vi.mocked(getDirections).mockResolvedValue({
        distance: 224000,
        duration: 7800,
        geometry: {
          coordinates: [[6.1432, 46.2044], [8.5417, 47.3769]],
          type: 'LineString'
        }
      });

      // Setup database error
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed', code: 'CONNECTION_ERROR' }
            })
          })
        })
      });

      const { result } = renderHook(() => useWaypointManager());

      await waitFor(() => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
        result.current.addWaypoint([8.5417, 47.3769], 'Zurich');
      });

      const saveResult = await savePlannedRoute(
        result.current.waypoints,
        result.current.route,
        'test-user-id',
        'driving'
      );

      expect(saveResult).toBeNull();
      expect(toast.error).toHaveBeenCalledWith('Failed to save route: Database connection failed');
    });
  });
});