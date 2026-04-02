const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const clientDir = path.resolve(__dirname, '..');
const nextDir = path.join(clientDir, '.next');
const nestedNextDir = path.join(clientDir, 'client', '.next');

execSync('next build', { stdio: 'inherit', cwd: clientDir });

if (fs.existsSync(nextDir)) {
  fs.mkdirSync(path.dirname(nestedNextDir), { recursive: true });
  fs.cpSync(nextDir, nestedNextDir, { recursive: true });
  console.log('✅ Mirrored .next to client/.next for Vercel output directory compatibility');
}
