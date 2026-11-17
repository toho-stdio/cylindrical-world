// Shared CPU/GPU interface for the visual-quality pass. Do not infer materials
// from RGB; geometry emits explicit tags and renderer handles them deliberately.
export const VERTEX_FLOATS = 12;
export const VERTEX_STRIDE = VERTEX_FLOATS * Float32Array.BYTES_PER_ELEMENT;
export const VERTEX_ATTRIBUTES = Object.freeze([
  { shaderLocation: 0, offset: 0, format: 'float32x3' }, // world position
  { shaderLocation: 1, offset: 12, format: 'float32x3' }, // world normal
  { shaderLocation: 2, offset: 24, format: 'float32x3' }, // linear base color
  { shaderLocation: 3, offset: 36, format: 'float32' }, // material tag
  { shaderLocation: 4, offset: 40, format: 'float32' }, // wind animation weight, 0..1
  { shaderLocation: 5, offset: 44, format: 'float32' }, // stable phase/variation, 0..1
]);
export const MATERIAL = Object.freeze({
  TERRAIN: 0,
  WOOD: 1,
  LEAF: 2,
  STONE: 3,
  ROOF: 4,
  WATER: 5,
  GLASS: 6,
  EMISSIVE: 7,
  FLOWER: 8,
  STAR: 9,
  METAL: 10,
  PATH: 11,
  GRASS: 12,
});
export const SUN = Object.freeze({ position: Object.freeze([-236, 0, 0]), radius: 13 });
