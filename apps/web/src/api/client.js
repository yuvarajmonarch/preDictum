// apps/web/src/api/client.js
const API_BASE = "http://localhost:8080";

async function parseJsonSafe(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export async function apiFetch(path, { method = "GET", body, headers, signal } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(headers || {})
    },
    body: body ? JSON.stringify(body) : undefined,
    signal
  });

  const payload = await parseJsonSafe(res);

  if (!res.ok) {
    const message =
      payload?.error ||
      payload?.message ||
      `Request failed (${res.status} ${res.statusText})`;
    throw new ApiError(message, res.status, payload);
  }

  return payload;
}

export const api = {
  get: (path, opts) => apiFetch(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => apiFetch(path, { ...opts, method: "POST", body }),
  del: (path, opts) => apiFetch(path, { ...opts, method: "DELETE" })
};
