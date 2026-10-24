import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('..', import.meta.url));
const options = { cwd, stdio: 'inherit', detached: process.platform !== 'win32' };
const children = [
  spawn('cargo', ['run', '-p', 'rust-lab-server', '--locked'], options),
  spawn(
    process.execPath,
    ['node_modules/@angular/cli/bin/ng.js', 'serve', '--host', '127.0.0.1'],
    options,
  ),
];

let closing = false;
function stop(code = 0) {
  if (closing) return;
  closing = true;
  for (const child of children) {
    if (!child.pid || child.exitCode !== null || child.signalCode !== null) continue;
    if (process.platform === 'win32') {
      // Cargo owns the server process, so stop the whole child tree.
      const killer = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
        windowsHide: true,
      });
      killer.on('error', () => child.kill());
    } else {
      try {
        process.kill(-child.pid, 'SIGTERM');
      } catch (error) {
        if (error.code !== 'ESRCH') console.error(error.message);
      }
    }
  }
  process.exitCode = code;
}
children.forEach((child) => {
  child.on('error', (error) => {
    console.error(error.message);
    stop(1);
  });
  child.on('exit', (code, signal) => stop(code ?? (signal ? 1 : 0)));
});
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
