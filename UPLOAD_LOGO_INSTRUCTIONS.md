# Upload Logo to ImageKit - Quick Start Guide

## Overview

The backend is configured to upload logos directly to ImageKit. The customer app automatically fetches and displays the logo from ImageKit.

## Quick Upload Methods

### Method 1: Using Upload Script (Recommended)

**Option A: Direct ImageKit Upload (No server required)**
```bash
cd backend
node scripts/uploadLogoToImageKit.js
```

This script:
- Reads the logo from `backend/uploads/dreamsync-logo.svg`
- Uploads directly to ImageKit
- Optionally updates the backend reference (if server is running)

**Option B: Via API Endpoint (Server must be running)**
```bash
cd backend
node scripts/uploadLogoViaAPI.js
```

This script:
- Reads the logo from `backend/uploads/dreamsync-logo.svg`
- Calls the POST `/api/logo/upload` endpoint
- Updates the backend reference

### Method 2: Using cURL

**With file upload:**
```bash
curl -X POST http://localhost:5000/api/logo/upload \
  -F "logo=@backend/uploads/dreamsync-logo.svg" \
  -F "fileName=dreamsync-logo.svg"
```

**With base64 (if you have the logo as base64):**
```bash
curl -X POST http://localhost:5000/api/logo/upload \
  -H "Content-Type: application/json" \
  -d '{
    "logoBase64": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgdmlld0JveD0iMCAwIDMyMCAzMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+...",
    "fileName": "dreamsync-logo.svg"
  }'
```

### Method 3: Using JavaScript/Frontend

```javascript
// Example: Upload logo from file input
const fileInput = document.querySelector('#logo-input');
const formData = new FormData();
formData.append('logo', fileInput.files[0]);
formData.append('fileName', 'dreamsync-logo.svg');

const response = await fetch('http://localhost:5000/api/logo/upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
if (result.success) {
  console.log('Logo uploaded:', result.data.url);
  // Logo will automatically appear in customer app footer
}
```

## Verify Upload

### 1. Check ImageKit Media Library
- Log into your ImageKit dashboard
- Go to Media Library
- Look for the logo in `/app-assets` folder
- File should be named `dreamsync-logo.svg`

### 2. Check Backend API
```bash
curl http://localhost:5000/api/logo
```

Expected response:
```json
{
  "success": true,
  "data": {
    "url": "https://ik.imagekit.io/your_id/app-assets/dreamsync-logo.svg",
    "fileId": "file_id"
  }
}
```

### 3. Check Customer App
- Open the customer app
- Navigate to Dashboard
- Check the footer - logo should display from ImageKit
- If logo doesn't appear, check browser console for errors

## Environment Variables

Ensure your `backend/.env` file contains:

```env
IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

## Troubleshooting

**Logo not appearing in ImageKit:**
- Verify environment variables are set correctly
- Check ImageKit credentials are valid
- Review server logs for upload errors
- Ensure file exists at `backend/uploads/dreamsync-logo.svg`

**Logo not appearing in customer app:**
- Check if logo was uploaded: `GET /api/logo`
- Verify ImageKit URL is accessible
- Check browser console for fetch errors
- Verify CORS is configured correctly
- Check network tab for failed requests

**Upload script fails:**
- Ensure ImageKit SDK is installed: `npm install imagekit`
- Check that `.env` file has all required variables
- Verify the logo file exists at the expected path
- Check Node.js version (18+ recommended for native fetch)

## File Structure

```
backend/
├── uploads/
│   └── dreamsync-logo.svg    # Source logo file
├── scripts/
│   ├── uploadLogoToImageKit.js    # Direct upload script
│   └── uploadLogoViaAPI.js        # API upload script
├── controllers/
│   └── logoController.js           # Logo API controller
├── routes/
│   └── logoRoutes.js               # Logo API routes
└── .env                            # ImageKit credentials
```

## Next Steps

1. **Upload the logo** using one of the methods above
2. **Verify in ImageKit** - Check Media Library
3. **Test in customer app** - Logo should appear in footer
4. **Update logo anytime** - Just upload a new one, old one is automatically deleted

## Notes

- The logo is stored in ImageKit's `/app-assets` folder
- Old logos are automatically deleted when uploading a new one
- The customer app fetches the logo on Dashboard load
- Fallback to local logo if ImageKit logo is unavailable
- Logo URL is stored in memory (consider MongoDB for production persistence)

