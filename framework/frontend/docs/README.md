# Framework Frontend Documentation

This directory contains the shared UI framework for building consistent applications.

## Structure

The framework is organized by feature domain:

- **shared/** - Cross-domain utilities, types, hooks, and components
- **lists/** - List/table components and utilities
- **forms/** - Form components and utilities
- **dashboards/** - Dashboard layout and widget components
- **reports/** - Report generation and display components
- **email-templates/** - Email template management components

## Usage

Import framework components using the barrel exports:

```typescript
// Import from specific domain
import { useBaseList, DataList } from '../../../framework/frontend/lists';

// Import from root (all domains)
import { useBaseList, useBaseForm } from '../../../framework/frontend';
```

## Documentation

- [Lists Framework](./LISTS.md)
- [Forms Framework](./FORMS.md)
- [Dashboards Framework](./DASHBOARDS.md)
- [Reports Framework](./REPORTS.md)
- [Email Templates Framework](./EMAIL_TEMPLATES.md)

## Requirements

- React 18+
- TypeScript 5.0+
- Modern browser support (ES2020+)
