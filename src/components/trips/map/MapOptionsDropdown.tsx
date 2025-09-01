import React, { useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Layers, 
  Navigation, 
  Mountain, 
  Globe, 
  Satellite,
  Map,
  CheckCircle,
  Flame,
  Cloud,
  Wifi,
  Trees,
  MapPin,
  Users,
  Car,
  X
} from 'lucide-react';

interface MapOptionsDropdownProps {
  map: React.MutableRefObject<mapboxgl.Map | undefined>;
  currentMapStyle: string;
  onStyleChange: (style: string) => void;
}

export default function MapOptionsDropdown({ 
  map, 
  currentMapStyle,
  onStyleChange
}: MapOptionsDropdownProps) {
  // State for overlays
  const [overlays, setOverlays] = useState({
    traffic: false,
    fires: false,
    smoke: false,
    phoneCoverage: false,
    nationalParks: false,
    stateForests: false
  });

  // State for POI filters
  const [poiFilters, setPoiFilters] = useState({
    wide_parking: false,
    pet_stops: false,
    medical: false,
    farmers_markets: false
  });

  // State for social layers
  const [socialLayers, setSocialLayers] = useState({
    friends: false,
    community: false
  });

  // Map styles configuration (using your existing styles)
  const mapStyles = [
    { 
      id: 'mapbox://styles/mapbox/satellite-streets-v12', 
      name: 'Satellite', 
      icon: Satellite,
      description: 'Satellite imagery with labels'
    },
    { 
      id: 'mapbox://styles/mapbox/outdoors-v12', 
      name: 'Outdoors', 
      icon: Mountain,
      description: 'Topographic for off-road'
    },
    { 
      id: 'mapbox://styles/mapbox/navigation-day-v1', 
      name: 'Navigation', 
      icon: Navigation,
      description: 'Turn-by-turn optimized'
    },
    { 
      id: 'mapbox://styles/mapbox/streets-v12', 
      name: 'Streets', 
      icon: Map,
      description: 'General purpose map'
    }
  ];

  // Handle style change
  const handleStyleChange = useCallback((styleId: string) => {
    if (!map.current) return;
    
    // Store current states
    const currentOverlays = { ...overlays };
    const currentPOIs = { ...poiFilters };
    const currentSocial = { ...socialLayers };
    
    // Change the style
    onStyleChange(styleId);
    
    // Reapply all active layers after style loads
    map.current.once('styledata', () => {
      // Reapply active overlays
      Object.entries(currentOverlays).forEach(([key, enabled]) => {
        if (enabled) {
          toggleOverlay(key as keyof typeof overlays, true);
        }
      });
      
      // Reapply active POI filters
      Object.entries(currentPOIs).forEach(([key, enabled]) => {
        if (enabled) {
          togglePOIFilter(key as keyof typeof poiFilters);
        }
      });
      
      // Reapply active social layers
      Object.entries(currentSocial).forEach(([key, enabled]) => {
        if (enabled) {
          toggleSocialLayer(key as keyof typeof socialLayers);
        }
      });
    });
  }, [map, onStyleChange, overlays, poiFilters, socialLayers]);

  // Toggle overlay function
  const toggleOverlay = useCallback(async (
    overlayKey: keyof typeof overlays, 
    forceState?: boolean
  ) => {
    if (!map.current) return;
    
    const newState = forceState !== undefined ? forceState : !overlays[overlayKey];
    setOverlays(prev => ({ ...prev, [overlayKey]: newState }));

    try {
      switch (overlayKey) {
        case 'traffic':
          if (newState) {
            // Add traffic layer
            if (!map.current.getSource('mapbox-traffic')) {
              map.current.addSource('mapbox-traffic', {
                type: 'vector',
                url: 'mapbox://mapbox.mapbox-traffic-v1'
              });
              
              map.current.addLayer({
                id: 'traffic',
                type: 'line',
                source: 'mapbox-traffic',
                'source-layer': 'traffic',
                paint: {
                  'line-color': [
                    'case',
                    ['==', ['get', 'congestion'], 'low'], '#22c55e',
                    ['==', ['get', 'congestion'], 'moderate'], '#eab308',
                    ['==', ['get', 'congestion'], 'heavy'], '#f97316',
                    ['==', ['get', 'congestion'], 'severe'], '#ef4444',
                    '#6b7280'
                  ],
                  'line-width': 2,
                  'line-opacity': 0.7
                }
              });
            }
          } else {
            // Remove traffic layer
            if (map.current.getLayer('traffic')) {
              map.current.removeLayer('traffic');
            }
            if (map.current.getSource('mapbox-traffic')) {
              map.current.removeSource('mapbox-traffic');
            }
          }
          break;

        case 'fires':
          if (newState) {
            // Fetch fire data from NASA FIRMS (using MODIS/VIIRS data)
            try {
              // Using a CORS-friendly endpoint or mock data for now
              const mockFireData = {
                type: 'FeatureCollection',
                features: [
                  // Mock fire points for testing - replace with real API
                  {
                    type: 'Feature',
                    geometry: {
                      type: 'Point',
                      coordinates: [-120.5, 38.5]
                    },
                    properties: {
                      brightness: 320,
                      confidence: 'high',
                      date: new Date().toISOString()
                    }
                  },
                  {
                    type: 'Feature',
                    geometry: {
                      type: 'Point', 
                      coordinates: [-121.0, 39.0]
                    },
                    properties: {
                      brightness: 350,
                      confidence: 'high',
                      date: new Date().toISOString()
                    }
                  }
                ]
              };

              if (!map.current.getSource('fires')) {
                map.current.addSource('fires', {
                  type: 'geojson',
                  data: mockFireData as any
                });

                // Add heatmap layer for fire intensity
                map.current.addLayer({
                  id: 'fire-heat',
                  type: 'heatmap',
                  source: 'fires',
                  paint: {
                    'heatmap-weight': [
                      'interpolate',
                      ['linear'],
                      ['get', 'brightness'],
                      0, 0,
                      400, 1
                    ],
                    'heatmap-intensity': 1,
                    'heatmap-color': [
                      'interpolate',
                      ['linear'],
                      ['heatmap-density'],
                      0, 'rgba(255, 255, 0, 0)',
                      0.2, 'rgba(255, 200, 0, 0.5)',
                      0.4, 'rgba(255, 150, 0, 0.6)',
                      0.6, 'rgba(255, 100, 0, 0.7)',
                      0.8, 'rgba(255, 50, 0, 0.8)',
                      1, 'rgba(255, 0, 0, 1)'
                    ],
                    'heatmap-radius': 30,
                    'heatmap-opacity': 0.7
                  }
                });

                // Add point markers for individual fires
                map.current.addLayer({
                  id: 'fire-points',
                  type: 'circle',
                  source: 'fires',
                  paint: {
                    'circle-radius': 6,
                    'circle-color': '#ff4444',
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 2,
                    'circle-opacity': 0.8
                  }
                });
              }
            } catch (error) {
              console.error('Error loading fire data:', error);
            }
          } else {
            // Remove fire layers
            ['fire-heat', 'fire-points'].forEach(layerId => {
              if (map.current.getLayer(layerId)) {
                map.current.removeLayer(layerId);
              }
            });
            if (map.current.getSource('fires')) {
              map.current.removeSource('fires');
            }
          }
          break;

        case 'nationalParks':
          if (newState) {
            // Mock national parks data - replace with real GeoJSON from NPS
            const mockParksData = {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Polygon',
                    coordinates: [[
                      [-119.5, 37.5],
                      [-119.5, 38.0],
                      [-119.0, 38.0],
                      [-119.0, 37.5],
                      [-119.5, 37.5]
                    ]]
                  },
                  properties: {
                    name: 'Yosemite National Park',
                    type: 'National Park'
                  }
                },
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Polygon',
                    coordinates: [[
                      [-118.5, 36.0],
                      [-118.5, 36.5],
                      [-118.0, 36.5],
                      [-118.0, 36.0],
                      [-118.5, 36.0]
                    ]]
                  },
                  properties: {
                    name: 'Sequoia National Park',
                    type: 'National Park'
                  }
                }
              ]
            };

            if (!map.current.getSource('national-parks')) {
              map.current.addSource('national-parks', {
                type: 'geojson',
                data: mockParksData as any
              });

              // Fill layer for park areas
              map.current.addLayer({
                id: 'parks-fill',
                type: 'fill',
                source: 'national-parks',
                paint: {
                  'fill-color': '#22c55e',
                  'fill-opacity': 0.15
                }
              });

              // Outline layer for park boundaries
              map.current.addLayer({
                id: 'parks-outline',
                type: 'line',
                source: 'national-parks',
                paint: {
                  'line-color': '#16a34a',
                  'line-width': 2
                }
              });

              // Label layer for park names
              map.current.addLayer({
                id: 'parks-labels',
                type: 'symbol',
                source: 'national-parks',
                layout: {
                  'text-field': ['get', 'name'],
                  'text-size': 12,
                  'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold']
                },
                paint: {
                  'text-color': '#0f766e',
                  'text-halo-color': '#ffffff',
                  'text-halo-width': 1
                }
              });
            }
          } else {
            // Remove park layers
            ['parks-fill', 'parks-outline', 'parks-labels'].forEach(layerId => {
              if (map.current.getLayer(layerId)) {
                map.current.removeLayer(layerId);
              }
            });
            if (map.current.getSource('national-parks')) {
              map.current.removeSource('national-parks');
            }
          }
          break;

        case 'stateForests':
          if (newState) {
            // Mock state forests data
            const mockForestsData = {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Polygon',
                    coordinates: [[
                      [-120.5, 39.0],
                      [-120.5, 39.5],
                      [-120.0, 39.5],
                      [-120.0, 39.0],
                      [-120.5, 39.0]
                    ]]
                  },
                  properties: {
                    name: 'Tahoe National Forest',
                    type: 'State Forest'
                  }
                }
              ]
            };

            if (!map.current.getSource('state-forests')) {
              map.current.addSource('state-forests', {
                type: 'geojson',
                data: mockForestsData as any
              });

              // Fill layer for forest areas (darker green)
              map.current.addLayer({
                id: 'forests-fill',
                type: 'fill',
                source: 'state-forests',
                paint: {
                  'fill-color': '#059669',
                  'fill-opacity': 0.12
                }
              });

              // Outline layer for forest boundaries
              map.current.addLayer({
                id: 'forests-outline',
                type: 'line',
                source: 'state-forests',
                paint: {
                  'line-color': '#047857',
                  'line-width': 1.5,
                  'line-dasharray': [3, 2]
                }
              });

              // Label layer for forest names
              map.current.addLayer({
                id: 'forests-labels',
                type: 'symbol',
                source: 'state-forests',
                layout: {
                  'text-field': ['get', 'name'],
                  'text-size': 11,
                  'text-font': ['Open Sans Semibold', 'Arial Unicode MS Regular']
                },
                paint: {
                  'text-color': '#065f46',
                  'text-halo-color': '#ffffff',
                  'text-halo-width': 1
                }
              });
            }
          } else {
            // Remove forest layers
            ['forests-fill', 'forests-outline', 'forests-labels'].forEach(layerId => {
              if (map.current.getLayer(layerId)) {
                map.current.removeLayer(layerId);
              }
            });
            if (map.current.getSource('state-forests')) {
              map.current.removeSource('state-forests');
            }
          }
          break;

        case 'phoneCoverage':
          if (newState) {
            // Mock phone coverage data for testing
            const mockCoverageData = {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Polygon',
                    coordinates: [[
                      [-122.5, 37.5],
                      [-122.5, 38.5],
                      [-121.5, 38.5],
                      [-121.5, 37.5],
                      [-122.5, 37.5]
                    ]]
                  },
                  properties: {
                    coverage: 'good',
                    provider: 'Multiple'
                  }
                }
              ]
            };

            if (!map.current.getSource('phone-coverage')) {
              map.current.addSource('phone-coverage', {
                type: 'geojson',
                data: mockCoverageData as any
              });

              map.current.addLayer({
                id: 'phone-coverage-fill',
                type: 'fill',
                source: 'phone-coverage',
                paint: {
                  'fill-color': '#22c55e',
                  'fill-opacity': 0.2
                }
              });

              map.current.addLayer({
                id: 'phone-coverage-outline',
                type: 'line',
                source: 'phone-coverage',
                paint: {
                  'line-color': '#16a34a',
                  'line-width': 2,
                  'line-dasharray': [2, 2]
                }
              });
            }
          } else {
            // Remove coverage layers
            ['phone-coverage-fill', 'phone-coverage-outline'].forEach(layerId => {
              if (map.current.getLayer(layerId)) {
                map.current.removeLayer(layerId);
              }
            });
            if (map.current.getSource('phone-coverage')) {
              map.current.removeSource('phone-coverage');
            }
          }
          break;

        // Other overlay cases will be implemented in next phases
        default:
          console.log(`Overlay ${overlayKey} will be implemented in next phase`);
      }
    } catch (error) {
      console.error(`Error toggling ${overlayKey}:`, error);
      setOverlays(prev => ({ ...prev, [overlayKey]: false }));
    }
  }, [map, overlays]);

  // Toggle POI filter
  const togglePOIFilter = useCallback(async (poiKey: keyof typeof poiFilters) => {
    if (!map.current) return;
    
    const newState = !poiFilters[poiKey];
    setPoiFilters(prev => ({ ...prev, [poiKey]: newState }));
    
    try {
      const sourceId = `poi-${poiKey}`;
      const layerId = `poi-${poiKey}-markers`;
      
      if (newState) {
        // Add POI markers based on type
        let poiData: any = null;
        
        switch (poiKey) {
          case 'wide_parking':
            // Mock data for wide parking spots suitable for Unimogs
            poiData = {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [-122.4194, 37.7749]
                  },
                  properties: {
                    name: 'Golden Gate Rest Area',
                    description: 'Large vehicle parking available',
                    type: 'wide_parking'
                  }
                },
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [-121.8863, 37.3382]
                  },
                  properties: {
                    name: 'San Jose Truck Stop',
                    description: '24/7 wide vehicle parking',
                    type: 'wide_parking'
                  }
                }
              ]
            };
            break;
            
          case 'pet_stops':
            // Mock data for pet-friendly stops
            poiData = {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [-122.3321, 37.5753]
                  },
                  properties: {
                    name: 'Dog Park Rest Area',
                    description: 'Off-leash area available',
                    type: 'pet_stops'
                  }
                },
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [-121.9552, 37.3541]
                  },
                  properties: {
                    name: 'Pet Relief Station',
                    description: 'Water and waste disposal',
                    type: 'pet_stops'
                  }
                }
              ]
            };
            break;
            
          case 'medical':
            // Mock data for medical facilities
            poiData = {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [-122.4304, 37.7749]
                  },
                  properties: {
                    name: 'SF General Hospital',
                    description: '24/7 Emergency Room',
                    type: 'medical'
                  }
                },
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [-121.8946, 37.3349]
                  },
                  properties: {
                    name: 'Valley Medical Center',
                    description: 'Urgent Care Available',
                    type: 'medical'
                  }
                }
              ]
            };
            break;
            
          case 'farmers_markets':
            // Mock data for farmers markets
            poiData = {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [-122.4194, 37.7749]
                  },
                  properties: {
                    name: 'Ferry Building Market',
                    description: 'Saturdays 8am-2pm',
                    type: 'farmers_markets'
                  }
                },
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [-121.9018, 37.3322]
                  },
                  properties: {
                    name: 'Downtown Farmers Market',
                    description: 'Sundays 9am-1pm',
                    type: 'farmers_markets'
                  }
                }
              ]
            };
            break;
        }
        
        if (poiData) {
          // Add source if it doesn't exist
          if (!map.current.getSource(sourceId)) {
            map.current.addSource(sourceId, {
              type: 'geojson',
              data: poiData
            });
          }
          
          // Add marker layer if it doesn't exist
          if (!map.current.getLayer(layerId)) {
            // Define icon and color based on POI type
            const poiStyles: Record<string, { icon: string; color: string }> = {
              wide_parking: { icon: '🅿️', color: '#3b82f6' },
              pet_stops: { icon: '🐾', color: '#10b981' },
              medical: { icon: '🚑', color: '#ef4444' },
              farmers_markets: { icon: '🥕', color: '#f97316' }
            };
            
            const style = poiStyles[poiKey];
            
            // Add circle marker layer
            map.current.addLayer({
              id: layerId,
              type: 'circle',
              source: sourceId,
              paint: {
                'circle-radius': 8,
                'circle-color': style.color,
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 2,
                'circle-opacity': 0.9
              }
            });
            
            // Add text label layer
            map.current.addLayer({
              id: `${layerId}-labels`,
              type: 'symbol',
              source: sourceId,
              layout: {
                'text-field': style.icon,
                'text-size': 16,
                'text-anchor': 'center',
                'text-allow-overlap': true
              }
            });
            
            // Add click handler for popups
            map.current.on('click', layerId, (e) => {
              if (!e.features || e.features.length === 0) return;
              
              const feature = e.features[0];
              const coordinates = (feature.geometry as any).coordinates.slice();
              const properties = feature.properties;
              
              // Create popup content
              const popupContent = `
                <div style="padding: 8px;">
                  <h3 style="margin: 0 0 4px 0; font-weight: bold;">${properties.name}</h3>
                  <p style="margin: 0; color: #666; font-size: 14px;">${properties.description}</p>
                </div>
              `;
              
              // Create and show popup
              new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(popupContent)
                .addTo(map.current!);
            });
            
            // Change cursor on hover
            map.current.on('mouseenter', layerId, () => {
              if (map.current) map.current.getCanvas().style.cursor = 'pointer';
            });
            
            map.current.on('mouseleave', layerId, () => {
              if (map.current) {
                // Don't reset cursor if we're in waypoint mode (crosshair should persist)
                const canvas = map.current.getCanvas();
                if (canvas.style.cursor !== 'crosshair') {
                  canvas.style.cursor = '';
                }
              }
            });
          }
        }
      } else {
        // Remove POI layers
        const layersToRemove = [layerId, `${layerId}-labels`];
        
        layersToRemove.forEach(id => {
          if (map.current?.getLayer(id)) {
            // Remove click handlers
            map.current.off('click', id);
            map.current.off('mouseenter', id);
            map.current.off('mouseleave', id);
            // Remove layer
            map.current.removeLayer(id);
          }
        });
        
        // Remove source
        if (map.current?.getSource(sourceId)) {
          map.current.removeSource(sourceId);
        }
      }
    } catch (error) {
      console.error(`Error toggling POI ${poiKey}:`, error);
      setPoiFilters(prev => ({ ...prev, [poiKey]: false }));
    }
  }, [map, poiFilters]);

  // Toggle social layer
  const toggleSocialLayer = useCallback(async (layerKey: keyof typeof socialLayers) => {
    if (!map.current) return;
    
    const newState = !socialLayers[layerKey];
    setSocialLayers(prev => ({ ...prev, [layerKey]: newState }));
    
    try {
      const sourceId = `social-${layerKey}`;
      const layerId = `social-${layerKey}-markers`;
      
      if (newState) {
        switch (layerKey) {
          case 'friends':
            // Mock data for friends' locations - in production would fetch from Supabase
            const friendsData = {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [-122.4, 37.8]
                  },
                  properties: {
                    name: 'John\'s Unimog',
                    status: 'On trail - Tahoe National Forest',
                    lastUpdate: '5 minutes ago',
                    vehicleType: '1300L',
                    avatar: '👤'
                  }
                },
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [-121.9, 37.4]
                  },
                  properties: {
                    name: 'Sarah\'s Unimog',
                    status: 'Camping - Yosemite',
                    lastUpdate: '1 hour ago',
                    vehicleType: '416 Doka',
                    avatar: '👥'
                  }
                },
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [-122.2, 37.6]
                  },
                  properties: {
                    name: 'Mike\'s Unimog',
                    status: 'Maintenance stop',
                    lastUpdate: '30 minutes ago',
                    vehicleType: 'U5000',
                    avatar: '🔧'
                  }
                }
              ]
            };
            
            if (!map.current.getSource(sourceId)) {
              map.current.addSource(sourceId, {
                type: 'geojson',
                data: friendsData as any
              });
            }
            
            if (!map.current.getLayer(layerId)) {
              // Add pulsing circle for live locations
              map.current.addLayer({
                id: `${layerId}-pulse`,
                type: 'circle',
                source: sourceId,
                paint: {
                  'circle-radius': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    5, 20,
                    10, 30
                  ],
                  'circle-color': '#3b82f6',
                  'circle-opacity': 0.2,
                  'circle-blur': 0.5
                }
              });
              
              // Add friend marker
              map.current.addLayer({
                id: layerId,
                type: 'circle',
                source: sourceId,
                paint: {
                  'circle-radius': 10,
                  'circle-color': '#3b82f6',
                  'circle-stroke-color': '#ffffff',
                  'circle-stroke-width': 3,
                  'circle-opacity': 1
                }
              });
              
              // Add avatar/icon layer
              map.current.addLayer({
                id: `${layerId}-icons`,
                type: 'symbol',
                source: sourceId,
                layout: {
                  'text-field': ['get', 'avatar'],
                  'text-size': 14,
                  'text-anchor': 'center',
                  'text-allow-overlap': true
                }
              });
              
              // Add name labels
              map.current.addLayer({
                id: `${layerId}-labels`,
                type: 'symbol',
                source: sourceId,
                layout: {
                  'text-field': ['get', 'name'],
                  'text-size': 11,
                  'text-anchor': 'top',
                  'text-offset': [0, 1.5],
                  'text-font': ['Open Sans Semibold', 'Arial Unicode MS Regular']
                },
                paint: {
                  'text-color': '#1e40af',
                  'text-halo-color': '#ffffff',
                  'text-halo-width': 2
                }
              });
              
              // Add click handler for friend details
              map.current.on('click', layerId, (e) => {
                if (!e.features || e.features.length === 0) return;
                
                const feature = e.features[0];
                const coordinates = (feature.geometry as any).coordinates.slice();
                const props = feature.properties;
                
                const popupContent = `
                  <div style="padding: 10px; min-width: 200px;">
                    <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1e40af;">
                      ${props.avatar} ${props.name}
                    </h3>
                    <div style="font-size: 14px; color: #666; margin-bottom: 6px;">
                      <strong>Vehicle:</strong> ${props.vehicleType}
                    </div>
                    <div style="font-size: 14px; color: #666; margin-bottom: 6px;">
                      <strong>Status:</strong> ${props.status}
                    </div>
                    <div style="font-size: 12px; color: #999;">
                      <em>Updated ${props.lastUpdate}</em>
                    </div>
                    <button style="
                      margin-top: 10px;
                      width: 100%;
                      padding: 6px 12px;
                      background: #3b82f6;
                      color: white;
                      border: none;
                      border-radius: 4px;
                      cursor: pointer;
                      font-size: 14px;
                    " onclick="alert('Message feature coming soon!')">
                      Send Message
                    </button>
                  </div>
                `;
                
                new mapboxgl.Popup({ closeButton: true })
                  .setLngLat(coordinates)
                  .setHTML(popupContent)
                  .addTo(map.current!);
              });
              
              // Cursor on hover
              map.current.on('mouseenter', layerId, () => {
                if (map.current) map.current.getCanvas().style.cursor = 'pointer';
              });
              
              map.current.on('mouseleave', layerId, () => {
                if (map.current) {
                  // Don't reset cursor if we're in waypoint mode (crosshair should persist)
                  const canvas = map.current.getCanvas();
                  if (canvas.style.cursor !== 'crosshair') {
                    canvas.style.cursor = '';
                  }
                }
              });
            }
            break;
            
          case 'community':
            // Mock data for community members
            const communityData = {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [-122.3, 37.7]
                  },
                  properties: {
                    type: 'event',
                    name: 'Unimog Meetup',
                    description: 'Monthly gathering',
                    date: 'This Saturday',
                    attendees: 12
                  }
                },
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [-121.8, 37.3]
                  },
                  properties: {
                    type: 'workshop',
                    name: 'Joe\'s Unimog Service',
                    description: 'Specialized Unimog repair',
                    rating: '4.8 ⭐',
                    attendees: 0
                  }
                }
              ]
            };
            
            if (!map.current.getSource(sourceId)) {
              map.current.addSource(sourceId, {
                type: 'geojson',
                data: communityData as any
              });
            }
            
            if (!map.current.getLayer(layerId)) {
              // Community markers
              map.current.addLayer({
                id: layerId,
                type: 'circle',
                source: sourceId,
                paint: {
                  'circle-radius': 8,
                  'circle-color': [
                    'case',
                    ['==', ['get', 'type'], 'event'], '#10b981',
                    ['==', ['get', 'type'], 'workshop'], '#f59e0b',
                    '#6b7280'
                  ],
                  'circle-stroke-color': '#ffffff',
                  'circle-stroke-width': 2
                }
              });
              
              // Community labels
              map.current.addLayer({
                id: `${layerId}-labels`,
                type: 'symbol',
                source: sourceId,
                layout: {
                  'text-field': ['get', 'name'],
                  'text-size': 10,
                  'text-anchor': 'top',
                  'text-offset': [0, 1],
                  'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular']
                },
                paint: {
                  'text-color': '#374151',
                  'text-halo-color': '#ffffff',
                  'text-halo-width': 1
                }
              });
            }
            break;
        }
      } else {
        // Remove social layers
        const layersToRemove = [
          `${layerId}-pulse`,
          `${layerId}-icons`,
          `${layerId}-labels`,
          layerId
        ];
        
        layersToRemove.forEach(id => {
          if (map.current?.getLayer(id)) {
            map.current.off('click', id);
            map.current.off('mouseenter', id);
            map.current.off('mouseleave', id);
            map.current.removeLayer(id);
          }
        });
        
        if (map.current?.getSource(sourceId)) {
          map.current.removeSource(sourceId);
        }
      }
    } catch (error) {
      console.error(`Error toggling social layer ${layerKey}:`, error);
      setSocialLayers(prev => ({ ...prev, [layerKey]: false }));
    }
  }, [map, socialLayers]);

  // Clear all overlays function
  const clearAllOverlays = useCallback(() => {
    // Clear all overlays
    Object.keys(overlays).forEach(key => {
      if (overlays[key as keyof typeof overlays]) {
        toggleOverlay(key as keyof typeof overlays, false);
      }
    });
    
    // Clear all POI filters
    Object.keys(poiFilters).forEach(key => {
      if (poiFilters[key as keyof typeof poiFilters]) {
        togglePOIFilter(key as keyof typeof poiFilters);
      }
    });
    
    // Clear all social layers
    Object.keys(socialLayers).forEach(key => {
      if (socialLayers[key as keyof typeof socialLayers]) {
        toggleSocialLayer(key as keyof typeof socialLayers);
      }
    });
    
    // Reset states
    setOverlays({
      traffic: false,
      fires: false,
      smoke: false,
      phoneCoverage: false,
      nationalParks: false,
      stateForests: false
    });
    
    setPoiFilters({
      wide_parking: false,
      pet_stops: false,
      medical: false,
      farmers_markets: false
    });
    
    setSocialLayers({
      friends: false,
      community: false
    });
  }, [overlays, poiFilters, socialLayers]);
  
  // Count active layers
  const activeLayerCount = React.useMemo(() => {
    const overlayCount = Object.values(overlays).filter(Boolean).length;
    const poiCount = Object.values(poiFilters).filter(Boolean).length;
    const socialCount = Object.values(socialLayers).filter(Boolean).length;
    return overlayCount + poiCount + socialCount;
  }, [overlays, poiFilters, socialLayers]);

  // Save preferences to localStorage
  React.useEffect(() => {
    const preferences = {
      overlays,
      poiFilters,
      socialLayers
    };
    localStorage.setItem('mapOptionsPreferences', JSON.stringify(preferences));
  }, [overlays, poiFilters, socialLayers]);

  // Load preferences on mount
  React.useEffect(() => {
    const savedPreferences = localStorage.getItem('mapOptionsPreferences');
    if (savedPreferences) {
      try {
        const prefs = JSON.parse(savedPreferences);
        if (prefs.overlays) setOverlays(prefs.overlays);
        if (prefs.poiFilters) setPoiFilters(prefs.poiFilters);
        if (prefs.socialLayers) setSocialLayers(prefs.socialLayers);
      } catch (error) {
        console.error('Error loading map preferences:', error);
      }
    }
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 relative">
          <Layers className="w-4 h-4" />
          <span className="hidden sm:inline">Map Options</span>
          {activeLayerCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeLayerCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-80 max-h-[600px] overflow-y-auto"
        align="end"
        sideOffset={5}
      >
        {/* Clear All Button - only show if layers are active */}
        {activeLayerCount > 0 && (
          <>
            <div className="px-2 py-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                onClick={clearAllOverlays}
              >
                <X className="w-4 h-4" />
                Clear All Layers ({activeLayerCount})
              </Button>
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        {/* Map Styles Section */}
        <DropdownMenuLabel className="flex items-center gap-2">
          <Map className="w-4 h-4" />
          Map Styles
        </DropdownMenuLabel>
        {mapStyles.map((style) => {
          const Icon = style.icon;
          const isActive = currentMapStyle === style.id;
          return (
            <DropdownMenuItem
              key={style.id}
              onClick={() => handleStyleChange(style.id)}
              className={`flex items-start gap-3 p-3 cursor-pointer ${
                isActive ? 'bg-accent' : ''
              }`}
            >
              <Icon className="w-4 h-4 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{style.name}</span>
                  {isActive && (
                    <CheckCircle className="w-4 h-4 text-primary" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {style.description}
                </span>
              </div>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />

        {/* Map Overlays Section */}
        <DropdownMenuLabel className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Map Overlays
        </DropdownMenuLabel>
        
        {/* Traffic */}
        <div
          className="flex items-center justify-between px-3 py-2 hover:bg-accent cursor-pointer rounded"
          onClick={() => toggleOverlay('traffic')}
        >
          <div className="flex items-center gap-3">
            <Car className="w-4 h-4" />
            <div>
              <Label className="text-sm font-medium cursor-pointer">
                Traffic
              </Label>
              <p className="text-xs text-muted-foreground">
                Real-time traffic conditions
              </p>
            </div>
          </div>
          <Switch
            checked={overlays.traffic}
            onCheckedChange={() => toggleOverlay('traffic')}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Active Fires */}
        <div
          className="flex items-center justify-between px-3 py-2 hover:bg-accent cursor-pointer rounded"
          onClick={() => toggleOverlay('fires')}
        >
          <div className="flex items-center gap-3">
            <Flame className="w-4 h-4 text-orange-500" />
            <div>
              <Label className="text-sm font-medium cursor-pointer">
                Active Fires
              </Label>
              <p className="text-xs text-muted-foreground">
                Wildfire hotspots
              </p>
            </div>
          </div>
          <Switch
            checked={overlays.fires}
            onCheckedChange={() => toggleOverlay('fires')}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Phone Coverage */}
        <div
          className="flex items-center justify-between px-3 py-2 hover:bg-accent cursor-pointer rounded"
          onClick={() => toggleOverlay('phoneCoverage')}
        >
          <div className="flex items-center gap-3">
            <Wifi className="w-4 h-4 text-green-600" />
            <div>
              <Label className="text-sm font-medium cursor-pointer">
                Phone Coverage
              </Label>
              <p className="text-xs text-muted-foreground">
                Cell signal areas
              </p>
            </div>
          </div>
          <Switch
            checked={overlays.phoneCoverage}
            onCheckedChange={() => toggleOverlay('phoneCoverage')}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* National Parks */}
        <div
          className="flex items-center justify-between px-3 py-2 hover:bg-accent cursor-pointer rounded"
          onClick={() => toggleOverlay('nationalParks')}
        >
          <div className="flex items-center gap-3">
            <Trees className="w-4 h-4 text-green-700" />
            <div>
              <Label className="text-sm font-medium cursor-pointer">
                National Parks
              </Label>
              <p className="text-xs text-muted-foreground">
                Park boundaries
              </p>
            </div>
          </div>
          <Switch
            checked={overlays.nationalParks}
            onCheckedChange={() => toggleOverlay('nationalParks')}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* State Forests */}
        <div
          className="flex items-center justify-between px-3 py-2 hover:bg-accent cursor-pointer rounded"
          onClick={() => toggleOverlay('stateForests')}
        >
          <div className="flex items-center gap-3">
            <Trees className="w-4 h-4 text-emerald-700" />
            <div>
              <Label className="text-sm font-medium cursor-pointer">
                State Forests
              </Label>
              <p className="text-xs text-muted-foreground">
                Forest boundaries
              </p>
            </div>
          </div>
          <Switch
            checked={overlays.stateForests}
            onCheckedChange={() => toggleOverlay('stateForests')}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <DropdownMenuSeparator />

        {/* Points of Interest Section */}
        <DropdownMenuLabel className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Points of Interest
        </DropdownMenuLabel>
        
        <DropdownMenuCheckboxItem
          checked={poiFilters.wide_parking}
          onCheckedChange={() => togglePOIFilter('wide_parking')}
        >
          <span className="text-lg mr-2">🅿️</span>
          Wide Parking
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuCheckboxItem
          checked={poiFilters.pet_stops}
          onCheckedChange={() => togglePOIFilter('pet_stops')}
        >
          <span className="text-lg mr-2">🐾</span>
          Pet Stops
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuCheckboxItem
          checked={poiFilters.medical}
          onCheckedChange={() => togglePOIFilter('medical')}
        >
          <span className="text-lg mr-2">🚑</span>
          Medical Facilities
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuCheckboxItem
          checked={poiFilters.farmers_markets}
          onCheckedChange={() => togglePOIFilter('farmers_markets')}
        >
          <span className="text-lg mr-2">🥕</span>
          Farmers Markets
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />

        {/* Social Layers Section */}
        <DropdownMenuLabel className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          Social Layers
        </DropdownMenuLabel>
        
        <div
          className="flex items-center justify-between px-3 py-2 hover:bg-accent cursor-pointer rounded"
          onClick={() => toggleSocialLayer('friends')}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">👥</span>
            <div>
              <Label className="text-sm font-medium cursor-pointer">
                Friends
              </Label>
              <p className="text-xs text-muted-foreground">
                Track friends on trips
              </p>
            </div>
          </div>
          <Switch
            checked={socialLayers.friends}
            onCheckedChange={() => toggleSocialLayer('friends')}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        
        <div
          className="flex items-center justify-between px-3 py-2 hover:bg-accent cursor-pointer rounded"
          onClick={() => toggleSocialLayer('community')}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">🏕️</span>
            <div>
              <Label className="text-sm font-medium cursor-pointer">
                Community
              </Label>
              <p className="text-xs text-muted-foreground">
                Events & workshops
              </p>
            </div>
          </div>
          <Switch
            checked={socialLayers.community}
            onCheckedChange={() => toggleSocialLayer('community')}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}