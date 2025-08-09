/**
 * Centralized Supabase client configuration
 * This is the single source of truth for Supabase client initialization
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '@/config/env';

// Validate environment variables with helpful error messages
// DO NOT USE HARDCODED FALLBACKS - they cause auth issues
const supabaseUrl = SUPABASE_CONFIG.url;
const supabaseAnonKey = SUPABASE_CONFIG.anonKey;

// ALWAYS debug log to catch initialization issues
if (typeof window !== 'undefined') {
  console.log('🔍 Supabase Client Initialization:', {
    url: supabaseUrl,
    keyLength: supabaseAnonKey?.length || 0,
    keyPrefix: supabaseAnonKey?.substring(0, 50) || 'NOT SET',
    envUrl: import.meta.env.VITE_SUPABASE_URL,
    envKeyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0,
    envVarsPresent: {
      VITE_SUPABASE_URL: !!import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      NODE_ENV: import.meta.env.NODE_ENV || 'undefined',
      MODE: import.meta.env.MODE || 'undefined'
    },
    timestamp: new Date().toISOString()
  });
}

if (!supabaseUrl || supabaseUrl === '') {
  console.error('🚨 SUPABASE CONFIGURATION ERROR');
  console.error('');
  console.error('Environment variable VITE_SUPABASE_URL is not set.');
  console.error('');
  console.error('For DEVELOPMENT:');
  console.error('1. Check your .env file');
  console.error('2. Add: VITE_SUPABASE_URL=your_supabase_url');
  console.error('3. Add: VITE_SUPABASE_ANON_KEY=your_anon_key');
  console.error('4. Restart the development server');
  console.error('');
  console.error('For NETLIFY DEPLOYMENT:');
  console.error('1. Go to Netlify Dashboard → Site Settings → Environment Variables');
  console.error('2. Add: VITE_SUPABASE_URL = https://ydevatqwkoccxhtejdor.supabase.co');
  console.error('3. Add: VITE_SUPABASE_ANON_KEY = your_anon_key');
  console.error('4. Redeploy the site');
  console.error('');
  
  throw new Error('❌ SUPABASE_URL environment variable is required. Check console for setup instructions.');
}

if (!supabaseAnonKey || supabaseAnonKey === '') {
  console.error('🚨 SUPABASE CONFIGURATION ERROR');
  console.error('Environment variable VITE_SUPABASE_ANON_KEY is not set.');
  console.error('');
  console.error('For NETLIFY DEPLOYMENT:');
  console.error('1. Go to Netlify Dashboard → Site Settings → Environment Variables');
  console.error('2. Add: VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  console.error('3. Get the key from: Supabase Dashboard → Settings → API → anon public');
  console.error('4. Redeploy the site');
  console.error('');
  
  throw new Error('❌ SUPABASE_ANON_KEY environment variable is required. Check console for setup instructions.');
}

// Create the Supabase client with consistent configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Clear corrupted sessions on initialization (client-side only)
if (typeof window !== 'undefined') {
  // Clear any potentially corrupted session on app start
  const clearCorruptedSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.expires_at && session.expires_at < Date.now() / 1000) {
        console.log('Clearing expired session...');
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.log('Clearing potentially corrupted session...');
      await supabase.auth.signOut();
    }
  };
  
  clearCorruptedSession();
}

// Convenience export as default
export default supabase;

// Storage bucket configuration - matches actual Supabase bucket names
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  PROFILE_PHOTOS: 'Profile Photos', // Changed to match actual bucket name with capital letters and space
  VEHICLE_PHOTOS: 'vehicle_photos',
  MANUALS: 'manuals',
  ARTICLE_FILES: 'article_files',
  SITE_ASSETS: 'site_assets',
} as const;

// Export the type of bucket names for TypeScript
export type BucketName = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];

// Helper function to check if a bucket exists
export const checkBucketExists = async (bucketName: BucketName): Promise<boolean> => {
  try {
    const { data, error } = await supabase.storage.getBucket(bucketName);
    return !error && !!data;
  } catch (error) {
    console.error(`Error checking if bucket ${bucketName} exists:`, error);
    return false;
  }
};

// Helper function to create a bucket if it doesn't exist
export const createBucketIfNotExists = async (bucketName: BucketName, isPublic = true): Promise<boolean> => {
  try {
    // First check if bucket exists
    const bucketExists = await checkBucketExists(bucketName);
    
    if (!bucketExists) {
      console.log(`Creating bucket: ${bucketName}`);
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: isPublic,
        fileSizeLimit: 52428800 // 50MB
      });
      
      if (error) {
        throw error;
      }
      
      console.log(`Successfully created bucket: ${bucketName}`);
      return true;
    } else {
      console.log(`Bucket already exists: ${bucketName}`);
      return true;
    }
  } catch (error: any) {
    console.error(`Failed to create/check bucket ${bucketName}:`, error);
    return false;
  }
};

// Helper function to ensure all storage buckets exist
export const ensureStorageBuckets = async () => {
  try {
    console.log('Ensuring storage buckets exist...');
    
    // Define all required buckets with their settings
    const requiredBuckets = [
      { name: STORAGE_BUCKETS.AVATARS, isPublic: true },
      { name: STORAGE_BUCKETS.PROFILE_PHOTOS, isPublic: true },
      { name: STORAGE_BUCKETS.VEHICLE_PHOTOS, isPublic: true },
      { name: STORAGE_BUCKETS.MANUALS, isPublic: false },
      { name: STORAGE_BUCKETS.ARTICLE_FILES, isPublic: true },
      { name: STORAGE_BUCKETS.SITE_ASSETS, isPublic: true },
    ];
    
    // Create buckets in parallel for better performance
    const results = await Promise.allSettled(
      requiredBuckets.map(bucket => 
        createBucketIfNotExists(bucket.name, bucket.isPublic)
      )
    );
    
    // Check for any failures
    const failedBuckets = results
      .map((result, index) => 
        result.status === 'rejected' ? requiredBuckets[index].name : null
      )
      .filter(Boolean);
    
    if (failedBuckets.length > 0) {
      console.error(`Failed to create buckets: ${failedBuckets.join(', ')}`);
      return { 
        success: false, 
        error: 'Failed to create some required buckets', 
        details: failedBuckets 
      };
    }
    
    console.log('Storage buckets verification completed successfully.');
    return { success: true };
  } catch (error: any) {
    console.error('Error checking storage buckets:', error);
    return { success: false, error: error.message };
  }
};

// Verify that a specific bucket exists
export const verifyBucket = async (bucketName: BucketName): Promise<boolean> => {
  return await createBucketIfNotExists(bucketName);
};

// Helper to check if a file exists in a bucket
export const verifyFileExists = async (bucket: BucketName, filePath: string): Promise<boolean> => {
  try {
    console.log(`Checking if file exists: ${bucket}/${filePath}`);
    
    // First ensure the bucket exists
    const bucketExists = await verifyBucket(bucket);
    if (!bucketExists) {
      console.error(`Bucket ${bucket} does not exist, cannot check file`);
      return false;
    }
    
    // Extract the path without the user ID prefix for checking
    const pathParts = filePath.split('/');
    const searchPath = pathParts.length > 1 ? pathParts.slice(1).join('/') : filePath;
    
    // Try to get the file metadata
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(pathParts[0] || '', {
        search: searchPath
      });
    
    if (error) {
      console.error(`Error checking if file exists in ${bucket}:`, error);
      return false;
    }
    
    // If we got an array of files, check if our file is in there
    const fileName = pathParts[pathParts.length - 1];
    const fileExists = Array.isArray(data) && data.some(file => file.name === fileName);
    console.log(`File ${fileName} exists in ${bucket}/${pathParts[0] || ''}: ${fileExists}`);
    return fileExists;
  } catch (error) {
    console.error(`Error verifying file ${filePath} in ${bucket}:`, error);
    return false;
  }
};