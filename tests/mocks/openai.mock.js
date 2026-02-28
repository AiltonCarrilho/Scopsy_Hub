/**
 * Mock for OpenAI SDK
 * Used in tests to avoid making real API calls
 */

const openaiMock = {
  beta: {
    threads: {
      create: jest.fn(async () => ({
        id: 'thread_test_123456789',
        object: 'thread',
        created_at: Math.floor(Date.now() / 1000)
      })),

      retrieve: jest.fn(async (threadId) => ({
        id: threadId,
        object: 'thread',
        created_at: Math.floor(Date.now() / 1000)
      })),

      messages: {
        create: jest.fn(async () => ({
          id: 'msg_test_123456789',
          object: 'thread.message',
          created_at: Math.floor(Date.now() / 1000),
          thread_id: 'thread_test_123456789',
          role: 'user',
          content: [
            {
              type: 'text',
              text: {
                value: 'Test message'
              }
            }
          ]
        })),

        list: jest.fn(async (threadId, options = {}) => ({
          object: 'list',
          data: [
            {
              id: 'msg_1',
              object: 'thread.message',
              created_at: Math.floor(Date.now() / 1000) - 1000,
              thread_id: threadId,
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: {
                    value: 'User message 1'
                  }
                }
              ]
            },
            {
              id: 'msg_2',
              object: 'thread.message',
              created_at: Math.floor(Date.now() / 1000) - 500,
              thread_id: threadId,
              role: 'assistant',
              content: [
                {
                  type: 'text',
                  text: {
                    value: 'Assistant response'
                  }
                }
              ]
            }
          ]
        }))
      },

      runs: {
        create: jest.fn(async (threadId, options = {}) => ({
          id: 'run_test_123456789',
          object: 'thread.run',
          created_at: Math.floor(Date.now() / 1000),
          thread_id: threadId,
          assistant_id: options.assistant_id,
          status: 'queued'
        })),

        retrieve: jest.fn(async (threadId, runId) => ({
          id: runId,
          object: 'thread.run',
          created_at: Math.floor(Date.now() / 1000),
          thread_id: threadId,
          status: 'completed',
          completed_at: Math.floor(Date.now() / 1000)
        })),

        list: jest.fn(async (threadId, options = {}) => ({
          object: 'list',
          data: [
            {
              id: 'run_1',
              object: 'thread.run',
              created_at: Math.floor(Date.now() / 1000),
              thread_id: threadId,
              status: 'completed'
            }
          ]
        }))
      }
    }
  }
};

module.exports = openaiMock;
