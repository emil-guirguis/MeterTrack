export = TemplateRenderer;
declare class TemplateRenderer {
    /**
     * Render a template with provided variables and comprehensive processing
     */
    static renderTemplate(templateId: any, variables?: {}, options?: {}): Promise<{
        success: boolean;
        data: {
            id: any;
            name: any;
            category: any;
            renderedSubject: any;
            renderedContent: any;
            variables: {};
            warnings: any[];
            variableErrors: string[];
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    /**
     * Render template content with variables
     */
    static renderContent(subject: any, content: any, templateVariables?: any[], variables?: {}, options?: {}): {
        subject: any;
        content: any;
        processedVariables: {};
        warnings: any[];
    };
    /**
     * Process a template string with variable substitution, conditionals, and loops
     */
    static processTemplateString(templateString: any, templateVariables: any, variables: any, context: any): any;
    /**
     * Format variable based on its type and definition
     */
    static formatVariable(value: any, variableDef: any, context: any): string;
    /**
     * Format date values
     */
    static formatDate(value: any, format?: string): string;
    /**
     * Format number values
     */
    static formatNumber(value: any, format: any): string;
    /**
     * Format boolean values
     */
    static formatBoolean(value: any): "Yes" | "No";
    /**
     * Format array values (for simple display)
     */
    static formatArray(value: any, variableDef: any): string;
    /**
     * Format object values (for simple display)
     */
    static formatObject(value: any, variableDef: any): string;
    /**
     * Process block helpers (conditionals and loops) with full implementation
     */
    static processBlockHelpers(templateString: any, templateVariables: any, variables: any, context: any): any;
    /**
     * Process #each loops with full implementation
     */
    static processEachBlocks(templateString: any, variables: any, context: any): any;
    /**
     * Process #if conditional blocks (with support for nesting)
     */
    static processIfBlocks(templateString: any, variables: any, context: any): any;
    /**
     * Process #unless conditional blocks (with support for nesting)
     */
    static processUnlessBlocks(templateString: any, variables: any, context: any): any;
    /**
     * Process #with context blocks (with support for nested blocks)
     */
    static processWithBlocks(templateString: any, variables: any, context: any): any;
    /**
     * Check if variable is a helper function
     */
    static isHelperFunction(variableName: any): boolean;
    /**
     * Sanitize HTML content to prevent XSS attacks
     */
    static sanitizeHtml(content: any): any;
    /**
     * Evaluate conditional expressions with enhanced support
     */
    static evaluateCondition(condition: any, variables: any, context: any): any;
    /**
     * Evaluate complex conditions with parentheses
     */
    static evaluateComplexCondition(condition: any, variables: any, context: any): any;
    /**
     * Check if a value is truthy according to template logic
     */
    static isTruthy(value: any): boolean;
    /**
     * Get variable value with support for nested properties
     */
    static getVariableValue(variablePath: any, variables: any): any;
    /**
     * Escape HTML characters
     */
    static escapeHtml(text: any): any;
    /**
     * Preview template with sample data
     */
    static previewTemplate(templateId: any, sampleData?: {}): Promise<{
        success: boolean;
        data: {
            id: any;
            name: any;
            category: any;
            preview: {
                subject: any;
                content: any;
                sampleData: any;
            };
            warnings: any[];
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    /**
     * Generate sample data for template variables
     */
    static generateSampleData(templateVariables: any, category: any): {};
    /**
     * Generate sample value for a variable
     */
    static generateSampleValue(variable: any, category: any): any;
    /**
     * Generate sample text based on variable name
     */
    static generateSampleText(variableName: any): string;
    /**
     * Generate sample number based on variable name
     */
    static generateSampleNumber(variableName: any): number;
    /**
     * Generate sample array based on variable name
     */
    static generateSampleArray(variableName: any): string[] | {
        meter_id: string;
        usage: number;
    }[] | {
        task_description: string;
    }[];
    /**
     * Validate template syntax and variable usage
     */
    static validateTemplate(subject: any, content: any, templateVariables?: any[]): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
        usedVariables: any[];
        definedVariables: any[];
        undefinedVariables: any[];
        unusedVariables: any[];
    };
    /**
     * Get variable schema for a template
     */
    static getVariableSchema(templateVariables: any): {
        type: string;
        properties: {};
        required: never[];
    };
}
//# sourceMappingURL=TemplateRenderer.d.ts.map