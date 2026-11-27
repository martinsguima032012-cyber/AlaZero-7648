import { doors, type DoorId, type ExtraId } from './expansion';

export type Id = DoorId | ExtraId | NoteId | 'bed' | 'reception' | 'archiveGate' | 'records' | 'serviceGate' | 'breakers' | 'redSign' | 'exit' | 'safe';
export const sites: { id: Id; name: string; x: number; z: number; range?: number; local?:boolean }[] = [
  {id:'bed',name:'Ficha ao lado da cama',x:1.25,z:10.1},
  {id:'reception',name:'Relatório de troca de acesso',x:6.9,z:3.65},
  {id:'archiveGate',name:'Teclado do Arquivo',x:-2.26,z:-3},
  {id:'records',name:'Pasta de manutenção',x:-6.7,z:-3.1},
  {id:'serviceGate',name:'Leitor da Sala Elétrica',x:2.26,z:-9},
  {id:'breakers',name:'Quadro de disjuntores',x:7.85,z:-9},
  {id:'redSign',name:'Inscrição sob luz de emergência',x:-2.22,z:-10.8},
  {id:'exit',name:'Painel de evacuação',x:0,z:-16.2},
  {id:'safe',name:'Abrigo — Recepção',x:6.8,z:5.4,range:1.5},
  {id:'admissions',name:'Registro de admissões',x:6.65,z:9.28,local:true},
  {id:'triagePuzzle',name:'Fichário da Triagem',x:-6.6,z:2.94,local:true},
  {id:'calibration',name:'Folha de calibração',x:6.7,z:-1.03,local:true},
  {id:'xrayPuzzle',name:'Negatoscópio',x:16.2,z:-4.98,local:true},
  {id:'anesthesia',name:'Ficha de anestesia',x:16.05,z:-14.7,local:true},
  {id:'surgeryPuzzle',name:'Gravador cirúrgico',x:16.23,z:-8.5,local:true},
  ...doors.map(d=>({id:d.id,name:d.label,x:d.x,z:d.z,range:1.66})),
];
export const entries = {
  bed: {title:'Ficha de internação',body:'Paciente 014. Leito 04. Alta negada. A ala será evacuada em caso de uma segunda queda de energia.',tip:'A recepção fica à direita no corredor. Se alguém deixou um registro, deve estar lá.'},
  reception: {title:'Registro do último plantão',body:'QUEDA GERAL — 03:17. “Troquei o código do Arquivo pela hora em que as luzes caíram. Sem os dois-pontos.”',tip:'O Arquivo fica do outro lado do corredor, à esquerda. A Recepção serve de abrigo.'},
  records: {title:'Ordem de serviço 017',body:'“Rearme primeiro o circuito que guia os passos, depois o que chama a enfermagem e por último o que devolve as vozes.”',tip:'Corredor → Campainha → Interfone. Um crachá da Sala Elétrica estava preso à pasta.'},
  admissions: {title:'Registro de admissões',body:'Leito 014 — 02:46 · Leito 009 — 03:01 · Leito 021 — 02:12.',tip:'Anexo opcional: o fichário da Triagem fica do outro lado do corredor, depois da porta do Leito 04.'},
  calibration: {title:'Folha de calibração',body:'No painel da Radiologia, acenda apenas as casas marcadas com X. De cima para baixo: [X · X] / [· X ·] / [· · X].',tip:'Anexo opcional: passe pela porta Ala Cirúrgica e procure a Radiologia.'},
  anesthesia: {title:'Ficha de anestesia',body:'03:08 — início da gravação. 03:25 — a fita arrebenta. O trecho útil vai do primeiro horário ao segundo.',tip:'Anexo opcional: o gravador fica no Centro Cirúrgico, vizinho à Recuperação.'},
  triageFilm: {title:'Anexo 01 — A fila',body:'As três fichas trazem o mesmo retrato, tirado em datas diferentes. No verso da última alguém escreveu: “Se ela perguntar seu nome, não responda.”',tip:'Evidência opcional recuperada na Triagem.'},
  xrayFilm: {title:'Anexo 02 — A chapa dupla',body:'O exame mostra duas colunas vertebrais sobrepostas. No envelope, em tinta seca: “O segundo paciente não estava na mesa.”',tip:'Evidência opcional recuperada na Radiologia.'},
  surgeryTape: {title:'Anexo 03 — Fita 00',body:'03:17. A luz cai. No escuro alguém bate do lado de dentro do gravador. A última voz é a sua: “Ainda não me deram alta.”',tip:'Evidência opcional recuperada no Centro Cirúrgico.'},
  redSign: {title:'Inscrição na parede',body:'“Se você ainda vê as placas, não é tarde. No painel da saída: 1. olho. 2. sino. 3. cruz.”',tip:'O painel de evacuação fica no fim do corredor. Não pare para olhar para trás.'},
};
export type NoteId = keyof typeof entries;
export type Progress = { archive:boolean; badge:boolean; service:boolean; power:boolean; exit:boolean; notes:NoteId[]; doors:DoorId[]; extras:ExtraId[]; chases:number; won:boolean };
export const initial = ():Progress => ({ archive:false,badge:false,service:false,power:false,exit:false,notes:[],doors:['door-reception'],extras:[],chases:0,won:false });
export function objective(p:Progress) {
  if(!p.notes.includes('reception') && !p.archive) return 'Investigue a recepção.';
  if(!p.archive) return 'Descubra o código do Arquivo.';
  if(!p.badge) return 'Revire os prontuários no Arquivo.';
  if(!p.power) return 'Religue a energia na Sala Elétrica.';
  if(!p.notes.includes('redSign') && !p.exit) return 'Procure o protocolo sob a luz vermelha.';
  if(!p.exit) return 'Destrave o painel de evacuação.';
  return 'Atravesse a saída.';
}
