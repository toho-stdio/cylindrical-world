import {createExperience} from './experience.js';
import {mountUI,showFatal} from './ui.js';
import {createAudioEngine} from './audio.js';

async function start(){
 const canvas=document.querySelector('#world');
 if(!canvas){showFatal(new Error('STILLWATER could not find its world canvas.'));return}
 try{
  const api=await createExperience(canvas);
  const audio=createAudioEngine();
  // createAudioEngine.start() is idempotent and resumes suspended contexts.
  const originalSet=api.set.bind(api);
  api.set=(key,value)=>{originalSet(key,value);if(key==='audio')audio.setEnabled(!!api.params.audio)};
  const originalSetMany=api.setMany.bind(api);
  api.setMany=values=>{originalSetMany(values);audio.setEnabled(!!api.params.audio)};
  const originalReset=api.reset.bind(api);
  api.reset=()=>{originalReset();audio.setEnabled(!!api.params.audio)};
  const originalEnter=api.enter.bind(api);
  api.enter=()=>{const result=originalEnter();if(api.params.audio)api.setAudioEnabled(true);return result};
  api.setAudioEnabled=value=>{
    api.set('audio',value);
    if(value){
      api.audioError=null;
      audio.start().catch(error=>{api.audioError=error?.message||String(error);console.warn('Ambient audio unavailable',error);api.set('audio',false)});
    }
  };
  const unsubscribeAudio=api.subscribe(state=>audio.update({progress:1-state.progress,position:state.position,wind:api.params.wind,water:api.params.water}));
  const destroy=api.destroy.bind(api);api.destroy=()=>{unsubscribeAudio();destroy();audio.destroy()};
  await mountUI(api);
  window.stillwater=api;
  window.world=api;
 }catch(error){console.error('STILLWATER failed to initialize',error);showFatal(error)}
}
start();
