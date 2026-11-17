import test from 'node:test';
import assert from 'node:assert/strict';
import { AQUEDUCT, WORLD, createWorld } from '../src/world.js';

test('Ring Aqueduct exposes three bounded arch openings and a slender deck', { timeout: 10000 }, () => {
  const { landmarks, vertices, vertexCount } = createWorld();
  const aqueduct = landmarks.find(({ name }) => name === 'The Ring Aqueduct');
  assert.ok(aqueduct, 'aqueduct landmark is generated');
  assert.equal(aqueduct.x, AQUEDUCT.x);
  assert.equal(aqueduct.arches, 3);
  assert.ok(aqueduct.openingWidth > 25 && aqueduct.openingWidth < 40,
    `clear opening width is ${aqueduct.openingWidth.toFixed(1)}m`);
  assert.ok(aqueduct.span < 1.1, 'aqueduct remains a localized crossing');
  assert.ok(aqueduct.crownInset < aqueduct.deckInset,
    'arch crown sits below the deck in the radial cross-section');
  assert.ok(vertices instanceof Float32Array);
  assert.equal(vertices.length % 12, 0, 'mesh obeys 12-float ABI');
  assert.ok(vertices.byteLength < 64 * 1024 * 1024, `generated mesh is ${vertices.byteLength} bytes`);
  assert.equal(vertices.length / 12, vertexCount);
  assert.ok(aqueduct.grounded, 'piers and abutments are grounded');
  const center=.03+Math.sin(AQUEDUCT.x*.016)*.105+Math.sin(AQUEDUCT.x*.047+1.2)*.025;
  const pierCenters=Array.from({length:AQUEDUCT.archCount+1},(_,i)=>center-AQUEDUCT.span/2+i*AQUEDUCT.span/AQUEDUCT.archCount);
  const pierHits=new Array(pierCenters.length).fill(0);
  for(let i=0;i<vertices.length;i+=12){
    assert.ok(Number.isFinite(vertices[i])&&Number.isFinite(vertices[i+1])&&Number.isFinite(vertices[i+2]));
    if(vertices[i+9]!==3||Math.abs(vertices[i]-AQUEDUCT.x)>2.8)continue;
    const theta=Math.atan2(vertices[i+2],vertices[i+1]);
    pierCenters.forEach((t,index)=>{const delta=Math.atan2(Math.sin(theta-t),Math.cos(theta-t));if(Math.abs(delta)<.035)pierHits[index]++;});
  }
  assert.ok(pierHits.every(count=>count>=30),`full-width piers reach the deck at each footing: ${pierHits}`);
  for (const value of vertices) assert.ok(Number.isFinite(value));
  assert.ok(WORLD.radius - aqueduct.deckInset > 0);
});
