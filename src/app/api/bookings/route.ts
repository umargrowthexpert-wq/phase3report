import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const BookingSchema = z.object({
  clientId: z.string(),
  bookingDate: z.string().datetime(),
  customer: z.string().min(1),
  service: z.string().optional(),
  revenue: z.number().optional(),
  staff: z.string().optional(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
  leadSource: z.string().optional(),
});

export async function GET(req: Request) {
  const clientId = new URL(req.url).searchParams.get("clientId");
  const bookings = await db.booking.findMany({
    where: clientId ? { clientId } : undefined,
    orderBy: { bookingDate: "desc" },
    take: 200,
  });
  return NextResponse.json(bookings);
}

export async function POST(req: Request) {
  const body = await req.json();
  const items = Array.isArray(body) ? body : [body];
  const parsed = items.map((i) => BookingSchema.parse(i));
  const created = await db.booking.createMany({ data: parsed as any });
  return NextResponse.json({ created: created.count }, { status: 201 });
}
