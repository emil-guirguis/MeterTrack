# Backup Forms Directory

This directory contains old form implementations that have been replaced by dynamic schema-loading forms.

## Purpose

These files are kept for reference only and should **NOT** be used in production. They represent the previous implementation approach where schemas were hardcoded in the frontend.

## Migration History

### Old Static Forms (replaced)
- `ContactForm.tsx` - Old static form with hardcoded schema from `contactConfig.ts`
- `DeviceForm.tsx` - Old static form with hardcoded schema from `deviceConfig.ts`
- `LocationForm.tsx` - Old static form with hardcoded schema from `locationConfig.ts`
- `MeterForm.tsx` - Old static form with hardcoded schema from `meterConfig.ts`
- `UserForm.tsx` - Old static form with hardcoded schema from `userConfig.ts`

### Intermediate Dynamic Forms (replaced)
- `ContactFormDynamic.tsx` - Intermediate version during migration
- `DeviceFormDynamic.tsx` - Intermediate version during migration
- `MeterFormDynamic.tsx` - Intermediate version during migration

## Current Implementation

All entities now use dynamic schema loading:
- `client/frontend/src/features/contacts/ContactForm.tsx` - Loads schema from `/api/schema/contact`
- `client/frontend/src/features/devices/DeviceForm.tsx` - Loads schema from `/api/schema/device`
- `client/frontend/src/features/locations/LocationForm.tsx` - Loads schema from `/api/schema/location`
- `client/frontend/src/features/meters/MeterForm.tsx` - Loads schema from `/api/schema/meter`
- `client/frontend/src/features/users/UserForm.tsx` - Loads schema from `/api/schema/user`

## Benefits of Dynamic Schema Loading

1. **Single Source of Truth**: Schema defined only in backend
2. **No Duplication**: Eliminates duplicate schema definitions
3. **Automatic Updates**: Frontend automatically reflects backend schema changes
4. **Reduced Maintenance**: Changes only need to be made in one place
5. **Smaller Bundle Size**: No hardcoded schemas in frontend code

## Related Documentation

See `.kiro/specs/dynamic-schema-migration/` for complete migration documentation:
- `requirements.md` - Migration requirements
- `design.md` - Architecture and design decisions
- `tasks.md` - Implementation tasks

## Cleanup

These backup files can be safely deleted after the migration has been verified stable in production for a reasonable period (e.g., 3-6 months).
