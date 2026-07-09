import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const WorkLogSchema = z.object({
  clientId: z.string(),
  userId: z.string().optional(),
  date: z.string().datetime().optional(),
  category: z.string().min(1),
  description: z.string().min(1),
  timeSpentMins: z.number().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "DONE"]).optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId");
  const month = url.searchParams.get("month"); // "2026-06"
  let dateFilter = {};
  if (month) {
    const start = new Date(`${month}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    dateFilter = { date: { gte: start, lt: end } };
  }
  const entries = await db.workLogEntry.findMany({
    where: { ...(clientId ? { clientId } : {}), ...dateFilter },
    include: { user: { select: { name: true } } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(entries);
}

export async function POST(req: Request) {
  const parsed = WorkLogSchema.parse(await req.json());
  const entry = await db.workLogEntry.create({ data: parsed as any });
  return NextResponse.json(entry, { status: 201 });
}
