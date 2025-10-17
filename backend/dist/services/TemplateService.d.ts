export = TemplateService;
declare class TemplateService {
    /**
     * Create a new email template
     */
    static createTemplate(templateData: any, userId?: null): Promise<{
        success: boolean;
        data: {
            id: any;
            name: any;
            subject: any;
            content: any;
            category: any;
            variables: any;
            isDefault: any;
            isActive: any;
            usageCount: any;
            lastUsed: any;
            createdBy: any;
            createdAt: any;
            updatedAt: any;
        };
        validation: {
            warnings: any[];
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
        validation?: undefined;
    }>;
    /**
     * Get template by ID
     */
    static getTemplate(templateId: any): Promise<{
        success: boolean;
        data: {
            id: any;
            name: any;
            subject: any;
            content: any;
            category: any;
            variables: any;
            isDefault: any;
            isActive: any;
            usageCount: any;
            lastUsed: any;
            createdBy: any;
            createdAt: any;
            updatedAt: any;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    /**
     * Get all templates with filtering and pagination
     */
    static getTemplates(options?: {}): Promise<{
        success: boolean;
        data: {
            templates: {
                id: any;
                name: any;
                subject: any;
                content: any;
                category: any;
                variables: any;
                isDefault: any;
                isActive: any;
                usageCount: any;
                lastUsed: any;
                createdBy: any;
                createdAt: any;
                updatedAt: any;
            }[];
            pagination: {
                currentPage: number;
                totalPages: number;
                totalItems: number;
                itemsPerPage: number;
                hasNextPage: boolean;
                hasPrevPage: boolean;
            };
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    /**
     * Update an existing template
     */
    static updateTemplate(templateId: any, updateData: any, userId?: null): Promise<{
        success: boolean;
        data: {
            id: any;
            name: any;
            subject: any;
            content: any;
            category: any;
            variables: any;
            isDefault: any;
            isActive: any;
            usageCount: any;
            lastUsed: any;
            createdBy: any;
            createdAt: any;
            updatedAt: any;
        };
        validation: {
            warnings: any[];
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
        validation?: undefined;
    }>;
    /**
     * Delete a template
     */
    static deleteTemplate(templateId: any, force?: boolean): Promise<{
        success: boolean;
        message: string;
        data: {
            id: any;
            action: string;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
        data?: undefined;
    }>;
    /**
     * Get templates by category
     */
    static getTemplatesByCategory(category: any): Promise<{
        success: boolean;
        data: {
            id: any;
            name: any;
            subject: any;
            content: any;
            category: any;
            variables: any;
            isDefault: any;
            isActive: any;
            usageCount: any;
            lastUsed: any;
            createdBy: any;
            createdAt: any;
            updatedAt: any;
        }[];
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    /**
     * Duplicate a template
     */
    static duplicateTemplate(templateId: any, newName: any, userId?: null): Promise<{
        success: boolean;
        data: {
            id: any;
            name: any;
            subject: any;
            content: any;
            category: any;
            variables: any;
            isDefault: any;
            isActive: any;
            usageCount: any;
            lastUsed: any;
            createdBy: any;
            createdAt: any;
            updatedAt: any;
        };
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
        message?: undefined;
    }>;
    /**
     * Get template statistics
     */
    static getTemplateStats(): Promise<{
        success: boolean;
        data: {
            total: number;
            active: number;
            default: number;
            byCategory: {
                meterReadings: number;
                meterErrors: number;
                maintenance: number;
                general: number;
            };
            usage: {
                total: number;
                average: number;
            };
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    /**
     * Validate template content and variables
     */
    static validateTemplateContent(templateData: any): {
        success: boolean;
        data: {
            isValid: boolean;
            errors: string[];
            warnings: any[];
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    };
    /**
     * Get available template categories
     */
    static getCategories(): {
        success: boolean;
        data: {
            value: string;
            label: string;
        }[];
    };
    /**
     * Get available variable types
     */
    static getVariableTypes(): {
        success: boolean;
        data: {
            value: string;
            label: string;
        }[];
    };
    /**
     * Search templates
     */
    static searchTemplates(query: any, options?: {}): Promise<{
        success: boolean;
        data: {
            id: any;
            name: any;
            subject: any;
            category: any;
            usageCount: any;
            lastUsed: any;
        }[];
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    /**
     * Increment template usage
     */
    static recordTemplateUsage(templateId: any): Promise<{
        success: boolean;
        data: {
            id: any;
            usageCount: any;
            lastUsed: any;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    /**
     * Get template usage analytics
     */
    static getUsageAnalytics(options?: {}): Promise<{
        success: boolean;
        data: {
            topTemplates: {
                id: any;
                name: any;
                category: any;
                usageCount: any;
                lastUsed: any;
                createdAt: any;
            }[];
            totalTemplates: number;
            filters: {
                category: any;
                startDate: any;
                endDate: any;
            };
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    /**
     * Bulk operations
     */
    static bulkUpdateTemplates(templateIds: any, updateData: any): Promise<{
        success: boolean;
        data: {
            updated: number;
            failed: number;
            results: {
                id: any;
                success: boolean;
            }[];
            errors: {
                id: any;
                error: any;
            }[];
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
}
//# sourceMappingURL=TemplateService.d.ts.map