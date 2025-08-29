/**
 * Waypoint types for trip planning
 */

export interface Waypoint {
  id: string;
  coords: [number, number]; // [lng, lat]
  name: string;
  type: 'origin' | 'destination' | 'waypoint' | 'manual';
  order: number;
  isLocked?: boolean;
  address?: string;
  elevation?: number;
  isDraggable?: boolean;
  bearing?: number; // Direction in degrees (0-360) for magnetic routing
  snapRadius?: number; // Maximum distance in meters for road snapping
}

export interface ManualWaypoint {
  id: string;
  latitude: number;
  longitude: number;
  order: number;
  isLocked: boolean;
  name?: string;
}

export interface RouteOptions {
  mode: 'fastest' | 'shortest' | 'scenic' | 'offgrid' | 'manual';
  avoidHighways?: boolean;
  avoidTolls?: boolean;
  includeTraffic?: boolean;
  enableMagneticRouting?: boolean; // Enable road snapping and bearing controls
  defaultSnapRadius?: number; // Default snapping radius in meters
}

export interface TripPlan {
  id?: string;
  name: string;
  origin?: Waypoint;
  destination?: Waypoint;
  waypoints: Waypoint[];
  manualWaypoints: ManualWaypoint[];
  routeOptions: RouteOptions;
  totalDistance?: number;
  totalDuration?: number;
  elevationGain?: number;
  createdAt?: string;
  updatedAt?: string;
}