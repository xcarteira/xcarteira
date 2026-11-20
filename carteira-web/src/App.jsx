import { useCallback, useEffect, useState } from 'react';
import { api } from './api/client';
import {
  formatBRL,
  formatPorcento,
  parseBRL,
  CATEGORIAS,
} from './utils/format';
import StatCard from './components/StatCard';
import AllocationPie from './components/AllocationPie';
import ProjectionChart from './components/ProjectionChart';
import AtivoModal from './components/AtivoModal';
import InvestirModal from './components/InvestirModal';
import CalculadoraJuros from './components/CalculadoraJuros';
import MapaOportunidades from './components/MapaOportunidades';
import GuiaCarteira from './components/GuiaCarteira';
import Financas from './components/Financas';
import MercadoHoje from './components/MercadoHoje';
import { supabase } from './lib/supabase';

const VALOR_INICIAL = { saldoTotal: 0, aporteMensal: 500, prazoAnos: 10, considerarImposto: false };

export default function App() {
  const [aba, setAba] = useState('resumo');
  const [config, setConfig] = useState(VALOR_INICIAL);
  const [ativos, setAtivos] = useState([]);
  const [simulacao, setSimulacao] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [modal, setModal] = useState(null);
  const [investirEm, setInvestirEm] = useState(null);
  const [ativoSelecionado, setAtivoSelecionado] = useState('');
  const [novoAporte, setNovoAporte] = useState('');

  const carregar = useCallback(async () => {
    const [cfg, atv] = await Promise.all([api.getConfig(), api.getAtivos()]);
    setConfig(cfg);
    setAtivos(atv);
    setAtivoSelecionado((atual) => atual || atv[0]?.id || '');
    return cfg;
  }, []);

  const rodarSimulacao = useCallback(async (cfg) => {
    const r = await api.simular({
      saldo: cfg.saldoTotal,
      aporteMensal: cfg.aporteMensal,
      prazoAnos: cfg.prazoAnos,
      considerarImposto: cfg.considerarImposto,
    });
    setSimulacao(r);
    return r;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const cfg = await carregar();
        await rodarSimulacao(cfg);
      } catch (e) {
        setErro(e.message);
      } finally {
        setCarregando(false);
      }
    })();
  }, [carregar, rodarSimulacao]);

  const aplicar = async (ativoId, valor) => {
    try {
      const r = await api.aplicar(ativoId, valor);
      setConfig(r.config);
      setAtivos((prev) =>
        prev.map((a) => (a.id === r.ativo.id ? r.ativo : a))
      );
      setErro('');
      setMensagem(`R$ ${formatBRL(valor)} aplicados em ${r.ativo.nome}.`);
      await rodarSimulacao(r.config);
      return r;
    } catch (err) {
      setErro(err.message);
      return null;
    }
  };

  const aplicarDoForm = async (e) => {
    e.preventDefault();
    const valor = parseBRL(novoAporte);
    if (!valor || valor <= 0) {
      setMensagem('');
      setErro('Digite um valor válido. Ex: 1000 ou 1.500,50.');
      return;
    }
    if (!ativoSelecionado) {
      setMensagem('');
      setErro('Escolha um ativo para aplicar.');
      return;
    }
    const r = await aplicar(ativoSelecionado, valor);
    if (r) setNovoAporte('');
  };

  const atualizarParametros = async (e) => {
    e.preventDefault();
    try {
      const dados = {
        aporteMensal: Number(config.aporteMensal) || 0,
        prazoAnos: Number(config.prazoAnos) || 1,
        considerarImposto: config.considerarImposto,
      };
      const salvo = await api.atualizarConfig(dados);
      const cfg = { ...config, ...salvo };
      setConfig(cfg);
      setErro('');
      await rodarSimulacao(cfg);
      setMensagem('Parâmetros da simulação atualizados.');
    } catch (err) {
      setErro(err.message);
    }
  };

  const salvarAtivo = async (form) => {
    if (modal?.id) {
      await api.atualizarAtivo(modal.id, form);
    } else {
      await api.criarAtivo(form);
    }
    setModal(null);
    const cfg = await carregar();
    await rodarSimulacao(cfg);
  };

  const excluirAtivo = async (id) => {
    await api.excluirAtivo(id);
    const cfg = await carregar();
    await rodarSimulacao(cfg);
  };

  const somaPesos = ativos.reduce((acc, a) => acc + (Number(a.percentual) || 0), 0);
  const podeRodar = Math.abs(somaPesos - 100) < 0.01;

  const resumo = simulacao?.resumo;
  const porAtivo = simulacao?.porAtivo || [];
  const aplicados = ativos
    .filter((a) => (Number(a.investido) || 0) > 0)
    .map((a) => ({
      name: a.nome,
      value: Number(a.investido),
      cor: a.cor,
      percentual: ((Number(a.investido) / (config.saldoTotal || 1)) * 100).toFixed(1),
    }));

  if (carregando) {
    return <div className="app">Carregando…</div>;
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo">
          <div className="logo-badge">C$</div>
          <div>
            <h1>Carteira Invest</h1>
            <p>Simulador de rendimento da sua carteira</p>
          </div>
        </div>
        <nav className="tabs">
          <button
            className={aba === 'resumo' ? 'ativo' : ''}
            onClick={() => { setMensagem(''); setErro(''); setAba('resumo'); }}
          >
            Resumo
          </button>
          <button className={aba === 'financas' ? 'ativo' : ''} onClick={() => { setMensagem(''); setErro(''); setAba('financas'); }}>Finanças</button>
          <button className={aba === 'mercado' ? 'ativo' : ''} onClick={() => { setMensagem(''); setErro(''); setAba('mercado'); }}>Mercado Hoje</button>
          <button
            className={aba === 'carteira' ? 'ativo' : ''}
            onClick={() => { setMensagem(''); setErro(''); setAba('carteira'); }}
          >
            Carteira
          </button>
          <button
            className={aba === 'calculadora' ? 'ativo' : ''}
            onClick={() => { setMensagem(''); setErro(''); setAba('calculadora'); }}
          >
            Calculadora
          </button>
          <button className={aba === 'oportunidades' ? 'ativo' : ''} onClick={() => { setMensagem(''); setErro(''); setAba('oportunidades'); }}>Mapa de Oportunidades</button>
          <button className={aba === 'guia' ? 'ativo' : ''} onClick={() => { setMensagem(''); setErro(''); setAba('guia'); }}>Montar Carteira</button>
        </nav>
        <button
          className="logout-btn"
          onClick={async () => {
            setErro('');
            const { error } = await supabase.auth.signOut();
            if (error) setErro(`Não foi possível sair: ${error.message}`);
          }}
          title="Sair da conta"
        >
          Sair
        </button>
      </header>

      {erro && <div className="erro-banner">{erro}</div>}

      {aba === 'resumo' && (
        <>
          <div className="stats">
            <StatCard
              rotulo="Saldo investido"
              valor={formatBRL(config.saldoTotal || 0)}
              sub="Total aplicado nos ativos"
            />
            <StatCard
              rotulo="Rendimento anual est."
              valor={formatBRL(simulacao?.rendimentoAnualEstimado || 0)}
              sub={`Taxa média ${formatPorcento(simulacao?.taxaPonderada || 0, 2)} a.a.`}
              cor="var(--green)"
            />
            <StatCard
              rotulo="Rendimento mensal est."
              valor={formatBRL(simulacao?.rendimentoMensalEstimado || 0)}
              sub="Crescimento aproximado hoje"
              cor="var(--accent)"
            />
            <StatCard
              rotulo={`Projeção em ${config.prazoAnos} anos`}
              valor={formatBRL(resumo?.valorBruto || 0)}
              sub={`Aporte mensal ${formatBRL(config.aporteMensal || 0)}`}
              cor="var(--amber)"
            />
          </div>

          <div className="grid-2">
            <div className="card">
              <h3>Projeção de crescimento</h3>
              <ProjectionChart
                pontos={simulacao?.pontos || []}
                considerarImposto={config.considerarImposto}
              />
            </div>
            <div className="card">
              <h3>Onde seu dinheiro está aplicado</h3>
              <AllocationPie dados={aplicados} />
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <h3>Investir agora</h3>
              <form className="saldo-panel" onSubmit={aplicarDoForm}>
                <div className="campo">
                  <label>Onde investir</label>
                  <select
                    value={ativoSelecionado}
                    onChange={(e) => setAtivoSelecionado(e.target.value)}
                  >
                    {ativos.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nome} — {formatPorcento(a.taxaAnual, 2)} a.a.
                      </option>
                    ))}
                  </select>
                </div>
                <div className="campo">
                  <label>Valor (R$)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={novoAporte}
                    onChange={(e) => setNovoAporte(e.target.value)}
                    placeholder="Ex: 5000 ou 1.500,50"
                  />
                </div>
                <button className="btn btn-primario" type="submit">
                  Aplicar
                </button>
                {mensagem && <p className="mensagem-ok">{mensagem}</p>}
                <p className="nota">
                  O valor entra direto no ativo escolhido e a simulação é recalculada na hora.
                </p>
              </form>
            </div>

            <div className="card">
              <h3>Resumo da simulação</h3>
              {resumo ? (
                <table className="tabela">
                  <tbody>
                    <tr><td>Total investido (saldo + aportes)</td><td>{formatBRL(resumo.totalInvestido)}</td></tr>
                    <tr><td>Valor bruto projetado</td><td className="positivo">{formatBRL(resumo.valorBruto)}</td></tr>
                    {config.considerarImposto && (
                      <tr><td>Valor líquido (após IR)</td><td className="positivo">{formatBRL(resumo.valorLiquido)}</td></tr>
                    )}
                    <tr><td>Rendimento bruto</td><td className="positivo">{formatBRL(resumo.rendimentoBruto)}</td></tr>
                    {config.considerarImposto && (
                      <tr><td>Rendimento líquido</td><td className="positivo">{formatBRL(resumo.rendimentoLiquido)}</td></tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <p className="nota">Rode a simulação para ver os números.</p>
              )}
              <p className="nota" style={{ marginTop: 12 }}>
                {config.considerarImposto
                  ? 'Valores consideram imposto simplificado aplicado sobre o rendimento.'
                  : 'Valores brutos, sem descontar imposto de renda.'}{' '}
                Criptomoedas e ações são voláteis — este é um cenário estimado, não uma garantia.
              </p>
            </div>
          </div>

          <div className="card">
            <h3>Parâmetros da simulação</h3>
            <form onSubmit={atualizarParametros}>
              <div className="form-row">
                <div className="campo">
                  <label>Aporte mensal (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={config.aporteMensal ?? ''}
                    onChange={(e) =>
                      setConfig((c) => ({ ...c, aporteMensal: e.target.value }))
                    }
                  />
                </div>
                <div className="campo">
                  <label>Prazo (anos)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={config.prazoAnos ?? ''}
                    onChange={(e) =>
                      setConfig((c) => ({ ...c, prazoAnos: e.target.value }))
                    }
                  />
                </div>
                <div className="campo" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <label className="checkbox-wrap" style={{ marginBottom: 0 }}>
                    <input
                      type="checkbox"
                      checked={config.considerarImposto}
                      onChange={(e) =>
                        setConfig((c) => ({ ...c, considerarImposto: e.target.checked }))
                      }
                    />
                    Considerar imposto
                  </label>
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <button className="btn btn-secundario" type="submit">
                  Atualizar simulação
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {aba === 'financas' && (<Financas onPlan={()=>setTab("guia")} />)}

      {aba === 'carteira' && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Ativos da carteira</h3>
              <button className="btn btn-primario" onClick={() => setModal({})}>
                + Novo ativo
              </button>
            </div>
            <p className="nota" style={{ marginTop: 10 }}>
              Clique em <strong>Investir</strong> para aplicar dinheiro no ativo escolhido. O
              peso (%) define como os aportes mensais futuros são distribuídos (devem somar 100%).
            </p>
            {!podeRodar && (
              <div className="aviso" style={{ marginTop: 12 }}>
                A soma dos pesos está em <strong>{formatPorcento(somaPesos, 1)}</strong>. Ajuste até chegar a
                100% para os aportes mensais ficarem coerentes.
              </div>
            )}
          </div>

          <div className="card">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Ativo</th>
                  <th>Categoria</th>
                  <th>Peso</th>
                  <th>Taxa a.a.</th>
                  <th>Aplicado hoje</th>
                  <th>Projetado</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {ativos.map((a) => {
                  const proj = porAtivo.find((p) => p.ativoId === a.id);
                  const cat = CATEGORIAS[a.categoria] || CATEGORIAS.outro;
                  return (
                    <tr key={a.id}>
                      <td>
                        <span className="dot" style={{ background: a.cor }} />
                        <strong>{a.nome}</strong>
                      </td>
                      <td>
                        <span
                          className="tag-categoria"
                          style={{
                            background: `${cat.cor}22`,
                            color: cat.cor,
                          }}
                        >
                          {cat.label}
                        </span>
                      </td>
                      <td>{formatPorcento(a.percentual)}</td>
                      <td>{formatPorcento(a.taxaAnual, 2)}</td>
                      <td className={a.investido > 0 ? '' : 'texto-dim'}>
                        {formatBRL(a.investido || 0)}
                      </td>
                      <td className="positivo">{proj ? formatBRL(proj.bruto) : '—'}</td>
                      <td>
                        <div className="acoes-celula">
                          <button className="botao-tabela principal" onClick={() => setInvestirEm(a)}>
                            Investir
                          </button>
                          <button className="botao-tabela" onClick={() => setModal(a)}>
                            Editar
                          </button>
                          <button
                            className="botao-tabela perigo"
                            onClick={() => excluirAtivo(a.id)}
                          >
                            Remover
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="total-pct">
              <span>Total aplicado</span>
              <strong className="positivo">{formatBRL(config.saldoTotal || 0)}</strong>
            </div>
          </div>
        </>
      )}

      {aba === 'calculadora' && (<CalculadoraJuros />)}
      {aba === 'mercado' && (<MercadoHoje abrirMapa={() => setAba('oportunidades')} />)}
      {aba === 'oportunidades' && (<MapaOportunidades />)}
      {aba === 'guia' && (<GuiaCarteira abrirMapa={() => setAba('oportunidades')} />)}

      {investirEm && (
        <InvestirModal
          ativo={investirEm}
          onAplicar={async (valor) => {
            const r = await aplicar(investirEm.id, valor);
            if (r) setInvestirEm(null);
          }}
          onFechar={() => setInvestirEm(null)}
        />
      )}

      {modal && (
        <AtivoModal
          ativo={modal?.id ? modal : null}
          onSalvar={salvarAtivo}
          onFechar={() => setModal(null)}
        />
      )}
    </div>
  );
}