"use strict";
/**
 * Template Service
 * Business logic layer for email template management
 */
const EmailTemplate = require('../models/EmailTemplate');
const TemplateValidator = require('./TemplateValidator');
class TemplateService {
    /**
     * Create a new email template
     */
    static async createTemplate(templateData, userId = null) {
        try {
            // Validate template data
            const validation = TemplateValidator.validateTemplate(templateData);
            if (!validation.isValid) {
                throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
            }
            // Check if template name already exists
            const existingTemplate = await EmailTemplate.findByName(templateData.name);
            if (existingTemplate) {
                throw new Error('Template with this name already exists');
            }
            // Create the template
            const template = await EmailTemplate.create({
                ...templateData,
                createdBy: userId
            });
            return {
                success: true,
                data: template.toJSON(),
                validation: {
                    warnings: validation.warnings
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Get template by ID
     */
    static async getTemplate(templateId) {
        try {
            const template = await EmailTemplate.findById(templateId);
            if (!template) {
                throw new Error('Template not found');
            }
            return {
                success: true,
                data: template.toJSON()
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Get all templates with filtering and pagination
     */
    static async getTemplates(options = {}) {
        try {
            const { page = 1, limit = 20, category, search, isActive, isDefault, sortBy = 'createdat', sortOrder = 'desc' } = options;
            // Calculate offset
            const offset = (page - 1) * limit;
            // Build filters
            const filters = {};
            if (category)
                filters.category = category;
            if (isActive !== undefined)
                filters.isActive = isActive;
            if (isDefault !== undefined)
                filters.isDefault = isDefault;
            // Get templates
            const result = await EmailTemplate.findAll({
                filters,
                search,
                sortBy,
                sortOrder,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
            // Calculate pagination info
            const totalPages = Math.ceil(result.total / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;
            return {
                success: true,
                data: {
                    templates: result.templates.map(t => t.toJSON()),
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages,
                        totalItems: result.total,
                        itemsPerPage: parseInt(limit),
                        hasNextPage,
                        hasPrevPage
                    }
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Update an existing template
     */
    static async updateTemplate(templateId, updateData, userId = null) {
        try {
            // Get existing template
            const template = await EmailTemplate.findById(templateId);
            if (!template) {
                throw new Error('Template not found');
            }
            // Check if it's a default template and prevent certain updates
            if (template.isdefault && updateData.isActive === false) {
                throw new Error('Cannot deactivate default templates');
            }
            // Validate update data
            const mergedData = { ...template.toJSON(), ...updateData };
            const validation = TemplateValidator.validateTemplate(mergedData);
            if (!validation.isValid) {
                throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
            }
            // Check for name conflicts if name is being updated
            if (updateData.name && updateData.name !== template.name) {
                const existingTemplate = await EmailTemplate.findByName(updateData.name);
                if (existingTemplate) {
                    throw new Error('Template with this name already exists');
                }
            }
            // Update the template
            const updatedTemplate = await template.update(updateData);
            return {
                success: true,
                data: updatedTemplate.toJSON(),
                validation: {
                    warnings: validation.warnings
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Delete a template
     */
    static async deleteTemplate(templateId, force = false) {
        try {
            const template = await EmailTemplate.findById(templateId);
            if (!template) {
                throw new Error('Template not found');
            }
            // Prevent deletion of default templates unless forced
            if (template.isdefault && !force) {
                throw new Error('Cannot delete default templates. Use force=true to override.');
            }
            // Check if template is in use
            if (template.usagecount > 0 && !force) {
                // Soft delete by deactivating
                await template.update({ isactive: false });
                return {
                    success: true,
                    message: 'Template deactivated (was in use)',
                    data: { id: templateId, action: 'deactivated' }
                };
            }
            else {
                // Hard delete
                await template.hardDelete();
                return {
                    success: true,
                    message: 'Template deleted permanently',
                    data: { id: templateId, action: 'deleted' }
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Get templates by category
     */
    static async getTemplatesByCategory(category) {
        try {
            if (!TemplateValidator.isValidCategory(category)) {
                throw new Error('Invalid category');
            }
            const templates = await EmailTemplate.findByCategory(category);
            return {
                success: true,
                data: templates.map(t => t.toJSON())
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Duplicate a template
     */
    static async duplicateTemplate(templateId, newName, userId = null) {
        try {
            const originalTemplate = await EmailTemplate.findById(templateId);
            if (!originalTemplate) {
                throw new Error('Template not found');
            }
            // Check if new name already exists
            const existingTemplate = await EmailTemplate.findByName(newName);
            if (existingTemplate) {
                throw new Error('Template with this name already exists');
            }
            // Create duplicate
            const duplicateData = {
                name: newName,
                subject: originalTemplate.subject,
                content: originalTemplate.content,
                category: originalTemplate.category,
                variables: originalTemplate.variables,
                isDefault: false // Duplicates are never default
            };
            const duplicate = await EmailTemplate.create({
                ...duplicateData,
                createdBy: userId
            });
            return {
                success: true,
                data: duplicate.toJSON(),
                message: `Template duplicated as "${newName}"`
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Get template statistics
     */
    static async getTemplateStats() {
        try {
            const stats = await EmailTemplate.getStats();
            return {
                success: true,
                data: {
                    total: parseInt(stats.total_templates) || 0,
                    active: parseInt(stats.active_templates) || 0,
                    default: parseInt(stats.default_templates) || 0,
                    byCategory: {
                        meterReadings: parseInt(stats.meter_reading_templates) || 0,
                        meterErrors: parseInt(stats.meter_error_templates) || 0,
                        maintenance: parseInt(stats.maintenance_templates) || 0,
                        general: parseInt(stats.general_templates) || 0
                    },
                    usage: {
                        total: parseInt(stats.total_usage) || 0,
                        average: parseFloat(stats.average_usage) || 0
                    }
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Validate template content and variables
     */
    static validateTemplateContent(templateData) {
        try {
            const validation = TemplateValidator.validateTemplate(templateData);
            return {
                success: true,
                data: {
                    isValid: validation.isValid,
                    errors: validation.errors,
                    warnings: validation.warnings
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Get available template categories
     */
    static getCategories() {
        return {
            success: true,
            data: TemplateValidator.getValidCategories()
        };
    }
    /**
     * Get available variable types
     */
    static getVariableTypes() {
        return {
            success: true,
            data: TemplateValidator.getValidVariableTypes()
        };
    }
    /**
     * Search templates
     */
    static async searchTemplates(query, options = {}) {
        try {
            const { category, isActive = true, limit = 10 } = options;
            const filters = { isActive };
            if (category)
                filters.category = category;
            const result = await EmailTemplate.findAll({
                filters,
                search: query,
                limit: parseInt(limit),
                sortBy: 'usagecount',
                sortOrder: 'desc'
            });
            return {
                success: true,
                data: result.templates.map(t => ({
                    id: t.id,
                    name: t.name,
                    subject: t.subject,
                    category: t.category,
                    usageCount: t.usagecount,
                    lastUsed: t.lastused
                }))
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Increment template usage
     */
    static async recordTemplateUsage(templateId) {
        try {
            const template = await EmailTemplate.findById(templateId);
            if (!template) {
                throw new Error('Template not found');
            }
            await template.incrementUsage();
            return {
                success: true,
                data: {
                    id: templateId,
                    usageCount: template.usagecount,
                    lastUsed: template.lastused
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Get template usage analytics
     */
    static async getUsageAnalytics(options = {}) {
        try {
            const { category, startDate, endDate, limit = 10 } = options;
            // Build filters
            const filters = { isActive: true };
            if (category)
                filters.category = category;
            // Get templates sorted by usage
            const result = await EmailTemplate.findAll({
                filters,
                sortBy: 'usagecount',
                sortOrder: 'desc',
                limit: parseInt(limit)
            });
            const analytics = result.templates.map(template => ({
                id: template.id,
                name: template.name,
                category: template.category,
                usageCount: template.usagecount,
                lastUsed: template.lastused,
                createdAt: template.createdat
            }));
            return {
                success: true,
                data: {
                    topTemplates: analytics,
                    totalTemplates: result.total,
                    filters: { category, startDate, endDate }
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Bulk operations
     */
    static async bulkUpdateTemplates(templateIds, updateData) {
        try {
            const results = [];
            const errors = [];
            for (const templateId of templateIds) {
                try {
                    const result = await this.updateTemplate(templateId, updateData);
                    if (result.success) {
                        results.push({ id: templateId, success: true });
                    }
                    else {
                        errors.push({ id: templateId, error: result.error });
                    }
                }
                catch (error) {
                    errors.push({ id: templateId, error: error.message });
                }
            }
            return {
                success: errors.length === 0,
                data: {
                    updated: results.length,
                    failed: errors.length,
                    results,
                    errors
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}
module.exports = TemplateService;
//# sourceMappingURL=TemplateService.js.map