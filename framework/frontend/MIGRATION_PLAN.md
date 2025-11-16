# List Framework Migration Plan

## Overview
Moving the list component framework from `client/frontend` to `framework/frontend` for reusability across projects.

## Files to Move

### 1. Hooks
- `client/frontend/src/hooks/useBaseList.tsx` → `framework/frontend/hooks/useBaseList.tsx`
- `client/frontend/src/hooks/LIST_FRAMEWORK_DOCUMENTATION.md` → `framework/frontend/docs/LIST_FRAMEWORK_DOCUMENTATION.md`
- `client/frontend/src/hooks/MIGRATION_GUIDE.md` → `framework/frontend/docs/MIGRATION_GUIDE.md`
- `client/frontend/src/hooks/EXAMPLES.md` → `framework/frontend/docs/EXAMPLES.md`
- `client/frontend/src/hooks/PERFORMANCE_OPTIMIZATIONS.md` → `framework/frontend/docs/PERFORMANCE_OPTIMIZATIONS.md`

### 2. Components
- `client/frontend/src/components/common/DataList.tsx` → `framework/frontend/components/DataList.tsx`
- `client/frontend/src/components/common/DataTable.tsx` → `framework/frontend/components/DataTable.tsx`
- `client/frontend/src/components/common/DataTable.css` → `framework/frontend/components/DataTable.css`
- `client/frontend/src/components/common/ListFilters.css` → `framework/frontend/components/ListFilters.css`

### 3. Utils
- `client/frontend/src/utils/listHelpers.ts` → `framework/frontend/utils/listHelpers.ts`
- `client/frontend/src/utils/exportHelpers.ts` → `framework/frontend/utils/exportHelpers.ts`
- `client/frontend/src/utils/importHelpers.ts` → `framework/frontend/utils/importHelpers.ts`
- `client/frontend/src/utils/renderHelpers.tsx` → `framework/frontend/utils/renderHelpers.tsx`

### 4. Config Builders
- `client/frontend/src/config/listColumns.ts` → `framework/frontend/config/listColumns.ts`
- `client/frontend/src/config/listFilters.ts` → `framework/frontend/config/listFilters.ts`
- `client/frontend/src/config/listBulkActions.ts` → `framework/frontend/config/listBulkActions.ts`

### 5. Types
- `client/frontend/src/types/list.ts` → `framework/frontend/types/list.ts`
- Relevant parts of `client/frontend/src/types/ui.ts` → `framework/frontend/types/ui.ts`

## Dependencies to Handle

The framework will need to handle these dependencies:
1. **Auth Context**: Make it injectable/configurable
2. **Entity-specific types**: Keep in client, import from framework
3. **Permission system**: Make it generic/injectable

## Import Path Updates

After moving, all imports in `client/frontend` need to be updated from:
```typescript
import { useBaseList } from '../hooks/useBaseList';
```

To:
```typescript
import { useBaseList } from '../../../framework/frontend/hooks/useBaseList';
```

Or better, create a barrel export:
```typescript
import { useBaseList } from '@framework/frontend';
```

## Next Steps
1. Create framework directory structure
2. Copy files to new locations
3. Update imports in framework files
4. Create barrel exports (index.ts files)
5. Update imports in client/frontend
6. Test all list components
7. Update documentation

## Status
- [ ] Directory structure created
- [ ] Files copied
- [ ] Imports updated in framework
- [ ] Barrel exports created
- [ ] Client imports updated
- [ ] Testing complete
- [ ] Documentation updated
