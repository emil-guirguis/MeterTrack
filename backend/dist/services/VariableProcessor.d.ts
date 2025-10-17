export = VariableProcessor;
/**
 * Variable Processor Service
 * Advanced variable processing, validation, and type conversion for email templates
 */
declare class VariableProcessor {
    /**
     * Process and validate variables against template definitions
     */
    static processVariables(variables: any, templateVariables: any, options?: {}): {
        success: boolean;
        variables: {};
        errors: string[];
        warnings: string[];
    };
    /**
     * Convert variable to the specified type
     */
    static convertVariableType(value: any, templateVar: any, options?: {}): any;
    /**
     * Convert to text with sanitization
     */
    static convertToText(value: any, templateVar: any, options?: {}): string;
    /**
     * Convert to number with validation
     */
    static convertToNumber(value: any, templateVar: any): number;
    /**
     * Convert to date with validation
     */
    static convertToDate(value: any, templateVar: any): Date;
    /**
     * Convert to boolean
     */
    static convertToBoolean(value: any, templateVar: any): boolean;
    /**
     * Convert to array with validation
     */
    static convertToArray(value: any, templateVar: any): any;
    /**
     * Convert to object with validation
     */
    static convertToObject(value: any, templateVar: any): any;
    /**
     * Validate a processed variable
     */
    static validateVariable(value: any, templateVar: any): {
        isValid: boolean;
        error: string;
        warnings: any[];
    } | {
        isValid: boolean;
        warnings: string[];
        error?: undefined;
    } | {
        isValid: boolean;
        error: any;
        warnings: string[];
    };
    /**
     * Generate variable schema from template variables
     */
    static generateSchema(templateVariables: any): {
        type: string;
        properties: {};
        required: never[];
    };
    /**
     * Map internal types to JSON Schema types
     */
    static mapTypeToJsonSchema(type: any): any;
    /**
     * Escape HTML characters
     */
    static escapeHtml(text: any): any;
    /**
     * Extract variables from template content
     */
    static extractVariables(templateContent: any): any[];
    /**
     * Check if variable name is a helper function
     */
    static isHelperFunction(variableName: any): boolean;
    /**
     * Validate template syntax
     */
    static validateTemplateSyntax(templateContent: any): {
        isValid: boolean;
        errors: any[];
        warnings: any[];
    };
}
//# sourceMappingURL=VariableProcessor.d.ts.map