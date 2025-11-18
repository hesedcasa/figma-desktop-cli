import { describe, expect, it } from 'vitest';

import { COMMANDS, COMMANDS_DETAIL, COMMANDS_INFO, DEFAULT_MCP_SERVER } from '../../../src/config/constants.js';

describe('config/constants', () => {
  describe('DEFAULT_MCP_SERVER', () => {
    it('should have correct command', () => {
      expect(DEFAULT_MCP_SERVER.command).toBe('npx');
    });

    it('should have correct args array', () => {
      expect(DEFAULT_MCP_SERVER.args).toEqual(['-y', '@upstash/context7-mcp']);
    });

    it('should have args as an array', () => {
      expect(Array.isArray(DEFAULT_MCP_SERVER.args)).toBe(true);
    });
  });

  describe('COMMANDS', () => {
    it('should be an array', () => {
      expect(Array.isArray(COMMANDS)).toBe(true);
    });

    it('should contain 2 commands', () => {
      expect(COMMANDS).toHaveLength(2);
    });

    it('should include resolve-library-id command', () => {
      expect(COMMANDS).toContain('resolve-library-id');
    });

    it('should include get-library-docs command', () => {
      expect(COMMANDS).toContain('get-library-docs');
    });

    it('should include all expected commands', () => {
      const expectedCommands = ['resolve-library-id', 'get-library-docs'];

      expect(COMMANDS).toEqual(expectedCommands);
    });

    it('should have no duplicate commands', () => {
      const uniqueCommands = [...new Set(COMMANDS)];
      expect(uniqueCommands).toHaveLength(COMMANDS.length);
    });

    it('should have all lowercase kebab-case commands', () => {
      COMMANDS.forEach(cmd => {
        expect(cmd).toMatch(/^[a-z-]+$/);
      });
    });
  });

  describe('COMMANDS_INFO', () => {
    it('should be an array', () => {
      expect(Array.isArray(COMMANDS_INFO)).toBe(true);
    });

    it('should have same length as COMMANDS', () => {
      expect(COMMANDS_INFO).toHaveLength(COMMANDS.length);
    });

    it('should have 2 descriptions', () => {
      expect(COMMANDS_INFO).toHaveLength(2);
    });

    it('should have non-empty strings for all descriptions', () => {
      COMMANDS_INFO.forEach(info => {
        expect(typeof info).toBe('string');
        expect(info.length).toBeGreaterThan(0);
      });
    });

    it('should have description for resolve-library-id at correct index', () => {
      const resolveIndex = COMMANDS.indexOf('resolve-library-id');
      expect(COMMANDS_INFO[resolveIndex]).toContain('Resolves');
    });

    it('should have description for get-library-docs at correct index', () => {
      const docsIndex = COMMANDS.indexOf('get-library-docs');
      expect(COMMANDS_INFO[docsIndex]).toContain('Fetches');
    });
  });

  describe('COMMANDS_DETAIL', () => {
    it('should be an array', () => {
      expect(Array.isArray(COMMANDS_DETAIL)).toBe(true);
    });

    it('should have same length as COMMANDS', () => {
      expect(COMMANDS_DETAIL).toHaveLength(COMMANDS.length);
    });

    it('should have 2 detail entries', () => {
      expect(COMMANDS_DETAIL).toHaveLength(2);
    });

    it('should have strings for all details', () => {
      COMMANDS_DETAIL.forEach(detail => {
        expect(typeof detail).toBe('string');
      });
    });

    it('should have detail for resolve-library-id containing parameters', () => {
      const resolveIndex = COMMANDS.indexOf('resolve-library-id');
      const detail = COMMANDS_DETAIL[resolveIndex];
      expect(detail).toContain('libraryName');
    });

    it('should have detail for get-library-docs containing parameters', () => {
      const docsIndex = COMMANDS.indexOf('get-library-docs');
      const detail = COMMANDS_DETAIL[docsIndex];
      expect(detail).toContain('context7CompatibleLibraryID');
    });

    it('should have detail for get-library-docs mentioning optional parameters', () => {
      const docsIndex = COMMANDS.indexOf('get-library-docs');
      const detail = COMMANDS_DETAIL[docsIndex];
      expect(detail).toContain('topic');
      expect(detail).toContain('page');
    });
  });

  describe('Array alignment', () => {
    it('should have COMMANDS, COMMANDS_INFO, and COMMANDS_DETAIL with same length', () => {
      expect(COMMANDS.length).toBe(COMMANDS_INFO.length);
      expect(COMMANDS.length).toBe(COMMANDS_DETAIL.length);
    });

    it('should maintain correct index mapping between arrays', () => {
      COMMANDS.forEach((cmd, idx) => {
        expect(COMMANDS_INFO[idx]).toBeDefined();
        expect(COMMANDS_DETAIL[idx]).toBeDefined();
        expect(typeof COMMANDS_INFO[idx]).toBe('string');
        expect(typeof COMMANDS_DETAIL[idx]).toBe('string');
      });
    });
  });
});
