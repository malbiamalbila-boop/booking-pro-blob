
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const entity = form.get("entity") as string | null;
  const entity_id = form.get("entity_id") as string | null;
  const kind = (form.get("kind") as string | null) ?? "other";

  if (!file || !entity || !entity_id) {
    return NextResponse.json({ error: "file, entity, entity_id krävs" }, { status: 400 });
  }

  const allowed = ["image/jpeg", "image/png", "application/pdf"];
  if (!allowed.includes(file.type)) return NextResponse.json({ error: "Ogiltig filtyp" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Max 10MB" }, { status: 400 });

  const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1];
  const key = `documents/${entity}/${entity_id}/${crypto.randomUUID()}.${ext}`;

  const blob = await put(key, file, {
    access: "private",
    addRandomSuffix: false,
    token: process.env.BLOB_READ_WRITE_TOKEN, // required for private access
    contentType: file.type,
  });

  return NextResponse.json({
    file_key: blob.pathname, // e.g. documents/customer/uuid/file.pdf
    url: blob.url,
    size: file.size,
    mime: file.type,
    kind,
  });
}
