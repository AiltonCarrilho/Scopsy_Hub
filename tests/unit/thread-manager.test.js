/**
 * Tests for src/services/thread-manager.js
 *
 * Tests thread creation, retrieval, and compression with mocked OpenAI API
 * NOTE: Complete mocking of OpenAI requires refactoring to inject dependency
 * Current tests are basic validation; full E2E tests would use real API or complete mocks
 */

// Mock database
jest.mock('../../src/services/database', () => ({
  saveToBoostspace: jest.fn(),
  getFromBoostspace: jest.fn(),
  updateInBoostspace: jest.fn(),
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
        create: jest.fn(async () => ({
          id: 'thread_test_123456789',
          object: 'thread',
          created_at: Math.floor(Date.now() / 1000)
        })),
        messages: {
          list: jest.fn(async () => ({
            object: 'list',
            data: []
          }))
        },
        runs: {
          create: jest.fn(async () => ({
            id: 'run_test_123456789',
            status: 'queued'
          }))
        }
      }
    }
  }));
});

// Import after mocking
const { getOrCreateThread, compressThreadHistory } = require('../../src/services/thread-manager');
const { saveToBoostspace, getFromBoostspace } = require('../../src/services/database');

describe('Thread Manager Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Module exports', () => {
    test('should export getOrCreateThread function', () => {
      expect(typeof getOrCreateThread).toBe('function');
    });

    test('should export compressThreadHistory function', () => {
      expect(typeof compressThreadHistory).toBe('function');
    });
  });

  describe('Function validation', () => {
    test('getOrCreateThread exists and is async function', async () => {
      expect(typeof getOrCreateThread).toBe('function');
      expect(getOrCreateThread.constructor.name).toBe('AsyncFunction');
    });

    test('compressThreadHistory exists and is async function', async () => {
      expect(typeof compressThreadHistory).toBe('function');
      expect(compressThreadHistory.constructor.name).toBe('AsyncFunction');
    });
  });
});
