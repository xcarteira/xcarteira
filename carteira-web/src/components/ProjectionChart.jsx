import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
} from 'recharts';
import { formatBRL } from '../utils/format';

export default function ProjectionChart({ pontos, considerarImposto }) {
  if (!pontos?.length) {
    return <p className="nota">Rode a simulação para ver a projeção.</p>;
  }

  const tooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    return (
      <div className="tooltip-chart">
        <p style={{ fontWeight: 700 }}>{label}</p>
        <p>Investido: {formatBRL(p.investido)}</p>
        <p className="positivo">Bruto: {formatBRL(p.bruto)}</p>
        {considerarImposto && (
          <p style={{ color: 'var(--accent)' }}>Líquido: {formatBRL(p.liquido)}</p>
        )}
      </div>
    );
  };

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={pontos} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="gradBruto" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1b2640" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="data"
            tick={{ fill: '#8b98b3', fontSize: 12 }}
            axisLine={{ stroke: '#22304a' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => formatBRL(v).replace(',00', '')}
            tick={{ fill: '#8b98b3', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip content={tooltip} />
          <Legend
            wrapperStyle={{ color: 'var(--text-dim)', fontSize: 13 }}
          />
          <Area
            type="monotone"
            dataKey="investido"
            name="Investido"
            stroke="#8b98b3"
            strokeDasharray="5 5"
            fill="none"
          />
          <Area
            type="monotone"
            dataKey="bruto"
            name="Bruto (projeção)"
            stroke="#34d399"
            strokeWidth={2}
            fill="url(#gradBruto)"
          />
          {considerarImposto && (
            <Line
              type="monotone"
              dataKey="liquido"
              name="Líquido (após IR)"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}