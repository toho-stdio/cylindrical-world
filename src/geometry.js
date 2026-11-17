import { VERTEX_FLOATS } from './scene-contract.js';

// Compact typed-array accumulator: geometry never expands a boxed Number[] per vertex.
export class MeshBuilder {
  constructor(initialVertices = 16384) {
    const maxFloats = 64 * 1024 * 1024 / Float32Array.BYTES_PER_ELEMENT;
    if (!Number.isInteger(initialVertices) || initialVertices < 1 || initialVertices * VERTEX_FLOATS > maxFloats) throw new RangeError('Invalid initial world mesh capacity');
    this.data = new Float32Array(initialVertices * VERTEX_FLOATS);
    this.length = 0;
    this.triangleCount = 0;
  }
  reserve(vertices) {
    const needed = this.length + vertices * VERTEX_FLOATS;
    if (needed <= this.data.length) return;
    const maxFloats = 64 * 1024 * 1024 / Float32Array.BYTES_PER_ELEMENT;
    if (needed > maxFloats) throw new RangeError('World mesh exceeded 64 MiB vertex budget');
    let size = this.data.length;
    while (size < needed) size = Math.min(size * 2, maxFloats);
    const next = new Float32Array(size);
    next.set(this.data.subarray(0, this.length));
    this.data = next;
  }
  vertex(position, normal, color, material, wind = 0, phase = 0) {
    this.reserve(1);
    const i = this.length;
    this.data.set(position, i);
    this.data.set(normalize(normal), i + 3);
    this.data.set(color, i + 6);
    this.data[i + 9] = material;
    this.data[i + 10] = wind;
    this.data[i + 11] = phase;
    this.length += VERTEX_FLOATS;
  }
  tri(a, b, c, color, material, options = {}) {
    const normal = options.normal || crossNormal(a, b, c);
    const normals = options.normals || [normal, normal, normal];
    const wind = options.wind || 0;
    const phase = options.phase || 0;
    const colors = options.colors || [color, color, color];
    this.vertex(a, normals[0], colors[0], material, wind, phase);
    this.vertex(b, normals[1], colors[1], material, wind, phase);
    this.vertex(c, normals[2], colors[2], material, wind, phase);
    this.triangleCount++;
  }
  quad(a, b, c, d, color, material, options = {}) {
    const n = options.normals, colors = options.colors;
    this.tri(a, b, c, color, material, { ...options, ...(n ? { normals: [n[0], n[1], n[2]] } : {}), ...(colors ? { colors: [colors[0], colors[1], colors[2]] } : {}) });
    this.tri(a, c, d, color, material, { ...options, ...(n ? { normals: [n[0], n[2], n[3]] } : {}), ...(colors ? { colors: [colors[0], colors[2], colors[3]] } : {}) });
  }
  finish() { return this.data.slice(0, this.length); }
}

export function normalize(v) {
  const m = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / m, v[1] / m, v[2] / m];
}
export function crossNormal(a, b, c) {
  return normalize([(b[1]-a[1])*(c[2]-a[2])-(b[2]-a[2])*(c[1]-a[1]), (b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]), (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])]);
}
export function mixColor(a, b, t) { return a.map((v, i) => v * (1 - t) + b[i] * t); }
