
# Booking Pro – Vercel Blob (ingen AWS/Supabase)

## Vad är detta?
En komplett Next.js-bokningsapp (biluthyrning) som använder:
- Postgres (Neon) för data
- FullCalendar + Google ICS
- **Vercel Blob** för privata filer (pass/ID/körkort) – inga externa konton

## Miljövariabler (Vercel)
- `DATABASE_URL` → din Neon **pooled** URL
- `ADMIN_USER`, `ADMIN_PASS` → Basic Auth till appen
- `GOOGLE_ICS_URL` → valfri (annars default)
- `BLOB_READ_WRITE_TOKEN` → skapa i Vercel: Project → Storage → Blobs → Tokens (Read-Write)

## Setup
1. Neon → kör `migrations/001_init.sql` i SQL Editor (skapar vehicles/customers/bookings/documents).
2. Vercel → Settings → Environment Variables → lägg in ovan.
3. Vercel → Storage → Blobs → skapa storage (om behövs), **Create Token (RW)**.
4. Importera repot som **Next.js**, Root Directory tom → Deploy.
5. Test: `/api/healthz` → ok. Logga in → flik **Customers** → ladda upp dokument → **Hämta**.

## API
- `POST /api/uploads/put` → multipart POST (file + entity + entity_id + kind) → sparar i Blob, returnerar nyckel.
- `POST /api/documents` → sparar metadata i DB.
- `GET  /api/documents?customer_id=...` → listar docs.
- `GET  /api/documents/[id]/download` → server-proxy (privat blob → stream).

## Noteringar
- Filtyper: JPG/PNG/PDF, max 10MB (justera i koden).
- Alla blobbar är **private** (hämtas via servern med token).
