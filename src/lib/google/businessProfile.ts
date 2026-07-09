// Google Business Profile.
// IMPORTANT: the Business Profile APIs are gated — your Google Cloud project
// must be approved via Google's Business Profile API access request form
// before these endpoints return data. Until approved, track GBP metrics
// manually via MetricSnapshot (source: BUSINESS_PROFILE) or CSV import.
import { db } from "../db";

export async function syncBusinessProfile(clientId: string) {
  const integ = await db.integrationAccount.findUnique({
    where: { clientId_provider: { clientId, provider: "BUSINESS_PROFILE" } },
  });
  if (!integ?.accessToken || !integ.propertyId) throw new Error("Business Profile not connected for this client");

  // Daily metrics via the Business Profile Performance API
  const today = new Date();
  const res = await fetch(
    `https://businessprofileperformance.googleapis.com/v1/${integ.propertyId}:fetchMultiDailyMetricsTimeSeries` +
      `?dailyMetrics=CALL_CLICKS&dailyMetrics=WEBSITE_CLICKS&dailyMetrics=BUSINESS_DIRECTION_REQUESTS` +
      `&dailyRange.start_date.year=${today.getFullYear()}&dailyRange.start_date.month=${today.getMonth()}&dailyRange.start_date.day=1` +
      `&dailyRange.end_date.year=${today.getFullYear()}&dailyRange.end_date.month=${today.getMonth() + 1}&dailyRange.end_date.day=${today.getDate()}`,
    { headers: { Authorization: `Bearer ${integ.accessToken}` } }
  );
  if (!res.ok) throw new Error(`GBP API error (is your project approved for Business Profile APIs?): ${await res.text()}`);
  return res.json();
}
