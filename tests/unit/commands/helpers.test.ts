import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getCurrentVersion, printAvailableCommands, printCommandDetail } from '../../../src/commands/helpers.js';
import { COMMANDS, COMMANDS_DETAIL, COMMANDS_INFO } from '../../../src/config/constants.js';

describe('commands/helpers', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Populate test data to simulate discovered tools
    COMMANDS.length = 0;
    COMMANDS_INFO.length = 0;
    COMMANDS_DETAIL.length = 0;

    COMMANDS.push('get_current_page', 'navigate_page');
    COMMANDS_INFO.push('Gets information about the current page', 'Navigates to a specific page');
    COMMANDS_DETAIL.push(
      '\nParameters:\nNo parameters required\n\nExample:\nget_current_page {}\n',
      '\nParameters:\n- pageId (required): string - The ID of the page to navigate to\n\nExample:\nnavigate_page {"pageId":"<pageId>"}\n'
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Clean up
    COMMANDS.length = 0;
    COMMANDS_INFO.length = 0;
    COMMANDS_DETAIL.length = 0;
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

    it('should print get_current_page command', () => {
      printAvailableCommands();
      const allCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(allCalls).toContain('get_current_page');
    });

    it('should print command descriptions', () => {
      printAvailableCommands();
      const allCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(allCalls).toContain('Gets information about the current page');
    });
  });

  describe('printCommandDetail', () => {
    beforeEach(() => {
      consoleLogSpy.mockClear();
    });

    it('should print detail for valid command', () => {
      printCommandDetail('get_current_page');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should print command name', () => {
      printCommandDetail('get_current_page');
      const allCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(allCalls).toContain('get_current_page');
    });

    it('should print command description', () => {
      printCommandDetail('get_current_page');
      const allCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(allCalls).toContain('Gets information about the current page');
    });

    it('should print command parameters', () => {
      printCommandDetail('navigate_page');
      const allCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(allCalls).toContain('pageId');
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
      const commands = ['get_current_page', 'navigate_page'];

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
      printCommandDetail('  get_current_page  ');
      const allCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(allCalls).toContain('get_current_page');
      expect(allCalls).toContain('Gets information about the current page');
    });
  });
});
