# Cinematic direction pass

## Art direction

The camera and composition are authored in `src/art-direction.js` and consumed by `src/experience.js`. Opening state deliberately begins in the inhabited riverbend, not at the far axial void: axial position `x=-182`, circumferential angle `theta=0.08`, surface clearance `4.5`, tangent yaw `-0.10` (a slight flank approach toward the cottage while retaining the river axis), and pitch `-0.10` (toward ground; reduced slightly in the integration pass to limit foreground dominance). The scenic lens is `0.91` radians (~52°), passed as optional `camera.fov`; the renderer falls back to π/3 when absent. This is intended to make the first image read as foreground-to-distance landscape while retaining enough width to see river and curved habitat.

The six public indices remain unchanged:

| Index | View | Camera (`x`, `theta`, yaw, clearance, pitch) | Framing intent |
| --- | --- | --- | --- |
| 0 | Riverbend | `(-182, .08, -.10, 4.5, -.10)` | Detailed near-bank opening, river/bridge beyond, inhabited curved distance |
| 1 | Orchard | `(62, .48, .55, 5.5, -.08)` | Follow the curved orchard row at x≈79–111, theta≈.56–.8 |
| 2 | Old aqueduct | `(-40, .15, .02, 7, -.10)` | Approach facing +x from 62 m out, showing the arch profile and river landscape beyond |
| 3 | High meadow | `(92, .10, -.18, 5.5, -.15)` | Meadow folds and open landscape, with ground in view |
| 4 | Hearthside | `(-176, .08, -.12, 2.5, -.10)` | Close, near-eye approach to the cottage's +theta glazed porch side |
| 5 | The far light | `(145, -.10, .02, 6, -.12)` | Axial dusk/night transition, with nearby cottage windows and river in frame |

The guided itinerary follows axial order `0 → 4 → 2 → 1 → 3 → 5`, then eases back along the same scenic corridor. This keeps the relocated orchard viewpoint on a continuous route rather than sending the tour on a long cross-ring sprint. Each leg takes 16 seconds; position, yaw, radial clearance, and pitch interpolate smoothly. This places the near-home portrait before the aqueduct rather than mislabeling a distant aqueduct shot as the cottage. The route uses each viewpoint's shared scene data/caption and keeps indices 0–5 stable. The integration pass subsequently moved Far Light from x=180 to x=145, theta=-.10 to retain the open-end sky while framing the existing x=160 cottage; see [VISUAL_INTEGRATION.md](VISUAL_INTEGRATION.md).

Opening coordinates align with the environment pass's layout: the hero cottage is at `x=-163, theta=.03` (about 19 m downrange and 7 m circumferentially from the camera), reeds/flowers span `x≈-159…-174` (8–28 m ahead), the bridge sits at `x=-140` (~42 m ahead), and the main aqueduct is at `x=22`. Blossom trees at `theta≈±.3` make a lateral curved backdrop rather than an immediate sightline obstruction. These near objects stay inside the renderer's requested ~35 m camera-focused shadow region. The fixed sunlight source `[-236,0,0]` is behind the opening camera, not an on-screen foreground disk. Final visual framing still requires rendered-image review after the environment and renderer are integrated.

## Presentation changes

- The six-view list starts collapsed behind a small `Views` control, rather than a persistent opaque left-side panel.
- A compact post-entry toolbar keeps Explore, Guided tour, `data-sound`, Settings, and Hide UI reachable. Settings and sound remain directly accessible; capture mode does not remove or replace their APIs/selectors.
- `Hide UI` and keyboard `H` enter a clean camera-capture presentation. A small `Show interface (H)` affordance remains discoverable; Escape also restores the interface. Focus is returned/blurred deliberately when hiding a focused control, and the existing visible focus ring remains.
- The entry card is reduced and moved to the lower-left edge to leave more of the habitat visible. No vignette bars, fake scene backdrop, or screenshot-only presentation were added.

The tuned daylight defaults are `sun=.68`, `exposure=.96`, `saturation=1.08` (with atmosphere `.62`); the graphics owner reports this combination retains light while avoiding maxed midday and separating green/teal materials. Golden Hour is `.76/.97/1.08`; Morning Mist lowers exposure to `.92` and saturation to `.82`. `window.stillwater`, settings/preset APIs, mode/audio controls, `data-enter`, `data-sound`, viewpoint indices, and keyboard movement behavior are not renamed. Default flight clearance is 4.5 m, retaining >0.5 m of Q-descend margin. State position remains real world XYZ.

## Verification and readiness

- `node --check src/experience.js`, `src/art-direction.js`, and `src/ui.js`: passed.
- Latest `npm run build`: passed; generated standalone bundle is 73 KiB. Latest full `npm test`: passed, 23/23, including authored camera contract, movement basis and Q/E direction, XYZ/clearance, focus/lifecycle, GPU ABI, bounded aqueduct, generator cap, and world constraints. These were rerun after environment-art's final cottage boulder site-filter adjustment.
- Source app was entered and rendered in the native WebGPU 1440×900 session at `http://localhost:4183`. Post-filter Riverbend UI and clean frames are `artifacts/visual-v2/cinematic/17-riverbend-final-ui-rock-cleared.png` and `18-riverbend-final-clean-rock-cleared.png`; the porch/door boulder is now cleared, facade/river/reeds/bridge stay in frame. Close Hearthside portrait after that change is `19-hearthside-final-rock-cleared.png`.
- The integrated final-scene camera set also includes `12-orchard-final-clean.png`, `14-aqueduct-final-clean.png`, `15-far-light-final-clean.png`, and `16-high-meadow-final-clean.png`. The Orchard reads planted rows with more species/crown variation and foreground flowers, though crowns are still deliberately low-poly and rounded. The -40 Aqueduct profile reads as a connected deck/piers/arch with river continuing through its opening; Far Light retains river/horizon silhouette under visible stars; High Meadow is a late-twilight composition. Graphics-lighting independently captured star-tuned Far Light at `artifacts/visual-v2/graphics/14-far-light-clean-star-tuned.png` and confirmed the point field is more legible without an artificial backdrop. Environment-art's post-clearance evidence is in `artifacts/visual-v2/environment/09-riverbend-rock-cleared.png`, `06-riverbend-final.png`, `07-aqueduct-final.png`, and `08-orchard-final.png`.
- The original baseline review (`artifacts/final-qa/02-riverbend.png`, `10-final-standalone-aqueduct.png`) and camera A/B history remain useful context, but the earlier `10`/`11` local Riverbend screenshots predate porch clearance and are superseded by `17`/`18`. `08-aqueduct-x-minus40-clean.png` remains the preferred -40 composition over the cropped underside.
- Presentation controls were exercised in the browser: `data-enter`, compact toolbar/settings, hide UI and the show-interface/Escape path. Settings and sound remain accessible when UI is shown; capture mode leaves a discoverable Show Interface affordance. The scene stays visible with no black bars or fake backdrop. Full tour and narrow-screen visual acceptance are not claimed by this camera pass; test coverage verifies the stable viewpoint indices and movement contract.

### Remaining visual limitations

This is an art-directed pass on a stylized, low-poly habitat, not photorealism. Orchard crowns retain rounded, clustered silhouettes; some meadow compositions are dark at late twilight; distant huts and river details remain small at 1440×900. Current evidence supports readiness for user visual review, not a claim that every environment detail is final or that all screen sizes have been visually accepted.
