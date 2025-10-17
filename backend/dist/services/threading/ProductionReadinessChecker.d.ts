import { EventEmitter } from 'events';
import { ThreadingService } from './ThreadingService.js';
import { LoggingService } from './LoggingService.js';
/**
 * Check severity levels
 */
export declare enum CheckSeverity {
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
    CRITICAL = "critical"
}
/**
 * Check status
 */
export declare enum CheckStatus {
    PASS = "pass",
    FAIL = "fail",
    SKIP = "skip"
}
/**
 * Individual readiness check result
 */
export interface ReadinessCheck {
    id: string;
    name: string;
    description: string;
    category: string;
    severity: CheckSeverity;
    status: CheckStatus;
    message: string;
    details?: Record<string, any>;
    recommendation?: string;
    duration: number;
}
/**
 * Overall readiness assessment
 */
export interface ReadinessAssessment {
    overall: 'ready' | 'warning' | 'not_ready';
    score: number;
    timestamp: Date;
    checks: ReadinessCheck[];
    summary: {
        total: number;
        passed: number;
        failed: number;
        warnings: number;
        critical: number;
    };
    recommendations: string[];
}
/**
 * ProductionReadinessChecker validates system readiness for production deployment
 */
export declare class ProductionReadinessChecker extends EventEmitter {
    private threadingService;
    private loggingService;
    private checks;
    constructor(loggingService: LoggingService, threadingService?: ThreadingService);
    /**
     * Run all production readiness checks
     */
    runAllChecks(): Promise<ReadinessAssessment>;
    /**
     * Run system-level checks
     */
    private runSystemChecks;
    /**
     * Run security-related checks
     */
    private runSecurityChecks;
    /**
     * Run configuration checks
     */
    private runConfigurationChecks;
    /**
     * Run performance checks
     */
    private runPerformanceChecks;
    /**
     * Run monitoring checks
     */
    private runMonitoringChecks;
    /**
     * Run threading system specific checks
     */
    private runThreadingChecks;
    /**
     * Run an individual check
     */
    private runCheck;
    /**
     * Calculate overall readiness assessment
     */
    private calculateAssessment;
    /**
     * Get checks by category
     */
    getChecksByCategory(category: string): ReadinessCheck[];
    /**
     * Get failed checks
     */
    getFailedChecks(): ReadinessCheck[];
    /**
     * Get critical issues
     */
    getCriticalIssues(): ReadinessCheck[];
}
//# sourceMappingURL=ProductionReadinessChecker.d.ts.map