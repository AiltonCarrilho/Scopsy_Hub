/**
 * Supabase Clients
 *
 * Exports TWO Supabase clients with different access levels:
 *
 * - `supabase`      (ANON KEY)   — Use for all user-facing queries.
 *                                  Subject to Row Level Security (RLS).
 *                                  Requires set_auth_context() to be called first.
 *
 * - `supabaseAdmin` (SERVICE ROLE KEY) — Use ONLY for admin/cross-user operations.
 *                                         Bypasses RLS entirely. Handle with care.
 *
 * Usage guide:
 *   - Route handlers for authenticated users  → import { supabase }
 *   - Webhook handlers (Kiwify, system tasks) → import { supabaseAdmin }
 *   - Rate limit checks (user_rate_limits)    → import { supabaseAdmin } (fast, no RLS overhead)
 *   - Any cross-user query (admin panels)     → import { supabaseAdmin }
 *
 * @see middleware/set-rls-context.js for how user context is set per request
 */

// Fix para Windows - usar node-fetch ao invés de undici
global.fetch = require('node-fetch');

const { createClient } = require('@supabase/supabase-js');
const logger = require('../config/logger');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

logger.debug('DEBUG SUPABASE:');
logger.debug('URL:', supabaseUrl);
logger.debug('ANON KEY:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'UNDEFINED');
logger.debug('SERVICE ROLE KEY:', supabaseServiceRoleKey ? 'SET' : 'UNDEFINED');

if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('Supabase credentials missing!');
  throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY sao obrigatorios');
}

/**
 * RLS-aware Supabase client (anon key).
 * Use for all user-facing database operations.
 * Requires set_auth_context() to have been called in the same request.
 */
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Admin Supabase client (service role key).
 * Bypasses RLS completely. Use ONLY for:
 * - Webhook handlers (e.g., Kiwify payment events)
 * - System-level operations (rate limiting, health checks)
 * - Cross-user administrative queries
 *
 * NEVER expose supabaseAdmin data directly to end users.
 * NEVER use in route handlers that serve authenticated user requests.
 */
const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  : null;

if (!supabaseAdmin) {
  logger.warn('supabaseAdmin not initialized: SUPABASE_SERVICE_ROLE_KEY is not set. Admin operations will fail.');
} else {
  logger.info('Supabase clients initialized (anon + admin)');
}

module.exports = { supabase, supabaseAdmin };
