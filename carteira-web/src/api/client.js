import { loadState, saveState, localState } from '../lib/cloudStore';
const DB_KEY = 'carteira-invest-v1';

const defaults = {
  config: { saldoTotal: 0, aporteMensal: 500, prazoAnos: 10, considerarImposto: false },
  ativos: [
    { id:'tesouro-selic', nome:'Tesouro Selic', categoria:'tesouro', taxaAnual:10.5, percentual:40, aliquota:15, cor:'#0284c7', descricao:'Renda fixa pública', investido:0 },
    { id:'cdb', nome:'CDB', categoria:'cdb', taxaAnual:11, percentual:30, aliquota:15, cor:'#22c55e', descricao:'Renda fixa bancária', investido:0 },
    { id:'fii', nome:'Fundos Imobiliários', categoria:'fii', taxaAnual:9, percentual:20, aliquota:20, cor:'#8b5cf6', descricao:'Fundos imobiliários', investido:0 },
    { id:'acoes', nome:'Ações', categoria:'acao', taxaAnual:12, percentual:10, aliquota:15, cor:'#f59e0b', descricao:'Renda variável', investido:0 },
  ]
};

const clone = (x) => JSON.parse(JSON.stringify(x));
function load(){ const root=localState(); const x=root[DB_KEY]; return x?.config&&Array.isArray(x?.ativos)?clone(x):clone(defaults); }
async function hydrate(){ const root=await loadState(); const x=root[DB_KEY]; return x?.config&&Array.isArray(x?.ativos)?clone(x):clone(defaults); }
async function save(db){ const root=await loadState(); await saveState({...root,[DB_KEY]:db}); }
const num = (v,d=0) => Number.isFinite(Number(v)) ? Number(v) : d;
const wait = (v) => Promise.resolve(clone(v));
function normalizeAtivo(a){ return {...a, taxaAnual:num(a.taxaAnual), percentual:num(a.percentual), aliquota:num(a.aliquota), investido:num(a.investido)}; }

function simulate(dados={}){
  const db=load(); const cfg={...db.config,...dados}; const ativos=db.ativos.map(normalizeAtivo);
  const saldo=num(cfg.saldo, num(cfg.saldoTotal)); const aporte=Math.max(0,num(cfg.aporteMensal)); const anos=Math.max(1,Math.min(50,num(cfg.prazoAnos,10))); const meses=Math.round(anos*12);
  const totalPeso=ativos.reduce((s,a)=>s+Math.max(0,a.percentual),0);
  const taxaPonderada=totalPeso ? ativos.reduce((s,a)=>s+a.taxaAnual*Math.max(0,a.percentual),0)/totalPeso : 0;
  const taxaMensal=Math.pow(1+taxaPonderada/100,1/12)-1;
  let bruto=saldo; const pontos=[];
  for(let m=0;m<=meses;m++){
    if(m>0) bruto=bruto*(1+taxaMensal)+aporte;
    if(m===0 || m%12===0 || m===meses){
      const investido=saldo+aporte*m; const rendimento=Math.max(0,bruto-investido); const imposto=cfg.considerarImposto ? rendimento*0.15 : 0;
      pontos.push({data:m===0?'Hoje':`${Math.round(m/12)} ano${m===12?'':'s'}`, investido, bruto, liquido:bruto-imposto});
    }
  }
  const totalInvestido=saldo+aporte*meses, rendimentoBruto=Math.max(0,bruto-totalInvestido);
  const aliqMedia=totalPeso ? ativos.reduce((s,a)=>s+a.aliquota*Math.max(0,a.percentual),0)/totalPeso/100 : .15;
  const imposto=cfg.considerarImposto?rendimentoBruto*aliqMedia:0;
  const porAtivo=ativos.map(a=>{
    const peso=totalPeso?Math.max(0,a.percentual)/totalPeso:0; const ini=saldo?peso*saldo:num(a.investido); const ap=aporte*peso; const tm=Math.pow(1+a.taxaAnual/100,1/12)-1; let b=ini; for(let m=1;m<=meses;m++) b=b*(1+tm)+ap; return {ativoId:a.id, bruto:b};
  });
  return {taxaPonderada, rendimentoAnualEstimado:saldo*taxaPonderada/100, rendimentoMensalEstimado:saldo*taxaMensal, pontos, porAtivo, resumo:{totalInvestido,valorBruto:bruto,valorLiquido:bruto-imposto,rendimentoBruto,rendimentoLiquido:rendimentoBruto-imposto}};
}

export const api = {
  getAtivos:async()=>{const db=await hydrate(); return clone(db.ativos.map(normalizeAtivo));},
  criarAtivo:async(dados)=>{const db=await hydrate(); const a=normalizeAtivo({...dados,id:`ativo-${Date.now()}`,investido:0}); db.ativos.push(a); await save(db); return clone(a);},
  atualizarAtivo:async(id,dados)=>{const db=await hydrate(); const i=db.ativos.findIndex(a=>a.id===id); if(i<0) throw new Error('Ativo não encontrado.'); db.ativos[i]=normalizeAtivo({...db.ativos[i],...dados,id}); await save(db); return clone(db.ativos[i]);},
  excluirAtivo:async(id)=>{const db=await hydrate(); const a=db.ativos.find(x=>x.id===id); if(!a) throw new Error('Ativo não encontrado.'); db.ativos=db.ativos.filter(x=>x.id!==id); db.config.saldoTotal=db.ativos.reduce((s,x)=>s+num(x.investido),0); await save(db); return {ok:true};},
  aplicar:async(ativoId,valor)=>{const db=await hydrate(); const a=db.ativos.find(x=>x.id===ativoId); if(!a) throw new Error('Ativo não encontrado.'); const v=num(valor); if(v<=0) throw new Error('Valor inválido.'); a.investido=num(a.investido)+v; db.config.saldoTotal=db.ativos.reduce((s,x)=>s+num(x.investido),0); await save(db); return {ativo:clone(normalizeAtivo(a)),config:clone(db.config)};},
  retirar:async(ativoId,valor)=>{const db=await hydrate(); const a=db.ativos.find(x=>x.id===ativoId); if(!a) throw new Error('Ativo não encontrado.'); const v=num(valor); if(v<=0||v>num(a.investido)) throw new Error('Valor de retirada inválido.'); a.investido-=v; db.config.saldoTotal=db.ativos.reduce((s,x)=>s+num(x.investido),0); await save(db); return {ativo:clone(normalizeAtivo(a)),config:clone(db.config)};},
  getConfig:async()=>clone((await hydrate()).config),
  atualizarConfig:async(dados)=>{const db=await hydrate(); db.config={...db.config,...dados,saldoTotal:db.config.saldoTotal}; await save(db); return clone(db.config);},
  simular:async(dados)=>{await hydrate(); return clone(simulate(dados));},
};
