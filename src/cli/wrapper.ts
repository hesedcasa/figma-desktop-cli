import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import readline from 'readline';

import { getCurrentVersion, printAvailableCommands, printCommandDetail } from '../commands/index.js';
import { COMMANDS, COMMANDS_DETAIL, COMMANDS_INFO, DEFAULT_MCP_SERVER } from '../config/index.js';

/**
 * Main CLI class for Figma Desktop MCP interaction
 */
export class wrapper {
  private client: Client | null = null;
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'figma> ',
    });
  }

  /**
   * Connects to the Figma Desktop MCP server via HTTP/SSE
   */
  async connect(): Promise<void> {
    try {
      const serverUrl = new URL(DEFAULT_MCP_SERVER.url);

      this.client = new Client(
        {
          name: 'figma-desktop-cli',
          version: '1',
        },
        {
          capabilities: {},
        }
      );

      // Connect using SSE transport
      const transport = new SSEClientTransport(serverUrl);
      await this.client.connect(transport);

      // Discover available tools from the server
      await this.discoverTools();

      this.printHelp();
    } catch (error) {
      console.error('Failed to connect to Figma Desktop MCP server:', error);
      console.error('\nMake sure:');
      console.error('1. Figma Desktop app is running');
      console.error('2. You have enabled "Desktop MCP server" in Dev Mode');
      console.error('3. The server is running at http://127.0.0.1:3845/mcp');
      process.exit(1);
    }
  }

  /**
   * Discovers available tools from the Figma MCP server
   */
  private async discoverTools(): Promise<void> {
    if (!this.client) return;

    try {
      const tools = await this.client.listTools();

      // Clear existing arrays
      COMMANDS.length = 0;
      COMMANDS_INFO.length = 0;
      COMMANDS_DETAIL.length = 0;

      // Populate with discovered tools
      for (const tool of tools.tools) {
        COMMANDS.push(tool.name);
        COMMANDS_INFO.push(tool.description || 'No description available');

        // Format input schema for detailed help
        let detail = `\nParameters:\n`;
        if (tool.inputSchema && typeof tool.inputSchema === 'object' && 'properties' in tool.inputSchema) {
          const schema = tool.inputSchema as {
            properties?: Record<string, { type?: string; description?: string }>;
            required?: string[];
          };
          const properties = schema.properties || {};
          const required = schema.required || [];

          for (const [key, value] of Object.entries(properties)) {
            const isRequired = required.includes(key);
            const type = value.type || 'any';
            const desc = value.description || '';
            detail += `- ${key} ${isRequired ? '(required)' : '(optional)'}: ${type} - ${desc}\n`;
          }
        } else {
          detail += 'No parameters required\n';
        }

        detail += `\nExample:\n${tool.name} ${tool.inputSchema && 'properties' in tool.inputSchema ? JSON.stringify(Object.keys((tool.inputSchema as { properties?: Record<string, unknown> }).properties || {}).reduce((acc, key) => ({ ...acc, [key]: `<${key}>` }), {})) : '{}'}\n`;

        COMMANDS_DETAIL.push(detail);
      }

      console.log(`\nDiscovered ${tools.tools.length} tools from Figma MCP server`);
    } catch (error) {
      console.warn('Warning: Could not discover tools from server:', error);
    }
  }

  /**
   * Handles user input commands
   * @param input - The raw user input string
   */
  private async handleCommand(input: string): Promise<void> {
    const trimmed = input.trim();

    if (!trimmed) {
      this.rl.prompt();
      return;
    }

    // Handle special commands
    if (trimmed === 'exit' || trimmed === 'quit' || trimmed === 'q') {
      await this.disconnect();
      return;
    }

    if (trimmed === 'help' || trimmed === '?') {
      this.printHelp();
      this.rl.prompt();
      return;
    }

    if (trimmed === 'commands') {
      printAvailableCommands();
      this.rl.prompt();
      return;
    }

    if (trimmed === 'clear') {
      console.clear();
      this.rl.prompt();
      return;
    }

    // Parse tool invocation: command [args...]
    const parts = trimmed.split(' ');
    const command = parts[0];
    const args = parts.slice(1);

    if (args[0] === '-h') {
      printCommandDetail(command);
      this.rl.prompt();
      return;
    }

    await this.runCommand(command, args[0]);
  }

  /**
   * Runs a command
   * @param command - The command/tool name to execute
   * @param arg - JSON string or null for the command arguments
   */
  private async runCommand(command: string, arg: string): Promise<void> {
    if (!this.client) {
      console.log('MCP server not available!');
      this.rl.prompt();
      return;
    }

    try {
      console.log([command, arg].filter(Boolean).join(' '));

      const argObj: { [key: string]: unknown } = arg && arg.trim() !== '' ? JSON.parse(arg) : {};

      const result = await this.client.callTool(
        {
          name: command,
          arguments: argObj,
        },
        CallToolResultSchema
      );

      console.log(JSON.stringify(result, null, 2));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error running command:', errorMessage);
    }

    this.rl.prompt();
  }

  /**
   * Prints help message
   */
  private printHelp(): void {
    const version = getCurrentVersion();
    const commandList = COMMANDS.length > 0 ? COMMANDS.join(', ') : 'No commands available (not connected)';

    console.log(`
Figma Desktop MCP CLI v${version}

Usage:

commands         list all the available commands
<command> -h     quick help on <command>
<command> <arg>  run <command> with argument
clear            clear the screen
exit, quit, q    exit the CLI

All commands:

${commandList}

Note: Make sure Figma Desktop app is running with MCP server enabled in Dev Mode.
Select a frame/layer in Figma before using commands that require selections.

`);
  }

  /**
   * Starts the interactive REPL loop
   */
  async start(): Promise<void> {
    this.rl.prompt();

    this.rl.on('line', async line => {
      await this.handleCommand(line);
    });

    this.rl.on('close', async () => {
      await this.client?.close();
      process.exit(0);
    });

    const gracefulShutdown = async () => {
      try {
        await this.disconnect();
      } catch (error) {
        console.error('Error during shutdown:', error);
      } finally {
        process.exit(0);
      }
    };

    ['SIGINT', 'SIGTERM'].forEach(sig => {
      process.on(sig, () => {
        gracefulShutdown();
      });
    });
  }

  /**
   * Disconnects from the server and closes the CLI
   */
  private async disconnect(): Promise<void> {
    this.rl.close();
  }
}
