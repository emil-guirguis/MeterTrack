import type { AuthContextProvider } from '../../shared/types/auth';

/**
 * Validation rule types
 */
export type ValidationRuleType = 
  | 'required' 
  | 'email' 
  | 'min' 
  | 'max' 
  | 'minLength'
  | 'maxLength'
  | 'pattern' 
  | 'custom'
  | 'url'
  | 'phone'
  | 'zipCode';

/**
 * Single validation rule
 */
export interface ValidationRule {
  type: ValidationRuleType;
  message: string;
  value?: any;
  validator?: (value: any, formData?: any) => boolean;
}

/**
 * Validation schema for a form
 * Maps field names to arrays of validation rules
 */
export interface ValidationSchema<T = any> {
  [K: string]: ValidationRule[];
}

/**
 * Validation errors object
 * Maps field names to error messages
 */
export interface ValidationErrors {
  [field: string]: string;
}

/**
 * Form permissions for field-level access control
 */
export interface FormPermissions {
  read?: string | string[];
  update?: string | string[];
}

/**
 * Field-level permissions
 */
export interface FieldPermissions {
  read?: string | string[];
  update?: string | string[];
}

/**
 * Form field configuration
 */
export interface FormFieldConfig<T = any> {
  name: keyof T | string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: Array<{ value: any; label: string }>;
  permissions?: FieldPermissions;
  rows?: number; // For textarea
  min?: number; // For number inputs
  max?: number; // For number inputs
  step?: number; // For number inputs
}

/**
 * Form section configuration
 */
export interface FormSectionConfig {
  title: string;
  description?: string;
  fields: FormFieldConfig[];
}

/**
 * Base form configuration
 */
export interface BaseFormConfig<T = any> {
  initialValues: Partial<T>;
  validationSchema?: ValidationSchema<T>;
  onSubmit: (values: T) => Promise<void>;
  authContext?: AuthContextProvider;
  permissions?: FormPermissions;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

/**
 * Form state
 */
export interface FormState<T = any> {
  values: Partial<T>;
  errors: ValidationErrors;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValidating: boolean;
  isDirty: boolean;
  isValid: boolean;
  submitCount: number;
}

/**
 * Form actions
 */
export interface FormActions<T = any> {
  setFieldValue: (field: keyof T | string, value: any) => void;
  setFieldError: (field: string, error: string) => void;
  setFieldTouched: (field: string, touched: boolean) => void;
  setValues: (values: Partial<T>) => void;
  setErrors: (errors: ValidationErrors) => void;
  resetForm: (values?: Partial<T>) => void;
  validateField: (field: string) => Promise<string | undefined>;
  validateForm: () => Promise<boolean>;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  handleChange: (field: keyof T | string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (field: string) => (e: React.FocusEvent) => void;
}

/**
 * Return type for useBaseForm hook
 */
export interface BaseFormReturn<T = any> extends FormState<T>, FormActions<T> {
  // Convenience methods
  getFieldProps: (field: keyof T | string) => {
    name: string;
    value: any;
    onChange: (e: React.ChangeEvent<any>) => void;
    onBlur: (e: React.FocusEvent) => void;
  };
  getFieldMeta: (field: string) => {
    error?: string;
    touched: boolean;
    value: any;
  };
  canReadField: (field: string) => boolean;
  canUpdateField: (field: string) => boolean;
}

/**
 * Form submission result
 */
export interface FormSubmitResult {
  success: boolean;
  errors?: ValidationErrors;
  data?: any;
}
