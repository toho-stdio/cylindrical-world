export const worldShader = String.raw`struct Frame {
  viewProjection: mat4x4<f32>,
  lightViewProjection: mat4x4<f32>,
  params: vec4<f32>,       // daylight, atmosphere, saturation, exposure
  worldParams: vec4<f32>,  // stars, foliage, water, wind
  cameraTime: vec4<f32>,
  sunScreen: vec4<f32>,    // normalized screen position, radius, visibility
  screenSize: vec4<f32>,
  pointLightCount: vec4<f32>,
};
@group(0) @binding(0) var<uniform> frame: Frame;
@group(0) @binding(1) var shadowMap: texture_depth_2d;
@group(0) @binding(2) var shadowSampler: sampler_comparison;
struct PointLightBuffer { data: array<vec4<f32>, 16> };
@group(0) @binding(5) var<storage, read> pointLights: PointLightBuffer;
struct VertexIn {
 @location(0) position: vec3<f32>, @location(1) normal: vec3<f32>,
 @location(2) albedo: vec3<f32>, @location(3) material: f32,
 @location(4) wind: f32, @location(5) phase: f32,
};
struct VertexOut {
 @builtin(position) clip: vec4<f32>, @location(0) world: vec3<f32>,
 @location(1) normal: vec3<f32>, @location(2) albedo: vec3<f32>,
 @location(3) @interpolate(flat) material: f32,
 @location(4) shadowPosition: vec4<f32>, @location(5) phase: f32,
};
fn animatedPosition(input: VertexIn) -> vec3<f32> {
 let sway=sin(frame.cameraTime.w*1.12+input.phase*6.283+input.position.x*.17+input.position.z*.11);
 let gust=sin(frame.cameraTime.w*.37+input.phase*9.1);
 return input.position+vec3<f32>(sway*gust*input.wind*.16,0.0,sin(frame.cameraTime.w*.83+input.phase*4.8)*input.wind*.045);
}
@vertex fn vertexMain(input: VertexIn) -> VertexOut {
 var out: VertexOut; let p=animatedPosition(input);
 out.clip=frame.viewProjection*vec4<f32>(p,1.0); out.world=p;
 out.normal=normalize(input.normal); out.albedo=input.albedo; out.material=input.material;
 out.shadowPosition=frame.lightViewProjection*vec4<f32>(p,1.0); out.phase=input.phase; return out;
}
@vertex fn shadowVertex(input: VertexIn) -> @builtin(position) vec4<f32> {
 return frame.lightViewProjection*vec4<f32>(animatedPosition(input),1.0);
}
fn shadowFactor(p: vec4<f32>) -> f32 {
 let q=p.xyz/p.w; let uv=vec2<f32>(q.x*.5+.5, .5-q.y*.5);
 let inside=uv.x>=0.002&&uv.x<=0.998&&uv.y>=0.002&&uv.y<=0.998&&q.z>=0.0&&q.z<=1.0;
 let texel=1.0/vec2<f32>(textureDimensions(shadowMap)); var sum=0.0;
 for(var y:i32=-1;y<=1;y=y+1){for(var x:i32=-1;x<=1;x=x+1){
  sum+=textureSampleCompare(shadowMap,shadowSampler,uv+vec2<f32>(f32(x),f32(y))*texel*1.25,q.z-.0018);
 }} return select(1.0,sum/9.0,inside);
}
fn hash2(p: vec2<f32>) -> f32 { return fract(sin(dot(p,vec2<f32>(127.1,311.7)))*43758.5453); }
fn valueNoise(p: vec2<f32>) -> f32 {
 let i=floor(p);let f=fract(p);let u=f*f*(3.0-2.0*f);
 return mix(mix(hash2(i),hash2(i+vec2<f32>(1,0)),u.x),mix(hash2(i+vec2<f32>(0,1)),hash2(i+vec2<f32>(1,1)),u.x),u.y);
}
fn skyFragment(uv: vec2<f32>) -> vec4<f32> {
 let day=frame.params.x; let horizon=pow(1.0-abs(uv.y-.48)*1.72,3.0);
 let nightTop=vec3<f32>(.012,.022,.061); let nightHorizon=vec3<f32>(.065,.105,.17);
 let dayTop=vec3<f32>(.12,.29,.48); let dayHorizon=vec3<f32>(.8,.67,.48);
 var sky=mix(mix(nightTop,nightHorizon,horizon),mix(dayTop,dayHorizon,horizon),day);
 let uvN=uv*vec2<f32>(2.0,1.0); let nebula=pow(valueNoise(uvN*vec2<f32>(9,4)+vec2<f32>(.3,.7)),3.0);
 sky+=vec3<f32>(.065,.040,.15)*nebula*(1.0-day)*frame.worldParams.x;
 let grid=vec2<f32>(230.0,132.0);let cell=floor(uv*grid);let local=fract(uv*grid);
 let seed=hash2(cell);let starPoint=vec2<f32>(hash2(cell+vec2<f32>(17.0,31.0)),hash2(cell+vec2<f32>(43.0,11.0)));
 let pointDistance=distance(local,starPoint);let core=pow(clamp(1.0-pointDistance/.23,0.0,1.0),2.0);
 let chance=hash2(cell+vec2<f32>(71.0,19.0));let temperature=hash2(cell+vec2<f32>(13.0,83.0));
 let bright=select(1.0,2.35,chance>.93);let star=select(0.0,(core*(.78+.22*seed)+.08*exp(-pointDistance*pointDistance/.055))*bright,seed>.974)*(1.0-day)*frame.worldParams.x;
 let starTint=mix(vec3<f32>(.72,.84,1.0),vec3<f32>(1.0,.90,.76),temperature);
 sky+=starTint*star;
 let d=distance(uv,frame.sunScreen.xy); let halo=exp(-d*d/max(frame.sunScreen.z*frame.sunScreen.z*34.0,.00001))*frame.sunScreen.w;
 sky+=vec3<f32>(1.0,.46,.16)*halo*.62;
 return vec4<f32>(sky,1.0);
}
@fragment fn backgroundFragment(@builtin(position) input: vec4<f32>) -> @location(0) vec4<f32> {
 return skyFragment(input.xy/frame.screenSize.xy);
}
fn shade(input: VertexOut) -> vec4<f32> {
 let m=u32(input.material+.5); let n=normalize(input.normal); let toSun=normalize(vec3<f32>(-236.0,0.0,0.0)-input.world);
 let view=normalize(frame.cameraTime.xyz-input.world); let halfV=normalize(toSun+view);
 let nl=max(dot(n,toSun),0.0); let shadow=shadowFactor(input.shadowPosition);
 let day=frame.params.x; let ambient=vec3<f32>(.19,.24,.37)*(1.0-day)+vec3<f32>(.30,.35,.38)*day;
 let warm=vec3<f32>(1.0,.72,.45); let direct=warm*(.22+.92*day)*nl*shadow;
 let radialUp=normalize(vec3<f32>(0.0,-input.world.y,-input.world.z));
 let hemiFactor=mix(.40+.42*max(dot(n,radialUp),0.0),.30+.38*max(dot(n,radialUp),0.0),day);
 let hemi=mix(vec3<f32>(.17,.21,.35),vec3<f32>(.34,.40,.40),day)*hemiFactor;
 var base=input.albedo; var roughness=.78; var specular=.08;
 if(m==1u){roughness=.72;specular=.12;}
 let foliage=m==2u||m==8u||m==12u;
 if(foliage){roughness=.83;specular=.045;}
 if(m==3u){roughness=.91;specular=.035;}
 if(m==4u){roughness=.57;specular=.16;}
 if(m==5u){
  let uv=input.world.xz; let t=frame.cameraTime.w;
  let flowA=valueNoise(uv*.31+vec2<f32>(t*.018,-t*.011));let flowB=valueNoise(uv*.77+vec2<f32>(-t*.027,t*.021));
  let wave=(flowA-.5)*1.25+(flowB-.5)*.65;
  let ripple=normalize(n+vec3<f32>((flowA-flowB)*.17,.035*wave,(flowB-flowA)*.17));
  let fresnel=pow(1.0-max(dot(ripple,view),0.0),4.0); let reflected=mix(vec3<f32>(.10,.24,.30),vec3<f32>(.36,.51,.57),fresnel);
  let spec=pow(max(dot(ripple,halfV),0.0),mix(30.0,9.0,1.0-frame.worldParams.z));
  let depthTint=base*vec3<f32>(.42,.68,.78); let water=depthTint*(ambient+direct*.34+hemi*.55)+reflected*.56+warm*spec*(.35+.9*day);
  let waterDistance=length(input.world-frame.cameraTime.xyz);let waterFog=clamp((waterDistance-68.0)/360.0,0.0,1.0)*frame.params.y*.32;
  let waterSky=mix(vec3<f32>(.035,.075,.13),vec3<f32>(.48,.57,.59),day);
  return vec4<f32>(mix(water,waterSky,waterFog),1.0);
 }
 if(m==6u){roughness=.25;specular=.35;}
 if(m==7u){return vec4<f32>(base*2.2,1.0);}
 if(m==9u){return vec4<f32>(base*(.8+frame.worldParams.x*.5),1.0);}
 if(m==10u){roughness=.32;specular=.42;}
 if(m==11u){roughness=.88;}
 let scaleDetail=select(1.0,3.0,m==0u||m==3u||m==4u||m==11u);
 let detail=valueNoise(input.world.xz*scaleDetail)*.08+valueNoise(input.world.xy*scaleDetail*3.7)*.035;
 base*=1.0+detail;
 let diffuse=ambient+hemi+direct;
 let spec=pow(max(dot(n,halfV),0.0),mix(8.0,96.0,1.0-roughness))*specular*nl*shadow;
 var localLight=vec3<f32>(0.0);
 let localCount=u32(clamp(frame.pointLightCount.x,0.0,8.0));
 let nightBoost=mix(.12,1.0,pow(1.0-day,1.35));
 for(var i:u32=0u;i<localCount;i=i+1u){
  let at=i*2u;let positionRadius=pointLights.data[at];let colorIntensity=pointLights.data[at+1u];
  let delta=positionRadius.xyz-input.world;let distanceToLight=length(delta);let radius=max(positionRadius.w,.1);
  let direction=delta/max(distanceToLight,.001);let normalizedDistance=distanceToLight/radius;
  let range=clamp(1.0-normalizedDistance*normalizedDistance,0.0,1.0);
  // Keep the authored radius as the primary pool boundary; use gentle distance
  // attenuation so nearby walls/thresholds read as lit without a global lift.
  let falloff=range*range/(1.0+distanceToLight*distanceToLight*.012);
  let lambert=max(dot(n,direction),0.0);
  localLight+=colorIntensity.rgb*(colorIntensity.w*falloff*lambert*nightBoost);
 }
 var color=base*(diffuse+localLight)+warm*spec;
 // Pane falloff, cool grazing reflection and irregular interior depth avoid a uniformly orange decal.
 if(m==6u){
  let paneNoise=valueNoise(input.world.xy*2.6+vec2<f32>(input.world.z*.7,input.phase));
  let warmDepth=(.48+.48*paneNoise)*pow(1.0-day,1.15);
  let grazing=pow(1.0-max(dot(n,view),0.0),3.0);
  color+=vec3<f32>(1.0,.39,.14)*warmDepth*1.05+vec3<f32>(.20,.37,.62)*grazing*.16;
 }
 let wrap=max(0.0,(dot(n,toSun)+.34)/1.34);let back=max(dot(-n,toSun),0.0);
 color+=warm*wrap*.20*select(0.0,1.0,foliage)+vec3<f32>(.30,.58,.21)*back*(.18+.62*day)*frame.worldParams.y*select(0.0,1.0,foliage);
 if(m==0u){ // natural grass micro-variation and cool/warm hemisphere
   color*=.94+valueNoise(input.world.xz*1.45)*.12;
 }
 let distance=length(input.world-frame.cameraTime.xyz); let fog=clamp((distance-68.0)/360.0,0.0,1.0)*frame.params.y*.32;
 let sky=mix(vec3<f32>(.035,.075,.13),vec3<f32>(.48,.57,.59),day); color=mix(color,sky,fog);
 return vec4<f32>(color,1.0);
}
@fragment fn fragmentMain(input: VertexOut) -> @location(0) vec4<f32> {return shade(input);}
@vertex fn fullscreenVertex(@builtin(vertex_index) i:u32)->@builtin(position) vec4<f32>{
 let p=array<vec2<f32>,3>(vec2<f32>(-1,-1),vec2<f32>(3,-1),vec2<f32>(-1,3));return vec4<f32>(p[i],0,1);
}
@group(0) @binding(3) var hdrTexture: texture_2d<f32>;
@group(0) @binding(4) var hdrSampler: sampler;
fn aces(color:vec3<f32>)->vec3<f32>{return clamp((color*(2.51*color+.03))/(color*(2.43*color+.59)+.14),vec3<f32>(0),vec3<f32>(1));}
// ACES maps scene-linear HDR into display-linear values. Keep this output
// linear: native WebGPU canvas presentation performs the sRGB display transfer;
// an extra shader OETF was verified to wash out the native capture.
@fragment fn postFragment(@builtin(position) input:vec4<f32>)->@location(0) vec4<f32>{
 let size=vec2<f32>(textureDimensions(hdrTexture));let uv=input.xy/size;let px=1.0/size;
 var hdr=textureSample(hdrTexture,hdrSampler,uv).rgb;
 let b0=textureSample(hdrTexture,hdrSampler,uv+vec2<f32>(px.x*2.0,0)).rgb;
 let b1=textureSample(hdrTexture,hdrSampler,uv-vec2<f32>(px.x*2.0,0)).rgb;
 let b2=textureSample(hdrTexture,hdrSampler,uv+vec2<f32>(0,px.y*2.0)).rgb;
 let b3=textureSample(hdrTexture,hdrSampler,uv-vec2<f32>(0,px.y*2.0)).rgb;
 let bright=max((b0+b1+b2+b3)*.25-vec3<f32>(.85),vec3<f32>(0));
 hdr+=bright*.10;
 let vignette=1.0-.16*dot((uv-.5)*vec2<f32>(1.15,1.0),(uv-.5)*vec2<f32>(1.15,1.0));
 let exposed=hdr*vignette*frame.params.w;let luma=dot(exposed,vec3<f32>(.2126,.7152,.0722));let color=mix(vec3<f32>(luma),exposed,frame.params.z);let mapped=aces(color);
 return vec4<f32>(mapped,1.0);
}`;

export const postShader = worldShader;
