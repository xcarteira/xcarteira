import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { formatBRL, formatPorcento } from '../utils/format';

export default function AllocationPie({ dados }) {
  const itens = (dados || []).filter((d) => d.value > 0);

  if (!itens.length) {
    return <p className="nota">Aplique um valor em algum ativo para ver a distribuição.</p>;
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={itens}
            dataKey="value"
            nameKey="name"
            innerRadius="60%"
            outerRadius="85%"
            paddingAngle={2}
            stroke="none"
          >
            {itens.map((d) => (
              <Cell key={d.name} fill={d.cor} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0];
              return (
                <div className="tooltip-chart">
                  <p style={{ fontWeight: 700 }}>{item.name}</p>
                  <p>{formatBRL(item.value)} · {formatPorcento(item.percentual)}</p>
                  {item.rendimento !== undefined && item.rendimento !== 0 && (
                    <p className={item.rendimento >= 0 ? 'positivo' : 'negativo'}>
                      Projeção bruta: {formatBRL(item.rendimento)}
                    </p>
                  )}
                </div>
              );
            }}
          />
          <Legend
            formatter={(_, entry) => (
              <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>
                {entry?.payload?.name}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}