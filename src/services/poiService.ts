import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';

export interface POI {
  id: string;
  name: string;
  description?: string;
  type: POIType;
  coordinates: [number, number]; // [lng, lat]
  created_by: string;
  created_at: string;
  is_verified?: boolean;
  rating?: number;
  images?: string[];
  metadata?: Record<string, any>;
}

export type POIType = 
  | 'camping'
  | 'water'
  | 'fuel'
  | 'mechanic'
  | 'viewpoint'
  | 'hazard'
  | 'river_crossing'
  | 'gate'
  | 'accommodation'
  | 'food'
  | 'track_start'
  | 'track_end'
  | 'emergency'
  | 'other';

export const POI_ICONS: Record<POIType, { icon: string; color: string; label: string }> = {
  camping: { icon: '⛺', color: '#10b981', label: 'Camping' },
  water: { icon: '💧', color: '#3b82f6', label: 'Water Source' },
  fuel: { icon: '⛽', color: '#f59e0b', label: 'Fuel Station' },
  mechanic: { icon: '🔧', color: '#6b7280', label: 'Mechanic/Repair' },
  viewpoint: { icon: '👁️', color: '#8b5cf6', label: 'Viewpoint' },
  hazard: { icon: '⚠️', color: '#ef4444', label: 'Hazard/Warning' },
  river_crossing: { icon: '🌊', color: '#06b6d4', label: 'River Crossing' },
  gate: { icon: '🚪', color: '#a78bfa', label: 'Gate/Barrier' },
  accommodation: { icon: '🏠', color: '#ec4899', label: 'Accommodation' },
  food: { icon: '🍽️', color: '#84cc16', label: 'Food/Restaurant' },
  track_start: { icon: '🏁', color: '#22c55e', label: 'Track Start' },
  track_end: { icon: '🏁', color: '#dc2626', label: 'Track End' },
  emergency: { icon: '🚨', color: '#dc2626', label: 'Emergency' },
  other: { icon: '📍', color: '#64748b', label: 'Other' }
};

/**
 * Save a new POI
 */
export async function savePOI(
  coordinates: [number, number],
  type: POIType,
  name: string,
  description?: string,
  userId?: string
): Promise<POI | null> {
  try {
    // Get current user if not provided
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to add POIs');
        return null;
      }
      userId = user.id;
    }

    const { data, error } = await supabase
      .from('pois')
      .insert({
        name,
        description,
        type,
        location: {
          type: 'Point',
          coordinates: coordinates
        },
        created_by: userId,
        is_verified: false,
        metadata: {
          added_via: 'map_click'
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving POI:', error);
      toast.error('Failed to save point of interest');
      return null;
    }

    toast.success(`POI "${name}" added successfully`);
    return {
      ...data,
      coordinates
    } as POI;
  } catch (error) {
    console.error('Error saving POI:', error);
    toast.error('Failed to save point of interest');
    return null;
  }
}

/**
 * Get all POIs within bounds
 */
export async function getPOIsInBounds(
  bounds: { north: number; south: number; east: number; west: number }
): Promise<POI[]> {
  try {
    // For now, get all POIs and filter client-side
    // In production, you'd want to use PostGIS functions for spatial queries
    const { data, error } = await supabase
      .from('pois')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching POIs:', error);
      return [];
    }

    // Filter POIs within bounds
    const pois = data?.filter(poi => {
      if (!poi.location?.coordinates) return false;
      const [lng, lat] = poi.location.coordinates;
      return lng >= bounds.west && 
             lng <= bounds.east && 
             lat >= bounds.south && 
             lat <= bounds.north;
    }) || [];

    return pois.map(poi => ({
      ...poi,
      coordinates: poi.location.coordinates as [number, number]
    }));
  } catch (error) {
    console.error('Error fetching POIs:', error);
    return [];
  }
}

/**
 * Update POI rating
 */
export async function updatePOIRating(
  poiId: string,
  rating: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('pois')
      .update({ rating })
      .eq('id', poiId);

    if (error) {
      console.error('Error updating POI rating:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating POI rating:', error);
    return false;
  }
}

/**
 * Delete a POI
 */
export async function deletePOI(poiId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('pois')
      .delete()
      .eq('id', poiId);

    if (error) {
      console.error('Error deleting POI:', error);
      toast.error('Failed to delete point of interest');
      return false;
    }

    toast.success('Point of interest deleted');
    return true;
  } catch (error) {
    console.error('Error deleting POI:', error);
    toast.error('Failed to delete point of interest');
    return false;
  }
}

/**
 * Get POIs created by a specific user
 */
export async function getUserPOIs(userId: string): Promise<POI[]> {
  try {
    const { data, error } = await supabase
      .from('pois')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user POIs:', error);
      return [];
    }

    return data?.map(poi => ({
      ...poi,
      coordinates: poi.location?.coordinates as [number, number] || [0, 0]
    })) || [];
  } catch (error) {
    console.error('Error fetching user POIs:', error);
    return [];
  }
}