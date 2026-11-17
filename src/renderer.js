import {createWorld} from './world.js';
import {perspective,lookAt,multiply,clamp,normalize,sub,add,scale,dot} from './math.js';
import {VERTEX_FLOATS,VERTEX_STRIDE,VERTEX_ATTRIBUTES,SUN} from './scene-contract.js';
import {worldShader} from './shaders/world.js';

const align=n=>Math.ceil(n/256)*256;
const qualityScale={low:.64,medium:.82,high:1};
const SHADOW_SIZE={low:512,medium:1024,high:1536};
function orthographic(left,right,bottom,top,near,far){
 const lr=1/(left-right),bt=1/(bottom-top),nf=1/(near-far);
 return new Float32Array([-2*lr,0,0,0,0,-2*bt,0,0,0,0,nf,0,(left+right)*lr,(top+bottom)*bt,near*nf,1]);
}
function lightMatrix(center){
 const direction=normalize(sub(SUN.position,center));
 const eye=add(center,scale(direction,110));
 const up=Math.abs(dot(direction,[0,1,0]))>.96?[0,0,1]:[0,1,0];
 return multiply(orthographic(-48,48,-48,48,1,230),lookAt(eye,center,up));
}
function sunScreen(vp,camera){
 const p=SUN.position,m=vp;const x=p[0],y=p[1],z=p[2];
 const cx=m[0]*x+m[4]*y+m[8]*z+m[12],cy=m[1]*x+m[5]*y+m[9]*z+m[13],cw=m[3]*x+m[7]*y+m[11]*z+m[15];
 const visible=cw>0?1:0, fov=camera.fov||Math.PI/3,dist=Math.max(1,Math.hypot(x-camera.position[0],y-camera.position[1],z-camera.position[2]));
 const radius=clamp(SUN.radius/(dist*Math.tan(fov/2))*.5,.001,.018);
 return [cw>0?cx/cw*.5+.5:.5,cw>0?.5-cy/cw*.5:.5,radius,visible];
}
function shaderErrors(info,label){const errors=info.messages.filter(m=>m.type==='error');if(errors.length)throw new Error(`${label} WGSL compilation failed: `+errors.map(e=>`line ${e.lineNum}: ${e.message}`).join('; '));}
export async function createRenderer(canvas){
 if(!navigator.gpu)throw new Error('WebGPU is unavailable in this browser. Open STILLWATER in a WebGPU-capable browser.');
 const adapter=await navigator.gpu.requestAdapter({powerPreference:'high-performance'});
 if(!adapter)throw new Error('WebGPU could not find a compatible graphics adapter.');
 const device=await adapter.requestDevice();let destroyed=false,validationMessage='';
 device.addEventListener('uncapturederror',e=>{validationMessage=e.error?.message||'Uncaptured WebGPU validation error';console.error('STILLWATER WebGPU validation error:',validationMessage)});
 device.lost.then(i=>{if(!destroyed)validationMessage='WebGPU device lost: '+(i.message||i.reason||'unknown reason')});
 let world,resources=[];
 try{
  device.pushErrorScope('validation');
  world=createWorld();
  if(world.vertices.byteLength%VERTEX_STRIDE!==0)throw new Error(`World vertex buffer violates 48-byte shared stride (${world.vertices.byteLength} bytes)`);
  const mesh=device.createBuffer({label:'Stillwater procedural world · interleaved normals/materials',size:world.vertices.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});resources.push(mesh);device.queue.writeBuffer(mesh,0,world.vertices);
  const frameBuffer=device.createBuffer({label:'Stillwater scene-linear frame uniforms',size:align(56*4),usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});resources.push(frameBuffer);
  const pointLightBuffer=device.createBuffer({label:'Stillwater bounded local emitter lights (8 x 32 bytes)',size:8*32,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});resources.push(pointLightBuffer);
  const module=device.createShaderModule({label:'Stillwater material, atmosphere and post WGSL',code:worldShader});
  shaderErrors(await module.getCompilationInfo(),'Stillwater world');
  const shadowLayout=device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:'uniform'}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:'depth',viewDimension:'2d'}},{binding:2,visibility:GPUShaderStage.FRAGMENT,sampler:{type:'comparison'}},{binding:5,visibility:GPUShaderStage.FRAGMENT,buffer:{type:'read-only-storage'}}]});
  const shadowPassLayout=device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:'uniform'}}]});
  const shadowPassPipelineLayout=device.createPipelineLayout({bindGroupLayouts:[shadowPassLayout]});
  const vertex={module,entryPoint:'vertexMain',buffers:[{arrayStride:VERTEX_STRIDE,attributes:VERTEX_ATTRIBUTES}]};
  const layout=device.createPipelineLayout({bindGroupLayouts:[shadowLayout]});
  const shadowPipeline=device.createRenderPipeline({label:'Stillwater directional depth shadow pass',layout:shadowPassPipelineLayout,vertex:{module,entryPoint:'shadowVertex',buffers:[{arrayStride:VERTEX_STRIDE,attributes:VERTEX_ATTRIBUTES}]},primitive:{topology:'triangle-list',frontFace:'ccw',cullMode:'none'},depthStencil:{format:'depth32float',depthWriteEnabled:true,depthCompare:'less',depthBias:2,depthBiasSlopeScale:2.0}});
  const mainLayout=shadowLayout;
  const postLayout=device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:'uniform'}},{binding:3,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:'float',viewDimension:'2d'}},{binding:4,visibility:GPUShaderStage.FRAGMENT,sampler:{type:'filtering'}}]});
  const postPipelineLayout=device.createPipelineLayout({bindGroupLayouts:[postLayout]});
  const context=canvas.getContext('webgpu');if(!context)throw new Error('Could not create a WebGPU canvas context.');
  const format=navigator.gpu.getPreferredCanvasFormat();
  const bgLayout=mainLayout;
  let quality='high',targetQuality='',width=0,height=0,hdr,depth,shadow,sceneColor,shadowView,shadowBind,shadowPassBind,postBind,postSampler;
  let contextConfigured=false,pipelines={},frameCount=0,fps=60,lastFps=performance.now(),captureFirstFrame=true;
  const destroyTarget=t=>{if(t)t.destroy()};
  function buildTargets(w,h){
   for(const t of [hdr,depth,shadow,sceneColor])destroyTarget(t);
   width=w;height=h;targetQuality=quality;
   const samples=quality==='low'?1:4;
   hdr=device.createTexture({label:'Stillwater HDR scene-linear target',size:[w,h],format:'rgba16float',sampleCount:1,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING});
   depth=device.createTexture({label:'Stillwater multisample depth',size:[w,h],format:'depth24plus',sampleCount:samples,usage:GPUTextureUsage.RENDER_ATTACHMENT});
   if(samples>1)sceneColor=device.createTexture({label:'Stillwater multisample HDR color',size:[w,h],format:'rgba16float',sampleCount:samples,usage:GPUTextureUsage.RENDER_ATTACHMENT});
   shadow=device.createTexture({label:'Stillwater directional shadow map',size:[SHADOW_SIZE[quality],SHADOW_SIZE[quality]],format:'depth32float',usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING});shadowView=shadow.createView();
   const cmp=device.createSampler({label:'shadow PCF comparison sampler',compare:'less-equal',magFilter:'linear',minFilter:'linear'});
   shadowBind=device.createBindGroup({layout:shadowLayout,entries:[{binding:0,resource:{buffer:frameBuffer}},{binding:1,resource:shadowView},{binding:2,resource:cmp},{binding:5,resource:{buffer:pointLightBuffer}}]});
   shadowPassBind=device.createBindGroup({layout:shadowPassLayout,entries:[{binding:0,resource:{buffer:frameBuffer}}]});
   postSampler=device.createSampler({label:'HDR post sampler',magFilter:'linear',minFilter:'linear'});
   postBind=device.createBindGroup({layout:postLayout,entries:[{binding:0,resource:{buffer:frameBuffer}},{binding:3,resource:hdr.createView()},{binding:4,resource:postSampler}]});
   pipelines={};
   for(const count of [1,4]){
    pipelines[count]={
     background:device.createRenderPipeline({label:`Stillwater procedural sky ${count}x`,layout,vertex:{module,entryPoint:'fullscreenVertex'},fragment:{module,entryPoint:'backgroundFragment',targets:[{format:'rgba16float'}]},primitive:{topology:'triangle-list'},depthStencil:{format:'depth24plus',depthWriteEnabled:false,depthCompare:'always'},multisample:{count}}),
     main:device.createRenderPipeline({label:`Stillwater lit HDR world ${count}x`,layout,vertex,fragment:{module,entryPoint:'fragmentMain',targets:[{format:'rgba16float'}]},primitive:{topology:'triangle-list',frontFace:'ccw',cullMode:'none'},depthStencil:{format:'depth24plus',depthWriteEnabled:true,depthCompare:'less'},multisample:{count}})
    };
   }
  }
  const postPipeline=device.createRenderPipeline({label:'Stillwater restrained HDR tone map and bloom',layout:postPipelineLayout,vertex:{module,entryPoint:'fullscreenVertex'},fragment:{module,entryPoint:'postFragment',targets:[{format}]},primitive:{topology:'triangle-list'}});
  function configure(){
   const requested=Math.min(devicePixelRatio||1,1.6)*qualityScale[quality],pixelCap=Math.sqrt(2_000_000/Math.max(1,canvas.clientWidth*canvas.clientHeight)),dpr=Math.min(requested,pixelCap),w=Math.max(1,Math.round(canvas.clientWidth*dpr)),h=Math.max(1,Math.round(canvas.clientHeight*dpr));
   const canvasChanged=canvas.width!==w||canvas.height!==h;if(canvasChanged){canvas.width=w;canvas.height=h}
   if(!contextConfigured||canvasChanged){context.configure({device,format,alphaMode:'opaque'});contextConfigured=true}
   if(width!==w||height!==h||targetQuality!==quality||!hdr)buildTargets(w,h);
  }
  configure();
  const validation=await device.popErrorScope();if(validation)throw new Error('GPU resource/pipeline validation failed: '+validation.message);
  function render(camera,settings={}){
   if(destroyed)return fps;if(validationMessage)throw new Error(validationMessage);
   quality=['low','medium','high'].includes(settings.quality)?settings.quality:quality;configure();
   const day=clamp((settings.sun??.76)*camera.progress*1.28+.035,0,1);
   const fov=camera.fov||Math.PI/3,vp=multiply(perspective(fov,width/height,.15,900),lookAt(camera.position,camera.target,camera.up));
   const center=add(camera.position,scale(normalize(sub(camera.target,camera.position)),38));const lvp=lightMatrix(center);
   const uniforms=new Float32Array(56);uniforms.set(vp,0);uniforms.set(lvp,16);
   uniforms.set([day,settings.atmosphere??.66,settings.saturation??1,settings.exposure??1],32);
   uniforms.set([settings.stars??.55,settings.foliage??.8,settings.water??.7,settings.wind??.45],36);
   uniforms.set([...camera.position,performance.now()/1000],40);uniforms.set(sunScreen(vp,camera),44);uniforms.set([width,height,1/width,1/height],48);
   const pointLights=new Float32Array(8*8);let lightCount=0;
   for(const light of Array.isArray(world.lights)?world.lights.slice(0,8):[]){
    const p=light?.position,c=light?.color;if(!p||!c||p.length<3||c.length<3)continue;
    const values=[...p.slice(0,3),light.radius,...c.slice(0,3),light.intensity];
    if(!values.every(Number.isFinite)||values[3]<=0||values[7]<=0)continue;
    const at=lightCount++*8;pointLights.set([clamp(values[0],-400,400),clamp(values[1],-200,200),clamp(values[2],-200,200),clamp(values[3],.1,25),clamp(values[4],0,1),clamp(values[5],0,1),clamp(values[6],0,1),clamp(values[7],0,20)],at);
   }
   uniforms.set([lightCount,0,0,0],52);
   device.queue.writeBuffer(frameBuffer,0,uniforms);device.queue.writeBuffer(pointLightBuffer,0,pointLights);
   const captureValidation=captureFirstFrame;if(captureValidation)device.pushErrorScope('validation');
   const shadowEncoder=device.createCommandEncoder({label:'Stillwater directional depth shadows'});
   const shadowPass=shadowEncoder.beginRenderPass({label:'Directional soft shadow depth',colorAttachments:[],depthStencilAttachment:{view:shadowView,depthClearValue:1,depthLoadOp:'clear',depthStoreOp:'store'}});
   shadowPass.setPipeline(shadowPipeline);shadowPass.setBindGroup(0,shadowPassBind);shadowPass.setVertexBuffer(0,mesh);shadowPass.draw(world.vertices.length/VERTEX_FLOATS);shadowPass.end();device.queue.submit([shadowEncoder.finish()]);
   const encoder=device.createCommandEncoder({label:'Stillwater HDR color and post'});
   const samples=quality==='low'?1:4,resolve=hdr.createView();
   const scenePass=encoder.beginRenderPass({label:'Scene-linear atmosphere and lit materials',colorAttachments:[{view:samples===1?resolve:sceneColor.createView(),resolveTarget:samples===1?undefined:resolve,clearValue:{r:.012,g:.018,b:.035,a:1},loadOp:'clear',storeOp:'store'}],depthStencilAttachment:{view:depth.createView(),depthClearValue:1,depthLoadOp:'clear',depthStoreOp:'store'}});
   const pipe=pipelines[samples];scenePass.setPipeline(pipe.background);scenePass.setBindGroup(0,shadowBind);scenePass.draw(3);
   scenePass.setPipeline(pipe.main);scenePass.setBindGroup(0,shadowBind);scenePass.setVertexBuffer(0,mesh);scenePass.draw(world.vertices.length/VERTEX_FLOATS);scenePass.end();
   const out=encoder.beginRenderPass({label:'HDR tone map and restrained bloom',colorAttachments:[{view:context.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:1},loadOp:'clear',storeOp:'store'}]});out.setPipeline(postPipeline);out.setBindGroup(0,postBind);out.draw(3);out.end();device.queue.submit([encoder.finish()]);
   if(captureValidation){captureFirstFrame=false;device.popErrorScope().then(error=>{if(error){validationMessage=error.message;console.error('STILLWATER first-frame validation error:',validationMessage)}})}
   frameCount++;const now=performance.now();if(now-lastFps>1000){fps=Math.round(frameCount*1000/(now-lastFps));frameCount=0;lastFps=now}return fps;
  }
  return {render,world,device,get fps(){return fps},setQuality(v){if(['low','medium','high'].includes(v))quality=v},destroy(){if(destroyed)return;destroyed=true;for(const t of [hdr,depth,shadow,sceneColor,...resources])t?.destroy();device.destroy()}};
 }catch(error){destroyed=true;for(const r of resources)try{r.destroy()}catch{}device.destroy();throw error}
}
