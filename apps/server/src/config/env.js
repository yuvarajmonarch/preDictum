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

  // GitHub
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || "",

  // Database
  DB_PATH: process.env.DB_PATH || "./data/app.sqlite",

  // ===== LLM CONFIG =====

  // Only required when using Gemini
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-2.5-flash",

});
console.log("GEMINI KEY:", process.env.GEMINI_API_KEY);
