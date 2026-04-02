const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../../.env');
console.log('Resolving .env at:', envPath);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ Failed to load .env:', result.error.message);
} else {
  console.log('✅ .env loaded successfully');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'FOUND' : 'MISSING');
}
