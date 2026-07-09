// Google Search Console sync via the official Search Analytics API.
// Requires the client's IntegrationAccount row (provider: SEARCH_CONSOLE)
// with a valid OAuth access token and propertyId = the verified site URL.
import { db } from "../db";

export async function syncSearchConsole(clientId: string, startDate: string, endDate: string) {
  const integ = await db.integrationAccount.findUnique({
    where: { clientId_provider: { clientId, provider: "SEARCH_CONSOLE" } },
  });
  if (!integ?.accessToken || !integ.propertyId) throw new Error("Search Console not connected for this client");

  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(integ.propertyId)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${integ.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate, dimensions: ["date"], rowLimit: 1000 }),
    }
  );
  if (!res.ok) throw new Error(`GSC API error: ${await res.text()}`);
  const data = await res.json();

  for (const row of data.rows ?? []) {
    const date = new Date(row.keys[0]);
    await db.metricSnapshot.upsert({
      where: { clientId_source_date: { clientId, source: "SEARCH_CONSOLE", date } },
      update: { metrics: { clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position } },
      create: {
        clientId,
        source: "SEARCH_CONSOLE",
        date,
        metrics: { clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position },
      },
    });
  }
  return { synced: data.rows?.length ?? 0 };
}
