/**
 * STILLWATER's entirely synthesized ambient soundscape.
 * Nothing is allocated until start() is invoked from a user gesture.
 */
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const TAU = Math.PI * 2;
const SCALE = [0, 2, 4, 7, 9]; // a calm pentatonic palette

export function createAudioEngine() {
  let context = null;
  let graph = null;
  let startPromise = null;
  let enabled = true;
  let volume = 0.55;
  let destroyed = false;
  let scheduler = null;
  let lastProgress = 0;
  const voices = new Set();
  const state = { progress: 0.25, wind: 0.35, water: 0.3, position: null };

  const audioContextConstructor = () => globalThis.AudioContext || globalThis.webkitAudioContext;
  const ramp = (param, value, time = 1.4) => {
    if (!context || !param) return;
    const now = context.currentTime;
    param.cancelScheduledValues(now);
    param.setTargetAtTime(value, now, Math.max(0.025, time / 4));
  };

  function makeNoiseBuffer(seconds) {
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * seconds), context.sampleRate);
    const channel = buffer.getChannelData(0);
    // Repeatable locally generated noise; no embedded or fetched samples.
    let sample = 0;
    for (let i = 0; i < channel.length; i++) {
      sample = sample * 0.985 + (Math.random() * 2 - 1) * 0.12;
      channel[i] = sample;
    }
    return buffer;
  }

  function makeReverb() {
    const convolver = context.createConvolver();
    const length = Math.floor(context.sampleRate * 2.8);
    const impulse = context.createBuffer(2, length, context.sampleRate);
    for (let channelIndex = 0; channelIndex < 2; channelIndex++) {
      const data = impulse.getChannelData(channelIndex);
      for (let i = 0; i < length; i++) {
        const decay = Math.pow(1 - i / length, 3.2);
        // Slightly diffuse stereo reflections with a locally generated impulse.
        data[i] = (Math.random() * 2 - 1) * decay * (channelIndex ? 0.72 : 0.82);
      }
    }
    convolver.buffer = impulse;
    return convolver;
  }

  function makeLoopingNoise(buffer, filterType, frequency, q, gainValue, destination) {
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = frequency;
    filter.Q.value = q;
    const gain = context.createGain();
    gain.gain.value = gainValue;
    source.connect(filter).connect(gain).connect(destination);
    source.start();
    return { source, filter, gain };
  }

  function buildGraph() {
    const master = context.createGain();
    master.gain.value = 0;
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -22;
    compressor.knee.value = 18;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.035;
    compressor.release.value = 0.28;
    master.connect(compressor).connect(context.destination);

    const dry = context.createGain();
    const wet = context.createGain();
    const reverb = makeReverb();
    dry.gain.value = 0.82;
    wet.gain.value = 0.2;
    dry.connect(master);
    wet.connect(reverb).connect(master);

    const pan = context.createStereoPanner ? context.createStereoPanner() : context.createGain();
    pan.connect(dry);
    pan.connect(wet);

    const pad = context.createGain();
    pad.gain.value = 0.15;
    pad.connect(pan);
    const oscillators = [];
    for (let i = 0; i < 4; i++) {
      const oscillator = context.createOscillator();
      const toneGain = context.createGain();
      oscillator.type = i === 0 ? 'sine' : 'triangle';
      oscillator.frequency.value = 110 * (i + 1);
      oscillator.detune.value = (i - 1.5) * 3;
      toneGain.gain.value = [0.38, 0.19, 0.11, 0.07][i];
      oscillator.connect(toneGain).connect(pad);
      oscillator.start();
      oscillators.push(oscillator);
    }

    const wind = makeLoopingNoise(makeNoiseBuffer(5), 'lowpass', 680, 0.45, 0, pan);
    const water = makeLoopingNoise(makeNoiseBuffer(4), 'bandpass', 850, 0.65, 0, pan);
    const insects = makeLoopingNoise(makeNoiseBuffer(3), 'highpass', 3600, 0.5, 0, pan);
    return { master, pan, pad, oscillators, wind, water, insects };
  }

  function applyState() {
    if (!context || !graph) return;
    const { progress, wind, water, position } = state;
    const night = clamp((progress - 0.53) / 0.47, 0, 1);
    const dusk = Math.sin(progress * Math.PI);
    const now = context.currentTime;
    ramp(graph.master.gain, enabled ? volume : 0, 1.1);
    ramp(graph.pad.gain, 0.13 + dusk * 0.025 + night * 0.025, 2.5);
    ramp(graph.wind.gain.gain, 0.035 + wind * 0.105, 2.2);
    ramp(graph.water.gain.gain, 0.018 + water * 0.09, 2.4);
    ramp(graph.insects.gain.gain, night * 0.035, 3.5);

    // Position is optional: use cylinder-relative x for a gentle stereo drift.
    if (graph.pan.pan) {
      let pan = (progress - 0.5) * 0.24;
      if (Array.isArray(position) && Number.isFinite(position[0])) pan += clamp(position[0] / 140, -1, 1) * 0.22;
      ramp(graph.pan.pan, clamp(pan, -0.45, 0.45), 2.8);
    }

    // Shift a quiet four-note bed among pentatonic voicings as the day advances.
    const phrase = Math.floor(progress * 8);
    if (phrase !== lastProgress) {
      lastProgress = phrase;
      const root = (progress > 0.58 ? 196 : progress < 0.2 ? 174.61 : 164.81);
      const offsets = [0, SCALE[(phrase + 1) % SCALE.length], SCALE[(phrase + 3) % SCALE.length], 12];
      graph.oscillators.forEach((oscillator, i) => {
        const frequency = root * Math.pow(2, offsets[i] / 12);
        oscillator.frequency.setTargetAtTime(frequency, now, 1.8 + i * 0.2);
      });
    }
  }

  function playBirdCall() {
    if (!context || !graph || destroyed || !enabled || voices.size >= 3 || state.progress > 0.78) return;
    const now = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();
    const pan = context.createStereoPanner ? context.createStereoPanner() : context.createGain();
    const startFrequency = 950 + Math.random() * 850;
    const duration = 0.16 + Math.random() * 0.2;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFrequency, now);
    osc.frequency.exponentialRampToValueAtTime(startFrequency * (1.18 + Math.random() * 0.38), now + duration * 0.65);
    osc.frequency.exponentialRampToValueAtTime(startFrequency * 0.88, now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.018 + Math.random() * 0.012, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    if (pan.pan) pan.pan.value = Math.random() * 0.8 - 0.4;
    osc.connect(gain).connect(pan);
    const voiceBus = context.createGain();
    voiceBus.gain.value = 1;
    pan.disconnect();
    pan.connect(voiceBus);
    voiceBus.connect(graph.pan);
    const voice = { osc, gain, pan, voiceBus };
    voices.add(voice);
    osc.onended = () => {
      voices.delete(voice);
      osc.disconnect(); gain.disconnect(); pan.disconnect(); voiceBus.disconnect();
    };
    osc.start(now);
    osc.stop(now + duration + 0.03);
  }

  function scheduleNature() {
    scheduler = null;
    if (destroyed || !context || !enabled) return;
    const night = clamp((state.progress - 0.55) / 0.45, 0, 1);
    if (enabled && state.progress < 0.78 && Math.random() < 0.78) playBirdCall();
    // One bounded scheduler alternates occasional synthetic chirps and lets the
    // continuous filtered insect-noise layer carry the night ambience.
    const delay = (state.progress > 0.55 ? 2.6 : 3.8) + Math.random() * 4.5 + night * 1.5;
    scheduler = setTimeout(scheduleNature, delay * 1000);
  }

  async function start() {
    if (destroyed) throw new Error('Audio engine has been destroyed.');
    if (startPromise) {
      await startPromise;
      if (destroyed) throw new Error('Audio engine has been destroyed.');
      // A backgrounded tab or audio policy can suspend an already built graph.
      // Only this explicitly invoked entry point resumes it, never update().
      if (context?.state === 'suspended') await context.resume();
      return;
    }
    const initializing = (async () => {
      const AudioContextCtor = audioContextConstructor();
      if (!AudioContextCtor) throw new Error('Web Audio is not supported in this browser.');
      context = new AudioContextCtor();
      graph = buildGraph();
      applyState();
      await context.resume();
      if (!destroyed && enabled && !scheduler) scheduler = setTimeout(scheduleNature, 800);
    })();
    startPromise = initializing;
    try {
      await initializing;
    } catch (error) {
      if (context) { try { await context.close(); } catch {} }
      context = null;
      graph = null;
      // Reset after assignment, including failures thrown before the first await.
      if (startPromise === initializing) startPromise = null;
      throw new Error(`Could not start audio: ${error?.message || error}`);
    }
  }

  function setEnabled(value) {
    enabled = Boolean(value);
    if (!enabled && scheduler !== null) { clearTimeout(scheduler); scheduler = null; }
    applyState();
    if (enabled && context && !destroyed && !scheduler) scheduler = setTimeout(scheduleNature, 800);
  }

  function setVolume(value) {
    const number = Number(value);
    if (Number.isFinite(number)) volume = clamp(number, 0, 1);
    applyState();
  }

  function update(next = {}) {
    if (Number.isFinite(next.progress)) state.progress = clamp(next.progress, 0, 1);
    if (Number.isFinite(next.wind)) state.wind = clamp(next.wind, 0, 1);
    if (Number.isFinite(next.water)) state.water = clamp(next.water, 0, 1);
    if (Array.isArray(next.position)) state.position = next.position.slice(0, 3);
    applyState();
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    if (scheduler !== null) clearTimeout(scheduler);
    scheduler = null;
    for (const voice of voices) {
      voice.osc.onended = null;
      try { voice.osc.stop(); } catch {}
      voice.osc.disconnect(); voice.gain.disconnect(); voice.pan.disconnect(); voice.voiceBus.disconnect();
    }
    voices.clear();
    if (context) {
      const closing = context;
      context = null;
      graph = null;
      void closing.close().catch(() => {});
    }
  }

  return { start, setEnabled, setVolume, update, destroy };
}
