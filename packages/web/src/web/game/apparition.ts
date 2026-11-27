import * as T from 'three';

// Free floor along the main corridor and the surgical passage, away from furniture.
const sites = [
 [1.78,7.15],[-1.78,6.15],[-1.72,3.4],[1.74,2.18],
 [1.74,-2.65],[-1.72,-4.87],[1.76,-6.65],[-1.76,-9.82],
 [-1.71,-13.05],[1.73,-14.83],[-1.71,-15.48],
 [11.47,-4.23],[9.14,-6.4],[11.47,-9.82],[9.17,-13.13],[11.45,-15.74],
] as const;

export function createApparition(scene:T.Scene) {
 const figure=new T.Group();
 figure.name='apparition';figure.visible=false;scene.add(figure);
 const darkness=new T.MeshBasicMaterial({color:'#020302',toneMapped:false});
 const box=new T.BoxGeometry(1,1,1);
 const part=(shape:T.BufferGeometry,x:number,y:number,z:number,sx:number,sy:number,sz:number)=>{
   const mesh=new T.Mesh(shape,darkness);
   mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);figure.add(mesh);
   return mesh;
 };
 part(new T.SphereGeometry(1,8,5),0,1.67,.015,.108,.145,.11);
 part(box,0,1.52,0,.116,.19,.12);
 part(new T.CylinderGeometry(.227,.16,.50,6),0,1.285,0,1,1,.63);
 part(box,0,1.01,0,.30,.19,.21);
 for(const side of [-1,1]){
   part(box,side*.087,.73,0,.14,.48,.165).rotation.z=side*.035;
   part(box,side*.10,.285,0,.118,.48,.138).rotation.z=side*.023;
   part(box,side*.107,.052,.043,.135,.104,.236);
   part(box,side*.215,1.28,0,.112,.43,.135).rotation.z=side*.13;
   part(box,side*.249,.985,.018,.084,.29,.103).rotation.z=side*.055;
   part(box,side*.254,.809,.02,.085,.125,.10);
 }

 const target=new T.Vector3(), direction=new T.Vector3(), screen=new T.Vector3();
 const focusHeight=1.50;
 let nextAt=14+Math.random()*11, vanishAt=Infinity, obscuredSince=Infinity, previous=-1;
 const delay=(elapsed:number)=>{
   figure.visible=false;vanishAt=Infinity;obscuredSince=Infinity;
   nextAt=elapsed+32+Math.random()*29;
 };
 const update=(elapsed:number,camera:T.PerspectiveCamera,facing:T.Vector3,clear:(x:number,z:number)=>boolean)=>{
   const eye=camera.position;
   if(figure.visible){
     if(elapsed>=vanishAt){delay(elapsed);return;}
     const {x,z}=figure.position;
     figure.rotation.y=Math.atan2(eye.x-x,eye.z-z);
     if(vanishAt!==Infinity)return;
     const distance=Math.hypot(x-eye.x,z-eye.z);
     if(distance>18){delay(elapsed);return;}
     if(!clear(x,z)){
       if(obscuredSince===Infinity)obscuredSince=elapsed;
       if(elapsed-obscuredSince>7)delay(elapsed);
       return;
     }
     obscuredSince=Infinity;
     direction.set(x-eye.x,focusHeight-eye.y,z-eye.z).normalize();
     if(direction.dot(facing)>=Math.cos(T.MathUtils.degToRad(10)))vanishAt=elapsed+2;
     return;
   }
   if(elapsed<nextAt)return;
   nextAt=elapsed+.75;
   const candidates:number[]=[];
   sites.forEach(([x,z],index)=>{
     const distance=Math.hypot(x-eye.x,z-eye.z);
     if(distance<4||distance>13)return;
     target.set(x,focusHeight,z);direction.copy(target).sub(eye).normalize();
     if(direction.dot(facing)> .973||direction.dot(facing)<.45)return;
     screen.copy(target).project(camera);
     if(Math.abs(screen.x)<.24||Math.abs(screen.x)>.88||Math.abs(screen.y)>.65||!clear(x,z))return;
     candidates.push(index);
   });
   const alternatives=candidates.filter(index=>index!==previous);
   const pool=alternatives.length?alternatives:candidates;
   if(!pool.length)return;
   previous=pool[Math.floor(Math.random()*pool.length)]!;
   const [x,z]=sites[previous]!;
   figure.position.set(x,0,z);figure.rotation.y=Math.atan2(eye.x-x,eye.z-z);figure.visible=true;
 };
 return {update,delay};
}