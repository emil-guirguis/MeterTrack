# Modbus Register Scanner

A command-line tool that systematically discovers available registers on Modbus TCP devices. This tool helps identify what data points are accessible on industrial meters, PLCs, and other Modbus-enabled devices without requiring prior knowledge of the device's register map.

## Features

- Scan Modbus TCP devices for available registers
- Support for all four Modbus function codes (1, 2, 3, 4)
- Batch optimization for efficient scanning
- Progress reporting with real-time updates
- Export results in CSV and JSON formats
- Robust error handling and retry logic
- Graceful handling of network interruptions

## Installation

```bash
npm install
npm run build
```

## Usage

```bash
# Basic scan
modbus-scanner --host 192.168.1.100

# Advanced options
modbus-scanner --host 192.168.1.100 --port 502 --slave-id 1 --timeout 5000 --retries 3 --batch-size 125

# Export options
modbus-scanner --host 192.168.1.100 --output scan-results --format both
```

## Options

- `-h, --host <ip>`: Target Modbus device IP address (required)
- `-p, --port <number>`: TCP port number (default: 502)
- `-s, --slave-id <number>`: Modbus slave ID 1-247 (default: 1)
- `-t, --timeout <number>`: Request timeout in milliseconds (default: 5000)
- `-r, --retries <number>`: Maximum retry attempts (default: 3)
- `-b, --batch-size <number>`: Maximum registers per batch read (default: 125)
- `-o, --output <file>`: Output file path without extension
- `-f, --format <type>`: Export format: csv, json, or both (default: both)

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev -- --host 192.168.1.100

# Build for production
npm run build

# Run tests
npm test
```

## Project Structure

```
src/
├── types/          # TypeScript interfaces and types
├── connection/     # TCP connection management
├── scanner/        # Core scanning engine
├── reader/         # Modbus register reading
├── optimizer/      # Batch optimization logic
├── reporter/       # Progress reporting
├── export/         # Data export functionality
└── index.ts        # Main CLI entry point
```

## License

MIT