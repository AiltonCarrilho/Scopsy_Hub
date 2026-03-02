# CRITICO #2 - Custom Auth RLS Specification

**Author:** Aria (Architect Agent)
**Date:** 2026-02-28
**Status:** DESIGN COMPLETE - Ready for @data-engineer implementation
**Supersedes:** `sql-scripts/11-rls-hybrid-implementation.sql` (uses `auth.uid()` -- broken for custom JWT)
**Builds on:** `sql-scripts/12-rls-jwt-context-implementation.sql` (partially correct, needs refinement)

---

## 1. Problem Statement

Scopsy uses a **custom JWT authentication system** (jsonwebtoken library), NOT Supabase Auth. All existing RLS scripts reference `auth.uid()`, which is a Supabase Auth function that returns `NULL` for custom JWT users. This means enabling RLS with those policies would **lock out all users from their own data**.

### Root Cause

| Component | Expected by RLS Scripts | Actual in Scopsy |
|-----------|------------------------|------------------|
| Auth provider | Supabase Auth (`auth.uid()`) | Custom JWT (`jsonwebtoken`) |
| User ID source | Supabase auth.users table | `users` table with BIGINT `id` |
| Token validation | Supabase GoTrue server | Express middleware (`auth.js`) |
| Client key used | `anon_key` with auth headers | `service_role_key` (bypasses RLS!) |

---

## 2. Architecture Analysis

### 2.1 Current Auth Flow

```
Browser                Express Backend               Supabase
  |                         |                           |
  |-- POST /api/auth/login->|                           |
  |                         |-- bcrypt.compare()        |
  |                         |-- jwt.sign({userId,plan}) |
  |<-- {token, user} -------|                           |
  |                         |                           |
  |-- GET /api/dashboard -->|                           |
  |   Authorization: Bearer |                           |
  |                         |-- jwt.verify(token)       |
  |                         |-- req.user = {userId}     |
  |                         |-- supabase.from('x')      |
  |                         |   .eq('user_id', userId)->|
  |                         |                           |-- query with
  |                         |                           |   SERVICE_ROLE_KEY
  |                         |<-- data ------------------|   (bypasses RLS)
  |<-- response ------------|                           |
```

### 2.2 Key Findings from Code Analysis

**File: `D:\projetos.vscode\Scopsy_Hub\src\middleware\auth.js`**
- JWT payload: `{ userId, plan, email }` (signed with `JWT_SECRET`)
- `userId` is a BIGINT (Supabase auto-generated)
- Token lifetime: 24h (access), 7d (refresh)

**File: `D:\projetos.vscode\Scopsy_Hub\src\services\supabase.js`**
- Uses `SUPABASE_ANON_KEY` -- but this client is ONLY used by `database.js` (saveToBoostspace, getFromBoostspace)
- The anon-key client is only used for auth routes (signup/login via `database.js`)

**Files: `D:\projetos.vscode\Scopsy_Hub\src\routes\dashboard.js`, `chat.js`, `case.js`, `diagnostic.js`, `journey.js`, `skills.js`, `account.js`, `webhooks.js`, `D:\projetos.vscode\Scopsy_Hub\src\socket\chatHandler.js`**
- ALL create their OWN Supabase client with `SUPABASE_SERVICE_ROLE_KEY`
- Service role key **bypasses RLS entirely**
- Each route file independently creates `const supabase = createClient(URL, SERVICE_ROLE_KEY)`

**Frontend access:** Neither the legacy frontend (`frontend/`) nor the Next.js frontend (`projeto.scopsy3/`) access Supabase directly. All data flows through the Express backend.

### 2.3 Supabase Client Inventory

| File | Key Used | RLS Impact |
|------|----------|------------|
| `services/supabase.js` | `SUPABASE_ANON_KEY` | Subject to RLS |
| `services/database.js` | Uses `services/supabase.js` | Subject to RLS |
| `routes/dashboard.js` | `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS |
| `routes/chat.js` | `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS |
| `routes/case.js` | `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS |
| `routes/diagnostic.js` | `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS |
| `routes/journey.js` | `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS |
| `routes/skills.js` | `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS |
| `routes/account.js` | `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS |
| `routes/webhooks.js` | `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS |
| `socket/chatHandler.js` | `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS |

---

## 3. Architectural Decision

### 3.1 Options Evaluated

#### Option A: Via Database Session Variable (`current_setting`)

**Mechanism:** Backend calls `SET LOCAL "request.user_id" = '{userId}'` before every query, RLS policies read `current_setting('request.user_id')`.

| Aspect | Assessment |
|--------|------------|
| Backend changes | HIGH -- must set context on every request |
| Database changes | LOW -- simple function + policies |
| Security | MEDIUM -- context must be set correctly per request |
| Performance | LOW overhead (SET LOCAL is fast) |
| Supabase compat | POOR -- Supabase JS client does not expose raw SQL `SET` |

**Problem:** The Supabase JavaScript client does NOT support `SET LOCAL` statements. You would need to use the `supabase.rpc()` function to call a PostgreSQL function that does `set_config()`, but this runs in a SEPARATE transaction from the subsequent query. The session variable would NOT persist across the RPC call and the data query because Supabase uses connection pooling (PgBouncer) in **transaction mode**, which resets session variables between transactions.

#### Option B: Via Custom JWT Claim in Supabase

**Mechanism:** Sign a Supabase-compatible JWT with the user's ID in the `sub` claim, pass it to `createClient` as auth header so `auth.uid()` works.

| Aspect | Assessment |
|--------|------------|
| Backend changes | MEDIUM -- create per-request Supabase clients with custom JWT |
| Database changes | NONE -- existing `auth.uid()` policies work |
| Security | HIGH -- JWT is cryptographically verified by Supabase |
| Performance | MEDIUM -- creating client per request has overhead |
| Supabase compat | EXCELLENT -- uses native Supabase auth mechanism |

**Problem:** Requires the JWT to be signed with the `SUPABASE_JWT_SECRET` (the Supabase project's JWT secret, not the app's JWT_SECRET). Supabase verifies JWTs using its own secret. This would work but requires managing two JWT secrets.

#### Option C: Dual-Client Strategy (SERVICE_ROLE + Application-level filtering)

**Mechanism:** Keep using `SERVICE_ROLE_KEY` but enforce access control at the application level via the Express middleware. RLS serves as defense-in-depth, not primary security.

| Aspect | Assessment |
|--------|------------|
| Backend changes | NONE for existing code |
| Database changes | Enable RLS with service_role bypass policies |
| Security | HIGH -- defense-in-depth with 2 layers |
| Performance | ZERO overhead |
| Supabase compat | EXCELLENT |

**Reality check:** Service role key already bypasses RLS. Application-level `.eq('user_id', userId)` already isolates data. RLS would only protect against a developer forgetting the `.eq()` filter.

### 3.2 DECISION: Option C -- Dual-Client with Defense-in-Depth

[AUTO-DECISION] Which RLS approach for custom JWT auth? -> Option C: Dual-Client Strategy (reason: Scopsy's architecture has backend-only Supabase access with service_role_key in 9 out of 10 client instances. The frontend never touches Supabase. Switching to Option A or B would require rewriting every route file's Supabase client instantiation, risking production breakage. Option C provides security improvement with ZERO risk to existing functionality.)

**Rationale:**

1. **Zero production risk.** No changes to existing query patterns. Every route already does `.eq('user_id', userId)` correctly. RLS becomes a safety net, not the primary gate.

2. **The frontend never accesses Supabase directly.** The attack surface is the Express API, which already validates JWT and extracts `userId` before any database call. There is no scenario where an unauthenticated user can reach Supabase.

3. **Service role key lives server-side only.** It never leaves the backend. The anon key is only used for the auth flow (signup/login via `database.js`).

4. **Defense-in-depth is the correct pattern.** Application-level access control (primary) + RLS (secondary) + service role audit (monitoring).

5. **The only realistic threat** is a developer bug where `.eq('user_id', userId)` is accidentally omitted from a new route. RLS catches this.

### 3.3 Why NOT Option A or B

**Option A** (session variables) is fundamentally broken with Supabase's PgBouncer in transaction mode. Session variables do not persist across separate `.rpc()` and `.from()` calls. The existing `12-rls-jwt-context-implementation.sql` script creates a `set_auth_context` function, but there is no reliable way to call it from the Supabase JS client and have it persist for the subsequent query. This is a well-documented Supabase limitation.

**Option B** (custom JWT for Supabase) would work technically but requires:
- Fetching the `SUPABASE_JWT_SECRET` from the Supabase dashboard
- Creating per-request Supabase clients with custom-signed JWTs
- Managing two JWT secrets (app JWT_SECRET + SUPABASE_JWT_SECRET)
- Rewriting every route's client instantiation
- Significant risk of breaking production

---

## 4. Architecture Design

### 4.1 Target Architecture

```
Browser                Express Backend                    Supabase
  |                         |                                |
  |-- API request --------->|                                |
  |   Authorization: Bearer |                                |
  |                         |                                |
  |                    [LAYER 1: App Auth]                    |
  |                    jwt.verify(token)                      |
  |                    req.user.userId                        |
  |                         |                                |
  |                    [LAYER 2: App Filter]                  |
  |                    .eq('user_id', userId)                 |
  |                         |                                |
  |                         |-- query with SERVICE_ROLE ----->|
  |                         |                                |
  |                         |                [LAYER 3: RLS]  |
  |                         |                Policies check   |
  |                         |                user_id match    |
  |                         |                (defense-in-depth|
  |                         |                for anon_key     |
  |                         |                connections)     |
  |                         |                                |
  |                         |<-- filtered data --------------|
  |<-- response ------------|                                |
```

### 4.2 Three Security Layers

| Layer | Protection | Scope | Bypass |
|-------|-----------|-------|--------|
| **Layer 1: JWT Auth** | Verifies user identity | Express middleware | None (always enforced) |
| **Layer 2: Application Filter** | `.eq('user_id', userId)` | Each route handler | Developer error |
| **Layer 3: RLS Policies** | PostgreSQL row-level check | Database engine | `service_role_key` (intentional) |

**Important:** Layer 3 (RLS) is the safety net for the `anon_key` client in `services/supabase.js`. For `service_role_key` clients, Layers 1 and 2 are the protection. This is by design -- `service_role_key` is meant to be an admin key.

### 4.3 RLS Policy Design

Since the primary client uses `service_role_key` (which bypasses RLS), RLS policies should target the `anon` and `authenticated` roles for defense-in-depth.

**Policy template for SIMPLE tables (KISS):**

```sql
-- Pseudocode for each table with user_id column
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

-- Allow service_role to bypass (default behavior, no policy needed)

-- For anon/authenticated role (defense-in-depth):
-- These policies activate ONLY if someone connects with anon_key
CREATE POLICY "{table_name}_deny_anon"
ON {table_name}
FOR ALL
TO anon
USING (false);  -- Block ALL anon access

CREATE POLICY "{table_name}_deny_authenticated"
ON {table_name}
FOR ALL
TO authenticated
USING (false);  -- Block ALL authenticated access without service_role
```

**Rationale:** Since the backend always uses `service_role_key`, the RLS policies should DENY everything for `anon` and `authenticated` roles. This prevents the `anon_key` from being used to read any data if it is ever leaked or misused.

**EXCEPTION: The `users` table** -- The `anon_key` client in `database.js` is used for signup/login flows:
- `getFromBoostspace('users', { email })` -- lookup by email during login
- `saveToBoostspace('users', userData)` -- create user during signup

These operations need specific policies.

### 4.4 Table-by-Table Policy Map

| # | Table | anon Policy | authenticated Policy | Notes |
|---|-------|-------------|---------------------|-------|
| 1 | `users` | SELECT by email (login), INSERT (signup) | DENY ALL | anon_key client used for auth flow |
| 2 | `user_progress` | DENY ALL | DENY ALL | service_role only |
| 3 | `user_stats` | DENY ALL | DENY ALL | service_role only |
| 4 | `user_case_interactions` | DENY ALL | DENY ALL | service_role only |
| 5 | `user_achievements` | DENY ALL | DENY ALL | service_role only |
| 6 | `journey_sessions` | DENY ALL | DENY ALL | service_role only |
| 7 | `sessions` | DENY ALL | DENY ALL | service_role only |
| 8 | `user_activity_log` | DENY ALL | DENY ALL | service_role only |
| 9 | `user_daily_missions` | DENY ALL | DENY ALL | service_role only |

### 4.5 Special Policy: `users` Table

```sql
-- Pseudocode
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow signup (INSERT) via anon_key
CREATE POLICY "users_anon_insert"
ON users
FOR INSERT
TO anon
WITH CHECK (true);  -- Anyone can sign up

-- Allow login lookup (SELECT) via anon_key
-- SECURITY: Only allow SELECT by email, never return password_hash
-- NOTE: password_hash filtering happens at application level
CREATE POLICY "users_anon_select_by_email"
ON users
FOR SELECT
TO anon
USING (true);  -- Need to allow email lookup for login
-- Application layer restricts returned columns

-- Deny UPDATE/DELETE via anon
CREATE POLICY "users_anon_deny_modify"
ON users
FOR UPDATE
TO anon
USING (false);

CREATE POLICY "users_anon_deny_delete"
ON users
FOR DELETE
TO anon
USING (false);

-- Deny all for authenticated role (not used)
CREATE POLICY "users_authenticated_deny"
ON users
FOR ALL
TO authenticated
USING (false);
```

---

## 5. Backend Changes Required

### 5.1 No Immediate Code Changes

The current architecture does NOT require backend code changes for RLS to work, because:

1. All route files use `service_role_key` -> RLS is bypassed automatically
2. The `anon_key` client (in `database.js`) is only used for user signup/login
3. The `users` table RLS policies above permit those operations

### 5.2 Recommended Future Improvements (NOT blocking)

**Priority 1 -- Centralize Supabase client creation:**

Currently, 9 route files independently create `createClient(URL, SERVICE_ROLE_KEY)`. This should be centralized into a single `services/supabase-admin.js` module.

Affected files:
- `D:\projetos.vscode\Scopsy_Hub\src\routes\dashboard.js` (line 12-15)
- `D:\projetos.vscode\Scopsy_Hub\src\routes\chat.js` (line 18-20)
- `D:\projetos.vscode\Scopsy_Hub\src\routes\case.js` (line 10-12)
- `D:\projetos.vscode\Scopsy_Hub\src\routes\diagnostic.js` (line 10-12)
- `D:\projetos.vscode\Scopsy_Hub\src\routes\journey.js` (line 7-9)
- `D:\projetos.vscode\Scopsy_Hub\src\routes\skills.js` (line 7-9)
- `D:\projetos.vscode\Scopsy_Hub\src\routes\account.js` (line 14-16)
- `D:\projetos.vscode\Scopsy_Hub\src\routes\webhooks.js` (line 21-23)
- `D:\projetos.vscode\Scopsy_Hub\src\socket\chatHandler.js` (line 11-13)

**Priority 2 -- Rename legacy functions:**

The `database.js` functions are still named `saveToBoostspace`, `getFromBoostspace`, etc. This is a legacy naming from when Boost.space was the planned DB. Should be renamed to `saveToDatabase`, `getFromDatabase`, etc.

**Priority 3 -- Add query audit logging:**

Add middleware that logs all Supabase queries with the `userId` that triggered them. This complements RLS with observability.

---

## 6. Implementation Plan for @data-engineer

### Phase 1: Enable RLS on All Tables (Estimated: 15 min)

1. Run `ALTER TABLE {name} ENABLE ROW LEVEL SECURITY` on all 9 tables
2. Verify with `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'`

### Phase 2: Create DENY Policies (Estimated: 20 min)

For tables 2-9 (all except `users`):

```sql
CREATE POLICY "{table}_deny_anon" ON {table} FOR ALL TO anon USING (false);
CREATE POLICY "{table}_deny_authenticated" ON {table} FOR ALL TO authenticated USING (false);
```

### Phase 3: Create `users` Table Policies (Estimated: 10 min)

Apply the specific policies from section 4.5 above.

### Phase 4: Verify service_role Bypass (Estimated: 10 min)

Confirm that `service_role` connections still have full access:

```sql
-- Connected as service_role, should return data
SELECT * FROM user_progress LIMIT 1;
SELECT * FROM users LIMIT 1;
```

### Phase 5: Test anon_key Lockout (Estimated: 10 min)

Confirm that `anon` connections are blocked:

```sql
-- Connected as anon, should return 0 rows
SELECT * FROM user_progress;  -- Should return nothing
SELECT * FROM sessions;       -- Should return nothing
```

### Phase 6: Test Users Table Auth Flow (Estimated: 15 min)

Via the application (not SQL console):

```bash
# Test signup (uses anon_key -> INSERT into users)
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"rls-test@test.com","password":"test12345","name":"RLS Test"}'

# Test login (uses anon_key -> SELECT from users)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rls-test@test.com","password":"test12345"}'

# Test authenticated route (uses service_role_key -> bypasses RLS)
curl http://localhost:3000/api/dashboard/stats \
  -H "Authorization: Bearer {token_from_login}"
```

---

## 7. SQL Template for @data-engineer

The following is the COMPLETE SQL to implement. Replace the existing `11-rls-hybrid-implementation.sql` and `12-rls-jwt-context-implementation.sql`.

```sql
-- ============================================================================
-- SCOPSY RLS - DEFENSE-IN-DEPTH STRATEGY
-- ============================================================================
-- Architecture: Custom JWT + service_role_key (bypasses RLS)
-- Strategy: DENY anon/authenticated roles, service_role passes through
-- Purpose: Prevent data leaks via anon_key; service_role handles app queries
-- ============================================================================

-- STEP 1: Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_case_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_missions ENABLE ROW LEVEL SECURITY;

-- STEP 2: DENY policies for data tables (anon + authenticated)
-- service_role bypasses automatically

-- user_progress
DROP POLICY IF EXISTS "user_progress_deny_anon" ON user_progress;
CREATE POLICY "user_progress_deny_anon" ON user_progress FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "user_progress_deny_authenticated" ON user_progress;
CREATE POLICY "user_progress_deny_authenticated" ON user_progress FOR ALL TO authenticated USING (false);

-- user_stats
DROP POLICY IF EXISTS "user_stats_deny_anon" ON user_stats;
CREATE POLICY "user_stats_deny_anon" ON user_stats FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "user_stats_deny_authenticated" ON user_stats;
CREATE POLICY "user_stats_deny_authenticated" ON user_stats FOR ALL TO authenticated USING (false);

-- user_case_interactions
DROP POLICY IF EXISTS "user_case_interactions_deny_anon" ON user_case_interactions;
CREATE POLICY "user_case_interactions_deny_anon" ON user_case_interactions FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "user_case_interactions_deny_authenticated" ON user_case_interactions;
CREATE POLICY "user_case_interactions_deny_authenticated" ON user_case_interactions FOR ALL TO authenticated USING (false);

-- user_achievements
DROP POLICY IF EXISTS "user_achievements_deny_anon" ON user_achievements;
CREATE POLICY "user_achievements_deny_anon" ON user_achievements FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "user_achievements_deny_authenticated" ON user_achievements;
CREATE POLICY "user_achievements_deny_authenticated" ON user_achievements FOR ALL TO authenticated USING (false);

-- journey_sessions
DROP POLICY IF EXISTS "journey_sessions_deny_anon" ON journey_sessions;
CREATE POLICY "journey_sessions_deny_anon" ON journey_sessions FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "journey_sessions_deny_authenticated" ON journey_sessions;
CREATE POLICY "journey_sessions_deny_authenticated" ON journey_sessions FOR ALL TO authenticated USING (false);

-- sessions
DROP POLICY IF EXISTS "sessions_deny_anon" ON sessions;
CREATE POLICY "sessions_deny_anon" ON sessions FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "sessions_deny_authenticated" ON sessions;
CREATE POLICY "sessions_deny_authenticated" ON sessions FOR ALL TO authenticated USING (false);

-- user_activity_log
DROP POLICY IF EXISTS "user_activity_log_deny_anon" ON user_activity_log;
CREATE POLICY "user_activity_log_deny_anon" ON user_activity_log FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "user_activity_log_deny_authenticated" ON user_activity_log;
CREATE POLICY "user_activity_log_deny_authenticated" ON user_activity_log FOR ALL TO authenticated USING (false);

-- user_daily_missions
DROP POLICY IF EXISTS "user_daily_missions_deny_anon" ON user_daily_missions;
CREATE POLICY "user_daily_missions_deny_anon" ON user_daily_missions FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "user_daily_missions_deny_authenticated" ON user_daily_missions;
CREATE POLICY "user_daily_missions_deny_authenticated" ON user_daily_missions FOR ALL TO authenticated USING (false);

-- STEP 3: USERS table special policies (anon_key used for auth flow)

-- Drop any old policies
DROP POLICY IF EXISTS "users_anon_select" ON users;
DROP POLICY IF EXISTS "users_anon_insert" ON users;
DROP POLICY IF EXISTS "users_anon_deny_update" ON users;
DROP POLICY IF EXISTS "users_anon_deny_delete" ON users;
DROP POLICY IF EXISTS "users_authenticated_deny" ON users;

-- Allow anon to SELECT (needed for login email lookup)
CREATE POLICY "users_anon_select"
ON users FOR SELECT TO anon USING (true);

-- Allow anon to INSERT (needed for signup)
CREATE POLICY "users_anon_insert"
ON users FOR INSERT TO anon WITH CHECK (true);

-- Deny anon UPDATE and DELETE
CREATE POLICY "users_anon_deny_update"
ON users FOR UPDATE TO anon USING (false);

CREATE POLICY "users_anon_deny_delete"
ON users FOR DELETE TO anon USING (false);

-- Deny authenticated role (not used by app)
CREATE POLICY "users_authenticated_deny"
ON users FOR ALL TO authenticated USING (false);

-- STEP 4: Ensure indexes exist for user_id columns
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_case_interactions_user_id ON user_case_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_journey_sessions_user_id ON journey_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_missions_user_id ON user_daily_missions(user_id);

-- STEP 5: Verification
SELECT
  tablename,
  CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'user_progress', 'user_stats',
    'user_case_interactions', 'user_achievements',
    'journey_sessions', 'sessions',
    'user_activity_log', 'user_daily_missions'
  )
ORDER BY tablename;

SELECT
  schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 8. Test Plan for @qa

### 8.1 Pre-deployment Checks

| # | Test | Expected | Priority |
|---|------|----------|----------|
| 1 | Run SQL in Supabase SQL Editor | No errors | CRITICAL |
| 2 | Verify RLS enabled on 9 tables | All show ENABLED | CRITICAL |
| 3 | Verify policy count | 18 policies (2 per data table) + 5 for users = 21 total | CRITICAL |

### 8.2 Functional Tests (via application)

| # | Test | Method | Expected | Priority |
|---|------|--------|----------|----------|
| 4 | Signup works | POST /api/auth/signup | 201 Created | CRITICAL |
| 5 | Login works | POST /api/auth/login | 200 OK with token | CRITICAL |
| 6 | Dashboard stats | GET /api/dashboard/stats (with token) | 200 OK with data | CRITICAL |
| 7 | Journey data | GET /api/journey/* (with token) | 200 OK with data | HIGH |
| 8 | Chat works | WebSocket send_message | Response received | HIGH |
| 9 | Case interactions | POST /api/case/* (with token) | 200 OK | HIGH |
| 10 | Diagnostic | POST /api/diagnostic/* (with token) | 200 OK | HIGH |
| 11 | Skills | GET /api/skills/* (with token) | 200 OK | MEDIUM |
| 12 | Gamification | GET /api/gamification/* (with token) | 200 OK | MEDIUM |

### 8.3 Security Tests

| # | Test | Method | Expected | Priority |
|---|------|--------|----------|----------|
| 13 | Direct anon access to user_progress | Supabase client with anon_key | 0 rows returned | CRITICAL |
| 14 | Direct anon access to sessions | Supabase client with anon_key | 0 rows returned | CRITICAL |
| 15 | Direct anon access to user_stats | Supabase client with anon_key | 0 rows returned | HIGH |
| 16 | Anon can still read users (for login) | Supabase client with anon_key | Rows returned | CRITICAL |
| 17 | Anon can still insert users (for signup) | Supabase client with anon_key | Insert succeeds | CRITICAL |
| 18 | Anon cannot update users | Supabase client with anon_key | Update fails | HIGH |
| 19 | Anon cannot delete users | Supabase client with anon_key | Delete fails | HIGH |

### 8.4 Security Test Script

```javascript
// Run this from Node.js to test anon_key lockout
const { createClient } = require('@supabase/supabase-js');

const anonClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testRLS() {
  console.log('=== RLS Security Tests ===\n');

  // Test 1: anon should NOT see user_progress
  const { data: progress } = await anonClient.from('user_progress').select('*').limit(1);
  console.log('user_progress (anon):', progress?.length === 0 ? 'PASS (blocked)' : 'FAIL');

  // Test 2: anon should NOT see sessions
  const { data: sessions } = await anonClient.from('sessions').select('*').limit(1);
  console.log('sessions (anon):', sessions?.length === 0 ? 'PASS (blocked)' : 'FAIL');

  // Test 3: anon SHOULD see users (for login)
  const { data: users } = await anonClient.from('users').select('email').limit(1);
  console.log('users SELECT (anon):', users?.length > 0 ? 'PASS (allowed)' : 'FAIL');

  // Test 4: anon should NOT update users
  const { error: updateErr } = await anonClient.from('users').update({ name: 'hacked' }).eq('id', 1);
  console.log('users UPDATE (anon):', updateErr ? 'PASS (blocked)' : 'FAIL');

  // Test 5: anon should NOT delete users
  const { error: deleteErr } = await anonClient.from('users').delete().eq('id', 99999);
  console.log('users DELETE (anon):', deleteErr ? 'PASS (blocked)' : 'FAIL');
}

testRLS().catch(console.error);
```

---

## 9. Rollback Plan

### Immediate Rollback (< 1 min)

If anything breaks after enabling RLS:

```sql
-- EMERGENCY ROLLBACK: Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_case_interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE journey_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_missions DISABLE ROW LEVEL SECURITY;
```

This is safe because:
- `DISABLE ROW LEVEL SECURITY` immediately removes all RLS enforcement
- Policies remain defined but inactive (can re-enable later)
- No data is affected
- Takes effect immediately, no restart needed

### Policy Removal (if cleanup needed)

```sql
-- Remove all DENY policies (keeps table policies clean)
-- Run only if you want to fully remove the RLS setup
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (policyname LIKE '%_deny_%' OR policyname LIKE '%_anon_%' OR policyname LIKE '%_authenticated_%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;
```

---

## 10. Security Implications

### What This Protects Against

| Threat | Before RLS | After RLS |
|--------|-----------|-----------|
| Leaked `anon_key` used to read data tables | All data exposed | Blocked (DENY policies) |
| Leaked `anon_key` used to modify data tables | All data modifiable | Blocked (DENY policies) |
| Developer forgetting `.eq('user_id')` filter | Data leaks between users | Still exposed (service_role bypasses) |
| Leaked `service_role_key` | Full database access | Full database access (by design) |

### What This Does NOT Protect Against

1. **Service role key leak** -- if `SUPABASE_SERVICE_ROLE_KEY` is compromised, attacker has full database access. Mitigation: environment variable security, secret rotation.

2. **Application-level bugs** -- if a route handler omits the `.eq('user_id', userId)` filter, service_role queries return all rows. Mitigation: code review, integration tests, future migration to per-user JWT (Option B).

3. **SQL injection** -- Supabase JS client parameterizes queries, but custom raw SQL could be vulnerable. Mitigation: never use raw SQL, always use the client library.

### Future Enhancement Path

Once RLS is stable and verified, consider migrating from Option C to Option B (custom Supabase JWT) to add user-level RLS enforcement even for service_role-equivalent connections. This is a Phase 2 improvement.

---

## 11. Trade-off Analysis Summary

| Factor | Option A (Session Var) | Option B (Custom JWT) | Option C (Chosen) |
|--------|----------------------|----------------------|-------------------|
| Production risk | HIGH (PgBouncer breaks it) | MEDIUM (rewrite clients) | NONE |
| Security depth | Would be good IF it worked | BEST (per-user RLS) | GOOD (defense-in-depth) |
| Implementation effort | MEDIUM | HIGH | LOW |
| Backward compatibility | Breaking | Breaking | Fully compatible |
| Time to implement | 2-3 hours + debugging | 4-6 hours + testing | 30 min |
| Rollback complexity | Complex | Complex | Trivial (DISABLE RLS) |

---

## 12. Files Referenced in This Analysis

| File | Path | Relevance |
|------|------|-----------|
| Auth middleware | `D:\projetos.vscode\Scopsy_Hub\src\middleware\auth.js` | JWT validation logic |
| Supabase client (anon) | `D:\projetos.vscode\Scopsy_Hub\src\services\supabase.js` | Uses ANON_KEY |
| Database service | `D:\projetos.vscode\Scopsy_Hub\src\services\database.js` | Uses anon client |
| Dashboard route | `D:\projetos.vscode\Scopsy_Hub\src\routes\dashboard.js` | Uses SERVICE_ROLE_KEY |
| Chat route | `D:\projetos.vscode\Scopsy_Hub\src\routes\chat.js` | Uses SERVICE_ROLE_KEY |
| Case route | `D:\projetos.vscode\Scopsy_Hub\src\routes\case.js` | Uses SERVICE_ROLE_KEY |
| Diagnostic route | `D:\projetos.vscode\Scopsy_Hub\src\routes\diagnostic.js` | Uses SERVICE_ROLE_KEY |
| Journey route | `D:\projetos.vscode\Scopsy_Hub\src\routes\journey.js` | Uses SERVICE_ROLE_KEY |
| Skills route | `D:\projetos.vscode\Scopsy_Hub\src\routes\skills.js` | Uses SERVICE_ROLE_KEY |
| Account route | `D:\projetos.vscode\Scopsy_Hub\src\routes\account.js` | Uses SERVICE_ROLE_KEY |
| Webhooks route | `D:\projetos.vscode\Scopsy_Hub\src\routes\webhooks.js` | Uses SERVICE_ROLE_KEY |
| Chat socket handler | `D:\projetos.vscode\Scopsy_Hub\src\socket\chatHandler.js` | Uses SERVICE_ROLE_KEY |
| Auth route | `D:\projetos.vscode\Scopsy_Hub\src\routes\auth.js` | Signup/login flow |
| Old RLS (auth.uid) | `D:\projetos.vscode\Scopsy_Hub\sql-scripts\11-rls-hybrid-implementation.sql` | SUPERSEDED |
| Old RLS (context) | `D:\projetos.vscode\Scopsy_Hub\sql-scripts\12-rls-jwt-context-implementation.sql` | SUPERSEDED |

---

-- Aria, arquitetando o futuro
