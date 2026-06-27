#!/usr/bin/env node

const { execSync } = require('child_process');

function killPort(port) {
  try {
    if (process.platform === 'win32') {
      const out = execSync(`netstat -ano | findstr :${port}`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      const pids = new Set();
      for (const line of out.split('\n')) {
        const match = line.trim().match(/\s(\d+)\s*$/);
        if (match) pids.add(match[1]);
      }
      for (const pid of pids) {
        if (pid === '0') continue;
        try {
          const cmdline = execSync(`wmic process where ProcessId=${pid} get CommandLine /value`, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore'],
          });
          // Only kill Metro / React Native dev server processes.
          if (!/metro|react-native|@react-native-community\/cli/i.test(cmdline)) continue;
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
          console.log(`Stopped Metro process on port ${port} (PID ${pid})`);
        } catch {
          // Process may have already exited.
        }
      }
      return;
    }

    execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore' });
  } catch {
    // Port is free — nothing to do.
  }
}

killPort(8081);
