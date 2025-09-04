import { describe, it, expect, beforeEach } from 'vitest';
import { parseGPX, parseKML, trackToGeoJSON, ParsedTrack, TrackPoint } from '@/utils/gpxParser';

describe('GPX Parser', () => {
  describe('parseGPX', () => {
    it('should parse a valid GPX file with track points', () => {
      const gpxString = `
        <?xml version="1.0" encoding="UTF-8"?>
        <gpx version="1.1" creator="test">
          <trk>
            <name>Alpine Adventure Route</name>
            <trkseg>
              <trkpt lat="46.5197" lon="6.6323">
                <ele>372</ele>
                <time>2024-01-01T10:00:00Z</time>
              </trkpt>
              <trkpt lat="46.5287" lon="6.6423">
                <ele>385</ele>
                <time>2024-01-01T10:05:00Z</time>
              </trkpt>
              <trkpt lat="46.5377" lon="6.6523">
                <ele>398</ele>
                <time>2024-01-01T10:10:00Z</time>
              </trkpt>
            </trkseg>
          </trk>
        </gpx>
      `;

      const result = parseGPX(gpxString);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Alpine Adventure Route');
      expect(result?.points).toHaveLength(3);
      expect(result?.points[0]).toMatchObject({
        lat: 46.5197,
        lon: 6.6323,
        ele: 372,
        time: '2024-01-01T10:00:00Z'
      });
      expect(result?.bounds).toMatchObject({
        minLat: 46.5197,
        maxLat: 46.5377,
        minLon: 6.6323,
        maxLon: 6.6523
      });
      expect(result?.totalDistance).toBeGreaterThan(0);
    });

    it('should handle GPX without track name', () => {
      const gpxString = `
        <?xml version="1.0" encoding="UTF-8"?>
        <gpx version="1.1">
          <trk>
            <trkseg>
              <trkpt lat="46.5197" lon="6.6323">
                <ele>372</ele>
              </trkpt>
              <trkpt lat="46.5287" lon="6.6423">
                <ele>385</ele>
              </trkpt>
            </trkseg>
          </trk>
        </gpx>
      `;

      const result = parseGPX(gpxString);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Unnamed Track');
    });

    it('should handle GPX without elevation data', () => {
      const gpxString = `
        <?xml version="1.0" encoding="UTF-8"?>
        <gpx version="1.1">
          <trk>
            <name>Simple Route</name>
            <trkseg>
              <trkpt lat="46.5197" lon="6.6323" />
              <trkpt lat="46.5287" lon="6.6423" />
            </trkseg>
          </trk>
        </gpx>
      `;

      const result = parseGPX(gpxString);

      expect(result).not.toBeNull();
      expect(result?.points[0].ele).toBeUndefined();
      expect(result?.points[1].ele).toBeUndefined();
    });

    it('should handle GPX without time data', () => {
      const gpxString = `
        <?xml version="1.0" encoding="UTF-8"?>
        <gpx version="1.1">
          <trk>
            <name>No Time Route</name>
            <trkseg>
              <trkpt lat="46.5197" lon="6.6323">
                <ele>372</ele>
              </trkpt>
              <trkpt lat="46.5287" lon="6.6423">
                <ele>385</ele>
              </trkpt>
            </trkseg>
          </trk>
        </gpx>
      `;

      const result = parseGPX(gpxString);

      expect(result).not.toBeNull();
      expect(result?.points[0].time).toBeUndefined();
      expect(result?.points[1].time).toBeUndefined();
    });

    it('should return null for invalid XML', () => {
      const invalidGpx = 'This is not XML';
      const result = parseGPX(invalidGpx);
      expect(result).toBeNull();
    });

    it('should return null for GPX with no track points', () => {
      const gpxString = `
        <?xml version="1.0" encoding="UTF-8"?>
        <gpx version="1.1">
          <trk>
            <name>Empty Track</name>
            <trkseg>
            </trkseg>
          </trk>
        </gpx>
      `;

      const result = parseGPX(gpxString);
      expect(result).toBeNull();
    });

    it('should handle malformed track points gracefully', () => {
      const gpxString = `
        <?xml version="1.0" encoding="UTF-8"?>
        <gpx version="1.1">
          <trk>
            <name>Mixed Quality Route</name>
            <trkseg>
              <trkpt lat="46.5197" lon="6.6323">
                <ele>372</ele>
              </trkpt>
              <trkpt lat="" lon="">
              </trkpt>
              <trkpt lat="46.5377" lon="6.6523">
                <ele>398</ele>
              </trkpt>
            </trkseg>
          </trk>
        </gpx>
      `;

      const result = parseGPX(gpxString);

      expect(result).not.toBeNull();
      expect(result?.points).toHaveLength(2); // Should skip the invalid point
    });

    it('should calculate distance correctly', () => {
      const gpxString = `
        <?xml version="1.0" encoding="UTF-8"?>
        <gpx version="1.1">
          <trk>
            <name>Distance Test</name>
            <trkseg>
              <trkpt lat="46.5197" lon="6.6323" />
              <trkpt lat="46.5287" lon="6.6423" />
            </trkseg>
          </trk>
        </gpx>
      `;

      const result = parseGPX(gpxString);

      expect(result).not.toBeNull();
      expect(result?.totalDistance).toBeGreaterThan(0);
      expect(result?.totalDistance).toBeLessThan(50); // Should be reasonable distance in km
    });
  });

  describe('parseKML', () => {
    it('should parse a valid KML file', () => {
      const kmlString = `
        <?xml version="1.0" encoding="UTF-8"?>
        <kml xmlns="http://www.opengis.net/kml/2.2">
          <Document>
            <Placemark>
              <name>City Circuit</name>
              <LineString>
                <coordinates>6.6323,46.5197,372 6.6423,46.5287,385 6.6523,46.5377,398</coordinates>
              </LineString>
            </Placemark>
          </Document>
        </kml>
      `;

      const result = parseKML(kmlString);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('City Circuit');
      expect(result?.points).toHaveLength(3);
      expect(result?.points[0]).toMatchObject({
        lat: 46.5197,
        lon: 6.6323,
        ele: 372
      });
      expect(result?.totalDistance).toBeGreaterThan(0);
    });

    it('should handle KML without elevation data', () => {
      const kmlString = `
        <?xml version="1.0" encoding="UTF-8"?>
        <kml xmlns="http://www.opengis.net/kml/2.2">
          <Document>
            <Placemark>
              <name>Simple Route</name>
              <LineString>
                <coordinates>6.6323,46.5197 6.6423,46.5287</coordinates>
              </LineString>
            </Placemark>
          </Document>
        </kml>
      `;

      const result = parseKML(kmlString);

      expect(result).not.toBeNull();
      expect(result?.points[0].ele).toBeUndefined();
      expect(result?.points[1].ele).toBeUndefined();
    });

    it('should return null for KML without coordinates', () => {
      const kmlString = `
        <?xml version="1.0" encoding="UTF-8"?>
        <kml xmlns="http://www.opengis.net/kml/2.2">
          <Document>
            <Placemark>
              <name>No Coordinates</name>
              <Point />
            </Placemark>
          </Document>
        </kml>
      `;

      const result = parseKML(kmlString);
      expect(result).toBeNull();
    });

    it('should handle invalid coordinates gracefully', () => {
      const kmlString = `
        <?xml version="1.0" encoding="UTF-8"?>
        <kml xmlns="http://www.opengis.net/kml/2.2">
          <Document>
            <Placemark>
              <name>Mixed Quality Route</name>
              <LineString>
                <coordinates>6.6323,46.5197 invalid,coordinates 6.6523,46.5377</coordinates>
              </LineString>
            </Placemark>
          </Document>
        </kml>
      `;

      const result = parseKML(kmlString);

      expect(result).not.toBeNull();
      expect(result?.points).toHaveLength(2); // Should skip the invalid coordinate
    });

    it('should return null for invalid XML', () => {
      const invalidKml = 'This is not XML';
      const result = parseKML(invalidKml);
      expect(result).toBeNull();
    });
  });

  describe('trackToGeoJSON', () => {
    it('should convert a parsed track to GeoJSON format', () => {
      const mockTrack: ParsedTrack = {
        name: 'Test Route',
        points: [
          { lat: 46.5197, lon: 6.6323, ele: 372, time: '2024-01-01T10:00:00Z' },
          { lat: 46.5287, lon: 6.6423, ele: 385, time: '2024-01-01T10:05:00Z' },
          { lat: 46.5377, lon: 6.6523, ele: 398, time: '2024-01-01T10:10:00Z' }
        ],
        totalDistance: 2.5,
        bounds: {
          minLat: 46.5197,
          maxLat: 46.5377,
          minLon: 6.6323,
          maxLon: 6.6523
        }
      };

      const geoJSON = trackToGeoJSON(mockTrack);

      expect(geoJSON.type).toBe('Feature');
      expect(geoJSON.properties.name).toBe('Test Route');
      expect(geoJSON.properties.distance).toBe(2.5);
      expect(geoJSON.geometry.type).toBe('LineString');
      expect(geoJSON.geometry.coordinates).toHaveLength(3);
      expect(geoJSON.geometry.coordinates[0]).toEqual([6.6323, 46.5197, 372]);
    });

    it('should handle points without elevation', () => {
      const mockTrack: ParsedTrack = {
        name: 'No Elevation Route',
        points: [
          { lat: 46.5197, lon: 6.6323 },
          { lat: 46.5287, lon: 6.6423 }
        ],
        totalDistance: 1.2,
        bounds: {
          minLat: 46.5197,
          maxLat: 46.5287,
          minLon: 6.6323,
          maxLon: 6.6423
        }
      };

      const geoJSON = trackToGeoJSON(mockTrack);

      expect(geoJSON.geometry.coordinates[0]).toEqual([6.6323, 46.5197, 0]);
      expect(geoJSON.geometry.coordinates[1]).toEqual([6.6423, 46.5287, 0]);
    });

    it('should handle empty track gracefully', () => {
      const mockTrack: ParsedTrack = {
        name: 'Empty Route',
        points: [],
        totalDistance: 0,
        bounds: {
          minLat: 0,
          maxLat: 0,
          minLon: 0,
          maxLon: 0
        }
      };

      const geoJSON = trackToGeoJSON(mockTrack);

      expect(geoJSON.geometry.coordinates).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle DOM parser errors in GPX', () => {
      // Mock DOMParser to return an error
      const originalDOMParser = window.DOMParser;
      window.DOMParser = class {
        parseFromString() {
          const doc = document.implementation.createDocument(null, null, null);
          const errorNode = doc.createElement('parsererror');
          errorNode.textContent = 'XML parsing error';
          doc.appendChild(errorNode);
          return doc;
        }
      } as any;

      const result = parseGPX('<invalid>xml</invalid>');
      expect(result).toBeNull();

      // Restore original DOMParser
      window.DOMParser = originalDOMParser;
    });

    it('should handle exceptions during GPX parsing', () => {
      // Mock DOMParser to throw an exception
      const originalDOMParser = window.DOMParser;
      window.DOMParser = class {
        parseFromString() {
          throw new Error('Parser error');
        }
      } as any;

      const result = parseGPX('valid xml');
      expect(result).toBeNull();

      // Restore original DOMParser
      window.DOMParser = originalDOMParser;
    });
  });

  describe('Distance Calculation', () => {
    it('should calculate accurate distances between known coordinates', () => {
      // Test with known coordinates (Geneva to Zurich approximately 224km)
      const gpxString = `
        <?xml version="1.0" encoding="UTF-8"?>
        <gpx version="1.1">
          <trk>
            <name>Geneva to Zurich</name>
            <trkseg>
              <trkpt lat="46.2044" lon="6.1432" />
              <trkpt lat="47.3769" lon="8.5417" />
            </trkseg>
          </trk>
        </gpx>
      `;

      const result = parseGPX(gpxString);

      expect(result).not.toBeNull();
      // Distance should be approximately 224km (allow for some variance)
      expect(result?.totalDistance).toBeGreaterThan(200);
      expect(result?.totalDistance).toBeLessThan(250);
    });

    it('should return zero distance for single point', () => {
      const gpxString = `
        <?xml version="1.0" encoding="UTF-8"?>
        <gpx version="1.1">
          <trk>
            <name>Single Point</name>
            <trkseg>
              <trkpt lat="46.2044" lon="6.1432" />
            </trkseg>
          </trk>
        </gpx>
      `;

      const result = parseGPX(gpxString);

      expect(result).not.toBeNull();
      expect(result?.totalDistance).toBe(0);
    });
  });

  describe('Bounds Calculation', () => {
    it('should calculate correct bounds for multiple points', () => {
      const gpxString = `
        <?xml version="1.0" encoding="UTF-8"?>
        <gpx version="1.1">
          <trk>
            <name>Bounds Test</name>
            <trkseg>
              <trkpt lat="46.0" lon="6.0" />
              <trkpt lat="47.0" lon="8.0" />
              <trkpt lat="45.5" lon="7.5" />
            </trkseg>
          </trk>
        </gpx>
      `;

      const result = parseGPX(gpxString);

      expect(result).not.toBeNull();
      expect(result?.bounds).toEqual({
        minLat: 45.5,
        maxLat: 47.0,
        minLon: 6.0,
        maxLon: 8.0
      });
    });

    it('should handle single point bounds', () => {
      const gpxString = `
        <?xml version="1.0" encoding="UTF-8"?>
        <gpx version="1.1">
          <trk>
            <name>Single Point Bounds</name>
            <trkseg>
              <trkpt lat="46.2044" lon="6.1432" />
            </trkseg>
          </trk>
        </gpx>
      `;

      const result = parseGPX(gpxString);

      expect(result).not.toBeNull();
      expect(result?.bounds).toEqual({
        minLat: 46.2044,
        maxLat: 46.2044,
        minLon: 6.1432,
        maxLon: 6.1432
      });
    });
  });
});