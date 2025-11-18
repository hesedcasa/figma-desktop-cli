# Figma Desktop MCP CLI

A command-line interface for connecting to and interacting with Figma Desktop MCP server. Turn your Figma designs into code and extract design context directly from your terminal.

## Features

- 🎨 Persistent connection to Figma Desktop MCP server
- 💻 Interactive REPL for design queries
- 🚀 Headless mode for one-off command execution
- 🔄 Generate code from selected Figma frames
- 📐 Extract design context (variables, components, layout data)
- 🔧 Command-specific help and documentation
- 🎯 Selection-based design operations

## Requirements

- [Node.js](https://nodejs.org/) v22.0 or newer
- [npm](https://www.npmjs.com/)
- **Figma Desktop App** with Dev Mode access (paid plan required)
- MCP server enabled in Figma Desktop app

## Prerequisites

Before using this CLI, you must:

1. **Install Figma Desktop App**: Download and install the latest version of [Figma Desktop](https://www.figma.com/downloads/)

2. **Enable Desktop MCP Server**:
   - Open Figma Desktop app
   - Create or open a Design file
   - Toggle to Dev Mode (Shift+D)
   - In the MCP server section of the inspect panel, click **Enable desktop MCP server**
   - The server will run locally at `http://127.0.0.1:3845/mcp`

3. **Select Design Elements**: The MCP server is selection-based, so make sure to select a frame or layer in Figma before running commands that require selections.

## Installation

```bash
npm install -g figma-desktop-cli
```

## Quick Start

### Interactive Mode

Start the CLI and interact with Figma through a REPL:

```bash
npx figma-desktop-cli
```

Once started, you'll see the `figma>` prompt:

```
Figma Desktop MCP CLI v0.1.0

Usage:

commands         list all the available commands
<command> -h     quick help on <command>
<command> <arg>  run <command> with argument
clear            clear the screen
exit, quit, q    exit the CLI

Note: Make sure Figma Desktop app is running with MCP server enabled in Dev Mode.
Select a frame/layer in Figma before using commands that require selections.

figma> commands
# Lists all available commands (dynamically discovered from server)

figma> <command> {"param":"value"}
# Execute a command with parameters

figma> exit
```

### Headless Mode

Execute single commands without starting the interactive REPL:

```bash
# General format
npx figma-desktop-cli <command> '<json_arguments>'

# Examples (commands will be discovered from your Figma MCP server)
npx figma-desktop-cli <command-name> '{}'
```

### Command Line Options

```bash
# Show version
npx figma-desktop-cli --version
npx figma-desktop-cli -v

# List all commands
npx figma-desktop-cli --commands

# Get help for specific command
npx figma-desktop-cli <command-name> -h

# General help
npx figma-desktop-cli --help
npx figma-desktop-cli -h
```

## How It Works

1. **Server Connection**: The CLI connects to Figma Desktop MCP server running at `http://127.0.0.1:3845/mcp`
2. **Tool Discovery**: Available tools are automatically discovered from the server on connection
3. **Selection-Based**: Commands work on elements you have selected in Figma Desktop app
4. **Real-time Updates**: Changes in Figma are immediately available to the CLI

## Available Tools

The CLI dynamically discovers available tools from the Figma MCP server. Common tools include:

- **Generate code from selected frames**: Select a Figma frame and turn it into code
- **Extract design context**: Pull in variables, components, and layout data
- **Retrieve resources**: Gather code resources from files and provide them as context

The exact tools available depend on your Figma MCP server configuration. Use the `commands` command to see all available tools.

## Use Cases

### Generate React Component from Design

```bash
# 1. In Figma Desktop: Select a frame/component
# 2. In CLI: Generate code
figma> <generate-code-command> {"framework":"react"}
```

### Extract Design Tokens

```bash
# Get design variables and tokens from current file
figma> <extract-context-command> {}
```

### Quick Code Generation

```bash
# Generate code from selected frame (headless mode)
npx figma-desktop-cli <generate-code-command> '{"framework":"react"}'
```

## Troubleshooting

### Connection Failed

If you see "Failed to connect to Figma Desktop MCP server", make sure:

1. Figma Desktop app is running
2. You have a Design file open
3. You are in Dev Mode (Shift+D)
4. Desktop MCP server is enabled in the inspect panel
5. The server is running at `http://127.0.0.1:3845/mcp`

### No Commands Available

If no commands are discovered:

1. Check that the MCP server is properly enabled
2. Restart Figma Desktop app
3. Try disabling and re-enabling the Desktop MCP server

### Selection-Based Commands Not Working

Some commands require an active selection in Figma:

1. Select a frame or layer in Figma Desktop
2. Run the command in the CLI
3. The command will operate on your current selection

## About Figma MCP Server

The Figma MCP (Model Context Protocol) server brings Figma directly into your AI-powered coding workflow by providing design information and context to AI agents. It enables seamless design-to-code workflows by allowing AI assistants to access your Figma designs, extract components, and generate code.

Learn more at [Figma Developer Docs](https://developers.figma.com/docs/figma-mcp-server/).

## License

Apache-2.0
