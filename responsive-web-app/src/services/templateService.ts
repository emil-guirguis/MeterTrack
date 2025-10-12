import type { 
  EmailTemplate, 
  EmailTemplateCreateRequest, 
  EmailTemplateUpdateRequest,
  ListParams,
  ListResponse,
  ApiResponse 
} from '../types/entities';
import { AppErrorHandler, ErrorCodes, GracefulDegradation } from '../utils/errorHandler';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface TemplatePreviewRequest {
  templateId?: string;
  content?: string;
  subject?: string;
  variables: Record<string, any>;
}

export interface TemplatePreviewResponse {
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: Record<string, any>;
}

export interface TemplateValidationResponse {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  variables: string[];
}

export interface TemplateUsageStats {
  templateId: string;
  usageCount: number;
  lastUsed?: Date;
  successRate: number;
  avgDeliveryTime: number;
}

class TemplateService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = AppErrorHandler.createError(
        response.status === 404 ? ErrorCodes.TEMPLATE_NOT_FOUND :
        response.status === 400 ? ErrorCodes.VALIDATION_ERROR :
        response.status === 401 ? ErrorCodes.AUTHENTICATION_FAILED :
        response.status === 403 ? ErrorCodes.PERMISSION_DENIED :
        ErrorCodes.SERVICE_UNAVAILABLE,
        errorData
      );
      throw error;
    }

    return response.json();
  }

  /**
   * Get all email templates with optional filtering and pagination
   */
  async getTemplates(params?: ListParams): Promise<ListResponse<EmailTemplate>> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);
    if (params?.search) searchParams.append('search', params.search);
    
    // Add filters
    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(`filter.${key}`, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = `/templates${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request<ApiResponse<ListResponse<EmailTemplate>>>(endpoint);
    return response.data;
  }

  /**
   * Get a single template by ID
   */
  async getTemplate(id: string): Promise<EmailTemplate> {
    const response = await this.request<ApiResponse<EmailTemplate>>(`/templates/${id}`);
    return response.data;
  }

  /**
   * Create a new email template
   */
  async createTemplate(data: EmailTemplateCreateRequest): Promise<EmailTemplate> {
    // Validate required fields
    this.validateTemplateData(data);
    
    const response = await this.request<ApiResponse<EmailTemplate>>('/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    return response.data;
  }

  /**
   * Update an existing template
   */
  async updateTemplate(data: EmailTemplateUpdateRequest): Promise<EmailTemplate> {
    if (!data.id) {
      throw new Error('Template ID is required for update');
    }

    // Validate required fields if they are provided
    this.validateTemplateData(data, true);
    
    const response = await this.request<ApiResponse<EmailTemplate>>(`/templates/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    return response.data;
  }

  /**
   * Delete a template
   */
  async deleteTemplate(id: string): Promise<void> {
    await this.request<ApiResponse<void>>(`/templates/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Preview template with sample data
   */
  async previewTemplate(request: TemplatePreviewRequest): Promise<TemplatePreviewResponse> {
    const response = await this.request<ApiResponse<TemplatePreviewResponse>>('/templates/preview', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    
    return response.data;
  }

  /**
   * Validate template syntax and variables
   */
  async validateTemplate(content: string, subject: string): Promise<TemplateValidationResponse> {
    const response = await this.request<ApiResponse<TemplateValidationResponse>>('/templates/validate', {
      method: 'POST',
      body: JSON.stringify({ content, subject }),
    });
    
    return response.data;
  }

  /**
   * Get available variables for a template category
   */
  async getAvailableVariables(category: string): Promise<Record<string, any>> {
    const response = await this.request<ApiResponse<Record<string, any>>>(`/templates/variables/${category}`);
    return response.data;
  }

  /**
   * Get template usage statistics
   */
  async getTemplateStats(templateId?: string): Promise<TemplateUsageStats[]> {
    const endpoint = templateId ? `/templates/${templateId}/stats` : '/templates/stats';
    const response = await this.request<ApiResponse<TemplateUsageStats[]>>(endpoint);
    return response.data;
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category: string): Promise<EmailTemplate[]> {
    const response = await this.getTemplates({
      filters: { category },
    });
    return response.items;
  }

  /**
   * Search templates by name or content
   */
  async searchTemplates(query: string): Promise<EmailTemplate[]> {
    const response = await this.getTemplates({
      search: query,
    });
    return response.items;
  }

  /**
   * Duplicate a template
   */
  async duplicateTemplate(id: string, newName: string): Promise<EmailTemplate> {
    const response = await this.request<ApiResponse<EmailTemplate>>(`/templates/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ name: newName }),
    });
    
    return response.data;
  }

  /**
   * Bulk update template status
   */
  async bulkUpdateStatus(
    templateIds: string[], 
    status: 'active' | 'inactive' | 'draft'
  ): Promise<void> {
    await this.request<ApiResponse<void>>('/templates/bulk-status', {
      method: 'PATCH',
      body: JSON.stringify({ templateIds, status }),
    });
  }

  /**
   * Export templates to JSON
   */
  async exportTemplates(templateIds?: string[]): Promise<Blob> {
    const endpoint = '/templates/export';
    const body = templateIds ? JSON.stringify({ templateIds }) : undefined;
    
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body,
    });

    if (!response.ok) {
      throw new Error('Failed to export templates');
    }

    return response.blob();
  }

  /**
   * Import templates from JSON
   */
  async importTemplates(file: File): Promise<{ imported: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/templates/import`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to import templates');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Private validation methods
   */
  private validateTemplateData(
    data: EmailTemplateCreateRequest | EmailTemplateUpdateRequest, 
    isUpdate = false
  ): void {
    const errors: string[] = [];

    // Required fields for creation, optional for updates
    if (!isUpdate || data.name !== undefined) {
      if (!data.name?.trim()) {
        errors.push('Template name is required');
      }
    }

    if (!isUpdate || data.subject !== undefined) {
      if (!data.subject?.trim()) {
        errors.push('Template subject is required');
      }
    }

    if (!isUpdate || data.content !== undefined) {
      if (!data.content?.trim()) {
        errors.push('Template content is required');
      }
    }

    if (!isUpdate || data.category !== undefined) {
      if (!data.category?.trim()) {
        errors.push('Template category is required');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }
}

// Export singleton instance
export const templateService = new TemplateService();
export default templateService;