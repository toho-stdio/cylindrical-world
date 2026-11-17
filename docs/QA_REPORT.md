# STILLWATER independent final QA

## Recommendation

**Ready as a stylized prototype/demo, not reference-parity ready.** Native WebGPU source and standalone HTML run on the tested Mac/Chrome/Metal setup. The aqueduct blocker from the initial independent run is repaired and visually reviewed (see final follow-up below); 19/19 tests and the standalone trusted-input/lifecycle smoke pass. No claim of Duskward-level visual fidelity, subjective audio quality, touch gameplay, or broad GPU/browser coverage.

## Environment and commands

- Browser: Chrome for Testing 155.0.8059.84, isolated named `agent-browser --webgpu` session.
- WebGPU: `agent-browser doctor --webgpu` passed; probe reports **Apple Metal 3**. Renderer initialized and produced frames.
- Development server: owned QA server at `http://localhost:4177` (`PORT=4173` was already occupied by a server not owned by this run; it was left untouched).
- `npm test` — **PASS**, 18/18.
- `npm run build` — **PASS**, creates `dist/stillwater.html` (~49 KiB).
- Build, browser source and standalone runtime checks completed. Browser-observed FPS was **55–62 FPS** in the exercised session (live app state; not a benchmark).

## Initial independent results (follow-ups below supersede repaired gaps)

| Check | Result | Evidence / notes |
|---|---|---|
| Opening screen and entry | **PASS** | `01-onboarding.png`; entered world and live HUD initialized. |
| Source runtime, native WebGPU | **PASS** | Adapter available and scene rendered. Renderer performs WGSL compilation checks and scoped pipeline validation; no shader/GPU validation error, uncaught error, or fatal app state surfaced during this run. |
| River / trees / cottage landmark | **PASS, stylized** | `02-riverbend.png`; curved rippling river and gabled cottage are recognizable. Foliage remains very low-poly/static. Visually much improved over baseline checkerboard screenshot. |
| Aqueduct landmark composition | **FAIL / needs polish** | `03-aqueduct.png` at named Old Aqueduct viewpoint does not make the aqueduct legible. `09-aqueduct-approach.png` shows a very large tan span across and occluding most of the view, rather than a clearly readable aqueduct/arch. Geometry exists in `src/world.js`, but presentation is not successful. |
| Night / space | **PASS, limited** | `04-night-space.png`; Far Light with Starlight preset is dark and legible with river/house, but no elaborate starfield/space vista is apparent in this framing. |
| Settings and actual rendered settings effect | **PASS** | `05-settings.png`, `07-settings-full.png`; sliders, audio checkbox, quality select and reset are visible. Preset selection changed live API values (Morning Mist: sun `.55`, atmosphere `.9`, exposure `1.04`, saturation `.75`, stars `.25`; Starlight: sun `.12`, stars `1`, exposure `.82`) and rendered look. Reset restored defaults. |
| Six viewpoints | **PASS, state verified** | Selected indices 0–5; each reported expected index, position/region and ready state. The named aqueduct viewpoint composition itself is the failure above. |
| Tour on/off | **PASS** | API on showed first caption and touring state; off returned `touring:false`. Not a full 160-second tour traversal. |
| Movement | **PASS for bounded checks; input types separated** | Trusted `agent-browser press a` delivered a DOM key event with `isTrusted:true`, but its brief pulse was too short to assess travel. Sustained WASD, A strafing at theta≈0 and nonzero theta, Q descent then E ascent were exercised with **synthetic held KeyboardEvents**; positions changed in expected directions. These synthetic holds are not evidence of physical keyboard hardware behavior. |
| Walking terrain clearance | **PASS (synthetic movement)** | After synthetic held W, radial camera distance matched `WORLD.radius - terrainHeight(x,theta) - 1.7` to floating-point precision. |
| Pointer lock / Escape | **PASS** | Trusted browser click on canvas set `document.pointerLockElement` to `#world`; trusted Escape released it. |
| Blur key clearing | **PASS (synthetic held-key test)** | Synthetic held W moved the camera; synthetic window blur stopped movement immediately and it remained stopped. Pointer-lock exit is separately observed; no stuck movement after Escape. |
| Audio gesture / consistency | **PASS for control/API; subjective audio NOT VERIFIED** | Initial `audio=false` and checkbox unchecked. Explicit Sound button click changed API and checkbox together; API enable also synchronized checkbox/label, reset muted again. No audio was judged by listening; do not claim subjective sound quality or audible output. |
| Standalone HTML / external runtime fetches | **PASS** | `dist/stillwater.html` initialized WebGPU and `window.stillwater`; one inline script, no external script URLs; browser request log was empty after load. `08-standalone.png`. |
| Narrow layout | **PASS, limited** | At 390×844, settings panel controls fit in viewport in `06-responsive.png`. No touch movement controls are implemented or claimed. |
| Unsupported-WebGPU fallback | **NOT VERIFIED in an actually unsupported browser** | `src/ui.js` includes a visible fatal/fallback message, but this browser had a working adapter; no real no-WebGPU device was available in the test session. |
| Destroy behavior | **NOT VERIFIED** | API exposes destroy; the attempted check did not establish cessation of frames/resource cleanup. |
| No external assets/code from Duskward | **PASS by source/build inspection** | Source app and standalone runtime loaded without external assets; no copied reference code/assets were introduced in this QA. |

## Screenshots

Stored under `artifacts/final-qa/`:

- `01-onboarding.png` — onboarding over initial world.
- `02-riverbend.png` — river, cottage and landscape.
- `03-aqueduct.png` — named Old Aqueduct viewpoint (composition failure noted above).
- `04-night-space.png` — Far Light / Starlight preset.
- `05-settings.png`, `07-settings-full.png` — settings UI and actual pixels.
- `06-responsive.png` — 390×844 narrow layout.
- `08-standalone.png` — built standalone runtime.
- `09-aqueduct-approach.png` — close approach demonstrating aqueduct occlusion.

Audio was not listened to. Touch input, other browsers/adapters, an actually unsupported-WebGPU device, and full-length tour traversal were not verified. This QA does not establish photorealism or full reference parity.

## Coordinator follow-up: trusted input and lifecycle

The remaining input/lifecycle gaps above were exercised using `scripts/browser-smoke.mjs`, attached by CDP to an explicitly owned local Chrome session. Exact structured evidence: `artifacts/final-qa/coordinator-browser-smoke.json`. These are **browser-trusted** CDP events (`isTrusted:true`), not physical keyboard hardware.

- **PASS:** held A strafes at near-zero theta; held W advances; Q descends outward toward terrain, E ascends inward toward the axis. Corrected a semantic reversal in `radialStep`, the UI help label and control docs/tests; regression assertions now measure actual radius at four cylinder angles rather than trusting a named sign convention.
- **PASS:** no AudioContext before interaction; a trusted sound-button click constructs one graph. Suspending the context and re-enabling sound exposed a host-level `audioStarted` gate that prevented resumption; removed the redundant gate and reran the browser check successfully with one reused context. Subjective audio quality is still **NOT VERIFIED**.
- **PASS:** instrumented actual GPU `queue.submit`, GPU `device.destroy` and audio `close` calls. After `api.destroy()`, submissions stop, the device is destroyed once and the audio context closes once. This supersedes the earlier destroy NOT VERIFIED result; it is a bounded lifecycle check, not an exhaustive driver-memory leak test.
- **PASS (capability simulation only):** injected unavailable `navigator.gpu` before page initialization. The visible unsupported-WebGPU message and retry UI appeared, without a ready world API. This is not a test on physically unsupported hardware.
- Uncaught browser exceptions: none in this follow-up run. Test uses a 45-second total deadline and command-level timeouts; it removes capability instrumentation and reloads the healthy app afterward.

## Final aqueduct repair and standalone verification

- **PASS, stylized:** replaced the opaque band with three open segmented masonry arches, piers and a slender localized deck. Viewpoint 2 is now an approach at x=-20, theta=0.15, radial offset 8. Coordinator inspected `artifacts/aqueduct-repair-final.png` and `artifacts/aqueduct-repair-approach.png`: arches/openings and river are visible, instead of a solid view-blocking wall. The close arch remains large; this is not a photorealistic or production-grade landmark model.
- **PASS:** `npm test` rerun by coordinator: **19/19**, including the added landmark geometric regression. `npm run build` creates the ~49 KiB self-contained `dist/stillwater.html`.
- **PASS:** reopened the newly built standalone at `http://localhost:4179/dist/stillwater.html` and reran the entire trusted CDP input/audio/destroy/simulated-fallback smoke. Structured results include the tested URL: `artifacts/final-qa/coordinator-browser-smoke.json`.
- **PASS:** healthy standalone restored afterward; viewpoint 2 reports ready, correct aqueduct region and live FPS 60 in that run (not a benchmark). Screenshot: `artifacts/final-qa/10-final-standalone-aqueduct.png`. No uncaught browser errors were reported.
- The initial aqueduct FAIL above is superseded by this focused repair. Details: `docs/AQUEDUCT_FIX.md`. Known limitations remain: static low-poly foliage, approximate walking/object collision, no shadow maps/bloom/advanced volumetrics, no implemented touch movement, no subjective listening or exhaustive full-tour/device matrix.
