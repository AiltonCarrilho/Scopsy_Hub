/**
 * Supabase Client
 */

// Fix para Windows - usar node-fetch ao invés de undici
global.fetch = require('node-fetch');

const { createClient } = require('@supabase/supabase-js');
const logger = require('../config/logger');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

logger.debug('🔍 DEBUG SUPABASE:');
logger.debug('URL:', supabaseUrl);
logger.debug('KEY:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'UNDEFINED');
logger.debug('SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? supabaseServiceRoleKey.substring(0, 20) + '...' : 'UNDEFINED');

if (!supabaseUrl || !supabaseKey) {
  logger.error('❌ Supabase credentials missing!');
  throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Admin client com SERVICE_ROLE_KEY para bypass de RLS em operações de escrita server-side
let supabaseAdmin = null;
if (supabaseServiceRoleKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
  logger.info('✅ Supabase admin client initialized (SERVICE_ROLE_KEY)');
} else {
  logger.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not set - admin operations will fall back to anon client');
  supabaseAdmin = supabase; // Fallback para não quebrar em dev sem a key
}

logger.info('✅ Supabase client initialized');

module.exports = { supabase, supabaseAdmin };