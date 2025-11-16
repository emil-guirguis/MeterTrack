// Email Template Type Definitions

/**
 * Template variable definition
 */
export interface TemplateVariable {
  /** Variable name (used in template as {{name}}) */
  name: string;
  /** Human-readable description */
  description: string;
  /** Variable data type */
  type: 'text' | 'number' | 'date' | 'boolean';
  /** Whether this variable is required */
  required: boolean;
  /** Default value if not provided */
  defaultValue?: any;
  /** Sample value for preview */
  sample?: any;
}

/**
 * Email template entity
 */
export interface EmailTemplate {
  /** Unique template identifier */
  id: string;
  /** Template name */
  name: string;
  /** Email subject line (can contain variables) */
  subject: string;
  /** Template content (HTML with variables) */
  content: string;
  /** Available variables for this template */
  variables: TemplateVariable[];
  /** Template category */
  category: string;
  /** Number of times template has been used */
  usageCount: number;
  /** Template status */
  status: 'active' | 'inactive' | 'draft';
  /** Last time template was used */
  lastUsed?: Date;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Request to create a new template
 */
export interface EmailTemplateCreateRequest {
  name: string;
  subject: string;
  content: string;
  variables: TemplateVariable[];
  category: string;
}

/**
 * Request to update an existing template
 */
export interface EmailTemplateUpdateRequest extends Partial<EmailTemplateCreateRequest> {
  id: string;
  isActive?: boolean;
}

/**
 * Template preview request
 */
export interface TemplatePreviewRequest {
  /** Template ID to preview (if using existing template) */
  templateId?: string;
  /** Template content (if previewing new/modified template) */
  content?: string;
  /** Template subject (if previewing new/modified template) */
  subject?: string;
  /** Variable values for preview */
  variables: Record<string, any>;
}

/**
 * Template preview response
 */
export interface TemplatePreviewResponse {
  /** Rendered subject line */
  subject: string;
  /** Rendered HTML content */
  htmlContent: string;
  /** Rendered plain text content (optional) */
  textContent?: string;
  /** Variables used in rendering */
  variables: Record<string, any>;
}

/**
 * Template validation result
 */
export interface TemplateValidationResponse {
  /** Whether template is valid */
  isValid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
  /** Variables found in template */
  variables: string[];
}

/**
 * Template usage statistics
 */
export interface TemplateUsageStats {
  /** Template ID */
  templateId: string;
  /** Number of times used */
  usageCount: number;
  /** Last usage timestamp */
  lastUsed?: Date;
  /** Success rate (0-1) */
  successRate: number;
  /** Average delivery time in milliseconds */
  avgDeliveryTime: number;
}

/**
 * Template category definition
 */
export interface TemplateCategory {
  /** Category identifier */
  value: string;
  /** Display label */
  label: string;
  /** Category description */
  description?: string;
  /** Available variables for this category */
  availableVariables?: Record<string, TemplateVariable>;
}

/**
 * Variable formatting options
 */
export interface VariableFormat {
  /** Format type */
  type: 'uppercase' | 'lowercase' | 'capitalize' | 'date' | 'currency' | 'number' | 'custom';
  /** Custom format string (for date, currency, number formats) */
  format?: string;
}

/**
 * Template editor configuration
 */
export interface TemplateEditorConfig {
  /** Available variables for insertion */
  availableVariables?: Record<string, TemplateVariable>;
  /** Placeholder text */
  placeholder?: string;
  /** Editor height in pixels */
  height?: number;
  /** Show formatting toolbar */
  showToolbar?: boolean;
  /** Show variable helper panel */
  showVariableHelper?: boolean;
  /** Enable preview */
  enablePreview?: boolean;
  /** Enable validation */
  enableValidation?: boolean;
}

/**
 * Template rendering options
 */
export interface TemplateRenderOptions {
  /** Variable values */
  variables: Record<string, any>;
  /** Escape HTML in variables */
  escapeHtml?: boolean;
  /** Strict mode (throw on missing variables) */
  strict?: boolean;
  /** Default value for missing variables */
  defaultValue?: string;
}

/**
 * Template rendering result
 */
export interface TemplateRenderResult {
  /** Rendered HTML content */
  html: string;
  /** Rendered plain text content */
  text?: string;
  /** Variables used in rendering */
  usedVariables: string[];
  /** Missing variables */
  missingVariables: string[];
  /** Rendering errors */
  errors: string[];
}

/**
 * Template export format
 */
export interface TemplateExport {
  /** Export format version */
  version: string;
  /** Export timestamp */
  exportedAt: Date;
  /** Exported templates */
  templates: EmailTemplate[];
}

/**
 * Template import result
 */
export interface TemplateImportResult {
  /** Number of templates imported */
  imported: number;
  /** Number of templates skipped */
  skipped: number;
  /** Import errors */
  errors: string[];
  /** Imported template IDs */
  templateIds: string[];
}
