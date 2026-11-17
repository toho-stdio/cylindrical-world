# Visual integration pass

## Rendered review and iteration

Reviewed the prior native-renderer images and then captured the integrated source app on an owned server at `http://localhost:4184` with an isolated `agent-browser --webgpu` session. Screenshots are 1440×900 except `06-narrow-ui.png` (390×844), under `artifacts/visual-v2/integration/`:

- `01-riverbend.png` — initial clean startup/Riverbend composition.
- `02-hearthside.png` — initial cottage and river approach.
- `03-orchard.png` — initial orchard composition.
- `04-aqueduct.png` — initial aqueduct profile and river continuation.
- `05-night.png` — initial Starlight Far Light with stars, river, cottage and warm windows.
- `06-narrow-ui.png`, `07-ui-restored.png` — initial narrow UI and restored desktop interface.
- After independent review, the correction-loop captures are `16-riverbend-final.png`, `17-orchard-final.png`, `18-night-final.png`, and `22-riverbend-pitch-test.png`; final UI/narrow screenshots are `20-ui-restored.png` and `21-narrow-ui-final.png`.

Compared with the immutable `artifacts/final-qa/02-riverbend.png` and `10-final-standalone-aqueduct.png`, the integrated render is a clear visual step beyond the flat, yellow-green radial-normal scene and opaque/disconnected aqueduct: geometry now has authored normals and visible light/shadow form; the river is darker and less neon; the aqueduct has repeated open bays, filled spandrels and piers; and the night frame includes space depth and occupied warm windows. The new frames still show a stylized low-poly environment rather than reference parity.

### Evidence-driven integration changes

The first integration captures exposed narrow periodic streaks across the river at mesh-segment boundaries. In `src/world.js`, river ribbon width is now evaluated at both shared segment endpoints, so neighboring quads meet without width discontinuities. Reloaded native captures (`01-riverbend.png`, `05-night.png`) show a continuous, subdued water surface without the earlier broken segment seams.

The first Far Light image had attractive stars but no inhabited glow in frame. The sixth scenic camera now approaches the existing cottage at x=160 from x=145, preserving an open view toward the cylinder end while showing its river and roof. `src/shaders/world.js` gives the existing glass material a warm dusk/night emission; the night capture now visibly has warm windows and the entry lamp, while daylight panes remain cool. This is a restrained material emission, not a claim of volumetric lighting or measured bloom contribution.

### Remaining visual weaknesses for independent art review

- Foliage remains visibly low-poly. The correction loop adds irregular crown silhouettes, conifers, closer framing trees and undergrowth, but broadleaf crowns still read as faceted clustered masses rather than individual leafy canopies.
- Terrain still reads as large softly mottled green regions with modest height relief. Ground details remain sparse at the scale of the broad valley. The Riverbend path is now connected at segment joins, though its broad tan strip remains visually simple.
- The aqueduct is connected and recognizable, but the thin continuous far rail/deck line and repeated dark spandrel faces still look engineered/simple rather than finely built masonry.
- Night is still a dark stylized scene; ambient fill now makes the ground/buildings readable, but cottage windows are flat warm panels, not convincing lit interiors. River reflection is procedural and subdued, not a true scene reflection. The Far Light frame is still mostly landscape, water and sky.
- The visual system is stylized. Do not infer asset detail, photorealism, full-scene global illumination, cascaded shadows, or planar reflections from these renders.

## Independent-review follow-up / second correction loop

The independent reviewer captured the then-current source and standalone in `artifacts/visual-v2/review/` and returned **NEEDS ANOTHER PASS** (vegetation 2/5; atmosphere/night 2/5). I agree the initial integration was not a visual acceptance. In response, I made a second evidence-driven loop rather than treating the passing tests as the gate:

- Added a readable left-side conifer and right-edge broadleaf frame, eight varied young orchard-edge trees, and broadleaf crown shape variation (smaller leaf mesh tessellation with irregular surface contours). Added low, grounded undergrowth; tuned Riverbend camera pitch from -0.16 to -0.10 to reduce the foreground's share. See the final built-standalone captures `23-standalone-riverbend-final.png` and `24-standalone-orchard-final.png`.
- Fixed the remaining tan trail's segmented-width seam: every adjacent path quad now uses the same evaluated width at shared endpoints. The trail reads as a continuous route in `23-standalone-riverbend-final.png`.
- Corrected the night hemisphere's up direction to use the cylinder's local radial-up vector, then raised night ambient/hemisphere fill without changing the star/sky palette or warm glass emission. `26-standalone-night-final.png` shows the valley surface and cottage form instead of near-black silhouettes while retaining a dark star field.
- Reduced terrain grid sampling from 280×128 to 260×112 to make room for the added geometry without exceeding the shared buffer ceiling. Normalized geometry/tests still pass; this is not a relaxed mesh-budget invariant.

These changes improved the specific reviewed problems but did not pass the independent gate at that point: the re-review scored vegetation 2/5 and retained **NEEDS ANOTHER PASS**. Night improved from 2/5 to 3/5. Broadleaf silhouettes still read as lumpy low-poly masses, the aqueduct retains repeated masonry faces, and night windows remain flat emissive panes.

## Third vegetation correction loop

After the re-review called out the repeated ball/cone silhouette language, `src/world.js` replaced overlapped broadleaf ellipsoids with connected, irregular crown shells and smooth surface normals; conifers now use one irregular tapered crown mesh instead of stacked cone tiers. Tree branch structure is more visible, crown shape/scale varies, and mixed-height plant tufts fill the orchard floor and Riverbend foreground. Boulder placement is filtered around path corridors so stones no longer obstruct the footpath. Fresh built-standalone native WebGPU captures `33-canopy-reviewed-riverbend.png` and `34-canopy-reviewed-orchard.png` record this loop at 1440×900. The independent reviewer has now re-scored vegetation at 3/5 and marked the scene **READY FOR USER VISUAL REVIEW** (not final art or parity), using the preceding `29`/`30` iteration. The current `33` capture no longer has the noted center-path rock, after filtering boulder placement against all authored path corridors and cottage entrances. Current generated geometry is 1,089,471 vertices / 363,157 triangles / 52,294,608 bytes (49.87 MiB), under the 64 MiB buffer ceiling.

## Runtime and functional verification

- Browser: Chrome for Testing **155.0.8059.84**, `agent-browser doctor --webgpu --quick` reported **Apple Metal 3**; no native WebGPU shader/validation error observed during integrated renders.
- High-quality source runtime reported **60 FPS** in `window.stillwater.getState()` at the earlier captured views (live browser value, not a benchmark). Latest geometry is **1,089,471 vertices / 363,157 triangles / 52,294,608 bytes (49.87 MiB)**, within the 64 MiB vertex-buffer contract.
- `npm test`: **23/23 passed**. `npm run build`: **passed**, generated `dist/stillwater.html` (76 KiB).
- `scripts/browser-smoke.mjs` passed against the owned CDP endpoint on **both source `/` and standalone `/dist/stillwater.html`**: trusted WASD/Q/E movement, lazy/reused audio context, destroy stopping submissions and releasing GPU/audio resources, and simulated unavailable-WebGPU fallback. The final standalone structured report is copied to `artifacts/visual-v2/integration/browser-smoke-final.json`; the fallback simulation is not a claim of testing unsupported physical hardware.
- Narrow 390×844 toolbar/bottom-controls layout was visually inspected. The clean-scene CSS visibility override was restored; `20-ui-restored.png` records the visible interface. `21-narrow-ui-final.png` records the 390×844 check. The newest browser session used owned port 4184 for standalone screenshots `33`/`34`, then was closed after capture. No process on ports 4179 or 4173 was touched.

The historical QA report text and baseline screenshots were left unchanged.
