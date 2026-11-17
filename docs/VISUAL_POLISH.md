# Visual refinement notes

## Implemented in the native WebGPU renderer

- Replaced per-cell random terrain color patches with a deterministic, wrapped multi-scale height field and continuous vertex colors. The height profile remains `terrainHeight(x, thetaRadians)` and stays in a small walking-height envelope; the cylindrical seam is deterministic.
- Added a curved variable-width river ribbon and shallow banks, with a restrained animated water highlight in WGSL. Added clustered low-poly broadleaf crowns and layered conifer silhouettes, gabled cottages with roof slopes, doors/windows, chimneys and porches, plus bridge and aqueduct geometry.
- Moved the luminous sun into the inhabited daylight-to-dusk span (consistent with `daylightAt`: negative x is bright, positive x is night). Added analytic cylindrical-shell lighting, exposure/saturation tone mapping and distance haze. The view into the cylinder end now clears to a darker blue rather than flat gray.
- Increased the terrain sampling density while keeping the generated mesh bounded. Foliage geometry remains static; no shadows, bloom, volumetric scattering or GPU vegetation simulation are implemented.

## Validation and screenshots

- `npm test` covers deterministic generation, terrain seam/daylight, terrain smoothness/height range and finite bounded mesh data.
- `npm run build` produces the standalone bundle.
- Browser: isolated `agent-browser --webgpu` session against the local server on port 4174. Screenshots: `artifacts/qa/visual-polish-01.png`, `artifacts/qa/visual-polish-02.png`, `artifacts/qa/visual-polish-riverbend.png`, and refined `artifacts/qa/visual-polish-riverbend-refined.png`, and final Riverbend composition `artifacts/qa/visual-polish-final.png`.
- Visual iteration inspected the actual WebGPU Riverbend view, then corrected collapsed tree-crown width, river surface visibility/ripples, clear-sky darkness, and overly hard terrain patching. The remaining style is intentionally low-poly and geometry-only.
