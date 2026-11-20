import {useEffect,useMemo,useState} from 'react';
import {loadState,saveState,localState} from '../lib/cloudStore';
const KEY='carteira-financas-v2';
const months=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const receitaSeed=['Salário líquido','Benefícios / vale','Renda extra 01','Renda extra 02','Renda extra 03','Outras receitas'];
const gruposSeed={
 'ESSENCIAIS':['Moradia (aluguel/financiamento)','Condomínio','Supermercado','Água','Energia elétrica','Gás','Plano de saúde','Seguro','Transporte','Educação','Outras despesas essenciais'],
 'ESTILO DE VIDA':['Academia / esportes','Aplicativos / assinaturas','Celular / telefonia','Internet','Restaurantes / delivery','Lazer','Compras / roupas','Cuidados pessoais','Outros gastos variáveis'],
 'FINANCEIRO':['Cartão de crédito','Parcelamentos','Dívidas / acordos','Impostos / taxas']
};
const blank=()=>({receitas:receitaSeed.map((nome,i)=>({id:'r'+i,nome,valor:0})),despesas:Object.entries(gruposSeed).flatMap(([grupo,nomes])=>nomes.map((nome,i)=>({id:grupo+i,grupo,nome,valor:0}))) });
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const load=()=>localState()[KEY]||{};
export default function Financas({onPlan}){
 const now=new Date(); const [mes,setMes]=useState(now.getMonth()); const [ano,setAno]=useState(now.getFullYear());
 const [db,setDb]=useState(load); const [sync,setSync]=useState('Salvando em nuvem');
 useEffect(()=>{loadState().then(root=>setDb(root[KEY]||{})).catch(()=>setSync('Falha ao sincronizar'))},[]);
 const k=`${ano}-${String(mes+1).padStart(2,'0')}`; const data=db[k]||blank();
 const save=(next)=>{const n={...db,[k]:next};setDb(n);setSync('Salvando…'); const root=localState(); saveState({...root,[KEY]:n}).then(()=>setSync('Salvo na nuvem')).catch(()=>setSync('Salvo localmente; nuvem pendente'))};
 const edit=(tipo,id,valor)=>save({...data,[tipo]:data[tipo].map(x=>x.id===id?{...x,valor:Number(valor)}:x)});
 const add=(tipo,grupo)=>{const nome=prompt(tipo==='receitas'?'Nome da nova receita:':'Nome da nova despesa:');if(!nome)return;save({...data,[tipo]:[...data[tipo],{id:Date.now().toString(),nome,valor:0,...(grupo?{grupo}:{})}]})};
 const totals=useMemo(()=>{const entradas=data.receitas.reduce((a,x)=>a+(+x.valor||0),0), saidas=data.despesas.reduce((a,x)=>a+(+x.valor||0),0);return{entradas,saidas,sobra:entradas-saidas,taxa:entradas?((entradas-saidas)/entradas*100):0}},[data]);
 const nav=d=>{let m=mes+d,y=ano;if(m<0){m=11;y--}if(m>11){m=0;y++}setMes(m);setAno(y)};
 return <div className="budget-page">
  <div className="budget-top"><div><span className="eyebrow">ORGANIZAÇÃO FINANCEIRA</span><h2>Planilha Financeira Mensal</h2><p>Preencha como uma planilha. Os totais são automáticos e seus dados ficam vinculados à sua conta.</p><small className="cloud-status">☁ {sync}</small></div><div className="month-nav"><button onClick={()=>nav(-1)}>‹</button><strong>{months[mes]} {ano}</strong><button onClick={()=>nav(1)}>›</button></div></div>
  <div className="budget-grid">
   <section className="budget-sheet income"><div className="budget-title">RECEITAS (ENTRADAS)</div><div className="budget-cols"><b>DESCRIÇÃO</b><b>VALOR</b></div>{data.receitas.map(r=><div className="budget-row" key={r.id}><span>{r.nome}</span><label>R$ <input type="number" min="0" step="0.01" value={r.valor||''} placeholder="0,00" onChange={e=>edit('receitas',r.id,e.target.value)}/></label></div>)}<button className="add-line" onClick={()=>add('receitas')}>+ adicionar receita</button><div className="budget-total"><b>TOTAL DE ENTRADAS</b><strong>{money(totals.entradas)}</strong></div></section>
   <section className="budget-sheet expense"><div className="budget-title">DESPESAS (SAÍDAS)</div><div className="budget-cols"><b>DESCRIÇÃO</b><b>VALOR</b></div>{Object.keys(gruposSeed).map(g=><div className="expense-group" key={g}><div className="group-label">{g}</div><div className="group-lines">{data.despesas.filter(x=>x.grupo===g).map(r=><div className="budget-row" key={r.id}><span>{r.nome}</span><label>R$ <input type="number" min="0" step="0.01" value={r.valor||''} placeholder="0,00" onChange={e=>edit('despesas',r.id,e.target.value)}/></label></div>)}<button className="add-line" onClick={()=>add('despesas',g)}>+ adicionar despesa</button></div></div>)}<div className="budget-total"><b>TOTAL DE SAÍDAS</b><strong>{money(totals.saidas)}</strong></div></section>
  </div>
  <div className="budget-summary"><div><small>ENTRADAS</small><strong>{money(totals.entradas)}</strong></div><div><small>DESPESAS</small><strong>{money(totals.saidas)}</strong></div><div className={totals.sobra>=0?'positive':'negative'}><small>SOBRA DO MÊS</small><strong>{money(totals.sobra)}</strong></div><div><small>TAXA DE POUPANÇA</small><strong>{totals.taxa.toFixed(1).replace('.',',')}%</strong></div></div>
  <div className="money-destination"><div><span className="eyebrow">PRÓXIMO PASSO</span><h3>{totals.sobra>0?`Você tem ${money(totals.sobra)} para planejar`:'Organize o mês antes de definir novos aportes'}</h3><p>Reserva, objetivos e investimentos ficam separados das despesas. Assim o dinheiro destinado ao patrimônio não aparece como se tivesse sido gasto.</p></div><button className="btn btn-primario" disabled={totals.sobra<=0} onClick={onPlan}>Planejar meu dinheiro →</button></div>
 </div>
}
