import { db } from "@/lib/db";
import { KpiCard } from "@/components/KpiCard";

export const dynamic = "force-dynamic";

export default async function AgencyOverview() {
  const [clients, leads, bookings, notifications] = await Promise.all([
    db.client.count({ where: { status: "ACTIVE" } }),
    db.lead.count(),
    db.booking.aggregate({ _count: true, _sum: { revenue: true } }),
    db.notification.findMany({ where: { read: false }, orderBy: { createdAt: "desc" }, take: 8, include: { client: true } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Agency overview</h1>
        <p className="text-sm text-slate-400 mt-1">Everything across all clients, in one place.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Active clients" value={clients} />
        <KpiCard label="Total leads" value={leads} />
        <KpiCard label="Total bookings" value={bookings._count} />
        <KpiCard label="Booked revenue" value={`£${Number(bookings._sum.revenue ?? 0).toLocaleString()}`} />
      </div>

      <div className="card">
        <p className="kpi-label mb-3">Needs attention</p>
        {notifications.length === 0 ? (
          <p className="text-sm text-slate-400">No alerts. All clients look healthy.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {notifications.map((n: any) => (
              <li key={n.id} className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-warn shrink-0" />
                <span className="text-slate-300">{n.client?.businessName}:</span>
                <span>{n.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
