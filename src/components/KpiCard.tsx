export function KpiCard({ label, value, delta }: { label: string; value: string | number; delta?: number }) {
  return (
    <div className="card">
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      {delta != null && (
        <p className={`text-xs mt-1 ${delta >= 0 ? "text-up" : "text-danger"}`}>
          {delta >= 0 ? "+" : ""}{delta}% vs last month
        </p>
      )}
    </div>
  );
}
