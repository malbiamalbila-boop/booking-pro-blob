diff --git a/app/api/ics/route.ts b/app/api/ics/route.ts
index 9b199fb50950164e6ca57a44de753ac4363bf285..be0f007838ef3f9ca0450663ec7138c217775045 100644
--- a/app/api/ics/route.ts
+++ b/app/api/ics/route.ts
@@ -1,2 +1,54 @@
-import { NextResponse } from "next/server"; import { query } from "../../../lib/db"; export const runtime="nodejs";
-export async function GET(){ const {rows}=await query(`select b.id,b.starts_at,b.ends_at,v.display_name,coalesce(c.full_name,'') as customer from bookings b join vehicles v on v.id=b.vehicle_id left join customers c on c.id=b.customer_id where b.status in ('pending','confirmed')`); const lines=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//BookingPro//EN"]; for(const r of rows){ const uid=r.id; const dtStart=new Date(r.starts_at).toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z"); const dtEnd=new Date(r.ends_at).toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z"); const summary=`${r.display_name}${r.customer?" · "+r.customer:""}`.replace(/\n/g," "); lines.push("BEGIN:VEVENT",`UID:${uid}`,`DTSTART:${dtStart}`,`DTEND:${dtEnd}`,`SUMMARY:${summary}`,"END:VEVENT"); } lines.push("END:VCALENDAR"); return new NextResponse(lines.join("\r\n"),{ headers:{"Content-Type":"text/calendar; charset=utf-8","Content-Disposition":"attachment; filename=bookings.ics"} }); }
+import { NextResponse } from "next/server";
+import { query } from "../../../lib/db";
+
+export const runtime = "nodejs";
+export const dynamic = "force-dynamic";
+
+export async function GET() {
+  const { rows } = await query(`
+    select b.id,
+           b.starts_at,
+           b.ends_at,
+           v.display_name,
+           coalesce(c.full_name,'') as customer
+      from bookings b
+      join vehicles v on v.id = b.vehicle_id
+      left join customers c on c.id = b.customer_id
+     where b.status in('pending','confirmed')
+  `);
+
+  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//BookingPro//EN"];
+
+  for (const r of rows) {
+    const uid = r.id;
+    const dtStart = new Date(r.starts_at)
+      .toISOString()
+      .replace(/[-:]/g, "")
+      .replace(/\.\d{3}Z$/, "Z");
+    const dtEnd = new Date(r.ends_at)
+      .toISOString()
+      .replace(/[-:]/g, "")
+      .replace(/\.\d{3}Z$/, "Z");
+    const summary = `${r.display_name}${r.customer ? " · " + r.customer : ""}`.replace(
+      /\n/g,
+      " "
+    );
+    lines.push(
+      "BEGIN:VEVENT",
+      `UID:${uid}`,
+      `DTSTART:${dtStart}`,
+      `DTEND:${dtEnd}`,
+      `SUMMARY:${summary}`,
+      "END:VEVENT"
+    );
+  }
+
+  lines.push("END:VCALENDAR");
+
+  return new NextResponse(lines.join("\r\n"), {
+    headers: {
+      "Content-Type": "text/calendar; charset=utf-8",
+      "Content-Disposition": "attachment; filename=bookings.ics",
+    },
+  });
+}
