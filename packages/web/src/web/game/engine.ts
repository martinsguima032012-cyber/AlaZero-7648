import * as T from 'three';
import { createWorld } from './world';
import { sites, type Id, type Progress } from './data';
import { doors, type DoorId } from './expansion';
import { createApparition } from './apparition';

type Config = { paused:boolean; flashlight:boolean; reduced:boolean; muted:boolean; p:Progress };
type Events = { near:(id:Id|null)=>void; action:(id:Id)=>void; status:(s:string)=>void; caught:()=>void; escaped:()=>void; chased:()=>void; pause:()=>void; step:(sprint:boolean,pan?:number)=>void };
export type Engine = ReturnType<typeof launch>;
export function launch(host:HTMLDivElement,read:()=>Config,events:Events) {
 const renderer=new T.WebGLRenderer({antialias:false,alpha:false,powerPreference:'high-performance'});
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.19;
 renderer.setPixelRatio(1);renderer.domElement.className='game-canvas';renderer.domElement.setAttribute('aria-label','Hospital Santa Dália em três dimensões');host.appendChild(renderer.domElement);
 const w=createWorld();
 const apparition=createApparition(w.scene);
 const camera=new T.PerspectiveCamera(66,1,.045,75);camera.rotation.order='YXZ';
 const lamp=new T.SpotLight('#f4e2b9',78,26,.51,.76,1.37);
 const aim=new T.Object3D();lamp.target=aim;w.scene.add(lamp,aim);
 const keys=new Set<string>();const canvas=renderer.domElement;const pos=new T.Vector3(0,1.63,10.45);
 let yaw=0,pitch=-.035,frame=0,last=performance.now(),elapsed=0,lastFrame=0,stepAt=0,stamina=1,exhausted=false,footPhase=0;
 let near:Id|null=null, nearestDistance=Infinity,drag=false,dragged=false,prevLocked=false,lastPower=false,lastExit=false, triggered=false,chase=0,chaseKind=1,captured=false,won=false,emitted=false;
 let pulse=0,lastLightX=Infinity,lastLightZ=Infinity;
 const onResize = () => {const ww=host.clientWidth||innerWidth,hh=host.clientHeight||innerHeight; const h=Math.min(400,Math.max(275, Math.round(hh*.54)));renderer.setSize(Math.min(1024,Math.round(h*ww/hh)),h,false);camera.aspect=ww/hh;camera.updateProjectionMatrix();};
 const ro=new ResizeObserver(onResize);ro.observe(host);onResize();
 const moveKeys=['KeyW','KeyA','KeyS','KeyD','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','ShiftLeft','ShiftRight','KeyE'];
 const onKey=(e:KeyboardEvent) => { if(read().paused) return; if(moveKeys.includes(e.code))e.preventDefault();keys.add(e.code);if(e.code==='KeyE'&&near&&!e.repeat)events.action(near); };
 const onUp=(e:KeyboardEvent)=>{keys.delete(e.code);};
 const blur=()=>{keys.clear();drag=false;};
 const onMouse=(e:MouseEvent)=>{if(read().paused||(!drag&&document.pointerLockElement!==canvas))return;const f=.0029;yaw-=e.movementX*f;pitch=Math.max(-1.36,Math.min(1.36,pitch-e.movementY*f));if(Math.abs(e.movementX)+Math.abs(e.movementY)>1)dragged=true;};
 const lock=()=>{if(document.pointerLockElement===canvas){prevLocked=true;return;}if(prevLocked&&!read().paused)events.pause();prevLocked=false;};
 const unlock=()=>{if(document.pointerLockElement===canvas)document.exitPointerLock();};
 const focus=()=>{if(document.pointerLockElement!==canvas && !document.pointerLockElement){try{const result=canvas.requestPointerLock?.();if(result) void result.catch(()=>{});}catch{/* keyboard and drag fallback */}}};
 const down=(e:MouseEvent)=>{if(e.button!==0||read().paused)return;drag=true;dragged=false;};
 const up=()=>{if(drag&&!dragged&&!read().paused){if(document.pointerLockElement!==canvas)focus();}drag=false;};
 const context=(e:Event)=>e.preventDefault();
 const clear=()=>{keys.clear();drag=false;};
 window.addEventListener('keydown',onKey);window.addEventListener('keyup',onUp);window.addEventListener('blur',blur);document.addEventListener('mousemove',onMouse);document.addEventListener('pointerlockchange',lock);canvas.addEventListener('mousedown',down);window.addEventListener('mouseup',up);canvas.addEventListener('contextmenu',context);
 const startChase=(kind:number)=>{
   chaseKind=kind;chase=kind===1?15.5:10;captured=false;emitted=false;
   apparition.delay(elapsed);
   w.entity.position.set(kind===1?-0.8:0,0,kind===1?-14.85:-8.5);w.entity.visible=true;
   events.status('CORRA. NÃO OLHE PARA TRÁS.');events.chased();
 };
 const endChase=(escaped:boolean)=>{
   if(chase<=0)return;chase=0;w.entity.visible=false;if(escaped)events.status('Os passos pararam.');
 };
 const resetPosition=(p:Progress)=>{
   endChase(false);
   apparition.delay(elapsed);
   pos.set(p.exit?0:p.power?5.25:0,1.63,p.exit?-14.1:p.power?3.9:10.45);
   yaw=p.exit?0:p.power?Math.PI/2:0;pitch=-.055;stamina=1;exhausted=false;captured=false;won=false;
   if(p.power)triggered=true;
 };
 const obstructs=(id:DoorId)=>{
   const d=doors.find(item=>item.id===id);
   return Boolean(d&&((pos.x-d.x)*d.swing > -.35)&&((pos.x-d.x)*d.swing < 1.9)&&Math.abs(pos.z-d.z)<1.16);
 };
 function leafHit(x:number,z:number,r:number){
   return doors.some(d=>{
     if(Math.abs(x-d.x)>2.2||Math.abs(z-d.z)>1.25)return false;
     const angle=w.freeLeaves.get(d.id)!.rotation.y;
     const dx=x-d.x,dz=z-(d.z+.95);
     const along=-Math.sin(angle)*dx-Math.cos(angle)*dz;
     const across=Math.cos(angle)*dx-Math.sin(angle)*dz;
     return along> -r&&along<1.88+r&&Math.abs(across)<.067+r;
   });
 }
 const hit=(x:number,z:number,p:Progress) =>{
   if(z>11.83||z< -18.19||x < -8.42||x > 17.62)return true;
   const r=.235;
   const check=(gx:number,gz:number,ww:number,dd:number)=>Math.abs(gx-x)<ww/2+r&&Math.abs(gz-z)<dd/2+r;
   if(!p.archive&&check(-2.54,-3,.14,1.94))return true;
   if(!p.service&&check(2.54,-9,.14,1.94))return true;
   if(!p.exit&&check(0,-16.62,1.94,.16))return true;
   return leafHit(x,z,r)||w.solid.some(b=>check(b.x,b.z,b.w,b.d));
 };
 function blockedLine(x:number,z:number,xx:number,zz:number,trim=.10,end=.94){
   for(const w0 of w.solid){
     let low=trim,high=end;
     for(const [f,t,c,width] of [[x,xx,w0.x,w0.w],[z,zz,w0.z,w0.d]] as const){
       const v=t-f;
       if(Math.abs(v)<.001){if(Math.abs(f-c)>width/2){low=Infinity;break;}}
       else {const a=(c-width/2-f)/v,b=(c+width/2-f)/v;low=Math.max(low,Math.min(a,b));high=Math.min(high,Math.max(a,b));}
     }
     if(low<=high)return true;
   }
   return false;
 }
 const visionGates=[w.doors.archive,w.doors.service,w.doors.exit] as const;
 function apparitionSight(x:number,z:number){
   const eye=camera.position;
   if(blockedLine(eye.x,eye.z,x,z,0,1))return false;
   const dx=x-eye.x,dz=z-eye.z;
   const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.085));
   for(let i=0;i<=steps;i++){
     const t=i/steps,xx=eye.x+dx*t,zz=eye.z+dz*t,y=T.MathUtils.lerp(eye.y,1.50,t);
     if(leafHit(xx,zz,.025))return false;
     if((visionGates[0].position.y<y&&Math.abs(xx+2.54)<.089&&Math.abs(zz+3)<.98)
     ||(visionGates[1].position.y<y&&Math.abs(xx-2.54)<.089&&Math.abs(zz+9)<.98)
     ||(visionGates[2].position.y<y&&Math.abs(xx)<.98&&Math.abs(zz+16.62)<.089))return false;
   }
   return true;
 }
 function nearest(p:Progress){
   let select:Id|null=null; nearestDistance=Infinity;
   for(const s of sites){
     if((s.id==='records'&&(!p.archive||pos.x> -2.6))||(s.id==='bed'&&pos.z<8)||(s.id==='reception'&&pos.x<2.6)||(s.id==='archiveGate'&&p.archive)||(s.id==='breakers'&&(!p.service||pos.x<3.05))||(s.id==='serviceGate'&&p.service)||(s.id==='redSign'&&!p.power)||(s.id==='exit'&&p.exit)||(s.id==='safe'&&(chase<=0||chaseKind!==1)))continue;
     const dx=s.x-pos.x,dz=s.z-pos.z;
     const d=Math.hypot(dx,dz);
     if(d>(s.range||1.78))continue;
     const facing=(dx*-Math.sin(yaw)+dz*-Math.cos(yaw))/(d||1);
     if(d>1.1 && facing<-.32)continue;
     if((s.local||s.id.startsWith('door-'))&&blockedLine(pos.x,pos.z,s.x,s.z))continue;
     if(s.id==='door-reception'&&p.doors.includes('door-reception')&&d>1.17&&facing<.19)continue;
     const weight=d-.13*facing;
     if(weight<nearestDistance){nearestDistance=weight;select=s.id;}
   }
   return select;
 }
 const facing=new T.Vector3();
 const drive=(now:number)=>{
   frame=requestAnimationFrame(drive);
   if(now-lastFrame<1000/42)return;
   lastFrame=now;
   const dt=Math.min(.064,(now-last)/1000);last=now;
   const {p,paused,flashlight,reduced}=read();
   if(p.power&&!lastPower){w.changed.visible=true;w.oldSign.visible=false;w.emergency.visible=true;w.serviceLamp.color.set('#c5dcc6');w.serviceLamp.intensity=12;pulse=0.8;}
   lastPower=p.power;
   w.emergency.intensity=chase>0&&!reduced?12+Math.sin(elapsed*10)*2.8:11;
   if(p.exit&&!lastExit){w.exitLamp.intensity=20;w.exitLamp.color.set('#adcfa6');if(!triggered)triggered=true;startChase(2);}
   lastExit=p.exit;
   for(const def of doors){const leaf=w.freeLeaves.get(def.id)!;const angle=p.doors.includes(def.id)?-def.swing*Math.PI/2:0;leaf.rotation.y=T.MathUtils.lerp(leaf.rotation.y,angle,.185);}
   [p.archive,p.service,p.exit].forEach((v,i)=>{ const g=visionGates[i]!;g.position.y=T.MathUtils.lerp(g.position.y,v?2.85:0,.12); });
   if(!paused&&!captured&&!won){
     elapsed+=dt;pulse=Math.max(0,pulse-dt);
     const mm=Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft'));yaw-=mm*1.83*dt;
     const vv=Number(keys.has('ArrowUp'))-Number(keys.has('ArrowDown'));pitch=Math.max(-1.36,Math.min(1.36,pitch+vv*1.45*dt));
     const f=Number(keys.has('KeyW'))-Number(keys.has('KeyS')),s=Number(keys.has('KeyD'))-Number(keys.has('KeyA'));
     const moving=Boolean(f||s);if(stamina<.035)exhausted=true;if(stamina>.29)exhausted=false;
     const sprint=moving&&(keys.has('ShiftLeft')||keys.has('ShiftRight'))&&!exhausted&&stamina>.018;
     stamina=T.MathUtils.clamp(stamina+dt*(sprint?-.165:.185),0,1);
     if(moving){
       const speed=(sprint?4.62:2.67)*dt/Math.hypot(f,s);
       const nx=pos.x+(s*Math.cos(yaw)-f*Math.sin(yaw))*speed;
       const nz=pos.z+(-f*Math.cos(yaw)-s*Math.sin(yaw))*speed;
       let moved=false;if(!hit(nx,pos.z,p)){pos.x=nx;moved=true;}if(!hit(pos.x,nz,p)){pos.z=nz;moved=true;}
       if(moved){footPhase+=dt*(sprint?13:8);if(elapsed>=stepAt){events.step(sprint);stepAt=elapsed+(sprint?.3:.47);}}
     }
     const nj=nearest(p);if(nj!==near){near=nj;events.near(nj);}
     if(p.power&&!triggered&&Math.abs(pos.x)<2.15&&pos.z>-13&&pos.z<-6){triggered=true;startChase(1);}
     if(p.exit&&pos.z< -17.04&&Math.abs(pos.x)<.91){won=true;apparition.delay(elapsed);endChase(false);events.escaped();}
     if(chase>0){
       chase-=dt;
       if(chase<=0){chase=.01;endChase(true);}
       else if(chaseKind===1&&pos.x>4.3&&pos.z>1.16&&pos.z<6.89)endChase(true);
       else{
         const e=w.entity.position;
         let tx=pos.x,tz=pos.z;
         if(pos.x>2.1&&pos.z>-12&&pos.z<-6&&e.x<=2.67){tx=3.02;tz=-9;}
         if(pos.x< -2.1&&pos.z>-6&&pos.z<0&&e.x>=-2.67){tx=-3.02;tz=-3;}
         if(pos.x>2.1&&pos.z>1&&pos.z<7&&e.x<=2.65){tx=3.05;tz=4;}
         if(Math.abs(e.x)>2.68&&Math.abs(pos.x)<2.67){
           const room=e.x<0?-3:e.z<0?-9:4;tz=room;tx=Math.sign(e.x)*1.99;
         }
         const dx=tx-e.x,dz=tz-e.z,dist=Math.hypot(dx,dz);
         if(dist>.05){
           const stride=(chaseKind===1?3.48:3.87)*dt;
           const nx=e.x+dx/dist*stride,nz=e.z+dz/dist*stride;
           if(!hit(nx,e.z,p))e.x=nx;if(!hit(e.x,nz,p))e.z=nz;
           e.y=.055*Math.sin(elapsed*17);w.entity.rotation.y=Math.atan2(dx,dz);
           w.limbs.forEach((limb,i)=>{limb.rotation.x=Math.sin(elapsed*13)*(i===0||i===3?.65:-.65);});
         }
         if(Math.hypot(pos.x-e.x,pos.z-e.z)<.75&&!blockedLine(e.x,e.z,pos.x,pos.z)&&!leafHit((e.x+pos.x)/2,(e.z+pos.z)/2,.09)){captured=true;endChase(false);events.caught();}
       }
     }
     if(moving&&!reduced){const j=(sprint?.04:.024)*Math.cos(footPhase);camera.position.set(pos.x,1.63+j,pos.z);}else camera.position.set(pos.x,1.63,pos.z);
     camera.rotation.set(pitch,yaw,moving&&!reduced?Math.sin(footPhase*.5)*.008:0,'YXZ');
   } else if(!lastFrame || elapsed===0){camera.position.copy(pos);camera.rotation.set(pitch,yaw,0,'YXZ');}
   host.parentElement?.style.setProperty('--stamina',String(stamina));
   host.parentElement?.classList.toggle('in-chase',chase>0);
   const flicker=!reduced&&!paused ? (.9+Math.sin(elapsed*6.4)*.08+(Math.sin(elapsed*26)*.025)) : 1;
   if(w.fixtures[2])w.fixtures[2].intensity=13*flicker*(p.power?.71:1);
   if(w.fixtures[4])w.fixtures[4].intensity=13*(p.power?.32:1)*flicker;
   if(Math.hypot(pos.x-lastLightX,pos.z-lastLightZ)>.8){
     lastLightX=pos.x;lastLightZ=pos.z;
     const nearby=[...w.extraSources].sort((a,b)=>Math.hypot(a.x-pos.x,a.z-pos.z)-Math.hypot(b.x-pos.x,b.z-pos.z));
     w.extraLights.forEach((light,i)=>{const source=nearby[i]!;light.position.set(source.x,2.92,source.z);light.color.set(source.color);light.intensity=source.intensity;});
   }
   camera.getWorldDirection(facing);
   if(!paused&&!captured&&!won&&chase<=0)apparition.update(elapsed,camera,facing,apparitionSight);
   lamp.position.copy(camera.position);lamp.position.y-=.10;aim.position.copy(camera.position).addScaledVector(facing,8);
   lamp.intensity=flashlight?(reduced?79:(78-22*pulse)*(1+.018*Math.sin(elapsed*17))):0;
   if(chase>0&&!emitted&&chase<(chaseKind===1?14:8.5)){emitted=true;events.step(true,-.4);}
   renderer.render(w.scene,camera);
 };
 camera.position.copy(pos);camera.rotation.set(pitch,yaw,0,'YXZ');frame=requestAnimationFrame(drive);
 return { focus,unlock,clear,obstructs,resetPosition,destroy(){
   clear();unlock();cancelAnimationFrame(frame);ro.disconnect();window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onUp);window.removeEventListener('blur',blur);document.removeEventListener('mousemove',onMouse);document.removeEventListener('pointerlockchange',lock);canvas.removeEventListener('mousedown',down);window.removeEventListener('mouseup',up);canvas.removeEventListener('contextmenu',context);
   const disposed=new Set<unknown>();
   w.scene.traverse(o=>{if(o instanceof T.Mesh){if(o instanceof T.InstancedMesh)o.dispose();if(!disposed.has(o.geometry)){o.geometry.dispose();disposed.add(o.geometry);} const materials:T.Material[]=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>{if(!disposed.has(m)){Object.values(m).forEach(v=>{if(v instanceof T.Texture&&!disposed.has(v)){v.dispose();disposed.add(v);}});m.dispose();disposed.add(m);}});}});
   renderer.dispose();canvas.remove();
 }};
}
