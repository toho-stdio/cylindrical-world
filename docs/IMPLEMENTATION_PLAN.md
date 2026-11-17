# STILLWATER / cylindrical habitat — implementation contract

## Goal and user decision
Create a new independent, playable/explorable cylindrical world inspired by the technical ideas in `/Users/macos/Downloads/duskward-an-interactive-world.html`. Do not copy its code, embedded audio, fonts or assets. User selected independent implementation. All delegated agents use `openai-codex/gpt-6-luna`, thinking high (verified using `pi --list-models luna`).

## Scope and creative direction
Native WebGPU + WGSL, no external rendering engine. Warm pastoral science fiction inside a radius ~140, length ~480 cylinder: curved terrain visibly rises overhead, river, forest/orchards, cottages, ring aqueduct, distant luminous sun and space/night opening. Deterministic seed. Spatial daylight -> twilight along the cylinder. Cinematic initial framing is crucial: show the curved inhabited landscape and landmark, not an empty black or flat scene. Refined restrained editorial HUD; warm ivory typography and sage/amber accents; no dashboard clutter. Working flight/walk, tour, viewpoints, settings API, procedural audio, standalone bundle. Be truthful about simplifications: no claim of shadows/compute/bloom if not implemented.

## Ownership
- Engine agent: `src/main.js`, `src/experience.js`, `src/renderer.js`, `src/world.js`, `src/math.js`, `src/shaders/*` and any additional engine-only modules. Own runtime integration imports.
- UI agent: `index.html`, `src/ui.js`, `src/styles.css`. Avoid engine files.
- Audio agent: `src/audio.js` only, optional `docs/AUDIO.md`.
- Coordinator: package/tooling, docs, build/server scripts, own verification outside agent-owned files while they work.
- Integration agent (after all three): reconcile interfaces, build and runtime validation, fix issues. May edit any implementation file after predecessors finish.
- Review agent (after integration): independent real-browser verification and concrete evidence report; small targeted fixes allowed with explicit reporting and rerun.

## Fixed DOM/module contract
`index.html` contains `<canvas id="world"></canvas>`, stylesheet `<link rel="stylesheet" href="/src/styles.css">`, and `<script type="module" src="/src/main.js"></script>`. UI may add a root or create it dynamically. Do not require external fonts, images, CDNs or assets.
`src/main.js` imports `createExperience` from `./experience.js`, `mountUI` from `./ui.js`, and `createAudioEngine` from `./audio.js`.
`createExperience(canvas)` is asynchronous; returns the API below. Main calls `mountUI(api)` after initialization and connects audio. Handle WebGPU unavailable/device failures visibly, no eternal loader. UI exports `showFatal(error)` (works even before mount); main catches errors and invokes it.

## Experience API (engine implements, UI consumes)
- `params`: mutable current values. Minimum: sun, atmosphere, exposure, saturation, wind, water, foliage, stars, audio, quality. Numeric controls except `audio` boolean, `quality` 'low'|'medium'|'high'.
- `defs`: array of `{key,label,min,max,step,type,options?}`. `type`: 'range'|'checkbox'|'select'. Labels are human readable. Numeric bounds are engine-owned; UI uses defs, not assumptions.
- `presets`: array of display-name strings (minimum 'Golden Hour', 'Morning Mist', 'Starlight', 'Storybook', 'Monochrome').
- `get(key)`, `set(key,value)`, `setMany(values)`, `preset(name)`, `reset()`.
- `enter()`: called on explicit user click, activates exploration and requests pointer lock when available (rejections handled). `setMode('fly'|'walk')`.
- `viewpoint(index)`: jump to a scenic viewpoint; six available.
- `tour(enabled?)`: boolean toggles/sets guided tour.
- `getState()`: returns `{ready,entered,mode,touring,viewpoint,region,fps,position:[x,y,z],progress,caption?,error?,quality?}`. `progress` is 0..1 spatial daylight-to-night position, not loading progress.
- `subscribe(listener)`: listener receives state on change and throttled runtime updates (~5Hz); returns unsubscribe. UI must not accumulate subscriptions. Setting params triggers listeners.
- `destroy()` cleanup.
- `window.stillwater = api`; alias `window.world = api` if useful for browser testing. External tuning must affect GPU uniforms/real visuals.
- Keyboard WASD, mouse look, Q/E radial elevation, Shift sprint, G walk/fly, Esc unlock. Settings or modal focus must not activate movement. Reset keys on blur/unlock; dt clamp. Walk camera gravity follows cylinder, collision stays above terrain and within endpoints. Tour relinquishes control cleanly on movement. Touch controls if feasible (do not block desktop completion).

## Audio contract
`createAudioEngine()` synchronous factory, NO audio context/autoplay before explicit gesture. Returns:
- `start()`: Promise<void>, idempotent, resumes context on explicit gesture; callers handle unsupported audio gracefully.
- `setEnabled(boolean)`: smooth mute/unmute (does not secretly create AudioContext); may call start only in explicit gesture handler.
- `setVolume(number)` 0..1.
- `update({progress,position,wind,water})`: `progress` 0..1 spatial daylight-to-night; lightweight, safe before start. Others optional.
- `destroy()`.
Generate original ambient music and procedural nature sound; no external audio or ElevenLabs calls/keys. Cap voices, cleanup timers, smooth gains, document limitations.
Main calls audio.start() from original click event without losing gesture activation (e.g. wrap `api.enter`; UI audio toggle likewise); ties enabled to api.params.audio and updates via subscription. Main should publish no readiness before renderer has actually rendered.

## Verification and delivery
Coordinator supplies npm scripts: `npm run dev` localhost:4173; `npm run build` standalone `dist/stillwater.html`; `npm test` portable node tests. Build must inline JS/CSS and need no external runtime requests. Modular source remains readable. Tests should cover seeded world, cylindrical mapping and API where feasible. Integrator and reviewer use real browser with WebGPU and screenshots at multiple viewpoints, check console/GPU validation, controls/settings/tour/audio gesture and unsupported handling. Record exact commands and evidence, never invent runtime success. Do not change global browser profiles or kill unowned processes. Put screenshots/test results under artifacts/. New workspace, not initially a git repo. No deployment requested.
