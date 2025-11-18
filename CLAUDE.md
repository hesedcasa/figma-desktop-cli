# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

```bash
# Install dependencies
npm install

# Build the TypeScript source
npm run build

# Run the CLI (development mode with tsx)
npm start

# Run in development (same as start)
npm run dev

# Run tests
npm test                    # Run all tests once
npm run test:watch          # Run tests in watch mode
npm run test:ui             # Run tests with UI
npm run test:coverage       # Run tests with coverage report

# Code quality
npm run format              # Format code with ESLint and Prettier
npm run find-deadcode       # Find unused exports with ts-prune
npm run pre-commit          # Run format + find-deadcode
```

**Note**: The CLI connects to the Figma Desktop MCP server running locally at `http://127.0.0.1:3845/mcp` to interact with Figma designs and generate code.

## Prerequisites

Before using this CLI:

1. **Figma Desktop App** must be running
2. Open a Design file in Figma
3. Toggle to **Dev Mode** (Shift+D)
4. Enable **"Desktop MCP server"** in the inspect panel
5. Server will run at `http://127.0.0.1:3845/mcp`

## Project Architecture

This is a **modular TypeScript CLI** that provides a REPL interface for interacting with Figma designs through the Model Context Protocol (MCP) via Figma Desktop MCP server.

### Project Structure

```
src/
├── index.ts (28 lines)                    # Main entry point
├── cli/
│   ├── index.ts                           # Barrel export
│   └── wrapper.ts (~220 lines)            # CLI class with REPL logic
├── commands/
│   ├── index.ts                           # Barrel export
│   ├── helpers.ts (45 lines)              # Command info helpers
│   └── runner.ts (~60 lines)              # Headless command execution
├── config/
│   ├── index.ts                           # Barrel export
│   └── constants.ts (~25 lines)           # Server config (commands discovered dynamically)
└── utils/
    ├── index.ts                           # Barrel export
    └── argParser.ts (74 lines)            # Command-line argument parser

tests/
├── unit/
│   ├── commands/
│   │   ├── helpers.test.ts                # Tests for command helpers
│   │   └── runner.test.ts                 # Tests for headless runner
│   ├── config/constants.test.ts           # Tests for constants
│   └── utils/argParser.test.ts            # Tests for argument parsing
└── integration/
    └── cli/wrapper.test.ts                # Tests for CLI wrapper
```

### Core Components

#### Entry Point (`src/index.ts`)

- Bootstraps the application
- Parses command-line arguments
- Routes to interactive or headless mode

#### CLI Module (`src/cli/`)

- **wrapper class**: Main orchestrator managing:
  - `connect()` - Establishes MCP server connection using `@modelcontextprotocol/sdk` client and **SSE transport** (HTTP-based)
  - `discoverTools()` - **Dynamically discovers** available tools from Figma MCP server on connection
  - `start()` - Initiates interactive REPL with readline interface
  - `handleCommand()` - Parses and processes user commands
  - `runCommand()` - Executes MCP tools with JSON argument parsing
  - `disconnect()` - Graceful cleanup on exit signals (SIGINT/SIGTERM)

#### Commands Module (`src/commands/`)

- `helpers.ts` - Display command information and help
  - `printAvailableCommands()` - Lists all dynamically discovered commands
  - `printCommandDetail(command)` - Shows detailed help for specific command
- `runner.ts` - Execute commands in headless mode
  - `runCommand(command, arg, flag)` - Non-interactive command execution via HTTP/SSE

#### Config Module (`src/config/`)

- `constants.ts` - Centralized configuration
  - `DEFAULT_MCP_SERVER` - MCP server connection settings (HTTP URL: `http://127.0.0.1:3845/mcp`)
  - `COMMANDS[]` - Array of dynamically discovered command names **(populated on connection)**
  - `COMMANDS_INFO[]` - Brief descriptions for each command **(populated on connection)**
  - `COMMANDS_DETAIL[]` - Detailed parameter documentation **(populated on connection)**

#### Utils Module (`src/utils/`)

- `argParser.ts` - Command-line argument handling
  - `parseArguments(args)` - Parses CLI flags and routes execution

### MCP Client Integration

- Uses `@modelcontextprotocol/sdk` for protocol communication
- Connects to Figma Desktop MCP server via **SSE (Server-Sent Events)** transport
- Server runs locally at `http://127.0.0.1:3845/mcp`
- **Dynamically discovers** available tools from server on connection
- **Selection-based**: operates on currently selected frames/layers in Figma Desktop
- Real-time interaction with Figma designs

### REPL Interface

- Custom prompt: `figma>`
- Special commands: `help`, `commands`, `clear`, `exit/quit/q`
- Tool invocation: Direct tool name with JSON arguments
- Real-time interaction with Figma Desktop selections

### TypeScript Configuration

- **Target**: ES2022 modules (package.json `"type": "module"`)
- **Output**: Compiles to `dist/` directory with modular structure
- **Declarations**: Generates `.d.ts` files for all modules
- **Source Maps**: Enabled for debugging

## Common Development Tasks

### Building and Running

```bash
# Build TypeScript to JavaScript
npm run build

# Run with tsx (no build step needed)
npm start
# or
npm run dev

# After building, use the compiled binary
npm link  # Link globally
figma-desktop-cli  # Use the CLI command
```

### Available Tools

The CLI **dynamically discovers** tools from the Figma Desktop MCP server. Common tools include:

- **Generate code from frames**: Convert selected Figma designs into code
- **Extract design context**: Pull variables, components, and layout data
- **Retrieve resources**: Gather code resources from Figma files

**Note**: Exact tools depend on the Figma MCP server version and configuration. Use the `commands` command to see all available tools.

### Command Examples

```bash
# Prerequisites:
# 1. Start Figma Desktop app
# 2. Open a design file
# 3. Toggle to Dev Mode (Shift+D)
# 4. Enable "Desktop MCP server" in the inspect panel
# 5. Select a frame or layer in Figma

# Start the CLI in interactive mode
npm start

# Inside the REPL:
figma> commands                    # List all available commands (dynamically discovered)
figma> help                        # Show help
figma> <command-name> {"param":"value"}  # Execute a discovered command
figma> exit                        # Exit

# Headless mode (one-off commands):
npx figma-desktop-cli <command-name> '{"param":"value"}'
npx figma-desktop-cli --commands       # List all commands
npx figma-desktop-cli <command> -h     # Command-specific help
npx figma-desktop-cli --help           # General help
npx figma-desktop-cli --version        # Show version
```

## Code Structure & Module Responsibilities

### Entry Point (`index.ts`)

- Minimal bootstrapper
- Imports and coordinates other modules
- Handles top-level error catching

### CLI Class (`cli/wrapper.ts`)

- Interactive REPL management
- MCP server connection lifecycle via HTTP/SSE
- Dynamic tool discovery from server
- User command processing
- Tool execution with result formatting

### Command Helpers (`commands/helpers.ts`)

- Pure functions for displaying command information
- No external dependencies except config
- Easy to test

### Command Runner (`commands/runner.ts`)

- Headless/non-interactive execution
- Single command → result → exit pattern
- Independent MCP client instance via HTTP/SSE

### Constants (`config/constants.ts`)

- Single source of truth for server configuration
- Commands are discovered at runtime (not hardcoded)
- Server connection settings
- No logic, just data

### Argument Parser (`utils/argParser.ts`)

- CLI flag parsing (--help, --version, --commands, etc.)
- Routing logic for different execution modes
- Command detection and validation

### Key Implementation Details

- **Barrel Exports**: Each module directory has `index.ts` exporting public APIs
- **ES Modules**: All imports use `.js` extensions (TypeScript requirement)
- **HTTP Transport**: Uses **SSEClientTransport** for local HTTP connection to Figma server
- **Dynamic Discovery**: Commands are discovered at runtime via `client.listTools()`
- **Argument Parsing**: Supports JSON arguments for tool parameters
- **Tool Arguments**: Accepts JSON objects (e.g., `{"key": "value"}`)
- **Signal Handling**: Graceful shutdown on Ctrl+C (SIGINT) and SIGTERM
- **Error Handling**: Try-catch blocks for connection and tool execution with user-friendly messages
- **Selection-Based**: Many operations work on currently selected Figma elements

## Dependencies

**Runtime**:

- `@modelcontextprotocol/sdk@^1.0.0` - Official MCP client SDK (using SSE transport for HTTP connections)

**Development**:

- `typescript@^5.0.0` - TypeScript compiler
- `tsx@^4.0.0` - TypeScript execution runtime
- `@types/node@^24.10.1` - Node.js type definitions
- `vitest@^4.0.9` - Test framework
- `eslint@^9.39.1` - Linting
- `prettier@3.6.2` - Code formatting
- `ts-prune@^0.10.3` - Find unused exports

## Testing

This project uses **Vitest** for testing with the following configuration:

- **Test Framework**: Vitest with globals enabled
- **Test Files**: `tests/**/*.test.ts`
- **Coverage**: V8 coverage provider with text, JSON, and HTML reports

### Running Tests

```bash
# Run all tests once
npm test

# Watch mode for development
npm run test:watch

# Run with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Test Structure

```
tests/
├── unit/
│   ├── commands/
│   │   ├── helpers.test.ts      # Tests for printAvailableCommands, printCommandDetail, getCurrentVersion
│   │   └── runner.test.ts       # Tests for headless command execution
│   ├── config/constants.test.ts # Tests for configuration constants
│   └── utils/argParser.test.ts  # Tests for CLI argument parsing
└── integration/
    └── cli/wrapper.test.ts      # Tests for CLI wrapper class
```

### Writing Tests

Each test file follows standard Vitest patterns:

- Use `describe()` blocks to group related tests
- Use `beforeEach()`/`afterEach()` for setup/teardown
- Mock `console.log` when testing print functions
- Use `vi.spyOn()` and `vi.clearAllMocks()` for mocking

## Important Notes

1. **Modular Structure**: Code is organized into focused modules for better maintainability
2. **ES2022 Modules**: Project uses `"type": "module"` - no CommonJS
3. **MCP Ecosystem**: This CLI is a client that connects to the Figma Desktop MCP server via HTTP/SSE
4. **HTTP Transport**: Uses SSE (Server-Sent Events) transport instead of stdio for local HTTP connection
5. **Dynamic Discovery**: Commands are discovered at runtime from the Figma MCP server
6. **Selection-Based**: Many commands operate on the currently selected frame/layer in Figma Desktop
7. **Barrel Exports**: Use `from './module/index.js'` for cleaner imports
8. **Real-time**: Changes in Figma are immediately available to the CLI

## Commit Message Convention

**Always use Conventional Commits format** for all commit messages and PR titles:

- `feat:` - New features or capabilities
- `fix:` - Bug fixes
- `docs:` - Documentation changes only
- `refactor:` - Code refactoring without changing functionality
- `test:` - Adding or modifying tests
- `chore:` - Maintenance tasks, dependency updates, build configuration

**Examples:**

```
feat: add support for Figma Desktop MCP server
feat: implement dynamic tool discovery from server
fix: resolve connection error handling for HTTP transport
docs: update README with Figma setup instructions
refactor: extract HTTP client connection logic
test: add unit tests for SSE transport connection
chore: update dependencies to latest MCP SDK version
```

When creating pull requests, the PR title must follow this format. The PR description should provide additional context about what changed and why.

## Development Tips

### About Commands

Commands are **dynamically discovered** from the Figma MCP server on connection. The CLI automatically:

1. Connects to the server at `http://127.0.0.1:3845/mcp`
2. Calls `listTools()` to discover available tools
3. Populates `COMMANDS`, `COMMANDS_INFO`, and `COMMANDS_DETAIL` arrays
4. Makes them available for execution

No manual command configuration is needed!

### Adding a New CLI Flag

1. Edit `utils/argParser.ts`
2. Add flag detection in the `parseArguments()` function
3. Implement the flag's behavior
4. Update help text if needed

### Modifying CLI Behavior

1. Interactive mode logic: `cli/wrapper.ts`
2. Headless mode logic: `commands/runner.ts`
3. Argument routing: `utils/argParser.ts`

### Working with Modules

- Each module is self-contained and independently testable
- Use barrel exports for clean imports: `import { X } from './module/index.js'`
- Follow single responsibility principle - one concern per file
- Keep dependencies flowing in one direction (no circular dependencies)

### Building and Testing

```bash
# Clean build
rm -rf dist && npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Quick test of the CLI
npm start

# Test specific functionality (after building)
node dist/index.js --help
node dist/index.js --commands
```

### Common Patterns

**Importing from modules:**

```typescript
import { wrapper } from './cli/index.js';
import { COMMANDS, DEFAULT_MCP_SERVER } from './config/index.js';
import { parseArguments } from './utils/index.js';
```

**Error handling:**

```typescript
try {
  // Operation
} catch (error: any) {
  console.error('Error:', error.message || error);
  process.exit(1);
}
```

**SSE Connection:**

```typescript
const serverUrl = new URL('http://127.0.0.1:3845/mcp');
const transport = new SSEClientTransport(serverUrl);
await this.client.connect(transport);
```

**Tool Discovery:**

```typescript
const tools = await this.client.listTools();
for (const tool of tools.tools) {
  COMMANDS.push(tool.name);
  COMMANDS_INFO.push(tool.description || 'No description available');
  // ... process tool.inputSchema for detailed parameters
}
```

**MCP tool call:**

```typescript
const result = await this.client.callTool(
  {
    name: toolName,
    arguments: arguments_,
  },
  CallToolResultSchema
);
```

## Performance Considerations

- The modular structure has **no performance impact** (tree-shaking applies)
- Same runtime behavior as the original architecture
- Dynamic tool discovery adds minimal overhead (only on connection)
- HTTP/SSE connection is efficient for local server communication

## Code Quality Tools

### ESLint

The project uses ESLint with TypeScript support:

- Configuration: `eslint.config.ts`
- Extends `@eslint/js` recommended rules
- Uses `typescript-eslint` for TypeScript-specific linting
- Target: Node.js globals

### Prettier

Code formatting is handled by Prettier with the following plugins:

- `@trivago/prettier-plugin-sort-imports` - Auto-sorts imports

### Dead Code Detection

Use `ts-prune` to find unused exports:

```bash
npm run find-deadcode
```

### Pre-commit Hook

Run formatting and dead code detection before committing:

```bash
npm run pre-commit
```

- use conventional commit message when creating PR
