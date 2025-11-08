# SimpleIT PWA Icons

This directory contains the icon assets for the Progressive Web App (PWA) installation.

## Required Icon Sizes

For optimal PWA support across all devices and platforms, you need the following icon sizes:

### Standard PWA Icons
- **192x192 pixels** - `icon-192x192.png` (Required for Android, minimum size)
- **512x512 pixels** - `icon-512x512.png` (Required for Android, high-res)

### Apple iOS Icons
- **180x180 pixels** - `icon-180x180.png` (Optional, for iOS devices)

### Additional Recommended Sizes
- **96x96 pixels** - `icon-96x96.png` (Optional, for older Android devices)
- **144x144 pixels** - `icon-144x144.png` (Optional, for Windows tiles)
- **256x256 pixels** - `icon-256x256.png` (Optional, better quality)

## Icon Requirements

### Format
- **PNG format** with transparency (alpha channel)
- 24-bit or 32-bit color depth
- Square aspect ratio (1:1)

### Design Guidelines
1. **Simple and recognizable** - Icon should be clear at small sizes
2. **High contrast** - Use colors that work on both light and dark backgrounds
3. **No text** - Avoid small text that becomes unreadable at small sizes
4. **Consistent branding** - Use SimpleIT brand colors (primary: #3B82F6)
5. **Safe zone** - Keep important elements within 80% of the icon area

### Color Scheme
- **Primary color**: #3B82F6 (blue-600)
- **Background**: White (#FFFFFF) or transparent
- **Accent**: Consider using gradient or secondary colors

## How to Generate Icons

### Option 1: Using Online Tools (Recommended)

**Real Favicon Generator** (https://realfavicongenerator.net/)
1. Upload a high-resolution source image (at least 512x512px, preferably 1024x1024px)
2. Customize settings for different platforms
3. Download the generated favicon package
4. Extract the PNG files to this directory

**Favicon.io** (https://favicon.io/)
1. Upload your logo or create from text/emoji
2. Download the generated files
3. Copy the required sizes to this directory

### Option 2: Using Design Software

**Adobe Photoshop / Illustrator**
1. Create a 1024x1024px canvas
2. Design your icon with simple, bold elements
3. Export as PNG at different sizes (192x192, 512x512, etc.)
4. Ensure transparency is preserved

**Figma / Sketch**
1. Create artboards for each required size
2. Design your icon (vector format preferred)
3. Export as PNG with transparency
4. Name files according to the required naming convention

### Option 3: Using Command Line (ImageMagick)

If you have ImageMagick installed:

```bash
# From a 1024x1024 source image
convert source-icon.png -resize 192x192 icon-192x192.png
convert source-icon.png -resize 512x512 icon-512x512.png
convert source-icon.png -resize 180x180 icon-180x180.png
```

## Current Status

⚠️ **PLACEHOLDER ICONS REQUIRED**

Currently, the manifest.json and index.html reference icon files that don't exist yet. You need to:

1. Create or obtain a source icon (recommended size: 1024x1024px)
2. Generate the required sizes using one of the methods above
3. Place the PNG files in this directory with the correct names:
   - `icon-192x192.png`
   - `icon-512x512.png`
   - `icon-180x180.png` (optional but recommended)

## Testing Icons

After adding icons:

1. **Desktop Browser (Chrome/Edge)**:
   - Open DevTools (F12)
   - Go to Application → Manifest
   - Check if icons are loaded correctly
   - Look for any errors in the console

2. **Mobile Device**:
   - Visit the app on your mobile device
   - Tap "Add to Home Screen" (or install prompt)
   - Verify the icon appears correctly
   - Check the installed app icon on your home screen

3. **Lighthouse Audit**:
   - Run Lighthouse in Chrome DevTools
   - Check the PWA score
   - Verify "Has a maskable icon" passes (optional)

## Maskable Icons (Advanced)

For better Android support, consider creating maskable icons:
- Use https://maskable.app/ to test and generate
- Maskable icons have safe zones for different shaped masks (circle, rounded square, etc.)
- Add `"purpose": "maskable"` in manifest.json for these icons

## Example File Structure

```
public/icons/
├── README.md (this file)
├── icon-96x96.png
├── icon-144x144.png
├── icon-192x192.png
├── icon-256x256.png
├── icon-512x512.png
└── icon-180x180.png (Apple)
```

## Troubleshooting

**Icons not showing up?**
- Clear browser cache and reload
- Check file names match exactly (case-sensitive)
- Verify file paths in manifest.json
- Check image format (must be PNG)
- Ensure images are not corrupted

**Install prompt not appearing?**
- Icons must be at least 192x192 and 512x512
- Manifest must be valid JSON
- HTTPS is required (or localhost for testing)
- Service worker must be registered

## Resources

- [Web.dev PWA Icons Guide](https://web.dev/add-manifest/#icons)
- [MDN Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Material Design Icon Guidelines](https://material.io/design/iconography/product-icons.html)
- [PWA Icon Generator](https://www.pwabuilder.com/imageGenerator)

---

**Note**: Until you add actual icon files, the PWA will still work but may show a default browser icon or broken image placeholders in some cases.
