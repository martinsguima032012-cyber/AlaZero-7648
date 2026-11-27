export function createAudio(){
 let ctx:AudioContext|undefined, master:GainNode|undefined, droneGain:GainNode|undefined, chaseGain:GainNode|undefined, noise:AudioBuffer|undefined;
 let muted=false;
 const ensure=()=>{
   try {
     if(!ctx){
       ctx=new AudioContext();master=ctx.createGain();master.gain.value=muted?0:.48;master.connect(ctx.destination);
       droneGain=ctx.createGain();droneGain.gain.value=.12;droneGain.connect(master);
       chaseGain=ctx.createGain();chaseGain.gain.value=0;chaseGain.connect(master);
       for(const [freq,type,gain,target] of [[47,'sine',.59,droneGain],[50.4,'triangle',.21,droneGain],[121.4,'sine',.083,droneGain],[63,'triangle',.35,chaseGain],[66.5,'sine',.48,chaseGain]] as const){const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.value=gain;o.connect(g);g.connect(target);o.start();}
       noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const buf=noise.getChannelData(0);for(let i=0;i<buf.length;i++)buf[i]=Math.random()*2-1;
     }
     if(ctx.state==='suspended')void ctx.resume().catch(()=>{});
   } catch {/* sound is optional */}
 };
 const sound=(event:'step'|'run'|'switch'|'bad'|'chase'|'caught'|'win'|'door',pan=0)=>{
   if(!ctx||!master||muted)return;
   const at=ctx.currentTime,o=ctx.createOscillator(),envelope=ctx.createGain();const stereo=ctx.createStereoPanner();stereo.pan.value=pan;
   const [freq,end,len,amp]=({step:[95,44,.095,.18],run:[116,47,.13,.34],switch:[470,90,.08,.10],door:[156,54,.32,.22],bad:[145,81,.24,.23],chase:[233,49,1.25,.32],caught:[325,37,1.55,.45],win:[115,182,1.64,.24]})[event] as [number,number,number,number];
   o.type=event==='caught'||event==='bad'?'triangle':'sine';o.frequency.setValueAtTime(freq,at);o.frequency.exponentialRampToValueAtTime(end,at+len);
   envelope.gain.setValueAtTime(.001,at);envelope.gain.linearRampToValueAtTime(amp,at+.022);envelope.gain.exponentialRampToValueAtTime(.001,at+len);
   o.connect(envelope);envelope.connect(stereo);stereo.connect(master);o.start(at);o.stop(at+len+.025);
   if(noise&&event!=='win'){
     const n=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();n.buffer=noise;filter.type='lowpass';filter.frequency.value=event==='caught'?950:event==='chase'?380:820;g.gain.setValueAtTime(amp*.62,at);g.gain.exponentialRampToValueAtTime(.001,at+Math.min(len,.85));n.connect(filter);filter.connect(g);g.connect(stereo);n.start(at);n.stop(at+Math.min(len,.88));
   }
 };
 return { ensure,sound, mute(v:boolean){muted=v;if(ctx&&master)master.gain.setTargetAtTime(v?0:.48,ctx.currentTime,.055);}, chase(v:boolean){if(ctx&&chaseGain)chaseGain.gain.setTargetAtTime(v?.15:0,ctx.currentTime,.37);}, ambient(v:boolean){if(ctx&&droneGain)droneGain.gain.setTargetAtTime(v?.12:.035,ctx.currentTime,.22);}, close(){if(ctx)void ctx.close().catch(()=>{});} };
}
