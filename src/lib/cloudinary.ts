import { v2 as cloudinary } from 'cloudinary';

// Validate required environment variables
const requiredEnvVars = {
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

// Check if all required environment variables are present
const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.warn(`Missing Cloudinary environment variables: ${missingVars.join(', ')}`);
  console.warn('Cloudinary operations will be disabled until all variables are configured.');
}

// Configure Cloudinary only if all required variables are present
if (missingVars.length === 0) {
  cloudinary.config({
    cloud_name: requiredEnvVars.cloud_name!,
    api_key: requiredEnvVars.api_key!,
    api_secret: requiredEnvVars.api_secret!,
  });
}

/**
 * Check if Cloudinary is properly configured
 * @returns boolean - True if Cloudinary is configured, false otherwise
 */
export const isCloudinaryConfigured = (): boolean => {
  return missingVars.length === 0;
};

/**
 * Delete an image from Cloudinary using the public ID
 * @param publicId - The public ID of the image to delete
 * @returns Promise<boolean> - True if deletion was successful, false otherwise
 */
export const deleteImageFromCloudinary = async (publicId: string): Promise<boolean> => {
  try {
    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured()) {
      console.warn('Cloudinary is not configured. Cannot delete image:', publicId);
      return false;
    }

    if (!publicId) {
      console.log('No public ID provided for image deletion');
      return false;
    }

    // Extract public ID from URL if full URL is provided
    let extractedPublicId = publicId;
    if (publicId.includes('res.cloudinary.com')) {
      // Extract public ID from Cloudinary URL
      const urlParts = publicId.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
        // Get everything after 'upload' and before the file extension
        const afterUpload = urlParts.slice(uploadIndex + 2).join('/');
        extractedPublicId = afterUpload.split('.')[0]; // Remove file extension
      }
    }

    console.log(`Attempting to delete image with public ID: ${extractedPublicId}`);
    
    const result = await cloudinary.uploader.destroy(extractedPublicId);
    
    if (result.result === 'ok' || result.result === 'not found') {
      console.log(`Successfully deleted image: ${extractedPublicId}`);
      return true;
    } else {
      console.error(`Failed to delete image: ${extractedPublicId}`, result);
      return false;
    }
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    return false;
  }
};

/**
 * Delete multiple images from Cloudinary
 * @param publicIds - Array of public IDs to delete
 * @returns Promise<boolean> - True if all deletions were successful, false otherwise
 */
export const deleteMultipleImagesFromCloudinary = async (publicIds: string[]): Promise<boolean> => {
  try {
    if (!publicIds || publicIds.length === 0) {
      return true;
    }

    const deletePromises = publicIds.map(publicId => deleteImageFromCloudinary(publicId));
    const results = await Promise.all(deletePromises);
    
    return results.every(result => result === true);
  } catch (error) {
    console.error('Error deleting multiple images from Cloudinary:', error);
    return false;
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param url - The Cloudinary URL
 * @returns string | null - The public ID or null if extraction fails
 */
export const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    if (!url || !url.includes('res.cloudinary.com')) {
      return null;
    }

    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
      const afterUpload = urlParts.slice(uploadIndex + 2).join('/');
      return afterUpload.split('.')[0]; // Remove file extension
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting public ID from URL:', error);
    return null;
  }
};

/**
 * Comprehensive cleanup function for handling image deletion during rollback operations
 * @param imageData - Can be a string (URL or public ID), object with secure_url, or null/undefined
 * @param context - Context for logging (e.g., "teacher creation", "student update")
 * @returns Promise<boolean> - True if cleanup was successful or no image to clean, false if cleanup failed
 */
export const cleanupImageOnFailure = async (
  imageData: string | { secure_url?: string } | null | undefined,
  context: string
): Promise<boolean> => {
  try {
    if (!imageData) {
      console.log(`No image to clean up for ${context}`);
      return true;
    }

    let imageUrl: string | null = null;

    // Handle different image data formats
    if (typeof imageData === 'string') {
      imageUrl = imageData;
    } else if (typeof imageData === 'object' && imageData?.secure_url) {
      imageUrl = imageData.secure_url;
    }

    if (!imageUrl) {
      console.log(`No valid image URL found for ${context}`);
      return true;
    }

    // Only proceed if it's a Cloudinary URL
    if (!imageUrl.includes('res.cloudinary.com')) {
      console.log(`Image is not from Cloudinary for ${context}:`, imageUrl);
      return true;
    }

    const success = await deleteImageFromCloudinary(imageUrl);
    if (success) {
      console.log(`Successfully cleaned up image for ${context}`);
    } else {
      console.error(`Failed to clean up image for ${context}`);
    }
    
    return success;
  } catch (error) {
    console.error(`Error during image cleanup for ${context}:`, error);
    return false;
  }
}; 