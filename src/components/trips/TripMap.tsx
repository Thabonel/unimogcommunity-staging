
import 'mapbox-gl/dist/mapbox-gl.css';
import { useUserLocation } from '@/hooks/use-user-location';
import { useMemo, useCallback, memo, useEffect } from 'react';
import MapInitializer from './map/MapInitializer';
import { ErrorBoundary } from 'react-error-boundary';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface TripMapProps {
  startLocation?: string;
  endLocation?: string;
  waypoints?: string[];
  onMapClick?: () => void;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
}

const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) => {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
        <div>
          <h3 className="text-sm font-medium">Map Error</h3>
          <div className="mt-2 text-sm">
            <p>There was a problem loading the map component.</p>
            <p className="mt-1 font-mono text-xs text-red-700">
              {error.message}
            </p>
          </div>
          <div className="mt-4">
            <Button size="sm" variant="outline" onClick={resetErrorBoundary}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TripMap = ({ 
  startLocation, 
  endLocation,
  waypoints = [],
  onMapClick,
  userLocation
}: TripMapProps) => {
  const { location, isLoading: isLocationLoading } = useUserLocation();
  
  // Helper function to create a valid tuple
  const createLocationTuple = useCallback((lat: number, lng: number): [number, number] => {
    return [lng, lat];
  }, []);
  
  // Determine initial center with proper typing - only compute this once
  const initialCenter = useMemo(() => {
    if (userLocation) {
      return createLocationTuple(userLocation.latitude, userLocation.longitude);
    } else if (location) {
      return createLocationTuple(location.latitude, location.longitude);
    }
    return undefined;
  }, [userLocation, location, createLocationTuple]);
  
  // Stabilize props with memoization to prevent unnecessary re-renders
  const mapProps = useMemo(() => ({
    startLocation,
    endLocation,
    waypoints,
    onMapClick,
    initialCenter,
    // Set enableTerrain to false to avoid the error with hillshade layers
    enableTerrain: false
  }), [startLocation, endLocation, waypoints, onMapClick, initialCenter]);
  
  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback}
      onReset={() => {
        console.log('Error boundary reset in TripMap');
      }}
    >
      <MapInitializer {...mapProps} />
    </ErrorBoundary>
  );
};

// Memoize to prevent unnecessary re-renders
export default memo(TripMap);
