// utils/imagekitUpload.js
// Helper utilities for uploading images to ImageKit
// Used by product controller to handle image uploads

import imagekit from '../config/imagekit.js';

/**
 * Upload a single image file to ImageKit
 * @param {Buffer|Object} file - File buffer (from multer memory storage) or file object
 * @param {string} fileName - Desired filename for the uploaded image
 * @param {string} folder - ImageKit folder path (e.g., '/products')
 * @param {Object} options - Additional upload options (tags, etc.)
 * @returns {Promise<Object>} - ImageKit upload response with URL and fileId
 */
export const uploadImageToImageKit = async (file, fileName, folder = '/products', options = {}) => {
  try {
    let fileBuffer;
    let originalFileName = fileName;

    // Handle different file input types
    if (Buffer.isBuffer(file)) {
      // Direct buffer
      fileBuffer = file;
    } else if (file.buffer) {
      // Multer memory storage buffer
      fileBuffer = file.buffer;
      originalFileName = file.originalname || fileName;
    } else if (file.path) {
      // Multer disk storage - read file from path
      const fs = await import('fs');
      fileBuffer = fs.readFileSync(file.path);
      originalFileName = file.originalname || fileName;
    } else {
      throw new Error('Invalid file format. Expected buffer or multer file object.');
    }

    // Prepare upload parameters
    const uploadParams = {
      file: fileBuffer,
      fileName: originalFileName,
      folder: folder,
      ...options // Allow overriding any ImageKit parameters
    };

    // Upload to ImageKit
    const result = await imagekit.upload(uploadParams);

    return {
      success: true,
      url: result.url, // Public URL from ImageKit
      fileId: result.fileId, // ImageKit file ID (needed for deletion)
      filePath: result.filePath, // File path in ImageKit
      name: result.name,
      size: result.size,
      width: result.width,
      height: result.height,
      fileType: result.fileType
    };
  } catch (error) {
    console.error('ImageKit upload error:', error);
    throw new Error(`Failed to upload image to ImageKit: ${error.message}`);
  }
};

/**
 * Upload multiple images to ImageKit
 * @param {Array} files - Array of file buffers or file objects
 * @param {string} baseFileName - Base filename (will be appended with index)
 * @param {string} folder - ImageKit folder path
 * @param {Object} options - Additional upload options
 * @returns {Promise<Array>} - Array of upload results
 */
export const uploadMultipleImagesToImageKit = async (files, baseFileName, folder = '/products', options = {}) => {
  try {
    const uploadPromises = files.map((file, index) => {
      // Generate unique filename for each image
      const ext = file.originalname ? file.originalname.split('.').pop() : 'jpg';
      const fileName = `${baseFileName}-${index + 1}.${ext}`;
      return uploadImageToImageKit(file, fileName, folder, options);
    });

    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Error uploading multiple images to ImageKit:', error);
    throw error;
  }
};

/**
 * Get ImageKit fileId from URL or filePath
 * ImageKit URLs don't contain fileId directly, so we need to look it up using listFiles
 * @param {string} imageUrl - ImageKit URL or filePath
 * @returns {Promise<string|null>} - FileId if found, null otherwise
 */
export const getImageKitFileId = async (imageUrl) => {
  try {
    if (!imageUrl || typeof imageUrl !== 'string') {
      console.warn('[getImageKitFileId] No URL provided');
      return null;
    }

    console.log(`[getImageKitFileId] Looking up fileId for URL: ${imageUrl}`);

    // Extract filePath from URL
    const filePath = extractImageKitFilePath(imageUrl);
    if (!filePath) {
      console.warn(`[getImageKitFileId] Could not extract filePath from URL: ${imageUrl}`);
      return null;
    }

    console.log(`[getImageKitFileId] Extracted filePath: ${filePath}`);

    // Extract folder path and filename
    const pathParts = filePath.split('/').filter(p => p);
    const fileName = pathParts[pathParts.length - 1];
    const folderPath = pathParts.length > 1 ? '/' + pathParts.slice(0, -1).join('/') : '/';

    console.log(`[getImageKitFileId] Searching in folder: ${folderPath}, fileName: ${fileName}`);

    // Try multiple methods to find the file
    try {
      // Method 1: List files by path (most specific)
      let files = [];
      try {
        const listResponse = await imagekit.listFiles({
          path: folderPath,
          limit: 1000
        });
        
        // ImageKit v5 SDK returns results differently - handle both formats
        if (Array.isArray(listResponse)) {
          files = listResponse;
        } else if (listResponse && typeof listResponse === 'object') {
          // Try common response formats
          files = listResponse.results || listResponse.data || listResponse.files || [];
          // Also check if response itself has fileId (single file)
          if (listResponse.fileId && !files.length) {
            files = [listResponse];
          }
        }
        
        console.log(`[getImageKitFileId] Method 1: Found ${files.length} files in folder ${folderPath}`);
        
        // Try to find match
        if (files.length > 0) {
          // Exact filePath match
          let match = files.find(file => {
            const filePathToCheck = file.filePath || file.path || file.file;
            return filePathToCheck === filePath;
          });
          if (match && match.fileId) {
            console.log(`[getImageKitFileId] ✓ Found fileId by exact filePath: ${match.fileId}`);
            return match.fileId;
          }

          // URL match
          match = files.find(file => {
            const urlToCheck = file.url || file.webkitRelativePath;
            return urlToCheck === imageUrl || (urlToCheck && imageUrl.includes(urlToCheck.split('/').pop()));
          });
          if (match && match.fileId) {
            console.log(`[getImageKitFileId] ✓ Found fileId by URL match: ${match.fileId}`);
            return match.fileId;
          }

          // Filename match
          match = files.find(file => {
            const nameToCheck = file.name || file.fileName;
            const pathToCheck = file.filePath || file.path;
            return nameToCheck === fileName || (pathToCheck && pathToCheck.endsWith(fileName));
          });
          if (match && match.fileId) {
            console.log(`[getImageKitFileId] ✓ Found fileId by filename: ${match.fileId}`);
            return match.fileId;
          }
        }
      } catch (pathError) {
        console.warn(`[getImageKitFileId] Method 1 failed: ${pathError.message}`);
      }

      // Method 2: Search all files and filter (broader search)
      try {
        const allResponse = await imagekit.listFiles({
          limit: 1000
        });
        
        let allFiles = [];
        if (Array.isArray(allResponse)) {
          allFiles = allResponse;
        } else if (allResponse && typeof allResponse === 'object') {
          allFiles = allResponse.results || allResponse.data || allResponse.files || [];
          if (allResponse.fileId && !allFiles.length) {
            allFiles = [allResponse];
          }
        }
        
        console.log(`[getImageKitFileId] Method 2: Found ${allFiles.length} total files`);

        // Filter for matching files
        const matchingFiles = allFiles.filter(file => {
          const filePathToCheck = file.filePath || file.path || file.file || '';
          const urlToCheck = file.url || '';
          const nameToCheck = file.name || file.fileName || '';
          
          return filePathToCheck === filePath ||
                 urlToCheck === imageUrl ||
                 nameToCheck === fileName ||
                 (filePathToCheck && filePathToCheck.endsWith(fileName)) ||
                 (urlToCheck && imageUrl.includes(urlToCheck.split('/').pop()));
        });

        if (matchingFiles.length > 0) {
          const match = matchingFiles[0];
          if (match.fileId) {
            console.log(`[getImageKitFileId] ✓ Found fileId from all files search: ${match.fileId}`);
            return match.fileId;
          }
        }
      } catch (allError) {
        console.warn(`[getImageKitFileId] Method 2 failed: ${allError.message}`);
      }

      console.warn(`[getImageKitFileId] ✗ Could not find fileId for URL: ${imageUrl}, filePath: ${filePath}`);
      return null;
    } catch (listError) {
      console.error(`[getImageKitFileId] Error in file lookup:`, listError);
      console.error(`[getImageKitFileId] Error stack:`, listError.stack);
      return null;
    }
  } catch (error) {
    console.error(`[getImageKitFileId] Unexpected error getting fileId from URL ${imageUrl}:`, error);
    console.error(`[getImageKitFileId] Error stack:`, error.stack);
    return null;
  }
};

/**
 * Delete an image from ImageKit using file ID or URL
 * @param {string} fileIdOrUrl - ImageKit file ID or URL
 * @returns {Promise<boolean>} - True if deletion successful
 */
export const deleteImageFromImageKit = async (fileIdOrUrl) => {
  try {
    if (!fileIdOrUrl) {
      console.warn('[deleteImageFromImageKit] No fileId or URL provided for ImageKit deletion');
      return false;
    }

    console.log(`[deleteImageFromImageKit] Attempting to delete: ${fileIdOrUrl}`);

    let fileId = fileIdOrUrl;

    // If it's a URL, extract fileId first
    if (isImageKitUrl(fileIdOrUrl)) {
      console.log(`[deleteImageFromImageKit] Detected ImageKit URL, looking up fileId...`);
      fileId = await getImageKitFileId(fileIdOrUrl);
      if (!fileId) {
        console.error(`[deleteImageFromImageKit] Could not find fileId for ImageKit URL: ${fileIdOrUrl}`);
        // Try one more approach - use URL directly if ImageKit supports it
        // Some ImageKit SDKs allow deletion by URL
        try {
          // Extract just the path part and try to use it as fileId
          const pathOnly = extractImageKitFilePath(fileIdOrUrl);
          if (pathOnly) {
            console.log(`[deleteImageFromImageKit] Attempting deletion with path: ${pathOnly}`);
            // This might not work, but worth trying
          }
        } catch (e) {
          console.error(`[deleteImageFromImageKit] Alternative deletion method also failed:`, e);
        }
        return false;
      }
      console.log(`[deleteImageFromImageKit] Found fileId: ${fileId}`);
    } else {
      console.log(`[deleteImageFromImageKit] Using provided fileId: ${fileId}`);
    }

    // ImageKit deleteFile method requires fileId
    console.log(`[deleteImageFromImageKit] Calling imagekit.deleteFile(${fileId})`);
    const deleteResult = await imagekit.deleteFile(fileId);
    console.log(`[deleteImageFromImageKit] Delete result:`, deleteResult);
    console.log(`[deleteImageFromImageKit] Successfully deleted image from ImageKit: ${fileId} (original: ${fileIdOrUrl})`);
    return true;
  } catch (error) {
    console.error(`[deleteImageFromImageKit] Error deleting image from ImageKit (${fileIdOrUrl}):`, error);
    console.error(`[deleteImageFromImageKit] Error details:`, {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    // Don't throw - continue even if deletion fails (image might already be deleted)
    return false;
  }
};

/**
 * Extract ImageKit file ID from URL
 * This is a helper to extract fileId from ImageKit URLs if needed
 * Note: ImageKit URLs don't contain fileId directly, so we need to store fileId separately
 * @param {string} imageUrl - ImageKit URL
 * @returns {string|null} - File path or null
 */
export const extractImageKitFilePath = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  
  // ImageKit URLs are in format: https://ik.imagekit.io/your_id/path/to/image.jpg
  // We can extract the path part
  try {
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/').filter(p => p);
    if (pathParts.length > 0) {
      return '/' + pathParts.join('/');
    }
  } catch (e) {
    // Not a valid URL, might be a path already
    if (imageUrl.startsWith('/')) {
      return imageUrl;
    }
  }
  
  return null;
};

/**
 * Check if a URL is an ImageKit URL
 * @param {string} url - URL to check
 * @returns {boolean} - True if it's an ImageKit URL
 */
export const isImageKitUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const imagekitEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
  if (!imagekitEndpoint) return false;
  return url.includes(imagekitEndpoint) || url.startsWith('https://ik.imagekit.io/');
};

