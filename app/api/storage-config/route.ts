import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return new Response(null, { status: 204 });

  return NextResponse.json(
    {
      tileBaseUrl: `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/drawing-tiles`,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    },
  );
}
