
import React, { useRef, useEffect, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2, MapPin, AlertCircle } from 'lucide-react';
import { useMap } from '@/hooks/use-map';
import { useMapToken } from '@/contexts/MapTokenContext';
import MapTokenInput from './MapTokenInput';
import MapErrorBoundary from './MapErrorBoundary';
import { TripData } from '@/hooks/use-trip-webhook';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import mapboxgl from 'mapbox-gl';

interface TripMapProps {
  tripData?: TripData | null;
  height?: string;
  width?: string;
}

const TripMap: React.FC<TripMapProps> = ({ 
  tripData, 
  height = '500px', 
  width = '100%' 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  const { token, isTokenValid, isTokenLoading } = useMapToken();
  
  // Determine the initial center based on trip data
  const initialCenter = tripData?.startCoordinates || [9.1829, 48.7758]; // Default to Stuttgart if no data
  
  // Initialize the map
  const { map, isLoading, error, resetMap } = useMap({
    container: containerRef,
    center: initialCenter,
    zoom: 5,
    enableTerrain: true,
    onMapReady: (map) => {
      console.log("Map is ready and loaded");
      setMapLoaded(true);
    }
  });
  
  // Update markers and route when trip data changes
  useEffect(() => {
    if (!map || !mapLoaded || !tripData) return;
    
    console.log('Updating map with trip data:', tripData);
    
    // Clean up previous markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    // Clear any existing routes
    if (map.getLayer('route-line')) {
      map.removeLayer('route-line');
    }
    
    if (map.getLayer('route-line-casing')) {
      map.removeLayer('route-line-casing');
    }
    
    if (map.getSource('route')) {
      map.removeSource('route');
    }
    
    // Create bounds to fit all locations
    const bounds = new mapboxgl.LngLatBounds();
    
    // Add markers for all locations
    tripData.locations.forEach(location => {
      // Add location to bounds
      bounds.extend(location.coordinates);
      
      // Create custom marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'trip-marker';
      
      // Apply different styling based on location type
      let markerColor = '#3887be'; // Default blue
      let markerClass = '';
      
      switch (location.type) {
        case 'start':
          markerColor = '#32CD32'; // Green
          markerClass = 'marker-start';
          break;
        case 'end':
          markerColor = '#DC143C'; // Red
          markerClass = 'marker-end';
          break;
        case 'campsite':
          markerColor = '#FF8C00'; // Orange
          markerClass = 'marker-campsite';
          break;
        case 'fuel':
          markerColor = '#9932CC'; // Purple
          markerClass = 'marker-fuel';
          break;
        case 'poi':
          markerColor = '#1E90FF'; // Blue
          markerClass = 'marker-poi';
          break;
      }
      
      markerEl.innerHTML = `
        <div class="marker ${markerClass}" style="background-color: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>
      `;
      
      // Create and add the marker
      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat(location.coordinates)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <h3 style="margin: 0 0 5px 0; font-weight: 700;">${location.name}</h3>
            <p style="margin: 0; font-size: 12px;">${location.description || ''}</p>
          `)
        )
        .addTo(map);
      
      markersRef.current.push(marker);
    });
    
    // Add the route if we have route coordinates
    if (tripData.routeCoordinates && tripData.routeCoordinates.length > 1) {
      try {
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: tripData.routeCoordinates
            }
          }
        });
        
        // Add casing line (border)
        map.addLayer({
          id: 'route-line-casing',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#2c3e50',
            'line-width': 8
          }
        });
        
        // Add the main route line
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3498db',
            'line-width': 4
          }
        });
      } catch (err) {
        console.error('Error adding route to map:', err);
      }
    } else if (tripData.locations.length >= 2) {
      try {
        // If we don't have explicit route coordinates, draw a straight line between start and end
        const startLoc = tripData.locations.find(loc => loc.type === 'start')?.coordinates || tripData.startCoordinates;
        const endLoc = tripData.locations.find(loc => loc.type === 'end')?.coordinates || tripData.endCoordinates;
        
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [startLoc, endLoc]
            }
          }
        });
        
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3498db',
            'line-width': 4,
            'line-dasharray': [2, 1] // Make it dashed to indicate it's not a real route
          }
        });
      } catch (err) {
        console.error('Error adding fallback route to map:', err);
      }
    }
    
    // Fit the map to the bounds
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: 50,
        maxZoom: 12
      });
    }
  }, [tripData, map, mapLoaded]);
  
  // If token is being loaded, show loading state
  if (isTokenLoading) {
    return (
      <div style={{ height, width }} className="flex items-center justify-center bg-gray-100 rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // If no token or invalid token, show token input
  if (!token || !isTokenValid) {
    return (
      <div style={{ height, width }} className="flex items-center justify-center">
        <MapTokenInput />
      </div>
    );
  }

  // Render the map with proper error handling
  return (
    <MapErrorBoundary onReset={resetMap}>
      <Card className="overflow-hidden" style={{ height, width }}>
        <CardContent className="p-0 h-full">
          {/* Map container */}
          <div className="relative w-full h-full">
            <div 
              ref={containerRef} 
              className="absolute inset-0" 
              data-testid="map-container"
            />
            
            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-60 z-10">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium">Loading map...</p>
                </div>
              </div>
            )}
            
            {/* Error message */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-50 bg-opacity-90 z-10 p-4">
                <div className="text-center max-w-sm">
                  <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-red-700 mb-2">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={resetMap}
                    className="mt-2"
                  >
                    Retry Loading Map
                  </Button>
                </div>
              </div>
            )}
            
            {/* No trip data message */}
            {mapLoaded && !isLoading && !error && !tripData && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-60 z-10">
                <div className="text-center p-4 max-w-sm">
                  <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p>No trip data available. Use Steve the Travel Planner to plan a trip!</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </MapErrorBoundary>
  );
};

export default TripMap;
