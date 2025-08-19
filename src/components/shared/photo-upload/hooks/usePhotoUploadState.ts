
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/toast';
import { useAuth } from '@/contexts/AuthContext';
import { verifyImageExists, uploadFile, getBucketForType, loadPhotoFromLocal } from '../utils/fileUploadUtils';

export interface UsePhotoUploadStateProps {
  initialImageUrl?: string | null;
  onImageUploaded: (url: string) => void;
  type: 'profile' | 'vehicle';
}

export const usePhotoUploadState = ({
  initialImageUrl,
  onImageUploaded,
  type
}: UsePhotoUploadStateProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Get the bucket ID based on the type
  const bucketId = getBucketForType(type);
  
  // Skip bucket creation - buckets already exist in Supabase
  useEffect(() => {
    console.log(`PhotoUploadState initialized for ${type}`);
    
    // Immediately mark storage as ready since buckets exist and RLS policies are applied
    // No need to verify or create buckets
    setStorageReady(true);
  }, [type]);
  
  // Verify remote images or fallback to local storage
  useEffect(() => {
    const loadPhotoFromStorage = async () => {
      if (!storageReady) return;
      
      // If we have an initial URL, verify it exists first
      if (initialImageUrl) {
        try {
          const fileExists = await verifyImageExists(initialImageUrl);
          
          if (!fileExists) {
            console.log('Remote file not found, checking local storage...');
            // If remote file doesn't exist, check local storage as fallback
            if (user && (type === 'profile' || type === 'vehicle')) {
              const localPhoto = loadPhotoFromLocal(type, user.id);
              if (localPhoto) {
                console.log(`Using locally stored ${type} photo as fallback`);
                setImageUrl(localPhoto);
                onImageUploaded(localPhoto);
                return;
              }
            }
            setImageUrl(null);
            onImageUploaded('');
          } else {
            setImageUrl(initialImageUrl);
          }
        } catch (error) {
          console.error("Error checking if image exists:", error);
          // If verification fails but we have a URL, keep it
          setImageUrl(initialImageUrl);
        }
      } else {
        // No initial URL, check local storage as fallback
        if (user && (type === 'profile' || type === 'vehicle')) {
          const localPhoto = loadPhotoFromLocal(type, user.id);
          if (localPhoto) {
            console.log(`Using locally stored ${type} photo`);
            setImageUrl(localPhoto);
            onImageUploaded(localPhoto);
          }
        }
      }
    };
    
    if (storageReady) {
      loadPhotoFromStorage();
    }
  }, [initialImageUrl, onImageUploaded, storageReady, user, type]);
  
  const handleFileUpload = async (file: File) => {
    if (!storageReady) {
      toast({
        title: "Storage not ready",
        description: "Please wait for storage initialization or try again later.",
        variant: "destructive",
      });
      return;
    }
    
    // Create a preview URL immediately for better UX
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      setIsUploading(true);
      console.log(`Starting file upload for ${type}`);
      
      // Upload the file
      const publicUrl = await uploadFile(file, type, toast);
      
      if (publicUrl) {
        // Update state and trigger the callback
        setImageUrl(publicUrl);
        onImageUploaded(publicUrl);
        console.log(`File uploaded successfully:`, publicUrl);
      }
      
      // Clean up the preview URL
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Error in handleFileUpload:', error);
      
      toast({
        title: "Upload failed",
        description: "An unexpected error occurred during upload.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    // Clean up preview URL if it exists
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    // Clear local storage for this photo type
    if (user && (type === 'profile' || type === 'vehicle')) {
      const storageKey = `photo_${type}_${user.id}`;
      try {
        localStorage.removeItem(storageKey);
        console.log(`🗑️ Removed ${type} photo from local storage`);
      } catch (error) {
        console.error('Error removing photo from local storage:', error);
      }
    }
    
    setImageUrl(null);
    setPreviewUrl(null);
    onImageUploaded('');
  };

  return {
    imageUrl,
    previewUrl,
    isUploading,
    type,
    bucketId,
    storageReady,
    handleFileUpload,
    handleRemovePhoto
  };
};
