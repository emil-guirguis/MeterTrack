/**
 * Variable Substitution Utilities
 * 
 * Provides functions for substituting variables in email templates
 * using Handlebars-style syntax: {{variable_name}}
 */

/**
 * Variable format options
 */
export interface VariableFormatOptions {
  /** Escape HTML in variable values */
  escapeHtml?: boolean;
  /** Default value for missing variables */
  defaultValue?: string;
  /** Strict mode - throw error on missing variables */
  strict?: boolean;
}

/**
 * Extract all variables from a template string
 * 
 * @param template - Template string with {{variable}} syntax
 * @returns Array of variable names found in template
 * 
 * @example
 * ```ts
 * const vars = extractVariables('Hello {{name}}, your order {{order_id}} is ready');
 * // Returns: ['name', 'order_id']
 * ```
 */
export function extractVariables(template: string): string[] {
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = variableRegex.exec(template)) !== null) {
    // Extract variable name (before any pipe for formatting)
    const variableName = match[1].split('|')[0].trim();
    if (!variables.includes(variableName)) {
      variables.push(variableName);
    }
  }

  return variables;
}

/**
 * Substitute variables in a template string
 * 
 * @param template - Template string with {{variable}} syntax
 * @param variables - Object with variable values
 * @param options - Formatting options
 * @returns Template with variables substituted
 * 
 * @example
 * ```ts
 * const result = substituteVariables(
 *   'Hello {{name}}, your balance is {{balance | currency}}',
 *   { name: 'John', balance: 1234.56 }
 * );
 * // Returns: 'Hello John, your balance is $1,234.56'
 * ```
 */
export function substituteVariables(
  template: string,
  variables: Record<string, any>,
  options: VariableFormatOptions = {}
): string {
  const { escapeHtml = true, defaultValue = '', strict = false } = options;

  return template.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
    const parts = expression.split('|').map((p: string) => p.trim());
    const variableName = parts[0];
    const format = parts[1];

    // Get variable value
    let value = variables[variableName];

    // Handle missing variables
    if (value === undefined || value === null) {
      if (strict) {
        throw new Error(`Missing required variable: ${variableName}`);
      }
      return defaultValue;
    }

    // Apply formatting if specified
    if (format) {
      value = applyFormat(value, format);
    }

    // Convert to string
    const stringValue = String(value);

    // Escape HTML if needed
    if (escapeHtml && typeof value === 'string') {
      return escapeHtmlString(stringValue);
    }

    return stringValue;
  });
}

/**
 * Apply formatting to a variable value
 * 
 * @param value - Value to format
 * @param format - Format string (e.g., 'uppercase', 'date', 'currency')
 * @returns Formatted value
 */
function applyFormat(value: any, format: string): any {
  const formatLower = format.toLowerCase();

  switch (formatLower) {
    case 'uppercase':
      return String(value).toUpperCase();
    
    case 'lowercase':
      return String(value).toLowerCase();
    
    case 'capitalize':
      return String(value).charAt(0).toUpperCase() + String(value).slice(1).toLowerCase();
    
    case 'date':
      return formatDate(value);
    
    case 'currency':
      return formatCurrency(value);
    
    case 'number':
      return formatNumber(value);
    
    default:
      // Check for custom format with parameters (e.g., "date:'YYYY-MM-DD'")
      if (format.includes(':')) {
        const [formatType, formatParam] = format.split(':').map(s => s.trim().replace(/['"]/g, ''));
        return applyCustomFormat(value, formatType, formatParam);
      }
      return value;
  }
}

/**
 * Apply custom format with parameters
 */
function applyCustomFormat(value: any, formatType: string, formatParam: string): any {
  switch (formatType.toLowerCase()) {
    case 'date':
      return formatDateCustom(value, formatParam);
    
    case 'number':
      return formatNumberCustom(value, formatParam);
    
    case 'currency':
      return formatCurrencyCustom(value, formatParam);
    
    default:
      return value;
  }
}

/**
 * Format a value as a date
 */
function formatDate(value: any): string {
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return String(value);
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return String(value);
  }
}

/**
 * Format a date with custom format string
 */
function formatDateCustom(value: any, format: string): string {
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return String(value);
    }

    // Simple format string replacement
    let result = format;
    result = result.replace('YYYY', date.getFullYear().toString());
    result = result.replace('MM', String(date.getMonth() + 1).padStart(2, '0'));
    result = result.replace('DD', String(date.getDate()).padStart(2, '0'));
    result = result.replace('HH', String(date.getHours()).padStart(2, '0'));
    result = result.replace('mm', String(date.getMinutes()).padStart(2, '0'));
    result = result.replace('ss', String(date.getSeconds()).padStart(2, '0'));

    return result;
  } catch {
    return String(value);
  }
}

/**
 * Format a value as currency
 */
function formatCurrency(value: any): string {
  try {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return String(value);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  } catch {
    return String(value);
  }
}

/**
 * Format currency with custom currency code
 */
function formatCurrencyCustom(value: any, currency: string): string {
  try {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return String(value);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(num);
  } catch {
    return String(value);
  }
}

/**
 * Format a value as a number
 */
function formatNumber(value: any): string {
  try {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return String(value);
    }
    return new Intl.NumberFormat('en-US').format(num);
  } catch {
    return String(value);
  }
}

/**
 * Format number with custom format string
 */
function formatNumberCustom(value: any, format: string): string {
  try {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return String(value);
    }

    // Parse format string (e.g., "0,0.00" means thousands separator with 2 decimals)
    const hasThousandsSeparator = format.includes(',');
    const decimalMatch = format.match(/\.(\d+)/);
    const decimals = decimalMatch ? decimalMatch[1].length : 0;

    const options: Intl.NumberFormatOptions = {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: hasThousandsSeparator
    };

    return new Intl.NumberFormat('en-US', options).format(num);
  } catch {
    return String(value);
  }
}

/**
 * Escape HTML special characters
 */
function escapeHtmlString(str: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;'
  };

  return str.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Validate that all required variables are present
 * 
 * @param template - Template string
 * @param variables - Available variables
 * @param requiredVariables - List of required variable names
 * @returns Object with validation result and missing variables
 * 
 * @example
 * ```ts
 * const result = validateVariables(
 *   'Hello {{name}}',
 *   { email: 'test@example.com' },
 *   ['name', 'email']
 * );
 * // Returns: { isValid: false, missingVariables: ['name'] }
 * ```
 */
export function validateVariables(
  template: string,
  variables: Record<string, any>,
  requiredVariables?: string[]
): { isValid: boolean; missingVariables: string[] } {
  const templateVariables = extractVariables(template);
  const required = requiredVariables || templateVariables;
  
  const missingVariables = required.filter(
    varName => variables[varName] === undefined || variables[varName] === null
  );

  return {
    isValid: missingVariables.length === 0,
    missingVariables
  };
}

/**
 * Process conditional blocks in template
 * 
 * Supports {{#if condition}}...{{/if}} syntax
 * 
 * @param template - Template string with conditional blocks
 * @param variables - Variable values
 * @returns Template with conditionals processed
 * 
 * @example
 * ```ts
 * const result = processConditionals(
 *   '{{#if show_greeting}}Hello {{name}}{{/if}}',
 *   { show_greeting: true, name: 'John' }
 * );
 * // Returns: 'Hello {{name}}'
 * ```
 */
export function processConditionals(
  template: string,
  variables: Record<string, any>
): string {
  // Process {{#if variable}}...{{/if}} blocks
  return template.replace(
    /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (match, condition, content) => {
      const conditionValue = variables[condition.trim()];
      // Return content if condition is truthy, empty string otherwise
      return conditionValue ? content : '';
    }
  );
}

/**
 * Process loop blocks in template
 * 
 * Supports {{#each items}}...{{/each}} syntax
 * 
 * @param template - Template string with loop blocks
 * @param variables - Variable values
 * @returns Template with loops processed
 * 
 * @example
 * ```ts
 * const result = processLoops(
 *   '{{#each items}}<li>{{name}}</li>{{/each}}',
 *   { items: [{ name: 'Item 1' }, { name: 'Item 2' }] }
 * );
 * // Returns: '<li>{{name}}</li><li>{{name}}</li>'
 * ```
 */
export function processLoops(
  template: string,
  variables: Record<string, any>
): string {
  // Process {{#each array}}...{{/each}} blocks
  return template.replace(
    /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (match, arrayName, content) => {
      const array = variables[arrayName.trim()];
      if (!Array.isArray(array)) {
        return '';
      }
      
      // Repeat content for each item in array
      return array.map(item => {
        // Substitute variables in content with item properties
        return substituteVariables(content, item, { escapeHtml: false });
      }).join('');
    }
  );
}

/**
 * Process all template features (variables, conditionals, loops)
 * 
 * @param template - Template string
 * @param variables - Variable values
 * @param options - Processing options
 * @returns Fully processed template
 * 
 * @example
 * ```ts
 * const result = processTemplate(
 *   'Hello {{name}}! {{#if show_items}}Items: {{#each items}}{{name}}{{/each}}{{/if}}',
 *   { name: 'John', show_items: true, items: [{ name: 'A' }, { name: 'B' }] }
 * );
 * ```
 */
export function processTemplate(
  template: string,
  variables: Record<string, any>,
  options: VariableFormatOptions = {}
): string {
  // Process in order: conditionals, loops, then variables
  let result = template;
  result = processConditionals(result, variables);
  result = processLoops(result, variables);
  result = substituteVariables(result, variables, options);
  return result;
}
