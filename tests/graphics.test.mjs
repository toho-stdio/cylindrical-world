import test from 'node:test';
import assert from 'node:assert/strict';
import {VERTEX_FLOATS,VERTEX_STRIDE,VERTEX_ATTRIBUTES,MATERIAL,SUN} from '../src/scene-contract.js';
import {worldShader} from '../src/shaders/world.js';
import {readFile} from 'node:fs/promises';

test('GPU vertex ABI is the shared 48-byte normal/material/wind contract',()=>{
 assert.equal(VERTEX_FLOATS,12);assert.equal(VERTEX_STRIDE,48);
 assert.deepEqual(VERTEX_ATTRIBUTES.map(a=>[a.shaderLocation,a.offset,a.format]),[
  [0,0,'float32x3'],[1,12,'float32x3'],[2,24,'float32x3'],[3,36,'float32'],[4,40,'float32'],[5,44,'float32']
 ]);
 assert.deepEqual(Object.values(MATERIAL),Array.from({length:13},(_,i)=>i));
 assert.deepEqual(SUN,{position:[-236,0,0],radius:13});
});

test('renderer uses explicit material attributes, shadow PCF and linear HDR post path',async()=>{
 const renderer=await readFile(new URL('../src/renderer.js',import.meta.url),'utf8');
 for(const token of ['VERTEX_STRIDE','VERTEX_ATTRIBUTES','world.vertices.byteLength%VERTEX_STRIDE','world.vertices.length/VERTEX_FLOATS','shadowPassLayout','shadowPassPipelineLayout','shadowBind','binding:5','captureFirstFrame','pushErrorScope','popErrorScope','uncapturederror','shadowEncoder.finish()','depth32float','rgba16float','pointLightBuffer','world.lights','slice(0,8)','Number.isFinite','clamp(values[0],-400,400)','clamp(values[1],-200,200)','clamp(values[2],-200,200)','clamp(values[3],.1,25)','clamp(values[7],0,20)','lightCount++','setQuality','destroy()'])assert.ok(renderer.includes(token),`renderer missing ${token}`);
 for(const token of ['texture_depth_2d','textureSampleCompare'])assert.ok(worldShader.includes(token),`shader missing ${token}`);
 for(const entry of ['vertexMain','shadowVertex','backgroundFragment','fragmentMain','postFragment'])assert.ok(worldShader.includes(`fn ${entry}`),`shader entrypoint ${entry} missing`);
 for(const token of ['textureSampleCompare','shadowFactor','sunScreen','fresnel','starTint','aces','display-linear','PointLightBuffer','pointLightCount','positionRadius','distanceToLight','normalizedDistance','range*range/(1.0+distanceToLight*distanceToLight*.012)','dot(n,direction)','nightBoost','paneNoise'])assert.ok(worldShader.includes(token),`shader path ${token} missing`);
});
