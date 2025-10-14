// Email Templates Entity Store

import type { EmailTemplate } from '../../types/entities';
import { createEntityStore, createEntityHook } from '../slices/createEntitySlice';
import { withApiCall, withTokenRefresh } from '../middleware/apiMiddleware';
import { templateService as api } from '../../services/templateService';

// Real API-backed service adapter for entity store
const templatesService = {
  async getAll(params?: any) {
    return withTokenRefresh(async () => {
      const result = await api.getTemplates({
        page: params?.page,
        pageSize: params?.pageSize,
        sortBy: params?.sortBy,
        sortOrder: params?.sortOrder,
        search: params?.search,
        filters: params?.filters,
      });
      return {
        items: result.items,
        total: result.total,
        hasMore: result.page * result.pageSize < result.total,
      };
    });
  },

  async getById(id: string) {
    return withTokenRefresh(async () => api.getTemplate(id));
  },

  async create(data: Partial<EmailTemplate>) {
    return withTokenRefresh(async () => api.createTemplate(data as any));
  },

  async update(id: string, data: Partial<EmailTemplate>) {
    return withTokenRefresh(async () => api.updateTemplate({ id, ...(data as any) }));
  },

  async delete(_id: string) {
    return withTokenRefresh(async () => api.deleteTemplate(_id));
  },
};

// Create templates store
export const useTemplatesStore = createEntityStore(templatesService, {
  name: 'templates',
  cache: {
    ttl: 15 * 60 * 1000, // 15 minutes
    maxAge: 60 * 60 * 1000, // 1 hour
  },
});

// Create templates hook
export const useTemplates = createEntityHook(useTemplatesStore);

// Enhanced templates hook with additional functionality
export const useTemplatesEnhanced = () => {
  const templates = useTemplates();
  
  return {
    ...templates,
    
    // Additional computed values
    activeTemplates: templates.items.filter(template => template.status === 'active'),
    inactiveTemplates: templates.items.filter(template => template.status === 'inactive'),
    draftTemplates: templates.items.filter(template => template.status === 'draft'),
    
    // Templates by category
    templatesByCategory: templates.items.reduce((acc, template) => {
      const category = template.category || 'Uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(template);
      return acc;
    }, {} as Record<string, EmailTemplate[]>),
    
    // Usage statistics
    mostUsedTemplates: templates.items
      .filter(t => t.usageCount > 0)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10),
    
    recentlyUsedTemplates: templates.items
      .filter(t => t.lastUsed)
      .sort((a, b) => new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime())
      .slice(0, 10),
    
    // Enhanced actions with notifications
    createTemplate: async (data: Partial<EmailTemplate>) => {
      return withApiCall(
        () => templates.createItem(data),
        {
          loadingKey: 'createTemplate',
          showSuccessNotification: true,
          successMessage: 'Email template created successfully',
        }
      );
    },
    
    updateTemplate: async (id: string, data: Partial<EmailTemplate>) => {
      return withApiCall(
        () => templates.updateItem(id, data),
        {
          loadingKey: 'updateTemplate',
          showSuccessNotification: true,
          successMessage: 'Email template updated successfully',
        }
      );
    },
    
    deleteTemplate: async (id: string) => {
      return withApiCall(
        () => templates.deleteItem(id),
        {
          loadingKey: 'deleteTemplate',
          showSuccessNotification: true,
          successMessage: 'Email template deleted successfully',
        }
      );
    },
    
    // Template operations
    duplicateTemplate: async (id: string, newName?: string) => {
      const template = templates.items.find(t => t.id === id);
      if (!template) throw new Error('Template not found');
      
      const duplicatedTemplate = {
        ...template,
        name: newName || `${template.name} (Copy)`,
        usageCount: 0,
        lastUsed: undefined,
      };
      
      delete (duplicatedTemplate as any).id;
      delete (duplicatedTemplate as any).createdAt;
      delete (duplicatedTemplate as any).updatedAt;
      
      return templates.createItem(duplicatedTemplate);
    },
    
    incrementUsage: async (id: string) => {
      const template = templates.items.find(t => t.id === id);
      if (!template) throw new Error('Template not found');
      
      return templates.updateItem(id, {
        usageCount: template.usageCount + 1,
        lastUsed: new Date(),
      });
    },
    
    // Bulk operations
    bulkUpdateStatus: async (templateIds: string[], status: EmailTemplate['status']) => {
      return withApiCall(
        async () => {
          const promises = templateIds.map(id => templates.updateItem(id, { status }));
          await Promise.all(promises);
        },
        {
          loadingKey: 'bulkUpdateTemplates',
          showSuccessNotification: true,
          successMessage: `${templateIds.length} templates updated successfully`,
        }
      );
    },
    
    bulkUpdateCategory: async (templateIds: string[], category: string) => {
      return withApiCall(
        async () => {
          const promises = templateIds.map(id => templates.updateItem(id, { category }));
          await Promise.all(promises);
        },
        {
          loadingKey: 'bulkUpdateTemplateCategory',
          showSuccessNotification: true,
          successMessage: `Category updated for ${templateIds.length} templates`,
        }
      );
    },
    
    // Search and filter helpers
    searchTemplates: (query: string) => {
      templates.setSearch(query);
      templates.fetchItems();
    },
    
    filterByCategory: (category: string) => {
      templates.setFilters({ ...templates.list.filters, category });
      templates.fetchItems();
    },
    
    filterByStatus: (status: string) => {
      templates.setFilters({ ...templates.list.filters, status });
      templates.fetchItems();
    },
    
    // Template rendering helpers
    renderTemplate: (templateId: string, variables: Record<string, any>) => {
      const template = templates.items.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');
      
      let renderedSubject = template.subject;
      let renderedContent = template.content;
      
      // Simple variable substitution (in real app, use a proper template engine)
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        renderedSubject = renderedSubject.replace(new RegExp(placeholder, 'g'), String(value));
        renderedContent = renderedContent.replace(new RegExp(placeholder, 'g'), String(value));
      });
      
      return {
        subject: renderedSubject,
        content: renderedContent,
      };
    },
    
    validateTemplate: (template: Partial<EmailTemplate>) => {
      const errors: string[] = [];
      
      if (!template.name?.trim()) {
        errors.push('Template name is required');
      }
      
      if (!template.subject?.trim()) {
        errors.push('Template subject is required');
      }
      
      if (!template.content?.trim()) {
        errors.push('Template content is required');
      }
      
      // Check for required variables
      const requiredVars = template.variables?.filter(v => v.required) || [];
      const contentVars = template.content?.match(/\{\{(\w+)\}\}/g) || [];
      const subjectVars = template.subject?.match(/\{\{(\w+)\}\}/g) || [];
      
      const usedVars = [...contentVars, ...subjectVars].map(v => v.replace(/[{}]/g, ''));
      
      requiredVars.forEach(reqVar => {
        if (!usedVars.includes(reqVar.name)) {
          errors.push(`Required variable '${reqVar.name}' is not used in template`);
        }
      });
      
      return {
        isValid: errors.length === 0,
        errors,
      };
    },
    
    // Specialized queries
    getTemplatesByCategory: (category: string) =>
      templates.items.filter(t => t.category === category),
    
    getTemplatesByUsage: (minUsage: number) =>
      templates.items.filter(t => t.usageCount >= minUsage),
    
    getUnusedTemplates: () =>
      templates.items.filter(t => t.usageCount === 0),
  };
};