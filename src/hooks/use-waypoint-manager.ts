import { useState, useRef, useCallback, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { Waypoint, ManualWaypoint, RouteOptions } from '@/types/waypoint';
import { toast } from 'sonner';
import { getDirections, formatDistance, formatDuration, DirectionsRoute } from '@/services/mapboxDirections';
import { runCompleteDiagnostics, diagnoseWaypointRouting, validateWaypointCoordinates } from '@/utils/mapbox-diagnostics';

interface WaypointManagerProps {
  map: mapboxgl.Map | null;
  onRouteUpdate?: (waypoints: Waypoint[]) => void;
}

export function useWaypointManager({ map, onRouteUpdate }: WaypointManagerProps) {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [manualWaypoints, setManualWaypoints] = useState<ManualWaypoint[]>([]);
  const [origin, setOrigin] = useState<Waypoint | null>(null);
  const [destination, setDestination] = useState<Waypoint | null>(null);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [originLocked, setOriginLocked] = useState(false);
  const [destinationLocked, setDestinationLocked] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<DirectionsRoute | null>(null);
  const [routeProfile, setRouteProfile] = useState<'driving' | 'walking' | 'cycling'>('driving');
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const routeLayerRef = useRef<string>('route-layer');
  const mapRef = useRef<mapboxgl.Map | null>(map);
  const modesRef = useRef({ isAddingMode, isManualMode });
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const diagnosticTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate bearing between two points for magnetic routing
  const calculateBearing = useCallback((from: [number, number], to: [number, number]): number => {
    const [fromLng, fromLat] = from;
    const [toLng, toLat] = to;
    
    const dLng = toLng - fromLng;
    const dLat = toLat - fromLat;
    
    const bearing = Math.atan2(
      Math.sin(dLng * Math.PI / 180) * Math.cos(toLat * Math.PI / 180),
      Math.cos(fromLat * Math.PI / 180) * Math.sin(toLat * Math.PI / 180) -
      Math.sin(fromLat * Math.PI / 180) * Math.cos(toLat * Math.PI / 180) * Math.cos(dLng * Math.PI / 180)
    );
    
    // Convert to degrees and normalize to 0-360
    const degrees = (bearing * 180 / Math.PI + 360) % 360;
    return Math.round(degrees);
  }, []);

  // Update refs when values change
  useEffect(() => {
    mapRef.current = map;
  }, [map]);
  
  useEffect(() => {
    modesRef.current = { isAddingMode, isManualMode };
    
    // Update cursor when modes change
    if (map) {
      const canvas = map.getCanvas();
      if (canvas) {
        if (isAddingMode || isManualMode) {
          canvas.style.cursor = 'crosshair';
        } else {
          canvas.style.cursor = '';
        }
      }
    }
  }, [isAddingMode, isManualMode, map]);

  // Reverse geocode coordinates to get place name
  const reverseGeocode = async (coords: [number, number]): Promise<string> => {
    try {
      // Get token from localStorage or environment
      const token = localStorage.getItem('mapbox-token') || import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
      if (!token) {
        console.warn('No authentication token for geocoding');
        return `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`;
      }
      
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords[0]},${coords[1]}.json?access_token=${token}`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        return data.features[0].place_name || 'Unknown location';
      }
      return 'Unknown location';
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return 'Unknown location';
    }
  };

  // Clear all markers from map
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
  }, []);

  // Add a waypoint marker to the map using Mapbox native draggable markers
  const addWaypointMarker = useCallback((waypoint: Waypoint | ManualWaypoint, index: number, totalWaypoints: number) => {
    if (!map) return null;

    const coords: [number, number] = 'coords' in waypoint 
      ? waypoint.coords 
      : [waypoint.longitude, waypoint.latitude];

    // Create marker element for native Mapbox marker
    const el = document.createElement('div');
    el.className = 'waypoint-marker';
    
    // Determine actual type based on position for regular waypoints
    let displayType = 'waypoint';
    let displayLabel = String(index + 1);
    
    if ('type' in waypoint) {
      // For regular waypoints, determine type by position
      if (index === 0) {
        displayType = 'origin';
        displayLabel = 'A';
      } else if (index === totalWaypoints - 1 && totalWaypoints > 1) {
        displayType = 'destination';
        displayLabel = 'B';
      } else {
        displayType = 'waypoint';
        displayLabel = String(index + 1);
      }
      
      switch (displayType) {
        case 'origin':
          el.style.cssText = `
            width: 32px;
            height: 32px;
            background: #10b981;
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
          `;
          el.innerText = displayLabel;
          break;
        case 'destination':
          el.style.cssText = `
            width: 32px;
            height: 32px;
            background: #ef4444;
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
          `;
          el.innerText = displayLabel;
          break;
        case 'waypoint':
          el.style.cssText = `
            width: 24px;
            height: 24px;
            background: #3b82f6;
            border: 2px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            cursor: pointer;
          `;
          el.innerText = displayLabel;
          break;
        case 'manual':
          el.style.cssText = `
            width: 24px;
            height: 24px;
            background: #dc2626;
            border: 2px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            cursor: pointer;
          `;
          el.innerText = String(index + 1);
          break;
      }
    } else {
      // Manual waypoint
      el.style.cssText = `
        width: 24px;
        height: 24px;
        background: #dc2626;
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer;
      `;
      el.innerText = String(index + 1);
    }

    // Add click handler to remove waypoint (except origin/destination)
    if ('type' in waypoint && (waypoint.type === 'waypoint' || waypoint.type === 'manual')) {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        removeWaypoint(waypoint.id);
      });
    }

    // Determine if this waypoint should be draggable
    const isDraggable = 'isDraggable' in waypoint ? waypoint.isDraggable : true;

    const marker = new mapboxgl.Marker({ 
      element: el,
      draggable: isDraggable 
    })
      .setLngLat(coords)
      .addTo(map);

    // Add drag event handlers for magnetic routing
    if (isDraggable) {
      marker.on('dragstart', () => {
        console.log(`🎯 Waypoint ${displayLabel} drag started`);
        // Optionally show visual feedback that dragging has started
      });

      marker.on('drag', () => {
        const lngLat = marker.getLngLat();
        // Update waypoint coordinates in real-time during drag
        if ('coords' in waypoint) {
          // Update regular waypoint
          setWaypoints(prev => {
            const updated = prev.map(w => 
              w.id === waypoint.id 
                ? { ...w, coords: [lngLat.lng, lngLat.lat] }
                : w
            );
            
            // Trigger route update with debouncing (handled by fetchDirectionsRef)
            if (updated.length >= 2 && fetchDirectionsRef.current) {
              fetchDirectionsRef.current(updated);
            }
            
            return updated;
          });
        } else {
          // Update manual waypoint (manual waypoints don't affect routing)
          setManualWaypoints(prev => prev.map(w => 
            w.id === waypoint.id 
              ? { ...w, longitude: lngLat.lng, latitude: lngLat.lat }
              : w
          ));
        }
      });

      marker.on('dragend', async () => {
        const lngLat = marker.getLngLat();
        console.log(`🎯 Waypoint ${displayLabel} drag ended at:`, [lngLat.lng, lngLat.lat]);
        
        // Get place name for the new location
        try {
          const placeName = await reverseGeocode([lngLat.lng, lngLat.lat]);
          
          if ('coords' in waypoint) {
            // Update regular waypoint with final coordinates and name
            setWaypoints(prev => prev.map(w => 
              w.id === waypoint.id 
                ? { 
                    ...w, 
                    coords: [lngLat.lng, lngLat.lat],
                    address: placeName,
                    // Calculate bearing from previous position for magnetic routing
                    bearing: calculateBearing(waypoint.coords, [lngLat.lng, lngLat.lat]),
                    snapRadius: waypoint.snapRadius || 50
                  }
                : w
            ));
          } else {
            // Update manual waypoint
            setManualWaypoints(prev => prev.map(w => 
              w.id === waypoint.id 
                ? { 
                    ...w, 
                    longitude: lngLat.lng, 
                    latitude: lngLat.lat,
                    name: placeName
                  }
                : w
            ));
          }
          
          toast.success(`Waypoint moved to ${placeName}`);
        } catch (error) {
          console.warn('Failed to update waypoint name:', error);
          toast.success('Waypoint moved');
        }
      });
    }

    return marker;
  }, [map]);

  // Remove a waypoint
  const removeWaypoint = useCallback((waypointId: string) => {
    setWaypoints(prev => prev.filter(w => w.id !== waypointId));
    setManualWaypoints(prev => prev.filter(w => w.id !== waypointId));
    toast.success('Waypoint removed');
  }, []);

  // Enhanced road snapping using multiple location types with NoSegment prevention
  const snapToRoad = async (coords: [number, number]): Promise<[number, number]> => {
    try {
      const token = localStorage.getItem('mapbox-token') || import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
      if (!token) {
        console.warn('No authentication token for road snapping');
        return coords;
      }
      
      // Try multiple types for better road snapping coverage, with increasing radius
      const locationTypes = [
        { type: 'address', radius: 50 },     // Most precise
        { type: 'address', radius: 150 },    // Wider address search
        { type: 'poi', radius: 200 },        // Points of interest
        { type: 'place', radius: 400 },      // Places/neighborhoods  
        { type: 'locality', radius: 800 },   // Cities/towns (wider)
        { type: 'region', radius: 1500 }     // Regional fallback
      ];
      
      for (const { type, radius } of locationTypes) {
        try {
          const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords[0]},${coords[1]}.json?` +
            `types=${type}&limit=3&access_token=${token}`;
          
          const response = await fetch(geocodeUrl);
          if (response.ok) {
            const data = await response.json();
            if (data.features && data.features.length > 0) {
              // Try multiple features to find the best routable location
              for (const feature of data.features) {
                const distance = calculateDistance(coords, feature.center);
                
                if (distance < radius) {
                  // Test if this coordinate is routable by doing a quick test
                  const testResult = await testCoordinateRoutability(feature.center as [number, number]);
                  
                  if (testResult) {
                    console.log(`🎯 Snapped to routable ${type} (${distance.toFixed(0)}m):`, feature.center);
                    return feature.center as [number, number];
                  } else {
                    console.log(`⚠️ ${type} not routable, trying next...`);
                  }
                }
              }
            }
          }
        } catch (typeError) {
          console.warn(`Failed to snap to ${type}:`, typeError);
          continue;
        }
      }
      
      console.log('⚠️ No routable location found, using original coordinates (may cause NoSegment)');
    } catch (error) {
      console.warn('Road snapping failed:', error);
    }
    return coords;
  };
  
  // Test if a coordinate is routable by doing a simple 2-point routing test
  const testCoordinateRoutability = async (coords: [number, number]): Promise<boolean> => {
    try {
      const token = localStorage.getItem('mapbox-token') || import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
      if (!token) return false;
      
      // Create a simple test route from this point to a nearby point (100m away)
      const testEndpoint: [number, number] = [coords[0] + 0.001, coords[1] + 0.001]; // ~111m away
      
      const testUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords[0]},${coords[1]};${testEndpoint[0]},${testEndpoint[1]}?` +
                     `access_token=${token}&overview=false&steps=false&geometries=geojson`;
      
      const response = await fetch(testUrl);
      
      if (response.ok) {
        const data = await response.json();
        // If we get a route back, the coordinate is routable
        return data.code === 'Ok' && data.routes && data.routes.length > 0;
      }
      
      return false;
    } catch (error) {
      console.warn('Coordinate routability test failed:', error);
      return false; // Assume not routable on error
    }
  };
  
  // Calculate distance between two points in meters
  const calculateDistance = (coord1: [number, number], coord2: [number, number]): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = coord1[1] * Math.PI / 180;
    const φ2 = coord2[1] * Math.PI / 180;
    const Δφ = (coord2[1] - coord1[1]) * Math.PI / 180;
    const Δλ = (coord2[0] - coord1[0]) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  };

  // Add a new waypoint at clicked location
  const addWaypointAtLocation = useCallback(async (lngLat: { lng: number; lat: number }) => {
    console.log('addWaypointAtLocation called with:', lngLat);
    let coords: [number, number] = [lngLat.lng, lngLat.lat];
    
    // Try to snap to nearest road
    const snappedCoords = await snapToRoad(coords);
    if (snappedCoords[0] !== coords[0] || snappedCoords[1] !== coords[1]) {
      console.log('Coordinates snapped from', coords, 'to', snappedCoords);
      coords = snappedCoords;
      toast.success('Waypoint snapped to nearest road');
    }
    
    // Use ref to check current mode
    const { isAddingMode: addMode, isManualMode: manualMode } = modesRef.current;
    console.log('Current modes in addWaypoint:', { addMode, manualMode });
    
    // Get place name (or use coordinates as fallback)
    let placeName = `Point at ${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`;
    try {
      placeName = await reverseGeocode(coords);
    } catch (err) {
      console.warn('Reverse geocoding failed, using coordinates');
    }
    
    if (manualMode) {
      // Add manual waypoint
      const newWaypoint: ManualWaypoint = {
        id: `manual-${Date.now()}`,
        latitude: lngLat.lat,
        longitude: lngLat.lng,
        order: 0, // Will be updated in setState
        isLocked: true,
        name: placeName
      };
      
      setManualWaypoints(prev => {
        newWaypoint.order = prev.length;
        const updated = [...prev, newWaypoint];
        toast.success(`POI marked: ${updated.length}`);
        console.log('Added manual waypoint:', newWaypoint);
        return updated;
      });
    } else {
      // Add regular waypoint
      setWaypoints(prev => {
        const order = prev.length;
        let waypointType: 'origin' | 'destination' | 'waypoint' = 'waypoint';
        
        // First waypoint is origin, last could be destination
        if (order === 0) {
          waypointType = 'origin';
        } else if (order === 1) {
          waypointType = 'destination';
        } else {
          waypointType = 'waypoint';
        }
        
        const newWaypoint: Waypoint = {
          id: `waypoint-${Date.now()}`,
          coords,
          name: placeName,
          type: waypointType,
          order: order,
          address: placeName,
          isDraggable: true,
          snapRadius: 100 // Increased to 100m snap radius for better magnetic routing
        };
        
        const updated = [...prev, newWaypoint];
        toast.success(`Waypoint ${updated.length} added`);
        console.log('Added regular waypoint:', newWaypoint);
        return updated;
      });
    }
  }, []);

  // Helper function to ensure route connects properly to waypoint markers
  // Now using Mapbox's snapped waypoints for more accurate connections
  const snapRouteToWaypoints = (routeCoords: [number, number][], waypointCoords: [number, number][]): [number, number][] => {
    if (routeCoords.length < 2 || waypointCoords.length < 2) return routeCoords;
    
    const snappedCoords = [...routeCoords];
    
    // Only snap endpoints if waypoints are very close to route endpoints
    // This preserves Mapbox's road-following route while fixing visual disconnects
    
    // Check if first waypoint is close to first route point
    const firstDist = Math.sqrt(
      Math.pow(snappedCoords[0][0] - waypointCoords[0][0], 2) + 
      Math.pow(snappedCoords[0][1] - waypointCoords[0][1], 2)
    );
    
    // Only snap if within ~50m (approximately 0.0005 degrees)
    if (firstDist < 0.0005) {
      snappedCoords[0] = waypointCoords[0];
    }
    
    // Check if last waypoint is close to last route point
    const lastIdx = snappedCoords.length - 1;
    const lastDist = Math.sqrt(
      Math.pow(snappedCoords[lastIdx][0] - waypointCoords[waypointCoords.length - 1][0], 2) + 
      Math.pow(snappedCoords[lastIdx][1] - waypointCoords[waypointCoords.length - 1][1], 2)
    );
    
    // Only snap if within ~50m
    if (lastDist < 0.0005) {
      snappedCoords[lastIdx] = waypointCoords[waypointCoords.length - 1];
    }
    
    return snappedCoords;
  };

  // Draw route on map
  const drawRoute = useCallback((coordinates: [number, number][], isRoadFollowing: boolean = false, waypointCoords?: [number, number][]) => {
    if (!map || coordinates.length < 2) return;

    // Snap route to exact waypoint positions if provided
    const finalCoords = waypointCoords ? snapRouteToWaypoints(coordinates, waypointCoords) : coordinates;

    const routeData = {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: finalCoords
      }
    };

    // Check if source and layer already exist
    const sourceExists = map.getSource(routeLayerRef.current);
    const layerExists = map.getLayer(routeLayerRef.current);

    if (sourceExists) {
      // Update existing source data
      (sourceExists as mapboxgl.GeoJSONSource).setData(routeData);
      
      // Update layer paint properties if they've changed
      if (layerExists) {
        map.setPaintProperty(routeLayerRef.current, 'line-color', isRoadFollowing ? '#10b981' : '#3b82f6');
        map.setPaintProperty(routeLayerRef.current, 'line-width', isRoadFollowing ? 5 : 4);
      }
    } else {
      // Create new source and layer only if they don't exist
      map.addSource(routeLayerRef.current, {
        type: 'geojson',
        data: routeData
      });

      map.addLayer({
        id: routeLayerRef.current,
        type: 'line',
        source: routeLayerRef.current,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': isRoadFollowing ? '#10b981' : '#3b82f6',
          'line-width': isRoadFollowing ? 5 : 4,
          'line-opacity': 0.8
        }
      });
    }
  }, [map]);

  // Chunked routing for unlimited waypoints
  const fetchDirectionsChunked = async (waypointList: Waypoint[], chunkSize: number = 6): Promise<any[]> => {
    const chunks: Waypoint[][] = [];
    
    // Split waypoints into overlapping chunks (each chunk shares last waypoint with next chunk's first)
    for (let i = 0; i < waypointList.length; i += chunkSize - 1) {
      const chunk = waypointList.slice(i, Math.min(i + chunkSize, waypointList.length));
      if (chunk.length >= 2) {
        chunks.push(chunk);
      }
      
      // If we've processed all waypoints, break
      if (i + chunkSize >= waypointList.length) break;
    }
    
    console.log(`🔗 Split ${waypointList.length} waypoints into ${chunks.length} chunks`);
    
    const routeSegments: any[] = [];
    
    // Fetch directions for each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`🛣️ Fetching route for chunk ${i + 1}/${chunks.length} with ${chunk.length} waypoints`);
      
      const directionsWaypoints = chunk.map(wp => ({
        lng: wp.coords[0],
        lat: wp.coords[1],
        name: wp.name,
        bearing: wp.bearing,
        snapRadius: wp.snapRadius || 50
      }));
      
      try {
        const response = await getDirections(directionsWaypoints, {
          profile: routeProfile,
          geometries: 'geojson',
          steps: true,
          overview: 'full',
          enableMagneticRouting: true,
          defaultSnapRadius: 100, // Increased for better road snapping
          bearingTolerance: 45
        });
        
        if (response && response.routes && response.routes.length > 0) {
          const route = response.routes[0];
          // Include waypoints information with the route segment
          route.waypoints = response.waypoints;
          routeSegments.push(route);
          console.log(`✅ Chunk ${i + 1} routed successfully with ${response.waypoints?.length || 0} waypoints`);
        } else {
          console.warn(`⚠️ Chunk ${i + 1} failed to route - using straight line`);
          // Add straight line fallback for this chunk
          const coords = chunk.map(w => w.coords);
          routeSegments.push({
            geometry: { coordinates: coords },
            distance: 0,
            duration: 0
          });
        }
      } catch (error) {
        console.error(`❌ Error routing chunk ${i + 1}:`, error);
        // Add straight line fallback for this chunk
        const coords = chunk.map(w => w.coords);
        routeSegments.push({
          geometry: { coordinates: coords },
          distance: 0,
          duration: 0
        });
      }
    }
    
    return routeSegments;
  };
  
  // Combine multiple route segments into a single route
  const combineRouteSegments = (segments: any[]): any => {
    if (segments.length === 0) return null;
    if (segments.length === 1) return segments[0];
    
    const combinedCoordinates: [number, number][] = [];
    const combinedWaypoints: any[] = [];
    let totalDistance = 0;
    let totalDuration = 0;
    
    segments.forEach((segment, index) => {
      if (segment.geometry && segment.geometry.coordinates) {
        const coords = segment.geometry.coordinates;
        
        // For subsequent segments, skip the first coordinate (it's the last of previous segment)
        const startIndex = index > 0 ? 1 : 0;
        
        for (let i = startIndex; i < coords.length; i++) {
          combinedCoordinates.push(coords[i]);
        }
        
        totalDistance += segment.distance || 0;
        totalDuration += segment.duration || 0;
        
        // Combine waypoints from all segments
        if (segment.waypoints) {
          const waypointStartIdx = index > 0 ? 1 : 0; // Skip first waypoint of subsequent segments
          for (let i = waypointStartIdx; i < segment.waypoints.length; i++) {
            combinedWaypoints.push(segment.waypoints[i]);
          }
        }
      }
    });
    
    console.log(`🎯 Combined ${segments.length} segments into route with ${combinedCoordinates.length} points and ${combinedWaypoints.length} waypoints`);
    
    return {
      geometry: { coordinates: combinedCoordinates },
      distance: totalDistance,
      duration: totalDuration,
      legs: [],
      weight: 0,
      weight_name: 'routability',
      waypoints: combinedWaypoints
    };
  };

  // Fetch directions from Mapbox API (now with unlimited waypoint support)
  const fetchDirectionsRef = useRef<(waypointList: Waypoint[]) => Promise<void>>();
  
  fetchDirectionsRef.current = async (waypointList: Waypoint[]) => {
    if (waypointList.length < 2) {
      console.log('Not enough waypoints for directions:', waypointList.length);
      return;
    }
    
    // Clear any pending fetch
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    // Debounce the fetch to prevent rapid updates
    fetchTimeoutRef.current = setTimeout(async () => {
      console.log('Fetching directions for waypoints:', waypointList);
      setIsLoadingRoute(true);
      console.log('Set loading route to true');
      
      try {
        // Validate waypoints have coords before mapping
        const validWaypoints = waypointList.filter(wp => {
          if (!wp.coords || !Array.isArray(wp.coords) || wp.coords.length !== 2) {
            console.error('Invalid waypoint coords:', wp);
            return false;
          }
          return true;
        });
        
        if (validWaypoints.length !== waypointList.length) {
          console.error('Some waypoints have invalid coordinates!');
          console.error('Original waypoints:', waypointList);
          console.error('Valid waypoints:', validWaypoints);
          toast.error('Some waypoints have invalid coordinates');
          
          // Run diagnostics to help debug the issue
          const diagnosticWaypoints = waypointList
            .filter(wp => wp.coords && Array.isArray(wp.coords) && wp.coords.length === 2)
            .map(wp => ({ lng: wp.coords[0], lat: wp.coords[1] }));
          
          if (diagnosticWaypoints.length > 0) {
            // Clear any existing diagnostic timeout
            if (diagnosticTimeoutRef.current) {
              clearTimeout(diagnosticTimeoutRef.current);
            }
            diagnosticTimeoutRef.current = setTimeout(() => runCompleteDiagnostics(diagnosticWaypoints), 1000);
          }
          return;
        }
        
        // Check if we need to use chunked routing for many waypoints
        const MAX_WAYPOINTS_PER_REQUEST = 7; // Safe limit for reliable routing
        
        if (validWaypoints.length > MAX_WAYPOINTS_PER_REQUEST) {
          console.log(`🚀 Using chunked routing for ${validWaypoints.length} waypoints`);
          
          const routeSegments = await fetchDirectionsChunked(validWaypoints, 6);
          
          if (routeSegments.length > 0) {
            const combinedRoute = combineRouteSegments(routeSegments);
            
            if (combinedRoute && combinedRoute.geometry && combinedRoute.geometry.coordinates) {
              setCurrentRoute(combinedRoute);
              console.log('🎯 Drawing combined unlimited waypoint route with', combinedRoute.geometry.coordinates.length, 'points');
              // Pass original waypoint coordinates for exact snapping
              const waypointCoords = validWaypoints.map(w => w.coords);
              drawRoute(combinedRoute.geometry.coordinates, true, waypointCoords); // Always green!
              
              // Show route stats
              toast.success(
                `Unlimited Route: ${formatDistance(combinedRoute.distance)} • ${formatDuration(combinedRoute.duration)}`,
                { duration: 5000 }
              );
              return;
            }
          }
          
          // Fallback for chunked routing failure - still green!
          console.log('🔄 Chunked routing failed, using direct routing');
          const coords = validWaypoints.map(w => w.coords);
          drawRoute(coords, true, coords); // Always green with exact positions!
          toast.info('Using direct route for all waypoints');
          return;
        }
        
        // Normal routing for reasonable number of waypoints (≤7) - THE WORKING PATH!
        const directionsWaypoints = validWaypoints.map(wp => ({
          lng: wp.coords[0],
          lat: wp.coords[1],
          name: wp.name,
          bearing: wp.bearing,
          snapRadius: wp.snapRadius || 50
        }));
        
        console.log('Calling getDirections with:', {
          waypoints: directionsWaypoints,
          profile: routeProfile
        });
        
        const response = await getDirections(directionsWaypoints, {
          profile: routeProfile,
          geometries: 'geojson',
          steps: true,
          overview: 'full',
          enableMagneticRouting: true,
          defaultSnapRadius: 100, // Increased for better road snapping
          bearingTolerance: 45
        });
        
        console.log('Directions API response:', response);
        console.log('🔍 Directions API response received:', {
          hasResponse: !!response,
          hasRoutes: !!(response?.routes),
          routeCount: response?.routes?.length || 0,
          responseCode: response?.code || 'unknown'
        });
        
        if (response && response.routes && response.routes.length > 0) {
          const route = response.routes[0];
          setCurrentRoute(route);
          
          // Use snapped waypoints from Mapbox response for accurate positioning
          let snappedWaypointCoords = waypointList.map(w => w.coords);
          if (response.waypoints && response.waypoints.length > 0) {
            console.log('Using snapped waypoints from Mapbox response');
            snappedWaypointCoords = response.waypoints.map((wp: any) => {
              // Mapbox returns snapped waypoints with location property
              if (wp.location) {
                return wp.location as [number, number];
              }
              // Fallback to original coordinates if no location
              return [wp.coordinates?.[0] || 0, wp.coordinates?.[1] || 0] as [number, number];
            });
            
            // Update waypoint markers to snapped positions
            waypoints.forEach((waypoint, index) => {
              if (response.waypoints[index]?.location) {
                const snappedCoord = response.waypoints[index].location;
                // Update the marker position to the snapped location
                const marker = markersRef.current[waypoint.id];
                if (marker) {
                  marker.setLngLat(snappedCoord);
                  console.log(`Updated waypoint ${index} to snapped position:`, snappedCoord);
                }
              }
            });
          }
          
          // Draw the road-following route
          if (route.geometry && route.geometry.coordinates) {
            console.log('Drawing road-following route with', route.geometry.coordinates.length, 'points');
            console.log('Route successfully calculated for', waypointList.length, 'waypoints');
            // Use snapped waypoint coordinates for exact connections
            drawRoute(route.geometry.coordinates, true, snappedWaypointCoords);
            
            // Show route stats
            toast.success(
              `Route: ${formatDistance(route.distance)} • ${formatDuration(route.duration)}`,
              { duration: 5000 }
            );
          } else {
            console.warn('Route geometry missing from API response');
            console.warn('Response had routes but no geometry, waypoint count:', waypointList.length);
            const coords = waypointList.map(w => w.coords);
            drawRoute(coords, true, coords); // Keep green even for fallback with exact positions
          }
          
          return route;
      } else {
        console.warn('No routes in response from Directions API');
        console.warn('Waypoint count when failed:', waypointList.length);
        console.warn('Full API response:', response);
        
        // Run detailed diagnostics when routing fails
        toast.info('Running diagnostics on routing failure...');
        const diagnosticWaypoints = validWaypoints.map(wp => ({ lng: wp.coords[0], lat: wp.coords[1] }));
        // Clear any existing diagnostic timeout
        if (diagnosticTimeoutRef.current) {
          clearTimeout(diagnosticTimeoutRef.current);
        }
        diagnosticTimeoutRef.current = setTimeout(() => {
          console.log('🚨 ROUTING FAILURE - Running diagnostics...');
          runCompleteDiagnostics(diagnosticWaypoints);
        }, 500);
        
        // If we have 3+ waypoints and routing failed, try without the last waypoint
        if (waypointList.length > 2) {
          console.log('Trying to route without the last waypoint...');
          const waypointsWithoutLast = waypointList.slice(0, -1);
          
          // Try to get directions for all waypoints except the last one
          try {
            const fallbackWaypoints = waypointsWithoutLast.map(wp => ({
              lng: wp.coords[0],
              lat: wp.coords[1],
              name: wp.name,
              bearing: wp.bearing,
              snapRadius: wp.snapRadius || 50
            }));
            
            const fallbackResponse = await getDirections(fallbackWaypoints, {
              profile: routeProfile,
              geometries: 'geojson',
              steps: true,
              overview: 'full',
              enableMagneticRouting: true,
              defaultSnapRadius: 100, // Increased for better road snapping
              bearingTolerance: 45
            });
            
            if (fallbackResponse && fallbackResponse.routes && fallbackResponse.routes.length > 0) {
              const route = fallbackResponse.routes[0];
              setCurrentRoute(route);
              
              if (route.geometry && route.geometry.coordinates) {
                console.log('Partial route successful - showing green line for routable waypoints');
                // Draw the partial green route with waypoint snapping
                const waypointCoords = waypointsWithoutLast.map(w => w.coords);
                drawRoute(route.geometry.coordinates, true, waypointCoords);
                
                // Add a straight line from the last routable point to the problematic waypoint
                const lastRoutePoint = route.geometry.coordinates[route.geometry.coordinates.length - 1];
                const lastWaypoint = waypointList[waypointList.length - 1];
                const extendedCoords = [...route.geometry.coordinates, lastWaypoint.coords];
                
                // Draw the extended route (green for routable part, then straight to last point)
                // Include all waypoint positions for snapping
                const allWaypointCoords = waypointList.map(w => w.coords);
                drawRoute(extendedCoords, true, allWaypointCoords);
                
                toast.warning(`Last waypoint couldn't be routed - showing partial route`);
                return;
              }
            }
          } catch (fallbackError) {
            console.error('Fallback routing also failed:', fallbackError);
          }
        }
        
        // If all else fails, draw straight lines but keep them GREEN
        const coords = waypointList.map(w => w.coords);
        drawRoute(coords, true, coords); // Always green with exact waypoint positions!
        toast.info('Using direct route (magnetic routing not available)');
      }
    } catch (error) {
      console.error('Error fetching directions:', error);
      console.error('Failed at waypoint count:', waypointList.length);
      
      // Check if it's a NoSegment error (waypoint can't be routed to)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('NoSegment') && waypointList.length > 2) {
        console.log('NoSegment error - attempting partial route...');
        
        // Try routing without the problematic waypoint(s)
        for (let i = waypointList.length - 1; i >= 2; i--) {
          try {
            const partialWaypoints = waypointList.slice(0, i);
            const fallbackWaypoints = partialWaypoints.map(wp => ({
              lng: wp.coords[0],
              lat: wp.coords[1],
              name: wp.name,
              bearing: wp.bearing,
              snapRadius: wp.snapRadius || 50
            }));
            
            console.log(`Trying with ${i} waypoints...`);
            const fallbackResponse = await getDirections(fallbackWaypoints, {
              profile: routeProfile,
              geometries: 'geojson',
              steps: true,
              overview: 'full',
              enableMagneticRouting: true,
              defaultSnapRadius: 100, // Increased for better road snapping
              bearingTolerance: 45
            });
            
            if (fallbackResponse && fallbackResponse.routes && fallbackResponse.routes.length > 0) {
              const route = fallbackResponse.routes[0];
              setCurrentRoute(route);
              
              if (route.geometry && route.geometry.coordinates) {
                console.log(`Partial route successful with ${i} waypoints`);
                
                // Create a combined route: green for routable, then straight lines to unreachable points
                let combinedCoords = [...route.geometry.coordinates];
                
                // Add straight lines to any remaining waypoints
                for (let j = i; j < waypointList.length; j++) {
                  combinedCoords.push(waypointList[j].coords);
                }
                
                // Pass all waypoint coordinates for proper snapping
                const allWaypointCoords = waypointList.map(w => w.coords);
                drawRoute(combinedCoords, true, allWaypointCoords); // Keep it green but with straight segments at the end
                
                const unreachableCount = waypointList.length - i;
                toast.warning(`Last ${unreachableCount} waypoint${unreachableCount > 1 ? 's' : ''} couldn't be routed - showing partial route`);
                return;
              }
            }
          } catch (fallbackError) {
            console.log(`Failed with ${i} waypoints, trying fewer...`);
            continue;
          }
        }
      }
      
      // More specific error messages
      if (errorMessage.includes('NoSegment')) {
        toast.error('One or more waypoints are not routable (may be off-road)');
      } else if (waypointList.length >= 6) {
        toast.error(`Route calculation failed with ${waypointList.length} waypoints`);
      } else {
        toast.error('Failed to calculate route');
      }
      
      // Fall back to straight line but keep GREEN
      const coords = waypointList.map(w => w.coords);
      drawRoute(coords, true, coords); // Always green with exact positions!
      } finally {
        setIsLoadingRoute(false);
        console.log('Set loading route to false');
      }
    }, 100); // 100ms debounce
  };
  
  const fetchDirections = useCallback((waypointList: Waypoint[]) => {
    return fetchDirectionsRef.current?.(waypointList);
  }, []);

  // Update route when waypoints change
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for all regular waypoints
    waypoints.forEach((waypoint, index) => {
      const marker = addWaypointMarker(waypoint, index, waypoints.length);
      if (marker) {
        markersRef.current.push(marker);
      }
    });

    // Add manual waypoints (POIs)
    manualWaypoints.forEach((waypoint, index) => {
      const marker = addWaypointMarker(waypoint, index, manualWaypoints.length);
      if (marker) {
        markersRef.current.push(marker);
      }
    });

    // Fetch road-following directions if we have waypoints
    if (waypoints.length >= 2 && fetchDirectionsRef.current) {
      fetchDirectionsRef.current(waypoints);
    } else if (waypoints.length === 1) {
      // Clear route if only one waypoint
      if (map.getLayer(routeLayerRef.current)) {
        map.removeLayer(routeLayerRef.current);
      }
      if (map.getSource(routeLayerRef.current)) {
        map.removeSource(routeLayerRef.current);
      }
      setCurrentRoute(null);
    }

    // Notify parent of route update
    if (onRouteUpdate) {
      onRouteUpdate(waypoints);
    }
  }, [waypoints, manualWaypoints, map]); // Removed onRouteUpdate from dependencies

  // Notify parent of route updates in a separate effect
  useEffect(() => {
    if (onRouteUpdate) {
      onRouteUpdate(waypoints);
    }
  }, [waypoints, onRouteUpdate]);

  // Handle route profile changes ONLY
  useEffect(() => {
    // Only refetch if we have waypoints and profile actually changed
    if (waypoints.length >= 2 && fetchDirectionsRef.current) {
      console.log('Route profile changed to:', routeProfile);
      fetchDirectionsRef.current(waypoints);
    }
  }, [routeProfile]); // ONLY depend on routeProfile, not waypoints!

  // Handle map clicks
  useEffect(() => {
    // Use map prop directly instead of mapRef.current
    if (!map) {
      console.log('Map not available for waypoint clicks');
      return;
    }

    console.log('Setting up waypoint click handler, map loaded:', map.loaded());

    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      // Use ref to get current mode values
      const { isAddingMode: addMode, isManualMode: manualMode } = modesRef.current;
      const shouldAddWaypoint = addMode || manualMode;
      
      console.log('Map clicked!', {
        coords: e.lngLat,
        addMode,
        manualMode,
        shouldAdd: shouldAddWaypoint
      });
      
      if (!shouldAddWaypoint) {
        console.log('Not in adding mode, ignoring click');
        return;
      }
      
      addWaypointAtLocation(e.lngLat);
    };

    // Set up click handler
    const setupHandler = () => {
      // Remove any existing handler first
      map.off('click', handleMapClick);
      // Add the click handler
      map.on('click', handleMapClick);
      console.log('✅ Click handler registered successfully');
    };

    // Check if map is ready
    if (map.loaded()) {
      setupHandler();
    } else {
      console.log('Waiting for map to load before setting up click handler');
      const onLoad = () => {
        console.log('Map loaded event fired, setting up click handler');
        setupHandler();
      };
      map.once('load', onLoad);
      
      // Also try on idle as a backup
      const onIdle = () => {
        console.log('Map idle event fired, setting up click handler');
        setupHandler();
      };
      map.once('idle', onIdle);
      
      return () => {
        map.off('load', onLoad);
        map.off('idle', onIdle);
      };
    }

    // Cleanup function
    return () => {
      if (map) {
        console.log('Cleaning up click handler');
        map.off('click', handleMapClick);
      }
    };
  }, [map, addWaypointAtLocation]);

  // Load waypoints from an existing track
  const loadTrackWaypoints = useCallback((track: any) => {
    if (!track || !track.data) return;
    
    // Clear existing waypoints
    clearMarkers();
    setWaypoints([]);
    setManualWaypoints([]);
    
    // Extract points from track data
    const points = track.data.points || track.data;
    if (!Array.isArray(points) || points.length === 0) return;
    
    // Convert track points to waypoints
    const newWaypoints: Waypoint[] = points.slice(0, 10).map((point: any, index: number) => ({
      id: `waypoint-${Date.now()}-${index}`,
      coords: [point.lon || point.lng, point.lat] as [number, number],
      name: `Point ${index + 1}`,
      type: index === 0 ? 'origin' : index === points.length - 1 ? 'destination' : 'waypoint' as const,
      order: index,
      elevation: point.ele
    }));
    
    setWaypoints(newWaypoints);
    toast.success(`Loaded ${newWaypoints.length} waypoints from track`);
  }, [clearMarkers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear any pending fetch timeouts
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
      
      // Clear any pending diagnostic timeouts
      if (diagnosticTimeoutRef.current) {
        clearTimeout(diagnosticTimeoutRef.current);
        diagnosticTimeoutRef.current = null;
      }
      
      // Clear markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      
      // Clear map event listeners if map exists
      if (mapRef.current) {
        mapRef.current.off('click');
        mapRef.current.off('load');
        mapRef.current.off('idle');
      }
      
      // Note: We don't remove the route layer here because the map might be reused
      // The layer will be updated when the component remounts
    };
  }, []);

  return {
    // State
    waypoints,
    manualWaypoints,
    origin,
    destination,
    isAddingMode,
    isManualMode,
    originLocked,
    destinationLocked,
    currentRoute,
    routeProfile,
    isLoadingRoute,
    
    // Actions
    setWaypoints,
    setManualWaypoints,
    setOrigin,
    setDestination,
    setIsAddingMode,
    setIsManualMode,
    setOriginLocked,
    setDestinationLocked,
    setRouteProfile,
    addWaypointAtLocation,
    removeWaypoint,
    clearMarkers,
    drawRoute,
    loadTrackWaypoints,
    fetchDirections
  };
}