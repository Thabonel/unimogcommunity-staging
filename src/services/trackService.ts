import { supabase } from '@/lib/supabase-client';
import { ParsedTrack } from '@/utils/gpxParser';
import { toast } from 'sonner';
import { Waypoint } from '@/types/waypoint';
import { DirectionsRoute } from './mapboxDirections';
import { generateUniqueRouteName, generateRouteDescription } from '@/utils/routeNameGenerator';

/**
 * Save an uploaded track to Supabase
 */
export async function saveTrack(parsedTrack: ParsedTrack, userId: string) {
  try {
    // Convert track points to segments format for storage
    const segments = {
      points: parsedTrack.points,
      bounds: parsedTrack.bounds
    };

    const { data, error } = await supabase
      .from('tracks')
      .insert({
        name: parsedTrack.name,
        segments: segments,
        distance_km: parsedTrack.totalDistance,
        source_type: 'gpx_upload',
        created_by: userId,
        is_public: false,
        visible: true,
        description: `Uploaded track: ${parsedTrack.name}`,
        difficulty: 'moderate' // Default, can be updated later
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving track:', error);
      toast.error('Failed to save track');
      return null;
    }

    toast.success('Track saved successfully');
    return data;
  } catch (error) {
    console.error('Error saving track:', error);
    toast.error('Failed to save track');
    return null;
  }
}

/**
 * Fetch user's tracks from Supabase
 */
export async function fetchUserTracks(userId: string) {
  try {
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tracks:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching tracks:', error);
    return [];
  }
}

/**
 * Fetch nearby public tracks
 */
export async function fetchNearbyTracks(lat: number, lon: number, radiusKm: number = 50) {
  try {
    // For now, fetch all public tracks
    // In production, you'd want to use PostGIS for proper geographic queries
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('is_public', true)
      .limit(20);

    if (error) {
      console.error('Error fetching nearby tracks:', error);
      return [];
    }

    // Filter by distance in the frontend for now
    // In production, use PostGIS ST_DWithin or similar
    return data || [];
  } catch (error) {
    console.error('Error fetching nearby tracks:', error);
    return [];
  }
}

/**
 * Delete a track
 */
export async function deleteTrack(trackId: string, userId: string) {
  try {
    const { error } = await supabase
      .from('tracks')
      .delete()
      .eq('id', trackId)
      .eq('created_by', userId); // Ensure user owns the track

    if (error) {
      console.error('Error deleting track:', error);
      toast.error('Failed to delete track');
      return false;
    }

    toast.success('Track deleted');
    return true;
  } catch (error) {
    console.error('Error deleting track:', error);
    toast.error('Failed to delete track');
    return false;
  }
}

/**
 * Update track visibility
 */
export async function updateTrackVisibility(trackId: string, visible: boolean, userId: string) {
  try {
    const { error } = await supabase
      .from('tracks')
      .update({ visible })
      .eq('id', trackId)
      .eq('created_by', userId);

    if (error) {
      console.error('Error updating track visibility:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating track visibility:', error);
    return false;
  }
}

/**
 * Save a planned route from waypoints
 */
export async function savePlannedRoute(
  waypoints: Waypoint[],
  route: DirectionsRoute | null,
  userId: string,
  routeProfile: 'driving' | 'walking' | 'cycling' = 'driving',
  additionalData?: {
    name?: string;
    description?: string;
    difficulty?: string;
    isPublic?: boolean;
    imageUrl?: string;
    notes?: string;
  }
) {
  console.log('🚀 savePlannedRoute called with:', {
    waypointsCount: waypoints.length,
    routeExists: !!route,
    userId,
    routeProfile,
    additionalData
  });

  try {
    if (waypoints.length < 2) {
      console.error('❌ Insufficient waypoints:', waypoints.length);
      toast.error('Need at least 2 waypoints to save a route');
      return null;
    }

    console.log('✅ Waypoint validation passed');

    // Use provided name/description or generate defaults
    const routeName = additionalData?.name || generateUniqueRouteName(
      waypoints,
      route?.distance,
      routeProfile
    );
    
    const routeDescription = additionalData?.description || generateRouteDescription(
      waypoints,
      route?.distance,
      route?.duration,
      routeProfile
    );

    console.log('📝 Generated route details:', {
      routeName,
      routeDescription: routeDescription.substring(0, 100) + '...',
      difficulty: additionalData?.difficulty || 'moderate',
      isPublic: additionalData?.isPublic ?? false
    });

    // Convert waypoints and route to track format
    const points = route?.geometry?.coordinates 
      ? route.geometry.coordinates.map((coord: [number, number], index: number) => ({
          lat: coord[1],
          lon: coord[0],
          ele: 0, // Elevation not available from Directions API
          time: new Date().toISOString()
        }))
      : waypoints.map(wp => ({
          lat: wp.coords[1],
          lon: wp.coords[0],
          ele: 0,
          time: new Date().toISOString()
        }));

    // Calculate bounds
    const lats = points.map(p => p.lat);
    const lons = points.map(p => p.lon);
    const bounds = {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLon: Math.min(...lons),
      maxLon: Math.max(...lons)
    };

    // Create segments object
    const segments = {
      points,
      bounds,
      waypoints: waypoints.map(wp => ({
        name: wp.name,
        coords: wp.coords,
        type: wp.type
      }))
    };

    // Save to database
    console.log('💾 Attempting to save to database...');
    
    const insertData = {
      name: routeName,
      segments: segments,
      distance_km: route ? route.distance / 1000 : 0,
      source_type: 'route_planner',
      created_by: userId,
      is_public: additionalData?.isPublic ?? false,
      visible: true,
      description: routeDescription,
      difficulty: additionalData?.difficulty || 'moderate',
      metadata: {
        profile: routeProfile,
        duration_seconds: route?.duration,
        waypoint_count: waypoints.length,
        created_with: 'route_planner',
        image_url: additionalData?.imageUrl,
        notes: additionalData?.notes
      }
    };
    
    console.log('📊 Insert data prepared:', {
      ...insertData,
      segments: `${segments.points.length} points, ${Object.keys(segments).length} keys`
    });

    const { data, error } = await supabase
      .from('tracks')
      .insert(insertData)
      .select()
      .single();

    console.log('🔍 Database response:', { data: !!data, error: !!error });

    if (error) {
      console.error('❌ Database error saving route:', {
        error,
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message
      });
      toast.error(`Failed to save route: ${error.message}`);
      return null;
    }

    if (!data) {
      console.error('❌ No data returned from insert operation');
      toast.error('Failed to save route: No data returned');
      return null;
    }

    console.log('✅ Route saved successfully:', {
      id: data.id,
      name: data.name,
      created_at: data.created_at
    });
    toast.success(`Route saved: ${routeName}`);
    return data;
  } catch (error) {
    console.error('❌ Exception saving route:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    if (error instanceof Error) {
      toast.error(`Failed to save route: ${error.message}`);
    } else {
      toast.error('Failed to save route: Unknown error occurred');
    }
    return null;
  }
}

/**
 * Convert a track to a trip
 */
export async function convertTrackToTrip(trackId: string, userId: string) {
  try {
    // First get the track
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('*')
      .eq('id', trackId)
      .eq('created_by', userId)
      .single();

    if (trackError || !track) {
      toast.error('Track not found');
      return null;
    }

    // Create a trip from the track
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        name: track.name,
        description: track.description || `Trip created from track: ${track.name}`,
        created_by: userId,
        is_public: false
      })
      .select()
      .single();

    if (tripError) {
      console.error('Error creating trip:', tripError);
      toast.error('Failed to create trip');
      return null;
    }

    // Update the track to link it to the trip
    await supabase
      .from('tracks')
      .update({ trip_id: trip.id })
      .eq('id', trackId);

    toast.success('Track saved as trip');
    return trip;
  } catch (error) {
    console.error('Error converting track to trip:', error);
    toast.error('Failed to save as trip');
    return null;
  }
}