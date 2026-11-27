import { useState } from 'react';
import { ArrowRight, BookOpen, Check, RotateCcw, X } from 'lucide-react';
import { extras, type ExtraId } from './expansion';

const stickers=['014','009','021'];
const correctGrid=[0,2,4,8];

export default function OptionalPuzzle({id,onSolve,onJournal,onWrong}:{id:ExtraId;onSolve:()=>void;onJournal:()=>void;onWrong:()=>void}){
 const [selected,setSelected]=useState<string[]>([]),[tiles,setTiles]=useState<number[]>([]),[minutes,setMinutes]=useState(''),[failed,setFailed]=useState(false);
 const entry=extras[id];
 const reset=()=>{setSelected([]);setTiles([]);setMinutes('');setFailed(false);};
 function confirm(){
   const ok=id==='triagePuzzle'?selected.join(',')==='021,014,009':id==='xrayPuzzle'?tiles.length===4&&correctGrid.every(i=>tiles.includes(i)):Number(minutes)===17;
   if(ok)onSolve();else{setFailed(true);onWrong();}
 }
 return <>
   <span className="terminal-tag">EVIDÊNCIA OPCIONAL</span><h2>{entry.title}</h2><p>{entry.description}</p>
   <form onSubmit={e=>{e.preventDefault();confirm();}}>
     {id==='triagePuzzle'&&<><div className="sequence" aria-live="polite">{[0,1,2].map(i=><span key={i}>{selected[i]||`#${i+1}`}</span>)}</div><div className="choices">{stickers.map(n=><button type="button" key={n} disabled={selected.includes(n)} onClick={()=>{setFailed(false);setSelected([...selected,n]);}}>Leito {n}</button>)}</div></>}
     {id==='xrayPuzzle'&&<fieldset className="xray-grid" aria-label="Grade de chapas">{Array.from({length:9},(_,i)=><button type="button" key={i} aria-label={`Linha ${Math.floor(i/3)+1}, coluna ${i%3+1}`} aria-pressed={tiles.includes(i)} onClick={()=>{setFailed(false);setTiles(tiles.includes(i)?tiles.filter(v=>v!==i):[...tiles,i]);}}>{tiles.includes(i)?<X size={20}/>:<span>·</span>}</button>)}</fieldset>}
     {id==='surgeryPuzzle'&&<label className="code-label">DURAÇÃO DO TRECHO (MINUTOS)<input aria-label="Minutos" value={minutes} onChange={e=>{setFailed(false);setMinutes(e.target.value.replace(/\D/g,'').slice(0,2));}} placeholder="00" inputMode="numeric" required autoComplete="off" /></label>}
     {failed&&<p className="terminal-error" role="alert">{entry.error}</p>}
     <div className="terminal-buttons optional-buttons"><button type="button" className="terminal-ghost" onClick={onJournal}><BookOpen size={16}/> Pistas</button><button type="button" className="terminal-ghost" onClick={reset}><RotateCcw size={15}/> Limpar</button><button className="terminal-primary" type="submit" disabled={id==='triagePuzzle'&&selected.length<3}>{id==='surgeryPuzzle'?<ArrowRight size={16}/>:<Check size={16}/>} {id==='surgeryPuzzle'?'Recuperar':'Confirmar'}</button></div>
   </form>
 </>;
}
