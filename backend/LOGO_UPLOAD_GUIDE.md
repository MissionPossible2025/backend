# Logo Upload to ImageKit - Complete Guide

## Overview

The backend now supports uploading the application logo directly to ImageKit. The logo is stored in ImageKit's `/app-assets` folder and can be retrieved via API. The customer app automatically fetches and displays the logo from ImageKit.

## Backend Endpoints

### 1. Upload Logo
**POST** `/api/logo/upload`

Uploads a logo image to ImageKit and returns the ImageKit URL.

**With file upload (multipart/form-data):**
```javascript
const formData = new FormData();
formData.append('logo', fileInput.files[0]);
formData.append('fileName', 'app-logo.png'); // Optional

const response = await fetch('/api/logo/upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result.data.url); // ImageKit URL
```

**With base64 (application/json):**
```javascript
const response = await fetch('/api/logo/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    logoBase64: 'data:image/png;base64,iVBORw0KGgo...',
    fileName: 'app-logo.png' // Optional
  })
});

const result = await response.json();
console.log(result.data.url); // ImageKit URL
```

**Response:**
```json
{
  "success": true,
  "message": "Logo uploaded successfully to ImageKit",
  "data": {
    "url": "https://ik.imagekit.io/your_id/app-assets/app-logo.png",
    "fileId": "file_id",
    "filePath": "/app-assets/app-logo.png",
    "name": "app-logo.png",
    "size": 12345,
    "width": 200,
    "height": 52
  }
}
```

### 2. Get Current Logo
**GET** `/api/logo`

Retrieves the current logo URL from ImageKit.

```javascript
const response = await fetch('/api/logo');
const result = await response.json();

if (result.success) {
  console.log(result.data.url); // ImageKit URL
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://ik.imagekit.io/your_id/app-assets/app-logo.png",
    "fileId": "file_id"
  }
}
```

### 3. Delete Logo
**DELETE** `/api/logo`

Deletes the current logo from ImageKit.

```javascript
const response = await fetch('/api/logo', {
  method: 'DELETE'
});

const result = await response.json();
```

**Response:**
```json
{
  "success": true,
  "message": "Logo deleted successfully from ImageKit",
  "data": {
    "deletedUrl": "https://ik.imagekit.io/your_id/app-assets/app-logo.png"
  }
}
```

## Frontend Implementation

The customer app (`customer-app/src/pages/Dashboard.jsx`) has been updated to:

1. **Fetch logo from API** - Uses `useLogo()` hook to fetch the ImageKit URL
2. **Display ImageKit logo** - Shows the logo from ImageKit in the footer
3. **Fallback handling** - Falls back to local logo if ImageKit logo is unavailable

### How It Works

```javascript
// The useLogo hook automatically fetches the logo on component mount
const { logoUrl, loading } = useLogo()

// The logo is displayed in the footer
<img
  src={logoUrl}
  alt="DreamSync Creations logo"
  style={{ height: '52px', width: 'auto' }}
  onError={(e) => {
    // Fallback to local logo if ImageKit URL fails
    e.target.src = resolveImageUrl('/uploads/dreamsync-logo.svg')
  }}
/>
```

## ImageKit Storage

- **Folder:** `/app-assets`
- **Tags:** `logo`, `app-logo`, `footer-logo`
- **File naming:** `app-logo.{ext}` (default) or custom filename

## Environment Variables

Make sure your `backend/.env` file contains:

```env
IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

## Usage Example

### Upload Logo via cURL

**With file:**
```bash
curl -X POST http://localhost:5000/api/logo/upload \
  -F "logo=@/path/to/logo.png" \
  -F "fileName=app-logo.png"
```

**With base64:**
```bash
curl -X POST http://localhost:5000/api/logo/upload \
  -H "Content-Type: application/json" \
  -d '{
    "logoBase64": "data:image/png;base64,iVBORw0KGgo...",
    "fileName": "app-logo.png"
  }'
```

### Upload Logo via JavaScript (Frontend)

```javascript
// Example: Upload logo from file input
const fileInput = document.querySelector('#logo-input');
const formData = new FormData();
formData.append('logo', fileInput.files[0]);

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

## Features

✅ **Direct ImageKit Upload** - Logo goes straight to ImageKit, not local storage
✅ **Automatic Replacement** - Old logo is deleted when new one is uploaded
✅ **Frontend Integration** - Customer app automatically fetches and displays logo
✅ **Fallback Support** - Falls back to local logo if ImageKit logo unavailable
✅ **Error Handling** - Proper error handling with clear messages
✅ **File Validation** - Only image files accepted, 5MB size limit

## Notes

- **In-Memory Storage**: The current logo URL is stored in memory. For production, consider storing it in MongoDB or a config file for persistence across server restarts.
- **Old Logo Cleanup**: When uploading a new logo, the old one is automatically deleted from ImageKit.
- **File Size Limit**: 5MB maximum (configurable in `routes/logoRoutes.js`).

## Troubleshooting

**Logo not appearing in customer app:**
- Check if logo was uploaded successfully via GET `/api/logo`
- Verify ImageKit credentials in `.env` file
- Check browser console for fetch errors
- Verify CORS is configured correctly

**Upload fails:**
- Check file size (max 5MB)
- Verify file is an image (jpg, png, svg, etc.)
- Check ImageKit API limits
- Verify environment variables are set

**Logo not deleting:**
- Check if logo exists via GET `/api/logo`
- Verify ImageKit fileId is available
- Check server logs for deletion errors

