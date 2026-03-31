// apps/server/src/services/llm/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env.js";

let client = null;

export function getGemini() {
  if (!env.GEMINI_API_KEY) {
    const err = new Error("Missing GEMINI_API_KEY in apps/server/.env");
    err.status = 400;
    throw err;
  }

  if (!client) {
    client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }

  return client;
}

export function getGeminiModel() {
  console.log("✅ GEMINI_MODEL =", env.GEMINI_MODEL);
  return env.GEMINI_MODEL || "gemini-flash-latest";
}
