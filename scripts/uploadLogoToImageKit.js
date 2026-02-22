// scripts/uploadLogoToImageKit.js
// Script to upload the existing logo file to ImageKit
// Run with: node scripts/uploadLogoToImageKit.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import imagekit from '../config/imagekit.js';
import {
  uploadImageToImageKit
} from '../utils/imagekitUpload.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Upload logo to ImageKit
 * This script uploads the existing logo file to ImageKit
 */
async function uploadLogo() {
  try {
    // Check if ImageKit credentials are configured
    if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
      console.error('❌ Error: ImageKit credentials not found in .env file');
      console.error('Please ensure the following are set:');
      console.error('  - IMAGEKIT_PUBLIC_KEY');
      console.error('  - IMAGEKIT_PRIVATE_KEY');
      console.error('  - IMAGEKIT_URL_ENDPOINT');
      process.exit(1);
    }

    // Path to the logo file
    const logoPath = path.join(__dirname, '../uploads/dreamsync-logo.svg');
    
    // Check if logo file exists
    if (!fs.existsSync(logoPath)) {
      console.error(`❌ Error: Logo file not found at ${logoPath}`);
      console.error('Please ensure the logo file exists in backend/uploads/');
      process.exit(1);
    }

    console.log('📤 Uploading logo to ImageKit...');
    console.log(`   File: ${logoPath}`);

    // Read the logo file
    const logoBuffer = fs.readFileSync(logoPath);
    const fileName = 'dreamsync-logo.svg';
    const folder = '/app-assets';

    // Upload to ImageKit
    const uploadResult = await uploadImageToImageKit(
      logoBuffer,
      fileName,
      folder,
      {
        tags: ['logo', 'app-logo', 'footer-logo', 'dreamsync']
      }
    );

    console.log('\n✅ Logo uploaded successfully to ImageKit!');
    console.log('\n📋 Upload Details:');
    console.log(`   URL: ${uploadResult.url}`);
    console.log(`   File ID: ${uploadResult.fileId}`);
    console.log(`   File Path: ${uploadResult.filePath}`);
    console.log(`   Size: ${uploadResult.size} bytes`);
    if (uploadResult.width && uploadResult.height) {
      console.log(`   Dimensions: ${uploadResult.width}x${uploadResult.height}`);
    }

    console.log('\n🌐 Next Steps:');
    console.log('1. The logo is now available in ImageKit Media Library');
    console.log('2. The customer app will automatically fetch and display it');
    console.log('3. You can verify by checking GET /api/logo endpoint');
    console.log(`4. View in ImageKit: ${process.env.IMAGEKIT_URL_ENDPOINT}${uploadResult.filePath}`);

    // Update the in-memory logo reference by calling the API
    // Note: This requires the server to be running
    const apiUrl = process.env.API_URL || 'http://localhost:5000';
    try {
      console.log('\n🔄 Updating logo reference in backend...');
      
      // Convert to base64 for API call
      const base64Logo = logoBuffer.toString('base64');
      const dataUrl = `data:image/svg+xml;base64,${base64Logo}`;

      // Use native fetch (Node 18+) or provide instructions
      let fetch;
      try {
        // Try native fetch first (Node 18+)
        if (globalThis.fetch) {
          fetch = globalThis.fetch;
        } else {
          // Fallback: provide instructions
          throw new Error('Native fetch not available');
        }
      } catch {
        console.log('⚠️  Could not update logo reference automatically');
        console.log('   Please run: node scripts/uploadLogoViaAPI.js');
        console.log('   Or manually call POST /api/logo/upload with the base64 data');
        return;
      }

      const response = await fetch(`${apiUrl}/api/logo/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          logoBase64: dataUrl,
          fileName: fileName
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Logo reference updated in backend');
        console.log(`   Current logo URL: ${result.data.url}`);
      } else {
        const errorText = await response.text();
        console.log('⚠️  Could not update logo reference (server may not be running)');
        console.log(`   Response: ${errorText}`);
        console.log('   You can manually update it by calling POST /api/logo/upload');
        console.log('   Or use the script: node scripts/uploadLogoViaAPI.js');
      }
    } catch (error) {
      console.log('⚠️  Could not update logo reference (server may not be running)');
      console.log(`   Error: ${error.message}`);
      console.log('   You can manually update it by calling POST /api/logo/upload');
      console.log('   Or use the script: node scripts/uploadLogoViaAPI.js');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error uploading logo to ImageKit:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the upload
uploadLogo();

