#!/usr/bin/env node
/*
  Repo runner for local development (Windows friendly).

  Usage:
    node runner.js

  It starts:
    - backend: php artisan serve (in ./backend)
    - frontend: npm run dev (in ./frontend)

  Stop:
    Press Ctrl+C in this terminal.
*/

const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const ROOT_DIR = __dirname;
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');

function spawnProcess({ cwd, command, args, name, env, shell = false }) {
  let child;

  try {
    child = spawn(command, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: env ?? process.env,
      shell,
    });
  } catch (err) {
    console.error(`[${name}] failed to start: ${err?.message || err}`);
    return null;
  }

  child.stdout.on('data', (chunk) => {
    process.stdout.write(`[${name}] ${chunk.toString()}`);
  });
  child.stderr.on('data', (chunk) => {
    process.stderr.write(`[${name}] ${chunk.toString()}`);
  });

  child.on('exit', (code, signal) => {
    const suffix = signal ? ` signal=${signal}` : '';
    console.log(`[${name}] exited code=${code}${suffix}`);
  });

  child.on('error', (err) => {
    console.error(`[${name}] failed to start: ${err?.message || err}`);
  });

  return child;
}

const BACKEND_PORT = process.env.BACKEND_PORT || '8000';
const FRONTEND_PORT = process.env.FRONTEND_PORT || '5173';
const LAN_IP = process.env.LAN_IP || getLanIp() || 'localhost';

const backendArgs = ['artisan', 'serve', '--port', String(BACKEND_PORT), '--host', '0.0.0.0'];
const frontendArgs = ['run', 'dev', '--', '--host', '0.0.0.0', '--port', String(FRONTEND_PORT)];

function getLanIp() {
  const interfaces = os.networkInterfaces();

  for (const addresses of Object.values(interfaces)) {
    for (const address of addresses || []) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }

  return null;
}

console.log('Starting development servers...');
console.log(`- Backend : php ${backendArgs.join(' ')} (cwd=${BACKEND_DIR})`);
console.log(`- Frontend: npm ${frontendArgs.join(' ')} (cwd=${FRONTEND_DIR})`);
console.log('');
console.log('Open locally:');
console.log(`- Frontend: http://localhost:${FRONTEND_PORT}`);
console.log(`- Backend : http://localhost:${BACKEND_PORT}/api/v1`);
console.log('');
console.log('Open from phone on same Wi-Fi/LAN:');
console.log(`- Frontend: http://${LAN_IP}:${FRONTEND_PORT}`);
console.log('');
console.log('Camera note: phone browsers usually require HTTPS for camera access on LAN HTTP.');
console.log('For QR camera testing without HTTPS, use the PC browser at http://localhost:5173 with a webcam.');
console.log('Tip: Press Ctrl+C to stop.');

const backend = spawnProcess({
  cwd: BACKEND_DIR,
  command: 'php',
  args: backendArgs,
  name: 'backend',
});

const frontendEnv = {
  ...process.env,
  VITE_PORT: String(FRONTEND_PORT),
  VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || '/api/v1',
};

const frontend = spawnProcess({
  cwd: FRONTEND_DIR,
  command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
  args: frontendArgs,
  name: 'frontend',
  env: frontendEnv,
  shell: process.platform === 'win32',
});

if (!backend || !frontend) {
  shutdown();
}

function shutdown() {
  console.log('\r\nStopping servers...');

  const procs = [backend, frontend].filter(Boolean);
  for (const p of procs) {
    try {
      p.kill('SIGINT');
    } catch (_) {
      // ignore
    }
  }

  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

backend?.on('exit', (code) => {
  if (code !== 0) console.log('[runner] backend stopped unexpectedly.');
});
frontend?.on('exit', (code) => {
  if (code !== 0) console.log('[runner] frontend stopped unexpectedly.');
});

