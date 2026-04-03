# Android App Icon Setup Guide

This guide will help you replace the default Android Studio icon with your custom DaiLynk icon.

## Quick Setup (Recommended)

### Option 1: Using the Icon Generator Script

1. **Place your icon image** in `customer-app/android/icon-source.png`
   - Recommended: 1024x1024 PNG
   - Should have transparent background
   - Square format works best

2. **Install dependencies** (if not already installed):
   ```bash
   cd customer-app
   npm install --save-dev sharp
   ```

3. **Run the generator script**:
   ```bash
   node generate-android-icons.js
   ```

4. **Rebuild your Android app**:
   ```bash
   npx cap sync android
   ```

### Option 2: Using Android Asset Studio (Online Tool)

1. Go to: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
2. Upload your icon image (1024x1024 PNG recommended)
3. Configure:
   - **Foreground**: Your DaiLynk logo/icon
   - **Background**: White (#FFFFFF) or your brand color
   - **Padding**: 10-20% (to prevent edge clipping)
4. Click "Download" to get a ZIP file
5. Extract the ZIP and copy the `res` folder contents to:
   ```
   customer-app/android/app/src/main/res/
   ```
6. Rebuild: `npx cap sync android`

## Manual Setup

If you prefer to set up icons manually:

### Required Icon Sizes

You need to create icons in these sizes for each density folder:

| Density | Folder | Launcher Icon | Foreground Icon |
|---------|--------|---------------|-----------------|
| mdpi | `mipmap-mdpi` | 48x48 | 108x108 |
| hdpi | `mipmap-hdpi` | 72x72 | 162x162 |
| xhdpi | `mipmap-xhdpi` | 96x96 | 216x216 |
| xxhdpi | `mipmap-xxhdpi` | 144x144 | 324x324 |
| xxxhdpi | `mipmap-xxxhdpi` | 192x192 | 432x432 |

### Files to Replace

For each density folder (`mipmap-mdpi`, `mipmap-hdpi`, etc.), replace:
- `ic_launcher.png` - Square launcher icon
- `ic_launcher_round.png` - Round launcher icon (same as square)
- `ic_launcher_foreground.png` - Foreground for adaptive icons (larger size)

### Adaptive Icon Configuration

The adaptive icon is configured in:
- `res/mipmap-anydpi-v26/ic_launcher.xml` - Main adaptive icon
- `res/mipmap-anydpi-v26/ic_launcher_round.xml` - Round adaptive icon
- `res/drawable/ic_launcher_background.xml` - Background color/shape
- `res/drawable-v24/ic_launcher_foreground.xml` - Foreground vector (optional)

## Testing

After updating icons:

1. **Clean build**:
   ```bash
   cd customer-app/android
   ./gradlew clean
   ```

2. **Rebuild**:
   ```bash
   npx cap sync android
   ```

3. **Test on device/emulator**:
   - Uninstall the old app
   - Install the new build
   - Check the launcher icon appears correctly

## Troubleshooting

### Icon not updating?
- Clear app data and uninstall completely
- Clean build: `./gradlew clean`
- Rebuild and reinstall

### Icon looks blurry?
- Ensure you're using high-resolution source images (1024x1024 minimum)
- Check that all density folders have the correct sizes

### Icon is cropped?
- Adaptive icons have a "safe zone" - keep important content in the center 66%
- Adjust padding in Android Asset Studio or use a larger foreground image

## Current Configuration

- **Background**: White (#FFFFFF) - defined in `res/values/ic_launcher_background.xml`
- **Foreground**: Uses PNG images from mipmap folders
- **Adaptive Icon**: Enabled for Android 8.0+ (API 26+)
