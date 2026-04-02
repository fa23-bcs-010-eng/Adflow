const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const supabase = require('./src/config/supabase');

async function testQuerySyntax() {
  console.log('Testing nested join syntax...');
  
  const { data, error } = await supabase
    .from('ads')
    .select('id, user:users!ads_user_id_fkey(seller_profiles(is_verified))')
    .limit(1);

  if (error) {
    console.error('❌ PostgREST Error:', JSON.stringify(error, null, 2));
  } else {
    console.log('✅ Query succeeded:', JSON.stringify(data, null, 2));
  }
}

testQuerySyntax();
