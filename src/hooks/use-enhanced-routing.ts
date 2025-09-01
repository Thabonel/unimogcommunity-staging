import { useState, useCallback } from 'react';
import { getDirections, DirectionsRoute } from '@/services/mapboxDirections';
import RoutingService from '@/services/routingService';
import { Waypoint } from '@/types/waypoint';

export interface AdvancedRoutingOptions {
  useOpenRouteService: boolean;
  terrainDifficulty: 'easy' | 'moderate' | 'difficult' | 'extreme';
  avoidHighways: boolean;
  preferOffRoad: boolean;
  maxGrade: number;
  vehicleProfile: string;
}

export function useEnhancedRouting() {
  const [isLoading, setIsLoading] = useState(false);
  const routingService = new RoutingService();

  const calculateRoute = useCallback(async (
    waypoints: Waypoint[],
    routeProfile: string,
    advancedOptions?: Partial<AdvancedRoutingOptions>
  ) => {
    setIsLoading(true);
    
    try {
      // Check if we should use OpenRouteService
      const shouldUseORS = advancedOptions?.useOpenRouteService || 
                          advancedOptions?.preferOffRoad || 
                          routeProfile === 'driving-hgv' ||
                          routeProfile === 'foot-hiking';

      if (shouldUseORS && import.meta.env.VITE_OPENROUTESERVICE_API_KEY) {
        // Use OpenRouteService for advanced routing
        const points = waypoints.map(wp => ({
          lat: wp.latitude,
          lon: wp.longitude
        }));

        const orsProfile = mapProfileToORS(routeProfile);
        const options = {
          profile: orsProfile,
          maximum_grade: advancedOptions?.maxGrade,
          avoid_features: advancedOptions?.avoidHighways ? ['highways'] : [],
          difficulty: advancedOptions?.terrainDifficulty
        };

        const response = advancedOptions?.preferOffRoad
          ? await routingService.calculateOffRoadRoute(points, advancedOptions.terrainDifficulty)
          : await routingService.calculateRoute(points, options);

        // Convert ORS response to Mapbox format
        return convertORSToMapbox(response);
      } else {
        // Fallback to Mapbox Directions API
        const mapboxWaypoints = waypoints.map(wp => ({
          latitude: wp.latitude,
          longitude: wp.longitude,
          name: wp.name
        }));

        const mapboxProfile = mapProfileToMapbox(routeProfile);
        const response = await getDirections(mapboxWaypoints, {
          profile: mapboxProfile,
          geometries: 'geojson',
          steps: true,
          overview: 'full'
        });

        return response;
      }
    } catch (error) {
      console.error('Enhanced routing error:', error);
      // Fallback to Mapbox on error
      const mapboxWaypoints = waypoints.map(wp => ({
        latitude: wp.latitude,
        longitude: wp.longitude,
        name: wp.name
      }));

      return await getDirections(mapboxWaypoints, {
        profile: mapProfileToMapbox(routeProfile),
        geometries: 'geojson',
        steps: true,
        overview: 'full'
      });
    } finally {
      setIsLoading(false);
    }
  }, [routingService]);

  return {
    calculateRoute,
    isLoading
  };
}

// Map route profiles between services
function mapProfileToORS(profile: string): 'driving-car' | 'driving-hgv' | 'foot-hiking' | 'cycling-regular' {
  switch (profile) {
    case 'driving':
    case 'driving-car':
      return 'driving-car';
    case 'driving-hgv':
    case 'driving-heavy':
      return 'driving-hgv';
    case 'walking':
    case 'foot-hiking':
      return 'foot-hiking';
    case 'cycling':
    case 'cycling-regular':
      return 'cycling-regular';
    default:
      return 'driving-car';
  }
}

function mapProfileToMapbox(profile: string): 'driving' | 'walking' | 'cycling' {
  switch (profile) {
    case 'driving':
    case 'driving-car':
    case 'driving-hgv':
      return 'driving';
    case 'walking':
    case 'foot-hiking':
      return 'walking';
    case 'cycling':
    case 'cycling-regular':
      return 'cycling';
    default:
      return 'driving';
  }
}

// Convert OpenRouteService response to Mapbox format
function convertORSToMapbox(orsResponse: any): any {
  if (!orsResponse.features || orsResponse.features.length === 0) {
    return null;
  }

  const feature = orsResponse.features[0];
  const { geometry, properties } = feature;

  return {
    routes: [{
      geometry: {
        type: 'LineString',
        coordinates: geometry.coordinates
      },
      legs: properties.segments?.map((segment: any) => ({
        distance: segment.distance,
        duration: segment.duration,
        summary: '',
        steps: segment.steps?.map((step: any) => ({
          distance: step.distance,
          duration: step.duration,
          geometry: null,
          name: step.name || '',
          maneuver: {
            type: step.type,
            instruction: step.instruction,
            bearing_before: 0,
            bearing_after: 0,
            location: [0, 0]
          }
        })) || []
      })) || [],
      distance: properties.summary?.distance || 0,
      duration: properties.summary?.duration || 0,
      weight_name: 'routability',
      weight: 1
    }],
    waypoints: orsResponse.metadata?.query?.coordinates?.map((coord: number[], index: number) => ({
      name: `Waypoint ${index + 1}`,
      location: coord,
      distance: 0
    })) || [],
    code: 'Ok',
    uuid: crypto.randomUUID()
  };
}