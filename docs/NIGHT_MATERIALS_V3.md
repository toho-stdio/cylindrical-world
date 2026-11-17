# Night materials v3 — renderer recovery report

## Scope and retained design

The renderer/shader changes keep the shared 12-float / 48-byte vertex contract, existing material enum, renderer API, controls, and resource teardown/quality paths. The former failed geometry screenshot was taken while renderer code was being edited concurrently; its bind-group validation error was not treated as proof that the present renderer was still broken.

Native WebGPU verification on the current source found no pipeline, bind-group, WGSL, or first-frame resource errors. The main world layout binds frame uniforms, depth shadow texture/comparison sampler, and bounded point-light storage at binding 5. The depth-only shadow pipeline has its own one-uniform layout, rather than inheriting fragment-only material resources. A first-frame validation scope and uncaptured-error/device-loss reporting remain in the renderer. Low → medium → high quality transitions and a 1440×900 → 1200×800 → 1440×900 resize/rebuild were exercised in the same browser without console/page errors.

## Bounded local lights

`world.lights` is optional and limited to eight entries `{position, color, intensity, radius}`. The renderer skips malformed/non-finite or non-positive-radius/intensity records, clamps position to `x ±400, y/z ±200`, radius to `0.1…25`, color channels to `0…1`, and intensity to `0…20`, then uploads a freshly zeroed 8×32-byte storage buffer and count. The ±200 vertical/circumferential bounds are deliberate: this cylindrical habitat has valid surface coordinates near ±140. The earlier ±80 clamp silently moved lights near `y≈139` about 59 m from their emitters, beyond the authored radii. Expanding only these still-bounded limits restored the intended pools without changing the CPU/GPU world ABI.

The shader uses true light-to-surface distance, a normal-dependent Lambert term, a soft radius boundary and gentle inverse-distance attenuation; contribution fades toward daytime. The falloff retains each light's authored radius as the main pool boundary. Geometry tests now check that lamp sources are on the scene-facing side of nearby lamp/window surfaces, with the correct normals.

Native 1440×900 Starlight pixels now show more than luminous panes: on the Hearthside view, the wall and door receive a warm, spatially varying gradient and a distinct soft amber pool reaches the threshold and adjacent ground/path; surrounding ground and sky remain cool/dark, and the river stays readable. The pool is intentionally noticeable, but its near-edge gradient is broad and stylized rather than physically calibrated. It is not a shadowed/global exposure lift. Inspect:

- `artifacts/visual-v3/recovery-lighting/hearthside-starlight-final-1440x900.png`
- `artifacts/visual-v3/recovery-lighting/far-light-starlight-final-1440x900.png`
- Day comparison: `artifacts/visual-v3/recovery-lighting/hearthside-day-final-1440x900.png`

## HDR, display output, and shadows

World and multisample color targets remain `rgba16float` scene-linear HDR. The post pass uses restrained bloom, exposure/saturation controls and an ACES curve. An explicit shader sRGB OETF was tested against native Chrome's preferred `bgra8unorm` canvas: it produced a visibly washed-out Starlight/terrain capture, so it was removed. The final shader returns ACES-mapped display-linear output to the WebGPU canvas presentation path, which handles display transfer in this runtime. This avoids stacking an extra gamma operation. Do not add a blanket `pow(color, 1/2.2)` without checking the actual target/presentation path and pixels.

High quality keeps the 1536² directional shadow map covering a 96 m camera-centered frustum and the targeted 3×3 comparison PCF taps at 1.25 texels. This is a bounded edge-filtering pass, not a broad blur. Night sky/stars, water response, and cool ambient palette were preserved.

## Captures and verification

Fresh captures came from source at `http://localhost:4202` with a named `agent-browser --webgpu` session, 1440×900 viewport, after the fix and on the current geometry/light placement:

- `artifacts/visual-v3/recovery-lighting/far-light-default-final-1440x900.png`
- `artifacts/visual-v3/recovery-lighting/far-light-starlight-final-1440x900.png`
- `artifacts/visual-v3/recovery-lighting/hearthside-day-final-1440x900.png`
- `artifacts/visual-v3/recovery-lighting/hearthside-starlight-final-1440x900.png`

The first frame rendered, `navigator.gpu.getPreferredCanvasFormat()` returned `bgra8unorm`, and the UI/API reported ready. Console and page-error logs were empty after startup/capture and after the quality/resize exercise. The UI reported 60 FPS in the final observations; this is a software-WebGPU browser observation, not a performance benchmark. Historical captures in `artifacts/visual-v3/lighting/` were left intact; they predate this recovery.

Verification after combined geometry and renderer edits:

- `npm test` — 27/27 passing, within the existing 30-second watchdog.
- `npm run build` — succeeds; `dist/stillwater.html` built.
- Native browser — visible first frame; no validation/page errors; all three quality levels and resize cycle exercised.
- `node scripts/browser-smoke.mjs --cdp <owned 4202 CDP URL> --origin http://localhost:4202` — source golden path passed: trusted movement/strafe and radial controls, lazy audio construction and resume, GPU/audio destruction, and unavailable-WebGPU fallback. (The smoke harness reloads the app for its final fallback case.)

## Remaining limits

The result remains deliberately stylized low-poly work, not professional/reference parity. Hearthside still has a simple cottage mass, much of the wider terrain remains open lawn, and the warm pool is broader and less occluded than a physically based light. Some panes still read as flat luminous panels at distance despite their frames/recesses. Detailed shadow-edge quality should be reviewed across devices and the close tree/orchard/house views; the PCF filter is modest, not a replacement for higher-quality contact shadows. Standalone packaging and broader integration/browser-smoke evidence are owned by the integration pass.
