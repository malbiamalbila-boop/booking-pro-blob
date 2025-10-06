import { drizzle } from "drizzle-orm/vercel-postgres";
import { Pool } from "@vercel/postgres";
import * as schema from "./schema";

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

export const db = drizzle(pool, { schema });

export type Database = typeof db;
export type Schema = typeof schema;
