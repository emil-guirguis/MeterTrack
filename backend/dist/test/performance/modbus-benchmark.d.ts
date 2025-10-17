export = ModbusBenchmark;
/**
 * Modbus Performance Benchmark Suite
 * Tests the new TypeScript implementation performance
 */
declare class ModbusBenchmark {
    testDeviceIP: string;
    testPort: number;
    testSlaveId: number;
    results: {};
    runAllBenchmarks(): Promise<void>;
    testDeviceAvailability(): Promise<any>;
    benchmarkConnectionPooling(): Promise<void>;
    benchmarkConcurrentConnections(): Promise<void>;
    benchmarkErrorHandling(): Promise<void>;
    benchmarkMemoryUsage(): Promise<void>;
    benchmarkThroughput(): Promise<void>;
    generateReport(): void;
    assessPerformance(): void;
    saveResults(): void;
}
//# sourceMappingURL=modbus-benchmark.d.ts.map