/**
 * Tests for src/services/token-counter.js
 *
 * Tests token estimation, cache management, and user stats updates
 */

// Mock the database module
jest.mock('../../src/services/database', () => ({
  saveToBoostspace: jest.fn(),
  getFromBoostspace: jest.fn(),
  updateInBoostspace: jest.fn(),
}));

// Mock the logger
jest.mock('../../src/config/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
}));

const {
  estimateTokens,
  updateUserStats,
  sleep,
  getCached,
  setCached,
  clearCache
} = require('../../src/services/token-counter');

const { saveToBoostspace, getFromBoostspace, updateInBoostspace } = require('../../src/services/database');

describe('Token Counter Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearCache();
  });

  afterEach(() => {
    clearCache();
  });

  describe('estimateTokens()', () => {
    test('should estimate tokens correctly for basic text', () => {
      const text = 'Hello world'; // 11 characters / 4 = 2.75 → 3 tokens
      expect(estimateTokens(text)).toBe(3);
    });

    test('should return 1 token for 1-4 characters', () => {
      expect(estimateTokens('a')).toBe(1);
      expect(estimateTokens('abc')).toBe(1);
      expect(estimateTokens('abcd')).toBe(1);
    });

    test('should return 2 tokens for 5-8 characters', () => {
      expect(estimateTokens('abcde')).toBe(2);
      expect(estimateTokens('abcdefgh')).toBe(2);
    });

    test('should handle empty string', () => {
      expect(estimateTokens('')).toBe(0);
    });

    test('should handle long text', () => {
      const longText = 'a'.repeat(1000); // 1000 / 4 = 250
      expect(estimateTokens(longText)).toBe(250);
    });

    test('should handle special characters correctly', () => {
      const textWithSpecial = 'Olá, mundo! 🌍'; // 14 chars / 4 = 3.5 → 4
      const estimated = estimateTokens(textWithSpecial);
      expect(estimated).toBeGreaterThan(0);
    });

    test('should be deterministic (same input = same output)', () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      const estimate1 = estimateTokens(text);
      const estimate2 = estimateTokens(text);
      expect(estimate1).toBe(estimate2);
    });

    test('should round up fractional tokens', () => {
      const text = 'test'; // 4 chars / 4 = 1
      expect(estimateTokens(text)).toBe(1);

      const text2 = 'testa'; // 5 chars / 4 = 1.25 → 2
      expect(estimateTokens(text2)).toBe(2);
    });
  });

  describe('Cache functions', () => {
    test('setCached should store value', () => {
      setCached('test-key', 'test-value');
      expect(getCached('test-key')).toBe('test-value');
    });

    test('getCached should return null for missing key', () => {
      expect(getCached('non-existent-key')).toBeNull();
    });

    test('setCached should overwrite existing value', () => {
      setCached('key1', 'value1');
      setCached('key1', 'value2');
      expect(getCached('key1')).toBe('value2');
    });

    test('should cache different types of values', () => {
      setCached('string', 'text');
      setCached('number', 42);
      setCached('object', { foo: 'bar' });
      setCached('array', [1, 2, 3]);

      expect(getCached('string')).toBe('text');
      expect(getCached('number')).toBe(42);
      expect(getCached('object')).toEqual({ foo: 'bar' });
      expect(getCached('array')).toEqual([1, 2, 3]);
    });

    test('clearCache should remove all cached values', () => {
      setCached('key1', 'value1');
      setCached('key2', 'value2');

      clearCache();

      expect(getCached('key1')).toBeNull();
      expect(getCached('key2')).toBeNull();
    });
  });

  describe('sleep()', () => {
    test('should resolve after specified time', async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;

      // Allow 20ms tolerance for timing variations
      expect(elapsed).toBeGreaterThanOrEqual(80);
      expect(elapsed).toBeLessThan(200);
    });

    test('should handle 0ms sleep', async () => {
      const start = Date.now();
      await sleep(0);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(50);
    });

    test('should be awaitable', async () => {
      let completed = false;
      sleep(50).then(() => {
        completed = true;
      });

      await sleep(100);
      expect(completed).toBe(true);
    });
  });

  describe('updateUserStats()', () => {
    test('should create stats for new user', async () => {
      getFromBoostspace.mockResolvedValue([]);
      saveToBoostspace.mockResolvedValue({ id: 'stat-123' });

      await updateUserStats('user-123', 100);

      expect(saveToBoostspace).toHaveBeenCalledWith(
        'user_stats',
        expect.objectContaining({
          user_id: 'user-123',
          cases_completed: 0,
          practice_hours: 0,
          accuracy: 0,
          streak_days: 0,
          badges: [],
          xp_points: Math.floor(100 / 10),
          total_tokens_spent: 100
        })
      );
    });

    test('should update stats for existing user', async () => {
      const existingStats = { id: 'stat-123', user_id: 'user-123' };
      getFromBoostspace.mockResolvedValue([existingStats]);
      updateInBoostspace.mockResolvedValue({ id: 'stat-123' });

      await updateUserStats('user-123', 100);

      expect(updateInBoostspace).toHaveBeenCalledWith(
        'user_stats',
        'stat-123',
        expect.objectContaining({
          last_activity: expect.any(String),
          updated_at: expect.any(String)
        })
      );
    });

    test('should handle database errors gracefully', async () => {
      getFromBoostspace.mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(updateUserStats('user-123', 100)).resolves.not.toThrow();
    });

    test('should set last_activity to current time', async () => {
      getFromBoostspace.mockResolvedValue([]);

      const beforeCall = new Date();
      await updateUserStats('user-123', 100);
      const afterCall = new Date();

      const callArgs = saveToBoostspace.mock.calls[0][1];
      const lastActivity = new Date(callArgs.last_activity);

      expect(lastActivity.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(lastActivity.getTime()).toBeLessThanOrEqual(afterCall.getTime() + 1000);
    });
  });
});
