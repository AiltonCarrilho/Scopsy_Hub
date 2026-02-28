/**
 * Tests for src/services/message-handler.js
 *
 * Tests message sending, polling, routing, and caching
 * NOTE: Complete mocking of OpenAI and dependencies requires refactoring
 * Current tests focus on pure functions (routing) and database interactions
 */

// Mock database
jest.mock('../../src/services/database', () => ({
  saveToBoostspace: jest.fn(),
  getFromBoostspace: jest.fn(),
  updateInBoostspace: jest.fn(),
}));

// Mock token-counter
jest.mock('../../src/services/token-counter', () => ({
  estimateTokens: jest.fn((text) => Math.ceil(text.length / 4)),
  updateUserStats: jest.fn(),
  sleep: jest.fn((ms) => new Promise(resolve => setTimeout(resolve, 0))), // No actual delay in tests
  getCached: jest.fn(),
  setCached: jest.fn(),
}));

// Mock logger
jest.mock('../../src/config/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
}));

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn(() => ({
    beta: {
      threads: {
        messages: {
          create: jest.fn(async () => ({})),
          list: jest.fn(async () => ({
            data: [{
              content: [{ type: 'text', text: { value: 'Response' } }]
            }]
          }))
        },
        runs: {
          create: jest.fn(async () => ({ id: 'run_123', status: 'queued' })),
          retrieve: jest.fn(async () => ({ status: 'completed' }))
        }
      }
    }
  }));
});

const {
  routeToAssistant,
  saveMessagesToBoostspace
} = require('../../src/services/message-handler');

const { saveToBoostspace, getFromBoostspace } = require('../../src/services/database');
const { updateUserStats } = require('../../src/services/token-counter');

describe('Message Handler Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('routeToAssistant() - Pure Function Tests', () => {
    test('should keep current assistant if in active conversation', () => {
      expect(routeToAssistant('continue', 'case')).toBe('case');
      expect(routeToAssistant('next step', 'diagnostic')).toBe('diagnostic');
      expect(routeToAssistant('what about this', 'journey')).toBe('journey');
    });

    test('should default to case assistant for unknown messages', () => {
      expect(routeToAssistant('random message')).toBe('case');
      expect(routeToAssistant('hello')).toBe('case');
      expect(routeToAssistant('tell me')).toBe('case');
    });

    test('should handle null current assistant', () => {
      const result = routeToAssistant('any message', null);
      expect(result).toBe('case');
    });

    test('should return a valid assistant type', () => {
      const result = routeToAssistant('test message');
      const validTypes = ['orchestrator', 'case', 'diagnostic', 'journey', 'generator'];
      expect(validTypes).toContain(result);
    });
  });

  describe('saveMessagesToBoostspace()', () => {
    test('should call saveToBoostspace for user message', async () => {
      getFromBoostspace.mockResolvedValue([{ id: 'conv-123' }]);

      await saveMessagesToBoostspace(
        'thread_123',
        'user-123',
        'User message',
        'Assistant response',
        100
      );

      expect(saveToBoostspace).toHaveBeenCalledWith(
        'messages',
        expect.objectContaining({
          role: 'user',
          content: 'User message'
        })
      );
    });

    test('should call saveToBoostspace for assistant message', async () => {
      getFromBoostspace.mockResolvedValue([{ id: 'conv-123' }]);

      await saveMessagesToBoostspace(
        'thread_123',
        'user-123',
        'User message',
        'Assistant response',
        100
      );

      expect(saveToBoostspace).toHaveBeenCalledWith(
        'messages',
        expect.objectContaining({
          role: 'assistant',
          content: 'Assistant response'
        })
      );
    });

    test('should call updateUserStats', async () => {
      getFromBoostspace.mockResolvedValue([{ id: 'conv-123' }]);

      await saveMessagesToBoostspace(
        'thread_123',
        'user-123',
        'Test',
        'Response',
        50
      );

      expect(updateUserStats).toHaveBeenCalledWith('user-123', 50);
    });

    test('should handle missing conversation gracefully', async () => {
      getFromBoostspace.mockResolvedValue([]);

      // Should not throw
      await expect(
        saveMessagesToBoostspace('thread_123', 'user-123', 'Test', 'Response', 50)
      ).resolves.not.toThrow();

      // Should not save messages
      expect(saveToBoostspace).not.toHaveBeenCalled();
    });

    test('should handle database errors gracefully', async () => {
      getFromBoostspace.mockRejectedValue(new Error('DB Error'));

      // Should not throw
      await expect(
        saveMessagesToBoostspace('thread_123', 'user-123', 'Test', 'Response', 50)
      ).resolves.not.toThrow();
    });
  });

  describe('Module exports', () => {
    test('should export routeToAssistant function', () => {
      expect(typeof routeToAssistant).toBe('function');
    });

    test('should export saveMessagesToBoostspace function', () => {
      expect(typeof saveMessagesToBoostspace).toBe('function');
    });
  });
});
