import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Bell, BookOpen, Cross, Eye, Flashlight, Footprints, KeyRound, Power, RotateCcw, TriangleAlert, Volume2, VolumeX, X } from 'lucide-react';
import { launch, type Engine } from './engine';
import { createAudio } from './audio';
import { entries, initial, objective, sites, type Id, type NoteId, type Progress } from './data';
import { extras, type DoorId, type ExtraId } from './expansion';
import OptionalPuzzle from './optional-puzzles';
import './play.css';

type Panel = 'intro'|'pause'|'journal'|'code'|'power'|'protocol'|'caught'|'won'|'unavailable'|NoteId|ExtraId|null;
const switches=['Interfone','Corredor','Campainha'];
const symbols=[{name:'Cruz',Icon:Cross},{name:'Olho',Icon:Eye},{name:'Sino',Icon:Bell}];
const storage = (key:string) => {try{return localStorage.getItem('ala-'+key)==='1';}catch{return false;}};
const save = (key:string,v:boolean) => {try{localStorage.setItem('ala-'+key,v?'1':'0');}catch{/* storage not required */}};

export default function Game({onExit}:{onExit:()=>void}){
 const host=useRef<HTMLDivElement>(null), shell=useRef<HTMLDivElement>(null), dialog=useRef<HTMLDialogElement>(null), engine=useRef<Engine|null>(null);
 const [session,setSession]=useState(0),[p,setP]=useState(initial),[panel,setPanel]=useState<Panel>('intro'),[ready,setReady]=useState(false);
 const [near,setNear]=useState<Id|null>(null),[flash,setFlash]=useState(true),[mute,setMute]=useState(()=>storage('mute')),[reduce,setReduce]=useState(()=>storage('reduce')||(typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches));
 const [message,setMessage]=useState(''),[code,setCode]=useState(''),[sequence,setSequence]=useState<string[]>([]),[error,setError]=useState('');
 const audio=useRef<ReturnType<typeof createAudio>|null>(null);
 const cfg=useRef({p,paused:true,flashlight:flash,reduced:reduce,muted:mute});
 cfg.current={p,paused:panel!==null,flashlight:flash,reduced:reduce,muted:mute};
 const panelRef=useRef<Panel>(panel);panelRef.current=panel;
 const noticeTimer=useRef<number|undefined>(undefined);
 function progress(update:(value:Progress)=>Progress){const val=update(cfg.current.p);cfg.current.p=val;setP(val);}
 function showMessage(text:string){window.clearTimeout(noticeTimer.current);setMessage(text);noticeTimer.current=window.setTimeout(()=>setMessage(''),4550);if(text==='Os passos pararam.')audio.current?.chase(false);}
 function open(v:Panel){
   panelRef.current=v;cfg.current.paused=v!==null;setPanel(v);setError('');setSequence([]);setCode('');
   if(v){engine.current?.clear();engine.current?.unlock();}
   audio.current?.ambient(v===null);
 }
 function returnPlay(lock=true){open(null);audio.current?.ensure();shell.current?.focus();if(lock)engine.current?.focus();}
 function addNote(id:NoteId){
   const has=cfg.current.p.notes.includes(id);
   if(!has){progress(prev=>({...prev,notes:[...prev.notes,id],badge:id==='records'?true:prev.badge}));audio.current?.sound('switch');}
   open(id);
 }
 function interact(id:Id){
   const state=cfg.current.p;
   if(panelRef.current!==null)return;
   if(id.startsWith('door-')){
     const door=id as DoorId;
     const opened=state.doors.includes(door);
     if(opened&&engine.current?.obstructs(door)){showMessage('Afaste-se da porta para fechá-la.');return;}
     progress(v=>({...v,doors:opened?v.doors.filter(d=>d!==door):[...v.doors,door]}));audio.current?.sound('door');return;
   }
   if(id in entries){addNote(id as NoteId);return;}
   if(id in extras){const extra=id as ExtraId;if(state.extras.includes(extra))open(extras[extra].evidence);else open(extra);return;}
   switch(id){
     case 'archiveGate':if(!state.archive)open('code');break;
     case 'serviceGate':
       if(!state.badge){showMessage('O leitor exige um crachá de manutenção.');audio.current?.sound('bad');}
       else{progress(v=>({...v,service:true}));audio.current?.sound('switch');showMessage('Crachá aceito. Sala Elétrica liberada.');}break;
     case 'breakers':if(!state.power)open('power');else showMessage('A energia de emergência está ligada.');break;
     case 'exit':if(!state.power){showMessage('Sem energia. O painel não responde.');audio.current?.sound('bad');}else if(!state.exit)open('protocol');break;
     case 'safe':showMessage('A Recepção é um lugar seguro.');break;
   }
 }
 useEffect(()=>{
   if(!host.current)return;
   const a=createAudio();audio.current=a;a.mute(cfg.current.muted);
   try{
     const g=launch(host.current,()=>cfg.current,{
       near:setNear,action:interact,status:showMessage,pause:()=>open('pause'),step:(sprint,pan)=>a.sound(sprint?'run':'step',pan),
       chased:()=>{a.chase(true);a.sound('chase',-.37);progress(v=>({...v,chases:v.chases+1}));},
       caught:()=>{a.chase(false);a.sound('caught');open('caught');},
       escaped:()=>{a.chase(false);a.sound('win');progress(v=>({...v,won:true}));open('won');},
     });engine.current=g;setReady(true);
     return()=>{engine.current=null;g.destroy();a.close();window.clearTimeout(noticeTimer.current);};
   }catch(e){console.error(e);open('unavailable');return()=>{a.close();window.clearTimeout(noticeTimer.current);};}
 },[session]);
 useEffect(()=>{
   function handle(e:KeyboardEvent){
     if(e.repeat)return;
     const current=panelRef.current;
     if(e.code==='Escape'&&current!=='intro'&&current!=='caught'&&current!=='won'&&current!=='unavailable'){
       e.preventDefault();if(current===null)open('pause');else returnPlay(false);return;
     }
     if((current===null||current==='journal')&&e.code==='KeyJ'){e.preventDefault();if(current==='journal')returnPlay(false);else open('journal');}
     if(current===null&&e.code==='KeyF'){e.preventDefault();setFlash(v=>{audio.current?.sound('switch');return !v;});}
   }
   window.addEventListener('keydown',handle);return()=>window.removeEventListener('keydown',handle);
 },[]);
 useEffect(()=>{if(panel&&panel!=='code')dialog.current?.focus();},[panel]);
 useEffect(()=>{audio.current?.mute(mute);save('mute',mute);},[mute]);
 useEffect(()=>{save('reduce',reduce);},[reduce]);
 function restart(){open('intro');setP(initial());setFlash(true);setNear(null);setReady(false);setMessage('');setSession(v=>v+1);}
 function enterCode(e:FormEvent){e.preventDefault();if(code!=='0317'){audio.current?.sound('bad');setError('Acesso negado. Revise o registro da Recepção.');setCode('');return;}progress(v=>({...v,archive:true}));audio.current?.sound('switch');showMessage('Trava do Arquivo liberada.');returnPlay(false);}
 function choose(name:string,kind:'power'|'protocol'){
   const next=[...sequence,name];setError('');setSequence(next);audio.current?.sound('switch');if(next.length<3)return;
   const target=kind==='power'?'Corredor,Campainha,Interfone':'Olho,Sino,Cruz';
   if(next.join(',')!==target){audio.current?.sound('bad');setError(kind==='power'?'Sobrecarga. Verifique a ordem de serviço.':'Ordem rejeitada. Leia a inscrição sob a luz vermelha.');setSequence([]);return;}
   progress(v=>({...v,[kind==='power'?'power':'exit']:true}));
   if(kind==='power')showMessage('Energia de emergência restaurada. Algo mudou lá fora.');
   returnPlay(false);
 }
 function solveExtra(id:ExtraId){
   const result=extras[id];
   progress(v=>({...v,extras:[...v.extras,id],notes:[...v.notes,result.evidence]}));
   audio.current?.sound('switch');showMessage(result.solved);open(result.evidence);
 }
 const site=sites.find(s=>s.id===near);
 const nearLabel=near?.startsWith('door-')?`${p.doors.includes(near as DoorId)?'Fechar':'Abrir'}: ${site?.name}`:site?.name;
 const optionalPanel=panel&&panel in extras?panel as ExtraId:null;
 const note=panel&&panel in entries ? entries[panel as NoteId]:null;
 const section = panel==='intro'?'00 / PRÉ-ADMISSÃO':panel==='code'?'01 / RESTRITO':panel==='power'?'02 / MANUTENÇÃO':panel==='protocol'?'03 / EVACUAÇÃO':'HSD / TERMINAL LOCAL';
 return <div className={'game-shell'+(reduce?' reduce-fx':'')} ref={shell} tabIndex={-1}>
   <div className="stage" ref={host} /><div className="game-noise" aria-hidden="true"/><div className="game-vignette" aria-hidden="true"/>
   <div className="hud-top"><div><span className="hud-id"><Cross size={13}/> HSD // ALA 00</span><span className="hud-case">PACIENTE 014</span></div><div className="hud-nav"><button onClick={()=>setMute(v=>!v)} aria-label={mute?'Ativar som':'Silenciar som'} title={mute?'Ativar som':'Silenciar som'}>{mute?<VolumeX size={17}/>:<Volume2 size={17}/>}</button>{panel===null&&<button onClick={()=>open('pause')} aria-label="Pausar jogo">ESC</button>}</div></div>
   {panel===null&&<><div className="target" aria-hidden="true"/><output className="game-status">{message}</output><div className="chase-alert"><TriangleAlert size={15}/> PRESENÇA DETECTADA</div>
   {near&&<button className="near-action" onClick={()=>interact(near)}><kbd>E</kbd> {nearLabel}</button>}
   <div className="hud-bottom"><div className="hud-objective"><span>OBJETIVO ATUAL</span><strong>{objective(p)}</strong></div><div className="hud-vitals"><span><Footprints size={14}/> FÔLEGO</span><i/></div><div className="hud-inventory">{p.badge&&<span title="Crachá da Sala Elétrica"><KeyRound size={15}/></span>}<button onClick={()=>open('journal')} title="Pistas (J)"><BookOpen size={16}/> <kbd>J</kbd></button><button className={flash?'active':''} onClick={()=>setFlash(v=>!v)} title="Lanterna (F)"><Flashlight size={16}/> <kbd>F</kbd></button></div></div></>}
   {panel&&<div className={'game-overlay '+(panel==='caught'?'is-caught':'')}>
    <dialog open ref={dialog} className="game-panel" key={panel} tabIndex={-1} aria-modal="true" aria-label={section}>
      <div className="terminal-line"><span><Cross size={13}/> {section}</span>{!['intro','caught','won','unavailable'].includes(panel)&&<button className="icon-button" aria-label="Fechar e voltar ao jogo" onClick={()=>returnPlay()}><X size={16}/></button>}</div>
      {panel==='intro'&&<><span className="terminal-tag">HOSPITAL SANTA DÁLIA</span><h1>Ala Zero</h1><p>Você acorda no leito 04 às 03:17. As outras camas estão vazias. Encontre uma saída. Use E nas portas comuns; os anexos da Enfermaria e da Ala Cirúrgica são opcionais.</p><div className="start-keys"><span><kbd>WASD</kbd> andar</span><span><kbd>MOUSE</kbd> olhar</span><span><kbd>SHIFT</kbd> correr</span><span><kbd>E</kbd> interagir</span><span><kbd>F</kbd> lanterna</span><span><kbd>J</kbd> pistas</span></div><p className="game-help">Se o mouse não for capturado, arraste a cena ou use as setas para olhar. Jogue com teclado e mouse.</p><div className="terminal-buttons"><button className="terminal-ghost" onClick={onExit}><ArrowLeft size={16}/> Arquivo</button><button className="terminal-primary" disabled={!ready} onClick={()=>returnPlay()}>{ready?'Acordar':'Carregando ala…'} <ArrowRight size={16}/></button></div></>}
      {panel==='pause'&&<><h2>Plantão suspenso</h2><p>WASD para andar, mouse ou setas para olhar, Shift para correr. E interage, F alterna a lanterna e J abre as pistas.</p><div className="settings"><button onClick={()=>setMute(v=>!v)}>{mute?<VolumeX size={16}/>:<Volume2 size={16}/>} Som <b>{mute?'DESATIVADO':'ATIVADO'}</b></button><button onClick={()=>setReduce(v=>!v)}><Power size={16}/> Reduzir efeitos <b>{reduce?'SIM':'NÃO'}</b></button><button onClick={restart}><RotateCcw size={16}/> Reiniciar partida</button></div><div className="terminal-buttons"><button className="terminal-ghost" onClick={onExit}><ArrowLeft size={16}/> Arquivo</button><button className="terminal-primary" onClick={()=>returnPlay()}>Continuar <ArrowRight size={16}/></button></div></>}
      {note&&<><span className="terminal-tag">EVIDÊNCIA ARQUIVADA</span><h2>{note.title}</h2><blockquote>{note.body}</blockquote><p className="hint">{note.tip}</p><div className="terminal-buttons"><button className="terminal-ghost" onClick={()=>open('journal')}><BookOpen size={16}/> Todas as pistas</button><button className="terminal-primary" onClick={()=>returnPlay()}>Guardar e voltar <ArrowRight size={16}/></button></div></>}
      {optionalPanel&&<OptionalPuzzle id={optionalPanel} onSolve={()=>solveExtra(optionalPanel)} onJournal={()=>open('journal')} onWrong={()=>audio.current?.sound('bad')} />}
      {panel==='journal'&&<><h2>Caderno de pistas</h2><p className="journal-summary">{p.extras.length} / 3 anexos opcionais recuperados</p>{p.notes.length===0?<p>Não há registros. Procure fichas, prontuários e inscrições.</p>:<div className="journal-list">{p.notes.map(id=><button key={id} onClick={()=>open(id)}><BookOpen size={15}/> {entries[id].title}{!['bed','reception','records','redSign'].includes(id)&&<em>OPCIONAL</em>}<ArrowRight size={15}/></button>)}</div>}<div className="terminal-buttons solo"><button className="terminal-primary" onClick={()=>returnPlay()}>Voltar <ArrowRight size={16}/></button></div></>}
      {panel==='code'&&<><h2>Arquivo</h2><p>Digite o código de acesso de quatro dígitos.</p><form onSubmit={enterCode}><label className="code-label">CÓDIGO DE ACESSO<input autoFocus aria-label="Código de acesso" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="––––" maxLength={4} inputMode="numeric" pattern="[0-9]{4}" required autoComplete="off" /></label>{error&&<p className="terminal-error" role="alert">{error}</p>}<div className="terminal-buttons"><button type="button" className="terminal-ghost" onClick={()=>open('journal')}><BookOpen size={16}/> Pistas</button><button className="terminal-primary" type="submit">Liberar <ArrowRight size={16}/></button></div></form></>}
      {(panel==='power'||panel==='protocol')&&<><h2>{panel==='power'?'Quadro elétrico':'Painel de evacuação'}</h2><p>{panel==='power'?'Ligue os três circuitos na ordem da instrução de manutenção.':'Acione os três símbolos na ordem do protocolo de emergência.'}</p><div className="sequence" aria-live="polite">{[0,1,2].map(i=><span key={i}>{sequence[i]||'0'+(i+1)}</span>)}</div><div className="choices">{panel==='power'?switches.map(name=><button key={name} onClick={()=>choose(name,'power')} disabled={sequence.includes(name)}><Power size={17}/>{name}</button>):symbols.map(({name,Icon})=><button key={name} onClick={()=>choose(name,'protocol')} disabled={sequence.includes(name)}><Icon size={21}/>{name}</button>)}</div>{error&&<p className="terminal-error" role="alert">{error}</p>}<div className="terminal-buttons"><button className="terminal-ghost" onClick={()=>open('journal')}><BookOpen size={16}/> Pistas</button><button className="terminal-ghost" onClick={()=>setSequence([])}><RotateCcw size={15}/> Limpar ordem</button></div></>}
      {panel==='caught'&&<><span className="terminal-tag danger">OCORRÊNCIA / NOVA ADMISSÃO</span><h2>Ela alcançou você.</h2><p>Você ainda consegue ouvir a respiração dela. Volte do último ponto seguro; suas pistas e os enigmas resolvidos foram mantidos.</p><div className="terminal-buttons"><button className="terminal-ghost" onClick={onExit}><ArrowLeft size={16}/> Arquivo</button><button className="terminal-primary" onClick={()=>{engine.current?.resetPosition(p);returnPlay();}}>Tentar de novo <RotateCcw size={16}/></button></div></>}
      {panel==='won'&&<><span className="terminal-tag">03:18 / ALTA REGISTRADA</span><h2>Você saiu.</h2><p>A porta finalmente cede. Atrás de você, a campainha do leito 04 toca uma última vez.</p><div className="results"><span>03 / 03 ENIGMAS</span><span>{String(p.extras.length).padStart(2,'0')} / 03 ANEXOS OPCIONAIS</span></div><div className="terminal-buttons"><button className="terminal-ghost" onClick={restart}><RotateCcw size={16}/> Jogar de novo</button><button className="terminal-primary" onClick={onExit}>Voltar ao arquivo <ArrowRight size={16}/></button></div></>}
      {panel==='unavailable'&&<><h2>Sem sinal.</h2><p>O navegador não conseguiu iniciar o 3D. Verifique se o WebGL está disponível e a aceleração gráfica está ativada.</p><div className="terminal-buttons solo"><button className="terminal-primary" onClick={onExit}><ArrowLeft size={16}/> Arquivo</button></div></>}
    </dialog>
   </div>}
 </div>;
}
