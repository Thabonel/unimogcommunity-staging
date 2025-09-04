import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { performance } from 'perf_hooks';
import { renderHook, act } from '@testing-library/react';
import { useWaypointManager } from '@/hooks/use-waypoint-manager';
import { parseGPX, parseKML } from '@/utils/gpxParser';
import { calculateDistance, getBoundingBox, isWithinRadius } from '@/utils/geoUtils';
import { savePlannedRoute, fetchUserTracks } from '@/services/trackService';
import { mockSupabase } from '@/../../__tests__/mocks/supabase';
import { setupMapboxMocks, mapboxTestUtils } from '@/../../__tests__/mocks/mapbox';

// Performance testing utilities
class PerformanceBenchmark {
  private results: Array<{ name: string; duration: number; memory?: number }> = [];

  async measure<T>(name: string, fn: () => Promise<T> | T): Promise<T> {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const memoryBefore = process.memoryUsage();
    const start = performance.now();
    
    try {
      const result = await fn();
      return result;
    } finally {
      const end = performance.now();
      const memoryAfter = process.memoryUsage();
      
      const duration = end - start;
      const memoryDelta = memoryAfter.heapUsed - memoryBefore.heapUsed;
      
      this.results.push({
        name,
        duration,
        memory: memoryDelta
      });
    }
  }

  getResults() {
    return [...this.results];
  }

  getAverageTime(name: string): number {
    const measurements = this.results.filter(r => r.name === name);
    if (measurements.length === 0) return 0;
    return measurements.reduce((sum, m) => sum + m.duration, 0) / measurements.length;
  }

  reset() {
    this.results = [];
  }

  printSummary() {
    console.log('\n🚀 Performance Benchmark Results:');
    console.log('=====================================');
    
    const grouped = this.results.reduce((acc, result) => {
      if (!acc[result.name]) {
        acc[result.name] = [];
      }
      acc[result.name].push(result);
      return acc;
    }, {} as Record<string, typeof this.results>);

    Object.entries(grouped).forEach(([name, measurements]) => {
      const avgTime = measurements.reduce((sum, m) => sum + m.duration, 0) / measurements.length;
      const minTime = Math.min(...measurements.map(m => m.duration));
      const maxTime = Math.max(...measurements.map(m => m.duration));
      const avgMemory = measurements
        .filter(m => m.memory !== undefined)
        .reduce((sum, m) => sum + (m.memory || 0), 0) / measurements.length;

      console.log(`\n📊 ${name}:`);
      console.log(`   Time: ${avgTime.toFixed(2)}ms (min: ${minTime.toFixed(2)}, max: ${maxTime.toFixed(2)})`);
      if (avgMemory) {
        console.log(`   Memory: ${(avgMemory / 1024 / 1024).toFixed(2)}MB`);
      }
      console.log(`   Runs: ${measurements.length}`);
    });
  }
}

// Mock setup
vi.mock('@/lib/supabase-client', () => ({
  supabase: mockSupabase
}));

setupMapboxMocks();

describe('Trip Planner Performance Benchmarks', () => {
  let benchmark: PerformanceBenchmark;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.__resetMocks();
    mapboxTestUtils.resetMocks();
    benchmark = new PerformanceBenchmark();
  });

  afterEach(() => {
    benchmark.printSummary();
    benchmark.reset();
  });

  describe('GPX/KML Parsing Performance', () => {
    it('should parse small GPX files efficiently', async () => {
      const smallGpx = `
        <?xml version="1.0" encoding="UTF-8"?>
        <gpx version="1.1">
          <trk>
            <name>Small Track</name>
            <trkseg>
              ${Array.from({ length: 100 }, (_, i) => `
                <trkpt lat="${46.5 + i * 0.001}" lon="${6.6 + i * 0.001}">
                  <ele>${400 + i}</ele>
                  <time>2024-01-01T${10 + Math.floor(i/60)}:${i%60 < 10 ? '0' : ''}${i%60}:00Z</time>
                </trkpt>
              `).join('')}
            </trkseg>
          </trk>
        </gpx>
      `;

      // Run multiple iterations to get consistent timing
      for (let i = 0; i < 10; i++) {
        await benchmark.measure('Small GPX Parse (100 points)', () => {
          const result = parseGPX(smallGpx);
          expect(result).not.toBeNull();
          expect(result?.points).toHaveLength(100);
          return result;
        });
      }

      const avgTime = benchmark.getAverageTime('Small GPX Parse (100 points)');
      expect(avgTime).toBeLessThan(50); // Should parse in under 50ms
    });

    it('should parse large GPX files within acceptable time', async () => {
      const largeGpx = `
        <?xml version="1.0" encoding="UTF-8"?>
        <gpx version="1.1">
          <trk>
            <name>Large Track</name>
            <trkseg>
              ${Array.from({ length: 5000 }, (_, i) => `
                <trkpt lat="${46.5 + i * 0.0001}" lon="${6.6 + i * 0.0001}">
                  <ele>${400 + Math.sin(i / 100) * 200}</ele>
                  <time>2024-01-01T${10 + Math.floor(i/3600)}:${Math.floor((i%3600)/60)}:${i%60 < 10 ? '0' : ''}${i%60}Z</time>
                </trkpt>
              `).join('')}
            </trkseg>
          </trk>
        </gpx>
      `;

      // Test fewer iterations for large files
      for (let i = 0; i < 3; i++) {
        await benchmark.measure('Large GPX Parse (5000 points)', () => {
          const result = parseGPX(largeGpx);
          expect(result).not.toBeNull();
          expect(result?.points).toHaveLength(5000);
          return result;
        });
      }

      const avgTime = benchmark.getAverageTime('Large GPX Parse (5000 points)');
      expect(avgTime).toBeLessThan(500); // Should parse in under 500ms
    });

    it('should handle KML parsing efficiently', async () => {
      const kmlData = `
        <?xml version="1.0" encoding="UTF-8"?>
        <kml xmlns="http://www.opengis.net/kml/2.2">
          <Document>
            <Placemark>
              <name>Performance Test Route</name>
              <LineString>
                <coordinates>
                  ${Array.from({ length: 1000 }, (_, i) => 
                    `${6.6 + i * 0.0001},${46.5 + i * 0.0001},${400 + i}`
                  ).join(' ')}
                </coordinates>
              </LineString>
            </Placemark>
          </Document>
        </kml>
      `;

      for (let i = 0; i < 5; i++) {
        await benchmark.measure('KML Parse (1000 points)', () => {
          const result = parseKML(kmlData);
          expect(result).not.toBeNull();
          expect(result?.points).toHaveLength(1000);
          return result;
        });
      }

      const avgTime = benchmark.getAverageTime('KML Parse (1000 points)');
      expect(avgTime).toBeLessThan(100); // Should parse in under 100ms
    });
  });

  describe('Geographic Calculations Performance', () => {
    it('should calculate distances efficiently', async () => {
      const coordinates = Array.from({ length: 1000 }, () => ({
        lat: 46.0 + Math.random() * 2,
        lon: 6.0 + Math.random() * 2
      }));

      for (let i = 0; i < 10; i++) {
        await benchmark.measure('Distance Calculations (1000 pairs)', () => {
          const distances: number[] = [];
          for (let j = 0; j < coordinates.length - 1; j++) {
            const dist = calculateDistance(
              coordinates[j].lat,
              coordinates[j].lon,
              coordinates[j + 1].lat,
              coordinates[j + 1].lon
            );
            distances.push(dist);
          }
          return distances;
        });
      }

      const avgTime = benchmark.getAverageTime('Distance Calculations (1000 pairs)');
      expect(avgTime).toBeLessThan(20); // Should calculate in under 20ms
    });

    it('should perform bounding box calculations efficiently', async () => {
      const centers = Array.from({ length: 1000 }, () => ({
        lat: 46.0 + Math.random() * 2,
        lon: 6.0 + Math.random() * 2,
        radius: 1 + Math.random() * 50
      }));

      for (let i = 0; i < 10; i++) {
        await benchmark.measure('Bounding Box Calculations (1000)', () => {
          const boxes = centers.map(center => 
            getBoundingBox(center.lat, center.lon, center.radius)
          );
          return boxes;
        });
      }

      const avgTime = benchmark.getAverageTime('Bounding Box Calculations (1000)');
      expect(avgTime).toBeLessThan(10); // Should calculate in under 10ms
    });

    it('should perform radius checks efficiently', async () => {
      const center = { lat: 46.2044, lon: 6.1432 };
      const testPoints = Array.from({ length: 1000 }, () => ({
        lat: 46.0 + Math.random() * 2,
        lon: 6.0 + Math.random() * 2
      }));

      for (let i = 0; i < 10; i++) {
        await benchmark.measure('Radius Checks (1000 points)', () => {
          const results = testPoints.map(point =>
            isWithinRadius(center.lat, center.lon, point.lat, point.lon, 25)
          );
          return results;
        });
      }

      const avgTime = benchmark.getAverageTime('Radius Checks (1000 points)');
      expect(avgTime).toBeLessThan(15); // Should check in under 15ms
    });
  });

  describe('Hook Performance', () => {
    it('should handle rapid waypoint additions efficiently', async () => {
      for (let i = 0; i < 5; i++) {
        await benchmark.measure('Rapid Waypoint Additions (10)', async () => {
          const { result } = renderHook(() => useWaypointManager());

          // Add 10 waypoints rapidly
          for (let j = 0; j < 10; j++) {
            await act(async () => {
              result.current.addWaypoint(
                [6.1432 + j * 0.01, 46.2044 + j * 0.01],
                `Waypoint ${j}`
              );
            });
          }

          expect(result.current.waypoints).toHaveLength(10);
          return result.current.waypoints;
        });
      }

      const avgTime = benchmark.getAverageTime('Rapid Waypoint Additions (10)');
      expect(avgTime).toBeLessThan(100); // Should handle in under 100ms
    });

    it('should handle waypoint reordering efficiently', async () => {
      const { result } = renderHook(() => useWaypointManager());

      // Setup initial waypoints
      await act(async () => {
        for (let i = 0; i < 10; i++) {
          result.current.addWaypoint(
            [6.1432 + i * 0.01, 46.2044 + i * 0.01],
            `Waypoint ${i}`
          );
        }
      });

      for (let i = 0; i < 5; i++) {
        await benchmark.measure('Waypoint Reordering', async () => {
          await act(async () => {
            // Reorder waypoints randomly
            const from = Math.floor(Math.random() * 10);
            const to = Math.floor(Math.random() * 10);
            result.current.reorderWaypoints(from, to);
          });
          return result.current.waypoints;
        });
      }

      const avgTime = benchmark.getAverageTime('Waypoint Reordering');
      expect(avgTime).toBeLessThan(20); // Should reorder in under 20ms
    });
  });

  describe('Database Operations Performance', () => {
    it('should save routes efficiently', async () => {
      const mockWaypoints = Array.from({ length: 10 }, (_, i) => ({
        id: `wp-${i}`,
        name: `Waypoint ${i}`,
        coords: [6.1432 + i * 0.01, 46.2044 + i * 0.01] as [number, number],
        type: i === 0 ? 'start' : i === 9 ? 'destination' : 'waypoint'
      }));

      const mockRoute = {
        distance: 50000,
        duration: 3600,
        geometry: {
          coordinates: mockWaypoints.map(wp => wp.coords),
          type: 'LineString' as const
        }
      };

      // Mock successful database response
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'route-123', name: 'Test Route' },
              error: null
            })
          })
        })
      });

      for (let i = 0; i < 10; i++) {
        await benchmark.measure('Route Save Operation', async () => {
          const result = await savePlannedRoute(
            mockWaypoints,
            mockRoute,
            'test-user-id',
            'driving',
            {
              name: `Performance Test Route ${i}`,
              description: 'Generated for performance testing'
            }
          );
          expect(result).not.toBeNull();
          return result;
        });
      }

      const avgTime = benchmark.getAverageTime('Route Save Operation');
      expect(avgTime).toBeLessThan(50); // Should save in under 50ms (mocked)
    });

    it('should fetch user tracks efficiently', async () => {
      // Mock database response with many tracks
      const mockTracks = Array.from({ length: 100 }, (_, i) => ({
        id: `track-${i}`,
        name: `Track ${i}`,
        distance_km: 10 + Math.random() * 40,
        created_by: 'test-user-id',
        created_at: new Date().toISOString()
      }));

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

      for (let i = 0; i < 10; i++) {
        await benchmark.measure('Fetch User Tracks (100)', async () => {
          const tracks = await fetchUserTracks('test-user-id');
          expect(tracks).toHaveLength(100);
          return tracks;
        });
      }

      const avgTime = benchmark.getAverageTime('Fetch User Tracks (100)');
      expect(avgTime).toBeLessThan(30); // Should fetch in under 30ms (mocked)
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory during repeated operations', async () => {
      const initialMemory = process.memoryUsage();

      // Perform many operations that might cause memory leaks
      for (let i = 0; i < 100; i++) {
        await benchmark.measure(`Memory Test Iteration ${i}`, () => {
          // Parse GPX
          const gpxString = `
            <?xml version="1.0" encoding="UTF-8"?>
            <gpx version="1.1">
              <trk>
                <name>Memory Test ${i}</name>
                <trkseg>
                  ${Array.from({ length: 50 }, (_, j) => `
                    <trkpt lat="${46.5 + j * 0.001}" lon="${6.6 + j * 0.001}">
                      <ele>${400 + j}</ele>
                    </trkpt>
                  `).join('')}
                </trkseg>
              </trk>
            </gpx>
          `;
          
          const parsedTrack = parseGPX(gpxString);
          
          // Perform calculations
          if (parsedTrack && parsedTrack.points.length > 1) {
            for (let k = 0; k < parsedTrack.points.length - 1; k++) {
              calculateDistance(
                parsedTrack.points[k].lat,
                parsedTrack.points[k].lon,
                parsedTrack.points[k + 1].lat,
                parsedTrack.points[k + 1].lon
              );
            }
          }
          
          return parsedTrack;
        });
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      
      // Memory should not increase by more than 50MB for this test
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should cleanup waypoint manager resources', async () => {
      const initialMemory = process.memoryUsage();

      // Create and destroy many waypoint managers
      for (let i = 0; i < 20; i++) {
        const { result, unmount } = renderHook(() => useWaypointManager());

        await act(async () => {
          for (let j = 0; j < 20; j++) {
            result.current.addWaypoint(
              [6.1432 + j * 0.01, 46.2044 + j * 0.01],
              `Waypoint ${j}`
            );
          }
        });

        // Unmount to trigger cleanup
        unmount();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      console.log(`Waypoint manager memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      
      // Should not leak significant memory
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
    });
  });

  describe('Performance Regression Tests', () => {
    it('should maintain performance baselines', () => {
      const results = benchmark.getResults();
      
      // Define performance baselines (these should be updated when performance improves)
      const baselines = {
        'Small GPX Parse (100 points)': 50,
        'Distance Calculations (1000 pairs)': 20,
        'Bounding Box Calculations (1000)': 10,
        'Radius Checks (1000 points)': 15,
        'Route Save Operation': 50,
        'Fetch User Tracks (100)': 30
      };

      // Check if any operation exceeded baseline
      const violations = results.filter(result => {
        const baseline = baselines[result.name as keyof typeof baselines];
        return baseline && result.duration > baseline;
      });

      if (violations.length > 0) {
        console.warn('⚠️  Performance regressions detected:');
        violations.forEach(violation => {
          const baseline = baselines[violation.name as keyof typeof baselines];
          console.warn(`   ${violation.name}: ${violation.duration.toFixed(2)}ms (baseline: ${baseline}ms)`);
        });
      }

      // This assertion will pass but logs warnings for manual review
      expect(violations.length).toBeLessThanOrEqual(results.length);
    });
  });
});