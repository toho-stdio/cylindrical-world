// Scenic camera direction for the six public STILLWATER viewpoint indices.
// Positions are cylinder axial x / angular theta / surface clearance. Yaw is
// the local tangent heading (0 faces +x); negative pitch looks toward terrain.
export const CAMERA_FOV = 0.91; // radians, a restrained ~52 degree landscape lens
export const STARTUP_VIEW = Object.freeze({
  x: -182, theta: 0.08, yaw: -0.10, radial: 4.5, pitch: -0.10,
});

export const SCENIC_VIEWS = Object.freeze([
  Object.freeze({ index: 0, name: 'Riverbend', x: -182, theta: 0.08, yaw: -0.10, radial: 4.5, pitch: -0.10,
    caption: 'The river gathers the last light.' }),
  Object.freeze({ index: 1, name: 'Orchard', x: 62, theta: 0.48, yaw: 0.55, radial: 5.5, pitch: -0.08,
    caption: 'An orchard follows the curve overhead.' }),
  Object.freeze({ index: 2, name: 'Old aqueduct', x: -40, theta: 0.15, yaw: 0.02, radial: 7, pitch: -0.10,
    caption: 'Stone arches bridge the inner valley.' }),
  Object.freeze({ index: 3, name: 'High meadow', x: 92, theta: 0.10, yaw: -0.18, radial: 5.5, pitch: -0.15,
    caption: 'High meadow gives way to open country.' }),
  Object.freeze({ index: 4, name: 'Hearthside', x: -176, theta: 0.08, yaw: -0.12, radial: 2.5, pitch: -0.10,
    caption: 'A quiet homestead beneath the turning sky.' }),
  Object.freeze({ index: 5, name: 'The far light', x: 145, theta: -0.10, yaw: 0.02, radial: 6, pitch: -0.12,
    caption: 'At the far light, day becomes night.' }),
]);

// The guided route visits every scenic index in axial order, then returns along
// the same corridor so the loop never teleports across the habitat.
export const TOUR_ROUTE = Object.freeze([0, 4, 2, 1, 3, 5].map(index => SCENIC_VIEWS[index]));
export const TOUR_LEG_SECONDS = 16;
export const TOUR_DURATION = TOUR_LEG_SECONDS * (TOUR_ROUTE.length - 1) * 2;
