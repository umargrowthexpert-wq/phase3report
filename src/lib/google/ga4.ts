// GA4 Data API sync. propertyId = numeric GA4 property ID (e.g. "properties/123456").
import { db } from "../db";

export async function syncGa4(clientId: string, startDate: string, endDate: string) {
  const integ = await db.integrationAccount.findUnique({
    where: { clientId_provider: { clientId, provider: "GA4" } },
  });
  if (!integ?.accessToken || !integ.propertyId) throw new Error("GA4 not connected for this client");

  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/${integ.propertyId}:runReport`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${integ.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "date" }],
        metrics: [
          { name: "totalUsers" },
          { name: "sessions" },
          { name: "conversions" },
          { name: "engagementRate" },
          { name: "totalRevenue" },
        ],
      }),
    }
  );
  if (!res.ok) throw new Error(`GA4 API error: ${await res.text()}`);
  const data = await res.json();

  for (const row of data.rows ?? []) {
    const d = row.dimensionValues[0].value; // YYYYMMDD
    const date = new Date(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`);
    const m = row.metricValues;
    await db.metricSnapshot.upsert({
      where: { clientId_source_date: { clientId, source: "GA4", date } },
      update: {},
      create: {
        clientId,
        source: "GA4",
        date,
        metrics: {
          users: Number(m[0].value),
          sessions: Number(m[1].value),
          conversions: Number(m[2].value),
          engagementRate: Number(m[3].value),
          revenue: Number(m[4].value),
        },
      },
    });
  }
  return { synced: data.rows?.length ?? 0 };
}
