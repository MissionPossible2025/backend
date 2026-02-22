# Automatic ImageKit Deletion - Seller Image Removal

## Overview

When a seller deletes an image in the seller app, the corresponding image in ImageKit is automatically deleted as well. This ensures that ImageKit storage stays clean and you don't accumulate orphaned images.

## How It Works

### 1. **Image Deletion in Seller App**

When a seller removes an image in the Edit Product page:
- The image is removed from the local state
- The remaining images (to keep) are sent to the backend as `existingPhotos` array
- Backend compares existing photos with photos to keep
- Removed images are automatically deleted from ImageKit

### 2. **Backend Deletion Logic**

The `updateProduct` function in `backend/controllers/productController.js`:

1. **Receives `existingPhotos`** - Array of image URLs that should be kept
2. **Compares with existing photos** - Finds which images were removed
3. **Deletes from ImageKit** - Removes deleted images from ImageKit automatically
4. **Updates product** - Saves the updated photo list to MongoDB

### 3. **ImageKit File Lookup**

Since ImageKit requires `fileId` for deletion (not URLs), the system:
- Extracts `filePath` from ImageKit URL
- Uses ImageKit's `listFiles` API to find the file by path
- Retrieves the `fileId`
- Deletes the file using `fileId`

## Code Flow

### Frontend (Seller App)
```javascript
// seller-app/src/pages/EditItem.jsx
// When seller clicks × to remove an image:
const newPhotos = photos.filter((_, i) => i !== index);
setPhotos(newPhotos);

// On save, sends existingPhotos to backend:
const existingPhotoUrls = photos.filter(photo => typeof photo === 'string');
existingPhotoUrls.forEach((url) => {
  formData.append('existingPhotos', url);
});
```

### Backend Processing
```javascript
// backend/controllers/productController.js
// Compares existing photos with photos to keep:
const photosToKeep = new Set(existingPhotosToKeep);
existingPhotos.forEach(existing => {
  if (isImageKitUrl(existing) && !photosToKeep.has(existing)) {
    imagesToDelete.push(existing); // Mark for deletion
  }
});

// After successful update, delete from ImageKit:
await deleteImageFiles(imagesToDelete);
```

### ImageKit Deletion
```javascript
// backend/utils/imagekitUpload.js
// Gets fileId from URL and deletes:
const fileId = await getImageKitFileId(imageUrl);
await imagekit.deleteFile(fileId);
```

## Scenarios Handled

### ✅ **Seller Removes Single Image**
- Image removed from frontend state
- `existingPhotos` sent with remaining images
- Removed image deleted from ImageKit

### ✅ **Seller Removes Multiple Images**
- Multiple images removed from frontend
- All removed images deleted from ImageKit
- Only kept images remain

### ✅ **Seller Replaces All Images**
- Old images marked for deletion
- New images uploaded to ImageKit
- Old images deleted after successful update

### ✅ **Seller Deletes Entire Product**
- All product images collected
- All images deleted from ImageKit
- Product soft-deleted (isActive = false)

## Error Handling

- **Deletion failures are non-blocking** - Product update continues even if ImageKit deletion fails
- **Logs warnings** - Failed deletions are logged but don't stop the process
- **Graceful degradation** - If fileId lookup fails, deletion is skipped (image remains in ImageKit)

## Performance Considerations

- **Batch deletion** - Multiple images deleted in sequence (not parallel to avoid rate limits)
- **File lookup** - Uses ImageKit `listFiles` API which may require pagination for large folders
- **Caching** - Consider storing fileIds in database for faster deletion (future improvement)

## Future Improvements

For better performance and reliability, consider:

1. **Store fileIds in database** - When uploading, store both URL and fileId
2. **Batch deletion API** - Use ImageKit's batch delete if available
3. **Async deletion queue** - Process deletions in background for better response times

## Testing

### Test Image Removal
1. Edit a product in seller app
2. Remove an image by clicking ×
3. Save the product
4. Check ImageKit Media Library - removed image should be deleted

### Test Product Deletion
1. Delete a product in seller app
2. Check ImageKit Media Library - all product images should be deleted

### Verify Deletion
```bash
# Check server logs for deletion messages:
# "Successfully deleted image from ImageKit: {fileId}"
```

## Troubleshooting

**Images not deleting from ImageKit:**
- Check server logs for deletion errors
- Verify ImageKit credentials are correct
- Check if fileId lookup is working (may fail for very old images)
- Verify images are ImageKit URLs (not local paths)

**Deletion is slow:**
- FileId lookup requires API call to ImageKit
- Consider storing fileIds in database for faster deletion
- Large folders may require pagination

**Some images remain:**
- Images uploaded before ImageKit integration won't have fileIds
- Local images (not from ImageKit) won't be deleted
- Check logs for specific deletion failures

