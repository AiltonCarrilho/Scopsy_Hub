/**
 * INTEGRATION TEST: Mock Kiwify Webhook Client
 *
 * Simulates Kiwify webhook requests with valid/invalid signatures
 * Tests the complete flow: signature validation → event processing → async handling
 *
 * Usage: node tests/integration-webhook-mock.js
 */

const crypto = require('crypto');
const http = require('http');

// ========================================
// CONFIGURATION
// ========================================
const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/kiwify';
const WEBHOOK_HEALTH_URL = 'http://localhost:3000/api/webhooks/kiwify/health';
const KIWIFY_SECRET = process.env.KIWIFY_WEBHOOK_SECRET || 'test-webhook-secret-v1-sha256-timing-safe-validation';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

// ========================================
// HELPER: Generate HMAC-SHA256 Signature
// ========================================
/**
 * Generates HMAC-SHA256 signature like Kiwify does
 * @param {Object} payload - Webhook payload
 * @param {string} secret - Webhook secret
 * @returns {string} Hex-encoded signature
 */
function generateSignature(payload, secret) {
  const stringPayload = JSON.stringify(payload);
  return crypto
    .createHmac('sha256', secret)
    .update(stringPayload)
    .digest('hex');
}

// ========================================
// TEST PAYLOADS
// ========================================
const TEST_PAYLOADS = {
  orderApproved: {
    event_type: 'order.approved',
    event: 'order.approved',
    webhook_event_type: 'order.approved',
    order_id: 'test-order-123',
    customer: {
      email: 'customer@example.com',
      name: 'Test Customer'
    },
    product_id: 'basic-plan',
    amount: 2990,
    currency: 'BRL'
  },

  subscriptionCanceled: {
    event_type: 'subscription.canceled',
    event: 'subscription.canceled',
    subscription_id: 'sub-test-456',
    customer: {
      email: 'customer@example.com'
    }
  },

  subscriptionRenewed: {
    event_type: 'subscription.renewed',
    event: 'subscription.renewed',
    subscription_id: 'sub-test-789',
    customer: {
      email: 'customer@example.com'
    }
  },

  orderRefunded: {
    event_type: 'order.refunded',
    event: 'order.refunded',
    order_id: 'test-order-refund',
    customer: {
      email: 'customer@example.com'
    }
  },

  unknownEvent: {
    event_type: 'unknown.event',
    event: 'unknown.event',
    customer: {
      email: 'customer@example.com'
    }
  }
};

// ========================================
// TEST RUNNER
// ========================================
class IntegrationTestRunner {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
  }

  log(type, message, details = '') {
    const prefix = {
      info: `${COLORS.blue}ℹ${COLORS.reset}`,
      success: `${COLORS.green}✅${COLORS.reset}`,
      error: `${COLORS.red}❌${COLORS.reset}`,
      warn: `${COLORS.yellow}⚠${COLORS.reset}`,
      test: `${COLORS.bold}📋${COLORS.reset}`
    };

    console.log(`${prefix[type]} ${message}${details ? ` ${details}` : ''}`);
  }

  /**
   * Send HTTP POST request and get response
   */
  async sendRequest(url, payload, signature, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const requestOptions = {
        method: 'POST',
        hostname: urlObj.hostname,
        port: urlObj.port || 80,
        path: urlObj.pathname + urlObj.search,
        headers: {
          'Content-Type': 'application/json',
          'x-kiwify-signature': signature || '',
          ...options.headers
        }
      };

      const req = http.request(requestOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          });
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      if (payload) {
        req.write(JSON.stringify(payload));
      }
      req.end();
    });
  }

  /**
   * TEST 1: Health Check
   */
  async testHealthCheck() {
    this.log('test', 'TEST 1: Health Check Endpoint');
    try {
      const response = await this.sendRequest(WEBHOOK_HEALTH_URL, null, '');

      if (response.statusCode === 200) {
        this.log('success', 'Health check endpoint responding', `(${response.statusCode})`);
        this.passed++;
      } else {
        this.log('error', 'Health check failed', `(${response.statusCode})`);
        this.failed++;
      }
    } catch (err) {
      this.log('error', 'Health check error', err.message);
      this.failed++;
    }
    console.log('');
  }

  /**
   * TEST 2: Valid Signature Acceptance
   */
  async testValidSignature() {
    this.log('test', 'TEST 2: Valid Signature Acceptance');
    const payload = TEST_PAYLOADS.orderApproved;
    const signature = generateSignature(payload, KIWIFY_SECRET);

    try {
      const response = await this.sendRequest(WEBHOOK_URL, payload, signature);

      if (response.statusCode === 200) {
        this.log('success', 'Valid signature accepted', `(${response.statusCode})`);
        this.log('info', 'Response', JSON.stringify(response.body));
        this.passed++;
      } else {
        this.log('error', 'Valid signature rejected', `(${response.statusCode})`);
        this.failed++;
      }
    } catch (err) {
      this.log('error', 'Request failed', err.message);
      this.failed++;
    }
    console.log('');
  }

  /**
   * TEST 3: Invalid Signature Rejection
   */
  async testInvalidSignature() {
    this.log('test', 'TEST 3: Invalid Signature Rejection');
    const payload = TEST_PAYLOADS.orderApproved;
    const invalidSignature = 'invalid-signature-xyz123';

    try {
      const response = await this.sendRequest(WEBHOOK_URL, payload, invalidSignature);

      if (response.statusCode === 401) {
        this.log('success', 'Invalid signature rejected', `(${response.statusCode})`);
        this.passed++;
      } else {
        this.log('error', 'Invalid signature not rejected', `(${response.statusCode})`);
        this.failed++;
      }
    } catch (err) {
      this.log('error', 'Request failed', err.message);
      this.failed++;
    }
    console.log('');
  }

  /**
   * TEST 4: Missing Signature Rejection
   */
  async testMissingSignature() {
    this.log('test', 'TEST 4: Missing Signature Rejection');
    const payload = TEST_PAYLOADS.orderApproved;

    try {
      const response = await this.sendRequest(WEBHOOK_URL, payload, '');

      if (response.statusCode === 401) {
        this.log('success', 'Missing signature rejected', `(${response.statusCode})`);
        this.passed++;
      } else {
        this.log('error', 'Missing signature not rejected', `(${response.statusCode})`);
        this.failed++;
      }
    } catch (err) {
      this.log('error', 'Request failed', err.message);
      this.failed++;
    }
    console.log('');
  }

  /**
   * TEST 5: All Event Types Processing
   */
  async testAllEventTypes() {
    this.log('test', 'TEST 5: All Event Types Processing');

    for (const [eventName, payload] of Object.entries(TEST_PAYLOADS)) {
      if (eventName === 'unknownEvent') continue; // Test separately

      const signature = generateSignature(payload, KIWIFY_SECRET);
      try {
        const response = await this.sendRequest(WEBHOOK_URL, payload, signature);

        if (response.statusCode === 200) {
          this.log('success', `Event processed: ${eventName}`, `(${response.statusCode})`);
          this.passed++;
        } else {
          this.log('error', `Event failed: ${eventName}`, `(${response.statusCode})`);
          this.failed++;
        }
      } catch (err) {
        this.log('error', `Event error: ${eventName}`, err.message);
        this.failed++;
      }
    }
    console.log('');
  }

  /**
   * TEST 6: Unknown Event Handling
   */
  async testUnknownEvent() {
    this.log('test', 'TEST 6: Unknown Event Handling');
    const payload = TEST_PAYLOADS.unknownEvent;
    const signature = generateSignature(payload, KIWIFY_SECRET);

    try {
      const response = await this.sendRequest(WEBHOOK_URL, payload, signature);

      if (response.statusCode === 200) {
        this.log('success', 'Unknown event accepted silently', `(${response.statusCode})`);
        this.passed++;
      } else {
        this.log('error', 'Unknown event rejected', `(${response.statusCode})`);
        this.failed++;
      }
    } catch (err) {
      this.log('error', 'Request failed', err.message);
      this.failed++;
    }
    console.log('');
  }

  /**
   * TEST 7: Async Processing (Fire-and-Forget)
   */
  async testAsyncProcessing() {
    this.log('test', 'TEST 7: Async Processing (Fire-and-Forget)');
    const payload = TEST_PAYLOADS.orderApproved;
    const signature = generateSignature(payload, KIWIFY_SECRET);

    const startTime = Date.now();
    try {
      const response = await this.sendRequest(WEBHOOK_URL, payload, signature);
      const responseTime = Date.now() - startTime;

      if (response.statusCode === 200 && responseTime < 1000) {
        this.log('success', `Immediate response (async)`, `${responseTime}ms`);
        this.passed++;
      } else if (responseTime >= 1000) {
        this.log('warn', `Slow response detected`, `${responseTime}ms (should be < 1s)`);
        this.failed++;
      } else {
        this.log('error', 'Response failed', `(${response.statusCode})`);
        this.failed++;
      }
    } catch (err) {
      this.log('error', 'Request failed', err.message);
      this.failed++;
    }
    console.log('');
  }

  /**
   * Run all tests
   */
  async runAll() {
    console.log(`\n${COLORS.bold}🧪 P0.3 Integration Testing - Mock Webhook Client${COLORS.reset}\n`);
    console.log(`Server: ${WEBHOOK_URL}`);
    console.log(`Secret: ${KIWIFY_SECRET.substring(0, 20)}...`);
    console.log('');

    this.log('info', 'Starting integration tests...\n');

    try {
      await this.testHealthCheck();
      await this.testValidSignature();
      await this.testInvalidSignature();
      await this.testMissingSignature();
      await this.testAllEventTypes();
      await this.testUnknownEvent();
      await this.testAsyncProcessing();

      this.printSummary();
    } catch (err) {
      this.log('error', 'Test suite error', err.message);
    }
  }

  /**
   * Print summary
   */
  printSummary() {
    console.log(`\n${COLORS.bold}📊 Test Summary${COLORS.reset}\n`);
    console.log(`${COLORS.green}✅ Passed: ${this.passed}${COLORS.reset}`);
    console.log(`${COLORS.red}❌ Failed: ${this.failed}${COLORS.reset}`);
    console.log(`Total: ${this.passed + this.failed}`);

    const passRate = Math.round((this.passed / (this.passed + this.failed)) * 100);
    console.log(`\nPass Rate: ${passRate}%`);

    if (this.failed === 0) {
      console.log(`\n${COLORS.green}${COLORS.bold}✅ ALL TESTS PASSED${COLORS.reset}\n`);
    } else {
      console.log(`\n${COLORS.red}${COLORS.bold}❌ SOME TESTS FAILED${COLORS.reset}\n`);
    }
  }
}

// ========================================
// RUN TESTS
// ========================================
if (require.main === module) {
  const runner = new IntegrationTestRunner();
  runner.runAll().catch(err => {
    console.error('Test runner error:', err);
    process.exit(1);
  });
}

module.exports = { IntegrationTestRunner, generateSignature };
