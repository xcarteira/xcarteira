import { useState } from 'react';
import { formatPorcento, parseBRL } from '../utils/format';

export default function InvestirModal({ ativo, onAplicar, onFechar }) {
  const [valor, setValor] = useState('');
  const [erro, setErro] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const v = parseBRL(valor);
    if (!v || v <= 0) {
      setErro('Digite um valor válido. Ex: 1000 ou 1.500,50.');
      return;
    }
    setErro('');
    onAplicar(v);
  };

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Investir em {ativo?.nome}</h3>
        {ativo && (
          <p className="nota" style={{ marginBottom: 16 }}>
            Rentabilidade estimada: {formatPorcento(ativo.taxaAnual, 2)} a.a.
            {ativo.investido > 0 && (
              <> · Já aplicado: {ativo.investido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</>
            )}
          </p>
        )}
        <form onSubmit={submit}>
          <div className="campo">
            <label>Valor a aplicar (R$)</label>
            <input
              type="text"
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Ex: 5000 ou 1.500,50"
              autoFocus
            />
          </div>
          {erro && <p className="erro-banner" style={{ marginTop: 10, marginBottom: 0 }}>{erro}</p>}
          <div className="modal-actions">
            <button type="button" className="btn btn-secundario" onClick={onFechar}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primario">
              Aplicar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}