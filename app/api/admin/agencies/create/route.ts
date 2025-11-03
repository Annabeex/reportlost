// app/api/agency/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

const QuerySchema = z.object({
  slug: z.string().min(1),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parse = QuerySchema.safeParse({ slug: url.searchParams.get("slug") || "" });

  if (!parse.success) {
    return NextResponse.json({ ok: false, error: parse.error.flatten() }, { status: 400 });
  }

  const { slug } = parse.data;
  return NextResponse.json({ ok: true, slug });
}
