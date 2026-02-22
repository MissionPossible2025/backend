// scripts/uploadLogoViaAPI.js
// Alternative script to upload logo via API endpoint
// This requires the server to be running
// Run with: node scripts/uploadLogoViaAPI.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Upload logo via API endpoint
 * This script calls the POST /api/logo/upload endpoint
 */
async function uploadLogoViaAPI() {
  try {
    // Check if ImageKit credentials are configured
    if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
      console.error('❌ Error: ImageKit credentials not found in .env file');
      process.exit(1);
    }

    // Path to the logo file
    const logoPath = path.join(__dirname, '../uploads/dreamsync-logo.svg');
    
    // Check if logo file exists
    if (!fs.existsSync(logoPath)) {
      console.error(`❌ Error: Logo file not found at ${logoPath}`);
      process.exit(1);
    }

    const apiUrl = process.env.API_URL || 'http://localhost:5000';
    console.log(`📤 Uploading logo via API to ${apiUrl}/api/logo/upload...`);
    console.log(`   File: ${logoPath}`);

    // Read the logo file
    const logoBuffer = fs.readFileSync(logoPath);
    
    // Convert to base64 for API call
    const base64Logo = logoBuffer.toString('base64');
    const dataUrl = `data:image/svg+xml;base64,${base64Logo}`;

    // Call the API endpoint
    const response = await fetch(`${apiUrl}/api/logo/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        logoBase64: dataUrl,
        fileName: 'dreamsync-logo.svg'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    if (result.success) {
      console.log('\n✅ Logo uploaded successfully via API!');
      console.log('\n📋 Upload Details:');
      console.log(`   URL: ${result.data.url}`);
      console.log(`   File ID: ${result.data.fileId}`);
      console.log(`   File Path: ${result.data.filePath}`);
      console.log(`   Size: ${result.data.size} bytes`);
      if (result.data.width && result.data.height) {
        console.log(`   Dimensions: ${result.data.width}x${result.data.height}`);
      }

      console.log('\n🌐 Next Steps:');
      console.log('1. The logo is now available in ImageKit Media Library');
      console.log('2. The customer app will automatically fetch and display it');
      console.log('3. You can verify by checking GET /api/logo endpoint');
      console.log(`4. View in ImageKit: ${process.env.IMAGEKIT_URL_ENDPOINT}${result.data.filePath}`);
    } else {
      throw new Error(result.error || 'Upload failed');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error uploading logo via API:');
    console.error(error.message);
    if (error.message.includes('fetch')) {
      console.error('\n💡 Tip: Make sure the backend server is running on port 5000');
      console.error('   Start it with: cd backend && npm start');
    }
    process.exit(1);
  }
}

// Run the upload
uploadLogoViaAPI();

