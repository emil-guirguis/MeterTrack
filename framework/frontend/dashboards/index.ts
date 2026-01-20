/**
 * Dashboard Framework
 * 
 * Comprehensive framework for building responsive, accessible dashboards with React.
 * 
 * Main Exports:
 * - Components: DashboardPage, DashboardCard, DashboardGrid, DashboardWidget, StatCard, etc.
 * - Hooks: useDashboard, useCardData, useLayout
 * - Types: DashboardCard, DashboardConfig, VisualizationType, etc.
 * - Utilities: formatNumber, formatCurrency, formatPercentage, layout helpers, validators
 * - Examples: Reference implementations for common dashboard patterns
 * 
 * Quick Start:
 * ```tsx
 * import { useDashboard, DashboardGrid, StatCard, formatNumber } from '@framework/dashboards';
 * 
 * function MyDashboard() {
 *   const dashboard = useDashboard({
 *     id: 'my-dashboard',
 *     layout: { columns: 3, gap: 16 },
 *     fetchData: async () => { /* ... */ }
 *   });
 *   
 *   return (
 *     <DashboardGrid layout={dashboard.config.layout}>
 *       <StatCard title="Metric" value={dashboard.data?.metric} />
 *     </DashboardGrid>
 *   );
 * }
 * ```
 */

// Types - Generic interfaces and type definitions
export * from './types';

// Hooks - State management and data fetching
export * from './hooks';

// Components - Reusable UI components
export * from './components';

// Utilities - Helper functions for formatting, layout, and validation
export * from './utils';

// Examples - Reference implementations
export * from './examples';
