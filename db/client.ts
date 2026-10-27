import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL!;

// prepare: false is required when connecting through Supabase's pooled
// (pgbouncer, transaction mode) connection string.
const sql = postgres(connectionString, { ssl: "require", max: 1, prepare: false });
export const db = drizzle(sql, { schema });
