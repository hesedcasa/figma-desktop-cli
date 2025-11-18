/**
 * Default Figma Desktop MCP server configuration
 * The server runs locally at http://127.0.0.1:3845/mcp when enabled in Figma Desktop app
 */
export const DEFAULT_MCP_SERVER = {
  url: 'http://127.0.0.1:3845/mcp',
};

/**
 * Available Figma MCP commands
 * These will be dynamically discovered from the server on connection
 */
export const COMMANDS: string[] = [];

/**
 * Brief descriptions for each command
 * These will be populated after server connection
 */
export const COMMANDS_INFO: string[] = [];

/**
 * Detailed parameter information for each command
 * These will be populated after server connection
 */
export const COMMANDS_DETAIL: string[] = [];
