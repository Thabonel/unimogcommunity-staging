import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Map, List, MapPin, Layers, Save, Car, Footprints, Bike, Trash2, Navigation, Share2, Wrench, Crosshair } from 'lucide-react';
import MapComponent from '../MapComponent';
import MapOptionsDropdown from './map/MapOptionsDropdown';
import { TripCardProps } from './TripCard';
import { useMapMarkers } from './map/hooks/useMapMarkers';
import { useUserLocation } from '@/hooks/use-user-location';
import EnhancedTripsSidebar from './EnhancedTripsSidebar';
import mapboxgl from 'mapbox-gl';
import { toast } from 'sonner';
import { savePlannedRoute, fetchUserTracks, deleteTrack } from '@/services/trackService';
import { useAuth } from '@/contexts/AuthContext';
import { getDirections, formatDistance, formatDuration, DirectionsRoute } from '@/services/mapboxDirections';
import { Waypoint } from '@/types/waypoint';
import { SaveRouteModal, SaveRouteData } from './SaveRouteModal';
import { AddPOIModal } from './AddPOIModal';
import { getPOIsInBounds, POI_ICONS } from '@/services/poiService';
import { searchPlaces, getCountryFromCoordinates } from '@/services/mapboxGeocoding';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { useWaypointManager } from '@/hooks/use-waypoint-manager';
import { runCompleteDiagnostics } from '@/utils/mapbox-diagnostics';
import { ErrorBoundary } from '@/components/error-boundary';
import { EnhancedBarryChat } from '../knowledge/EnhancedBarryChat';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';

// Map styles configuration
const MAP_STYLES = {
  STREETS: 'mapbox://styles/mapbox/streets-v12',
  OUTDOORS: 'mapbox://styles/mapbox/outdoors-v12',
  SATELLITE: 'mapbox://styles/mapbox/satellite-v9',
  SATELLITE_STREETS: 'mapbox://styles/mapbox/satellite-streets-v12',
};

interface FullScreenTripMapProps {
  trips: TripCardProps[];
  onTripSelect: (trip: TripCardProps) => void;
  onCreateTrip: () => void;
  isLoading: boolean;
  onTripsRefresh?: () => Promise<void>;
}

const FullScreenTripMapWithWaypoints: React.FC<FullScreenTripMapProps> = ({
  trips,
  onTripSelect,
  onCreateTrip,
  isLoading,
  onTripsRefresh
}) => {
  const [activeTrip, setActiveTrip] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentMapStyle, setCurrentMapStyle] = useState<string>(MAP_STYLES.OUTDOORS);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isAddingPOI, setIsAddingPOI] = useState(false);
  const [showPOIModal, setShowPOIModal] = useState(false);
  const [poiCoordinates, setPOICoordinates] = useState<[number, number] | null>(null);
  const [pois, setPOIs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [searchMarkersRef] = useState<React.MutableRefObject<mapboxgl.Marker[]>>({ current: [] });
  const [showBarryChat, setShowBarryChat] = useState(false);
  const [userHasMovedMap, setUserHasMovedMap] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [shouldAutoCenter, setShouldAutoCenter] = useState(true);
  const [hasInitiallyCentered, setHasInitiallyCentered] = useState(false);
  const [userTracks, setUserTracks] = useState<any[]>([]);
  const [loadedTracks, setLoadedTracks] = useState<Map<string, any>>(new window.Map());
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const poiMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const clickListenerRef = useRef<((e: mapboxgl.MapMouseEvent) => void) | null>(null);
  
  const { location } = useUserLocation();
  const { user } = useAuth();

  // Track map loaded state for waypoint manager
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  
  // Use the waypoint manager for all waypoint operations
  const waypointManager = useWaypointManager({ 
    map: mapInstance,
    onRouteUpdate: (waypoints) => {
      console.log('Route updated with waypoints:', waypoints.length);
    }
  });
  
  const {
    waypoints,
    currentRoute, 
    routeProfile,
    isLoadingRoute,
    isAddingMode: isAddingWaypoints,
    setIsAddingMode: setIsAddingWaypoints,
    setRouteProfile,
    addWaypointAtLocation,
    clearMarkers,
    loadTrackWaypoints
  } = waypointManager;

  // Fetch user tracks on mount
  useEffect(() => {
    if (user) {
      loadUserTracks();
    }
  }, [user]);

  const loadUserTracks = async () => {
    if (!user) return;
    
    setIsLoadingTracks(true);
    try {
      const tracks = await fetchUserTracks(user.id);
      console.log('Fetched user tracks:', tracks);
      setUserTracks(tracks);
    } catch (error) {
      console.error('Error loading tracks:', error);
      toast.error('Failed to load saved tracks');
    } finally {
      setIsLoadingTracks(false);
    }
  };

  // Handle track toggle - load/unload track on map
  const handleTrackToggle = async (trackId: string) => {
    console.log('Toggling track:', trackId);
    
    // Find the track data
    const track = userTracks.find(t => t.id === trackId);
    if (!track) {
      console.error('Track not found:', trackId);
      return;
    }
    
    // Check if track is already loaded
    if (loadedTracks.has(trackId)) {
      // Track is already visible - just re-center on it
      if (mapRef.current && track.segments?.bounds) {
        const { minLat, maxLat, minLon, maxLon } = track.segments.bounds;
        mapRef.current.fitBounds(
          [[minLon, minLat], [maxLon, maxLat]],
          { padding: 50, duration: 1000 }
        );
        toast.info(`Centered on: ${track.name}`);
      }
      
      // Optionally, if you want clicking again to hide it, uncomment below:
      // loadedTracks.delete(trackId);
      // setLoadedTracks(new Map(loadedTracks));
      // clearMarkers();
      // toast.info('Track removed from map');
      return;
    }
    
    // Load track waypoints to map
    if (track.segments && loadTrackWaypoints) {
      try {
        // First, clear other tracks (optional - for single track view)
        // clearMarkers();
        // loadedTracks.clear();
        
        // Pass track with data field for loadTrackWaypoints
        loadTrackWaypoints({ ...track, data: track.segments });
        loadedTracks.set(trackId, track);
        setLoadedTracks(new Map(loadedTracks));
        toast.success(`Loaded track: ${track.name}`);
        
        // Fit map to track bounds if available
        if (mapRef.current && track.segments.bounds) {
          const { minLat, maxLat, minLon, maxLon } = track.segments.bounds;
          mapRef.current.fitBounds(
            [[minLon, minLat], [maxLon, maxLat]],
            { padding: 50, duration: 1000 }
          );
        }
      } catch (error) {
        console.error('Error loading track:', error);
        toast.error('Failed to load track on map');
      }
    }
  };

  // Handle track save - duplicate and save as new
  const handleTrackSave = async (trackId: string) => {
    console.log('Saving track as new trip:', trackId);
    
    // Find the track data
    const track = userTracks.find(t => t.id === trackId);
    if (!track) {
      console.error('Track not found:', trackId);
      return;
    }
    
    // Load track to map if not already loaded
    if (!loadedTracks.has(trackId)) {
      handleTrackToggle(trackId);
    }
    
    // Open save modal with track name as base
    setShowSaveModal(true);
    // The save modal will handle the actual saving with waypoints from the map
  };

  const handleDeleteTrack = async (trackId: string) => {
    if (!user) {
      toast.error('You must be logged in to delete tracks');
      return;
    }

    const track = userTracks.find(t => t.id === trackId);
    if (!track) {
      toast.error('Track not found');
      return;
    }

    // Confirm deletion
    if (!confirm(`Are you sure you want to delete "${track.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const success = await deleteTrack(trackId, user.id);
      if (success) {
        // Remove from loaded tracks if it's currently displayed
        if (loadedTracks.has(trackId)) {
          loadedTracks.delete(trackId);
          setLoadedTracks(new window.Map(loadedTracks));
          clearMarkers();
        }
        
        // Refresh the tracks list
        await loadUserTracks();
        toast.success('Track deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting track:', error);
      toast.error('Failed to delete track');
    }
  };

  // Detect user's country from their location
  useEffect(() => {
    if (location && !userCountry) {
      getCountryFromCoordinates(location.longitude, location.latitude)
        .then(country => {
          if (country) {
            setUserCountry(country);
            console.log('Detected user country:', country);
          }
        })
        .catch(error => {
          console.error('Failed to detect country:', error);
        });
    }
  }, [location, userCountry]);
  
  
  
  
  
  // Function to handle map load completion
  const handleMapLoad = useCallback((map: mapboxgl.Map) => {
    console.log('Map fully loaded');
    setMapLoaded(true);
    mapRef.current = map;
    setMapInstance(map);
    
    // Only auto-center once on initial load when location is available
    if (location && !hasInitiallyCentered && shouldAutoCenter) {
      console.log('Initial load: Centering map on user location:', location);
      setTimeout(() => {
        map.flyTo({
          center: [location.longitude, location.latitude],
          zoom: 12,
          duration: 2500, // 2.5 second smooth animation
          essential: true
        });
        setHasInitiallyCentered(true);
        setShouldAutoCenter(false);
      }, 1000); // Wait a bit longer for the map to settle
    }
    
    // Set up map move listeners to detect user interaction
    const handleMapMove = () => {
      setUserHasMovedMap(true);
      setShouldAutoCenter(false);
    };
    
    // Listen for user-initiated map movements
    map.on('dragstart', handleMapMove);
    map.on('zoomstart', handleMapMove);
    map.on('pitchstart', handleMapMove);
    map.on('rotatestart', handleMapMove);
    
    // Note: User location is now handled by GeolocateControl in the map initialization
    // The blue dot and compass functionality are provided by the built-in Mapbox control
    console.log('🗺️ User location will be handled by GeolocateControl');
  }, [location, hasInitiallyCentered, shouldAutoCenter]);
  
  // Store refs for the current state values
  const isAddingPOIRef = useRef(isAddingPOI);
  
  // Update refs when values change
  useEffect(() => {
    isAddingPOIRef.current = isAddingPOI;
  }, [isAddingPOI]);
  
  // Set up click listener ONCE after map loads
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    
    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      // Handle POI click using ref
      if (isAddingPOIRef.current) {
        setPOICoordinates([e.lngLat.lng, e.lngLat.lat]);
        setShowPOIModal(true);
        setIsAddingPOI(false);
        return;
      }
      
      // Waypoint handling is now managed by useWaypointManager
      // The hook handles click events internally
    };
    
    mapRef.current.on('click', handleClick);
    clickListenerRef.current = handleClick;
    
    return () => {
      if (mapRef.current && clickListenerRef.current) {
        mapRef.current.off('click', clickListenerRef.current);
      }
    };
  }, [mapLoaded]); // Only depend on mapLoaded
  
  // Update cursor for POI mode only (waypoint cursor is handled by the hook)
  useEffect(() => {
    if (mapRef.current && mapLoaded) {
      const canvas = mapRef.current.getCanvas();
      if (canvas) {
        // Only handle POI cursor, let waypoint manager handle waypoint cursor
        if (isAddingPOI) {
          canvas.style.cursor = 'crosshair';
        } else if (!isAddingWaypoints) {
          // Only reset if not in waypoint mode
          canvas.style.cursor = '';
        }
      }
    }
  }, [mapLoaded, isAddingWaypoints, isAddingPOI]);
  
  // Handle trip click in the list
  const handleTripClick = (trip: TripCardProps) => {
    setActiveTrip(trip.id);
    onTripSelect(trip);
    
    // Fly to location if map is ready
    if (mapRef.current && trip.startLocation) {
      try {
        const coords = trip.startLocation.split(',').map(Number);
        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
          mapRef.current.flyTo({
            center: [coords[1], coords[0]], // [lng, lat]
            zoom: 10,
            essential: true
          });
        }
      } catch (err) {
        console.error('Error flying to location:', err);
      }
    }
  };

  // Toggle list view
  const toggleView = () => {
    setShowList(!showList);
  };

  // Toggle waypoint adding mode
  const toggleWaypointMode = () => {
    setIsAddingWaypoints(!isAddingWaypoints);
    setIsAddingPOI(false); // Disable POI mode
    setShouldAutoCenter(false); // Prevent auto-centering when in waypoint mode
    if (!isAddingWaypoints) {
      toast.info('Click on the map to add waypoints');
    }
  };

  // Toggle POI adding mode
  const togglePOIMode = () => {
    setIsAddingPOI(!isAddingPOI);
    setIsAddingWaypoints(false); // Disable waypoint mode
    if (!isAddingPOI) {
      toast.info('Click on the map to add a Point of Interest');
    }
  };

  // Handle POI save
  const handlePOISave = (poi: any) => {
    setPOIs(prev => [...prev, poi]);
    
    // Create POI marker
    if (mapRef.current) {
      const config = POI_ICONS[poi.type];
      
      const el = document.createElement('div');
      el.innerHTML = config.icon;
      el.style.fontSize = '20px';
      el.style.cursor = 'pointer';
      el.title = `${poi.name} (${config.label})`;
      
      const marker = new mapboxgl.Marker(el)
        .setLngLat(poi.coordinates)
        .addTo(mapRef.current);
      
      poiMarkersRef.current.push(marker);
    }
  };

  // Clear all waypoints using waypoint manager
  const clearWaypoints = () => {
    clearMarkers(); // Use waypoint manager's clear function
    clearSearchResults(); // Also clear search results
  };

  // Handle map style change
  const handleStyleChange = useCallback((style: string) => {
    console.log('Changing map style to:', style);
    setCurrentMapStyle(style);
    if (mapRef.current) {
      mapRef.current.setStyle(style);
      // Re-add markers after style change
      mapRef.current.once('style.load', () => {
        // Re-add user marker
        if (userMarkerRef.current) {
          userMarkerRef.current.addTo(mapRef.current!);
        }
        // Waypoint manager handles its own markers and routes
        // They will be automatically re-added by the manager
      });
    }
  }, []);

  // Manual center on user location
  const centerOnUserLocation = useCallback(() => {
    if (mapRef.current && location) {
      console.log('Manual centering on user location:', location);
      mapRef.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 12,
        duration: 1500, // 1.5 second smooth animation
        essential: true
      });
      toast.info('Centered on your location');
    } else {
      toast.error('Location not available');
    }
  }, [location]);
  
  // Save route handler (basic save, opens modal)
  const handleSaveRoute = async () => {
    if (!user) {
      toast.error('Please sign in to save routes');
      return;
    }
    
    if (waypoints.length < 2) {
      toast.error('Need at least 2 waypoints to save a route');
      return;
    }
    
    setShowSaveModal(true);
  };

  // Enhanced save route with metadata
  const handleSaveRouteWithData = async (data: SaveRouteData) => {
    if (!user) {
      console.error('❌ No user found when trying to save route');
      toast.error('Please sign in to save routes');
      return;
    }
    
    console.log('🗺️ handleSaveRouteWithData called with:', {
      waypointCount: waypoints.length,
      hasRoute: !!currentRoute,
      userId: user.id,
      routeProfile,
      data
    });

    try {
      console.log('💾 Calling savePlannedRoute...');
      const savedTrack = await savePlannedRoute(
        waypoints,
        currentRoute,
        user.id,
        routeProfile,
        data
      );
      
      console.log('📋 savePlannedRoute returned:', savedTrack);
      
      if (savedTrack) {
        console.log('✅ Route saved successfully, cleaning up...');
        clearWaypoints();
        setIsAddingWaypoints(false);
        toast.success(`Route "${data.name}" saved successfully!`);
        
        // Refresh trips list to show the new saved route
        if (onTripsRefresh) {
          console.log('🔄 Refreshing trips list...');
          try {
            await onTripsRefresh();
            console.log('✅ Trips list refreshed');
          } catch (refreshError) {
            console.error('⚠️ Error refreshing trips list:', refreshError);
            // Don't fail the whole operation for this
          }
        }
        
        // Also refresh our local tracks list
        await loadUserTracks();
        
        // Close the save modal
        setShowSaveModal(false);
        console.log('🏁 Save process completed successfully');
      } else {
        console.error('❌ savePlannedRoute returned null/undefined');
        toast.error('Failed to save route - no data returned');
      }
    } catch (error) {
      console.error('❌ Save route error in handleSaveRouteWithData:', error);
      
      // More detailed error messages
      if (error instanceof Error) {
        toast.error(`Failed to save route: ${error.message}`);
      } else {
        toast.error('Failed to save route - unknown error');
      }
      
      // Re-throw error so modal can handle it too
      throw error;
    }
  };

  // Share route handler
  const handleShareRoute = () => {
    if (!user) {
      toast.error('Please sign in to share routes');
      return;
    }
    
    if (waypoints.length < 2) {
      toast.error('Need at least 2 waypoints to share a route');
      return;
    }
    
    // For now, just copy route info to clipboard
    const routeInfo = `Route with ${waypoints.length} waypoints${currentRoute ? `, ${formatDistance(currentRoute.distance)} long` : ''}`;
    navigator.clipboard.writeText(routeInfo);
    toast.success('Route details copied to clipboard!');
  };

  // Debug: Run routing diagnostics
  const handleRunDiagnostics = async () => {
    toast.info('Running Mapbox routing diagnostics...');
    
    const diagnosticWaypoints = waypoints.map(wp => ({
      lng: wp.coords[0],
      lat: wp.coords[1]
    }));
    
    console.log('🔧 Manual diagnostics triggered with waypoints:', diagnosticWaypoints);
    await runCompleteDiagnostics(diagnosticWaypoints);
  };

  // Debounced search for autocomplete
  const debouncedSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchPlaces(query, {
        limit: 5,
        country: userCountry || undefined, // Filter by user's country
        proximity: location ? [location.longitude, location.latitude] : undefined,
        types: ['place', 'locality', 'address', 'poi']
      });

      if (results && results.length > 0) {
        setSearchResults(results);
        setShowSuggestions(true);
      } else {
        setSearchResults([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  }, [userCountry, location]);

  // Handle search input change with debouncing
  const handleSearchInputChange = useCallback((query: string) => {
    setSearchQuery(query);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    if (query.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        debouncedSearch(query);
      }, 300); // 300ms delay
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
    }
  }, [debouncedSearch]);

  // Add search result markers to map
  const showSearchResultsOnMap = useCallback((results: any[]) => {
    if (!mapRef.current) return;

    // Clear existing search markers
    searchMarkersRef.current.forEach(marker => marker.remove());
    searchMarkersRef.current = [];
    
    // Add search result markers
    results.forEach((result, index) => {
      if (index < 5) { // Show max 5 results
        const el = document.createElement('div');
        el.className = 'search-result-marker';
        el.style.width = '25px';
        el.style.height = '25px';
        el.style.backgroundColor = '#007cbf';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.color = 'white';
        el.style.fontSize = '12px';
        el.style.fontWeight = 'bold';
        el.textContent = (index + 1).toString();
        
        const marker = new mapboxgl.Marker(el)
          .setLngLat([result.center[0], result.center[1]])
          .addTo(mapRef.current!);
        
        // Add click handler to convert search result to waypoint
        el.onclick = () => handleSearchResultClick(result);
        
        searchMarkersRef.current.push(marker);
      }
    });
    
    // Fit map to show all results
    if (results.length === 1) {
      mapRef.current.flyTo({
        center: [results[0].center[0], results[0].center[1]],
        zoom: 12,
        essential: true
      });
    } else if (results.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      results.slice(0, 5).forEach(result => {
        bounds.extend([result.center[0], result.center[1]]);
      });
      mapRef.current.fitBounds(bounds, { padding: 50 });
    }
  }, []);

  // Handle clicking on search result (from dropdown or map pin)
  const handleSearchResultClick = (result: any) => {
    if (!mapRef.current) return;
    
    // Clear search results and markers
    clearSearchResults();
    
    // Add waypoint using waypoint manager
    addWaypointAtLocation({
      lng: result.center[0],
      lat: result.center[1]
    });
    
    toast.success(`Added "${result.place_name}" as waypoint`);
  };

  // Handle selecting search result from dropdown
  const handleSearchSuggestionSelect = (result: any) => {
    // Just fill in the search box and show the result
    setSearchQuery(result.place_name);
    setShowSuggestions(false);
    
    // Add single marker without excessive map movements
    if (!mapRef.current) return;
    
    // Clear existing search markers
    searchMarkersRef.current.forEach(marker => marker.remove());
    searchMarkersRef.current = [];
    
    // Add single result marker
    const el = document.createElement('div');
    el.className = 'search-result-marker';
    el.style.width = '25px';
    el.style.height = '25px';
    el.style.backgroundColor = '#007cbf';
    el.style.borderRadius = '50%';
    el.style.border = '2px solid white';
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    el.style.cursor = 'pointer';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.color = 'white';
    el.style.fontSize = '12px';
    el.style.fontWeight = 'bold';
    el.textContent = '1';
    
    const marker = new mapboxgl.Marker(el)
      .setLngLat([result.center[0], result.center[1]])
      .addTo(mapRef.current);
    
    // Add click handler to convert search result to waypoint
    el.onclick = () => handleSearchResultClick(result);
    
    searchMarkersRef.current.push(marker);
    
    // Gentle fly to location without aggressive zooming
    mapRef.current.flyTo({
      center: [result.center[0], result.center[1]],
      zoom: Math.max(mapRef.current.getZoom(), 10), // Don't zoom out, only in if needed
      essential: true
    });
  };

  // Clear search results
  const clearSearchResults = () => {
    searchMarkersRef.current.forEach(marker => marker.remove());
    searchMarkersRef.current = [];
    setSearchResults([]);
    setSearchQuery('');
    setShowSuggestions(false);
    
    // Clear any pending search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  };

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      // Clear timeouts
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      // Clean up search markers
      searchMarkersRef.current.forEach(marker => marker.remove());
      searchMarkersRef.current = [];
    };
  }, []);

  // Use the map markers hook
  const { updateMapMarkers, flyToTrip } = useMapMarkers(
    mapRef.current,
    trips,
    activeTrip,
    handleTripClick,
    mapLoaded
  );

  // Effect for logging render info
  useEffect(() => {
    console.log('FullScreenTripMapWithWaypoints rendering with:', { 
      tripCount: trips.length, 
      isLoading, 
      mapLoaded,
      userLocation: location,
      waypointCount: waypoints.length
    });
  }, [trips, isLoading, mapLoaded, location, waypoints]);

  return (
    <ErrorBoundary 
      fallback={
        <div className="h-full w-full flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Trip Map Error</h2>
            <p className="text-gray-600 mb-4">Unable to load the trip planning map. Please try refreshing the page.</p>
            <Button onClick={() => window.location.reload()}>Refresh Map</Button>
          </div>
        </div>
      }
    >
      <div className="h-full w-full relative">
        {/* Map View */}
        <div className="absolute inset-0">
          <MapComponent 
            height="100%" 
            width="100%"
            onMapLoad={handleMapLoad}
            userLocation={location}
            // Don't pass center prop to allow smart country-level initial view
            // Exact location centering is handled in handleMapLoad with smooth transition
            style={MAP_STYLES.OUTDOORS} // Keep initial style constant, use setStyle to change
            hideControls={true}
            shouldAutoCenter={shouldAutoCenter}
          />
        </div>

      {/* Search Bar */}
      <div className="absolute top-16 left-4 right-4 z-50">
        <div className="max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search for places to add as waypoints..."
              value={searchQuery}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => {
                // Delay hiding suggestions to allow clicking on them
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              className="pl-10 pr-10 bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg"
              disabled={isSearching}
            />
            {searchQuery && (
              <button
                onClick={clearSearchResults}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
          
          {/* Search Results List */}
          {showSuggestions && searchResults.length > 0 && (
            <div className="mt-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
              {searchResults.slice(0, 5).map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleSearchSuggestionSelect(result)}
                  onMouseDown={(e) => e.preventDefault()} // Prevent onBlur from firing before onClick
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center space-x-3"
                >
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {result.text}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {result.place_name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Control Panel */}
      <div className="absolute top-36 left-4 z-50">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 space-y-4 w-64 overflow-hidden">
          {/* Map Options Dropdown */}
          <div className="flex justify-center">
            <MapOptionsDropdown 
              map={mapRef}
              currentMapStyle={currentMapStyle}
              onStyleChange={handleStyleChange}
            />
          </div>

          {/* Waypoint Controls */}
          <div className="border-t pt-3">
            <div className="text-sm font-medium mb-2 flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Route Planning
            </div>
            
            {/* Route Profile Selection */}
            {waypoints.length > 0 && (
              <div className="grid grid-cols-3 gap-1 mb-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={routeProfile === 'driving' ? "default" : "outline"}
                      className="text-xs px-2"
                      onClick={() => setRouteProfile('driving')}
                    >
                      <Car className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Driving route</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={routeProfile === 'walking' ? "default" : "outline"}
                      className="text-xs px-2"
                      onClick={() => setRouteProfile('walking')}
                    >
                      <Footprints className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Walking route</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={routeProfile === 'cycling' ? "default" : "outline"}
                      className="text-xs px-2"
                      onClick={() => setRouteProfile('cycling')}
                    >
                      <Bike className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Cycling route</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1">
                <Button
                  size="sm"
                  variant={isAddingWaypoints ? "default" : "outline"}
                  className="text-xs"
                  onClick={toggleWaypointMode}
                  disabled={isAddingPOI}
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  {isAddingWaypoints ? 'Stop' : 'Waypoints'}
                </Button>
                <Button
                  size="sm"
                  variant={isAddingPOI ? "default" : "outline"}
                  className="text-xs"
                  onClick={togglePOIMode}
                  disabled={isAddingWaypoints}
                >
                  <Navigation className="h-3 w-3 mr-1" />
                  {isAddingPOI ? 'Stop' : 'Add POI'}
                </Button>
              </div>
              
              {waypoints.length > 0 && (
                <>
                  <div className="text-xs text-muted-foreground">
                    {waypoints.length} waypoint{waypoints.length !== 1 ? 's' : ''} added
                  </div>
                  
                  {currentRoute && (
                    <div className="bg-blue-50 rounded p-2 text-xs space-y-1">
                      <div>Distance: {formatDistance(currentRoute.distance)}</div>
                      <div>Duration: {formatDuration(currentRoute.duration)}</div>
                    </div>
                  )}
                  
                  <div className="flex gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                          onClick={clearWaypoints}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Clear
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Clear all waypoints</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    {waypoints.length >= 2 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs"
                            onClick={handleShareRoute}
                            disabled={isLoadingRoute || !user}
                          >
                            <Share2 className="h-3 w-3 mr-1" />
                            Share
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{!user ? "Sign in to share" : "Share this route"}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  
                  {/* Save trip button */}
                  {waypoints.length >= 2 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="default"
                          className="w-full text-xs bg-primary hover:bg-primary/90"
                          onClick={handleSaveRoute}
                          disabled={isLoadingRoute || !user}
                        >
                          <Save className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">Save Trip to List</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{!user ? "Sign in to save trips" : "Save this trip to your list"}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </>
              )}
              
              {/* Center on Location Button */}
              <div className="pt-2 border-t">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={centerOnUserLocation}
                      disabled={!location}
                    >
                      <Crosshair className="h-3 w-3 mr-1" />
                      Center on Me
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Center map on your location</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle View Button */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-sm hover:bg-white border shadow-md"
          onClick={toggleView}
          type="button"
        >
          {showList ? <Map className="h-4 w-4" /> : <List className="h-4 w-4" />}
          <span className="ml-2">{showList ? 'Map' : 'List'}</span>
        </Button>
      </div>

      {/* Enhanced Trip List Sidebar */}
      {showList && (
        <div className="absolute top-16 right-4 bottom-24 z-10">
          <EnhancedTripsSidebar
            userLocation={location}
            tracks={[
              // Add user's saved tracks from database
              ...userTracks.map(track => ({
                id: track.id,
                name: track.name,
                type: 'saved' as const,
                visible: loadedTracks.has(track.id),
                data: track.segments,
                startLocation: track.segments?.points?.[0] ? {
                  lat: track.segments.points[0].lat,
                  lon: track.segments.points[0].lon
                } : undefined,
                difficulty: track.difficulty || 'moderate',
                length: track.distance_km || 0
              })),
              // Also include trips from props (if any)
              ...trips.map(trip => ({
                id: trip.id,
                name: trip.title,
                type: 'saved' as const,
                visible: false,
                startLocation: trip.startLocation ? {
                  lat: parseFloat(trip.startLocation.split(',')[0]),
                  lon: parseFloat(trip.startLocation.split(',')[1])
                } : undefined,
                difficulty: trip.difficulty,
                length: trip.distance
              }))
            ]}
            isLoading={isLoading || isLoadingTracks}
            onTrackToggle={handleTrackToggle}
            onTrackSave={handleTrackSave}
            onTrackDelete={handleDeleteTrack}
            onSearch={(query) => {
              console.log('Search:', query);
              // TODO: Implement search functionality
            }}
          />
        </div>
      )}

      {/* Barry AI Chat Button */}
      <div className="absolute bottom-8 right-16 z-10">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setShowBarryChat(true)}
              size="lg"
              className="rounded-full h-14 w-14 p-0 shadow-lg bg-unimog-500 hover:bg-unimog-600 border-2 border-white"
            >
              <div className="relative w-10 h-10">
                <img
                  src="/barry-avatar.png"
                  alt="Barry"
                  className="w-full h-full rounded-full object-cover"
                />
                <Wrench className="h-4 w-4 absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 text-unimog-500" />
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Chat with Barry - AI Mechanic</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Save Route Modal */}
      <SaveRouteModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        waypoints={waypoints}
        route={currentRoute}
        routeProfile={routeProfile}
        onSave={handleSaveRouteWithData}
      />

      {/* Add POI Modal */}
      <AddPOIModal
        isOpen={showPOIModal}
        onClose={() => setShowPOIModal(false)}
        coordinates={poiCoordinates}
        onSave={handlePOISave}
      />

      {/* Barry AI Chat Modal */}
      <Dialog open={showBarryChat} onOpenChange={setShowBarryChat}>
        <DialogContent className="max-w-4xl max-h-[85vh] p-0 flex flex-col">
          <DialogHeader className="p-6 pb-0 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src="/barry-avatar.png"
                  alt="Barry the AI Mechanic"
                  className="w-12 h-12 rounded-full border-2 border-unimog-500"
                />
                <Wrench className="h-4 w-4 absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 text-unimog-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-unimog-800 dark:text-unimog-200">
                  Barry - AI Mechanic with Manual Access
                </h2>
                <p className="text-sm text-muted-foreground">
                  Ask Barry about maintenance, repairs, or any technical questions about your Unimog
                </p>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto min-h-0">
            <EnhancedBarryChat className="h-full" location={location || undefined} />
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </ErrorBoundary>
  );
};

export default FullScreenTripMapWithWaypoints;