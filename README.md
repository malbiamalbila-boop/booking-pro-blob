
# Booking Pro – Vercel Blob (public variant)

Denna version använder **Vercel Blob** med `access: "public"` för att undvika typfel och slippa token.
All överföring sker fortfarande via våra API-endpoints (servern), och UI visar bara "Hämta" som går via en server-proxy.

## Env vars (Vercel)
- `DATABASE_URL` → Neon pooled URL
- `ADMIN_USER`, `ADMIN_PASS`
- `GOOGLE_ICS_URL` (valfri)

## Setup
1) Neon → kör `migrations/001_init.sql`
2) Importera repo i Vercel (Next.js, Root Directory tom) → Deploy
3) Testa uppladdning i fliken **Customers**

> Observera: Public access innebär att filen är offentlig om man känner till exakt path.
För strikt privat lagring, byt till Supabase-zippen eller Vercel Blob private när din tenant stöder det.
