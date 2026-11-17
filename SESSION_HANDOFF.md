# STILLWATER v3 integration handoff

## Current state

User approved a phase freeze on2026-11-17 and requested publication to `https://github.com/toho-stdio/cylindrical-world`. This checkpoint is named `phase-v3-freeze`; it preserves the improved in-progress result, not final art acceptance. Next polish priorities and verification gates are in `docs/PHASE_V3_FREEZE.md`. No additional visual implementation was made for publication.

Focused v3 recovery and the single bounded foliage follow-up are complete. Independent live source/standalone recheck is now complete: final verdict **NEEDS_ANOTHER_PASS for visual acceptance**. Near orchard boughs/leaves and negative space visibly improved; shell crowns, sparse Riverbend ground and planar cottage remain substantive residuals. Starlight warm wall/ground spill, stars/water and aqueduct were retained. Suitable for user review only as an in-progress stylized result, not an acceptance candidate or professional/reference parity. No further implementation loop is requested or automatically authorized by the review. See the preserved initial assessment and dated follow-up in `docs/VISUAL_V3_REVIEW.md`; fresh independent evidence is `artifacts/visual-v3/review/recheck-*`. Tests/build/smoke and generation metrics below are integration-agent evidence; reviewer independently confirmed live rendering/ready state at1440x900 without browser/console errors but did not rerun those checks.

After the review called out visible cap/bowl crowns, the bounded follow-up targets selected orchard hero trees across center/right rows and the closest left silhouettes; other crowns remain shell LOD. Their open scaffold now has eight full-width vertically distributed boughs, three longer secondary twigs per bough and 17 larger folded leaves per twig. Final generation measured **1,184,637 vertices**, **394,879 triangles**, **56,862,576 bytes / 54.23 MiB**, **8 finite lights**, **822.14 ms** in the existing 10-second child watchdog. The 48-byte/12-float vertex contract, geometry preguard, public API, material enum, controls and lifecycle were preserved; no camera-direction tuning was made. The earlier integration also fixed native quality-select `change` handling in `src/ui.js` and verified runtime transitions Low→Medium→High. Remaining limits: some near/mid and distant crowns still use shells, Riverbend lawn/path remains broad, cottage remains a simple low-poly mass, and warm falloff is stylized.

## Current preview and owned test resources

- Integration-owned source server: `http://localhost:4203/` (started by this session; it serves source and `dist/stillwater.html`).
- Integration-owned browser: named `agent-browser --webgpu` session `stillwater-integration-d3f4a606861b`. Its browser CDP WebSocket was `ws://127.0.0.1:50583/devtools/browser/537a238a-701a-40dd-a468-f442f2ee3515`.
- Integration evidence: `artifacts/visual-v3/integration/`; **post-review correction captures** and separate source/standalone smoke JSON are in `artifacts/visual-v3/integration/followup/` (1440×900 canonical orchard/Riverbend/cottage/aqueduct/default/Starlight plus actual-movement orchard and cottage-close views).
- `dist/stillwater.html` is the 81 KiB v3 build currently served from port4203.
- Existing coordinator preview on port4179 was not modified. Existing port4173 was not killed or modified. Do not kill unowned processes. Git is initialized on `main`, with origin `https://github.com/toho-stdio/cylindrical-world.git`; the freeze checkpoint is `phase-v3-freeze`. Use `git status` and `git remote -v` as current truth; local agent configuration, dependencies and logs are ignored.

## Verification performed

1. Final generation probe before test suite: `node scripts/with-deadline.mjs 10 -- node --input-type=module -e '…createWorld…'` — 822.14 ms, 1,184,637 vertices / 394,879 triangles / 54.23 MiB.
2. `node scripts/with-deadline.mjs 30 -- npm test` — 27/27 passed after the follow-up geometry change.
3. `npm run build` — passed; standalone generated at `dist/stillwater.html`.
4. `node scripts/browser-smoke.mjs` against both source `/` and standalone `/dist/stillwater.html` on the owned CDP browser after the follow-up — trusted A/W/Q/E movement, audio lazy/resume, GPU/audio destroy, halted submissions and controlled unavailable-WebGPU fallback all passed. The fallback hid `navigator.gpu` by test injection; it is not unsupported-device evidence. Reports are under `artifacts/visual-v3/integration/followup/`.
5. Standalone UI quality Low→Medium→High was verified in runtime state after fixing native select change handling; resize 1200×800→1440×900 and 390×844 narrow layout were exercised. Current screenshots/captures had no logged page/console errors.
6. `agent-browser doctor --webgpu --quick` — Chrome for Testing 155.0.8059.84, successful native Apple Metal 3 WebGPU probe; preferred canvas format `bgra8unorm`. UI reported 60 FPS during captures/interactions (an observation, not a benchmark); `GPUAdapter.info` was empty in page context.

Exact evidence and limitations: `docs/VISUAL_V3_INTEGRATION.md`. Comparison baselines `33/34/26/25` under `artifacts/visual-v2/integration/` remain untouched. Final v3 integration test evidence is native WebGPU, not merely a build.
