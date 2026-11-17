import test from 'node:test';
import assert from 'node:assert/strict';
import { createAudioEngine } from '../src/audio.js';

// A graph/lifecycle double, not an assertion about audible sound quality.
function makeContextDouble() {
  const instances = [];
  class Param {
    constructor(value = 0) { this.value = value; this.targets = []; }
    cancelScheduledValues() {}
    setTargetAtTime(value) { this.value = value; this.targets.push(value); }
    setValueAtTime(value) { this.value = value; }
    exponentialRampToValueAtTime(value) { this.value = value; }
  }
  class Node {
    constructor() {
      for (const key of ['gain', 'frequency', 'Q', 'detune', 'pan', 'threshold', 'knee', 'ratio', 'attack', 'release']) this[key] = new Param();
      this.connected = [];
    }
    connect(node) { this.connected.push(node); return node; }
    disconnect() { this.connected = []; }
    start() {}
    stop() {}
  }
  class Context {
    constructor() {
      this.state = 'suspended'; this.sampleRate = 100; this.currentTime = 0;
      this.destination = new Node(); this.gains = []; this.filters = [];
      this.resumeCalls = 0; this.closeCalls = 0; instances.push(this);
    }
    createGain() { const node = new Node(); this.gains.push(node); return node; }
    createBiquadFilter() { const node = new Node(); this.filters.push(node); return node; }
    createConvolver() { return new Node(); }
    createBufferSource() { return new Node(); }
    createOscillator() { return new Node(); }
    createStereoPanner() { return new Node(); }
    createDynamicsCompressor() { return new Node(); }
    createBuffer(channels, length) { const data = Array.from({length: channels}, () => new Float32Array(length)); return {getChannelData(index) {return data[index];}}; }
    async resume() { this.resumeCalls++; this.state = 'running'; }
    async close() { this.closeCalls++; this.state = 'closed'; }
  }
  return { Context, instances };
}

function install(t, Context) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'AudioContext');
  const originalWebkit = Object.getOwnPropertyDescriptor(globalThis, 'webkitAudioContext');
  Object.defineProperty(globalThis, 'AudioContext', {configurable:true, writable:true, value:Context});
  Object.defineProperty(globalThis, 'webkitAudioContext', {configurable:true, writable:true, value:undefined});
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'AudioContext', original); else delete globalThis.AudioContext;
    if (originalWebkit) Object.defineProperty(globalThis, 'webkitAudioContext', originalWebkit); else delete globalThis.webkitAudioContext;
  });
}

test('audio is lazy, idempotent, muted smoothly and destroyed safely', {timeout:3000}, async t => {
  const {Context, instances} = makeContextDouble(); install(t, Context);
  const audio = createAudioEngine(); t.after(() => audio.destroy());
  audio.update({progress:0,position:[0,140,0],wind:0.5,water:0.7});
  audio.setEnabled(false); audio.setVolume(0.4);
  assert.equal(instances.length, 0, 'pre-gesture calls must not allocate AudioContext');
  await Promise.all([audio.start(), audio.start()]);
  assert.equal(instances.length, 1); const context = instances[0];
  assert.equal(context.resumeCalls, 1); assert.equal(context.gains[0].gain.value, 0);
  audio.setEnabled(true); assert.equal(context.gains[0].gain.value, 0.4);
  audio.setVolume(99); assert.equal(context.gains[0].gain.value, 1);
  audio.setEnabled(false); assert.equal(context.gains[0].gain.value, 0);
  audio.destroy(); audio.destroy();
  assert.equal(context.closeCalls, 1);
  await assert.rejects(audio.start(), /destroyed/);
});

test('explicit start resumes an existing suspended context without allocating another graph', {timeout:3000}, async t => {
  const {Context, instances} = makeContextDouble(); install(t, Context);
  const audio = createAudioEngine(); t.after(() => audio.destroy());
  await audio.start(); instances[0].state = 'suspended';
  await audio.start();
  assert.equal(instances.length, 1);
  assert.equal(instances[0].resumeCalls, 2);
  assert.equal(instances[0].state, 'running');
});

test('unsupported audio fails usefully and a later explicit retry can recover', {timeout:3000}, async t => {
  const {Context, instances} = makeContextDouble(); install(t, undefined);
  const audio = createAudioEngine(); t.after(() => audio.destroy());
  await assert.rejects(audio.start(), /not supported/);
  globalThis.AudioContext = Context;
  await audio.start();
  assert.equal(instances.length, 1);
});

test('audio progress is day-to-night: insects rise at night and mute obeys master bus', {timeout:3000}, async t => {
  const {Context, instances} = makeContextDouble(); install(t, Context);
  const audio = createAudioEngine(); t.after(() => audio.destroy());
  audio.update({progress:0}); await audio.start();
  const context = instances[0];
  const insects = context.filters.find(filter => filter.type === 'highpass').connected[0];
  assert.equal(insects.gain.value, 0);
  audio.update({progress:1}); assert.equal(insects.gain.value, 0.035);
  audio.setEnabled(false); assert.equal(context.gains[0].gain.value, 0);
});
