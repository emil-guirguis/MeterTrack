export = SettingsService;
declare class SettingsService {
    /**
     * Get company settings from PostgreSQL
     */
    static getCompanySettings(): Promise<{
        id: any;
        name: any;
        logo: null;
        address: {
            street: any;
            city: any;
            state: any;
            zipCode: any;
            country: any;
        };
        contact: {
            phone: any;
            email: any;
            website: any;
        };
        systemConfig: {
            timezone: any;
            currency: any;
            businessHours: any;
        };
        branding: {
            primaryColor: string;
            secondaryColor: string;
            accentColor: string;
            logoUrl: null;
            faviconUrl: null;
            customCss: null;
            emailSignature: null;
        };
        notifications: any;
        createdAt: any;
        updatedAt: any;
    } | null>;
    /**
     * Update company settings
     */
    static updateCompanySettings(updateData: any): Promise<{
        id: any;
        name: any;
        logo: null;
        address: {
            street: any;
            city: any;
            state: any;
            zipCode: any;
            country: any;
        };
        contact: {
            phone: any;
            email: any;
            website: any;
        };
        systemConfig: {
            timezone: any;
            currency: any;
            businessHours: any;
        };
        branding: {
            primaryColor: string;
            secondaryColor: string;
            accentColor: string;
            logoUrl: null;
            faviconUrl: null;
            customCss: null;
            emailSignature: null;
        };
        notifications: any;
        createdAt: any;
        updatedAt: any;
    } | null>;
    /**
     * Create default settings
     */
    static createDefaultSettings(): Promise<{
        id: any;
        name: any;
        logo: null;
        address: {
            street: any;
            city: any;
            state: any;
            zipCode: any;
            country: any;
        };
        contact: {
            phone: any;
            email: any;
            website: any;
        };
        systemConfig: {
            timezone: any;
            currency: any;
            businessHours: any;
        };
        branding: {
            primaryColor: string;
            secondaryColor: string;
            accentColor: string;
            logoUrl: null;
            faviconUrl: null;
            customCss: null;
            emailSignature: null;
        };
        notifications: any;
        createdAt: any;
        updatedAt: any;
    } | null>;
    /**
     * Create new settings record
     */
    static createSettings(settingsData: any): Promise<{
        id: any;
        name: any;
        logo: null;
        address: {
            street: any;
            city: any;
            state: any;
            zipCode: any;
            country: any;
        };
        contact: {
            phone: any;
            email: any;
            website: any;
        };
        systemConfig: {
            timezone: any;
            currency: any;
            businessHours: any;
        };
        branding: {
            primaryColor: string;
            secondaryColor: string;
            accentColor: string;
            logoUrl: null;
            faviconUrl: null;
            customCss: null;
            emailSignature: null;
        };
        notifications: any;
        createdAt: any;
        updatedAt: any;
    } | null>;
    /**
     * Update existing settings record
     */
    static updateSettings(settingsId: any, updateData: any): Promise<{
        id: any;
        name: any;
        logo: null;
        address: {
            street: any;
            city: any;
            state: any;
            zipCode: any;
            country: any;
        };
        contact: {
            phone: any;
            email: any;
            website: any;
        };
        systemConfig: {
            timezone: any;
            currency: any;
            businessHours: any;
        };
        branding: {
            primaryColor: string;
            secondaryColor: string;
            accentColor: string;
            logoUrl: null;
            faviconUrl: null;
            customCss: null;
            emailSignature: null;
        };
        notifications: any;
        createdAt: any;
        updatedAt: any;
    } | null>;
    /**
     * Format settings for frontend compatibility
     */
    static formatSettings(dbRow: any): {
        id: any;
        name: any;
        logo: null;
        address: {
            street: any;
            city: any;
            state: any;
            zipCode: any;
            country: any;
        };
        contact: {
            phone: any;
            email: any;
            website: any;
        };
        systemConfig: {
            timezone: any;
            currency: any;
            businessHours: any;
        };
        branding: {
            primaryColor: string;
            secondaryColor: string;
            accentColor: string;
            logoUrl: null;
            faviconUrl: null;
            customCss: null;
            emailSignature: null;
        };
        notifications: any;
        createdAt: any;
        updatedAt: any;
    } | null;
    /**
     * Convert frontend format back to database format
     */
    static formatForDatabase(frontendData: any): {
        company_name: any;
        company_address_street: any;
        company_address_city: any;
        company_address_state: any;
        company_address_zip_code: any;
        company_address_country: any;
        company_phone: any;
        company_email: any;
        company_website: any;
        default_timezone: any;
        default_currency: any;
        business_hours: string;
        notification_settings: string;
    };
}
//# sourceMappingURL=settingsService.d.ts.map