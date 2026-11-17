import test from 'node:test';
import assert from 'node:assert/strict';
import {WORLD,terrainHeight,daylightAt} from '../src/world.js';
import {cameraPosition,EYE_HEIGHT,movementBasis,cylinderTangentStep,radialStep,controlsIgnoreTarget,shouldClearKeysOnLifecycle} from '../src/experience.js';
import {CAMERA_FOV,STARTUP_VIEW,SCENIC_VIEWS,TOUR_ROUTE} from '../src/art-direction.js';

const close=(actual,expected,epsilon=1e-9)=>assert.ok(Math.abs(actual-expected)<epsilon,`${actual} != ${expected}`);

test('cinematic opening and six scenic stops keep stable indices and grounded flight clearance',()=>{
  assert.ok(CAMERA_FOV > .8 && CAMERA_FOV < 1, 'scenic field of view should stay restrained');
  assert.equal(STARTUP_VIEW.x,-182);
  assert.equal(SCENIC_VIEWS[0].x,STARTUP_VIEW.x);
  assert.equal(STARTUP_VIEW.theta,.08);
  assert.equal(STARTUP_VIEW.yaw,-.1);
  assert.equal(STARTUP_VIEW.radial,4.5);
  assert.ok(STARTUP_VIEW.radial >= 4, 'opening view must retain the real Q-descend margin');
  assert.deepEqual(SCENIC_VIEWS.map(shot=>shot.index),[0,1,2,3,4,5]);
  assert.deepEqual(TOUR_ROUTE.map(shot=>shot.index),[0,4,2,1,3,5]);
  for(const shot of SCENIC_VIEWS) {
    assert.ok(shot.x > -WORLD.length/2+8 && shot.x < WORLD.length/2-8);
    assert.ok(shot.radial >= EYE_HEIGHT && shot.radial <= 32);
    for(const value of [shot.x,shot.theta,shot.yaw,shot.radial,shot.pitch]) assert.ok(Number.isFinite(value));
  }
});

test('forward and strafe form a correct tangent basis at cardinal headings',()=>{
  for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]){
    const {forward,right}=movementBasis(yaw);
    close(Math.hypot(...forward),1);close(Math.hypot(...right),1);close(forward[0]*right[0]+forward[1]*right[1],0);
  }
  close(movementBasis(0).forward[0],1);close(movementBasis(0).right[1],-1);
  close(movementBasis(Math.PI/2).forward[1],1);close(movementBasis(Math.PI/2).right[0],1);
});

test('circumferential movement remains tangent at cardinal cylinder angles',()=>{
  for(const theta of [0,Math.PI/2,Math.PI,-Math.PI/2]){
    const {delta,dTheta}=cylinderTangentStep(theta,0,1,2);
    close(Math.hypot(...delta.slice(1)),2);
    close(delta[1]*Math.cos(theta)+delta[2]*Math.sin(theta),0);
    close(dTheta,2/WORLD.radius);
  }
  const axial=cylinderTangentStep(Math.PI/2,1,0,3);
  close(axial.delta[0],3);close(axial.delta[1],0);close(axial.delta[2],0);
});

test('Q descends toward terrain and E ascends toward the axis in flight',()=>{
  const start=8,step=2;
  assert.equal(radialStep(start,{q:true,speed:step}),start-step);
  assert.equal(radialStep(start,{e:true,speed:step}),start+step);
  assert.equal(radialStep(start,{mode:'walk',q:true,speed:step}),EYE_HEIGHT);
  assert.equal(radialStep(1,{q:true,speed:step}),EYE_HEIGHT);
  assert.equal(radialStep(40,{e:true,speed:step}),32);
  for(const theta of [0,Math.PI/2,Math.PI,-Math.PI/2]) {
    const radius = offset => Math.hypot(...cameraPosition(0,theta,offset).slice(1));
    assert.ok(radius(radialStep(start,{q:true,speed:step})) > radius(start), 'Q moves outward toward the terrain');
    assert.ok(radius(radialStep(start,{e:true,speed:step})) < radius(start), 'E moves inward toward the axis');
  }
});

test('walking camera follows h(x,theta) with eye-height clearance for all cardinal angles',()=>{
  for(const x of [-220,-45,0,123,220])for(const theta of [0,Math.PI/2,Math.PI,-Math.PI/2]){
    const p=cameraPosition(x,theta,EYE_HEIGHT),radius=Math.hypot(p[1],p[2]);
    close(WORLD.radius-terrainHeight(x,theta)-radius,EYE_HEIGHT);
    assert.ok(p.every(Number.isFinite));assert.ok(radius>0&&radius<WORLD.radius+4);
  }
});

test('flight camera remains finite and inside the shell; progress follows daylight convention',()=>{
  for(const x of [-232,-100,0,100,232])for(const theta of [-Math.PI,0,Math.PI/2,Math.PI]){
    const p=cameraPosition(x,theta,10);assert.ok(p.every(Number.isFinite));
    assert.ok(Math.hypot(p[1],p[2])<WORLD.radius);
  }
  assert.equal(daylightAt(-220),1);assert.equal(daylightAt(240),0);
});

test('interactive UI focus is excluded from world keyboard controls',()=>{
  const matches=new Set(['input,select,textarea,button,[contenteditable="true"],[role="dialog"],.settings-panel,.keys-panel']);
  const control={closest:s=>matches.has(s)};
  assert.equal(controlsIgnoreTarget(control),true);
  assert.equal(controlsIgnoreTarget({closest:()=>null}),false);
  assert.equal(controlsIgnoreTarget(null),false);
  assert.equal(shouldClearKeysOnLifecycle('focusin',{target:control}),true);
  assert.equal(shouldClearKeysOnLifecycle('focusin',{target:{closest:()=>null}}),false);
});

test('key lifecycle releases held controls on blur, hidden tab, and pointer-lock exit',()=>{
  assert.equal(shouldClearKeysOnLifecycle('blur'),true);
  assert.equal(shouldClearKeysOnLifecycle('visibilitychange',{hidden:true}),true);
  assert.equal(shouldClearKeysOnLifecycle('visibilitychange',{hidden:false}),false);
  assert.equal(shouldClearKeysOnLifecycle('pointerlockchange',{pointerLocked:false}),true);
  assert.equal(shouldClearKeysOnLifecycle('pointerlockchange',{pointerLocked:true}),false);
});
