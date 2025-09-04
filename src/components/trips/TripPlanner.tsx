
import { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Route, Map as MapIcon, Plus, Crosshair } from 'lucide-react';
import MapComponent from '../MapComponent';
import { useAnalytics } from '@/hooks/use-analytics';
import { TripPlannerProps } from './types';
import RouteForm from './RouteForm';
import TerrainForm from './TerrainForm';
import PoiForm from './PoiForm';
import { useProfileData } from '@/hooks/profile/use-profile-data';
import { useWaypointManager } from '@/hooks/use-waypoint-manager';
import mapboxgl from 'mapbox-gl';
import { toast } from 'sonner';
import { formatDistance, formatDuration } from '@/services/mapboxDirections';

const TripPlanner = ({ onClose }: TripPlannerProps) => {
  const [activeTab, setActiveTab] = useState('route');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [startLocation, setStartLocation] = useState<string>('');
  const [endLocation, setEndLocation] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'easy' | 'moderate' | 'hard' | 'expert'>('moderate');
  const [selectedTerrainTypes, setSelectedTerrainTypes] = useState<string[]>([]);
  const [selectedPois, setSelectedPois] = useState<string[]>([]);
  
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  
  const { trackFeatureUse } = useAnalytics();
  const { userData, isLoading: isProfileLoading } = useProfileData();
  
  // Use the working waypoint manager
  const waypointManager = useWaypointManager({
    map: mapInstance,
    onRouteUpdate: (waypoints) => {
      console.log('Route updated with waypoints:', waypoints.length);
      if (waypoints.length >= 2) {
        toast.success('Route calculated successfully!');
      }
    }
  });
  
  const {
    waypoints,
    currentRoute,
    routeProfile,
    isLoadingRoute,
    isAddingMode,
    setIsAddingMode,
    setRouteProfile,
    addWaypointAtLocation,
    clearWaypoints
  } = waypointManager;
  
  // Memoize user coordinates to prevent unnecessary re-renders
  const userCoordinates = useMemo(() => {
    if (userData?.coordinates) {
      console.log('Computing user coordinates from profile:', userData.coordinates);
      return [
        userData.coordinates.longitude,
        userData.coordinates.latitude
      ] as [number, number];
    }
    return undefined;
  }, [userData?.coordinates?.latitude, userData?.coordinates?.longitude]);
  
  // Handle map initialization
  const handleMapLoad = (map: mapboxgl.Map) => {
    mapRef.current = map;
    setMapInstance(map);
    setMapLoaded(true);
    console.log('Trip planner map loaded');
  };

  const handlePlanTrip = async () => {
    if (waypoints.length >= 2) {
      // Route is already calculated by waypoint manager
      const routeInfo = currentRoute ? {
        distance: formatDistance(currentRoute.distance),
        duration: formatDuration(currentRoute.duration)
      } : {};
      
      trackFeatureUse('trip_planning', {
        waypoints: waypoints.length,
        difficulty,
        terrains: selectedTerrainTypes.join(','),
        ...routeInfo
      });
      
      toast.success(`Route planned: ${waypoints.length} waypoints`);
    } else {
      toast.error('Please add at least 2 waypoints to plan a route');
    }
  };
  
  const handleAddWaypoint = () => {
    setIsAddingMode(!isAddingMode);
    toast.info(isAddingMode ? 'Waypoint mode disabled' : 'Click on map to add waypoints');
  };
  
  const handleClearRoute = () => {
    clearWaypoints();
    setStartLocation('');
    setEndLocation('');
    toast.success('Route cleared');
  };

  const handleTerrainChange = (terrain: string) => {
    if (selectedTerrainTypes.includes(terrain)) {
      setSelectedTerrainTypes(selectedTerrainTypes.filter((t) => t !== terrain));
    } else {
      setSelectedTerrainTypes([...selectedTerrainTypes, terrain]);
    }
  };

  const handlePoiChange = (poi: string) => {
    if (selectedPois.includes(poi)) {
      setSelectedPois(selectedPois.filter((p) => p !== poi));
    } else {
      setSelectedPois([...selectedPois, poi]);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <MapIcon className="mr-2 h-5 w-5" />
          Unimog Route Planner
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="route" onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="route">Route</TabsTrigger>
            <TabsTrigger value="terrain">Terrain</TabsTrigger>
            <TabsTrigger value="poi">Points of Interest</TabsTrigger>
          </TabsList>
          
          <TabsContent value="route" className="space-y-4">
            <RouteForm
              startLocation={startLocation}
              setStartLocation={setStartLocation}
              endLocation={endLocation}
              setEndLocation={setEndLocation}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
            />
          </TabsContent>
          
          <TabsContent value="terrain" className="space-y-4">
            <TerrainForm 
              selectedTerrainTypes={selectedTerrainTypes}
              handleTerrainChange={handleTerrainChange}
            />
          </TabsContent>
          
          <TabsContent value="poi" className="space-y-4">
            <PoiForm
              selectedPois={selectedPois}
              handlePoiChange={handlePoiChange}
            />
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          <div className="relative">
            <div className="h-96 w-full">
              <MapComponent
                onMapLoad={handleMapLoad}
                center={userCoordinates}
                height="100%"
                width="100%"
                userLocation={userData?.coordinates ? {
                  latitude: userData.coordinates.latitude,
                  longitude: userData.coordinates.longitude
                } : undefined}
              />
            </div>
            
            {/* Map controls */}
            {mapLoaded && (
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Button
                  size="sm"
                  variant={isAddingMode ? "default" : "outline"}
                  onClick={handleAddWaypoint}
                  className="shadow-lg"
                >
                  {isAddingMode ? <Crosshair className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {isAddingMode ? 'Adding...' : 'Add Waypoint'}
                </Button>
                
                {waypoints.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClearRoute}
                    className="shadow-lg"
                  >
                    Clear Route
                  </Button>
                )}
              </div>
            )}
            
            {/* Route info */}
            {currentRoute && (
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg">
                <div className="text-sm font-medium">
                  {formatDistance(currentRoute.distance)} • {formatDuration(currentRoute.duration)}
                </div>
                <div className="text-xs text-gray-600">
                  {waypoints.length} waypoints • {routeProfile} route
                </div>
              </div>
            )}
            
            {/* Loading indicator */}
            {isLoadingRoute && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-lg">
                <div className="bg-white p-3 rounded-lg shadow-lg">
                  <div className="text-sm font-medium">Calculating route...</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handlePlanTrip} 
            disabled={isLoadingRoute || waypoints.length < 2}
          >
            <Route className="mr-2 h-4 w-4" />
            {isLoadingRoute ? 'Calculating...' : `Plan Route ${waypoints.length > 0 ? `(${waypoints.length} pts)` : ''}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TripPlanner;
