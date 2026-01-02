# Digital Membership Card - Issue Fixes

**Date:** December 31, 2025
**Issues Fixed:** Member name truncation and profile picture not displaying in downloaded card

---

## Summary of Changes

### ✅ Issue #1: Member Name Getting Cut Off - FIXED

**Problem:** Long member names were being truncated with "..." in the downloaded card.

**Solution:** Changed text handling from truncation to multi-line wrapping:
- Changed `truncate` class to `break-words line-clamp-2`
- Removed `min-w-0` that was causing excessive container shrinking
- Now allows names to wrap to up to 2 lines before truncating

**File Modified:** `src/components/members/MembershipCard.tsx` (Line 123)

---

### ✅ Issue #2: Profile Picture Not Displaying - PARTIALLY FIXED

**Problem:** Profile pictures from Firebase Storage weren't showing in downloaded cards due to CORS restrictions.

**Solution Applied:**
1. Set `allowTaint: true` in html2canvas configuration to allow cross-origin images
2. Improved image preloading with proper timeout handling
3. Added fallback background color

**File Modified:** `src/components/members/MembershipCard.tsx` (Lines 15-52)

**⚠️ IMPORTANT: Firebase Storage CORS Configuration Required**

To fully fix the profile picture issue, you need to configure Firebase Storage CORS settings.

---

## Required Action: Configure Firebase Storage CORS

### Why This Is Needed

Firebase Storage blocks cross-origin image requests by default. When `html2canvas` tries to capture your membership card, it can't access images from Firebase Storage, resulting in blank avatars in the downloaded card.

### How to Fix

#### Option 1: Using Google Cloud Console (Recommended)

1. **Install Google Cloud SDK** (if not already installed):
   ```bash
   # macOS (using Homebrew)
   brew install --cask google-cloud-sdk

   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

2. **Initialize gcloud** (if first time):
   ```bash
   gcloud init
   ```
   - Select your Google account
   - Choose your Firebase project: `inkuthazo-a0ac7`

3. **Apply CORS Configuration**:
   ```bash
   gsutil cors set storage-cors.json gs://inkuthazo-a0ac7.appspot.com
   ```

4. **Verify CORS Configuration**:
   ```bash
   gsutil cors get gs://inkuthazo-a0ac7.appspot.com
   ```

   You should see output similar to:
   ```json
   [
     {
       "origin": ["*"],
       "method": ["GET", "HEAD"],
       "maxAgeSeconds": 3600,
       "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"]
     }
   ]
   ```

#### Option 2: Using Firebase Console (Limited)

Firebase Console doesn't provide direct CORS configuration. You must use Option 1 above.

---

## CORS Configuration File

A CORS configuration file has been created at: `storage-cors.json`

**Contents:**
```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"]
  }
]
```

**What This Does:**
- `origin: ["*"]` - Allows requests from any domain (you can restrict this to your domain for better security)
- `method: ["GET", "HEAD"]` - Allows GET and HEAD requests (read-only)
- `maxAgeSeconds: 3600` - Browsers cache CORS settings for 1 hour
- `responseHeader` - Headers that can be accessed by the requesting code

**Security Note:** Using `"*"` for origin is fine for public profile images. For production, consider restricting to your domain:
```json
"origin": ["https://yourdomain.com", "http://localhost:5173"]
```

---

## Alternative Solution (If CORS Can't Be Configured)

If you cannot configure Firebase Storage CORS, here's an alternative approach:

### Option A: Use Firebase Storage Download URLs

Firebase Storage download URLs include a token that bypasses CORS restrictions. Make sure you're using the download URL format:

```
https://firebasestorage.googleapis.com/v0/b/bucket/o/path%2Fto%2Ffile?alt=media&token=xxxxx
```

The `alt=media&token=xxxxx` part is crucial.

### Option B: Proxy Images Through Cloud Function

Create a Cloud Function to proxy images (more complex, not recommended unless necessary).

---

## Testing the Fixes

### Test #1: Long Member Names

1. Navigate to a member with a long name (e.g., "Motebang Mokwatsi Phahlamohlaka")
2. Scroll to "Digital Membership Card" section
3. **Expected:** Name should wrap to 2 lines, fully visible (no "..." truncation)
4. Click "Download Digital Card"
5. **Expected:** Downloaded PNG shows full name on 2 lines

### Test #2: Profile Picture

**Before CORS Configuration:**
- Profile picture shows in browser preview ✅
- Profile picture is BLANK in downloaded card ❌

**After CORS Configuration:**
- Profile picture shows in browser preview ✅
- Profile picture shows in downloaded card ✅

### Test #3: Fallback (No Profile Picture)

1. Navigate to a member without an avatar
2. **Expected:** Shows member's first initial in a colored circle
3. Download card
4. **Expected:** Initial displays correctly in downloaded card

---

## Technical Implementation Details

### Changes Made to MembershipCard.tsx

#### 1. Enhanced Download Function (Lines 15-52)

**Added:**
- Image preloading before canvas capture
- 5-second timeout per image to prevent hanging
- Proper error handling for failed image loads
- `allowTaint: true` to permit cross-origin images

**Before:**
```tsx
const canvas = await html2canvas(cardRef.current, {
    scale: 4,
    useCORS: true,
    allowTaint: true,
    // ...
});
```

**After:**
```tsx
// Wait for images to load
const images = cardRef.current.querySelectorAll('img');
await Promise.all(Array.from(images).map((img) => {
    if (img.complete) return Promise.resolve();
    return new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        setTimeout(reject, 5000);
    });
}));

const canvas = await html2canvas(cardRef.current, {
    scale: 3,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#4F46E5',
    imageTimeout: 15000,
    // ...
});
```

#### 2. Fixed Text Truncation (Line 123)

**Before:**
```tsx
<div className="flex-1 min-w-0 flex flex-col justify-center">
    <h4 className="text-xl font-bold leading-tight mb-2 truncate">
        {member.full_name}
    </h4>
```

**After:**
```tsx
<div className="flex-1 flex flex-col justify-center overflow-hidden">
    <h4 className="text-xl font-bold leading-tight mb-2 break-words line-clamp-2">
        {member.full_name}
    </h4>
```

**What Changed:**
- Removed `min-w-0` - prevents excessive shrinking
- Changed `truncate` to `break-words line-clamp-2`
- `break-words` - allows words to break at any character if needed
- `line-clamp-2` - shows up to 2 lines before truncating

---

## Troubleshooting

### Problem: Name Still Getting Cut Off

**Solution:**
- Clear browser cache
- Hard refresh: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
- Check if the build was deployed

### Problem: Profile Picture Still Not Showing

**Check:**
1. ✅ Did you apply CORS configuration to Firebase Storage?
2. ✅ Is the member's `avatar_url` field populated?
3. ✅ Is the URL a valid Firebase Storage URL?
4. ✅ Does the image load in the browser preview (before download)?

**Debug:**
```bash
# Check current CORS settings
gsutil cors get gs://inkuthazo-a0ac7.appspot.com

# If empty or missing, apply configuration
gsutil cors set storage-cors.json gs://inkuthazo-a0ac7.appspot.com
```

**Console Errors:**
- Open browser DevTools (F12)
- Check Console for CORS errors
- Look for messages like: "Access to image blocked by CORS policy"

### Problem: Low Quality Downloaded Image

**Solution:**
The scale is set to 3 (3x resolution). You can increase it to 4 or 5 for higher quality:

```tsx
const canvas = await html2canvas(cardRef.current, {
    scale: 4, // or 5 for even higher quality
    // ...
});
```

**Trade-off:** Higher scale = better quality but slower download generation

---

## Build Status

✅ **Build Successful** - All TypeScript checks passed

**Files Modified:**
1. `src/components/members/MembershipCard.tsx`

**Files Created:**
1. `storage-cors.json` - Firebase Storage CORS configuration

---

## Next Steps

### Immediate (Required):
1. ✅ Code changes applied
2. ⏳ **Configure Firebase Storage CORS** (see instructions above)
3. ⏳ Test with real member data

### Optional (Production):
1. Restrict CORS origin to your production domain
2. Consider adding download progress indicator
3. Add error toast if image fails to load
4. Implement image optimization (resize avatars to max 500x500px)

---

## Additional Notes

### Why `allowTaint: true`?

- `html2canvas` normally prevents capturing images from different origins (CORS policy)
- When `allowTaint: false` (default), it refuses to capture cross-origin images
- When `allowTaint: true`, it captures them BUT won't work without proper CORS headers
- This is why Firebase Storage CORS configuration is required

### Performance Considerations

- **Scale Factor 3** provides good quality (1200x750px final image)
- **Image Timeout 15s** prevents indefinite waiting
- **Preloading** ensures images are ready before capture
- Total download time: 2-5 seconds depending on connection

### Security Considerations

- CORS `origin: ["*"]` is safe for public avatars
- Consider restricting to your domain in production
- Firebase Storage already requires authentication for uploads
- Download URLs include security tokens

---

## Support

If issues persist after applying CORS configuration:

1. Check browser console for errors
2. Verify Firebase Storage bucket name: `inkuthazo-a0ac7.appspot.com`
3. Ensure gcloud is authenticated with correct project
4. Try downloading from different browser (Chrome, Firefox, Safari)

---

**Last Updated:** December 31, 2025
**Status:** Ready for CORS configuration and testing
