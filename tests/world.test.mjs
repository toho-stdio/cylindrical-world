import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, WORLD, terrainHeight, daylightAt } from '../src/world.js';
import { VERTEX_FLOATS, VERTEX_STRIDE, MATERIAL } from '../src/scene-contract.js';
import { MeshBuilder } from '../src/geometry.js';
import { cylindricalPoint, length } from '../src/math.js';
import { defs, presetValues, normalizeParam } from '../src/experience.js';

test('mesh builder rejects an over-budget request immediately', () => {
  const builder = new MeshBuilder(1);
  assert.throws(() => builder.reserve(64 * 1024 * 1024), /64 MiB/);
});

test('quad vertex tints interpolate through the unchanged 12-float ABI', () => {
  const builder = new MeshBuilder(4), colors = [[1,0,0],[0,1,0],[0,0,1],[1,1,1]];
  builder.quad([0,0,0],[1,0,0],[1,1,0],[0,1,0],[.5,.5,.5],MATERIAL.TERRAIN,{colors});
  const vertices=builder.finish();
  assert.deepEqual(Array.from(vertices.slice(6,9)),colors[0]);
  assert.deepEqual(Array.from(vertices.slice(18,21)),colors[1]);
  assert.deepEqual(Array.from(vertices.slice(30,33)),colors[2]);
  assert.deepEqual(Array.from(vertices.slice(42,45)),colors[0]);
});

test('world generation is deterministic for the published seed', { timeout: 10000 }, () => {
  const a = createWorld(), b = createWorld();
  assert.equal(a.seed, WORLD.seed);
  assert.equal(a.lights.length, 8);
  for (const light of a.lights) {
    assert.equal(light.position.length, 3);
    assert.ok(light.position.every(Number.isFinite));
    assert.ok(light.color.every(Number.isFinite));
    assert.ok(light.intensity > 0 && light.radius > 0);
  }
  assert.equal(a.vertices.length, b.vertices.length);
  assert.deepEqual(a.vertices, b.vertices);
  assert.ok(a.vertices.length > 100_000);
  assert.equal(a.vertices.length % VERTEX_FLOATS, 0);
  assert.equal(a.vertices.byteLength, a.vertexCount * VERTEX_STRIDE);
  assert.equal(a.triangleCount, a.vertexCount / 3);
});

test('cottage light sources sit in front of their lamp and glazing normals', () => {
  const world = createWorld(), vertices = world.vertices;
  const nearestSurfaceVertex = (position, material) => {
    let nearest = null, best = Infinity;
    for (let i = 0; i < vertices.length; i += VERTEX_FLOATS) {
      if (vertices[i + 9] !== material) continue;
      const dx=vertices[i]-position[0],dy=vertices[i+1]-position[1],dz=vertices[i+2]-position[2],d2=dx*dx+dy*dy+dz*dz;
      if (d2 < best) { best=d2; nearest=i; }
    }
    assert.ok(nearest !== null, `material ${material} has a fixture vertex`);
    return nearest;
  };
  for (let i = 0; i < world.lights.length; i += 2) {
    for (const [lightIndex, material] of [[i,MATERIAL.EMISSIVE],[i+1,MATERIAL.GLASS]]) {
      const light = world.lights[lightIndex], vertex = nearestSurfaceVertex(light.position, material);
      const delta=light.position.map((value,k)=>value-vertices[vertex+k]);
      const distance=Math.hypot(...delta);
      const facing=(vertices[vertex+3]*delta[0]+vertices[vertex+4]*delta[1]+vertices[vertex+5]*delta[2])/distance;
      assert.ok(facing > .5, `light ${lightIndex} must be on the visible side of material ${material} (normal dot ${facing.toFixed(3)})`);
    }
  }
});

test('terrain stays smooth, finite and within walking-height envelope', () => {
  let min = Infinity, max = -Infinity;
  for (let i = -240; i <= 240; i += 1) for (let j = 0; j <= 64; j += 1) {
    const theta = -Math.PI + j * Math.PI * 2 / 64;
    const h = terrainHeight(i, theta);
    assert.ok(Number.isFinite(h)); min = Math.min(min, h); max = Math.max(max, h);
    assert.ok(Math.abs(h - terrainHeight(i + .01, theta)) < .08);
  }
  assert.ok(min > -5 && max < 5, `height range ${min.toFixed(2)}..${max.toFixed(2)}`);
});

test('generated landscape geometry is finite and bounded in memory', { timeout: 10000 }, () => {
  const world = createWorld();
  assert.ok(world.vertices.byteLength < 64 * 1024 * 1024, `mesh uses ${world.vertices.byteLength} bytes`);
  const seenMaterials = new Set();
  for (let i = 0; i < world.vertices.length; i += VERTEX_FLOATS) {
    for (let k = 0; k < VERTEX_FLOATS; k++) assert.ok(Number.isFinite(world.vertices[i + k]), `finite vertex field ${i + k}`);
    const normalLength = Math.hypot(world.vertices[i+3], world.vertices[i+4], world.vertices[i+5]);
    assert.ok(normalLength > .985 && normalLength < 1.015, `unit normal ${normalLength}`);
    const material = world.vertices[i+9];
    assert.ok(Number.isInteger(material) && material >= MATERIAL.TERRAIN && material <= MATERIAL.GRASS);
    seenMaterials.add(material);
    assert.ok(world.vertices[i+10] >= 0 && world.vertices[i+10] <= 1, 'wind weight in [0,1]');
    assert.ok(world.vertices[i+11] >= 0 && world.vertices[i+11] <= 1, 'stable phase in [0,1]');
  }
  for (const required of [MATERIAL.TERRAIN,MATERIAL.WOOD,MATERIAL.LEAF,MATERIAL.STONE,MATERIAL.ROOF,MATERIAL.WATER,MATERIAL.GLASS,MATERIAL.EMISSIVE,MATERIAL.FLOWER,MATERIAL.PATH,MATERIAL.GRASS]) assert.ok(seenMaterials.has(required), `material ${required} is present`);
});

test('terrain is continuous at the cylindrical seam and daylight is bounded', () => {
  for (const x of [-240, -130, 0, 117, 239]) {
    assert.ok(Math.abs(terrainHeight(x, -Math.PI) - terrainHeight(x, Math.PI)) < 1e-8);
  }
  for (const x of [-1000, -240, 0, 240, 1000]) assert.ok(daylightAt(x) >= 0 && daylightAt(x) <= 1);
  assert.equal(daylightAt(-1000), 1);
  assert.equal(daylightAt(1000), 0);
});

test('cylindrical mapping preserves axial coordinate and radius', () => {
  for (const angle of [-Math.PI, -1.2, 0, Math.PI / 2, Math.PI]) {
    const p = cylindricalPoint(12.5, angle, WORLD.radius);
    assert.equal(p[0], 12.5);
    assert.ok(Math.abs(length(p.slice(1)) - WORLD.radius) < 1e-10);
  }
});

test('settings normalization enforces API bounds and rejects invalid quality', () => {
  for (const def of defs.filter(item => item.type === 'range')) {
    assert.equal(normalizeParam(def.key, -100), def.min);
    assert.equal(normalizeParam(def.key, 100), def.max);
  }
  assert.equal(normalizeParam('audio', 0), false);
  assert.equal(normalizeParam('audio', 'yes'), true);
  assert.equal(normalizeParam('quality', 'medium'), 'medium');
  assert.equal(normalizeParam('quality', 'ultra'), undefined);
  assert.equal(normalizeParam('not-a-setting', 4), undefined);
  assert.deepEqual(Object.keys(presetValues), ['Golden Hour', 'Morning Mist', 'Starlight', 'Storybook', 'Monochrome']);
});
