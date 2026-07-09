import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const LeadSchema = z.object({
  clientId: z.string(),
  name: z.string().min(1),
  date: z.string().datetime().optional(),
  service: z.string().optional(),
  location: z.string().optional(),
  source: z.string().optional(),
  landingPage: z.string().optional(),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"]).optional(),
  value: z.number().optional(),
});

export async function GET(req: Request) {
  const clientId = new URL(req.url).searchParams.get("clientId");
  const leads = await db.lead.findMany({
    where: clientId ? { clientId } : undefined,
    orderBy: { date: "desc" },
    take: 200,
  });
  return NextResponse.json(leads);
}

// Accepts a single lead (manual/webhook) or an array (CSV / Sheets import)
export async function POST(req: Request) {
  const body = await req.json();
  const items = Array.isArray(body) ? body : [body];
  const parsed = items.map((i) => LeadSchema.parse(i));
  const created = await db.lead.createMany({ data: parsed as any });
  return NextResponse.json({ created: created.count }, { status: 201 });
}
