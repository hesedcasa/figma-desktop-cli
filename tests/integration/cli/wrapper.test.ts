import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { wrapper } from '../../../src/cli/wrapper.js';

// Mock readline
const mockPrompt = vi.fn();
const mockClose = vi.fn();
const mockOn = vi.fn();

vi.mock('readline', () => ({
  default: {
    createInterface: vi.fn(() => ({
      prompt: mockPrompt,
      close: mockClose,
      on: mockOn,
    })),
  },
}));

// Mock MCP SDK
const mockConnect = vi.fn();
const mockCallTool = vi.fn();
const mockClientClose = vi.fn();

vi.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
  Client: vi.fn(function () {
    return {
      connect: mockConnect,
      callTool: mockCallTool,
      close: mockClientClose,
    };
  }),
}));

vi.mock('@modelcontextprotocol/sdk/client/stdio.js', () => ({
  StdioClientTransport: vi.fn(),
}));

vi.mock('@modelcontextprotocol/sdk/types.js', () => ({
  CallToolResultSchema: {},
}));

// Mock commands helpers
vi.mock('../../../src/commands/index.js', () => ({
  getCurrentVersion: vi.fn(() => '1.1.1'),
  printAvailableCommands: vi.fn(),
  printCommandDetail: vi.fn(),
}));

describe('cli/wrapper (Integration)', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleClearSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;
  let processOnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleClearSpy = vi.spyOn(console, 'clear').mockImplementation(() => {});
    processExitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => {}) as unknown as (...args: unknown[]) => never);
    processOnSpy = vi.spyOn(process, 'on').mockImplementation(() => process);

    // Reset mocks
    mockConnect.mockResolvedValue(undefined);
    mockCallTool.mockResolvedValue({ result: 'success' });
    mockClientClose.mockResolvedValue(undefined);
    mockOn.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create readline interface', async () => {
      const readline = await import('readline');

      new wrapper();

      expect(readline.default.createInterface).toHaveBeenCalledWith({
        input: process.stdin,
        output: process.stdout,
        prompt: 'context7> ',
      });
    });
  });

  describe('connect', () => {
    it('should connect to MCP server successfully', async () => {
      const cli = new wrapper();
      await cli.connect();

      expect(mockConnect).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should print help after connection', async () => {
      const cli = new wrapper();
      await cli.connect();

      const allCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(allCalls).toContain('Context7 CLI');
    });

    it('should handle connection errors and exit', async () => {
      mockConnect.mockRejectedValue(new Error('Connection failed'));

      const cli = new wrapper();

      // The connect method catches errors and calls process.exit
      // So we don't expect it to throw, but to handle the error gracefully
      await cli.connect();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to connect to MCP server:', expect.any(Error));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('start', () => {
    it('should set up readline event listeners', async () => {
      const cli = new wrapper();
      await cli.start();

      expect(mockOn).toHaveBeenCalledWith('line', expect.any(Function));
      expect(mockOn).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('should set up signal handlers', async () => {
      const cli = new wrapper();
      await cli.start();

      expect(processOnSpy).toHaveBeenCalled();
    });

    it('should display prompt', async () => {
      const cli = new wrapper();
      await cli.start();

      expect(mockPrompt).toHaveBeenCalled();
    });
  });

  describe('command handling', () => {
    it('should handle help command', async () => {
      let lineHandler: ((line: string) => Promise<void>) | null = null;
      mockOn.mockImplementation((event: string, handler: (line: string) => Promise<void>) => {
        if (event === 'line') {
          lineHandler = handler;
        }
      });

      const cli = new wrapper();
      await cli.connect();
      await cli.start();

      mockPrompt.mockClear();
      consoleLogSpy.mockClear();

      await lineHandler('help');

      const allCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(allCalls).toContain('Context7 CLI');
      expect(mockPrompt).toHaveBeenCalled();
    });

    it('should handle commands command', async () => {
      const { printAvailableCommands } = await import('../../../src/commands/index.js');

      let lineHandler: ((line: string) => Promise<void>) | null = null;
      mockOn.mockImplementation((event: string, handler: (line: string) => Promise<void>) => {
        if (event === 'line') {
          lineHandler = handler;
        }
      });

      const cli = new wrapper();
      await cli.connect();
      await cli.start();

      mockPrompt.mockClear();

      await lineHandler('commands');

      expect(printAvailableCommands).toHaveBeenCalled();
      expect(mockPrompt).toHaveBeenCalled();
    });

    it('should handle clear command', async () => {
      let lineHandler: ((line: string) => Promise<void>) | null = null;
      mockOn.mockImplementation((event: string, handler: (line: string) => Promise<void>) => {
        if (event === 'line') {
          lineHandler = handler;
        }
      });

      const cli = new wrapper();
      await cli.connect();
      await cli.start();

      mockPrompt.mockClear();

      await lineHandler('clear');

      expect(consoleClearSpy).toHaveBeenCalled();
      expect(mockPrompt).toHaveBeenCalled();
    });

    it('should handle empty input', async () => {
      let lineHandler: ((line: string) => Promise<void>) | null = null;
      mockOn.mockImplementation((event: string, handler: (line: string) => Promise<void>) => {
        if (event === 'line') {
          lineHandler = handler;
        }
      });

      const cli = new wrapper();
      await cli.connect();
      await cli.start();

      mockPrompt.mockClear();

      await lineHandler('');

      expect(mockPrompt).toHaveBeenCalled();
      expect(mockCallTool).not.toHaveBeenCalled();
    });

    it('should handle whitespace input', async () => {
      let lineHandler: ((line: string) => Promise<void>) | null = null;
      mockOn.mockImplementation((event: string, handler: (line: string) => Promise<void>) => {
        if (event === 'line') {
          lineHandler = handler;
        }
      });

      const cli = new wrapper();
      await cli.connect();
      await cli.start();

      mockPrompt.mockClear();

      await lineHandler('   ');

      expect(mockPrompt).toHaveBeenCalled();
      expect(mockCallTool).not.toHaveBeenCalled();
    });

    it('should handle exit command', async () => {
      let lineHandler: ((line: string) => Promise<void>) | null = null;
      mockOn.mockImplementation((event: string, handler: (line: string) => Promise<void>) => {
        if (event === 'line') {
          lineHandler = handler;
        }
      });

      const cli = new wrapper();
      await cli.connect();
      await cli.start();

      await lineHandler('exit');

      expect(mockClose).toHaveBeenCalled();
    });

    it('should handle quit command', async () => {
      let lineHandler: ((line: string) => Promise<void>) | null = null;
      mockOn.mockImplementation((event: string, handler: (line: string) => Promise<void>) => {
        if (event === 'line') {
          lineHandler = handler;
        }
      });

      const cli = new wrapper();
      await cli.connect();
      await cli.start();

      await lineHandler('quit');

      expect(mockClose).toHaveBeenCalled();
    });

    it('should handle q command', async () => {
      let lineHandler: ((line: string) => Promise<void>) | null = null;
      mockOn.mockImplementation((event: string, handler: (line: string) => Promise<void>) => {
        if (event === 'line') {
          lineHandler = handler;
        }
      });

      const cli = new wrapper();
      await cli.connect();
      await cli.start();

      await lineHandler('q');

      expect(mockClose).toHaveBeenCalled();
    });

    it('should handle command with -h flag', async () => {
      const { printCommandDetail } = await import('../../../src/commands/index.js');

      let lineHandler: ((line: string) => Promise<void>) | null = null;
      mockOn.mockImplementation((event: string, handler: (line: string) => Promise<void>) => {
        if (event === 'line') {
          lineHandler = handler;
        }
      });

      const cli = new wrapper();
      await cli.connect();
      await cli.start();

      await lineHandler('navigate_page -h');

      expect(printCommandDetail).toHaveBeenCalledWith('navigate_page');
      expect(mockPrompt).toHaveBeenCalled();
    });

    it('should execute tool command with arguments', async () => {
      let lineHandler: ((line: string) => Promise<void>) | null = null;
      mockOn.mockImplementation((event: string, handler: (line: string) => Promise<void>) => {
        if (event === 'line') {
          lineHandler = handler;
        }
      });

      const cli = new wrapper();
      await cli.connect();
      await cli.start();

      consoleLogSpy.mockClear();

      await lineHandler('navigate_page {"url":"https://google.com"}');

      expect(mockCallTool).toHaveBeenCalledWith(
        {
          name: 'navigate_page',
          arguments: { url: 'https://google.com' },
        },
        {}
      );
    });

    it('should execute tool command without arguments', async () => {
      let lineHandler: ((line: string) => Promise<void>) | null = null;
      mockOn.mockImplementation((event: string, handler: (line: string) => Promise<void>) => {
        if (event === 'line') {
          lineHandler = handler;
        }
      });

      const cli = new wrapper();
      await cli.connect();
      await cli.start();

      consoleLogSpy.mockClear();

      await lineHandler('list_pages');

      expect(mockCallTool).toHaveBeenCalledWith(
        {
          name: 'list_pages',
          arguments: {},
        },
        {}
      );
    });

    it('should handle tool execution errors', async () => {
      mockCallTool.mockRejectedValue(new Error('Tool failed'));

      let lineHandler: ((line: string) => Promise<void>) | null = null;
      mockOn.mockImplementation((event: string, handler: (line: string) => Promise<void>) => {
        if (event === 'line') {
          lineHandler = handler;
        }
      });

      const cli = new wrapper();
      await cli.connect();
      await cli.start();

      consoleErrorSpy.mockClear();

      await lineHandler('list_pages');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error running command:', 'Tool failed');
    });

    it('should continue REPL after tool error', async () => {
      mockCallTool.mockRejectedValue(new Error('Tool failed'));

      let lineHandler: ((line: string) => Promise<void>) | null = null;
      mockOn.mockImplementation((event: string, handler: (line: string) => Promise<void>) => {
        if (event === 'line') {
          lineHandler = handler;
        }
      });

      const cli = new wrapper();
      await cli.connect();
      await cli.start();

      mockPrompt.mockClear();

      await lineHandler('list_pages');

      expect(mockPrompt).toHaveBeenCalled();
    });
  });
});
