import { useState } from 'react';
import { CATEGORIAS } from '../utils/format';

const CORES = [
  '#22d3ee',
  '#34d399',
  '#f59e0b',
  '#f97316',
  '#8b5cf6',
  '#6366f1',
  '#14b8a6',
  '#ef4444',
  '#fbbf24',
  '#0ea5e9',
  '#a78bfa',
  '#94a3b8',
];

const MAIS_LIQUIDO = [
  { valor: 0, rotulo: 'Isento' },
  { valor: 15, rotulo: '15% (longo prazo)' },
  { valor: 17.5, rotulo: '17,5% (2 a 4 anos)' },
  { valor: 20, rotulo: '20% (FII/curto)' },
  { valor: 22.5, rotulo: '22,5% (até 1 ano)' },
];

export default function AtivoModal({ ativo, onSalvar, onFechar }) {
  const [form, setForm] = useState({
    nome: ativo?.nome || '',
    categoria: ativo?.categoria || 'outro',
    taxaAnual: ativo?.taxaAnual ?? 10,
    percentual: ativo?.percentual ?? 0,
    aliquota: ativo?.aliquota ?? 15,
    cor: ativo?.cor || CORES[1],
    descricao: ativo?.descricao || '',
  });

  const set = (campo) => (e) =>
    setForm((f) => ({ ...f, [campo]: e.target.value }));

  const salvar = (e) => {
    e.preventDefault();
    onSalvar(form);
  };

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{ativo ? 'Editar ativo' : 'Novo ativo'}</h3>
        <form onSubmit={salvar}>
          <div className="form-grid">
            <div className="campo">
              <label>Nome</label>
              <input
                type="text"
                value={form.nome}
                onChange={set('nome')}
                placeholder="Ex: Tesouro Selic"
                required
              />
            </div>
            <div className="form-row">
              <div className="campo">
                <label>Categoria</label>
                <select value={form.categoria} onChange={set('categoria')}>
                  {Object.entries(CATEGORIAS).map(([key, c]) => (
                    <option key={key} value={key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="campo">
                <label>Rentabilidade (% a.a.)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.taxaAnual}
                  onChange={set('taxaAnual')}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="campo">
                <label>Peso na carteira (%)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={form.percentual}
                  onChange={set('percentual')}
                  required
                />
              </div>
              <div className="campo">
                <label>Imposto no resgate</label>
                <select value={form.aliquota} onChange={set('aliquota')}>
                  {MAIS_LIQUIDO.map((op) => (
                    <option key={op.valor} value={op.valor}>
                      {op.rotulo}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="campo">
              <label>Cor</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {CORES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, cor: c }))}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 8,
                      background: c,
                      border: form.cor === c ? '2px solid #fff' : '2px solid transparent',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="campo">
              <label>Descrição (opcional)</label>
              <input
                type="text"
                value={form.descricao}
                onChange={set('descricao')}
                placeholder="O que é esse ativo"
              />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secundario" onClick={onFechar}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primario">
              {ativo ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}