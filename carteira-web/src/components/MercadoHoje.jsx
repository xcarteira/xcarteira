import { useEffect, useState } from 'react';

const fmt = (v, d=2) => Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});

export default function MercadoHoje({ abrirMapa }) {
  const [selic,setSelic]=useState(null);
  const [dolar,setDolar]=useState(null);
  const [btc,setBtc]=useState(null);
  const [status,setStatus]=useState('Atualizando dados…');
  const [atualizado,setAtualizado]=useState(null);

  async function atualizar(){
    setStatus('Atualizando dados…');
    const jobs = [
      fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json').then(r=>r.ok?r.json():Promise.reject()).then(x=>setSelic(Number(String(x?.[0]?.valor||'').replace(',','.')))),
      fetch('https://economia.awesomeapi.com.br/last/USD-BRL').then(r=>r.ok?r.json():Promise.reject()).then(x=>setDolar(Number(x?.USDBRL?.bid))),
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl&include_24hr_change=true').then(r=>r.ok?r.json():Promise.reject()).then(x=>setBtc(x?.bitcoin)),
    ];
    await Promise.allSettled(jobs);
    setAtualizado(new Date());
    setStatus('Dados consultados. Itens indisponíveis ficam sinalizados — o sistema não inventa valores.');
  }
  useEffect(()=>{ atualizar(); },[]);

  const cards=[
    {nome:'Selic',valor:selic?`${fmt(selic)}% a.a.`:'Indisponível',tag:'JUROS BRASIL',exp:'É a taxa básica de juros. Juros elevados tendem a aumentar a remuneração de pós-fixados e também afetam o preço de ativos de risco.',fonte:'Banco Central',url:'https://dadosabertos.bcb.gov.br/dataset/432-taxa-de-juros---meta-selic-definida-pelo-copom'},
    {nome:'CDI',valor:'Ver na fonte',tag:'RENDA FIXA',exp:'É uma referência central para CDBs e outros produtos. Compare sempre percentual do CDI, prazo, liquidez, imposto e risco do emissor.',fonte:'B3 / instituições',url:'https://www.b3.com.br/'},
    {nome:'IPCA',valor:'Ver último IPCA',tag:'INFLAÇÃO',exp:'Mede a inflação oficial. Para objetivos longos, retorno nominal sozinho engana: compare também o ganho acima da inflação.',fonte:'IBGE',url:'https://www.ibge.gov.br/explica/inflacao.php'},
    {nome:'Dólar',valor:dolar?`R$ ${fmt(dolar,4)}`:'Indisponível',tag:'CÂMBIO',exp:'Afeta investimentos internacionais e empresas expostas ao exterior. Uma cotação isolada não indica se é hora de comprar ou vender.',fonte:'Cotação indicativa',url:'https://www.bcb.gov.br/estabilidadefinanceira/historicocotacoes'},
    {nome:'Ibovespa',valor:'Ver mercado',tag:'BOLSA BRASIL',exp:'É o principal índice de referência da bolsa brasileira. O índice subir ou cair não diz sozinho se uma empresa está barata ou cara.',fonte:'B3',url:'https://www.b3.com.br/pt_br/market-data-e-indices/indices/indices-amplos/ibovespa-b3.htm'},
    {nome:'Bitcoin',valor:btc?.brl?`R$ ${Math.round(btc.brl).toLocaleString('pt-BR')}`:'Indisponível',tag:'CRIPTO',exp:btc?.brl_24h_change!=null?`Variação indicativa em 24h: ${fmt(btc.brl_24h_change)}%. Volatilidade é alta; trate tamanho da posição como parte do risco.`:'Ativo de alta volatilidade. Preço recente não substitui análise de risco e tamanho da posição.',fonte:'CoinGecko',url:'https://www.coingecko.com/'},
  ];

  return <>
    <div className="market-hero">
      <div><span className="eyebrow">PAINEL PARA INICIANTES</span><h2>Mercado Hoje</h2><p>Veja os principais termômetros do mercado e, principalmente, entenda o que cada um significa antes de tomar uma decisão.</p></div>
      <div className="market-actions"><button className="btn" onClick={atualizar}>↻ Atualizar</button><button className="btn primario" onClick={abrirMapa}>Abrir mapa →</button></div>
    </div>
    <div className="data-status"><b>{status}</b><span>{atualizado?`Última tentativa: ${atualizado.toLocaleString('pt-BR')}`:''}</span></div>
    <div className="market-grid">{cards.map(c=><article className="card market-card" key={c.nome}>
      <div className="market-top"><span>{c.tag}</span><a href={c.url} target="_blank" rel="noreferrer">Fonte ↗</a></div>
      <h3>{c.nome}</h3><strong className="market-value">{c.valor}</strong><p>{c.exp}</p><small>Fonte: {c.fonte}</small>
    </article>)}</div>
    <div className="card beginner-box"><div><span className="eyebrow">COMO LER ESTE PAINEL</span><h3>Não tente adivinhar o próximo movimento do mercado.</h3><p>Use estes indicadores como contexto. Depois compare prazo, liquidez, impostos, risco, preço e fundamentos no Mapa de Oportunidades.</p></div><button className="btn primario" onClick={abrirMapa}>Analisar oportunidades</button></div>
  </>;
}
