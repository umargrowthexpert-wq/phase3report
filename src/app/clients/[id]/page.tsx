import { db } from "@/lib/db";
import { KpiCard } from "@/components/KpiCard";
import { TrafficChart } from "@/components/TrafficChart";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ClientWorkspace({ params }: { params: { id: string } }) {
  const client = await db.client.findUnique({
    where: { id: params.id },
    include: {
      leads: { orderBy: { date: "desc" }, take: 10 },
      bookings: { orderBy: { bookingDate: "desc" }, take: 10 },
      workLogs: { orderBy: { date: "desc" }, take: 15, include: { user: { select: { name: true } } } },
      metrics: { where: { source: "SEARCH_CONSOLE" }, orderBy: { date: "asc" }, take: 90 },
    },
  });
  if (!client) notFound();

  const chartData = client.metrics.map((m: any) => ({
    date: m.date.toISOString().slice(5, 10),
    clicks: Number((m.metrics as any)?.clicks ?? 0),
    impressions: Number((m.metrics as any)?.impressions ?? 0),
  }));
  const totalClicks = chartData.reduce((a: number, d: any) => a + d.clicks, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">{client.businessName}</h1>
        <p className="text-sm text-slate-400 mt-1">{client.website} · {client.industry ?? "Industry not set"} · {client.status}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Clicks (90d)" value={totalClicks.toLocaleString()} />
        <KpiCard label="Leads" value={client.leads.length} />
        <KpiCard label="Bookings" value={client.bookings.length} />
        <KpiCard label="Work items" value={client.workLogs.length} />
      </div>

      {chartData.length > 0 ? (
        <TrafficChart data={chartData} />
      ) : (
        <div className="card text-sm text-slate-400">
          No Search Console data yet. Connect the integration or import history to see traffic here.
        </div>
      )}

      <div className="card overflow-x-auto">
        <p className="kpi-label mb-3">Manual SEO work log</p>
        <table className="data">
          <thead>
            <tr><th>Date</th><th>Member</th><th>Category</th><th>Description</th><th>Status</th></tr>
          </thead>
          <tbody>
            {client.workLogs.map((w: any) => (
              <tr key={w.id}>
                <td>{w.date.toISOString().slice(0, 10)}</td>
                <td>{w.user?.name ?? "Team"}</td>
                <td>{w.category}</td>
                <td className="max-w-md">{w.description}</td>
                <td>{w.status}</td>
              </tr>
            ))}
            {client.workLogs.length === 0 && (
              <tr><td colSpan={5} className="text-slate-400">No work logged yet. Log tasks via POST /api/worklog.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
