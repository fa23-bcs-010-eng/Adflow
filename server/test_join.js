const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const supabase = require('./src/config/supabase');

async function testJoin() {
  const { data, error } = await supabase
    .from('ads')
    .select('id, user:users!ads_user_id_fkey(full_name, seller:seller_profiles(is_verified))')
    .limit(1);

  if (error) {
    console.error('❌ Query failed:', error);
  } else {
    console.log('✅ Query succeeded:', JSON.stringify(data, null, 2));
  }
}
testJoin();
