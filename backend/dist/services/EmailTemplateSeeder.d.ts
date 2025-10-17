export = EmailTemplateSeeder;
declare class EmailTemplateSeeder {
    /**
     * Seed default email templates
     */
    static seedDefaultTemplates(options?: {}): Promise<{
        created: number;
        skipped: number;
        updated: number;
        errors: number;
        total: number;
    }>;
    /**
     * Seed templates on system initialization (silent mode)
     */
    static seedOnStartup(): Promise<{
        created: number;
        skipped: number;
        updated: number;
        errors: number;
        total: number;
    }>;
    /**
     * Get default template definitions
     */
    static getDefaultTemplates(): {
        name: string;
        subject: string;
        content: string;
        category: string;
        variables: {
            name: string;
            description: string;
            type: string;
            required: boolean;
        }[];
    }[];
    /**
     * Check template system health
     */
    static checkTemplateHealth(): Promise<{
        isHealthy: boolean;
        totalTemplates: number;
        defaultTemplates: number;
        activeTemplates: number;
        requiredTemplates: number;
        missingTemplates: string[];
        categories: {
            meterReadings: number;
            meterErrors: number;
            maintenance: number;
            general: number;
        };
    }>;
    /**
     * Repair template system by seeding missing templates
     */
    static repairTemplates(): Promise<{
        repaired: number;
        created: number;
    }>;
    /**
     * Remove all default templates (for testing/reset purposes)
     */
    static removeDefaultTemplates(): Promise<{
        removed: number;
    }>;
}
//# sourceMappingURL=EmailTemplateSeeder.d.ts.map