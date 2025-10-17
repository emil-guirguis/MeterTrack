declare namespace _default {
    let testEnvironment: string;
    let preset: string;
    let extensionsToTreatAsEsm: string[];
    let transform: {};
    let moduleFileExtensions: string[];
    let testMatch: string[];
    let collectCoverage: boolean;
    let coverageDirectory: string;
    let coverageReporters: string[];
    namespace coverageThreshold {
        namespace global {
            let branches: number;
            let functions: number;
            let lines: number;
            let statements: number;
        }
    }
    let collectCoverageFrom: string[];
    let setupFilesAfterEnv: string[];
    let moduleNameMapping: {
        '^(\\.{1,2}/.*)\\.js$': string;
    };
    let clearMocks: boolean;
    let verbose: boolean;
    let testTimeout: number;
}
export default _default;
//# sourceMappingURL=jest.config.d.ts.map