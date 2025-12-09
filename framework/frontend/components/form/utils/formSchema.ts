/**
 * Form Schema Utilities
 * 
 * Define form structure and API mapping in one place using a schema.
 * This eliminates the need to define fields multiple times.
 */

/**
 * Field definition with optional API mapping
 */
export interface FieldDefinition<TValue = any> {
  /** Field type */
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'phone' | 'url';
  /** Default value */
  default: TValue;
  /** API field name (if different from form field name) */
  apiField?: string;
  /** Transform value when sending to API */
  toApi?: (value: TValue) => any;
  /** Transform value when receiving from API */
  fromApi?: (value: any) => TValue;
  /** Validation rules */
  required?: boolean;
  /** Field label for UI */
  label?: string;
}

/**
 * Form schema definition
 */
export type FormSchema<T> = {
  [K in keyof T]: FieldDefinition<T[K]>;
};

/**
 * Create form utilities from a schema
 */
export function createFormSchema<TForm extends Record<string, any>>(
  schema: FormSchema<TForm>
) {
  /**
   * Get default form data from schema
   */
  function getDefaults(): TForm {
    const defaults: any = {};
    Object.entries(schema).forEach(([key, def]: [string, any]) => {
      defaults[key] = def.default;
    });
    return defaults as TForm;
  }

  /**
   * Transform form data to API format
   */
  function toApi(formData: TForm, additionalFields: Record<string, any> = {}): any {
    const apiData: any = { ...additionalFields };
    
    Object.entries(formData).forEach(([formField, value]) => {
      const fieldDef = schema[formField as keyof TForm] as FieldDefinition;
      
      if (fieldDef) {
        const apiField = fieldDef.apiField || formField;
        const transformedValue = fieldDef.toApi ? fieldDef.toApi(value) : value;
        apiData[apiField] = transformedValue;
      } else {
        // Field not in schema, include as-is
        apiData[formField] = value;
      }
    });
    
    return apiData;
  }

  /**
   * Transform API data to form format
   */
  function fromApi(apiData: any): TForm {
    const formData: any = {};
    
    Object.entries(schema).forEach(([formField, fieldDef]: [string, any]) => {
      const apiField = fieldDef.apiField || formField;
      const apiValue = apiData[apiField];
      
      if (apiValue !== undefined) {
        formData[formField] = fieldDef.fromApi ? fieldDef.fromApi(apiValue) : apiValue;
      } else {
        formData[formField] = fieldDef.default;
      }
    });
    
    return formData as TForm;
  }

  /**
   * Get TypeScript type from schema (for type inference)
   */
  type FormType = TForm;

  return {
    schema,
    getDefaults,
    toApi,
    fromApi,
    // Type helper
    _type: {} as FormType,
  };
}

/**
 * Helper to define a field
 */
export function field<T>(definition: FieldDefinition<T>): FieldDefinition<T> {
  return definition;
}
