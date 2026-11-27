import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, AudioLines, Cross, FileText, Gamepad2, Headphones, Keyboard, Mouse, Play, TriangleAlert, X } from 'lucide-react';
import '../game/ala.css';

const Game = lazy(() => import('../game/game'));
const cards = [
  { id: 'entrar', count: '01', label: 'Iniciar jogo', tag: 'ACESSO LIBERADO', alt: 'Corredor vazio do Hospital Santa Dália' },
  { id: 'hospital', count: '02', label: 'O hospital', tag: 'SETOR 00', alt: 'Cadeira de rodas abandonada' },
  { id: 'registro', count: '03', label: 'Prontuários', tag: 'ARQUIVO INTERNO', alt: 'Fotografias e pastas médicas sobre uma mesa' },
  { id: 'controles', count: '04', label: 'Controles', tag: 'PROTOCOLO DO JOGADOR', alt: 'Lâmpada cirúrgica sobre uma maca' },
  { id: 'aviso', count: '05', label: 'Avisos', tag: 'ATENÇÃO', alt: 'Silhueta no fim de um corredor' },
] as const;
type ModalId = 'registro' | 'controles' | 'aviso';

function DossierModal({ id, close, play }: { id: ModalId; close: () => void; play: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  const item = cards.find(card => card.id === id)!;
  return <dialog ref={dialog} className="archive-modal" onCancel={event => { event.preventDefault(); close(); }} aria-labelledby="dossier-title">
    <div className="archive-inner">
      <div className="modal-line"><span>HSD / ANEXO {item.count}</span><button className="icon-button" onClick={close} aria-label="Fechar"><X size={19} /></button></div>
      <h2 id="dossier-title">{item.label}</h2>
      {id === 'registro' && <><p className="file-kicker"><FileText size={15} /> PACIENTE 014 · PLANTÃO DA MADRUGADA</p><blockquote>“A paciente diz ouvir passos no corredor. Quando olha, os seus próprios passos continuam.”</blockquote><p>Às 03:17, a central recebeu uma ligação da Ala Zero. A ala estava desativada havia onze anos.</p><p className="redacted">Distribuição restrita à equipe de plantão.</p></>}
      {id === 'controles' && <><p>Jogue no computador com teclado e mouse. Se o cursor não puder ser capturado na prévia, arraste a cena ou use as setas para olhar.</p><dl className="controls-list"><div><dt><Keyboard size={17} /> WASD</dt><dd>Andar</dd></div><div><dt><Mouse size={17} /> Mouse / setas</dt><dd>Olhar</dd></div><div><dt><kbd>SHIFT</kbd></dt><dd>Correr</dd></div><div><dt><kbd>E</kbd></dt><dd>Interagir / abrir portas</dd></div><div><dt><kbd>F</kbd></dt><dd>Lanterna</dd></div><div><dt><kbd>J</kbd></dt><dd>Ver pistas</dd></div><div><dt><kbd>ESC</kbd></dt><dd>Pausar / fechar</dd></div></dl></>}
      {id === 'aviso' && <><p className="file-kicker"><TriangleAlert size={16} /> AVISO DE CONTEÚDO</p><p>O jogo contém perseguições, sustos sonoros, ambientes escuros e luzes que oscilam. Não há combate.</p><p>Você pode desativar o som e reduzir as oscilações de luz no menu de pausa.</p></>}
      <div className="modal-actions"><button onClick={close} className="small-link">Voltar ao arquivo</button><button onClick={play} className="ink-button"><Play size={14} fill="currentColor" /> Iniciar jogo</button></div>
    </div>
  </dialog>;
}

export default function Index() {
  const [mode, setMode] = useState(false);
  const [modal, setModal] = useState<ModalId | null>(null);
  const play = () => { setModal(null); setMode(true); };
  if (mode) return <Suspense fallback={<div className="loading-game">ESTABELECENDO CONTATO COM A ALA ZERO...</div>}><Game onExit={() => setMode(false)} /></Suspense>;
  return <main className="archive-page">
    <section className="archive-hero paper">
      <div className="wrap">
        <header className="mastline"><a href="#inicio" className="hospital-logo"><span className="cross-mark"><Cross size={14} strokeWidth={3} /></span> HOSPITAL SANTA DÁLIA</a><span className="mast-center">ARQUIVO DE INCIDENTES &nbsp;//&nbsp; ALA 00</span><span className="classification"><i /> ACESSO RESTRITO</span></header>
        <div className="masthead" id="inicio">
          <div className="title-block"><div className="overline"><span></span> SIMULAÇÃO / TERROR PSICOLÓGICO</div><h1>Ala Zero</h1><p className="case-id">CASO N.º 00-1998 <i /> CÓPIA DE ARQUIVO</p></div>
          <div className="intro"><p className="intro-line">Você acorda em um hospital que deveria estar vazio.</p><p>As portas foram trancadas por dentro. Vasculhe os prontuários, decifre os enigmas e encontre uma saída antes que a ala perceba que você está acordado.</p><span className="intro-sign"><span /> 3D LOW-POLY &nbsp;/&nbsp; ESTÉTICA PSX</span></div>
        </div>
        <nav className="gallery" aria-label="Arquivo do hospital">
          {cards.map(item => <button key={item.id} className={'gallery-card '+(item.id==='entrar' ? 'is-play' : '')} onClick={() => item.id === 'entrar' ? play() : item.id === 'hospital' ? document.getElementById('hospital')?.scrollIntoView({behavior:'smooth'}) : setModal(item.id)}>
            <span className="gallery-image"><img src={'/images/'+item.id+'.webp'} alt={item.alt} /><span className="card-number">FIG. {item.count}</span>{item.id==='entrar' && <span className="play-icon"><Play fill="currentColor" size={21}/></span>}<span className="image-tag">{item.tag}</span></span>
            <span className="gallery-label">{item.label}{item.id==='hospital' ? <ArrowDown size={16} /> : item.id==='entrar' ? <ArrowRight size={18} /> : <ArrowUpRight size={16} />}</span>
          </button>)}
        </nav>
        <div className="meta-ribbon"><span><i /> DEMO JOGÁVEL</span><span><Gamepad2 size={15} /> PC / NAVEGADOR</span><span className="meta-headphones"><Headphones size={15} /> FONES RECOMENDADOS</span><span className="meta-right">REGISTRO Nº 00-1998</span></div>
      </div>
    </section>
    <section className="dossier paper" id="hospital">
      <div className="wrap">
        <div className="section-line"><span>01 / O LOCAL</span><span>DOCUMENTO DESCLASSIFICADO</span></div>
        <div className="dossier-top"><h2>O Hospital</h2><p>O último plantão do Hospital Santa Dália terminou às 03:17. Nenhum dos funcionários se lembra de ter saído.</p></div>
        <div className="dossier-content">
          <figure><img src="/images/hospital.webp" alt="Registro fotográfico da enfermaria desativada"/><figcaption>FIG. 02-A / CORREDOR DA ENFERMARIA</figcaption></figure>
          <div className="dossier-report"><span className="red-stamp">INTERDITADO</span><h3>Não siga os passos.</h3><p>O arquivo ainda guarda o que sobrou da ala: prontuários trocados, circuitos isolados e uma saída de emergência fora do mapa. Alguém riscou a palavra <em>alta</em> da sua ficha.</p><p>Leia, escute e preste atenção ao voltar pelo mesmo caminho. Se os passos acelerarem, corra.</p><p>Explore a Enfermaria e a Ala Cirúrgica: as portas comuns abrem com E e escondem três enigmas opcionais.</p><button className="ink-button" onClick={play}><Play size={14} fill="currentColor"/> Entrar na Ala Zero <ArrowRight size={16}/></button></div>
        </div>
      </div>
    </section>
    <footer className="archive-footer"><div className="wrap"><span><AudioLines size={15} /> HOSPITAL SANTA DÁLIA / FIM DO ARQUIVO</span><button onClick={() => setModal('aviso')}>Avisos de conteúdo <ArrowUpRight size={14} /></button></div></footer>
    {modal && <DossierModal id={modal} close={() => setModal(null)} play={play} />}
  </main>;
}
