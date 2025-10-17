export = TemplateValidator;
/**
 * Template Validator Service
 * Validates email template content and variables
 */
declare class TemplateValidator {
    /**
     * Validate template content and variables
     */
    static validateTemplate(templateData: any): {
        isValid: boolean;
        errors: string[];
        warnings: any[];
    };
    /**
     * Validate template variables
     */
    static validateVariables(variables: any): {
        errors: string[];
        warnings: any[];
    };
    /**
     * Validate template syntax and variable usage
     */
    static validateTemplateSyntax(content: any, variables?: any[]): {
        errors: string[];
        warnings: string[];
    };
    /**
     * Basic HTML validation
     */
    static validateBasicHTML(content: any): {
        errors: string[];
        warnings: string[];
    };
    /**
     * Check if category is valid
     */
    static isValidCategory(category: any): boolean;
    /**
     * Check if template name is valid
     */
    static isValidTemplateName(name: any): boolean;
    /**
     * Check if variable name is valid
     */
    static isValidVariableName(name: any): boolean;
    /**
     * Check if variable type is valid
     */
    static isValidVariableType(type: any): boolean;
    /**
     * Check if variable is a helper function (like #each, #if)
     */
    static isHelperFunction(variableName: any): boolean;
    /**
     * Get available template categories
     */
    static getValidCategories(): {
        value: string;
        label: string;
    }[];
    /**
     * Get available variable types
     */
    static getValidVariableTypes(): {
        value: string;
        label: string;
    }[];
}
//# sourceMappingURL=TemplateValidator.d.ts.map