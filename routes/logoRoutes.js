// routes/logoRoutes.js
// Routes for managing application logo uploads to ImageKit

import express from 'express';
import multer from 'multer';
import {
  uploadLogo,
  getLogo,
  deleteLogo
} from '../controllers/logoController.js';

const router = express.Router();

// Configure Multer for file uploads (memory storage for ImageKit)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for logo
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * POST /api/logo/upload
 * Upload logo to ImageKit
 * 
 * Accepts two formats:
 * 1. multipart/form-data with 'logo' file field
 * 2. application/json with 'logoBase64' string
 * 
 * Optional parameters:
 * - fileName: Custom filename (default: app-logo.{ext})
 * 
 * Returns ImageKit URL
 */
router.post('/upload', (req, res, next) => {
  // Only use multer if content-type is multipart/form-data
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    upload.single('logo')(req, res, next);
  } else {
    // Skip multer for JSON requests with base64
    next();
  }
}, uploadLogo);

/**
 * GET /api/logo
 * Get current logo URL from ImageKit
 * 
 * Returns the ImageKit URL of the current logo
 */
router.get('/', getLogo);

/**
 * DELETE /api/logo
 * Delete current logo from ImageKit
 * 
 * Removes the logo from ImageKit and clears the reference
 */
router.delete('/', deleteLogo);

export default router;

