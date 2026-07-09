import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const ClientSchema = z.object({
  agencyId: z.string(),
  businessName: z.string().min(1),
  website: z.string().optional(),
  industry: z.string().optional(),
  locations: z.array(z.string()).default([]),
  services: z.array(z.string()).default([]),
  campaignStart: z.string().datetime().optional(),
  monthlyBudget: z.number().optional(),
  managerId: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const clients = await db.client.findMany({
    include: { manager: { select: { name: true } }, _count: { select: { leads: true, bookings: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(clients);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = ClientSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const client = await db.client.create({ data: parsed.data as any });
  return NextResponse.json(client, { status: 201 });
}
