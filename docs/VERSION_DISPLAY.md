# Application Version Display

## Overview

The application now displays its current version in the sidebar footer, right above the theme toggle and sign-out button, making it easy to identify which version is running in production or development environments.

## Location

The version badge is displayed in the **sidebar footer** (both mobile and desktop), positioned above the theme toggle and sign-out button:

```
┌─────────────────────────┐
│  Inkuthazo              │
│  Social Club Portal     │
├─────────────────────────┤
│  [Navigation Menu]      │
│                         │
├─────────────────────────┤
│  💻 Version 1.0.0       │  ← Version Display
│  [🌙] [Sign Out]        │  ← Theme & Sign Out
└─────────────────────────┘
```

## Features

### Visual Design
- **Purple-themed badge** - Matches the application's color scheme
- **Code icon** - Uses Lucide React's `Code` icon
- **Centered display** - Positioned in the middle of the badge
- **Always visible** - Shows on both mobile and desktop sidebars
- **Dark mode support** - Automatically adapts to dark theme

### Version Format
- Displays as: `Version 1.0.0`
- Automatically reads from `package.json`
- Updates automatically when version is changed

## Implementation Details

### Files Modified

1. **package.json**
   - Updated version from `0.0.0` to `1.0.0`

2. **src/version.ts** (Created)
   - Defines static `APP_VERSION` constant
   - Single source of truth for version number
   - Easy to update for new releases

3. **src/components/Layout.tsx**
   - Imports `APP_VERSION` from `../version`
   - Added version badge display to sidebar footer
   - Imported `Code` icon from lucide-react
   - Added to both mobile and desktop sidebars
   - Styled with purple theme
   - Centered display above theme toggle and sign-out

## How to Update Version

To update the application version:

1. Edit `src/version.ts`:
   ```typescript
   export const APP_VERSION = "1.1.0";
   ```

2. (Optional) Also update `package.json` to keep it in sync:
   ```json
   {
     "version": "1.1.0"
   }
   ```

The new version will automatically appear in the sidebar after the file is saved (hot reload in dev mode).

## Semantic Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** version (1.x.x) - Breaking changes
- **MINOR** version (x.1.x) - New features, backwards-compatible
- **PATCH** version (x.x.1) - Bug fixes, backwards-compatible

### Example Version History

- `1.0.0` - Initial release with RBAC system
- `1.1.0` - New features (e.g., bulk import, advanced analytics)
- `1.1.1` - Bug fixes
- `2.0.0` - Breaking changes (e.g., API redesign)

## Responsive Behavior

### Desktop Sidebar
- Version badge is visible in the left sidebar footer
- Always displayed above theme toggle and sign-out button
- Centered alignment for better aesthetics

### Mobile Sidebar
- Version badge is visible when mobile menu is opened
- Same position as desktop (sidebar footer)
- Provides consistency across all devices

## Styling Details

### Light Mode
- Background: `purple-50`
- Border: `purple-200`
- Icon color: `purple-600`
- Text color: `purple-700`

### Dark Mode
- Background: `purple-900/20` (20% opacity)
- Border: `purple-700`
- Icon color: `purple-400`
- Text color: `purple-300`

## Development vs Production

The version is the same in both environments and is determined by `package.json`. This ensures consistency across all builds.

### Checking Version in Code

The version is available as a static import:
```typescript
import { APP_VERSION } from './version';
console.log('App Version:', APP_VERSION);
```

## Best Practices

### When to Update Version

1. **Before releasing to production** - Update version number
2. **After major changes** - Increment major/minor version
3. **After bug fixes** - Increment patch version
4. **Document changes** - Update CHANGELOG.md

### Version Naming Convention

- Use consistent format: `MAJOR.MINOR.PATCH`
- Don't skip versions
- Tag releases in git with version number

Example:
```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

## Troubleshooting

### Version shows as "0.0.0"

**Cause**: The version constant hasn't been updated

**Solution**:
1. Check `src/version.ts` has the correct version
2. If you just updated it, the page should hot-reload automatically
3. If not, refresh the browser: `Cmd+R` (Mac) or `Ctrl+R` (Windows)

### Version not updating after change

**Cause**: Browser cache or build cache

**Solution**:
1. Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Rebuild: `npm run build`
3. Clear Vite cache: `rm -rf dist`

### TypeScript errors about APP_VERSION

**Cause**: Import path is incorrect

**Solution**:
1. Verify import statement: `import { APP_VERSION } from '../version';`
2. Check the relative path is correct based on your file location
3. Restart TypeScript server in your IDE

## Future Enhancements

Potential improvements:

1. **Build timestamp** - Show when the build was created
2. **Git commit hash** - Display current commit for debugging
3. **Environment indicator** - Show DEV/STAGING/PROD badge
4. **Clickable version** - Show changelog modal on click
5. **Update notification** - Notify users when new version is available

## Related Files

- `src/version.ts` - **Source of truth** for version number
- `package.json` - Package version (should be kept in sync)
- `src/components/Layout.tsx` - Version display UI in sidebar
- `CHANGELOG.md` - Version history (to be created)

---

**Current Version**: v1.0.0
**Last Updated**: 2026-04-07
