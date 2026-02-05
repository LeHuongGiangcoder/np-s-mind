import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
}



// Helper to sanitize connection string for HTTP driver
// neon() uses HTTP and doesn't support/need TCP-specific params like sslmode or channel_binding
// which can cause validation errors in Vercel builds.
function getSanitizedConnectionString(url: string) {
    try {
        const urlObj = new URL(url);
        urlObj.searchParams.delete("sslmode");
        urlObj.searchParams.delete("channel_binding");
        return urlObj.toString();
    } catch {
        return url;
    }
}

const sanitizedUrl = getSanitizedConnectionString(process.env.DATABASE_URL);
const sqlClient = neon(sanitizedUrl); // Rename to avoid conflict with import if any, though previous code used sql

export const db = drizzle(sqlClient, { schema });
