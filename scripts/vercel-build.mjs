import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 Starting Vercel build process...');

try {
  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm run install:all', { stdio: 'inherit', cwd: rootDir });
  
  // Build client (Next.js)
  console.log('🏗️ Building client...');
  execSync('npm run build --workspace=client', { stdio: 'inherit', cwd: rootDir });
  
  // Ensure server/api directory exists
  const serverApiDir = path.join(rootDir, 'server', 'api');
  if (!fs.existsSync(serverApiDir)) {
    fs.mkdirSync(serverApiDir, { recursive: true });
    console.log('✅ Created server/api directory');
  }
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}