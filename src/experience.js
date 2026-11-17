import {createRenderer} from './renderer.js';
import {WORLD,terrainHeight,daylightAt} from './world.js';
import {clamp,normalize,add,scale,cross,wrapAngle} from './math.js';
import {CAMERA_FOV,SCENIC_VIEWS,TOUR_ROUTE,TOUR_LEG_SECONDS,TOUR_DURATION,STARTUP_VIEW} from './art-direction.js';

const defaults={sun:.68,atmosphere:.62,exposure:.96,saturation:1.08,wind:.48,water:.7,foliage:.8,stars:.56,audio:false,quality:'high'};
export const defs=[
 {key:'sun',label:'Sunlight',min:0,max:1,step:.01,type:'range'},
 {key:'atmosphere',label:'Atmosphere',min:0,max:1,step:.01,type:'range'},
 {key:'exposure',label:'Exposure',min:.5,max:1.7,step:.01,type:'range'},
 {key:'saturation',label:'Saturation',min:0,max:1.5,step:.01,type:'range'},
 {key:'wind',label:'Wind',min:0,max:1,step:.01,type:'range'},
 {key:'water',label:'Water',min:0,max:1,step:.01,type:'range'},
 {key:'foliage',label:'Foliage',min:0,max:1,step:.01,type:'range'},
 {key:'stars',label:'Stars',min:0,max:1,step:.01,type:'range'},
 {key:'audio',label:'Ambient sound',type:'checkbox'},
 {key:'quality',label:'Quality',type:'select',options:['low','medium','high']}
];
export const presetValues={
 'Golden Hour':{sun:.76,atmosphere:.65,exposure:.97,saturation:1.08,stars:.4},
 'Morning Mist':{sun:.55,atmosphere:.9,exposure:.92,saturation:.82,stars:.25},
 'Starlight':{sun:.12,atmosphere:.3,exposure:.82,saturation:.82,stars:1},
 'Storybook':{sun:.76,atmosphere:.76,exposure:1,saturation:1.18,foliage:1},
 'Monochrome':{sun:.68,atmosphere:.55,exposure:1,saturation:0,stars:.5}
};
export const EYE_HEIGHT=1.7;
export function normalizeParam(key,value){
 if(!(key in defaults))return undefined;
 const d=defs.find(v=>v.key===key);
 if(d?.type==='range'){const n=Number(value);return clamp(Number.isFinite(n)?n:defaults[key],d.min,d.max)}
 if(key==='quality')return ['low','medium','high'].includes(value)?value:undefined;
 if(key==='audio')return !!value;
 return value;
}

// Tangent-plane movement in [axial, circumferential] coordinates. Positive
// circumferential displacement follows increasing theta around the cylinder.
export function movementBasis(yaw){return {forward:[Math.cos(yaw),Math.sin(yaw)],right:[Math.sin(yaw),-Math.cos(yaw)]}}
export function cylinderTangentStep(theta,axial,circumferential,distance){return {dx:axial*distance,dTheta:circumferential*distance/WORLD.radius,delta:[axial*distance,-Math.sin(theta)*circumferential*distance,Math.cos(theta)*circumferential*distance]}}
export function cameraPosition(x,theta,radialOffset){
 const offset=modeSafeOffset(radialOffset),radius=WORLD.radius-terrainHeight(x,theta)-offset;
 return [x,Math.cos(theta)*radius,Math.sin(theta)*radius];
}
function modeSafeOffset(value){return clamp(Number.isFinite(value)?value:EYE_HEIGHT,EYE_HEIGHT,32)}
export function radialStep(offset,{mode='fly',q=false,e=false,forward=0,pitch=0,speed=0}={}){if(mode==='walk')return EYE_HEIGHT;return clamp(offset-(q?speed:0)+(e?speed:0)+Math.sin(pitch)*forward*speed,EYE_HEIGHT,32)}
export function positionForState(x,theta,radialOffset){return cameraPosition(x,theta,radialOffset)}
export function controlsIgnoreTarget(target){return !!target?.closest?.('input,select,textarea,button,[contenteditable="true"],[role="dialog"],.settings-panel,.keys-panel')}
export function shouldClearKeysOnLifecycle(event,{hidden=false,pointerLocked=false,target=null}={}){return event==='blur'||(event==='visibilitychange'&&hidden)||(event==='pointerlockchange'&&!pointerLocked)||(event==='focusin'&&controlsIgnoreTarget(target))}
export async function createExperience(canvas){
 const renderer=await createRenderer(canvas),params={...defaults};
 let entered=false,mode='fly',touring=false,viewpoint=0,region='The Riverbend',yaw=STARTUP_VIEW.yaw,pitch=STARTUP_VIEW.pitch,angular=STARTUP_VIEW.theta,radial=STARTUP_VIEW.radial,x=STARTUP_VIEW.x;
 let fps=60,raf=0,last=0,lastNotify=0,destroyed=false,keys=new Set(),listeners=new Set(),error, tourElapsed=0;
 const camera=()=>{const position=cameraPosition(x,angular,radial);const localForward=normalize([Math.cos(yaw),-Math.sin(angular)*Math.sin(yaw),Math.cos(angular)*Math.sin(yaw)]);const radialUp=[0,-Math.cos(angular),-Math.sin(angular)];const right=normalize(cross(localForward,radialUp));const up=normalize(cross(right,localForward));const direction=normalize(add(scale(localForward,Math.cos(pitch)),scale(up,Math.sin(pitch))));return {position,target:add(position,direction),up:radialUp,progress:daylightAt(x),fov:CAMERA_FOV}};
 const tourLeg=()=>Math.min(TOUR_ROUTE.length-2,Math.floor(Math.min(tourElapsed,TOUR_DURATION-tourElapsed)/TOUR_LEG_SECONDS));
 const regionName=()=>x>=50&&x<=120&&angular>.32?'The Long Orchard':x<-125?'The Riverbend':x<-60?'The Long Orchard':x<-50?'Willowmere':x<65?'The Ring Aqueduct':x<130?'High Meadow':'The Far Light';
 const state=()=>({ready:true,entered,mode,touring,viewpoint,region:regionName(),fps,position:cameraPosition(x,angular,radial),progress:daylightAt(x),quality:params.quality,...(touring?{caption:TOUR_ROUTE[tourLeg()].caption}:{}),...(error?{error}:{})});
 const notify=()=>{const s=state();for(const fn of listeners)try{fn(s)}catch(e){console.error(e)}};
 const set=(key,value)=>{value=normalizeParam(key,value);if(value===undefined)return;params[key]=value;if(key==='quality')renderer.setQuality(value);notify()};
 const setMany=values=>{for(const [k,v] of Object.entries(values||{}))set(k,v)};
 function preset(name){if(presetValues[name])setMany(presetValues[name])}
 function reset(){setMany(defaults);viewpoint=0;({x,theta:angular,yaw,radial,pitch}=STARTUP_VIEW);touring=false;tourElapsed=0;notify()}
 function enter(){entered=true;notify()}
 function setMode(v){if(v==='fly'||v==='walk'){mode=v;if(mode==='walk'){radial=EYE_HEIGHT;pitch=clamp(pitch,-.8,.8)}else radial=Math.max(radial,EYE_HEIGHT);notify()}}
 function viewpointAt(index){viewpoint=((Math.floor(index)%6)+6)%6;const shot=SCENIC_VIEWS[viewpoint];x=shot.x;angular=shot.theta;yaw=shot.yaw;radial=mode==='walk'?EYE_HEIGHT:shot.radial;pitch=shot.pitch;touring=false;tourElapsed=0;notify()}
 function tour(value){touring=typeof value==='boolean'?value:!touring;if(touring){entered=true;tourElapsed=0;mode='fly';radial=6}notify();return touring}
 const clearKeys=()=>keys.clear();
 const onKeyDown=e=>{if(controlsIgnoreTarget(e.target)){clearKeys();return}const k=e.key.toLowerCase();if(!['w','a','s','d','q','e','shift','g',' '].includes(k))return;if(e.repeat&&(k==='g'||k===' '))return;keys.add(k);if(touring){touring=false;tourElapsed=0;notify()}if(k==='g'){setMode(mode==='fly'?'walk':'fly')}if(k===' '){e.preventDefault();enter()}};
 const onKeyUp=e=>keys.delete(e.key.toLowerCase());const onBlur=()=>{if(shouldClearKeysOnLifecycle('blur'))clearKeys()};const onVisibility=()=>{if(shouldClearKeysOnLifecycle('visibilitychange',{hidden:document.hidden}))clearKeys()};
 const onFocusIn=e=>{if(shouldClearKeysOnLifecycle('focusin',{target:e.target}))clearKeys()};
 const onPointerLock=()=>{if(shouldClearKeysOnLifecycle('pointerlockchange',{pointerLocked:document.pointerLockElement===canvas}))clearKeys()};
 const onMouse=e=>{if(document.pointerLockElement===canvas){if(touring){touring=false;tourElapsed=0}yaw=wrapAngle(yaw-e.movementX*.0022);pitch=clamp(pitch-e.movementY*.0018,-1.1,1.1)}};
 const requestLock=()=>{if(touring){touring=false;tourElapsed=0;notify()}if(!entered||!canvas.requestPointerLock)return;try{const result=canvas.requestPointerLock();if(result?.catch)result.catch(err=>console.warn('Pointer lock unavailable',err))}catch(err){console.warn('Pointer lock unavailable',err)}};
 canvas.addEventListener('click',requestLock);
 document.addEventListener('keydown',onKeyDown);document.addEventListener('keyup',onKeyUp);window.addEventListener('blur',onBlur);document.addEventListener('visibilitychange',onVisibility);document.addEventListener('focusin',onFocusIn);document.addEventListener('pointerlockchange',onPointerLock);document.addEventListener('mousemove',onMouse);
 function tick(now){if(destroyed)return;const dt=Math.min(.05,(now-last)/1000||0);last=now;
  if(touring){tourElapsed=(tourElapsed+dt)%TOUR_DURATION;const routeTime=Math.min(tourElapsed,TOUR_DURATION-tourElapsed),index=tourLeg(),fraction=clamp((routeTime-index*TOUR_LEG_SECONDS)/TOUR_LEG_SECONDS,0,1),eased=fraction*fraction*(3-2*fraction),a=TOUR_ROUTE[index],b=TOUR_ROUTE[index+1];x=a.x+(b.x-a.x)*eased;angular=a.theta+(b.theta-a.theta)*eased;yaw=wrapAngle(a.yaw+wrapAngle(b.yaw-a.yaw)*eased);pitch=a.pitch+(b.pitch-a.pitch)*eased;radial=a.radial+(b.radial-a.radial)*eased}
  if(entered&&!touring){const forward=(keys.has('w')?1:0)-(keys.has('s')?1:0),strafe=(keys.has('d')?1:0)-(keys.has('a')?1:0),speed=(keys.has('shift')?21:11)*dt,basis=movementBasis(yaw);let axial=(basis.forward[0]*forward+basis.right[0]*strafe),circ=(basis.forward[1]*forward+basis.right[1]*strafe);const norm=Math.hypot(axial,circ)||1;axial/=norm;circ/=norm;const planarScale=mode==='fly'?Math.cos(pitch):1,step=cylinderTangentStep(angular,axial,circ,speed*planarScale);x+=step.dx;angular+=step.dTheta;
   radial=radialStep(radial,{mode,q:keys.has('q'),e:keys.has('e'),forward,pitch,speed});
   x=clamp(x,-WORLD.length/2+8,WORLD.length/2-8);angular=wrapAngle(angular);
  }
  const c=camera();if(!error)try{fps=renderer.render(c,params)}catch(e){error=e.message;console.error('STILLWATER render error',e);notify()}
  if(now-lastNotify>200){lastNotify=now;notify()}raf=requestAnimationFrame(tick);
 }
 const api={params,defs,presets:Object.keys(presetValues),get:key=>params[key],set,setMany,preset,reset,enter,setMode,viewpoint:viewpointAt,tour,getState:state,subscribe(fn){listeners.add(fn);fn(state());return()=>listeners.delete(fn)},destroy(){if(destroyed)return;destroyed=true;clearKeys();cancelAnimationFrame(raf);canvas.removeEventListener('click',requestLock);document.removeEventListener('keydown',onKeyDown);document.removeEventListener('keyup',onKeyUp);window.removeEventListener('blur',onBlur);document.removeEventListener('visibilitychange',onVisibility);document.removeEventListener('focusin',onFocusIn);document.removeEventListener('pointerlockchange',onPointerLock);document.removeEventListener('mousemove',onMouse);if(document.pointerLockElement===canvas)document.exitPointerLock();renderer.destroy();listeners.clear()}};
 fps=renderer.render(camera(),params);
 await renderer.device.queue.onSubmittedWorkDone();
 raf=requestAnimationFrame(tick);
 return api;
}
