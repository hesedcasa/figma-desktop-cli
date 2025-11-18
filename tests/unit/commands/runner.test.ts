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

vi.mock('@modelcontextprotocol/sdk/client/stdio.js', () => ({
  StdioClientTransport: vi.fn(),
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
      await runCommand('resolve-library-id', null, null);

      expect(mockConnect).toHaveBeenCalled();
      expect(mockCallTool).toHaveBeenCalledWith(
        {
          name: 'resolve-library-id',
          arguments: {},
        },
        {}
      );
      expect(mockClose).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('should execute command with JSON arguments', async () => {
      const jsonArg = '{"libraryName": "mongodb"}';

      await runCommand('resolve-library-id', jsonArg, null);

      expect(mockCallTool).toHaveBeenCalledWith(
        {
          name: 'resolve-library-id',
          arguments: { libraryName: 'mongodb' },
        },
        {}
      );
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('should execute get-library-docs with JSON arguments', async () => {
      const jsonArg = '{"context7CompatibleLibraryID": "/mongodb/docs", "topic": "aggregation"}';

      await runCommand('get-library-docs', jsonArg, null);

      expect(mockCallTool).toHaveBeenCalledWith(
        {
          name: 'get-library-docs',
          arguments: { context7CompatibleLibraryID: '/mongodb/docs', topic: 'aggregation' },
        },
        {}
      );
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('should use correct transport configuration', async () => {
      const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');

      await runCommand('resolve-library-id', null, null);

      expect(StdioClientTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          command: 'npx',
          args: ['-y', '@upstash/context7-mcp'],
        })
      );
    });

    it('should log command and arguments', async () => {
      await runCommand('resolve-library-id', '{"libraryName": "mongodb"}', null);

      expect(consoleLogSpy).toHaveBeenCalledWith('resolve-library-id {"libraryName": "mongodb"}');
    });

    it('should log result as JSON', async () => {
      const mockResult = { result: 'success', data: 'test' };
      mockCallTool.mockResolvedValue(mockResult);

      await runCommand('resolve-library-id', null, null);

      expect(consoleLogSpy).toHaveBeenCalledWith(JSON.stringify(mockResult, null, 2));
    });

    it('should handle connection errors', async () => {
      mockConnect.mockRejectedValue(new Error('Connection failed'));

      await runCommand('resolve-library-id', null, null);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error running command:', 'Connection failed');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle tool execution errors', async () => {
      mockCallTool.mockRejectedValue(new Error('Tool execution failed'));

      await runCommand('resolve-library-id', '{"libraryName": "invalid"}', null);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error running command:', 'Tool execution failed');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle JSON parse errors', async () => {
      await runCommand('resolve-library-id', 'invalid json', null);

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle empty string arguments', async () => {
      await runCommand('resolve-library-id', '', null);

      expect(mockCallTool).toHaveBeenCalledWith(
        {
          name: 'resolve-library-id',
          arguments: {},
        },
        {}
      );
    });

    it('should handle whitespace-only arguments', async () => {
      await runCommand('resolve-library-id', '   ', null);

      expect(mockCallTool).toHaveBeenCalledWith(
        {
          name: 'resolve-library-id',
          arguments: {},
        },
        {}
      );
    });

    it('should close client after successful execution', async () => {
      await runCommand('resolve-library-id', null, null);

      expect(mockClose).toHaveBeenCalled();
    });

    it('should use correct client name and version', async () => {
      const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');

      await runCommand('resolve-library-id', null, null);

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
      const complexArg = '{"context7CompatibleLibraryID": "/vercel/next.js", "topic": "routing", "page": 2}';

      await runCommand('get-library-docs', complexArg, null);

      expect(mockCallTool).toHaveBeenCalledWith(
        {
          name: 'get-library-docs',
          arguments: {
            context7CompatibleLibraryID: '/vercel/next.js',
            topic: 'routing',
            page: 2,
          },
        },
        {}
      );
    });

    it('should handle error without message property', async () => {
      mockCallTool.mockRejectedValue('Plain error string');

      await runCommand('resolve-library-id', null, null);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error running command:', 'Plain error string');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle flag parameter gracefully', async () => {
      await runCommand('resolve-library-id', '{"libraryName": "react"}', '--some-flag');

      expect(consoleLogSpy).toHaveBeenCalledWith('resolve-library-id {"libraryName": "react"} --some-flag');
      expect(mockCallTool).toHaveBeenCalledWith(
        {
          name: 'resolve-library-id',
          arguments: { libraryName: 'react' },
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

      await runCommand('resolve-library-id', null, null);

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

      await runCommand('resolve-library-id', null, null);

      expect(callOrder).toEqual(['callTool', 'close']);
    });
  });
});
