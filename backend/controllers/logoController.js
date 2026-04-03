// controllers/logoController.js
// Controller for managing application logo uploads to ImageKit
// Handles logo upload, retrieval, and updates

import {
  uploadImageToImageKit,
  deleteImageFromImageKit,
  isImageKitUrl
} from '../utils/imagekitUpload.js';

// Store current logo URL in memory (in production, consider using database or config file)
// This is a simple in-memory cache - for production, you might want to store this in MongoDB
let currentLogoUrl = null;
let currentLogoFileId = null;

/**
 * POST /api/logo/upload
 * Upload logo image to ImageKit
 * Accepts: multipart/form-data (file) or application/json (base64)
 * 
 * Request body (multipart/form-data):
 * - logo: Image file
 * 
 * Request body (application/json):
 * - logoBase64: Base64 encoded image string
 * - fileName: Optional custom filename
 * 
 * Returns ImageKit URL
 */
export const uploadLogo = async (req, res) => {
  try {
    const { logoBase64, fileName } = req.body;
    const file = req.file; // From multer middleware

    // Validate that an image is provided
    if (!file && !logoBase64) {
      return res.status(400).json({
        success: false,
        error: 'Logo image is required. Provide either a file upload (multipart/form-data) or base64 string (application/json).'
      });
    }

    // Determine filename
    let finalFileName = fileName || 'app-logo';
    if (file && file.originalname && !fileName) {
      // Extract extension from original filename
      const ext = file.originalname.split('.').pop() || 'png';
      finalFileName = `app-logo.${ext}`;
    } else if (logoBase64 && !fileName) {
      // Try to extract extension from base64 data URL
      const dataUrlMatch = logoBase64.match(/data:image\/(\w+);base64,/);
      if (dataUrlMatch) {
        finalFileName = `app-logo.${dataUrlMatch[1]}`;
      } else {
        finalFileName = 'app-logo.png';
      }
    }

    let uploadResult;

    try {
      // Upload to ImageKit in a dedicated folder for app assets
      const folder = '/app-assets';
      const uploadOptions = {
        tags: ['logo', 'app-logo', 'footer-logo']
      };

      if (logoBase64) {
        // Handle base64 upload
        const imageBuffer = Buffer.from(
          logoBase64.replace(/^data:image\/\w+;base64,/, ''),
          'base64'
        );
        uploadResult = await uploadImageToImageKit(
          imageBuffer,
          finalFileName,
          folder,
          uploadOptions
        );
      } else if (file) {
        // Handle file upload
        uploadResult = await uploadImageToImageKit(
          file,
          finalFileName,
          folder,
          uploadOptions
        );
      }

      // Delete old logo from ImageKit if it exists
      if (currentLogoFileId && currentLogoUrl) {
        try {
          await deleteImageFromImageKit(currentLogoFileId);
          console.log('[uploadLogo] Deleted old logo from ImageKit');
        } catch (deleteError) {
          console.warn('[uploadLogo] Failed to delete old logo:', deleteError.message);
          // Continue even if deletion fails
        }
      }

      // Update current logo reference
      currentLogoUrl = uploadResult.url;
      currentLogoFileId = uploadResult.fileId;

      // Return success response with ImageKit URL
      res.status(200).json({
        success: true,
        message: 'Logo uploaded successfully to ImageKit',
        data: {
          url: uploadResult.url,
          fileId: uploadResult.fileId,
          filePath: uploadResult.filePath,
          name: uploadResult.name,
          size: uploadResult.size,
          width: uploadResult.width,
          height: uploadResult.height
        }
      });

    } catch (uploadError) {
      console.error('[uploadLogo] ImageKit upload error:', uploadError);
      return res.status(500).json({
        success: false,
        error: 'Failed to upload logo to ImageKit',
        details: uploadError.message
      });
    }

  } catch (error) {
    console.error('[uploadLogo] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload logo',
      details: error.message
    });
  }
};

/**
 * GET /api/logo
 * Get current logo URL
 * Returns the ImageKit URL of the current logo
 */
export const getLogo = (req, res) => {
  try {
    if (!currentLogoUrl) {
      return res.status(404).json({
        success: false,
        error: 'No logo has been uploaded yet'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        url: currentLogoUrl,
        fileId: currentLogoFileId
      }
    });
  } catch (error) {
    console.error('[getLogo] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve logo',
      details: error.message
    });
  }
};

/**
 * DELETE /api/logo
 * Delete current logo from ImageKit
 */
export const deleteLogo = async (req, res) => {
  try {
    if (!currentLogoFileId || !currentLogoUrl) {
      return res.status(404).json({
        success: false,
        error: 'No logo to delete'
      });
    }

    try {
      await deleteImageFromImageKit(currentLogoFileId);
      
      // Clear current logo reference
      const deletedUrl = currentLogoUrl;
      currentLogoUrl = null;
      currentLogoFileId = null;

      res.status(200).json({
        success: true,
        message: 'Logo deleted successfully from ImageKit',
        data: {
          deletedUrl: deletedUrl
        }
      });
    } catch (deleteError) {
      console.error('[deleteLogo] ImageKit deletion error:', deleteError);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete logo from ImageKit',
        details: deleteError.message
      });
    }

  } catch (error) {
    console.error('[deleteLogo] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete logo',
      details: error.message
    });
  }
};

