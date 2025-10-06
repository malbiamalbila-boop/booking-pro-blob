import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const file = await readFile(join(process.cwd(), "openapi/openapi.yaml"), "utf8");
  return new NextResponse(file, {
    headers: {
      "Content-Type": "application/yaml; charset=utf-8",
    },
  });
}
