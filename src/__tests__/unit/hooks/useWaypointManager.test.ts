import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWaypointManager } from '@/hooks/use-waypoint-manager';
import { Waypoint } from '@/types/waypoint';

// Mock dependencies
vi.mock('@/services/mapboxDirections', () => ({
  getDirections: vi.fn(),
  formatDistance: vi.fn((distance: number) => `${(distance / 1000).toFixed(1)} km`),
  formatDuration: vi.fn((duration: number) => `${Math.round(duration / 60)} min`)
}));

describe('useWaypointManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with empty waypoints', () => {
      const { result } = renderHook(() => useWaypointManager());

      expect(result.current.waypoints).toEqual([]);
      expect(result.current.route).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should initialize with provided waypoints', () => {
      const initialWaypoints: Waypoint[] = [
        { id: '1', name: 'Start', coords: [6.1432, 46.2044], type: 'start' },
        { id: '2', name: 'End', coords: [8.5417, 47.3769], type: 'destination' }
      ];

      const { result } = renderHook(() => useWaypointManager(initialWaypoints));

      expect(result.current.waypoints).toEqual(initialWaypoints);
    });
  });

  describe('Adding Waypoints', () => {
    it('should add a waypoint', () => {
      const { result } = renderHook(() => useWaypointManager());

      act(() => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
      });

      expect(result.current.waypoints).toHaveLength(1);
      expect(result.current.waypoints[0]).toMatchObject({
        name: 'Geneva',
        coords: [6.1432, 46.2044],
        type: 'start'
      });
      expect(result.current.waypoints[0].id).toBeDefined();
    });

    it('should set first waypoint as start', () => {
      const { result } = renderHook(() => useWaypointManager());

      act(() => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
      });

      expect(result.current.waypoints[0].type).toBe('start');
    });

    it('should set second waypoint as destination', () => {
      const { result } = renderHook(() => useWaypointManager());

      act(() => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
        result.current.addWaypoint([8.5417, 47.3769], 'Zurich');
      });

      expect(result.current.waypoints[0].type).toBe('start');
      expect(result.current.waypoints[1].type).toBe('destination');
    });

    it('should set intermediate waypoints as waypoint type', () => {
      const { result } = renderHook(() => useWaypointManager());

      act(() => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
        result.current.addWaypoint([7.2, 46.8], 'Intermediate');
        result.current.addWaypoint([8.5417, 47.3769], 'Zurich');
      });

      expect(result.current.waypoints[0].type).toBe('start');
      expect(result.current.waypoints[1].type).toBe('waypoint');
      expect(result.current.waypoints[2].type).toBe('destination');
    });

    it('should generate unique IDs for waypoints', () => {
      const { result } = renderHook(() => useWaypointManager());

      act(() => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
        result.current.addWaypoint([8.5417, 47.3769], 'Zurich');
      });

      const ids = result.current.waypoints.map(w => w.id);
      expect(ids[0]).not.toBe(ids[1]);
      expect(ids[0]).toBeDefined();
      expect(ids[1]).toBeDefined();
    });
  });

  describe('Removing Waypoints', () => {
    it('should remove waypoint by ID', () => {
      const { result } = renderHook(() => useWaypointManager());

      let waypointId: string;

      act(() => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
        result.current.addWaypoint([8.5417, 47.3769], 'Zurich');
        waypointId = result.current.waypoints[0].id;
      });

      act(() => {
        result.current.removeWaypoint(waypointId);
      });

      expect(result.current.waypoints).toHaveLength(1);
      expect(result.current.waypoints[0].name).toBe('Zurich');
    });

    it('should update waypoint types after removal', () => {
      const { result } = renderHook(() => useWaypointManager());

      let startWaypointId: string;

      act(() => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
        result.current.addWaypoint([7.2, 46.8], 'Intermediate');
        result.current.addWaypoint([8.5417, 47.3769], 'Zurich');
        startWaypointId = result.current.waypoints[0].id;
      });

      act(() => {
        result.current.removeWaypoint(startWaypointId);
      });

      expect(result.current.waypoints).toHaveLength(2);
      expect(result.current.waypoints[0].type).toBe('start');
      expect(result.current.waypoints[1].type).toBe('destination');
    });

    it('should handle removal of non-existent waypoint', () => {
      const { result } = renderHook(() => useWaypointManager());

      act(() => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
      });

      const originalLength = result.current.waypoints.length;

      act(() => {
        result.current.removeWaypoint('non-existent-id');
      });

      expect(result.current.waypoints).toHaveLength(originalLength);
    });
  });

  describe('Updating Waypoints', () => {
    it('should update waypoint name', () => {
      const { result } = renderHook(() => useWaypointManager());

      let waypointId: string;

      act(() => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
        waypointId = result.current.waypoints[0].id;
      });

      act(() => {
        result.current.updateWaypoint(waypointId, { name: 'Updated Geneva' });
      });

      expect(result.current.waypoints[0].name).toBe('Updated Geneva');
    });

    it('should update waypoint coordinates', () => {
      const { result } = renderHook(() => useWaypointManager());

      let waypointId: string;

      act(() => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
        waypointId = result.current.waypoints[0].id;
      });

      act(() => {
        result.current.updateWaypoint(waypointId, { coords: [7.0, 47.0] });
      });

      expect(result.current.waypoints[0].coords).toEqual([7.0, 47.0]);
    });

    it('should handle updates to non-existent waypoint', () => {
      const { result } = renderHook(() => useWaypointManager());

      act(() => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
      });

      const originalWaypoint = result.current.waypoints[0];

      act(() => {
        result.current.updateWaypoint('non-existent-id', { name: 'Updated' });
      });

      expect(result.current.waypoints[0]).toEqual(originalWaypoint);
    });
  });

  describe('Reordering Waypoints', () => {
    it('should reorder waypoints', () => {
      const { result } = renderHook(() => useWaypointManager());

      act(() => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
        result.current.addWaypoint([7.2, 46.8], 'Intermediate');
        result.current.addWaypoint([8.5417, 47.3769], 'Zurich');
      });

      const originalOrder = result.current.waypoints.map(w => w.name);

      act(() => {
        result.current.reorderWaypoints(0, 2); // Move Geneva to end
      });

      const newOrder = result.current.waypoints.map(w => w.name);
      expect(newOrder).toEqual(['Intermediate', 'Zurich', 'Geneva']);
      expect(newOrder).not.toEqual(originalOrder);
    });

    it('should update waypoint types after reordering', () => {
      const { result } = renderHook(() => useWaypointManager());

      act(() => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
        result.current.addWaypoint([7.2, 46.8], 'Intermediate');
        result.current.addWaypoint([8.5417, 47.3769], 'Zurich');
      });

      act(() => {
        result.current.reorderWaypoints(0, 2); // Move Geneva to end
      });

      expect(result.current.waypoints[0].type).toBe('start'); // Intermediate
      expect(result.current.waypoints[1].type).toBe('waypoint'); // Zurich
      expect(result.current.waypoints[2].type).toBe('destination'); // Geneva
    });

    it('should handle invalid reorder indices', () => {
      const { result } = renderHook(() => useWaypointManager());

      act(() => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
        result.current.addWaypoint([8.5417, 47.3769], 'Zurich');
      });

      const originalWaypoints = [...result.current.waypoints];

      act(() => {
        result.current.reorderWaypoints(-1, 1);
      });

      expect(result.current.waypoints).toEqual(originalWaypoints);

      act(() => {
        result.current.reorderWaypoints(0, 10);
      });

      expect(result.current.waypoints).toEqual(originalWaypoints);
    });
  });

  describe('Clearing Waypoints', () => {
    it('should clear all waypoints', () => {
      const { result } = renderHook(() => useWaypointManager());

      act(() => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
        result.current.addWaypoint([8.5417, 47.3769], 'Zurich');
      });

      expect(result.current.waypoints).toHaveLength(2);

      act(() => {
        result.current.clearWaypoints();
      });

      expect(result.current.waypoints).toHaveLength(0);
    });

    it('should clear route when clearing waypoints', () => {
      const { result } = renderHook(() => useWaypointManager());

      act(() => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
        result.current.addWaypoint([8.5417, 47.3769], 'Zurich');
      });

      // Mock that we have a route
      act(() => {
        (result.current as any).setRoute({ distance: 224000, duration: 7800 });
      });

      act(() => {
        result.current.clearWaypoints();
      });

      expect(result.current.route).toBeNull();
    });
  });

  describe('Route Calculation', () => {
    beforeEach(() => {
      const { getDirections } = vi.mocked(
        require('@/services/mapboxDirections')
      );
      getDirections.mockClear();
    });

    it('should calculate route when having at least 2 waypoints', async () => {
      const { getDirections } = vi.mocked(
        require('@/services/mapboxDirections')
      );
      
      const mockRoute = {
        distance: 224000,
        duration: 7800,
        geometry: {
          coordinates: [[6.1432, 46.2044], [8.5417, 47.3769]],
          type: 'LineString' as const
        }
      };

      getDirections.mockResolvedValue(mockRoute);

      const { result } = renderHook(() => useWaypointManager());

      await act(async () => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
        result.current.addWaypoint([8.5417, 47.3769], 'Zurich');
      });

      expect(getDirections).toHaveBeenCalledWith(
        expect.arrayContaining([
          [6.1432, 46.2044],
          [8.5417, 47.3769]
        ]),
        'driving'
      );
    });

    it('should not calculate route with less than 2 waypoints', () => {
      const { getDirections } = vi.mocked(
        require('@/services/mapboxDirections')
      );

      const { result } = renderHook(() => useWaypointManager());

      act(() => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
      });

      expect(getDirections).not.toHaveBeenCalled();
    });

    it('should handle route calculation errors', async () => {
      const { getDirections } = vi.mocked(
        require('@/services/mapboxDirections')
      );
      
      getDirections.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useWaypointManager());

      await act(async () => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
        result.current.addWaypoint([8.5417, 47.3769], 'Zurich');
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.route).toBeNull();
    });

    it('should set loading state during route calculation', async () => {
      const { getDirections } = vi.mocked(
        require('@/services/mapboxDirections')
      );
      
      let resolveRoute: (value: any) => void;
      const routePromise = new Promise(resolve => {
        resolveRoute = resolve;
      });
      getDirections.mockReturnValue(routePromise);

      const { result } = renderHook(() => useWaypointManager());

      act(() => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
        result.current.addWaypoint([8.5417, 47.3769], 'Zurich');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveRoute({
          distance: 224000,
          duration: 7800,
          geometry: { coordinates: [], type: 'LineString' }
        });
        await routePromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should use different route profiles', async () => {
      const { getDirections } = vi.mocked(
        require('@/services/mapboxDirections')
      );
      
      getDirections.mockResolvedValue({
        distance: 224000,
        duration: 7800,
        geometry: { coordinates: [], type: 'LineString' }
      });

      const { result } = renderHook(() => useWaypointManager());

      act(() => {
        result.current.setRouteProfile('cycling');
      });

      await act(async () => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
        result.current.addWaypoint([8.5417, 47.3769], 'Zurich');
      });

      expect(getDirections).toHaveBeenCalledWith(
        expect.any(Array),
        'cycling'
      );
    });
  });

  describe('Error Handling', () => {
    it('should clear error when adding waypoints', async () => {
      const { result } = renderHook(() => useWaypointManager());

      // Set an error state
      act(() => {
        (result.current as any).setError('Previous error');
      });

      expect(result.current.error).toBe('Previous error');

      act(() => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle multiple simultaneous route calculations', async () => {
      const { getDirections } = vi.mocked(
        require('@/services/mapboxDirections')
      );
      
      let callCount = 0;
      getDirections.mockImplementation(() => {
        callCount++;
        return new Promise(resolve => {
          setTimeout(() => resolve({
            distance: 224000,
            duration: 7800,
            geometry: { coordinates: [], type: 'LineString' }
          }), callCount * 10);
        });
      });

      const { result } = renderHook(() => useWaypointManager());

      await act(async () => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
        result.current.addWaypoint([8.5417, 47.3769], 'Zurich');
        // Quickly add another waypoint to trigger another calculation
        result.current.addWaypoint([9.0, 48.0], 'Munich');
      });

      // Should only have the latest route calculation result
      expect(result.current.route).toBeDefined();
      expect(result.current.error).toBeNull();
    });
  });

  describe('Performance', () => {
    it('should debounce route calculations', async () => {
      const { getDirections } = vi.mocked(
        require('@/services/mapboxDirections')
      );
      
      getDirections.mockResolvedValue({
        distance: 224000,
        duration: 7800,
        geometry: { coordinates: [], type: 'LineString' }
      });

      const { result } = renderHook(() => useWaypointManager());

      // Add waypoints quickly
      await act(async () => {
        result.current.addWaypoint([6.1432, 46.2044], 'Geneva');
        result.current.addWaypoint([8.5417, 47.3769], 'Zurich');
        result.current.addWaypoint([9.0, 48.0], 'Munich');
      });

      // Should only call getDirections for the final state
      expect(getDirections).toHaveBeenCalledTimes(1);
    });
  });
});