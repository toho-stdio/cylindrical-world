# Ring Aqueduct composition repair

## What changed

`src/world.js` replaces the old opaque curved band at `x=22` with a localized, three-arch masonry crossing. Its segmented arch bands, alternating stone tones, piers, thin capped deck and narrow parapets preserve visible gaps through to the river/terrain. The configured total angular span is `0.92` radians; each opening is about `30.6 m` wide. Geometry is generated in the same deterministic world mesh and remains finite/bounded.

`src/experience.js` moves only viewpoint index 2 to an approach at `x=-20`, `theta=0.15`, yaw `0`, fly radial offset `8`, pitch `-0.015`. The other five viewpoint tuples and movement controls are unchanged. The state reports `viewpoint: 2` and `region: "The Ring Aqueduct"` at this position.

## Visual evidence

- `artifacts/aqueduct-repair-final.png` — native WebGPU source app at viewpoint index 2 (`x=-20`, `theta=0.15`, radial offset `8`), after entering the world. It shows several arch spans framing the valley/river with open sightlines.
- `artifacts/aqueduct-repair-approach.png` — closer fly approach (`x≈0`, same circumferential position); the foreground arch is prominent but its opening remains clear and the river/terrain are visible beyond and beneath it.
- Original failure references: `artifacts/final-qa/03-aqueduct.png` and `artifacts/final-qa/09-aqueduct-approach.png`.

The repaired images are a stylized low-poly aqueduct, not a photorealistic masonry model. Close approach makes the piers and opening legible, though the foreground arch occupies a large portion of the view; the approach is not claimed to be an unobstructed scenic vista. No broad device/browser compatibility claim is made here.

## Validation

- Native WebGPU screenshot loop: isolated `agent-browser --webgpu` session at `http://localhost:4178/`; `agent-browser doctor --webgpu --quick` passed with Apple Metal 3. The session selected viewpoint 2 through `window.stillwater.viewpoint(2)` and reported `ready: true`, `viewpoint: 2`, `region: "The Ring Aqueduct"`.
- `npm test` — **PASS**, 19 tests, including `tests/landmark.test.mjs` geometric metadata/opening-width and finite bounded mesh regression.
- `npm run build` — **PASS**.

The coordinator's separate control/audio/destroy/fallback checks and `src/main.js` change are outside this landmark patch.
