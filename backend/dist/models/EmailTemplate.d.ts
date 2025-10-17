export = EmailTemplate;
declare class EmailTemplate {
    /**
     * Create a new email template
     */
    static create(templateData: any): Promise<EmailTemplate>;
    /**
     * Find template by ID
     */
    static findById(id: any): Promise<EmailTemplate | null>;
    /**
     * Find template by name
     */
    static findByName(name: any): Promise<EmailTemplate | null>;
    /**
     * Find all templates with optional filters
     */
    static findAll(options?: {}): Promise<{
        templates: EmailTemplate[];
        total: number;
    }>;
    /**
     * Get template statistics
     */
    static getStats(): Promise<any[]>;
    /**
     * Get templates by category
     */
    static findByCategory(category: any): Promise<EmailTemplate[]>;
    /**
     * Get available template categories
     */
    static getCategories(): string[];
    /**
     * Validate template content for variables
     */
    static validateTemplate(content: any, variables?: any[]): {
        isValid: boolean;
        foundVariables: string[];
        missingVariables: string[];
        unusedVariables: any[];
    };
    constructor(templateData?: {});
    id: any;
    name: any;
    subject: any;
    content: any;
    category: any;
    variables: any;
    isdefault: any;
    isactive: any;
    usagecount: any;
    lastused: any;
    createdby: any;
    createdat: any;
    updatedat: any;
    /**
     * Update template
     */
    update(updateData: any): Promise<this>;
    /**
     * Increment usage count
     */
    incrementUsage(): Promise<this>;
    /**
     * Delete template (soft delete by setting isactive to false)
     */
    delete(): Promise<this>;
    /**
     * Hard delete template (only for unused templates)
     */
    hardDelete(): Promise<boolean>;
    /**
     * Convert to JSON (clean format)
     */
    toJSON(): {
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
}
//# sourceMappingURL=EmailTemplate.d.ts.map