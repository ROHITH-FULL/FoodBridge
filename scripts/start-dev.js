const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('====================================================');
console.log('   Starting FoodBridge Platform (Server + Client)   ');
console.log('====================================================');

// Start backend Express server
const server = spawn('node', ['server/src/server.js'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
});

// Start frontend Vite dev server
const client = spawn(npmCmd, ['--prefix', 'client', 'run', 'dev'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
});

function shutdown() {
  console.log('\nStopping FoodBridge processes...');
  try { server.kill(); } catch (e) {}
  try { client.kill(); } catch (e) {}
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
