export = emailService;
declare const emailService: EmailService;
declare class EmailService {
    transporter: any;
    config: {
        smtp: {
            host: string;
            port: number;
            secure: boolean;
            user: string;
            password: string;
        };
        sender: {
            name: string;
            email: string;
        };
        defaults: {
            replyTo: string | null;
            bcc: string | null;
            priority: string;
        };
        tracking: {
            enabled: boolean;
            baseUrl: string;
        };
        verifyConnection: boolean;
    } | null;
    isInitialized: boolean;
    /**
     * Initialize email service with SMTP configuration
     */
    initialize(config?: null): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    /**
     * Get default SMTP configuration from environment variables
     */
    getDefaultConfig(): {
        smtp: {
            host: string;
            port: number;
            secure: boolean;
            user: string;
            password: string;
        };
        sender: {
            name: string;
            email: string;
        };
        defaults: {
            replyTo: string | null;
            bcc: string | null;
            priority: string;
        };
        tracking: {
            enabled: boolean;
            baseUrl: string;
        };
        verifyConnection: boolean;
    };
    /**
     * Validate email configuration
     */
    validateConfig(config: any): {
        isValid: boolean;
        errors: string[];
    };
    /**
     * Verify SMTP connection
     */
    verifyConnection(): Promise<boolean>;
    /**
     * Send email using template
     */
    sendTemplateEmail(templateId: any, recipients: any, variables?: {}, options?: {}): Promise<{
        success: boolean;
        messageId: any;
        templateId: any;
        recipients: any[];
        warnings: any[];
        error: any;
    } | {
        success: boolean;
        error: any;
        templateId: any;
        recipients: any[];
        messageId?: undefined;
        warnings?: undefined;
    }>;
    /**
     * Send raw email
     */
    sendEmail(emailData: any): Promise<{
        success: boolean;
        messageId: any;
        response: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        messageId?: undefined;
        response?: undefined;
    }>;
    /**
     * Send bulk emails with rate limiting
     */
    sendBulkEmails(emails: any, options?: {}): Promise<{
        success: boolean;
        total: number;
        successful: number;
        failed: number;
        results: any[];
    }>;
    /**
     * Add tracking pixel to HTML content
     */
    addTrackingPixel(html: any, trackingId: any): any;
    /**
     * Log email delivery to database
     */
    logEmailDelivery(logData: any): Promise<void>;
    /**
     * Get email delivery statistics
     */
    getDeliveryStats(options?: {}): Promise<{
        success: boolean;
        stats: any[][];
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        stats?: undefined;
    }>;
    /**
     * Get service health status
     */
    getHealthStatus(): Promise<{
        isHealthy: boolean;
        initialized: boolean;
        config: {
            host: string;
            port: string | number;
            secure: boolean;
        };
        connection: null;
        lastCheck: string;
    } | {
        isHealthy: boolean;
        error: any;
        lastCheck: string;
    }>;
    /**
     * Utility methods
     */
    isValidEmail(email: any): boolean;
    chunkArray(array: any, size: any): any[];
    delay(ms: any): Promise<any>;
    /**
     * Close email service connections
     */
    close(): Promise<void>;
}
//# sourceMappingURL=EmailService.d.ts.map