import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { askClaude } from "@/lib/claude";

// POST { clientId, month: "2026-06", question?: string }
// Without `question`: generates the full monthly AI analysis.
// With `question`: answers ad-hoc questions like "Why did clicks decrease?"
export async function POST(req: Request) {
  const { clientId, month, question } = await req.json();
  if (!clientId || !month) {
    return NextResponse.json({ error: "clientId and month are required" }, { status: 400 });
  }

  const client = await db.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const start = new Date(`${month}-01`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  const prevStart = new Date(start);
  prevStart.setMonth(prevStart.getMonth() - 1);

  const [metrics, prevMetrics, leads, bookings, workLogs, keywords] = await Promise.all([
    db.metricSnapshot.findMany({ where: { clientId, date: { gte: start, lt: end } } }),
    db.metricSnapshot.findMany({ where: { clientId, date: { gte: prevStart, lt: start } } }),
    db.lead.findMany({ where: { clientId, date: { gte: start, lt: end } } }),
    db.booking.findMany({ where: { clientId, bookingDate: { gte: start, lt: end } } }),
    db.workLogEntry.findMany({ where: { clientId, date: { gte: start, lt: end } } }),
    db.keyword.findMany({
      where: { clientId },
      include: { positions: { orderBy: { date: "desc" }, take: 2 } },
    }),
  ]);

  const sum = (rows: any[], source: string, key: string) =>
    rows
      .filter((r) => r.source === source)
      .reduce((a, r) => a + (Number((r.metrics as any)?.[key]) || 0), 0);

  const dataPack = {
    client: {
      name: client.businessName,
      industry: client.industry,
      locations: client.locations,
      services: client.services,
    },
    month,
    searchConsole: {
      clicks: sum(metrics, "SEARCH_CONSOLE", "clicks"),
      prevClicks: sum(prevMetrics, "SEARCH_CONSOLE", "clicks"),
      impressions: sum(metrics, "SEARCH_CONSOLE", "impressions"),
      prevImpressions: sum(prevMetrics, "SEARCH_CONSOLE", "impressions"),
    },
    analytics: {
      users: sum(metrics, "GA4", "users"),
      prevUsers: sum(prevMetrics, "GA4", "users"),
      conversions: sum(metrics, "GA4", "conversions"),
      revenue: sum(metrics, "GA4", "revenue"),
    },
    gbp: {
      calls: sum(metrics, "BUSINESS_PROFILE", "calls"),
      websiteClicks: sum(metrics, "BUSINESS_PROFILE", "websiteClicks"),
      directions: sum(metrics, "BUSINESS_PROFILE", "directions"),
    },
    leads: { total: leads.length, won: leads.filter((l: any) => l.status === "WON").length },
    bookings: {
      total: bookings.length,
      completed: bookings.filter((b: any) => b.status === "COMPLETED").length,
      revenue: bookings.reduce((a: number, b: any) => a + Number(b.revenue || 0), 0),
    },
    manualWork: workLogs.map((w: any) => ({ category: w.category, description: w.description })),
    keywords: keywords.map((k: any) => ({
      keyword: k.keyword,
      current: k.positions[0]?.position ?? null,
      previous: k.positions[1]?.position ?? null,
    })),
  };

  const basePrompt = `You are a senior SEO consultant at a digital agency, writing for the agency team and their client.

Here is this month's complete data for the client, including the previous month for comparison:
${JSON.stringify(dataPack, null, 2)}

Rules:
- Explain everything in natural language a business owner understands.
- Never simply repeat metrics: interpret them, connect cause and effect, and reference the manual SEO work where it plausibly contributed to results.
- Be honest about declines and specific about what to do next.
- Use plain headings and short paragraphs. No em dashes.`;

  const prompt = question
    ? `${basePrompt}\n\nAnswer this specific question from the agency team:\n"${question}"`
    : `${basePrompt}

Produce the full monthly analysis with these sections:
1. Executive summary
2. Traffic analysis (Search Console and GA4, month over month)
3. Keyword performance
4. Google Business Profile analysis
5. Lead and booking analysis
6. Manual SEO work summary and its impact
7. Entity, semantic and local SEO opportunities
8. Competitor suggestions
9. Next month priorities (numbered, concrete)`;

  const analysis = await askClaude(prompt, 3000);
  return NextResponse.json({ analysis, dataPack });
}
