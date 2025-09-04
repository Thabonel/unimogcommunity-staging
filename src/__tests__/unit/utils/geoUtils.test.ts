import { describe, it, expect } from 'vitest';
import { calculateDistance, formatDistance, getBoundingBox, isWithinRadius } from '@/utils/geoUtils';

describe('GeoUtils', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between Geneva and Zurich correctly', () => {
      // Known coordinates: Geneva (46.2044, 6.1432) to Zurich (47.3769, 8.5417)
      // Expected distance: approximately 224 km
      const distance = calculateDistance(46.2044, 6.1432, 47.3769, 8.5417);
      expect(distance).toBeCloseTo(224.0, 0); // Allow 1km variance
    });

    it('should return 0 for identical coordinates', () => {
      const distance = calculateDistance(46.2044, 6.1432, 46.2044, 6.1432);
      expect(distance).toBe(0);
    });

    it('should handle negative coordinates correctly', () => {
      // New York to London
      const distance = calculateDistance(40.7589, -73.9851, 51.5074, -0.1278);
      expect(distance).toBeGreaterThan(5500); // Approximately 5585 km
      expect(distance).toBeLessThan(5600);
    });

    it('should calculate short distances accurately', () => {
      // Very short distance (about 1 km)
      const distance = calculateDistance(46.2044, 6.1432, 46.2144, 6.1532);
      expect(distance).toBeCloseTo(1.0, 0);
    });

    it('should handle equator crossings', () => {
      // Point north of equator to point south of equator
      const distance = calculateDistance(10, 0, -10, 0);
      expect(distance).toBeCloseTo(2223.9, 0); // About 2224 km
    });

    it('should handle meridian crossings', () => {
      // Cross the prime meridian
      const distance = calculateDistance(51.5074, -0.1278, 51.5074, 0.1278);
      expect(distance).toBeCloseTo(17.9, 0); // About 18 km
    });

    it('should round to 1 decimal place', () => {
      const distance = calculateDistance(46.0, 6.0, 46.1, 6.1);
      expect(distance.toString()).toMatch(/^\d+\.\d$/); // Should have exactly 1 decimal place
    });
  });

  describe('formatDistance', () => {
    it('should format distances less than 1 km in meters', () => {
      expect(formatDistance(0.5)).toBe('500 m');
      expect(formatDistance(0.123)).toBe('123 m');
      expect(formatDistance(0.999)).toBe('999 m');
    });

    it('should format distances 1 km and above in kilometers', () => {
      expect(formatDistance(1.0)).toBe('1.0 km');
      expect(formatDistance(2.5)).toBe('2.5 km');
      expect(formatDistance(10.123)).toBe('10.1 km');
      expect(formatDistance(100.987)).toBe('101.0 km');
    });

    it('should handle zero distance', () => {
      expect(formatDistance(0)).toBe('0 m');
    });

    it('should handle very small distances', () => {
      expect(formatDistance(0.001)).toBe('1 m');
    });

    it('should handle large distances', () => {
      expect(formatDistance(1000.5)).toBe('1000.5 km');
    });

    it('should round meters to nearest whole number', () => {
      expect(formatDistance(0.1235)).toBe('124 m'); // 123.5 rounds to 124
      expect(formatDistance(0.1234)).toBe('123 m'); // 123.4 rounds to 123
    });
  });

  describe('getBoundingBox', () => {
    it('should calculate bounding box for Geneva with 10km radius', () => {
      const bbox = getBoundingBox(46.2044, 6.1432, 10);
      
      expect(bbox.minLat).toBeLessThan(46.2044);
      expect(bbox.maxLat).toBeGreaterThan(46.2044);
      expect(bbox.minLon).toBeLessThan(6.1432);
      expect(bbox.maxLon).toBeGreaterThan(6.1432);
      
      // Check approximate values (10km ≈ 0.09 degrees latitude)
      expect(Math.abs(bbox.maxLat - bbox.minLat)).toBeCloseTo(0.18, 1);
    });

    it('should handle equatorial coordinates', () => {
      const bbox = getBoundingBox(0, 0, 10);
      
      expect(bbox.minLat).toBeCloseTo(-0.09, 2);
      expect(bbox.maxLat).toBeCloseTo(0.09, 2);
      expect(bbox.minLon).toBeCloseTo(-0.09, 2);
      expect(bbox.maxLon).toBeCloseTo(0.09, 2);
    });

    it('should handle polar regions where longitude difference is larger', () => {
      const bbox = getBoundingBox(80, 0, 10); // Near North Pole
      
      expect(bbox.minLat).toBeLessThan(80);
      expect(bbox.maxLat).toBeGreaterThan(80);
      
      // At high latitudes, longitude delta should be much larger
      const lonDelta = bbox.maxLon - bbox.minLon;
      expect(lonDelta).toBeGreaterThan(1); // Should be > 1 degree
    });

    it('should handle zero radius', () => {
      const bbox = getBoundingBox(46.2044, 6.1432, 0);
      
      expect(bbox.minLat).toBe(46.2044);
      expect(bbox.maxLat).toBe(46.2044);
      expect(bbox.minLon).toBe(6.1432);
      expect(bbox.maxLon).toBe(6.1432);
    });

    it('should create symmetric bounding box', () => {
      const centerLat = 45.0;
      const centerLon = 7.0;
      const radius = 5;
      const bbox = getBoundingBox(centerLat, centerLon, radius);
      
      expect(centerLat - bbox.minLat).toBeCloseTo(bbox.maxLat - centerLat, 5);
      expect(centerLon - bbox.minLon).toBeCloseTo(bbox.maxLon - centerLon, 5);
    });
  });

  describe('isWithinRadius', () => {
    it('should return true for points within radius', () => {
      // Geneva to nearby point (less than 10 km away)
      const result = isWithinRadius(46.2044, 6.1432, 46.2144, 6.1532, 10);
      expect(result).toBe(true);
    });

    it('should return false for points outside radius', () => {
      // Geneva to Zurich (224 km away, outside 100 km radius)
      const result = isWithinRadius(46.2044, 6.1432, 47.3769, 8.5417, 100);
      expect(result).toBe(false);
    });

    it('should return true for points exactly on radius boundary', () => {
      // Calculate a point exactly 10 km away
      const distance = calculateDistance(46.2044, 6.1432, 46.2944, 6.1432);
      const result = isWithinRadius(46.2044, 6.1432, 46.2944, 6.1432, distance);
      expect(result).toBe(true);
    });

    it('should return true for identical coordinates regardless of radius', () => {
      const result = isWithinRadius(46.2044, 6.1432, 46.2044, 6.1432, 0.001);
      expect(result).toBe(true);
    });

    it('should handle zero radius correctly', () => {
      // Only identical coordinates should be within zero radius
      const samePoint = isWithinRadius(46.2044, 6.1432, 46.2044, 6.1432, 0);
      const differentPoint = isWithinRadius(46.2044, 6.1432, 46.2045, 6.1433, 0);
      
      expect(samePoint).toBe(true);
      expect(differentPoint).toBe(false);
    });

    it('should handle very large radius', () => {
      // Entire Earth circumference is about 40,075 km
      const result = isWithinRadius(0, 0, 45, 90, 50000);
      expect(result).toBe(true);
    });

    it('should work with negative coordinates', () => {
      // Test with southern hemisphere coordinates
      const result = isWithinRadius(-33.9249, 18.4241, -33.9349, 18.4341, 2);
      expect(result).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle extreme latitude values', () => {
      // Test near poles
      const northPole = calculateDistance(89.9, 0, 90, 0);
      const southPole = calculateDistance(-89.9, 0, -90, 0);
      
      expect(northPole).toBeGreaterThan(0);
      expect(southPole).toBeGreaterThan(0);
    });

    it('should handle longitude wraparound', () => {
      // Test crossing 180/-180 meridian
      const distance = calculateDistance(0, 179, 0, -179);
      expect(distance).toBeCloseTo(222.4, 0); // Should be about 222 km, not ~35,000 km
    });

    it('should handle very small coordinate differences', () => {
      const distance = calculateDistance(46.123456, 6.123456, 46.123457, 6.123457);
      expect(distance).toBeGreaterThanOrEqual(0);
      expect(distance).toBeLessThan(0.01); // Should be very small
    });
  });

  describe('Performance and Precision', () => {
    it('should maintain precision for repeated calculations', () => {
      const lat1 = 46.2044;
      const lon1 = 6.1432;
      const lat2 = 47.3769;
      const lon2 = 8.5417;
      
      const results = [];
      for (let i = 0; i < 100; i++) {
        results.push(calculateDistance(lat1, lon1, lat2, lon2));
      }
      
      // All results should be identical
      const firstResult = results[0];
      expect(results.every(result => result === firstResult)).toBe(true);
    });

    it('should handle batch calculations efficiently', () => {
      const centerLat = 46.2044;
      const centerLon = 6.1432;
      const testPoints = [];
      
      // Generate 1000 test points
      for (let i = 0; i < 1000; i++) {
        testPoints.push({
          lat: centerLat + (Math.random() - 0.5) * 2,
          lon: centerLon + (Math.random() - 0.5) * 2
        });
      }
      
      const start = performance.now();
      const results = testPoints.map(point => 
        calculateDistance(centerLat, centerLon, point.lat, point.lon)
      );
      const end = performance.now();
      
      expect(results).toHaveLength(1000);
      expect(end - start).toBeLessThan(100); // Should complete in < 100ms
    });
  });
});