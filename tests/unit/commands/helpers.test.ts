import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getCurrentVersion, printAvailableCommands, printCommandDetail } from '../../../src/commands/helpers.js';

describe('commands/helpers', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentVersion', () => {
    it('should return version as string', () => {
      const version = getCurrentVersion();
      expect(typeof version).toBe('string');
    });

    it('should return version in semver format', () => {
      const version = getCurrentVersion();
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('printAvailableCommands', () => {
    it('should call console.log', () => {
      printAvailableCommands();
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should print header', () => {
      printAvailableCommands();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Available commands'));
    });

    it('should print all 2 commands with their info', () => {
      printAvailableCommands();
      // Should be called once for header + 2 times for commands
      expect(consoleLogSpy).toHaveBeenCalledTimes(3);
    });

    it('should print commands with numbers', () => {
      printAvailableCommands();
      const calls = consoleLogSpy.mock.calls;
      expect(calls[1][0]).toMatch(/^1\./);
      expect(calls[2][0]).toMatch(/^2\./);
    });

    it('should print resolve-library-id command', () => {
      printAvailableCommands();
      const allCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(allCalls).toContain('resolve-library-id');
    });

    it('should print command descriptions', () => {
      printAvailableCommands();
      const allCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(allCalls).toContain('Resolves a package/product name');
    });
  });

  describe('printCommandDetail', () => {
    beforeEach(() => {
      consoleLogSpy.mockClear();
    });

    it('should print detail for valid command', () => {
      printCommandDetail('resolve-library-id');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should print command name', () => {
      printCommandDetail('resolve-library-id');
      const allCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(allCalls).toContain('resolve-library-id');
    });

    it('should print command description', () => {
      printCommandDetail('resolve-library-id');
      const allCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(allCalls).toContain('Resolves a package/product name');
    });

    it('should print command parameters', () => {
      printCommandDetail('resolve-library-id');
      const allCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(allCalls).toContain('libraryName');
    });

    it('should handle unknown command', () => {
      printCommandDetail('unknown_command');
      const allCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(allCalls).toContain('Unknown command');
    });

    it('should print available commands when unknown command provided', () => {
      printCommandDetail('unknown_command');
      const allCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(allCalls).toContain('Available commands');
    });

    it('should handle empty command name', () => {
      printCommandDetail('');
      const allCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(allCalls).toContain('Please provide a command name');
    });

    it('should handle whitespace-only command name', () => {
      printCommandDetail('   ');
      const allCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(allCalls).toContain('Please provide a command name');
    });

    it('should print available commands when empty command provided', () => {
      printCommandDetail('');
      const allCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(allCalls).toContain('Available commands');
    });

    it('should handle all valid commands', () => {
      const commands = ['resolve-library-id', 'get-library-docs'];

      commands.forEach(cmd => {
        consoleLogSpy.mockClear();
        printCommandDetail(cmd);
        expect(consoleLogSpy).toHaveBeenCalled();
        const allCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
        expect(allCalls).toContain(cmd);
      });
    });

    it('should trim command name before processing', () => {
      consoleLogSpy.mockClear();
      printCommandDetail('  resolve-library-id  ');
      const allCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(allCalls).toContain('resolve-library-id');
      expect(allCalls).toContain('Resolves a package/product name');
    });
  });
});
