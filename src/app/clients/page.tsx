import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await db.client.findMany({
    include: { manager: { select: { name: true } }, _count: { select: { leads: true, bookings: true } } },
    orderBy: { businessName: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Clients</h1>
      <div className="card overflow-x-auto">
        <table className="data">
          <thead>
            <tr>
              <th>Business</th><th>Status</th><th>Manager</th><th>Leads</th><th>Bookings</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c: any) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/clients/${c.id}`} className="text-accent hover:underline">{c.businessName}</Link>
                </td>
                <td>{c.status}</td>
                <td>{c.manager?.name ?? "-"}</td>
                <td>{c._count?.leads ?? 0}</td>
                <td>{c._count?.bookings ?? 0}</td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr><td colSpan={5} className="text-slate-400">No clients yet. Add your first via POST /api/clients.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
