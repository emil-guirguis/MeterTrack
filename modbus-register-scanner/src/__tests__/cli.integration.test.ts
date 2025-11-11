// import { spawn, ChildProcess } from 'child_process';
// import * as fs from 'fs/promises';
// import * as path from 'path';
// import { existsSync } from 'fs';

// describe('CLI Integration Tests', () => {
//   const testOutputDir = path.join(__dirname, 'test-output');
//   const cliPath = path.join(__dirname, '../../dist/index.js');
  
//   beforeAll(async () => {
//     // Ensure output directory exists
//     if (!existsSync(testOutputDir)) {
//       await fs.mkdir(testOutputDir, { recursive: true });
//     }
//   });

//   afterEach(async () => {
//     // Clean up test output files
//     try {
//       const files = await fs.readdir(testOutputDir);
//       for (const file of files) {
//         await fs.unlink(path.join(testOutputDir, file));
//       }
//     } catch (error) {
//       // Ignore if directory doesn't exist
//     }
//   });

//   afterAll(async () => {
//     // Clean up test directory
//     try {
//       await fs.rm(testOutputDir, { recursive: true, force: true });
//     } catch (error) {
//       // Ignore if directory doesn't exist
//     }
//   });

//   /**
//    * Helper function to run CLI command and capture output
//    */
//   const runCLI = (args: string[], timeout: number = 10000): Promise<{
//     exitCode: number;
//     stdout: string;
//     stderr: string;
//   }> => {
//     return new Promise((resolve, reject) => {
//       const child = spawn('node', [cliPath, ...args], {
//         cwd: testOutputDir,
//         stdio: 'pipe'
//       });

//       let stdout = '';
//       let stderr = '';

//       child.stdout?.on('data', (data) => {
//         stdout += data.toString();
//       });

//       child.stderr?.on('data', (data) => {
//         stderr += data.toString();
//       });

//       const timeoutId = setTimeout(() => {
//         child.kill('SIGTERM');
//         reject(new Error(`CLI command timed out after ${timeout}ms`));
//       }, timeout);

//       child.on('close', (code) => {
//         clearTimeout(timeoutId);
//         resolve({
//           exitCode: code || 0,
//           stdout,
//           stderr
//         });
//       });

//       child.on('error', (error) => {
//         clearTimeout(timeoutId);
//         reject(error);
//       });
//     });
//   };

//   describe('CLI Argument Parsing', () => {
//     it('should display help when no arguments provided', async () => {
//       const result = await runCLI(['--help']);
      
//       expect(result.exitCode).toBe(0);
//       expect(result.stdout).toContain('Scan Modbus TCP devices to discover available registers');
//       expect(result.stdout).toContain('Examples:');
//       expect(result.stdout).toContain('--host');
//       expect(result.stdout).toContain('--port');
//       expect(result.stdout).toContain('--slave-id');
//     });

//     it('should show version information', async () => {
//       const result = await runCLI(['--version']);
      
//       expect(result.exitCode).toBe(0);
//       expect(result.stdout).toContain('1.0.0');
//     });

//     it('should require host parameter', async () => {
//       const result = await runCLI([]);
      
//       expect(result.exitCode).toBe(1);
//       expect(result.stderr).toContain('required option');
//       expect(result.stderr).toContain('host');
//     });

//     it('should validate IP address format', async () => {
//       const result = await runCLI(['--host', 'invalid-ip']);
      
//       expect(result.exitCode).toBe(1);
//       expect(result.stderr).toContain('Invalid IP address format');
//     });

//     it('should validate port range', async () => {
//       const result = await runCLI(['--host', '192.168.1.100', '--port', '70000']);
      
//       expect(result.exitCode).toBe(1);
//       expect(result.stderr).toContain('Port must be between 1 and 65535');
//     });

//     it('should validate slave ID range', async () => {
//       const result = await runCLI(['--host', '192.168.1.100', '--slave-id', '300']);
      
//       expect(result.exitCode).toBe(1);
//       expect(result.stderr).toContain('Slave ID must be between 1 and 247');
//     });

//     it('should validate timeout minimum', async () => {
//       const result = await runCLI(['--host', '192.168.1.100', '--timeout', '500']);
      
//       expect(result.exitCode).toBe(1);
//       expect(result.stderr).toContain('Timeout must be at least 1000ms');
//     });

//     it('should validate batch size range', async () => {
//       const result = await runCLI(['--host', '192.168.1.100', '--batch-size', '200']);
      
//       expect(result.exitCode).toBe(1);
//       expect(result.stderr).toContain('Batch size must be between 1 and 125');
//     });

//     it('should validate address range', async () => {
//       const result = await runCLI([
//         '--host', '192.168.1.100',
//         '--start-address', '1000',
//         '--end-address', '500'
//       ]);
      
//       expect(result.exitCode).toBe(1);
//       expect(result.stderr).toContain('Start address must be less than or equal to end address');
//     });

//     it('should validate function codes', async () => {
//       const result = await runCLI([
//         '--host', '192.168.1.100',
//         '--function-codes', '1,2,5,3'
//       ]);
      
//       expect(result.exitCode).toBe(1);
//       expect(result.stderr).toContain('Invalid function code: 5');
//     });

//     it('should validate export format', async () => {
//       const result = await runCLI([
//         '--host', '192.168.1.100',
//         '--format', 'xml'
//       ]);
      
//       expect(result.exitCode).toBe(1);
//       expect(result.stderr).toContain('Invalid export format: xml');
//     });
//   });

//   describe('Configuration Display', () => {
//     it('should display configuration with default values', async () => {
//       // This test will fail with connection error, but we can check the config display
//       const result = await runCLI(['--host', '192.168.1.100'], 5000);
      
//       expect(result.stdout).toContain('Modbus Register Scanner');
//       expect(result.stdout).toContain('Target: 192.168.1.100:502');
//       expect(result.stdout).toContain('Slave ID: 1');
//       expect(result.stdout).toContain('Timeout: 5000ms');
//       expect(result.stdout).toContain('Retries: 3');
//       expect(result.stdout).toContain('Batch Size: 125');
//       expect(result.stdout).toContain('Address Range: 0 - 65535');
//       expect(result.stdout).toContain('Function Codes: 1, 2, 3, 4');
//       expect(result.stdout).toContain('Batching: Enabled');
//       expect(result.stdout).toContain('Export Format: both');
//     });

//     it('should display configuration with custom values', async () => {
//       const result = await runCLI([
//         '--host', '10.0.0.50',
//         '--port', '1502',
//         '--slave-id', '5',
//         '--timeout', '10000',
//         '--retries', '5',
//         '--batch-size', '50',
//         '--start-address', '1000',
//         '--end-address', '2000',
//         '--function-codes', '3,4',
//         '--no-batching',
//         '--format', 'csv',
//         '--output', 'custom-scan'
//       ], 5000);
      
//       expect(result.stdout).toContain('Target: 10.0.0.50:1502');
//       expect(result.stdout).toContain('Slave ID: 5');
//       expect(result.stdout).toContain('Timeout: 10000ms');
//       expect(result.stdout).toContain('Retries: 5');
//       expect(result.stdout).toContain('Batch Size: 50');
//       expect(result.stdout).toContain('Address Range: 1000 - 2000');
//       expect(result.stdout).toContain('Function Codes: 3, 4');
//       expect(result.stdout).toContain('Batching: Disabled');
//       expect(result.stdout).toContain('Export Format: csv');
//       expect(result.stdout).toContain('Output File: custom-scan');
//     });
//   });

//   describe('State Management Commands', () => {
//     it('should handle state info when no state exists', async () => {
//       const result = await runCLI(['--state-info']);
      
//       expect(result.exitCode).toBe(0);
//       expect(result.stdout).toContain('No saved scan state found');
//     });

//     it('should handle clear state when no state exists', async () => {
//       const result = await runCLI(['--clear-state']);
      
//       expect(result.exitCode).toBe(0);
//       expect(result.stdout).toContain('No saved scan state found to clear');
//     });
//   });

//   describe('Error Handling', () => {
//     it('should handle connection timeout gracefully', async () => {
//       // Use a non-routable IP to force timeout
//       const result = await runCLI([
//         '--host', '192.0.2.1', // RFC 5737 test address
//         '--timeout', '2000',
//         '--retries', '1'
//       ], 15000);
      
//       expect(result.exitCode).toBe(1);
//       expect(result.stderr).toContain('Scan failed');
//     });

//     it('should handle invalid host gracefully', async () => {
//       const result = await runCLI([
//         '--host', '999.999.999.999'
//       ], 10000);
      
//       expect(result.exitCode).toBe(1);
//       expect(result.stderr).toContain('Invalid IP address format');
//     });

//     it('should handle SIGINT gracefully', async () => {
//       return new Promise<void>((resolve, reject) => {
//         const child = spawn('node', [
//           cliPath,
//           '--host', '192.0.2.1', // Non-routable IP
//           '--timeout', '30000'
//         ], {
//           cwd: testOutputDir,
//           stdio: 'pipe'
//         });

//         let stdout = '';
//         let stderr = '';

//         child.stdout?.on('data', (data) => {
//           stdout += data.toString();
//         });

//         child.stderr?.on('data', (data) => {
//           stderr += data.toString();
//         });

//         // Send SIGINT after a short delay
//         setTimeout(() => {
//           child.kill('SIGINT');
//         }, 2000);

//         child.on('close', (code) => {
//           try {
//             expect(code).toBe(0); // Should exit gracefully
//             expect(stdout).toContain('Scan interrupted by user');
//             expect(stdout).toContain('Saving current state');
//             resolve();
//           } catch (error) {
//             reject(error);
//           }
//         });

//         child.on('error', (error) => {
//           reject(error);
//         });

//         // Timeout after 10 seconds
//         setTimeout(() => {
//           child.kill('SIGKILL');
//           reject(new Error('Test timed out'));
//         }, 10000);
//       });
//     });
//   });

//   describe('Output Validation', () => {
//     it('should display proper startup banner', async () => {
//       const result = await runCLI(['--host', '192.168.1.100'], 5000);
      
//       expect(result.stdout).toContain('Modbus Register Scanner');
//       expect(result.stdout).toContain('='.repeat(22)); // Banner separator
//     });

//     it('should show progress indicators during scan', async () => {
//       // This will fail to connect but should show the startup sequence
//       const result = await runCLI([
//         '--host', '192.0.2.1',
//         '--timeout', '2000',
//         '--retries', '1'
//       ], 10000);
      
//       // Should show configuration even if scan fails
//       expect(result.stdout).toContain('Starting Modbus Register Scan');
//     });
//   });

//   describe('Command Line Examples', () => {
//     it('should accept minimal required arguments', async () => {
//       const result = await runCLI(['--host', '192.168.1.100'], 5000);
      
//       // Should not fail due to missing arguments
//       expect(result.stdout).toContain('Modbus Register Scanner');
//       expect(result.stdout).toContain('Target: 192.168.1.100:502');
//     });

//     it('should accept all optional arguments', async () => {
//       const result = await runCLI([
//         '--host', '192.168.1.100',
//         '--port', '502',
//         '--slave-id', '1',
//         '--timeout', '5000',
//         '--retries', '3',
//         '--batch-size', '125',
//         '--output', 'test-scan',
//         '--format', 'both',
//         '--start-address', '0',
//         '--end-address', '100',
//         '--function-codes', '1,2,3,4'
//       ], 5000);
      
//       expect(result.stdout).toContain('Modbus Register Scanner');
//       expect(result.stdout).toContain('Address Range: 0 - 100');
//     });

//     it('should handle no-batching flag correctly', async () => {
//       const result = await runCLI([
//         '--host', '192.168.1.100',
//         '--no-batching'
//       ], 5000);
      
//       expect(result.stdout).toContain('Batching: Disabled');
//     });

//     it('should handle resume flag correctly', async () => {
//       const result = await runCLI([
//         '--host', '192.168.1.100',
//         '--resume'
//       ], 5000);
      
//       // Should indicate no saved state found
//       expect(result.stdout).toContain('No saved scan state found');
//     });
//   });

//   describe('Integration with Real Network Scenarios', () => {
//     it('should handle network unreachable error', async () => {
//       const result = await runCLI([
//         '--host', '192.0.2.1', // RFC 5737 test address
//         '--timeout', '2000',
//         '--retries', '1'
//       ], 15000);
      
//       expect(result.exitCode).toBe(1);
//       expect(result.stderr).toContain('Scan failed');
//     });

//     it('should handle connection refused error', async () => {
//       const result = await runCLI([
//         '--host', '127.0.0.1', // Localhost
//         '--port', '9999', // Unlikely to be in use
//         '--timeout', '2000',
//         '--retries', '1'
//       ], 10000);
      
//       expect(result.exitCode).toBe(1);
//       expect(result.stderr).toContain('Scan failed');
//     });
//   });

//   describe('Performance and Resource Usage', () => {
//     it('should handle large address ranges in configuration', async () => {
//       const result = await runCLI([
//         '--host', '192.168.1.100',
//         '--start-address', '0',
//         '--end-address', '65535',
//         '--function-codes', '1,2,3,4'
//       ], 5000);
      
//       expect(result.stdout).toContain('Address Range: 0 - 65535');
//       expect(result.stdout).toContain('Function Codes: 1, 2, 3, 4');
//     });

//     it('should handle minimal address ranges', async () => {
//       const result = await runCLI([
//         '--host', '192.168.1.100',
//         '--start-address', '100',
//         '--end-address', '100',
//         '--function-codes', '3'
//       ], 5000);
      
//       expect(result.stdout).toContain('Address Range: 100 - 100');
//       expect(result.stdout).toContain('Function Codes: 3');
//     });
//   });

//   describe('Export Format Validation', () => {
//     it('should accept csv format', async () => {
//       const result = await runCLI([
//         '--host', '192.168.1.100',
//         '--format', 'csv'
//       ], 5000);
      
//       expect(result.stdout).toContain('Export Format: csv');
//     });

//     it('should accept json format', async () => {
//       const result = await runCLI([
//         '--host', '192.168.1.100',
//         '--format', 'json'
//       ], 5000);
      
//       expect(result.stdout).toContain('Export Format: json');
//     });

//     it('should accept both format', async () => {
//       const result = await runCLI([
//         '--host', '192.168.1.100',
//         '--format', 'both'
//       ], 5000);
      
//       expect(result.stdout).toContain('Export Format: both');
//     });
//   });

//   describe('Edge Cases and Boundary Conditions', () => {
//     it('should handle minimum valid configuration', async () => {
//       const result = await runCLI([
//         '--host', '192.168.1.100',
//         '--port', '1',
//         '--slave-id', '1',
//         '--timeout', '1000',
//         '--retries', '0',
//         '--batch-size', '1',
//         '--start-address', '0',
//         '--end-address', '0',
//         '--function-codes', '1'
//       ], 5000);
      
//       expect(result.stdout).toContain('Target: 192.168.1.100:1');
//       expect(result.stdout).toContain('Slave ID: 1');
//       expect(result.stdout).toContain('Address Range: 0 - 0');
//     });

//     it('should handle maximum valid configuration', async () => {
//       const result = await runCLI([
//         '--host', '255.255.255.255',
//         '--port', '65535',
//         '--slave-id', '247',
//         '--timeout', '60000',
//         '--retries', '10',
//         '--batch-size', '125',
//         '--start-address', '65535',
//         '--end-address', '65535',
//         '--function-codes', '1,2,3,4'
//       ], 5000);
      
//       expect(result.stdout).toContain('Target: 255.255.255.255:65535');
//       expect(result.stdout).toContain('Slave ID: 247');
//       expect(result.stdout).toContain('Address Range: 65535 - 65535');
//     });

//     it('should handle empty function codes list', async () => {
//       const result = await runCLI([
//         '--host', '192.168.1.100',
//         '--function-codes', ''
//       ]);
      
//       expect(result.exitCode).toBe(1);
//       expect(result.stderr).toContain('At least one function code must be specified');
//     });

//     it('should handle duplicate function codes', async () => {
//       const result = await runCLI([
//         '--host', '192.168.1.100',
//         '--function-codes', '1,1,2,2,3'
//       ], 5000);
      
//       // Should handle duplicates gracefully
//       expect(result.stdout).toContain('Function Codes: 1, 1, 2, 2, 3');
//     });
//   });
// });