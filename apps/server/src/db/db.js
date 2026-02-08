// apps/server/src/db/db.js
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

function now() {
  return Date.now();
}

// Reliable __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// We want DB + schema paths stable no matter where node is launched from.
// db.js lives at: apps/server/src/db/db.js
// schema.sql lives at: apps/server/src/db/schema.sql
const SERVER_ROOT = path.resolve(__dirname, "../../"); // -> apps/server
const DATA_DIR = path.join(SERVER_ROOT, "data");
const DB_PATH = path.join(DATA_DIR, "data.sqlite");
const SCHEMA_PATH = path.join(SERVER_ROOT, "src", "db", "schema.sql");

// Ensure /data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Open DB
export const db = new Database(DB_PATH);

// Pragmas (safe + stable)
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");
db.pragma("foreign_keys = ON");

// Apply schema
try {
  const schema = fs.readFileSync(SCHEMA_PATH, "utf8");
  db.exec(schema);
} catch (e) {
  // This is a common crash point, so throw with clear message
  const msg = [
    "Failed to load or execute schema.sql",
    `SCHEMA_PATH: ${SCHEMA_PATH}`,
    `DB_PATH: ${DB_PATH}`,
    `Error: ${e?.message || e}`
  ].join("\n");
  const err = new Error(msg);
  err.cause = e;
  throw err;
}

// Minimal health helper (optional, but helpful for debugging)
export function dbInfo() {
  try {
    const row = db.prepare("SELECT COUNT(*) as c FROM runs").get();
    return {
      ok: true,
      dbPath: DB_PATH,
      schemaPath: SCHEMA_PATH,
      runsCount: row?.c ?? 0,
      time: now()
    };
  } catch (e) {
    return {
      ok: false,
      dbPath: DB_PATH,
      schemaPath: SCHEMA_PATH,
      error: e?.message || String(e),
      time: now()
    };
  }
}
