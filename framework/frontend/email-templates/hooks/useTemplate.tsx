import { useState, useCallback, useEffect } from 'react';
import type {
  EmailTemplate,
  TemplateVariable,
  TemplateValidationResponse,
  TemplatePreviewResponse,
  TemplateRenderOptions,
  TemplateRenderResult
} from '../types/template';
import { renderTemplate, validateTemplate as validateTemplateContent } from '../utils/templateRenderer';
import { substituteVariables } from '../utils/variableSubstitution';

/**
 * Configuration for useTemplate hook
 */
export interface UseTemplateConfig {
  /** Initial template data */
  template?: EmailTemplate;
  /** Available variables for this template */
  availableVariables?: Record<string, TemplateVariable>;
  /** Callback when template is saved */
  onSave?: (template: EmailTemplate) => Promise<void>;
  /** Callback when template is validated */
  onValidate?: (content: string, subject: string) => Promise<TemplateValidationResponse>;
  /** Callback when template is previewed */
  onPreview?: (content: string, subject: string, variables: Record<string, any>) => Promise<TemplatePreviewResponse>;
  /** Auto-validate on content change */
  autoValidate?: boolean;
  /** Validation debounce delay in ms */
  validationDelay?: number;
}

/**
 * Return type for useTemplate hook
 */
export interface UseTemplateReturn {
  // Template state
  template: Partial<EmailTemplate>;
  isModified: boolean;
  isSaving: boolean;
  isValidating: boolean;
  isPreviewing: boolean;
  
  // Validation state
  validationResult: TemplateValidationResponse | null;
  validationErrors: string[];
  validationWarnings: string[];
  
  // Preview state
  previewData: TemplatePreviewResponse | null;
  
  // Template actions
  updateField: (field: keyof EmailTemplate, value: any) => void;
  updateContent: (content: string) => void;
  updateSubject: (subject: string) => void;
  updateVariables: (variables: TemplateVariable[]) => void;
  updateCategory: (category: string) => void;
  
  // Operations
  save: () => Promise<void>;
  validate: () => Promise<TemplateValidationResponse>;
  preview: (variables: Record<string, any>) => Promise<TemplatePreviewResponse>;
  render: (variables: Record<string, any>, options?: TemplateRenderOptions) => TemplateRenderResult;
  reset: () => void;
  
  // Variable helpers
  insertVariable: (variableName: string, format?: string) => void;
  getAvailableVariables: () => Record<string, TemplateVariable>;
  getMissingVariables: () => string[];
  
  // Utility
  canSave: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
}

/**
 * Hook for managing email template state and operations
 * 
 * @param config - Configuration options
 * @returns Template state and operations
 * 
 * @example
 * ```tsx
 * const template = useTemplate({
 *   template: existingTemplate,
 *   availableVariables: categoryVariables,
 *   onSave: async (template) => {
 *     await templateService.updateTemplate(template);
 *   }
 * });
 * 
 * // Update template content
 * template.updateContent('<p>Hello {{recipient_name}}</p>');
 * 
 * // Validate template
 * await template.validate();
 * 
 * // Preview with sample data
 * await template.preview({ recipient_name: 'John Doe' });
 * 
 * // Save template
 * await template.save();
 * ```
 */
export function useTemplate(config: UseTemplateConfig = {}): UseTemplateReturn {
  const {
    template: initialTemplate,
    availableVariables = {},
    onSave,
    onValidate,
    onPreview,
    autoValidate = false,
    validationDelay = 500
  } = config;

  // Template state
  const [template, setTemplate] = useState<Partial<EmailTemplate>>(() => ({
    name: initialTemplate?.name || '',
    subject: initialTemplate?.subject || '',
    content: initialTemplate?.content || '',
    category: initialTemplate?.category || 'general',
    variables: initialTemplate?.variables || [],
    status: initialTemplate?.status || 'draft',
    ...initialTemplate
  }));

  const [originalTemplate] = useState<Partial<EmailTemplate>>(template);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  
  // Validation state
  const [validationResult, setValidationResult] = useState<TemplateValidationResponse | null>(null);
  
  // Preview state
  const [previewData, setPreviewData] = useState<TemplatePreviewResponse | null>(null);

  // Auto-validation timer
  const [validationTimer, setValidationTimer] = useState<NodeJS.Timeout | null>(null);

  // Check if template is modified
  const isModified = JSON.stringify(template) !== JSON.stringify(originalTemplate);

  // Derived state
  const validationErrors = validationResult?.errors || [];
  const validationWarnings = validationResult?.warnings || [];
  const hasErrors = validationErrors.length > 0;
  const hasWarnings = validationWarnings.length > 0;
  const canSave = !isSaving && !hasErrors && template.name && template.subject && template.content;

  /**
   * Update a template field
   */
  const updateField = useCallback((field: keyof EmailTemplate, value: any) => {
    setTemplate(prev => ({ ...prev, [field]: value }));
    
    // Clear validation when content changes
    if (field === 'content' || field === 'subject') {
      setValidationResult(null);
    }
  }, []);

  /**
   * Update template content
   */
  const updateContent = useCallback((content: string) => {
    updateField('content', content);
  }, [updateField]);

  /**
   * Update template subject
   */
  const updateSubject = useCallback((subject: string) => {
    updateField('subject', subject);
  }, [updateField]);

  /**
   * Update template variables
   */
  const updateVariables = useCallback((variables: TemplateVariable[]) => {
    updateField('variables', variables);
  }, [updateField]);

  /**
   * Update template category
   */
  const updateCategory = useCallback((category: string) => {
    updateField('category', category);
  }, [updateField]);

  /**
   * Validate template
   */
  const validate = useCallback(async (): Promise<TemplateValidationResponse> => {
    if (!template.content || !template.subject) {
      const result: TemplateValidationResponse = {
        isValid: false,
        errors: ['Template content and subject are required'],
        warnings: [],
        variables: []
      };
      setValidationResult(result);
      return result;
    }

    setIsValidating(true);
    try {
      let result: TemplateValidationResponse;
      
      if (onValidate) {
        // Use custom validation if provided
        result = await onValidate(template.content, template.subject);
      } else {
        // Use built-in validation
        result = validateTemplateContent(template.content, template.subject);
      }
      
      setValidationResult(result);
      return result;
    } catch (error) {
      const result: TemplateValidationResponse = {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Validation failed'],
        warnings: [],
        variables: []
      };
      setValidationResult(result);
      return result;
    } finally {
      setIsValidating(false);
    }
  }, [template.content, template.subject, onValidate]);

  /**
   * Preview template with sample data
   */
  const preview = useCallback(async (variables: Record<string, any>): Promise<TemplatePreviewResponse> => {
    if (!template.content || !template.subject) {
      throw new Error('Template content and subject are required for preview');
    }

    setIsPreviewing(true);
    try {
      let result: TemplatePreviewResponse;
      
      if (onPreview) {
        // Use custom preview if provided
        result = await onPreview(template.content, template.subject, variables);
      } else {
        // Use built-in preview
        const renderedContent = substituteVariables(template.content, variables);
        const renderedSubject = substituteVariables(template.subject, variables);
        
        result = {
          subject: renderedSubject,
          htmlContent: renderedContent,
          variables
        };
      }
      
      setPreviewData(result);
      return result;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Preview failed');
    } finally {
      setIsPreviewing(false);
    }
  }, [template.content, template.subject, onPreview]);

  /**
   * Render template with variables
   */
  const render = useCallback((
    variables: Record<string, any>,
    options?: TemplateRenderOptions
  ): TemplateRenderResult => {
    if (!template.content) {
      return {
        html: '',
        usedVariables: [],
        missingVariables: [],
        errors: ['Template content is required']
      };
    }

    return renderTemplate(template.content, variables, options);
  }, [template.content]);

  /**
   * Save template
   */
  const save = useCallback(async () => {
    if (!canSave || !onSave) {
      return;
    }

    // Validate before saving
    const validation = await validate();
    if (!validation.isValid) {
      throw new Error('Template validation failed. Please fix errors before saving.');
    }

    setIsSaving(true);
    try {
      await onSave(template as EmailTemplate);
    } finally {
      setIsSaving(false);
    }
  }, [canSave, onSave, template, validate]);

  /**
   * Reset template to original state
   */
  const reset = useCallback(() => {
    setTemplate(originalTemplate);
    setValidationResult(null);
    setPreviewData(null);
  }, [originalTemplate]);

  /**
   * Insert a variable into the template
   */
  const insertVariable = useCallback((variableName: string, format?: string) => {
    let variableString = `{{${variableName}`;
    if (format) {
      variableString += ` | ${format}`;
    }
    variableString += '}}';
    
    // Append to content (in real implementation, this would insert at cursor position)
    updateContent((template.content || '') + variableString);
  }, [template.content, updateContent]);

  /**
   * Get available variables
   */
  const getAvailableVariables = useCallback(() => {
    return availableVariables;
  }, [availableVariables]);

  /**
   * Get missing variables (variables used in template but not defined)
   */
  const getMissingVariables = useCallback(() => {
    if (!validationResult) {
      return [];
    }
    
    const definedVariables = new Set(Object.keys(availableVariables));
    return validationResult.variables.filter(v => !definedVariables.has(v));
  }, [validationResult, availableVariables]);

  // Auto-validation effect
  useEffect(() => {
    if (!autoValidate || !template.content || !template.subject) {
      return;
    }

    // Clear existing timer
    if (validationTimer) {
      clearTimeout(validationTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      validate();
    }, validationDelay);

    setValidationTimer(timer);

    // Cleanup
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [autoValidate, template.content, template.subject, validationDelay]);

  return {
    // State
    template,
    isModified,
    isSaving,
    isValidating,
    isPreviewing,
    validationResult,
    validationErrors,
    validationWarnings,
    previewData,
    
    // Actions
    updateField,
    updateContent,
    updateSubject,
    updateVariables,
    updateCategory,
    
    // Operations
    save,
    validate,
    preview,
    render,
    reset,
    
    // Variable helpers
    insertVariable,
    getAvailableVariables,
    getMissingVariables,
    
    // Utility
    canSave,
    hasErrors,
    hasWarnings
  };
}
