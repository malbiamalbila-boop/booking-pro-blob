
import { NextResponse } from "next/server";
import { query } from "../../../../../lib/db";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { rows } = await query("select * from documents where id=$1", [params.id]);
  if (!rows.length) return NextResponse.json({ error: "not found" }, { status: 404 });
  const doc = rows[0] as { file_key: string; mime_type: string };

  const blobUrl = `https://blob.vercel-storage.com/${doc.file_key}`;
  const r = await fetch(blobUrl, { headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` } });
  if (!r.ok || !r.body) return NextResponse.json({ error: "fetch failed" }, { status: 500 });

  return new NextResponse(r.body, {
    headers: {
      "Content-Type": doc.mime_type,
      "Content-Disposition": "inline"
    },
  });
}
