/**
 * Tests for src/services/constants.js
 *
 * Validates exported configuration objects for OpenAI Assistants
 */

const { ASSISTANTS, TOKEN_LIMITS } = require('../../src/services/constants');

describe('Constants Module', () => {
  describe('ASSISTANTS object', () => {
    test('should export ASSISTANTS object', () => {
      expect(ASSISTANTS).toBeDefined();
      expect(typeof ASSISTANTS).toBe('object');
    });

    test('should have 5 assistant IDs', () => {
      expect(Object.keys(ASSISTANTS)).toHaveLength(5);
    });

    test('should have required assistant keys', () => {
      expect(ASSISTANTS).toHaveProperty('orchestrator');
      expect(ASSISTANTS).toHaveProperty('case');
      expect(ASSISTANTS).toHaveProperty('diagnostic');
      expect(ASSISTANTS).toHaveProperty('journey');
      expect(ASSISTANTS).toHaveProperty('generator');
    });

    test('orchestrator should have valid assistant ID format', () => {
      expect(ASSISTANTS.orchestrator).toBe('asst_n4KRyVMnbDGE0bQrJAyJspYw');
      expect(ASSISTANTS.orchestrator).toMatch(/^asst_/);
    });

    test('case should have valid assistant ID format', () => {
      expect(ASSISTANTS.case).toBe('asst_gF2t61jT43Kgwx6mb6pDEty3');
      expect(ASSISTANTS.case).toMatch(/^asst_/);
    });

    test('diagnostic should have valid assistant ID format', () => {
      expect(ASSISTANTS.diagnostic).toBe('asst_UqKPTw0ui3JvOt8NuahMLkAc');
      expect(ASSISTANTS.diagnostic).toMatch(/^asst_/);
    });

    test('journey should have valid assistant ID format', () => {
      expect(ASSISTANTS.journey).toBe('asst_ydS6z2mQO82DtdBN4B1HSHP3');
      expect(ASSISTANTS.journey).toMatch(/^asst_/);
    });

    test('generator should have valid assistant ID format', () => {
      expect(ASSISTANTS.generator).toBe('asst_rG9kO0tUDTmSa1xzMnIEhRmU');
      expect(ASSISTANTS.generator).toMatch(/^asst_/);
    });

    test('all assistant IDs should be non-empty strings', () => {
      Object.values(ASSISTANTS).forEach(id => {
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(0);
      });
    });
  });

  describe('TOKEN_LIMITS object', () => {
    test('should export TOKEN_LIMITS object', () => {
      expect(TOKEN_LIMITS).toBeDefined();
      expect(typeof TOKEN_LIMITS).toBe('object');
    });

    test('should have token limits for 5 assistants', () => {
      expect(Object.keys(TOKEN_LIMITS)).toHaveLength(5);
    });

    test('should have required token limit keys', () => {
      expect(TOKEN_LIMITS).toHaveProperty('orchestrator');
      expect(TOKEN_LIMITS).toHaveProperty('case');
      expect(TOKEN_LIMITS).toHaveProperty('diagnostic');
      expect(TOKEN_LIMITS).toHaveProperty('journey');
      expect(TOKEN_LIMITS).toHaveProperty('generator');
    });

    test('orchestrator limit should be 1200', () => {
      expect(TOKEN_LIMITS.orchestrator).toBe(1200);
    });

    test('case limit should be 1000', () => {
      expect(TOKEN_LIMITS.case).toBe(1000);
    });

    test('diagnostic limit should be 600', () => {
      expect(TOKEN_LIMITS.diagnostic).toBe(600);
    });

    test('journey limit should be 1200', () => {
      expect(TOKEN_LIMITS.journey).toBe(1200);
    });

    test('generator limit should be 1500', () => {
      expect(TOKEN_LIMITS.generator).toBe(1500);
    });

    test('all token limits should be positive numbers', () => {
      Object.values(TOKEN_LIMITS).forEach(limit => {
        expect(typeof limit).toBe('number');
        expect(limit).toBeGreaterThan(0);
      });
    });

    test('all token limits should be reasonable (< 5000)', () => {
      Object.values(TOKEN_LIMITS).forEach(limit => {
        expect(limit).toBeLessThan(5000);
      });
    });
  });

  describe('Constants alignment', () => {
    test('should have same keys in ASSISTANTS and TOKEN_LIMITS', () => {
      const assistantKeys = Object.keys(ASSISTANTS).sort();
      const limitKeys = Object.keys(TOKEN_LIMITS).sort();
      expect(assistantKeys).toEqual(limitKeys);
    });

    test('each assistant should have corresponding token limit', () => {
      Object.keys(ASSISTANTS).forEach(key => {
        expect(TOKEN_LIMITS[key]).toBeDefined();
      });
    });
  });
});
