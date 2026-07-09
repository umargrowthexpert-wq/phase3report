import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const KeywordSchema = z.object({
  clientId: z.string(),
  keyword: z.string().min(1),
  location: z.string().optional(),
  intent: z.string().optional(),
  landingPage: z.string().optional(),
  volume: z.number().optional(),
  notes: z.string().optional(),
  position: z.number().optional(), // today's position, stored as history
});

export async function GET(req: Request) {
  const clientId = new URL(req.url).searchParams.get("clientId");
  const keywords = await db.keyword.findMany({
    where: clientId ? { clientId } : undefined,
    include: { positions: { orderBy: { date: "desc" }, take: 2 } },
  });
  const withMovement = keywords.map((k: any) => {
    const [current, previous] = k.positions;
    return {
      ...k,
      currentPosition: current?.position ?? null,
      previousPosition: previous?.position ?? null,
      movement: current && previous ? previous.position - current.position : null,
    };
  });
  return NextResponse.json(withMovement);
}

export async function POST(req: Request) {
  const parsed = KeywordSchema.parse(await req.json());
  const { position, ...data } = parsed;
  const keyword = await db.keyword.create({ data: data as any });
  if (position != null) {
    await db.keywordPosition.create({
      data: { keywordId: keyword.id, date: new Date(), position },
    });
  }
  return NextResponse.json(keyword, { status: 201 });
}
