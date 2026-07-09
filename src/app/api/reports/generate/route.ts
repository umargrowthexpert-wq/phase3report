import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { askClaude } from "@/lib/claude";

// POST { clientId, month } -> creates/updates the editable monthly report.
// Sections are stored as JSON blocks the UI can reorder/edit before export.
// Export strategy: the report page renders branded HTML; PDF via print CSS
// (window.print) works today, and @react-pdf or Playwright can be added for
// server-side PDFs later. Excel/CSV exports come from the raw data routes.
export async function POST(req: Request) {
  const { clientId, month } = await req.json();
  if (!clientId || !month) {
    return NextResponse.json({ error: "clientId and month are required" }, { status: 400 });
  }

  const client = await db.client.findUnique({
    where: { id: clientId },
    include: { agency: true },
  });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  // Reuse the AI analyst for the narrative sections
  const insightsRes = await fetch(new URL("/api/ai/insights", req.url), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, month }),
  });
  if (!insightsRes.ok) {
    return NextResponse.json({ error: "AI analysis failed" }, { status: 502 });
  }
  const { analysis, dataPack } = await insightsRes.json();

  const start = new Date(`${month}-01`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  const workLogs = await db.workLogEntry.findMany({
    where: { clientId, date: { gte: start, lt: end } },
    include: { user: { select: { name: true } } },
    orderBy: { date: "asc" },
  });

  const sections = [
    { id: "cover", type: "cover", title: `${client.businessName} SEO report`, subtitle: month, editable: true },
    { id: "toc", type: "toc", title: "Contents", editable: false },
    { id: "summary", type: "richtext", title: "Executive summary", content: analysis, editable: true },
    { id: "kpis", type: "kpis", title: "Performance at a glance", data: dataPack, editable: false },
    {
      id: "worklog",
      type: "table",
      title: "SEO work completed this month",
      rows: workLogs.map((w: any) => ({
        date: w.date.toISOString().slice(0, 10),
        member: w.user?.name ?? "Team",
        category: w.category,
        description: w.description,
      })),
      editable: true,
    },
    { id: "manual-notes", type: "richtext", title: "Notes, wins and challenges", content: "", editable: true },
    { id: "next-month", type: "richtext", title: "Next month action plan", content: "", editable: true },
  ];

  const report = await db.report.upsert({
    where: { clientId_month: { clientId, month } },
    update: { sections, aiSummary: analysis },
    create: { clientId, month, sections, aiSummary: analysis },
  });

  return NextResponse.json(report, { status: 201 });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId");
  const reports = await db.report.findMany({
    where: clientId ? { clientId } : undefined,
    orderBy: { month: "desc" },
  });
  return NextResponse.json(reports);
}
