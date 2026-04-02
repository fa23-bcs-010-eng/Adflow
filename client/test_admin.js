const axios = require('axios');

async function testAdminFlow() {
  const api = axios.create({ baseURL: 'http://localhost:4000/api' });
  
  try {
    console.log('1. Registering new admin account...');
    const regRes = await api.post('/auth/register', {
      full_name: 'Admin Test',
      email: `admin_test_${Date.now()}@test.com`,
      password: 'password123',
      role: 'admin'
    });
    
    const token = regRes.data.token;
    console.log('   ✅ Registered. Token received.');

    // Attach token
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    console.log('2. Fetching Admin Analytics...');
    await api.get('/admin/analytics');
    console.log('   ✅ Analytics OK');

    console.log('3. Fetching Admin Payment Queue...');
    await api.get('/admin/payment-queue');
    console.log('   ✅ Payment Queue OK');

    console.log('4. Fetching Admin Users List...');
    await api.get('/admin/users');
    console.log('   ✅ Users List OK');

    console.log('\nAll requests succeeded. No 500 error found.');
  } catch (err) {
    if (err.response) {
      console.error(`❌ HTTP Error ${err.response.status}:`, err.response.data);
    } else {
      console.error('❌ Network/Script Error:', err.message);
    }
  }
}

testAdminFlow();
