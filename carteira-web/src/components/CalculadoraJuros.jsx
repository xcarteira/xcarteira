import { useState } from 'react';
import { formatBRL, formatPorcento } from '../utils/format';

const MesesAno = 12;

export default function CalculadoraJuros() {
  const [principal, setPrincipal] = useState(0);
  const [taxaAnual, setTaxaAnual] = useState(0.05);
  const [anos, setAnos] = useState(10);
  const [aporteMensal, setAporteMensal] = useState(0);
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    const r = taxaAnual / 100;
    const n = MesesAno;
    const t = anos;
    const P = principal;
    const PMT = aporteMensal;

    const fator = Math.pow(1 + r / n, n * t);
    const jurosCompostos = P * fator;
    const aporteTotal = PMT !== 0 && r > 0 ? PMT * ((fator - 1) / (r / n)) : PMT * t;
    const valorBruto = jurosCompostos + aporteTotal;
    const imposto = valorBruto * 0.15;
    const valorLiquido = valorBruto - imposto;

    setResultado({
      valorBruto,
      valorLiquido,
      imposto,
      fator,
    });
  };

  

  return (
    <div className="card">
      <h3>Calculadora de Juros Compostos</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          calcular();
        }}
      >
        <div className="form-row">
          <div className="campo">
            <label>Investimento inicial (R$)</label>
            <input
              type="number"
              min="0"
              step="any"
              value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value) || 0)}
            />
          </div>
          <div className="campo">
            <label>Taxa anual (%)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={taxaAnual}
              onChange={(e) => setTaxaAnual(Number(e.target.value) || 0.05)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="campo">
            <label>Prazo (anos)</label>
            <input
              type="number"
              min="1"
              step="1"
              value={anos}
              onChange={(e) => setAnos(Number(e.target.value) || 10)}
            />
          </div>
          <div className="campo">
            <label>Aporte mensal (R$)</label>
            <input
              type="number"
              min="0"
              step="any"
              value={aporteMensal}
              onChange={(e) =>
                setAporteMensal(Number(e.target.value) || 0)
              }
            />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <button className="btn btn-primario" type="submit">
            Calcular
          </button>
        </div>
      </form>

      {resultado && (
        <div className="resultados" style={{ marginTop: 24 }}>
          <h4>Resultados</h4>
          <div className="form-row">
            <div className="campo">
              <label>Valor bruto projetado</label>
              <p className="positivo">
                {formatBRL(resultado.valorBruto)}
              </p>
            </div>
            <div className="campo">
              <label>Valor líquido (após 15% IR)</label>
              <p className="positivo">
                {formatBRL(resultado.valorLiquido)}
              </p>
            </div>
          </div>
          <div>
            <label>Imposto estimado (15%)</label>
            <p className="positivo">{formatBRL(resultado.imposto)}</p>
          </div>
        </div>
      )}
    </div>
  );
}