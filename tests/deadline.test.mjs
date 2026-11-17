import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/with-deadline.mjs', import.meta.url));
const run = (seconds, source) => spawnSync(process.execPath, [script, String(seconds), '--', process.execPath, '-e', source], {encoding:'utf8', timeout:5000});

test('outer watchdog preserves normal command exit codes', {timeout:6000}, () => {
  const result = run(2, 'process.exit(7)');
  assert.equal(result.error, undefined); assert.equal(result.status, 7);
});

test('outer watchdog bounds a synchronous loop and reports deadline, not success', {timeout:6000}, () => {
  const start = performance.now();
  const result = run(0.15, 'while(true) {}');
  assert.equal(result.error, undefined); assert.equal(result.status, 124);
  assert.match(result.stderr, /wall-clock deadline/);
  assert.ok(performance.now() - start < 3500);
});
