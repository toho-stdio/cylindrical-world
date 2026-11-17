// Run an owned command with a real wall-clock deadline, even for synchronous
// infinite loops that block Node's in-process test timeout callbacks.
// Usage: node scripts/with-deadline.mjs <seconds> -- <command> [...args]
import { spawn } from 'node:child_process';

const [secondsText, separator, command, ...args] = process.argv.slice(2);
const seconds = Number(secondsText);
if (separator !== '--' || !command || !Number.isFinite(seconds) || seconds < 0.05 || seconds > 600) {
  console.error('Usage: node scripts/with-deadline.mjs <seconds:0.05..600> -- <command> [...args]');
  process.exit(2);
}
const grouped = process.platform !== 'win32';
const child = spawn(command === 'node' ? process.execPath : command, args, {stdio:'inherit', detached:grouped});
let stopCode = null, killTimer;
function signalOwned(signal) {
  if (!child.pid) return;
  try {if (grouped) process.kill(-child.pid, signal); else child.kill(signal);}
  catch (error) {if (error.code !== 'ESRCH') console.error('Owned command cleanup:', error.message);}
}
function terminate(code, message) {
  if (stopCode !== null) return;
  stopCode = code;
  console.error(message);
  clearTimeout(deadline);
  signalOwned('SIGTERM');
  // Escalate only this new process group; never search/kill unrelated processes.
  killTimer = setTimeout(() => {signalOwned('SIGKILL'); process.exitCode = code;}, 750);
}
const deadline = setTimeout(() => terminate(124, `Command exceeded ${seconds}s wall-clock deadline`), seconds * 1000);
process.once('SIGINT', () => terminate(130, 'Command cancelled (SIGINT)'));
process.once('SIGTERM', () => terminate(143, 'Command cancelled (SIGTERM)'));
child.once('error', error => {
  clearTimeout(deadline); clearTimeout(killTimer);
  console.error('Unable to launch command:', error.message); process.exitCode = 127;
});
child.once('close', (code, signal) => {
  clearTimeout(deadline);
  if (stopCode !== null) {process.exitCode = stopCode; return;}
  process.exitCode = code ?? (signal === 'SIGINT' ? 130 : 1);
});
