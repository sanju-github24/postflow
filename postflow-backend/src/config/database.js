const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

let supabase;

const getDB = () => {
  if (!supabase) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY)
      throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');

    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    console.log('✅ Supabase connected');
  }
  return supabase;
};

module.exports = { getDB };