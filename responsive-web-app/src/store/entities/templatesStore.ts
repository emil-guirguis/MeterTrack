// Email Templates Entity Store

import type { EmailTemplate } from '../../types/entities';
import { createEntityStore, createEntityHook } from '../slices/createEntitySlice';
import { withApiCall, withTokenRefresh } from '../middleware/apiMiddleware';

// Mock service for now - will be replaced with actual API service
const templatesService = {
  async getAll(params?: any) {
    return withTokenRefresh(async () => {
      // Mock implementation
      const mockTemplates: EmailTemplate[] = [
        {
          id: '1',
          name: 'Welcome Email',
          subject: 'Welcome to {{company_name}}',
          content: `
            <h1>Welcome {{customer_name}}!</h1>
            <p>Thank you for choosing {{company_name}} for your facility management needs.</p>
            <p>Your account has been set up and you can now access our services.</p>
            <p>If you have any questions, please contact us at {{support_email}}.</p>
            <p>Best regards,<br>{{company_name}} Team</p>
          `,
          variables: [
            { name: 'customer_name', description: 'Customer name', type: 'text', required: true },
            { name: 'company_name', description: 'Company name', type: 'text', required: true },
            { name: 'support_email', description: 'Support email address', type: 'text', required: true },
          ],
          category: 'Customer Onboarding',
          status: 'active',
          usageCount: 45,
          lastUsed: new Date('2024-11-28'),
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
        },
        {
          id: '2',
          name: 'Maintenance Notification',
          subject: 'Scheduled Maintenance - {{building_name}}',
          content: `
            <h2>Maintenance Notification</h2>
            <p>Dear {{contact_name}},</p>
            <p>This is to inform you that scheduled maintenance will be performed on the following:</p>
            <ul>
              <li><strong>Building:</strong> {{building_name}}</li>
              <li><strong>Equipment:</strong> {{equipment_name}}</li>
              <li><strong>Date:</strong> {{maintenance_date}}</li>
              <li><strong>Time:</strong> {{maintenance_time}}</li>
              <li><strong>Duration:</strong> {{estimated_duration}}</li>
            </ul>
            <p>{{maintenance_description}}</p>
            <p>Please contact us if you have any concerns.</p>
            <p>Best regards,<br>Maintenance Team</p>
          `,
          variables: [
            { name: 'contact_name', description: 'Contact person name', type: 'text', required: true },
            { name: 'building_name', description: 'Building name', type: 'text', required: true },
            { name: 'equipment_name', description: 'Equipment name', type: 'text', required: true },
            { name: 'maintenance_date', description: 'Maintenance date', type: 'date', required: true },
            { name: 'maintenance_time', description: 'Maintenance time', type: 'text', required: true },
            { name: 'estimated_duration', description: 'Estimated duration', type: 'text', required: false },
            { name: 'maintenance_description', description: 'Maintenance description', type: 'text', required: false },
          ],
          category: 'Maintenance',
          status: 'active',
          usageCount: 23,
          lastUsed: new Date('2024-11-30'),
          createdAt: new Date('2024-01-05'),
          updatedAt: new Date('2024-02-10'),
        },
        {
          id: '3',
          name: 'Invoice Reminder',
          subject: 'Payment Reminder - Invoice {{invoice_number}}',
          content: `
            <h2>Payment Reminder</h2>
            <p>Dear {{customer_name}},</p>
            <p>This is a friendly reminder that payment for the following invoice is due:</p>
            <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0;">
              <p><strong>Invoice Number:</strong> {{invoice_number}}</p>
              <p><strong>Amount Due:</strong> $\{{amount_due}}</p>
              <p><strong>Due Date:</strong> {{due_date}}</p>
              <p><strong>Services:</strong> {{service_description}}</p>
            </div>
            <p>Please remit payment at your earliest convenience to avoid any late fees.</p>
            <p>If you have already sent payment, please disregard this notice.</p>
            <p>Thank you for your business!</p>
            <p>Accounting Department<br>{{company_name}}</p>
          `,
          variables: [
            { name: 'customer_name', description: 'Customer name', type: 'text', required: true },
            { name: 'invoice_number', description: 'Invoice number', type: 'text', required: true },
            { name: 'amount_due', description: 'Amount due', type: 'number', required: true },
            { name: 'due_date', description: 'Due date', type: 'date', required: true },
            { name: 'service_description', description: 'Service description', type: 'text', required: false },
            { name: 'company_name', description: 'Company name', type: 'text', required: true },
          ],
          category: 'Billing',
          status: 'active',
          usageCount: 67,
          lastUsed: new Date('2024-12-01'),
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-03-05'),
        },
        {
          id: '4',
          name: 'Service Completion',
          subject: 'Service Completed - {{service_type}}',
          content: `
            <h2>Service Completion Notice</h2>
            <p>Dear {{customer_name}},</p>
            <p>We are pleased to inform you that the following service has been completed:</p>
            <div style="border-left: 4px solid #4CAF50; padding-left: 15px; margin: 15px 0;">
              <p><strong>Service Type:</strong> {{service_type}}</p>
              <p><strong>Location:</strong> {{building_name}}</p>
              <p><strong>Completion Date:</strong> {{completion_date}}</p>
              <p><strong>Technician:</strong> {{technician_name}}</p>
            </div>
            <p><strong>Work Summary:</strong></p>
            <p>{{work_summary}}</p>
            {{#if recommendations}}
            <p><strong>Recommendations:</strong></p>
            <p>{{recommendations}}</p>
            {{/if}}
            <p>Thank you for choosing our services. Please don't hesitate to contact us if you have any questions.</p>
            <p>Best regards,<br>Service Team</p>
          `,
          variables: [
            { name: 'customer_name', description: 'Customer name', type: 'text', required: true },
            { name: 'service_type', description: 'Type of service', type: 'text', required: true },
            { name: 'building_name', description: 'Building name', type: 'text', required: true },
            { name: 'completion_date', description: 'Completion date', type: 'date', required: true },
            { name: 'technician_name', description: 'Technician name', type: 'text', required: true },
            { name: 'work_summary', description: 'Summary of work performed', type: 'text', required: true },
            { name: 'recommendations', description: 'Recommendations', type: 'text', required: false },
          ],
          category: 'Service',
          status: 'active',
          usageCount: 34,
          lastUsed: new Date('2024-11-29'),
          createdAt: new Date('2024-01-20'),
          updatedAt: new Date('2024-04-12'),
        },
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 350));

      // Apply filters and pagination
      let filteredTemplates = mockTemplates;
      
      if (params?.search) {
        const search = params.search.toLowerCase();
        filteredTemplates = filteredTemplates.filter(template =>
          template.name.toLowerCase().includes(search) ||
          template.subject.toLowerCase().includes(search) ||
          template.category.toLowerCase().includes(search) ||
          template.content.toLowerCase().includes(search)
        );
      }

      if (params?.filters?.category) {
        filteredTemplates = filteredTemplates.filter(template => template.category === params.filters.category);
      }

      if (params?.filters?.status) {
        filteredTemplates = filteredTemplates.filter(template => template.status === params.filters.status);
      }

      // Sort
      if (params?.sortBy) {
        filteredTemplates.sort((a, b) => {
          let aVal = (a as any)[params.sortBy];
          let bVal = (b as any)[params.sortBy];
          
          const order = params.sortOrder === 'desc' ? -1 : 1;
          
          if (aVal < bVal) return -1 * order;
          if (aVal > bVal) return 1 * order;
          return 0;
        });
      }

      // Paginate
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 20;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedTemplates = filteredTemplates.slice(startIndex, endIndex);

      return {
        items: paginatedTemplates,
        total: filteredTemplates.length,
        hasMore: endIndex < filteredTemplates.length,
      };
    });
  },

  async getById(id: string) {
    return withTokenRefresh(async () => {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 250));
      
      const mockTemplate: EmailTemplate = {
        id,
        name: `Template ${id}`,
        subject: `Subject ${id}`,
        content: `<p>Template content ${id}</p>`,
        variables: [],
        category: 'General',
        status: 'active',
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return mockTemplate;
    });
  },

  async create(data: Partial<EmailTemplate>) {
    return withTokenRefresh(async () => {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newTemplate: EmailTemplate = {
        id: Date.now().toString(),
        name: data.name || '',
        subject: data.subject || '',
        content: data.content || '',
        variables: data.variables || [],
        category: data.category || 'General',
        status: data.status || 'active',
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return newTemplate;
    });
  },

  async update(id: string, data: Partial<EmailTemplate>) {
    return withTokenRefresh(async () => {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 450));
      
      const updatedTemplate: EmailTemplate = {
        id,
        name: data.name || `Template ${id}`,
        subject: data.subject || `Subject ${id}`,
        content: data.content || `<p>Template content ${id}</p>`,
        variables: data.variables || [],
        category: data.category || 'General',
        status: data.status || 'active',
        usageCount: data.usageCount || 0,
        lastUsed: data.lastUsed,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      };

      return updatedTemplate;
    });
  },

  async delete(_id: string) {
    return withTokenRefresh(async () => {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 300));
      // In real implementation, this would make DELETE request
    });
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