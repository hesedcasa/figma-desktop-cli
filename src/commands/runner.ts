import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';

import { DEFAULT_MCP_SERVER } from '../config/index.js';

/**
 * Runs a command in headless mode (non-interactive)
 * @param command - The command/tool name to execute
 * @param arg - JSON string or null for the command arguments
 * @param flag - Optional flag (currently unused but kept for API compatibility)
 */
export const runCommand = async (command: string, arg: string | null, flag: string | null): Promise<void> => {
  try {
    console.log([command, arg, flag].filter(Boolean).join(' '));

    // Prepare client and transport
    const client = new Client(
      {
        name: 'figma-desktop-cli-headless',
        version: '1',
      },
      {
        capabilities: {},
      }
    );

    const serverUrl = new URL(DEFAULT_MCP_SERVER.url);
    const transport = new SSEClientTransport(serverUrl);

    await client.connect(transport);

    const argObj: { [key: string]: unknown } = arg && arg.trim() !== '' ? JSON.parse(arg) : {};

    const result = await client.callTool(
      {
        name: command,
        arguments: argObj,
      },
      CallToolResultSchema
    );

    console.log(JSON.stringify(result, null, 2));

    await client.close();

    process.exit(0);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error running command:', errorMessage);
    console.error('\nMake sure:');
    console.error('1. Figma Desktop app is running');
    console.error('2. You have enabled "Desktop MCP server" in Dev Mode');
    console.error('3. The server is running at http://127.0.0.1:3845/mcp');
    process.exit(1);
  }
};
