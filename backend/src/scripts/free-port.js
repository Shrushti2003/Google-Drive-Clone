import { execFileSync } from 'node:child_process';
import os from 'node:os';
import { env } from '../config/env.js';

const port = Number(process.env.PORT || env.port || 8080);

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function findWindowsListeners() {
  const output = execFileSync('netstat', ['-ano', '-p', 'tcp'], { encoding: 'utf8' });
  return unique(output
    .split(/\r?\n/)
    .filter((line) => line.includes('LISTENING'))
    .filter((line) => new RegExp(`[:.]${port}\\s`).test(line))
    .map((line) => line.trim().split(/\s+/).at(-1))
    .filter((pid) => pid && pid !== String(process.pid)));
}

function findUnixListeners() {
  try {
    const output = execFileSync('lsof', ['-ti', `tcp:${port}`], { encoding: 'utf8' });
    return unique(output.split(/\s+/).filter((pid) => pid !== String(process.pid)));
  } catch {
    return [];
  }
}

function stopWindowsProcess(pid) {
  try {
    execFileSync('taskkill', ['/PID', pid, '/F', '/T'], { stdio: 'ignore' });
    return;
  } catch {
    execFileSync('powershell.exe', ['-NoProfile', '-Command', `Stop-Process -Id ${Number(pid)} -Force`], { stdio: 'ignore' });
  }
}

const pids = os.platform() === 'win32' ? findWindowsListeners() : findUnixListeners();

for (const pid of pids) {
  try {
    if (os.platform() === 'win32') {
      stopWindowsProcess(pid);
    } else {
      execFileSync('kill', ['-TERM', pid], { stdio: 'ignore' });
    }
    console.log(`Freed port ${port} from process ${pid}`);
  } catch (error) {
    console.warn(`Could not free port ${port} from process ${pid}: ${error.message}`);
  }
}

if (!pids.length) {
  console.log(`Port ${port} is available`);
}
