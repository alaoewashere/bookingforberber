import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      const text = readFileSync(resolve(process.cwd(), file), "utf8");
      for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq === -1) continue;
        const k = trimmed.slice(0, eq).trim();
        const v = trimmed.slice(eq + 1).trim();
        if (k) process.env[k] = v;
      }
      break;
    } catch {
      /* try next */
    }
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key || url.includes("placeholder")) {
  console.error("FAIL: Missing or placeholder Supabase env vars");
  process.exit(1);
}

const supabase = createClient(url, key);

const { data, error } = await supabase.from("appointments").select("id").limit(1);

if (error) {
  console.error("FAIL:", error.message);
  if (error.message.includes("does not exist") || error.code === "42P01") {
    console.error("Hint: Run supabase/migrations/001_create_appointments.sql in the SQL Editor.");
  }
  process.exit(1);
}

const { count, error: countErr } = await supabase
  .from("appointments")
  .select("*", { count: "exact", head: true });

if (countErr) {
  console.error("FAIL count:", countErr.message);
  process.exit(1);
}

console.log("OK: Connected to Supabase");
console.log("OK: appointments table exists, rows:", count ?? 0);
