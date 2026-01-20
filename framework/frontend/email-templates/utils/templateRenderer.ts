/**
 * Template Rendering Utilities
 * 
 * Provides functions for rendering email templates with variable substitution,
 * validation, and HTML/text conversion.
 */

import {
  extractVariables,
  processTemplate
} from './variableSubstitution';
import type {
  TemplateRenderOptions,
  TemplateRenderResult,
  TemplateValidationResponse
} from '../types/template';

/**
 * Render a template with variables
 * 
 * @param template - Template string with {{variable}} syntax
 * @param variables - Variable values
 * @param options - Rendering options
 * @returns Rendering result with HTML, text, and metadata
 * 
 * @example
 * ```ts
 * const result = renderTemplate(
 *   '<p>Hello {{name}}</p>',
 *   { name: 'John Doe' }
 * );
 * // Returns: { html: '<p>Hello John Doe</p>', usedVariables: ['name'], ... }
 * ```
 */
export function renderTemplate(
  template: string,
  variables: Record<string, any>,
  options: TemplateRenderOptions = { variables: {} }
): TemplateRenderResult {
  const {
    escapeHtml = true,
    strict = false,
    defaultValue = ''
  } = options;

  const errors: string[] = [];
  const templateVariables = extractVariables(template);
  const usedVariables: string[] = [];
  const missingVariables: string[] = [];

  // Check for missing variables
  templateVariables.forEach(varName => {
    if (variables[varName] !== undefined && variables[varName] !== null) {
      usedVariables.push(varName);
    } else {
      missingVariables.push(varName);
      if (strict) {
        errors.push(`Missing required variable: ${varName}`);
      }
    }
  });

  // If strict mode and there are errors, return early
  if (strict && errors.length > 0) {
    return {
      html: '',
      usedVariables,
      missingVariables,
      errors
    };
  }

  try {
    // Process template with all features
    const html = processTemplate(template, variables, {
      escapeHtml,
      strict,
      defaultValue
    });

    // Generate plain text version
    const text = htmlToText(html);

    return {
      html,
      text,
      usedVariables,
      missingVariables,
      errors
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Rendering failed');
    return {
      html: '',
      usedVariables,
      missingVariables,
      errors
    };
  }
}

/**
 * Validate template syntax and variables
 * 
 * @param content - Template content
 * @param subject - Template subject
 * @returns Validation result
 * 
 * @example
 * ```ts
 * const result = validateTemplate(
 *   '<p>Hello {{name}}</p>',
 *   'Welcome {{name}}'
 * );
 * // Returns: { isValid: true, errors: [], warnings: [], variables: ['name'] }
 * ```
 */
export function validateTemplate(
  content: string,
  subject: string
): TemplateValidationResponse {
  const errors: string[] = [];
  const warnings: string[] = [];
  const variables: string[] = [];

  // Check for empty content
  if (!content || !content.trim()) {
    errors.push('Template content cannot be empty');
  }

  if (!subject || !subject.trim()) {
    errors.push('Template subject cannot be empty');
  }

  // Extract variables from both content and subject
  const contentVariables = extractVariables(content);
  const subjectVariables = extractVariables(subject);
  const allVariables = [...new Set([...contentVariables, ...subjectVariables])];

  variables.push(...allVariables);

  // Check for malformed variable syntax
  const malformedRegex = /\{[^{]|[^}]\}/g;
  if (malformedRegex.test(content)) {
    errors.push('Template contains malformed variable syntax. Use {{variable_name}} format.');
  }
  if (malformedRegex.test(subject)) {
    errors.push('Subject contains malformed variable syntax. Use {{variable_name}} format.');
  }

  // Check for unclosed conditional blocks
  const ifCount = (content.match(/\{\{#if/g) || []).length;
  const endifCount = (content.match(/\{\{\/if\}\}/g) || []).length;
  if (ifCount !== endifCount) {
    errors.push('Template has unclosed {{#if}} blocks');
  }

  // Check for unclosed loop blocks
  const eachCount = (content.match(/\{\{#each/g) || []).length;
  const endeachCount = (content.match(/\{\{\/each\}\}/g) || []).length;
  if (eachCount !== endeachCount) {
    errors.push('Template has unclosed {{#each}} blocks');
  }

  // Check for basic HTML validity
  const htmlErrors = validateHtml(content);
  errors.push(...htmlErrors);

  // Warnings for best practices
  if (allVariables.length === 0) {
    warnings.push('Template does not contain any variables');
  }

  if (content.length > 100000) {
    warnings.push('Template content is very large (>100KB). Consider simplifying.');
  }

  // Check for potentially dangerous HTML
  if (/<script/i.test(content)) {
    warnings.push('Template contains <script> tags which may be stripped by email clients');
  }

  if (/<iframe/i.test(content)) {
    warnings.push('Template contains <iframe> tags which are not supported by most email clients');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    variables
  };
}

/**
 * Validate HTML structure
 */
function validateHtml(html: string): string[] {
  const errors: string[] = [];
  
  // Check for basic tag matching (simplified)
  const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  const stack: string[] = [];
  const selfClosingTags = new Set(['br', 'hr', 'img', 'input', 'meta', 'link']);
  
  let match;
  while ((match = tagRegex.exec(html)) !== null) {
    const fullTag = match[0];
    const tagName = match[1].toLowerCase();
    
    // Skip self-closing tags
    if (selfClosingTags.has(tagName) || fullTag.endsWith('/>')) {
      continue;
    }
    
    // Closing tag
    if (fullTag.startsWith('</')) {
      if (stack.length === 0) {
        errors.push(`Unexpected closing tag: </${tagName}>`);
      } else {
        const lastTag = stack.pop();
        if (lastTag !== tagName) {
          errors.push(`Mismatched tags: expected </${lastTag}>, found </${tagName}>`);
        }
      }
    } else {
      // Opening tag
      stack.push(tagName);
    }
  }
  
  // Check for unclosed tags
  if (stack.length > 0) {
    errors.push(`Unclosed tags: ${stack.join(', ')}`);
  }
  
  return errors;
}

/**
 * Convert HTML to plain text
 * 
 * @param html - HTML string
 * @returns Plain text version
 */
export function htmlToText(html: string): string {
  let text = html;
  
  // Remove script and style tags with their content
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Replace line breaks
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');
  text = text.replace(/<\/li>/gi, '\n');
  
  // Replace links with text and URL
  text = text.replace(/<a\s+href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '$2 ($1)');
  
  // Remove all other HTML tags
  text = text.replace(/<[^>]+>/g, '');
  
  // Decode HTML entities
  text = decodeHtmlEntities(text);
  
  // Clean up whitespace
  text = text.replace(/\n\s*\n\s*\n/g, '\n\n'); // Multiple newlines to double newline
  text = text.replace(/[ \t]+/g, ' '); // Multiple spaces to single space
  text = text.trim();
  
  return text;
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' '
  };
  
  return text.replace(/&[a-z]+;|&#\d+;/gi, (entity) => {
    return entities[entity.toLowerCase()] || entity;
  });
}

/**
 * Sanitize HTML to remove potentially dangerous content
 * 
 * @param html - HTML string
 * @returns Sanitized HTML
 */
export function sanitizeHtml(html: string): string {
  let sanitized = html;
  
  // Remove script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: URLs
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
  
  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  
  // Remove object and embed tags
  sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  sanitized = sanitized.replace(/<embed\b[^>]*>/gi, '');
  
  return sanitized;
}

/**
 * Inline CSS styles for email compatibility
 * 
 * @param html - HTML string with <style> tags or external styles
 * @returns HTML with inlined styles
 */
export function inlineStyles(html: string): string {
  // This is a simplified version. In production, use a library like 'juice' or 'inline-css'
  // For now, just return the HTML as-is
  return html;
}

/**
 * Optimize template for email clients
 * 
 * @param html - HTML string
 * @returns Optimized HTML
 */
export function optimizeForEmail(html: string): string {
  let optimized = html;
  
  // Sanitize HTML
  optimized = sanitizeHtml(optimized);
  
  // Inline styles (simplified)
  optimized = inlineStyles(optimized);
  
  // Add email-safe DOCTYPE if not present
  if (!optimized.includes('<!DOCTYPE')) {
    optimized = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\n' + optimized;
  }
  
  // Wrap in basic email structure if not present
  if (!optimized.includes('<html')) {
    optimized = `
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body>
  ${optimized}
</body>
</html>`;
  }
  
  return optimized;
}

/**
 * Generate preview text from HTML content
 * 
 * @param html - HTML content
 * @param maxLength - Maximum length of preview text
 * @returns Preview text
 */
export function generatePreviewText(html: string, maxLength: number = 150): string {
  const text = htmlToText(html);
  
  if (text.length <= maxLength) {
    return text;
  }
  
  // Truncate at word boundary
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}
