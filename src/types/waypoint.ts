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