/**
 * M3 Journey Terapêutica - Comprehensive E2E Tests
 * Tests all critical user flows, buttons, functions, and error handling
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';
let testToken = '';
let userId = '';
let journeyId = '';
let sessionData = null;

const tests = [];

// Helper to make API calls
async function apiCall(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(testToken && { Authorization: `Bearer ${testToken}` })
    }
  };

  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();
  return { status: response.status, data };
}

// Test 1: List journeys
async function test1_ListJourneys() {
  const result = await apiCall('GET', '/journey/list');
  const pass = result.status === 200 && result.data.journeys && result.data.journeys.length > 0;

  if (pass) {
    journeyId = result.data.journeys[0].id;
  }

  return {
    name: 'TEST-1: GET /journey/list - List all journeys',
    pass,
    details: pass
      ? `✅ Loaded ${result.data.journeys.length} journeys`
      : `❌ Status: ${result.status}, No journeys found`
  };
}

// Test 2: Get journey detail (12 sessions)
async function test2_GetJourneyDetail() {
  const result = await apiCall('GET', `/journey/${journeyId}`);
  const pass = result.status === 200 &&
               result.data.journey &&
               result.data.journey.id === journeyId;

  return {
    name: 'TEST-2: GET /journey/{id} - Journey detail loaded',
    pass,
    details: pass
      ? `✅ Journey loaded: "${result.data.journey.title}"`
      : `❌ Status: ${result.status}, Expected journey object`
  };
}

// Test 3: Signup/Login (get token)
async function test3_SignupLogin() {
  // Try signup with unique email
  const email = `test-${Date.now()}@scopsy.test`;
  const signupResult = await apiCall('POST', '/auth/signup', {
    email,
    password: 'TestPassword123!',
    name: 'Test User',
    crp: '12345/SP'
  });

  if (signupResult.status === 201) {
    testToken = signupResult.data.token;
    userId = signupResult.data.user.id;

    return {
      name: 'TEST-3: POST /auth/signup - Create user account',
      pass: true,
      details: `✅ User created: ${email}`
    };
  }

  // If duplicate, try login instead
  const loginResult = await apiCall('POST', '/auth/login', {
    email,
    password: 'TestPassword123!'
  });

  if (loginResult.status === 200) {
    testToken = loginResult.data.token;
    userId = loginResult.data.user.id;

    return {
      name: 'TEST-3: POST /auth/login - Login user',
      pass: true,
      details: `✅ User authenticated`
    };
  }

  return {
    name: 'TEST-3: Auth - Signup or Login',
    pass: false,
    details: `❌ Both signup and login failed. Status: ${signupResult.status}, ${loginResult.status}`
  };
}

// Test 4: Start journey
async function test4_StartJourney() {
  const result = await apiCall('POST', `/journey/start`, {
    journey_id: journeyId
  });

  const pass = result.status === 200 &&
               result.data.progress &&
               result.data.progress.current_session === 1 &&
               result.data.progress.total_rapport === 0;

  return {
    name: 'TEST-4: POST /journey/start - Initialize progress',
    pass,
    details: pass
      ? `✅ Journey started, session 1, rapport: 0`
      : `❌ Status: ${result.status}, Progress: ${JSON.stringify(result.data.progress)}`
  };
}

// Test 5: Get session with options
async function test5_GetSession() {
  const result = await apiCall('GET', `/journey/${journeyId}/session/1`);

  const pass = result.status === 200 &&
               result.data.session &&
               result.data.session.session_title &&
               result.data.options &&
               result.data.options.length === 4;

  return {
    name: 'TEST-5: GET /journey/{id}/session/1 - Load session with options',
    pass,
    details: pass
      ? `✅ Session 1 loaded: "${result.data.session.session_title}", 4 options ready`
      : `❌ Status: ${result.status}, Options: ${result.data.options?.length || 0}`
  };
}

// Test 6: Submit decision (button click simulation)
async function test6_SubmitDecision() {
  const options = ['A', 'B', 'C', 'D'];
  const chosenOption = options[Math.floor(Math.random() * 4)];

  const result = await apiCall('POST', `/journey/${journeyId}/session/1/decide`, {
    option_chosen: chosenOption,
    time_taken_seconds: 30
  });

  const pass = result.status === 200 &&
               result.data.decision &&
               result.data.decision.option_chosen === chosenOption;

  return {
    name: 'TEST-6: POST /session/1/decide - Submit decision (button click)',
    pass,
    details: pass
      ? `✅ Decision submitted: Option ${chosenOption}, Score incremented`
      : `❌ Status: ${result.status}, Decision: ${JSON.stringify(result.data.decision)}`
  };
}

// Test 7: Check progress updated
async function test7_CheckProgress() {
  const result = await apiCall('GET', `/journey/${journeyId}/progress`);

  const pass = result.status === 200 &&
               result.data.current_session === 2 &&
               (result.data.total_rapport > 0 || result.data.total_insight > 0);

  return {
    name: 'TEST-7: GET /progress - Confirm progression to session 2',
    pass,
    details: pass
      ? `✅ Progressed to session 2, scores incremented`
      : `❌ Status: ${result.status}, Session: ${result.data.current_session}`
  };
}

// Test 8: Session skip blocking
async function test8_SessionSkipBlocked() {
  const result = await apiCall('GET', `/journey/${journeyId}/session/5`);

  const pass = result.status === 403 &&
               result.data.error &&
               result.data.error.includes('sessão');

  return {
    name: 'TEST-8: GET /session/5 from session 2 - Skip blocking works',
    pass,
    details: pass
      ? `✅ Correctly blocked: "${result.data.error}"`
      : `❌ Expected 403, got ${result.status}`
  };
}

// Test 9: Session 2 loads correctly
async function test9_GetSession2() {
  const result = await apiCall('GET', `/journey/${journeyId}/session/2`);

  const pass = result.status === 200 &&
               result.data.session &&
               result.data.options &&
               result.data.options.length === 4;

  return {
    name: 'TEST-9: GET /session/2 - Next session loads correctly',
    pass,
    details: pass
      ? `✅ Session 2 loaded: "${result.data.session.session_title}"`
      : `❌ Status: ${result.status}`
  };
}

// Test 10: Unauthenticated request blocked
async function test10_NoTokenBlocked() {
  const savedToken = testToken;
  testToken = ''; // Clear token

  const result = await apiCall('GET', `/journey/${journeyId}/session/1`);

  testToken = savedToken; // Restore token

  const pass = result.status === 401;

  return {
    name: 'TEST-10: GET /session without token - Returns 401',
    pass,
    details: pass
      ? `✅ Correctly rejected: "${result.data.error}"`
      : `❌ Expected 401, got ${result.status}`
  };
}

// Test 11: Invalid option rejected
async function test11_InvalidOptionRejected() {
  // First move to fresh state
  const result = await apiCall('POST', `/journey/${journeyId}/session/2/decide`, {
    option_chosen: 'INVALID_OPTION',
    time_taken_seconds: 20
  });

  const pass = result.status === 400 || result.status === 404;

  return {
    name: 'TEST-11: POST /decide with invalid option - Returns 400/404',
    pass,
    details: pass
      ? `✅ Correctly rejected invalid option`
      : `❌ Expected 400/404, got ${result.status}`
  };
}

// Test 12: Complete journey flow (sessions 3-12)
async function test12_CompleteJourney() {
  let allPassed = true;
  let sessionsCompleted = 2; // Already at session 2

  // Complete remaining sessions
  for (let i = 2; i <= 12; i++) {
    const getResult = await apiCall('GET', `/journey/${journeyId}/session/${i}`);
    if (getResult.status !== 200) {
      allPassed = false;
      break;
    }

    const options = ['A', 'B', 'C', 'D'];
    const chosen = options[Math.floor(Math.random() * 4)];

    const decideResult = await apiCall('POST', `/journey/${journeyId}/session/${i}/decide`, {
      option_chosen: chosen,
      time_taken_seconds: 25 + Math.random() * 30
    });

    if (decideResult.status === 200) {
      sessionsCompleted = i;
    } else {
      allPassed = false;
      break;
    }
  }

  return {
    name: 'TEST-12: Complete full journey (sessions 1-12)',
    pass: allPassed && sessionsCompleted === 12,
    details: allPassed && sessionsCompleted === 12
      ? `✅ Completed all 12 sessions successfully`
      : `⚠️ Completed ${sessionsCompleted} sessions (may stop at 12)`
  };
}

// Test 13: Restart journey
async function test13_RestartJourney() {
  const result = await apiCall('POST', `/journey/${journeyId}/restart`, {});

  const pass = result.status === 200 &&
               result.data.progress &&
               result.data.progress.current_session === 1;

  return {
    name: 'TEST-13: POST /journey/restart - Reset to session 1',
    pass,
    details: pass
      ? `✅ Journey restarted successfully`
      : `❌ Status: ${result.status}`
  };
}

// Run all tests
async function runAllTests() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('M3 JOURNEY TERAPÊUTICA - COMPREHENSIVE E2E TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Run tests in sequence
  const testFunctions = [
    test1_ListJourneys,
    test2_GetJourneyDetail,
    test3_SignupLogin,
    test4_StartJourney,
    test5_GetSession,
    test6_SubmitDecision,
    test7_CheckProgress,
    test8_SessionSkipBlocked,
    test9_GetSession2,
    test10_NoTokenBlocked,
    test11_InvalidOptionRejected,
    test12_CompleteJourney,
    test13_RestartJourney
  ];

  let passCount = 0;
  let failCount = 0;

  for (const testFn of testFunctions) {
    try {
      const result = await testFn();
      tests.push(result);

      const status = result.pass ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} | ${result.name}`);
      console.log(`       ${result.details}\n`);

      if (result.pass) passCount++;
      else failCount++;
    } catch (error) {
      console.log(`❌ ERROR | ${testFn.name}`);
      console.log(`         ${error.message}\n`);
      failCount++;
    }
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Total Tests:  ${passCount + failCount}`);
  console.log(`Passed:       ${passCount} ✅`);
  console.log(`Failed:       ${failCount} ❌`);
  console.log(`Success Rate: ${Math.round((passCount / (passCount + failCount)) * 100)}%`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  process.exit(failCount > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
