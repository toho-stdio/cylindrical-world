// Bounded CDP verification against an explicitly provided, locally owned browser.
// Usage: node scripts/browser-smoke.mjs --cdp ws://127.0.0.1:PORT/devtools/browser/ID --origin http://localhost:4179
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';

const args = Object.fromEntries(Array.from({length: Math.floor((process.argv.length - 2) / 2)}, (_, i) => [process.argv[2 + i * 2], process.argv[3 + i * 2]]));
const cdp = new URL(args['--cdp'] || 'http://invalid');
const origin = new URL(args['--origin'] || 'http://localhost:4179');
const local = url => ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
assert.ok(local(cdp) && ['ws:', 'wss:'].includes(cdp.protocol), 'Pass the owned browser loopback WebSocket URL');
assert.ok(local(origin) && origin.protocol === 'http:', 'Only local test origins are supported');
const socket = new WebSocket(cdp);
let nextId = 0, session;
const pending = new Map();
const report = { origin: origin.origin, input: 'Browser-trusted CDP held key events, not physical hardware', results: [], errors: [] };
const deadline = setTimeout(() => { console.error('Browser smoke exceeded 45 seconds'); process.exit(1); }, 45000);
const check = (name, data) => { report.results.push({name, status:'PASS', data}); console.log('PASS:', name, JSON.stringify(data ?? '')); };

socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const {resolve, reject, timer} = pending.get(message.id); clearTimeout(timer); pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error))); else resolve(message.result);
  }
  if (message.method === 'Runtime.exceptionThrown') report.errors.push(message.params.exceptionDetails.text);
});
function send(method, params = {}, target = session) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => {pending.delete(id); reject(new Error('CDP timeout: ' + method));}, 7000);
    pending.set(id, {resolve, reject, timer});
    socket.send(JSON.stringify({id, method, params, ...(target ? {sessionId:target} : {})}));
  });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {expression, returnByValue:true, awaitPromise:true});
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
const waitReady = () => evaluate(`new Promise((resolve,reject)=>{const end=performance.now()+6000;const tick=()=>{if(window.stillwater?.getState().ready)resolve(true);else if(performance.now()>end)reject(Error('App readiness timeout'));else setTimeout(tick,40)};tick()})`);
const snapshot = () => evaluate('window.stillwater.getState()');
const clearFocus = () => evaluate('document.activeElement?.blur(); window.focus(); true');
async function click(selector) {
  const point = await evaluate(`(() => {const box=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:box.x+box.width/2,y:box.y+box.height/2}})()`);
  await send('Input.dispatchMouseEvent', {type:'mousePressed',button:'left',clickCount:1,...point});
  await send('Input.dispatchMouseEvent', {type:'mouseReleased',button:'left',clickCount:1,...point});
  await delay(70);
}
async function hold(key, milliseconds = 400) {
  const params = {key, code:'Key' + key.toUpperCase(), windowsVirtualKeyCode:key.toUpperCase().charCodeAt(0)};
  await send('Input.dispatchKeyEvent', {type:'keyDown', ...params});
  try {await delay(milliseconds);} finally {await send('Input.dispatchKeyEvent', {type:'keyUp', ...params});}
  await delay(70);
}
const radius = state => Math.hypot(state.position[1], state.position[2]);

// Track actual calls at the browser API boundary, installed before reload.
const instrumentation = `(() => {
  window.__smoke={contexts:0,audioCloses:0,deviceDestroys:0,submits:0,keys:[]};window.__smokeAudioContexts=[];
  addEventListener('keydown',e=>window.__smoke.keys.push({key:e.key,trusted:e.isTrusted}));
  const Context=window.AudioContext||window.webkitAudioContext;
  if(Context)window.AudioContext=new Proxy(Context,{construct(target,args){window.__smoke.contexts++;const context=Reflect.construct(target,args);window.__smokeAudioContexts.push(context);const close=context.close.bind(context);context.close=()=>{window.__smoke.audioCloses++;return close()};return context}});
  if(navigator.gpu){const request=navigator.gpu.requestAdapter.bind(navigator.gpu);navigator.gpu.requestAdapter=async(...args)=>{const adapter=await request(...args);if(adapter){const requestDevice=adapter.requestDevice.bind(adapter);adapter.requestDevice=async(...args)=>{const device=await requestDevice(...args),destroy=device.destroy.bind(device),submit=device.queue.submit.bind(device.queue);device.destroy=()=>{window.__smoke.deviceDestroys++;return destroy()};device.queue.submit=(...args)=>{window.__smoke.submits++;return submit(...args)};return device}}return adapter}}
})();`;

let instrumentationId, unsupportedId;
try {
  await new Promise((resolve, reject) => {socket.addEventListener('open', resolve, {once:true}); socket.addEventListener('error', reject, {once:true});});
  const targets = await send('Target.getTargets', {}, null);
  const page = targets.targetInfos.find(target => target.type === 'page' && target.url.startsWith(origin.origin + '/'));
  assert.ok(page, 'No test page found for the specified local origin');
  report.url = page.url;
  session = (await send('Target.attachToTarget', {targetId:page.targetId, flatten:true}, null)).sessionId;
  await send('Runtime.enable'); await send('Page.enable'); await send('Page.bringToFront');
  instrumentationId = (await send('Page.addScriptToEvaluateOnNewDocument', {source:instrumentation})).identifier;
  await send('Page.reload'); await delay(150); await waitReady();
  assert.equal(await evaluate('window.__smoke.contexts'), 0); check('no AudioContext before user gesture');
  await click('[data-enter]');
  await evaluate('window.stillwater.setMode("fly"); window.stillwater.viewpoint(0); true');
  await clearFocus();
  const before = await snapshot(); await hold('a'); const after = await snapshot();
  assert.ok(Math.abs(after.position[2] - before.position[2]) > 0.8); check('trusted held A strafes at near-zero theta', {before:before.position, after:after.position});
  await evaluate('window.stillwater.viewpoint(0); true'); await clearFocus();
  const qBefore = await snapshot(); await hold('q',250); const qAfter = await snapshot();
  assert.ok(radius(qAfter) > radius(qBefore) + 0.5, 'Q must descend outward toward ground'); check('trusted Q descends toward terrain', {before:radius(qBefore), after:radius(qAfter)});
  await hold('e',250); const eAfter = await snapshot();
  assert.ok(radius(eAfter) < radius(qAfter) - 0.5); check('trusted E ascends toward axis', {before:radius(qAfter), after:radius(eAfter)});
  const wBefore = await snapshot(); await hold('w'); const wAfter = await snapshot();
  assert.ok(wAfter.position[0] > wBefore.position[0] + 0.8); check('trusted held W advances', {before:wBefore.position[0], after:wAfter.position[0]});
  const trusted = await evaluate('window.__smoke.keys'); assert.ok(trusted.length >= 4 && trusted.every(event=>event.trusted)); check('all sustained gameplay keys were browser-trusted', trusted);
  await click('[data-sound]'); await delay(150);
  assert.equal(await evaluate('window.__smoke.contexts'),1); check('trusted sound-button gesture constructs one audio graph');
  await evaluate('window.__smokeAudioContexts[0].suspend()');
  await evaluate('window.stillwater.set("audio",false); true');
  await click('[data-sound]'); await delay(150);
  assert.equal(await evaluate('window.__smokeAudioContexts[0].state'),'running');
  assert.equal(await evaluate('window.__smoke.contexts'),1); check('trusted audio re-enable resumes existing suspended context');
  const submits = await evaluate('window.__smoke.submits'); assert.ok(submits > 1);
  await evaluate('window.stillwater.destroy(); true');
  await delay(120); const stopped = await evaluate('({...window.__smoke})'); await delay(250);
  assert.equal(await evaluate('window.__smoke.submits'), stopped.submits);
  assert.equal(stopped.deviceDestroys,1); assert.equal(stopped.audioCloses,1); check('destroy stops GPU submissions and closes GPU/audio resources', stopped);
  // This is a controlled capability simulation, NOT an unsupported hardware-device claim.
  unsupportedId = (await send('Page.addScriptToEvaluateOnNewDocument', {source:'Object.defineProperty(navigator,"gpu",{configurable:true,value:undefined});'})).identifier;
  await send('Page.reload'); await delay(500);
  const fallback = await evaluate('({text:document.body.innerText,ready:!!window.stillwater})');
  assert.ok(/WebGPU|graphics|browser/i.test(fallback.text) && !fallback.ready); check('simulated unavailable WebGPU shows fallback', {text:fallback.text.slice(-700)});
  assert.deepEqual(report.errors, [], 'No uncaught browser exceptions expected');
} catch (error) {
  report.results.push({name:'browser smoke',status:'FAIL',error:error.message}); process.exitCode = 1; console.error(error);
} finally {
  if (session && socket.readyState === WebSocket.OPEN) {
    if (unsupportedId) await send('Page.removeScriptToEvaluateOnNewDocument', {identifier:unsupportedId}).catch(()=>{});
    if (instrumentationId) await send('Page.removeScriptToEvaluateOnNewDocument', {identifier:instrumentationId}).catch(()=>{});
    await send('Page.reload').catch(()=>{});
  }
  clearTimeout(deadline);
  for (const {timer} of pending.values()) clearTimeout(timer);
  socket.close();
  await mkdir('artifacts/final-qa', {recursive:true});
  await writeFile('artifacts/final-qa/coordinator-browser-smoke.json', JSON.stringify(report,null,2)+'\n');
}
