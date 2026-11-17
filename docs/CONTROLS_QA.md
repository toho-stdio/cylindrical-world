# Controls and interaction QA

## Automated regression coverage

`tests/controls.test.mjs` verifies the pure movement/camera helpers used by `src/experience.js`:

- axial/circumferential forward and strafe basis at four cardinal headings;
- radial Q descent (outward toward terrain) and E ascent (inward toward the cylinder axis), including clamps;
- camera clearance over sampled `terrainHeight(x, theta)` at four cardinal angles;
- finite camera coordinates and daylight progress direction;
- excluding interactive UI focus from gameplay key handling.

Run with `npm test`.

## Runtime behavior implemented

- Walking camera remains at `WORLD.radius - terrainHeight(x, theta) - 1.7`; it recalculates terrain clearance as axial/circumferential coordinates change.
- Flight camera offset is clamped to 1.7–32 units from the local terrain. Q decreases clearance (descends outward toward terrain); E increases clearance (ascends inward toward the axis). WASD moves in the cylinder tangent plane relative to yaw; pitch adds vertical movement while flying.
- Keys are cleared on blur, document hidden, pointer-lock exit, and focus entering interactive UI. G and Space do not oscillate from key-repeat events.
- Pointer-lock calls catch both synchronous exceptions and rejected promises.
- Guided tour follows a 160-second out-and-back route through six landmarks, captions each stop, and yields to manual keyboard or mouse input. The return leg avoids a discontinuous teleport at the cylinder's open axial ends.
- Audio receives `1 - daylightAt(x)` because the audio engine defines 0 as day and 1 as night; public experience progress remains 1 at day / 0 at night to match the world HUD.

## Browser QA status

A named `agent-browser --webgpu` session on the isolated development server at `http://localhost:4175` verified that the app initialized and the Explore HUD appeared after clicking Enter. UI flow checks confirmed Settings opens, the Morning Mist preset changes the live API to `sun=0.55` / `atmosphere=0.9`, Guided tour exposes its first caption (`The river gathers the last light.`), and Explore stops the tour. These checks exercised UI/API state, not trusted gameplay keyboard input or mouse-look.

The dedicated independent WebGPU QA will verify adapter/runtime errors, trusted key input, pointer-lock/lifecycle behavior and visual landmarks. No on-screen mobile movement controls are implemented; mobile exploration is not claimed. Synthetic unit tests do not substitute for trusted browser key input, pointer-lock/lifecycle testing, or visual landmark inspection.
