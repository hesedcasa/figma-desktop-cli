import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { parseArguments } from '../../../src/utils/argParser.js';

// Mock the dependencies
vi.mock('../../../src/commands/index.js', () => ({
  getCurrentVersion: vi.fn(() => '1.1.1'),
  printAvailableCommands: vi.fn(),
  printCommandDetail: vi.fn(),
  runCommand: vi.fn(),
}));

vi.mock('../../../src/config/index.js', () => ({
  COMMANDS: ['navigate_page', 'take_screenshot', 'list_pages'],
}));

describe('argParser', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    processExitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => {}) as unknown as (...args: unknown[]) => never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('parseArguments', () => {
    it('should handle --version flag', async () => {
      const { getCurrentVersion } = await import('../../../src/commands/index.js');

      await parseArguments(['--version']);

      expect(getCurrentVersion).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('1.1.1');
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('should handle -v flag', async () => {
      const { getCurrentVersion } = await import('../../../src/commands/index.js');

      await parseArguments(['-v']);

      expect(getCurrentVersion).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('1.1.1');
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('should handle --commands flag', async () => {
      const { printAvailableCommands } = await import('../../../src/commands/index.js');

      await parseArguments(['--commands']);

      expect(printAvailableCommands).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('should handle command-specific help with -h', async () => {
      const { printCommandDetail } = await import('../../../src/commands/index.js');

      await parseArguments(['navigate_page', '-h']);

      expect(printCommandDetail).toHaveBeenCalledWith('navigate_page');
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('should handle --help flag', async () => {
      await parseArguments(['--help']);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('should handle -h flag', async () => {
      await parseArguments(['-h']);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('should execute command in headless mode with arguments', async () => {
      const { runCommand } = await import('../../../src/commands/index.js');

      await parseArguments(['navigate_page', '{"url": "https://google.com"}']);

      expect(runCommand).toHaveBeenCalledWith('navigate_page', '{"url": "https://google.com"}', null);
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('should execute command in headless mode with flag', async () => {
      const { runCommand } = await import('../../../src/commands/index.js');

      await parseArguments(['navigate_page', '--headless', '{"url": "https://google.com"}']);

      expect(runCommand).toHaveBeenCalledWith('navigate_page', '{"url": "https://google.com"}', '--headless');
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('should execute command in headless mode without arguments', async () => {
      const { runCommand } = await import('../../../src/commands/index.js');

      await parseArguments(['list_pages']);

      expect(runCommand).toHaveBeenCalledWith('list_pages', null, null);
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('should return false when no arguments provided', async () => {
      const result = await parseArguments([]);

      expect(result).toBe(false);
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should return false for non-command arguments', async () => {
      const result = await parseArguments(['some-random-arg']);

      expect(result).toBe(false);
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should handle command with flag but no params', async () => {
      const { runCommand } = await import('../../../src/commands/index.js');

      await parseArguments(['list_pages', '--headless']);

      expect(runCommand).toHaveBeenCalledWith('list_pages', null, '--headless');
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });
  });
});
