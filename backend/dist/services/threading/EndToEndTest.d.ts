/**
 * Test scenario configuration
 */
export interface TestScenario {
    name: string;
    description: string;
    timeout: number;
    steps: TestStep[];
}
/**
 * Individual test step
 */
export interface TestStep {
    name: string;
    action: () => Promise<void>;
    validation: () => Promise<boolean>;
    timeout?: number;
}
/**
 * Test results
 */
export interface TestResults {
    scenario: string;
    passed: boolean;
    duration: number;
    steps: Array<{
        name: string;
        passed: boolean;
        duration: number;
        error?: string;
    }>;
    error?: string;
}
/**
 * EndToEndTest performs comprehensive system testing
 */
export declare class EndToEndTest {
    private threadingService;
    private loggingService;
    private testResults;
    constructor();
    /**
     * Run all end-to-end tests
     */
    runAllTests(): Promise<TestResults[]>;
    /**
     * Run a specific test scenario
     */
    runScenario(scenario: TestScenario): Promise<TestResults>;
    /**
     * Get all test scenarios
     */
    private getTestScenarios;
    /**
     * Basic lifecycle test scenario
     */
    private getBasicLifecycleScenario;
    /**
     * Message communication test scenario
     */
    private getMessageCommunicationScenario;
    /**
     * Health monitoring test scenario
     */
    private getHealthMonitoringScenario;
    /**
     * Error recovery test scenario
     */
    private getErrorRecoveryScenario;
    /**
     * Resource management test scenario
     */
    private getResourceManagementScenario;
    /**
     * Configuration test scenario
     */
    private getConfigurationScenario;
    /**
     * Load testing scenario
     */
    private getLoadTestingScenario;
    /**
     * Execute function with timeout
     */
    private executeWithTimeout;
    /**
     * Sleep for specified milliseconds
     */
    private sleep;
    /**
     * Print test summary
     */
    private printTestSummary;
    /**
     * Get test results
     */
    getTestResults(): TestResults[];
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
/**
 * Run end-to-end tests (can be called directly)
 */
export declare function runEndToEndTests(): Promise<TestResults[]>;
//# sourceMappingURL=EndToEndTest.d.ts.map