import { NextResponse } from "next/server";

import { migrateLegacyData } from "@/lib/data/legacy-migration";
import { isValidLegacyData } from "@/lib/data/legacy-migration-validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: unknown;
  try { payload = await request.json(); } catch { payload = null; }

  if (!payload || typeof payload !== "object" || !("data" in payload) || !isValidLegacyData(payload.data)) {
    return NextResponse.json(
      { data: null, error: "Legacy browser data is invalid or incompatible." },
      { status: 400 },
    );
  }

  const result = await migrateLegacyData(payload.data);
  return NextResponse.json(result, { status: result.error ? 400 : 200 });
}
