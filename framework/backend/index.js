/**
 * Backend framework barrel export
 */

module.exports = {
  // API Framework
  api: require('./api'),
  
  // Shared utilities
  shared: require('./shared'),
  
  // MCP Framework (TypeScript - import separately)
  // import { MCPServer, MCPTool } from './mcp';
};
