# Automatic Versioning System - Setup Complete

## Overview

Implemented Tesla-style automatic version numbering system with format: **Year.Week.Build**

Example: `2025.47.2` = Year 2025, Week 47, Build 2

## What Was Implemented

### 1. Version Generation Script
**File:** `scripts/generate-version.mjs`

- Calculates current year and ISO week number
- Increments build number for builds in the same week
- Resets build number when week changes
- Generates `version.json` in project root

### 2. Vite Plugin
**File:** `client/frontend/vite-plugins/version-plugin.ts`

- Reads `version.json` at build time
- Injects version into environment variables:
  - `import.meta.env.VITE_APP_VERSION`
  - `import.meta.env.VITE_APP_VERSION_INFO`

### 3. Version Utilities

**Framework utility:** `framework/frontend/shared/utils/version.ts`
- `getAppVersion()` - Get version string
- `formatVersion()` - Format for display

**Client utility:** `client/frontend/src/utils/version.ts`
- `getVersion()` - Get version string
- `getVersionInfo()` - Get full version metadata
- `getVersionDisplay()` - Get formatted display string

### 4. Header Component Update
**File:** `framework/frontend/layout/components/Header.tsx`

- Now displays dynamic version in user menu dropdown
- Shows "Development" in dev mode
- Shows "v2025.47.2" format in production

### 5. Build Integration
**File:** `client/frontend/package.json`

Added `prebuild` script that runs before every build:
```json
"prebuild": "node ../../scripts/generate-version.mjs"
```

### 6. TypeScript Support
**File:** `client/frontend/src/vite-env.d.ts`

- Type definitions for version environment variables

### 7. Documentation
**File:** `docs/VERSIONING.md`

- Complete documentation of the versioning system
- Usage examples
- Troubleshooting guide

## How to Use

### During Development
Version shows as "Development" - no action needed.

### Building for Production
```bash
npm run build
```

The version is automatically generated and incremented.

### Manual Version Generation
```bash
node scripts/generate-version.mjs
```

### Accessing Version in Code
```typescript
import { getAppVersion, formatVersion } from '@framework/shared/utils/version';

const version = getAppVersion(); // "2025.47.2"
const display = formatVersion(version); // "v2025.47.2"
```

## Files Created/Modified

### Created:
- `scripts/generate-version.mjs` - Version generation script
- `client/frontend/vite-plugins/version-plugin.ts` - Vite plugin
- `framework/frontend/shared/utils/version.ts` - Framework utility
- `client/frontend/src/utils/version.ts` - Client utility
- `client/frontend/src/vite-env.d.ts` - TypeScript declarations
- `docs/VERSIONING.md` - Full documentation
- `.gitignore` - Added version.json to ignore list

### Modified:
- `client/frontend/vite.config.ts` - Added version plugin
- `client/frontend/package.json` - Added prebuild script
- `framework/frontend/layout/components/Header.tsx` - Dynamic version display
- `framework/frontend/layout/components/Header.css` - Version styling (already existed)

## Testing

### Test 1: Generate Version
```bash
node scripts/generate-version.mjs
```
✅ Output: `2025.47.1`

### Test 2: Increment Build
```bash
node scripts/generate-version.mjs
```
✅ Output: `2025.47.2` (incremented)

### Test 3: Build Application
```bash
cd client/frontend
npm run build
```
✅ Version auto-generated and injected

## Version File Location

`version.json` (project root) - Auto-generated, git-ignored

Example content:
```json
{
  "version": "2025.47.2",
  "year": 2025,
  "week": 47,
  "build": 2,
  "timestamp": "2025-11-20T18:09:00.000Z",
  "date": "November 20, 2025 at 10:09 AM"
}
```

## Next Steps

1. ✅ Version system is fully functional
2. ✅ Displays in user menu dropdown
3. ✅ Auto-increments on each build
4. ✅ Works in both dev and production

## Notes

- Version resets build number when week changes
- Week numbers follow ISO 8601 standard (1-53)
- Build number starts at 1 each week
- Development mode shows "Development" instead of version
- Production builds show "v2025.47.2" format
