import * as T from 'three';
import { doors, rooms, type DoorId } from './expansion';

export type Bounds = { x:number; z:number; w:number; d:number };
export function createWorld() {
 const scene = new T.Scene();
 scene.background = new T.Color('#111511');
 scene.fog = new T.FogExp2('#111511', 0.038);
 let seed = 9183;
 const rand = () => { seed = (Math.imul(1664525,seed)+1013904223)|0; return (seed>>>0)/4294967296; };
 const texture = (kind:string) => {
   const c=document.createElement('canvas'); c.width=128;c.height=128;
   const ctx=c.getContext('2d')!;
   const bases:Record<string,number[]>={ plaster:[146,146,125],tile:[98,112,100],floor:[115,110,96],ceiling:[98,100,89],door:[91,85,65],metal:[113,116,103] };
   const base=bases[kind]??bases.plaster!;
   const image=ctx.createImageData(128,128);
   for(let y=0;y<128;y++) for(let x=0;x<128;x++) {
     const i=(y*128+x)*4; let grime=(rand()-.5)*34+9*Math.sin(y/7)*Math.sin(x/9)+12*Math.cos((x+y)/22);
     if(kind==='floor' && ((x<2||y<2)||(x===64||y===64))) grime-=43;
     if(kind==='floor' && ((x>64)!==(y>64))) grime-=20;
     if(kind==='tile' && (x%32<2 || y%32<2)) grime-=31;
     if(kind==='ceiling' && (x%64<2||y%64<2)) grime-=37;
     for(let k=0;k<3;k++) image.data[i+k]=base[k]!+grime;
     image.data[i+3]=255;
   }
   ctx.putImageData(image,0,0);
   for(let k=0;k<36;k++){ const x=rand()*128,y=rand()*128;ctx.fillStyle=`rgba(27,22,14,${0.03+rand()*0.15})`;ctx.fillRect(x,y,1+rand()*4,2+rand()*21); }
   if(kind==='plaster'||kind==='door') for(let k=0;k<15;k++){ const x=rand()*128,y=rand()*128;ctx.strokeStyle='rgba(35,31,22,.22)';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-4,y+9);ctx.lineTo(x+2,y+20);ctx.stroke(); }
   const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.magFilter=T.NearestFilter;tex.minFilter=T.NearestMipmapNearestFilter;return tex;
 };
 const m=(color:string, kind?:string)=>new T.MeshStandardMaterial({color,map:kind?texture(kind):null,roughness:.94});
 const top=m('#d8d5ba','plaster'), bottom=m('#a8ad9b','tile'), floor=m('#b9b09c','floor'), ceiling=m('#b8bab0','ceiling'), doorMat=m('#a7a08b','door'), rail=m('#746854','metal'), black=m('#2c3028'), steel=m('#8c9284','metal'), rusty=m('#645448','metal'), fabric=m('#b9b2a2','plaster'), red=m('#591e1c','door'), wood=m('#776559','door');
 const lightMat = new T.MeshBasicMaterial({color:'#bfcf9d'}), darkLight = new T.MeshBasicMaterial({color:'#374036'}), redLight = new T.MeshBasicMaterial({color:'#7b2319'});
 const solid:Bounds[]=[];
 const geom = new T.BoxGeometry(1,1,1);
 const box=(x:number,y:number,z:number,w:number,h:number,d:number,mat:T.Material,parent:T.Object3D=scene)=>{
   const o=new T.Mesh(geom,mat);o.position.set(x,y,z);o.scale.set(w,h,d);parent.add(o);return o;
 };
 function area(x:number,z:number,w:number,d:number){
   const nx=Math.ceil(w/2.1),nz=Math.ceil(d/2.1);
   for(let ix=0;ix<nx;ix++) for(let iz=0;iz<nz;iz++){
     const xx=x-w/2+(ix+.5)*w/nx, zz=z-d/2+(iz+.5)*d/nz;
     box(xx,-.055,zz,w/nx+.011,.11,d/nz+.011,floor);
     box(xx,3.46,zz,w/nx+.009,.10,d/nz+.009,ceiling);
   }
 }
 function wall(x:number,z:number,w:number,d:number){
   solid.push({x,z,w,d});
   const longX=w>d, n=Math.ceil(Math.max(w,d)/2.6);
   for(let j=0;j<n;j++){
     const q=(j+.5)/n-.5, xx=x+(longX?q*w:0), zz=z+(longX?0:q*d), ww=longX?w/n+.012:w, dd=longX?d:d/n+.012;
     box(xx,2.38,zz,ww,2.14,dd,top);box(xx,.65,zz,ww,1.31,dd,bottom);
     box(xx,1.28,zz,ww+.055,.12,dd+.055,rail);box(xx,.075,zz,ww+.06,.15,dd+.06,black);
   }
 }
 function part(x:number,a:number,b:number){wall(x,(a+b)/2,.20,b-a);}
 area(0,-2.5,5,29); area(0,-17.63,2.09,1.26);
 area(5.5,4,6,6); area(-5.5,-3,6,6); area(5.5,-9,6,6);
 function cutWall(x:number,start:number,end:number,gaps:number[]){
   let at=start;
   for(const z of gaps.sort((a,b)=>a-b)){if(z-1.02>at)part(x,at,z-1.02);at=z+1.02;}
   if(end>at)part(x,at,end);
 }
 cutWall(-2.54,-17,12,[-3,...rooms.filter(r=>r.wallX<0).map(r=>r.z)]);
 cutWall(2.54,-17,12,[-9,...doors.filter(d=>d.x===2.54).map(d=>d.z)]);
 for(const r of rooms){
   const {x0,x1,a,b,wallX,style}=r; const cx=(x0+x1)/2;
   area(cx,(a+b)/2,x1-x0,b-a);wall(cx,a,x1-x0+.10,.20);wall(cx,b,x1-x0+.10,.20);
   const x=x0===wallX?x1:x0;
   if(style!=='passage'&&style!=='sterile')part(x,a,b);
 }
 area(10.31,-9.8,3.54,13.94);
 cutWall(8.54,-16.77,-2.83,[-14.35,-4.32]);
 cutWall(12.08,-16.77,-2.83,rooms.filter(r=>r.wallX===12.08).map(r=>r.z));
 wall(10.31,-16.77,3.56,.20);wall(10.31,-2.83,3.56,.20);
 for(const [x,a,b] of [[8.54,1,7],[-8.54,-6,0],[8.54,-12,-6]] as const){
   if(a!==-12)part(x,a,b);const cx=x>0?5.52:-5.52;wall(cx,a,6.03,.20);wall(cx,b,6.03,.20);
 }
 wall(0,12.05,5.2,.25);wall(0,-18.28,2.4,.25);wall(-1.13,-17.44,.25,1.65);wall(1.13,-17.44,.25,1.65);
 function sign(text:string,w:number,h:number,x:number,y:number,z:number,rotation=0,mode='normal') {
   const c=document.createElement('canvas');c.width=256;c.height=h/w<.45?64:128;
   const p=c.getContext('2d')!;
   p.fillStyle=mode==='green'?'#b5d3a2':mode==='red'?'#551c16':'#c0bba0';p.fillRect(0,0,c.width,c.height);
   p.fillStyle=mode==='red'?'#eaa094':'#252a22';p.strokeStyle=p.fillStyle;p.lineWidth=3;p.strokeRect(5,5,c.width-10,c.height-10);
   const lines=text.split('|');p.textAlign='center';p.textBaseline='middle';
   p.font=`bold ${lines.length>1?25:31}px monospace`;
   lines.forEach((line,i)=>p.fillText(line,128,c.height*(i+1)/(lines.length+1),236));
   for(let i=0;i<650;i++){p.fillStyle=rand()<.5?'#27282024':'#f5eee131';p.fillRect(rand()*256,rand()*c.height,2,1);}
   const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.magFilter=T.NearestFilter;
   const mat=mode==='red'||mode==='green'?new T.MeshBasicMaterial({map:tex,color:mode==='red'?'#bd776b':'#89a87e'}):new T.MeshStandardMaterial({map:tex,roughness:1});
   const mesh=new T.Mesh(new T.PlaneGeometry(w,h),mat);mesh.position.set(x,y,z);mesh.rotation.y=rotation;scene.add(mesh);return mesh;
 }
 const tf=Math.PI/2;
 function doorway(x:number,z:number,isExit=false){
   const g=new T.Group();g.position.set(x,0,z);g.rotation.y=isExit?0:tf;scene.add(g);
   box(-1.02,1.42,0,.15,2.84,.25,rail,g); box(1.02,1.42,0,.15,2.84,.25,rail,g);box(0,2.78,0,2.15,.17,.25,rail,g);
   box(0,3.10,0,2.16,.55,.19,top,g);
   return g;
 }

 const archiveFrame=doorway(-2.54,-3), serviceFrame=doorway(2.54,-9), exitFrame=doorway(0,-16.62,true);
 const gate=(frame:T.Group,material:T.Material)=>{
   const g=new T.Group();frame.add(g);
   box(0,1.36,0,1.89,2.7,.125,material,g);
   box(0,1.98,.076,1.1,.38,.035,black,g);box(0,1.98,.096,.98,.29,.038,darkLight,g);
   box(.62,1.25,.11,.28,.10,.08,steel,g);box(.62,1.25,-.11,.28,.10,.08,steel,g);
   return g;
 };
 const archive=gate(archiveFrame,doorMat),service=gate(serviceFrame,doorMat),exit=gate(exitFrame,red);
 wall(-1.77,-16.62,1.42,.22);wall(1.77,-16.62,1.42,.22);

 const glass = new T.MeshBasicMaterial({color:'#81918c'});
 const freeLeaves = new Map<DoorId,T.Group>();
 for(const d of doors){
   const frame=doorway(d.x,d.z), hinge=new T.Group();
   box(d.x,-.026,d.z,.19,.05,1.92,floor);
   frame.add(hinge);hinge.position.x=-.95;
   box(.95,1.35,0,1.88,2.68,.13,d.color==='surgery'?steel:doorMat,hinge);
   for(const side of [-1,1]){
     box(.99,1.95,.066*side,.49,.43,.026,black,hinge);
     box(.99,1.95,.082*side,.37,.32,.021,darkLight,hinge);
     box(1.61,1.18,.117*side,.19,.085,.11,steel,hinge);
     sign(d.label.toUpperCase(),1.78,.31,d.x+.151*side,3.035,d.z,tf*side);
   }
   freeLeaves.set(d.id,hinge);
 }
 freeLeaves.get('door-reception')!.rotation.y=-Math.PI/2;
 sign('ARQUIVO',1.65,.33,-2.42,3.04,-3,tf);
 sign('SALA ELÉTRICA',1.83,.33,2.43,3.04,-9,-tf);
 const oldSign=sign('ALA 00  /  LEITOS',1.65,.31,-2.44,2.14,-10.85,tf);
 const changed=sign('1 OLHO • 2 SINO|3 CRUZ',1.9,.68,-2.40,2.00,-10.85,tf,'red');changed.visible=false;
 sign('SAÍDA',1.50,.29,0,3.04,-16.43,0,'green');
 sign('SANTA DÁLIA|POSTO DE ENFERMAGEM',2.6,1.06,8.42,2.19,4,-tf);
 sign('NÃO FECHE OS OLHOS',1.68,.33,7.8,2.05,-11.86,0);
 sign('LEITO 04  /  OBSERVAÇÃO',2.2,.38,0,2.15,11.91,Math.PI);
 sign('EQUIPAMENTOS  /  220 V',2.0,.32,-8.4,2.32,-1.94,tf);
 const panels:T.Group[]=[];
 function panel(x:number,z:number,rot:number){
   const g=new T.Group();scene.add(g);g.position.set(x,1.37,z);g.rotation.y=rot;
   box(0,0,0,.30,.42,.11,black,g);box(0,.105,.071,.21,.095,.04,redLight,g);
   for(let j=0;j<3;j++)for(let i=0;i<3;i++)box((i-1)*.065,-.009-j*.056,.074,.044,.031,.035,steel,g);
   panels.push(g);return g;
 }
 panel(-2.39,-4.16,tf);panel(2.39,-10.17,-tf);panel(0,-16.43,0);
 function bed(x:number,z:number,rotation=0){
   const g=new T.Group();scene.add(g);g.position.set(x,0,z);g.rotation.y=rotation;
   box(0,.65,0,.94,.18,2.05,steel,g);box(0,.797,0,.89,.15,1.91,fabric,g);box(0,.89,-.68,.61,.115,.37,fabric,g);box(0,.89,.35,.94,.11,1.17,rail,g);
   for(const a of [-.39,.39])for(const b of [-.84,.84]){box(a,.37,b,.08,.63,.08,steel,g);box(a,.10,b,.15,.16,.13,black,g);}
   for(const a of [-.49,.49]){box(a,.98,.13,.05,.07,1.10,steel,g);box(a,.84,-.35,.05,.3,.05,steel,g);box(a,.84,.58,.05,.3,.05,steel,g);}
   box(0,.99,-1,.99,.69,.085,steel,g);box(0,.98,1,.98,.48,.085,rail,g);
 }
 bed(-1.69,10.04);bed(-1.6,-.8,.05);bed(1.8,-11.8,-.08);
 function desk(x:number,z:number,w:number,d:number){
   box(x,.89,z,w,.15,d,wood);box(x,.48,z-d*.44,w,.68,.09,wood);
   for(const dx of [-1,1])for(const dz of [-1,1])box(x+dx*(w*.5-.09),.43,z+dz*(d*.5-.09),.09,.88,.09,steel);
 }
 function paper(x:number,z:number,rotation=0){
   const o=box(x,.984,z,.37,.015,.48,fabric);o.rotation.y=rotation;
   for(let i=0;i<5;i++){const line=box(x,.995,z-.117+i*.05,.25-(i%3)*.025,.003,.012,steel);line.rotation.y=rotation;}
 }
 desk(1.54,10.15,1.15,.88);paper(1.42,10.05,-.1);
 desk(6.92,3.98,2.45,.93);paper(6.91,3.66,.11);paper(7.36,3.92,-.13);
 box(7.72,1.28,4.05,.58,.60,.45,steel);box(7.72,1.31,3.807,.42,.35,.03,glass);box(7.72,1.35,3.787,.33,.024,.002,darkLight);
 desk(-6.76,-3.41,1.85,.98);paper(-6.70,-3.07,-.18);paper(-7.22,-3.38,.03);
 for(const z of [-5.4,-4.32,-1.2]){
   box(-8.07,1.09,z,.64,2.15,.91,steel);
   for(let j=0;j<4;j++) {box(-7.73,.37+j*.47,z,.04,.40,.80,doorMat);box(-7.68,.40+j*.47,z,.08,.051,.28,black);}
 }
 for(const z of [-11.2,-7.1]){box(7.99,1.1,z,.64,2.2,.95,steel);for(let q=0;q<5;q++)box(7.65,1.53+q*.074,z,.015,.025,.52,black);}
 box(8.25,1.49,-9,.50,1.37,1.35,steel);box(7.97,1.55,-9,.08,.82,.95,black);
 for(let j=0;j<3;j++){box(7.90,1.65,-9.30+j*.29,.12,.37,.17,rail);box(7.83,1.62,-9.30+j*.29,.075,.13,.113,redLight);box(7.92,2.53,-9.29+j*.29,.10,1.15,.063,rusty);}
 const extraSources:{x:number;z:number;color:string;intensity:number}[]=[];
 const cold = new T.MeshBasicMaterial({color:'#91a5a1'});
 const film = new T.MeshStandardMaterial({color:'#566c69',emissive:'#4a665f',emissiveIntensity:.48,roughness:.7});
 function cabinet(x:number,z:number,w=1.18){
   box(x,.69,z,w,1.35,.5,steel);
   for(let i=0;i<3;i++){box(x,.27+i*.38,z+.26,w-.13,.32,.026,doorMat);box(x,.28+i*.38,z+.29,.23,.032,.04,black);}
 }
 function clinicLamp(x:number,z:number){
   const g=new T.Group();g.position.set(x,2.68,z);scene.add(g);
   const disc=new T.Mesh(new T.CylinderGeometry(.58,.67,.18,9),steel);g.add(disc);
   box(0,.37,0,.11,.66,.12,steel,g);
   for(let i=0;i<6;i++){const o=new T.Mesh(new T.CylinderGeometry(.107,.105,.035,6),cold);o.position.set(.43*Math.cos(i*Math.PI/3),-.103,.43*Math.sin(i*Math.PI/3));g.add(o);}
 }
 for(const r of rooms){
   const x=(r.x0+r.x1)/2, z=(r.a+r.b)/2;
   box(x,3.26,z,.42,.12,.94,black);box(x,3.19,z,.36,.062,.83,r.wallX>10?cold:lightMat);
   extraSources.push({x,z,color:r.wallX>10?'#a2c9bb':r.style==='isolation'?'#bd887a':'#d6d1ac',intensity:r.style==='isolation'?5:10});
   if(r.style==='ward'||r.style==='isolation'){
     bed(x+(r.x0<0?-.80:1.05),r.a+1.26,r.x0<0?tf:-tf);
     if(r.style==='ward')bed(x+(r.x0<0?-.90:1.05),r.b-1.10,-tf);
     if(r.style==='isolation') sign('NÃO HÁ NINGUÉM AQUI',2.24,.40,r.x0+.13,2.14,z,tf,'red');
     if(r.tag!=='05'&&r.tag!=='RC')cabinet(x-1.03,r.a+.36,.78);
   }
   if(r.style==='triage'){
     desk(-6.79,3.1,1.68,.83);paper(-6.58,2.92);cabinet(-7.77,2.95,.91);cabinet(-6.54,.71);
     sign('FICHÁRIO DE ADMISSÃO',2.28,.41,-8.37,2.12,2.94,tf);
   }
   if(r.style==='visits'){
     desk(6.75,-1.19,1.41,.87);paper(6.70,-.98,.11);
     for(let i=0;i<4;i++){const px=3.32+i*.72;box(px,.45,.36,.66,.13,.43,steel);box(px,.66,.52,.62,.37,.09,doorMat);box(px,.22,.36,.08,.46,.25,black);}
   }
   if(r.style==='sterile'){
     for(let i=0;i<3;i++)cabinet(3.65+1.44*i,-16.09,.89);
     sign('PASSAGEM DE SERVIÇO',2.16,.32,6.07,2.49,-16.65,0);
   }
   if(r.style==='passage'){
     box(5.7,.008,-4.32,5.42,.012,.40,rail);
     sign('RADIOLOGIA  /  CIRURGIA',2.64,.37,5.83,2.16,-5.72,0);
   }
   if(r.style==='xray'){
     bed(14.29,-5.58,tf);cabinet(16.78,-6.58);
     box(17.49,1.68,-4.98,.16,1.32,1.82,black);
     for(let i=0;i<9;i++)box(17.397,2.03-Math.floor(i/3)*.34,-5.54+i%3*.54,.022,.30,.48,film);
     box(17.39,1.04,-4.96,.062,.17,.66,steel);
   }
   if(r.style==='surgery'){
     bed(14.43,-10.34,.14);clinicLamp(14.3,-10.24);cabinet(16.6,-11.92,.97);
     desk(16.30,-8.39,1.65,.77);box(16.25,1.15,-8.5,.66,.38,.32,black);
     for(const off of [-.18,.18]){const spool=new T.Mesh(new T.CylinderGeometry(.105,.105,.042,10),steel);spool.rotation.x=Math.PI/2;spool.position.set(16.25+off,1.18,-8.68);scene.add(spool);}
     sign('SALA 01 / GRAVAÇÃO',2.04,.36,17.56,2.3,-8.55,-tf);
   }
 }
 desk(6.68,9.43,1.45,.78);paper(6.62,9.24);
 desk(16.19,-14.82,1.15,.77);paper(16.04,-14.62);
 sign('ALA CIRÚRGICA  /  BLOCO C',2.85,.38,10.32,2.46,-16.64,0);
 for(const z of [-5.4,-9.88,-14.42]){
   box(10.32,3.26,z,.89,.12,.33,black);box(10.32,3.19,z,.80,.05,.29,cold);
   extraSources.push({x:10.32,z,color:'#a4c4bb',intensity:10});
 }
 function wheelchair(x:number,z:number,a:number){
   const group=new T.Group();group.position.set(x,0,z);group.rotation.y=a;scene.add(group);
   box(0,.62,0,.53,.08,.53,black,group);box(0,.88,.25,.55,.51,.08,rail,group);
   for(const side of [1,-1]){
     box(side*.26,.37,0,.05,.62,.05,steel,group);box(side*.28,.86,-.02,.06,.07,.5,steel,group);
     const tire=new T.Mesh(new T.TorusGeometry(.36,.043,5,12),black);tire.position.set(side*.34,.40,.17);tire.rotation.y=tf;group.add(tire);
     for(let i=0;i<4;i++){const bar=box(side*.34,.40,.17,.025,.64,.025,steel,group);bar.rotation.x=i*Math.PI/4;}
     const little=new T.Mesh(new T.CylinderGeometry(.11,.11,.065,8),black);little.rotation.z=tf;little.position.set(side*.26,.13,-.23);group.add(little);
   }
 }
 wheelchair(1.45,5.9,-.28);wheelchair(-1.28,-7.5,.4);
 const wet = new T.MeshStandardMaterial({color:'#554438',roughness:.53,transparent:true,opacity:.53});
 for(let j=0;j<75;j++){
   const z=-16+rand()*27,x=(rand()-.5)*4.67;
   const o=box(x,.004+j*.00006,z,.05+rand()*.88,.005,.035+rand()*.41,wet);o.rotation.y=rand()*6;
 }
 for(let j=0;j<31;j++){
   const z=-15.7+rand()*27,x=(rand()-.5)*4.71;
   const o=box(x,.015,z,.09+rand()*.21,.011,.12+rand()*.29,j%4===0?fabric:wood);o.rotation.y=rand()*6;
 }
 const extraLights=Array.from({length:5},()=>{const l=new T.PointLight('#a4c4bb',0,7,2);scene.add(l);return l;});
 const ambient = new T.HemisphereLight('#939b88','#2f2920',1.05);scene.add(ambient);
 const fixtures:T.PointLight[]=[];
 for(const [x,z,lit] of [[0,10,1],[0,6.01,1],[0,1,1],[0,-3,0],[0,-7.1,1],[0,-12.6,0],[0,-15.8,1],[5.6,4,1],[-5.7,-3,1],[5.5,-9,0]] as const){
   box(x,3.325,z,1.10,.15,.43,black);box(x,3.227,z,.94,.075,.34,lit?lightMat:darkLight);
   if(lit){const l=new T.PointLight('#d6e0aa',13,8,2);l.position.set(x,2.91,z);scene.add(l);fixtures.push(l);}
 }
 const emergency=new T.PointLight('#e43d24',11,9,2);emergency.position.set(-1.5,2.5,-10.7);emergency.visible=false;scene.add(emergency);
 const serviceLamp=new T.PointLight('#dd5c31',4,7,2);serviceLamp.position.set(6.7,2.45,-9);scene.add(serviceLamp);
 const exitLamp=new T.PointLight('#94c6a4',5,5,2);exitLamp.position.set(0,2.2,-16.32);scene.add(exitLamp);
 const entity=new T.Group();scene.add(entity);entity.visible=false;
 const cloth=m('#252724','plaster'), skin=m('#56544a','plaster');
 const torso=new T.Mesh(new T.CylinderGeometry(.24,.155,.85,5),cloth);torso.position.y=1.41;torso.scale.z=.69;entity.add(torso);
 const head=new T.Mesh(new T.IcosahedronGeometry(.173,0),skin);head.position.set(.018,2.06,.018);head.scale.set(.87,1.47,.88);entity.add(head);
 box(0,1.90,0,.14,.32,.14,cloth,entity);box(0,2.06,.135,.095,.027,.021,black,entity);
 const limbs:T.Group[]=[];
 for(const s of [-1,1]){
   const leg=new T.Group();leg.position.set(s*.13,1.10,0);entity.add(leg);limbs.push(leg);box(0,-.46,0,.14,.94,.16,cloth,leg);box(0,-.94,.05,.18,.13,.33,black,leg);
   const arm=new T.Group();arm.position.set(s*.24,1.72,0);entity.add(arm);arm.rotation.z=s*.12;limbs.push(arm);box(0,-.44,0,.11,.87,.13,cloth,arm);box(0,-.92,0,.10,.24,.12,skin,arm);
 }
 const batches=new Map<T.Material,T.Mesh[]>();
 for(const object of scene.children){
   if(!(object instanceof T.Mesh)||object.geometry!==geom||Array.isArray(object.material))continue;
   const group=batches.get(object.material)??[];group.push(object);batches.set(object.material,group);
 }
 for(const [mat,meshes] of batches){
   if(meshes.length<2)continue;
   const batch=new T.InstancedMesh(geom,mat,meshes.length);
   meshes.forEach((obj,i)=>{obj.updateMatrix();batch.setMatrixAt(i,obj.matrix);scene.remove(obj);});
   batch.computeBoundingSphere();scene.add(batch);
 }
 return {scene,solid,freeLeaves,extraSources,extraLights,doors:{archive,service,exit},panels,fixtures,ambient,emergency,serviceLamp,exitLamp,oldSign,changed,entity,limbs};
}
