const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let client = null;

function getSupabase() {
  if (!client) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
    }
    client = createClient(supabaseUrl, supabaseKey);
  }
  return client;
}

module.exports = { getSupabase };
