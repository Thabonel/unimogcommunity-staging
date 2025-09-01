/**
 * GPX Export Utilities
 * Handles exporting routes and tracks to GPX format
 */

interface GPXPoint {
  lat: number;
  lon: number;
  elevation?: number;
  time?: string;
}

interface GPXExportOptions {
  name?: string;
  description?: string;
  creator?: string;
  includeTimestamps?: boolean;
  includeElevation?: boolean;
}

/**
 * Export waypoints and route to GPX format
 */
export function exportToGPX(
  points: GPXPoint[],
  options: GPXExportOptions = {}
): string {
  const {
    name = 'Unimog Route',
    description = 'Route exported from Unimog Community Hub',
    creator = 'Unimog Community Hub',
    includeTimestamps = true,
    includeElevation = true
  } = options;

  const timestamp = new Date().toISOString();

  // GPX header
  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="${escapeXml(creator)}"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXml(name)}</name>
    <desc>${escapeXml(description)}</desc>
    <time>${timestamp}</time>
  </metadata>`;

  // Add track
  gpx += `
  <trk>
    <name>${escapeXml(name)}</name>
    <desc>${escapeXml(description)}</desc>
    <trkseg>`;

  // Add track points
  points.forEach((point, index) => {
    gpx += `
      <trkpt lat="${point.lat}" lon="${point.lon}">`;
    
    if (includeElevation && point.elevation !== undefined) {
      gpx += `
        <ele>${point.elevation}</ele>`;
    }
    
    if (includeTimestamps) {
      const time = point.time || new Date(Date.now() + index * 60000).toISOString();
      gpx += `
        <time>${time}</time>`;
    }
    
    gpx += `
      </trkpt>`;
  });

  gpx += `
    </trkseg>
  </trk>`;

  // Add waypoints for first and last points
  if (points.length > 0) {
    // Start waypoint
    gpx += `
  <wpt lat="${points[0].lat}" lon="${points[0].lon}">
    <name>Start</name>
    <desc>Route start point</desc>`;
    if (points[0].elevation !== undefined) {
      gpx += `
    <ele>${points[0].elevation}</ele>`;
    }
    gpx += `
  </wpt>`;

    // End waypoint
    if (points.length > 1) {
      const lastPoint = points[points.length - 1];
      gpx += `
  <wpt lat="${lastPoint.lat}" lon="${lastPoint.lon}">
    <name>End</name>
    <desc>Route end point</desc>`;
      if (lastPoint.elevation !== undefined) {
        gpx += `
    <ele>${lastPoint.elevation}</ele>`;
      }
      gpx += `
  </wpt>`;
    }
  }

  gpx += `
</gpx>`;

  return gpx;
}

/**
 * Download GPX file
 */
export function downloadGPX(
  points: GPXPoint[],
  filename: string = 'route.gpx',
  options: GPXExportOptions = {}
): void {
  const gpxContent = exportToGPX(points, options);
  const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Convert route with waypoints to GPX points
 */
export function routeToGPXPoints(
  route: any,
  waypoints?: Array<{ lat: number; lon: number }>
): GPXPoint[] {
  const points: GPXPoint[] = [];
  
  // If we have a detailed route with coordinates
  if (route?.routes?.[0]?.geometry?.coordinates) {
    route.routes[0].geometry.coordinates.forEach((coord: number[]) => {
      points.push({
        lon: coord[0],
        lat: coord[1],
        elevation: coord[2] // If elevation is available
      });
    });
  } else if (waypoints && waypoints.length > 0) {
    // Fallback to waypoints if no detailed route
    waypoints.forEach(wp => {
      points.push({
        lat: wp.lat,
        lon: wp.lon
      });
    });
  }
  
  return points;
}