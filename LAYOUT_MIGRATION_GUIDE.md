# Layout Components Migration Guide

This guide explains how the layout components have been moved to the framework and how client applications should use them.

## Overview

The following components have been moved from `client/frontend/src/components/layout/` to `framework/frontend/layout/`:

- ✅ AppLayout
- ✅ Header
- ✅ Sidebar
- ✅ MobileNav
- ✅ Breadcrumb
- ✅ HamburgerIcon

All associated CSS files have also been moved to the framework.

## Architecture

### Before (Client-Specific)
```
client/frontend/src/components/layout/
├── AppLayout.tsx
├── AppLayout.css
├── Header.tsx
├── Header.css
├── Sidebar.tsx
├── Sidebar.css
├── MobileNav.tsx
├── MobileNav.css
├── Breadcrumb.tsx
└── Breadcrumb.css
```

### After (Framework + Client Wrapper)
```
framework/frontend/layout/
├── components/
│   ├── AppLayout.tsx          # Framework component
│   ├── AppLayout.css
│   ├── Header.tsx
│   ├── Header.css
│   ├── Sidebar.tsx
│   ├── Sidebar.css
│   ├── MobileNav.tsx
│   ├── MobileNav.css
│   ├── Breadcrumb.tsx
│   ├── Breadcrumb.css
│   ├── HamburgerIcon.tsx
│   ├── HamburgerIcon.css
│   └── index.ts
├── types/
│   └── index.ts
├── index.ts
└── README.md

client/frontend/src/components/layout/
└── AppLayoutWrapper.tsx       # Client-specific wrapper
```

## Migration Steps

### Step 1: Update Imports

Replace direct imports of layout components with framework imports:

**Before:**
```typescript
import AppLayout from './components/layout/AppLayout';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
```

**After:**
```typescript
import { AppLayout, Header, Sidebar } from '@framework/layout';
// Or use the client wrapper:
import AppLayoutWrapper from './components/layout/AppLayoutWrapper';
```

### Step 2: Use the Client Wrapper (Recommended)

The easiest migration path is to use the `AppLayoutWrapper` component:

```typescript
// In your main App.tsx or route components
import AppLayoutWrapper from './components/layout/AppLayoutWrapper';

function MyPage() {
  return (
    <AppLayoutWrapper title="My Page" loading={false}>
      <div>Page content here</div>
    </AppLayoutWrapper>
  );
}
```

### Step 3: Configure the Wrapper (If Needed)

If you need to customize the menu items or configuration, edit `AppLayoutWrapper.tsx`:

```typescript
// client/frontend/src/components/layout/AppLayoutWrapper.tsx

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    path: '/dashboard'
  },
  // Add your menu items here
];
```

### Step 4: Remove Old Layout Components (Optional)

Once you've verified everything works with the framework layout, you can remove the old client-specific layout components:

```bash
# Backup first!
rm client/frontend/src/components/layout/AppLayout.tsx
rm client/frontend/src/components/layout/AppLayout.css
rm client/frontend/src/components/layout/Header.tsx
rm client/frontend/src/components/layout/Header.css
rm client/frontend/src/components/layout/Sidebar.tsx
rm client/frontend/src/components/layout/Sidebar.css
rm client/frontend/src/components/layout/MobileNav.tsx
rm client/frontend/src/components/layout/MobileNav.css
rm client/frontend/src/components/layout/Breadcrumb.tsx
rm client/frontend/src/components/layout/Breadcrumb.css
```

**Keep these files:**
- `AppLayoutWrapper.tsx` - Your client-specific configuration
- Any other client-specific layout utilities

## Configuration Reference

### Required Client Implementations

Your client app must provide these implementations:

#### 1. useResponsive Hook

```typescript
// client/frontend/src/hooks/useResponsive.ts
export const useResponsive = () => {
  return {
    isMobile: boolean,
    isTablet: boolean,
    isDesktop: boolean,
    showSidebarInHeader: boolean
  };
};
```

#### 2. UI State Management

```typescript
// client/frontend/src/store/slices/uiSlice.ts
export const useUI = () => {
  return {
    sidebarCollapsed: boolean,
    setSidebarCollapsed: (collapsed: boolean) => void,
    mobileNavOpen: boolean,
    setMobileNavOpen: (open: boolean) => void
  };
};
```

#### 3. Auth Context

```typescript
// client/frontend/src/store/slices/authSlice.ts
export const useAuth = () => {
  return {
    user: { name: string, email: string, avatar?: string },
    logout: () => void,
    checkPermission: (permission?: string) => boolean
  };
};
```

#### 4. Page Title Hook (Optional)

```typescript
// client/frontend/src/hooks/usePageTitle.ts
export const usePageTitle = (title: string) => {
  useEffect(() => {
    document.title = `${title} | My App`;
  }, [title]);
};
```

#### 5. Navigation Utilities (Optional)

```typescript
// client/frontend/src/utils/navigationUtils.ts
export const generateBreadcrumbs = (pathname: string) => {
  // Generate breadcrumbs from pathname
  return breadcrumbs;
};

export const getPageTitle = (pathname: string) => {
  // Get page title from pathname
  return title;
};
```

## Benefits of Framework Layout

### For Client Applications

1. **Reduced Code Duplication**: Share layout code across multiple client apps
2. **Consistent UX**: All apps using the framework have consistent navigation
3. **Easier Maintenance**: Bug fixes and improvements in one place
4. **Faster Development**: New apps can use the layout immediately
5. **Better Testing**: Framework components are tested once, used everywhere

### For Framework

1. **Reusability**: Layout components can be used by any client app
2. **Standardization**: Enforces consistent patterns across applications
3. **Extensibility**: Easy to add new features that benefit all apps
4. **Documentation**: Centralized documentation for layout usage

## Customization

### Theme Customization

Override CSS variables in your client app:

```css
/* client/frontend/src/styles/theme.css */
:root {
  --sidebar-width: 300px;
  --color-primary: #your-brand-color;
  --color-surface: #your-surface-color;
}
```

### Component Customization

If you need to customize a specific component, you can:

1. **Wrap it**: Create a wrapper component that adds client-specific behavior
2. **Extend it**: Use composition to add additional features
3. **Override styles**: Use CSS specificity to override framework styles

Example wrapper:

```typescript
import { Sidebar } from '@framework/layout';

export const CustomSidebar = (props) => {
  // Add client-specific logic
  const handleCustomAction = () => {
    // Custom behavior
  };

  return (
    <div className="custom-sidebar-wrapper">
      <Sidebar {...props} />
      <button onClick={handleCustomAction}>Custom Action</button>
    </div>
  );
};
```

## Troubleshooting

### Import Errors

If you get import errors:

1. Check that `@framework` is properly aliased in your `tsconfig.json` and `vite.config.ts`
2. Verify the framework layout files exist in `framework/frontend/layout/`
3. Restart your development server

### Type Errors

If you get type errors:

1. Ensure you're importing types from `@framework/layout`
2. Check that your client implementations match the expected interfaces
3. Update your `tsconfig.json` to include framework types

### Styling Issues

If styles don't apply correctly:

1. Verify CSS files are being imported
2. Check CSS variable values in your theme
3. Inspect element to see which styles are being applied
4. Check for CSS specificity conflicts

## Testing

After migration, test these scenarios:

- [ ] Desktop layout renders correctly
- [ ] Sidebar collapses/expands
- [ ] Mobile navigation works
- [ ] Breadcrumbs display correctly
- [ ] User menu dropdown works
- [ ] Notifications dropdown works
- [ ] Menu items filter by permissions
- [ ] Navigation between pages works
- [ ] Responsive breakpoints work correctly
- [ ] Keyboard navigation works
- [ ] Screen reader accessibility works

## Rollback Plan

If you need to rollback:

1. Keep the old layout components in a backup branch
2. Revert imports to use old components
3. Remove framework layout imports
4. Restart development server

## Support

For questions or issues:

1. Check the framework layout README: `framework/frontend/layout/README.md`
2. Review example implementation in `client/frontend/src/components/layout/AppLayoutWrapper.tsx`
3. Check type definitions in `framework/frontend/layout/types/index.ts`

## Next Steps

After successful migration:

1. Remove old layout components from client app
2. Update documentation to reference framework layout
3. Consider migrating other shared components to framework
4. Share learnings with other teams using the framework
