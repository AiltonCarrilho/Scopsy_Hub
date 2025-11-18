/**
 * Supabase Client
 */

// Fix para Windows - usar node-fetch ao invés de undici
global.fetch = require('node-fetch');

const { createClient } = require('@supabase/supabase-js');
const logger = require('../config/logger');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('🔍 DEBUG SUPABASE:');
console.log('URL:', supabaseUrl);
console.log('KEY:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'UNDEFINED');

if (!supabaseUrl || !supabaseKey) {
  logger.error('❌ Supabase credentials missing!');
  throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios');
}

const supabase = createClient(supabaseUrl, supabaseKey);

logger.info('✅ Supabase client initialized');

module.exports = { supabase };