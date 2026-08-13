'use strict';

const { execSync } = require('child_process');

const port = Number.parseInt(process.argv[2], 10);
if (!port) {
  console.error('Usage: node scripts/free-port.js <port>');
  process.exit(1);
}

function localPort(address) {
  const match = String(address).match(/:(\d+)$/);
  return match ? Number(match[1]) : NaN;
}

function killListening(portToFree) {
  if (process.platform === 'win32') {
    const stdout = execSync('netstat -ano', { encoding: 'utf8' });
    const pids = new Set();
    for (const line of stdout.split(/\r?\n/)) {
      const cols = line.trim().split(/\s+/);
      if (cols.length < 5 || cols[3] !== 'LISTENING') continue;
      if (localPort(cols[1]) !== portToFree) continue;
      if (cols[4] && cols[4] !== '0') pids.add(cols[4]);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        console.log(`Process on port ${portToFree} killed (PID ${pid})`);
      } catch {
        // already gone
      }
    }
    if (pids.size === 0) {
      console.log(`No process listening on port ${portToFree}`);
    }
    return;
  }

  try {
    const pids = execSync(`lsof -ti tcp:${portToFree} -sTCP:LISTEN`, {
      encoding: 'utf8',
    })
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    for (const pid of pids) {
      try {
        execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
        console.log(`Process on port ${portToFree} killed (PID ${pid})`);
      } catch {
        // already gone
      }
    }
    if (pids.length === 0) {
      console.log(`No process listening on port ${portToFree}`);
    }
  } catch {
    console.log(`No process listening on port ${portToFree}`);
  }
}

killListening(port);
