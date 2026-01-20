/**
 * Dashboard type definitions
 * 
 * Defines types for dashboard layouts, configuration, and state management
 */

import { DashboardConfig } from './config';
import { DashboardLayout, DashboardBreakpoint, GridPosition, DashboardGridItem } from './layout';

/**
 * Supported visualization types for dashboard cards
 */
export type VisualizationType = 'pie' | 'line' | 'bar' | 'area' | 'candlestick';

/**
 * Generic dashboard card interface
 * Extensible to support client-specific properties
 */
export interface DashboardCard {
  /** Card unique identifier */
  id: string | number;
  /** Card title */
  title: string;
  /** Card description */
  description?: string;
  /** Visualization type for this card */
  visualization_type: VisualizationType;
  /** Grid column position (1-based) */
  grid_x?: number;
  /** Grid row position (1-based) */
  grid_y?: number;
  /** Grid column width */
  grid_w?: number;
  /** Grid row height */
  grid_h?: number;
  /** Allow extension with additional properties */
  [key: string]: any;
}

/**
 * Generic aggregated data interface
 * Extensible to support client-specific data structures
 */
export interface AggregatedData {
  /** Card ID this data belongs to */
  card_id: string | number;
  /** Aggregated values (e.g., totals, averages) */
  aggregated_values: Record<string, number>;
  /** Grouped data for detailed visualization */
  grouped_data?: Array<Record<string, any>>;
  /** Allow extension with additional properties */
  [key: string]: any;
}

/**
 * Dashboard layout configuration
 */
export interface DashboardLayout {
  /** Number of columns in the grid */
  columns: number;
  /** Number of rows in the grid (optional, can be auto) */
  rows?: number;
  /** Gap between grid items in pixels or CSS units */
  gap: number | string;
  /** Responsive breakpoints for layout adjustments */
  breakpoints?: DashboardBreakpoint[];
}

/**
 * Responsive breakpoint configuration
 */
export interface DashboardBreakpoint {
  /** Breakpoint name (e.g., 'mobile', 'tablet', 'desktop') */
  name: string;
  /** Maximum width for this breakpoint in pixels */
  maxWidth: number;
  /** Number of columns at this breakpoint */
  columns: number;
  /** Gap size at this breakpoint */
  gap?: number | string;
}

/**
 * Dashboard section configuration
 */
export interface DashboardSection {
  /** Section unique identifier */
  id: string;
  /** Section title */
  title: string;
  /** Section icon (emoji or icon name) */
  icon?: string;
  /** Whether this section is collapsible */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
  /** Section content or widgets */
  content?: React.ReactNode;
  /** Grid layout for this section */
  layout?: DashboardLayout;
}

/**
 * Dashboard state
 */
export interface DashboardState {
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Last update timestamp */
  lastUpdate: Date | null;
  /** Collapsed sections map (sectionId -> isCollapsed) */
  collapsedSections: Record<string, boolean>;
  /** Custom state data */
  data?: any;
}

/**
 * Dashboard actions
 */
export interface DashboardActions {
  /** Refresh dashboard data */
  refresh: () => Promise<void>;
  /** Toggle section collapse state */
  toggleSection: (sectionId: string) => void;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  /** Set error state */
  setError: (error: string | null) => void;
  /** Update dashboard data */
  setData: (data: any) => void;
}

/**
 * Dashboard hook return type
 */
export interface DashboardReturn extends DashboardState, DashboardActions {
  /** Dashboard configuration */
  config: DashboardConfig;
}

/**
 * Grid item position
 */
export interface GridPosition {
  /** Column start position (1-based) */
  column: number;
  /** Row start position (1-based) */
  row: number;
  /** Column span (default: 1) */
  columnSpan?: number;
  /** Row span (default: 1) */
  rowSpan?: number;
}

/**
 * Dashboard grid item
 */
export interface DashboardGridItem {
  /** Item unique identifier */
  id: string;
  /** Grid position */
  position?: GridPosition;
  /** Item content */
  content: React.ReactNode;
  /** Custom className */
  className?: string;
}
