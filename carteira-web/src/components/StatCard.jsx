export default function StatCard({ rotulo, valor, sub, cor }) {
  return (
    <div className="stat-card">
      <span className="rotulo">{rotulo}</span>
      <span className="valor" style={cor ? { color: cor } : undefined}>
        {valor}
      </span>
      {sub && <span className="sub">{sub}</span>}
    </div>
  );
}