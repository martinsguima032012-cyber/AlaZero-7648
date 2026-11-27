export type ExtraId = 'triagePuzzle'|'xrayPuzzle'|'surgeryPuzzle';
export type DoorId = `door-${string}`;
export type SideRoom = { tag:string; label:string; x0:number;x1:number; a:number;b:number; z:number; wallX:number; style:string };
export const rooms:SideRoom[]=[
 {tag:'04',label:'Leito 04',x0:-8.5,x1:-2.54,a:6.05,b:11.89,z:8.55,wallX:-2.54,style:'ward'},
 {tag:'05',label:'Enfermaria',x0:2.54,x1:8.5,a:7.22,b:11.89,z:9.08,wallX:2.54,style:'ward'},
 {tag:'06',label:'Triagem',x0:-8.5,x1:-2.54,a:.28,b:5.82,z:2.9,wallX:-2.54,style:'triage'},
 {tag:'07',label:'Sala de Visitas',x0:2.54,x1:8.5,a:-2.62,b:.78,z:-.88,wallX:2.54,style:'visits'},
 {tag:'AC',label:'Ala Cirúrgica',x0:2.54,x1:8.54,a:-5.84,b:-2.83,z:-4.32,wallX:2.54,style:'passage'},
 {tag:'08',label:'Sala de Isolamento',x0:-8.5,x1:-2.54,a:-9.78,b:-6.23,z:-7.85,wallX:-2.54,style:'isolation'},
 {tag:'10',label:'Observação',x0:-8.5,x1:-2.54,a:-16.85,b:-11.31,z:-13.64,wallX:-2.54,style:'ward'},
 {tag:'11',label:'Esterilização',x0:2.54,x1:8.54,a:-16.77,b:-12.22,z:-14.35,wallX:2.54,style:'sterile'},
 {tag:'RX',label:'Radiologia',x0:12.08,x1:17.7,a:-7.12,b:-2.84,z:-4.95,wallX:12.08,style:'xray'},
 {tag:'C1',label:'Centro Cirúrgico',x0:12.08,x1:17.7,a:-12.41,b:-7.39,z:-9.82,wallX:12.08,style:'surgery'},
 {tag:'RC',label:'Recuperação',x0:12.08,x1:17.7,a:-16.76,b:-12.67,z:-14.73,wallX:12.08,style:'ward'},
];
export const doors: {id:DoorId; label:string; x:number;z:number;swing:number; color:string}[]=[
 ...rooms.map(r=>({id:`door-${r.tag}` as DoorId,label:r.label,x:r.wallX,z:r.z,swing:r.x1===r.wallX?-1:1,color:r.wallX>10?'surgery':'ward'})),
 {id:'door-reception',label:'Recepção',x:2.54,z:4,swing:1,color:'ward'},
 {id:'door-wing',label:'Corredor Cirúrgico',x:8.54,z:-4.32,swing:1,color:'surgery'},
 {id:'door-link',label:'Passagem de Serviço',x:8.54,z:-14.35,swing:1,color:'surgery'},
];
export const extras:Record<ExtraId,{ title:string; description:string; evidence:'triageFilm'|'xrayFilm'|'surgeryTape'; solved:string; error:string }>={
 triagePuzzle:{title:'Fila de admissão',description:'Organize as três fichas da primeira à última admissão. Os horários estão no registro da Enfermaria, do outro lado do corredor.',evidence:'triageFilm',solved:'A gaveta da Triagem destrancou.',error:'O carimbo não confere. Revise os horários de admissão.'},
 xrayPuzzle:{title:'Negatoscópio',description:'Acenda somente as chapas em que o símbolo aparece na folha de calibração.',evidence:'xrayFilm',solved:'A chapa foi revelada.',error:'Alinhamento incorreto. Compare as três linhas com a folha de calibração.'},
 surgeryPuzzle:{title:'Gravador cirúrgico',description:'Informe quantos minutos dura o trecho a recuperar. A ficha de anestesia está na Recuperação.',evidence:'surgeryTape',solved:'A fita cirúrgica voltou a tocar.',error:'Trecho incorreto. Calcule o intervalo entre os dois horários.'},
};
