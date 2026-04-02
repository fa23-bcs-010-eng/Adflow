const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const supabase = require('./src/config/supabase');

async function testQueries() {
  console.log('Testing Supabase queries...');
  try {
    const checks = [
      { name: 'ads (total)', promise: supabase.from('ads').select('*', { count: 'exact', head: true }) },
      { name: 'ads (published)', promise: supabase.from('ads').select('*', { count: 'exact', head: true }).eq('status', 'published') },
      { name: 'payments', promise: supabase.from('payments').select('amount').eq('status', 'verified') },
      {
        name: 'categories join',
        promise: supabase
          .from('ads')
          .select('categories(name)')
          .eq('status', 'published')
          .not('category_id', 'is', null)
      },
      { name: 'system_health_logs', promise: supabase.from('system_health_logs').select('*').order('created_at', { ascending: false }).limit(10) },
      { name: 'users', promise: supabase.from('users').select('id') }
    ];

    for (const check of checks) {
      const { error } = await check.promise;
      if (error) {
        console.error(`❌ Error in query '${check.name}':`, error);
      } else {
        console.log(`✅ Query '${check.name}' succeeded.`);
      }
    }
    console.log('Diagnostics complete.');
  } catch (err) {
    console.error('Fatal error:', err);
  }
}

testQueries();
