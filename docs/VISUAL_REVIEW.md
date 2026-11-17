# Independent visual review — STILLWATER v2

## Verdict: READY FOR USER VISUAL REVIEW (image-only vegetation re-review)

The latest canopy iteration clears the prior vegetation blocker. Compared with my initial and second review, the final 33/34 images show more coherent, irregular crown shells, visible branch structure, a less mechanically stacked conifer silhouette, and materially denser orchard/foreground planting. The broadleaf trees remain conspicuously low-poly and some canopies still read as stylized faceted masses, but they no longer read merely as overlapping ellipsoids or sphere placeholders. The overall scene is still simple and has visible shortcomings; this is readiness for user visual review, not a claim of photorealism or Duskward parity. The aqueduct and night captures do not introduce a new category at 2 or below.

### Scores (1–5)

| Category | Score | Image evidence |
| --- | ---: | --- |
| Composition | 3 | `23-standalone-riverbend-final.png` now has a continuous path, a foreground conifer and a broadleaf edge frame around cottage → river → connected bridge → habitat opening. The frame is clearer, but the cottage still dominates the right foreground and the left/lower half remains a broad simple lawn with only sparse grasses. |
| Lighting / depth | 3 | `23-standalone-riverbend-final.png` has authored light/shadow and depth layering absent from `artifacts/final-qa/02-riverbend.png`; terrain remains a broad, weakly differentiated green surface. `26-standalone-night-final.png` is brighter and more legible than my first night capture, though still quite dark. |
| Vegetation | 3 | `33-canopy-reviewed-riverbend.png` and `34-canopy-reviewed-orchard.png` show irregular connected canopy shells and visible branch accents rather than obvious overlapping spheres; conifers also have less regular crown shape, with substantially more ground tufts and orchard trees. The forms are still strongly faceted/stylized, a few silhouettes remain cone-like, and the overall ground is not lush. This is now adequate for user review, not polished foliage. |
| Architecture / contact | 3 | `25-standalone-aqueduct-final.png` confirms open arch, piers, deck and ground-reaching supports, unlike the detached/opaque baseline `artifacts/final-qa/10-final-standalone-aqueduct.png`. The faces are still repetitive, dark flat spandrels beneath a thin straight rail with little masonry articulation; cottage form remains planar and blocky. |
| Water | 3 | `23-standalone-riverbend-final.png` shows continuous restrained blue water rather than historical cyan washboard stripes. It remains a mostly uniform ribbon with limited shoreline transition, specular detail, or environmental reflection. |
| Atmosphere / night | 3 | `26-standalone-night-final.png` preserves the blue-violet star vista and warm windows while the valley and river are now more readable than in `05-night-far-light.png`. The night sky is successful, but the ground still feels dim and empty, and the tiny flat window panels do not convincingly illuminate the cottage or landscape. |
| Functional integrity | 4 | The earlier source/standalone runtime review exercised views, settings-panel opening, a setting change, and tour start/stop without surfaced page/console errors; live FPS was 60. The integration report also records final standalone smoke/build/test results. This is functional evidence, **not** a benchmark or visual-quality substitute. |

No scored major visual category remains at 2 or below. Composition, lighting/depth, architecture/contact, water, and night remain modest (3/5), and further art work is warranted; the specific vegetation placeholder blocker is cleared enough to recommend user visual review.

## Final standalone capture re-review

Reviewed the second-loop standalone images directly at 1440×900: `artifacts/visual-v2/integration/23-standalone-riverbend-final.png`, `24-standalone-orchard-final.png`, `25-standalone-aqueduct-final.png`, `26-standalone-night-final.png`, plus `20-ui-restored.png` and `21-narrow-ui-final.png`. This was image-only, not a new browser session or a rerun of functional checks. The path seam is continuous, added trees frame startup, Orchard is denser, and night terrain has more fill. The second-loop Orchard still looked like ball clusters and justified a vegetation score of 2 at that point.

### Latest vegetation correction (supersedes earlier vegetation score)

Reviewed `27-vegetation-shell-riverbend.png` / `28-vegetation-shell-orchard.png` as the first iteration, then `29-canopy-iteration2-riverbend.png` / `30-canopy-iteration2-orchard.png`. The latest built-standalone views `33-canopy-reviewed-riverbend.png` / `34-canopy-reviewed-orchard.png` are the deciding evidence, and confirm more coherent irregular crowns, visible branch accents, denser orchard/foreground planting, and additional profile refinement. I maintain vegetation at 3 and READY FOR USER VISUAL REVIEW. The forms remain stylized/faceted and some conifers remain cone-like. A large rock visibly occupied the path in `29`, but that obstruction is absent from the center path in the latest `33` frame; this resolves the apparent exception in the reviewed image. The foreground still contains broad smooth ground and the hero cottage remains blocky. `25` continues to show a connected but repetitive aqueduct, while `26` retains a legible starfield and readable-enough valley at night. `20` shows the interface restored; `21` shows the narrow view.

## Fresh browser evidence (first review)

Built standalone: `dist/stillwater.html`; served by this review on owned port 4185. I also opened the source app at `/`. An isolated named `agent-browser --webgpu` session ran at 1440×900; narrow UI was checked at 390×844. `agent-browser doctor --webgpu --quick` confirmed WebGPU rendering and its adapter probe reported Apple Metal 3. In-page `navigator.gpu` was true. Browser `errors` and `console` returned no entries after source/standalone navigation and scene interactions; `window.stillwater.getState()` had no render error. A settings interaction exposed the panel and its nine inputs. Tour state changed to `touring:true` and stopped to `false`. Live reported FPS was 60, not benchmarked.

- `artifacts/visual-v2/review/01-riverbend-startup-clean.png` — standalone startup/Riverbend, UI hidden for art inspection.
- `artifacts/visual-v2/review/02-hearthside-cottage-trees.png` — standalone close Hearthside/cottage frame.
- `artifacts/visual-v2/review/03-orchard.png` — standalone orchard.
- `artifacts/visual-v2/review/04-aqueduct.png` — standalone aqueduct.
- `artifacts/visual-v2/review/05-night-far-light.png` — standalone Starlight/Far Light.
- `artifacts/visual-v2/review/06-ui-restored.png` — standalone Riverbend with interface restored.
- `artifacts/visual-v2/review/07-narrow-ui.png` — standalone 390×844 layout.
- `artifacts/visual-v2/review/08-source-riverbend.png` — source app Riverbend.

The clean captures hide only the DOM interface, not scene content. The scene is procedural: the standalone has a single rendered canvas, zero `<img>` elements, and no external runtime script source; it did not use a raster backdrop. Baseline comparisons were directly opened: `artifacts/final-qa/02-riverbend.png`, `04-night-space.png`, and `10-final-standalone-aqueduct.png`.

## Highest-value next fixes

1. **Continue refining vegetation rather than replacing it wholesale.** Preserve the newer connected crowns/branch structure, but improve species variation and soften faceting; keep hero foreground planting composed rather than incidental.
2. **Give the startup foreground a more designed surface.** The path is continuous, but broad plain turf remains; add readable terrain/riverbank transitions without obscuring the cottage/bridge sightline.
3. **Refine landmark material/form.** Add masonry variation and more convincing deck/rail proportions to the connected aqueduct; improve the cottage's planar assembly and contact.
4. **Keep tuning night locally.** The valley is more legible, but the ground is still dark and window emission remains flat.

## Separate functional checks

`npm run build` succeeded and generated the standalone; `npm test` passed 23/23. These are functional/regression checks only and do not alter the visual verdict. Source implementation was not edited for this read-only review; artifacts and this review report are the only review deliverables.
