import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createStaticServer } from '../scripts/serve.mjs';

test('local server serves modules, rejects writes and escaping symlinks', {timeout: 10000}, async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'stillwater-server-'));
  const outside = await mkdtemp(path.join(tmpdir(), 'stillwater-outside-'));
  let server;
  try {
    await writeFile(path.join(root, 'index.html'), '<title>STILLWATER</title>');
    await writeFile(path.join(root, 'main.js'), 'export const ready = true;');
    await writeFile(path.join(outside, 'private.txt'), 'not public');
    await symlink(path.join(outside, 'private.txt'), path.join(root, 'escape.txt'));
    server = createStaticServer(root);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = 'http://127.0.0.1:' + server.address().port;
    const page = await fetch(base, {signal: AbortSignal.timeout(3000)});
    assert.equal(page.status, 200);
    assert.match(await page.text(), /STILLWATER/);
    const module = await fetch(base + '/main.js');
    assert.match(module.headers.get('content-type'), /javascript/);
    await module.arrayBuffer();
    const head = await fetch(base, {method: 'HEAD'});
    assert.equal(await head.text(), '');
    const missing = await fetch(base + '/missing'); assert.equal(missing.status, 404); await missing.text();
    const post = await fetch(base, {method:'POST'}); assert.equal(post.status, 405); await post.text();
    const escape = await fetch(base + '/escape.txt'); assert.equal(escape.status, 403); await escape.text();
  } finally {
    if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
    await Promise.all([rm(root, {recursive:true,force:true}), rm(outside, {recursive:true,force:true})]);
  }
});
