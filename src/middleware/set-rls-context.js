/**
 * RLS Context Middleware
 *
 * Sets the PostgreSQL session variable `request.user_id` via the
 * `set_auth_context()` RPC function before passing control to route handlers.
 * This ensures every subsequent Supabase query in the request is filtered
 * by Row Level Security (RLS) policies.
 *
 * MUST be called AFTER authenticateRequest middleware (which sets req.user.userId).
 * MUST be called BEFORE any route handler that queries Supabase.
 *
 * Architecture note:
 * Supabase JS client uses PostgREST (REST API), not raw PostgreSQL connections.
 * The set_auth_context() RPC uses set_config('request.user_id', ..., true)
 * which scopes to the current transaction — safe for concurrent requests.
 *
 * @requires req.user.userId - Set by authenticateRequest middleware
 *
 * @example
 * // In server.js route mounting:
 * app.use('/api/dashboard', authenticateRequest, setRLSContext, dashboardRoutes);
 */

const { supabase } = require('../services/supabase');
const logger = require('../config/logger');

/**
 * Express middleware that calls set_auth_context() RPC before Supabase queries.
 * Returns 401 if no userId is present, 500 if the RPC call fails.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function setRLSContext(req, res, next) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      logger.error('RLS context: no userId in request', {
        path: req.path,
        method: req.method
      });
      return res.status(401).json({ error: 'Unauthorized - no user context' });
    }

    // Set PostgreSQL session variable for RLS
    // p_user_id is the parameter name expected by the set_auth_context() function
    const { error } = await supabase.rpc('set_auth_context', {
      p_user_id: userId
    });

    if (error) {
      logger.error('RLS context: failed to set auth context', {
        error: error.message,
        userId,
        path: req.path
      });
      return res.status(500).json({ error: 'Failed to set security context' });
    }

    logger.debug('RLS context set', { userId, path: req.path });
    next();
  } catch (err) {
    logger.error('RLS context: unexpected error', {
      error: err.message,
      userId: req.user?.userId
    });
    return res.status(500).json({ error: 'Security context error' });
  }
}

module.exports = { setRLSContext };
