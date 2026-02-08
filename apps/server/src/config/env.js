import dotenv from "dotenv";

dotenv.config();

function req(key) {
  const v = process.env[key];
  if (!v || !String(v).trim()) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return v;
}

export const env = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 8080),

  // Allow multiple origins: "http://localhost:5173,http://localhost:3000"
  CORS_ORIGIN: (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  // Optional now, required when you implement GitHub calls
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || "",

  // Optional now, required when you implement SQLite
  DB_PATH: process.env.DB_PATH || "./data/app.sqlite"
});
