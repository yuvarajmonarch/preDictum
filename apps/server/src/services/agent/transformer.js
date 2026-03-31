// apps/server/src/services/agent/transformer.js
import { getGemini, getGeminiModel } from "../llm/gemini.js";

function clamp(str, max) {
  const s = String(str || "");
  return s.length > max ? s.slice(0, max) : s;
}

export async function transformWithGemini({
  prompt,
  filePath,
  oldText,
  rules = {}
}) {
  const client = getGemini();
  const model = client.getGenerativeModel({
    model: getGeminiModel()
  });

  const safeText = clamp(oldText, rules.maxInputChars || 40000);
  const safePrompt = clamp(prompt, rules.maxPromptChars || 2000);

  const instruction = `
You are a senior software engineer.

Edit ONLY the file content I provide.

Return ONLY the updated file content.
Do NOT return markdown.
Do NOT add explanations.
Do NOT wrap in code fences.

If the prompt is unclear, improve the file safely.

File path: ${filePath}
  `;

  const finalPrompt = `
${instruction}

User Request:
${safePrompt}

Current File Content:
${safeText}
  `;

  const result = await model.generateContent(finalPrompt);
  const response = await result.response;
  const output = response.text().trim();

  if (!output) {
    const err = new Error("Gemini returned empty output");
    err.status = 502;
    throw err;
  }

  return output;
}
