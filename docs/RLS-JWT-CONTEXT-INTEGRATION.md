# RLS with JWT Context - Backend Integration Guide

**Date:** 2026-02-28
**Status:** READY FOR IMPLEMENTATION
**Effort:** MINIMAL - No JavaScript code changes required

---

## 📋 How It Works

### The Flow

```
1. User makes API request with JWT token
2. Backend extracts userId from JWT (existing code)
3. Backend calls set_auth_context(userId) ONCE at start
4. All subsequent queries automatically filtered by RLS
5. PostgreSQL denies access to other users' data
6. Response returned to frontend
```

### Simple Example

```javascript
// BEFORE (no RLS)
const { data } = await supabase
  .from('user_progress')
  .select('*')
  .eq('user_id', userId);  // ← Manual filter, no RLS protection

// AFTER (with RLS via context)
// Step 1: Set context (once per request)
await supabase.rpc('set_auth_context', { user_id: userId });

// Step 2: Query (RLS automatically filters)
const { data } = await supabase
  .from('user_progress')
  .select('*');  // ← RLS filters automatically, even if bug removes .eq()!
```

---

## 🚀 Implementation (3 Changes)

### Step 1: Execute SQL Script

**File:** `sql-scripts/12-rls-jwt-context-implementation.sql`

Run in Supabase Console:
1. Go to https://app.supabase.com → Your Project → SQL Editor
2. Copy entire content of `12-rls-jwt-context-implementation.sql`
3. Paste into editor
4. Click "Run"
5. Verify: You should see "✓ ENABLED" for all 9 tables

---

### Step 2: Create Helper Function in Backend

Add to `src/services/supabase.js`:

```javascript
/**
 * Set authentication context for RLS policies
 * Must be called BEFORE any queries in a request
 *
 * @param {number} userId - User ID from JWT token
 * @returns {Promise<void>}
 */
async function setAuthContext(userId) {
  try {
    await supabase.rpc('set_auth_context', { user_id: userId });
  } catch (error) {
    logger.warn('Could not set auth context (RLS may not be enabled)', {
      error: error.message,
      userId
    });
    // Don't throw - system still works without RLS (existing code)
  }
}

module.exports = { supabase, setAuthContext };
```

---

### Step 3: Call setAuthContext in Each Route Handler

**Pattern:** Add ONE line at start of each route handler

```javascript
// BEFORE
router.get('/me', authenticateRequest, async (req, res) => {
    try {
        const userId = req.user.userId;
        // ... rest of code
    }
});

// AFTER
router.get('/me', authenticateRequest, async (req, res) => {
    try {
        const userId = req.user.userId;

        // ✅ ADD THIS LINE (NEW)
        await setAuthContext(userId);

        // ... rest of code (no other changes needed)
    }
});
```

**Files to update:**
- `src/routes/account.js` (4 handlers)
- `src/routes/chat.js` (6 handlers)
- `src/routes/dashboard.js` (3 handlers)
- `src/routes/diagnostic.js` (2 handlers)
- `src/routes/journey.js` (2 handlers)
- `src/routes/case.js` (2 handlers)
- `src/routes/gamification.js` (2 handlers)
- `src/routes/skills.js` (1 handler)
- `src/socket/chatHandler.js` (1 handler)

**Total: 23 handlers → Add 1 line to each**

---

## ✅ Verification

### Test 1: RLS is Active

```sql
-- Run in Supabase Console
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('user_progress', 'user_badges')
  AND schemaname = 'public';

-- Expected: rowsecurity = true for both
```

### Test 2: Functions Exist

```sql
-- Run in Supabase Console
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('set_auth_context', 'get_current_user_id');

-- Expected: Both functions listed
```

### Test 3: Backend Integration

```bash
# 1. Start backend
npm run dev

# 2. Login as User A
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user-a@example.com","password":"password"}'

# 3. Get user A's progress (should work)
curl -X GET http://localhost:3000/api/account/me \
  -H "Authorization: Bearer USER_A_TOKEN"
# Expected: 200 OK, user A's data only

# 4. Try to query user B's data (should fail if RLS works)
# This requires direct DB access - see "Manual Testing" below
```

### Test 4: Manual Database Testing (for QA)

```sql
-- Simulate User A accessing their data (should work)
SELECT set_config('request.user_id', '123'::text, false);
SELECT * FROM user_progress WHERE user_id = 123;
-- Expected: Returns data for user 123

-- Simulate User A accessing User B's data (should fail)
SELECT set_config('request.user_id', '123'::text, false);
SELECT * FROM user_progress WHERE user_id = 456;
-- Expected: Returns empty (RLS denies)
```

---

## ⚠️ Important Notes

### 1. No Code Changes to Frontend
- ✅ Frontend works as-is
- ✅ No JWT changes needed
- ✅ No authentication changes

### 2. Backward Compatibility
- ✅ Old code WITHOUT `setAuthContext()` still works
- ✅ service_role_key bypasses RLS
- ✅ Gradual rollout possible

### 3. Performance
- ✅ Minimal overhead (one function call per request)
- ✅ No additional database queries
- ✅ Indexes already created by SQL script

### 4. Debugging

If a handler isn't filtering correctly:

```javascript
// Add logging to diagnose
logger.info('Auth context set', { userId });
const { data } = await supabase.from('user_progress').select('*');
logger.info('Query returned rows', { count: data?.length || 0 });
```

---

## 🔄 Rollback (If Needed)

If issues occur, you can disable RLS without code changes:

```sql
-- In Supabase Console
ALTER TABLE user_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges DISABLE ROW LEVEL SECURITY;
-- ... etc for all 9 tables

-- System continues working, just without RLS protection
```

---

## 🎯 Success Criteria

✅ All 9 tables have RLS enabled
✅ Functions `set_auth_context` and `get_current_user_id` exist
✅ All handlers call `setAuthContext(userId)` at start
✅ Manual DB tests show RLS filtering works
✅ Frontend still works (login, queries, etc)
✅ No errors in logs

---

## Timeline

- **SQL Script Execution:** 5 minutes
- **Backend Updates:** 30 minutes (23 handlers × ~1 min each)
- **Testing:** 15 minutes
- **Total:** ~50 minutes

**No downtime - changes are additive**
