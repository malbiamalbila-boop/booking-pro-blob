
import { NextResponse } from "next/server";
import { query } from "../../../lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const customer_id = searchParams.get("customer_id");
  const booking_id = searchParams.get("booking_id");
  const params: any[] = [];
  let sql = "select * from documents where 1=1";
  if (customer_id) { params.push(customer_id); sql += ` and customer_id = $${params.length}`; }
  if (booking_id)  { params.push(booking_id);  sql += ` and booking_id  = $${params.length}`; }
  sql += " order by uploaded_at desc limit 200";
  const { rows } = await query(sql, params);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const b = await req.json();
  const { customer_id, booking_id, kind, file_key, mime_type, size_bytes } = b;
  if (!file_key || !mime_type || !size_bytes) return NextResponse.json({ error: "missing fields" }, { status: 400 });
  if (!customer_id && !booking_id) return NextResponse.json({ error: "customer_id or booking_id required" }, { status: 400 });
  const { rows } = await query(
    `insert into documents(customer_id, booking_id, kind, file_key, mime_type, size_bytes, uploaded_by)
     values ($1,$2,$3,$4,$5,$6,$7) returning *`,
    [customer_id || null, booking_id || null, kind || "other", file_key, mime_type, size_bytes, "admin"]
  );
  return NextResponse.json(rows[0], { status: 201 });
}
