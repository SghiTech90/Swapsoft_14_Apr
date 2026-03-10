/**
 * Cloudinary Upload Utility
 * Uploads images directly to Cloudinary from React Native app
 * 
 * SECURITY NOTE: API Secret is NOT stored here for security reasons.
 * For unsigned uploads, only Cloud Name is needed.
 */

const CLOUDINARY_CLOUD_NAME = 'dw05behxm';
const CLOUDINARY_API_KEY = '598213674498756';
const CLOUDINARY_UPLOAD_PRESET = 'smartbudget_upload';

/**
 * Upload a base64 image to Cloudinary using unsigned upload
 * @param {string} base64Image - Base64 encoded image string (without data URI prefix)
 * @param {string} contentType - Content type (default: 'image/jpeg')
 * @returns {Promise<string>} - Cloudinary URL of the uploaded image
 */
export const uploadToCloudinary = async (base64Image, contentType = 'image/jpeg') => {
  try {
    console.log('📤 Starting Cloudinary upload...');
    console.log('📏 Base64 length:', base64Image?.length || 0);
    
    // Create the data URI
    const dataUri = `data:${contentType};base64,${base64Image}`;
    
    // Generate a unique public_id without slashes to avoid "Display name cannot contain slashes" error
    const publicId = `smartbudget_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Use FormData which works better with React Native
    const formData = new FormData();
    formData.append('file', dataUri);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('public_id', publicId); // This prevents the slash error
    formData.append('folder', 'smartbudget'); // Organize uploads in a folder
    
    console.log('📤 Sending to Cloudinary with public_id:', publicId);
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    const result = await response.json();
    console.log('📥 Cloudinary response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ Cloudinary upload failed:', result);
      throw new Error(result.error?.message || 'Cloudinary upload failed');
    }
    
    console.log('✅ Cloudinary upload successful:', result.secure_url);
    return result.secure_url;
    
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error.message);
    throw error;
  }
};

export default {
  uploadToCloudinary,
  CLOUDINARY_CLOUD_NAME,
};
