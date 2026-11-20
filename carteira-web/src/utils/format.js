export const formatBRL = (n) =>
  (n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatNumero = (n, casas = 1) =>
  (n || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });

export const formatPorcento = (n, casas = 1) =>
  `${formatNumero(n, casas)}%`;

export function parseBRL(texto) {
  const t = (texto || '').trim().replace(/\s/g, '');
  if (!t) return NaN;
  const temVirgula = t.includes(',');
  const temPonto = t.includes('.');
  if (temVirgula) {
    return Number(t.replace(/\./g, '').replace(',', '.'));
  }
  if (temPonto) {
    const partes = t.split('.');
    if (partes.length === 2 && partes[1].length === 2) {
      return Number(t);
    }
    return Number(t.replace(/\./g, ''));
  }
  return Number(t);
}

export const CATEGORIAS = {
  tesouro: { label: 'Tesouro Direto', cor: '#0284c7' },
  cdb: { label: 'CDB', cor: '#22c55e' },
  acao: { label: 'Ações', cor: '#f59e0b' },
  fundo: { label: 'Fundos', cor: '#14b8a6' },
  fii: { label: 'FIIs', cor: '#8b5cf6' },
  crypto: { label: 'Criptomoedas', cor: '#f97316' },
  poupanca: { label: 'Poupança', cor: '#94a3b8' },
  outro: { label: 'Outros', cor: '#64748b' },
};