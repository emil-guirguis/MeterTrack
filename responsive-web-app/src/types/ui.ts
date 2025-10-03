// UI and Component Interfaces

import type { ReactNode } from 'react';

// Theme and Responsive Design
export interface Theme {
  mode: 'light' | 'dark';
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      disabled: string;
    };
    border: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  breakpoints: {
    mobile: string;
    tablet: string;
    desktop: string;
    large: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
    fontWeight: {
      light: number;
      normal: number;
      medium: number;
      bold: number;
    };
  };
}

export interface ResponsiveConfig {
  mobile?: any;
  tablet?: any;
  desktop?: any;
  large?: any;
}

// Layout Components
export interface LayoutProps {
  children: ReactNode;
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  loading?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: string;
}

export interface HeaderProps {
  title?: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  notifications?: Notification[];
  onLogout: () => void;
  onToggleSidebar: () => void;
  isMobile: boolean;
}

export interface SidebarProps {
  isCollapsed: boolean;
  isMobile: boolean;
  menuItems: MenuItem[];
  currentPath: string;
  onToggle: () => void;
  onNavigate: (path: string) => void;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  requiredPermission?: string;
  children?: MenuItem[];
  badge?: string | number;
}

// DataTable Component
export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDefinition<T>[];
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  onSelect?: (selectedItems: T[]) => void;
  pagination?: PaginationConfig;
  filters?: FilterConfig[];
  bulkActions?: BulkAction<T>[];
  /** Optional custom actions to render in the top-right of the table header */
  headerActions?: React.ReactNode;
  responsive?: boolean;
  striped?: boolean;
  hoverable?: boolean;
}

export interface ColumnDefinition<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  minWidth?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, item: T, index: number) => ReactNode;
  responsive?: 'hide-mobile' | 'hide-tablet' | 'always-show';
  className?: string;
}

export interface PaginationConfig {
  currentPage: number;
  pageSize: number;
  total: number;
  pageSizeOptions?: number[];
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'dateRange' | 'number' | 'boolean';
  options?: FilterOption[];
  placeholder?: string;
  defaultValue?: any;
}

export interface FilterOption {
  label: string;
  value: any;
}

export interface BulkAction<T> {
  key: string;
  label: string;
  icon?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  confirm?: boolean;
  confirmMessage?: string;
  action: (selectedItems: T[]) => void | Promise<void>;
}

// Form Components
export interface FormModalProps<T> {
  isOpen: boolean;
  title: string;
  data?: T;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (data: T) => void | Promise<void>;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullScreen?: boolean;
}

export interface FormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'file';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  help?: string;
  options?: SelectOption[];
  multiple?: boolean;
  rows?: number;
  accept?: string;
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  autoComplete?: string;
  className?: string;
}

export interface SelectOption {
  label: string;
  value: any;
  disabled?: boolean;
}

export interface FormState<T> {
  data: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isDirty: boolean;
}

// Search and Filter Components
export interface SearchFilterProps {
  placeholder?: string;
  filters?: FilterConfig[];
  onSearch: (query: string) => void;
  onFilter: (filters: Record<string, any>) => void;
  onClear: () => void;
  loading?: boolean;
  showAdvanced?: boolean;
  className?: string;
}

export interface AdvancedFilterProps {
  filters: FilterConfig[];
  values: Record<string, any>;
  onChange: (filters: Record<string, any>) => void;
  onReset: () => void;
}

// Navigation and Routing
export interface RouteConfig {
  path: string;
  component: React.ComponentType<any>;
  exact?: boolean;
  protected?: boolean;
  requiredPermission?: string;
  requiredRole?: string;
  title?: string;
  breadcrumb?: string;
}

export interface NavigationState {
  currentPath: string;
  breadcrumbs: BreadcrumbItem[];
  title: string;
  canGoBack: boolean;
}

// Modal and Dialog Components
export interface ModalProps {
  isOpen: boolean;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullScreen?: boolean;
  closable?: boolean;
  maskClosable?: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

// Notification System
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  closable?: boolean;
  actions?: NotificationAction[];
  createdAt: Date;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  type?: 'primary' | 'secondary';
}

export interface ToastProps {
  notifications: Notification[];
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  onClose: (id: string) => void;
}

// Loading and Empty States
export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  overlay?: boolean;
  className?: string;
}

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  rows?: number;
  avatar?: boolean;
  loading?: boolean;
  children?: ReactNode;
  className?: string;
}

// Card and Panel Components
export interface CardProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  loading?: boolean;
  bordered?: boolean;
  hoverable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: ReactNode;
}

export interface PanelProps {
  title?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  bordered?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: ReactNode;
}

// Button and Action Components
export interface ButtonProps {
  type?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
}

export interface ActionButtonProps extends ButtonProps {
  tooltip?: string;
  confirm?: boolean;
  confirmMessage?: string;
}

// Global UI State
export interface UIState {
  theme: Theme;
  sidebarCollapsed: boolean;
  notifications: Notification[];
  modals: ModalState;
  loading: LoadingState;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export interface ModalState {
  [key: string]: {
    isOpen: boolean;
    data?: any;
    loading?: boolean;
    error?: string;
  };
}

export interface LoadingState {
  global: boolean;
  [key: string]: boolean;
}

// Responsive Hooks and Utilities
export interface UseResponsiveResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLarge: boolean;
  breakpoint: 'mobile' | 'tablet' | 'desktop' | 'large';
}

export interface UseMediaQueryResult {
  matches: boolean;
}

// Error Boundary
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  className?: string;
}

// Accessibility
export interface A11yProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  'aria-disabled'?: boolean;
  role?: string;
  tabIndex?: number;
}

// Component Base Props
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  'data-testid'?: string;
}

// Generic Component Props
export interface ComponentProps extends BaseComponentProps, A11yProps {
  children?: ReactNode;
}