import { describe, expect, it } from 'vitest';

import { COMMANDS, COMMANDS_DETAIL, COMMANDS_INFO, DEFAULT_MCP_SERVER } from '../../../src/config/constants.js';

describe('config/constants', () => {
  describe('DEFAULT_MCP_SERVER', () => {
    it('should have correct URL', () => {
      expect(DEFAULT_MCP_SERVER.url).toBe('http://127.0.0.1:3845/mcp');
    });

    it('should have url as a string', () => {
      expect(typeof DEFAULT_MCP_SERVER.url).toBe('string');
    });

    it('should have valid HTTP URL', () => {
      expect(DEFAULT_MCP_SERVER.url).toMatch(/^https?:\/\//);
    });
  });

  describe('COMMANDS', () => {
    it('should be an array', () => {
      expect(Array.isArray(COMMANDS)).toBe(true);
    });

    it('should start empty (populated dynamically)', () => {
      expect(COMMANDS).toHaveLength(0);
    });

    it('should be mutable (can be populated)', () => {
      // Test that we can push to it (it's not frozen)
      const originalLength = COMMANDS.length;
      COMMANDS.push('test-command');
      expect(COMMANDS).toHaveLength(originalLength + 1);
      COMMANDS.pop(); // Clean up
    });

    it('should have no duplicate commands when populated', () => {
      const uniqueCommands = [...new Set(COMMANDS)];
      expect(uniqueCommands).toHaveLength(COMMANDS.length);
    });

    it('should have all lowercase kebab-case or snake_case commands when populated', () => {
      COMMANDS.forEach(cmd => {
        expect(cmd).toMatch(/^[a-z_-]+$/);
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

    it('should start empty (populated dynamically)', () => {
      expect(COMMANDS_INFO).toHaveLength(0);
    });

    it('should have non-empty strings for all descriptions when populated', () => {
      COMMANDS_INFO.forEach(info => {
        expect(typeof info).toBe('string');
        expect(info.length).toBeGreaterThan(0);
      });
    });
  });

  describe('COMMANDS_DETAIL', () => {
    it('should be an array', () => {
      expect(Array.isArray(COMMANDS_DETAIL)).toBe(true);
    });

    it('should have same length as COMMANDS', () => {
      expect(COMMANDS_DETAIL).toHaveLength(COMMANDS.length);
    });

    it('should start empty (populated dynamically)', () => {
      expect(COMMANDS_DETAIL).toHaveLength(0);
    });

    it('should have strings for all details when populated', () => {
      COMMANDS_DETAIL.forEach(detail => {
        expect(typeof detail).toBe('string');
      });
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
