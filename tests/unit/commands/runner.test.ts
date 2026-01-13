import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runCommand } from '../../../src/commands/runner.js';

// Mock the MCP SDK
const mockConnect = vi.fn();
const mockCallTool = vi.fn();
const mockClose = vi.fn();

vi.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
  Client: vi.fn(function () {
    return {
      connect: mockConnect,
      callTool: mockCallTool,
      close: mockClose,
    };
  }),
}));

vi.mock('@modelcontextprotocol/sdk/client/sse.js', () => ({
  SSEClientTransport: vi.fn(),
}));

vi.mock('@modelcontextprotocol/sdk/types.js', () => ({
  CallToolResultSchema: {},
}));

describe('commands/runner', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => {}) as unknown as (...args: unknown[]) => never);

    // Reset mock implementations
    mockConnect.mockResolvedValue(undefined);
    mockCallTool.mockResolvedValue({ result: 'success' });
    mockClose.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('runCommand', () => {
    it('should execute command without arguments', async () => {
      await runCommand('get_current_page', null, null);

      expect(mockConnect).toHaveBeenCalled();
      expect(mockCallTool).toHaveBeenCalledWith(
        {
          name: 'get_current_page',
          arguments: {},
        },
        {}
      );
      expect(mockClose).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('should execute command with JSON arguments', async () => {
      const jsonArg = '{"pageId": "123:456"}';

      await runCommand('navigate_page', jsonArg, null);

      expect(mockCallTool).toHaveBeenCalledWith(
        {
          name: 'navigate_page',
          arguments: { pageId: '123:456' },
        },
        {}
      );
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('should execute get_selection with JSON arguments', async () => {
      const jsonArg = '{"includeChildren": true}';

      await runCommand('get_selection', jsonArg, null);

      expect(mockCallTool).toHaveBeenCalledWith(
        {
          name: 'get_selection',
          arguments: { includeChildren: true },
        },
        {}
      );
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('should use correct transport configuration', async () => {
      const { SSEClientTransport } = await import('@modelcontextprotocol/sdk/client/sse.js');

      await runCommand('get_current_page', null, null);

      expect(SSEClientTransport).toHaveBeenCalledWith(expect.any(URL));
    });

    it('should log command and arguments', async () => {
      await runCommand('navigate_page', '{"pageId": "123:456"}', null);

      expect(consoleLogSpy).toHaveBeenCalledWith('navigate_page {"pageId": "123:456"}');
    });

    it('should log result as JSON', async () => {
      const mockResult = { result: 'success', data: 'test' };
      mockCallTool.mockResolvedValue(mockResult);

      await runCommand('get_current_page', null, null);

      expect(consoleLogSpy).toHaveBeenCalledWith(JSON.stringify(mockResult, null, 2));
    });

    it('should handle connection errors', async () => {
      mockConnect.mockRejectedValue(new Error('Connection failed'));

      await runCommand('get_current_page', null, null);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error running command:', 'Connection failed');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle tool execution errors', async () => {
      mockCallTool.mockRejectedValue(new Error('Tool execution failed'));

      await runCommand('navigate_page', '{"pageId": "invalid"}', null);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error running command:', 'Tool execution failed');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle JSON parse errors', async () => {
      await runCommand('get_current_page', 'invalid json', null);

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle empty string arguments', async () => {
      await runCommand('get_current_page', '', null);

      expect(mockCallTool).toHaveBeenCalledWith(
        {
          name: 'get_current_page',
          arguments: {},
        },
        {}
      );
    });

    it('should handle whitespace-only arguments', async () => {
      await runCommand('get_current_page', '   ', null);

      expect(mockCallTool).toHaveBeenCalledWith(
        {
          name: 'get_current_page',
          arguments: {},
        },
        {}
      );
    });

    it('should close client after successful execution', async () => {
      await runCommand('get_current_page', null, null);

      expect(mockClose).toHaveBeenCalled();
    });

    it('should use correct client name and version', async () => {
      const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');

      await runCommand('get_current_page', null, null);

      expect(Client).toHaveBeenCalledWith(
        {
          name: 'figma-desktop-cli-headless',
          version: '1',
        },
        {
          capabilities: {},
        }
      );
    });

    it('should handle complex JSON arguments', async () => {
      const complexArg = '{"nodeId": "123:456", "includeChildren": true, "depth": 2}';

      await runCommand('get_node', complexArg, null);

      expect(mockCallTool).toHaveBeenCalledWith(
        {
          name: 'get_node',
          arguments: {
            nodeId: '123:456',
            includeChildren: true,
            depth: 2,
          },
        },
        {}
      );
    });

    it('should handle error without message property', async () => {
      mockCallTool.mockRejectedValue('Plain error string');

      await runCommand('get_current_page', null, null);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error running command:', 'Plain error string');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle flag parameter gracefully', async () => {
      await runCommand('navigate_page', '{"pageId": "123:456"}', '--some-flag');

      expect(consoleLogSpy).toHaveBeenCalledWith('navigate_page {"pageId": "123:456"} --some-flag');
      expect(mockCallTool).toHaveBeenCalledWith(
        {
          name: 'navigate_page',
          arguments: { pageId: '123:456' },
        },
        {}
      );
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('should connect client before calling tool', async () => {
      const callOrder: string[] = [];

      mockConnect.mockImplementation(async () => {
        callOrder.push('connect');
      });

      mockCallTool.mockImplementation(async () => {
        callOrder.push('callTool');
        return { result: 'success' };
      });

      await runCommand('get_current_page', null, null);

      expect(callOrder).toEqual(['connect', 'callTool']);
    });

    it('should close client after calling tool', async () => {
      const callOrder: string[] = [];

      mockCallTool.mockImplementation(async () => {
        callOrder.push('callTool');
        return { result: 'success' };
      });

      mockClose.mockImplementation(async () => {
        callOrder.push('close');
      });

      await runCommand('get_current_page', null, null);

      expect(callOrder).toEqual(['callTool', 'close']);
    });
  });
});
