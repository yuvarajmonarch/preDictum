import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileClock, RefreshCcw, Search } from "lucide-react";

const API_BASE = "http://localhost:8080";

function cx(...arr) {
  return arr.filter(Boolean).join(" ");
}

export default function Logs() {
  const [runs, setRuns] = useState([]);
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function loadRuns() {
    setErr("");
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/api/logs/runs`);
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Failed to load runs");
      setRuns(j.runs || []);
      if (!selected && j.runs?.length) setSelected(j.runs[0].id);
    } catch (e) {
      setErr(e.message || "Error");
      setRuns([]);
    } finally {
      setBusy(false);
    }
  }

  async function loadDetails(runId) {
    if (!runId) return;
    setErr("");
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/api/logs/runs/${encodeURIComponent(runId)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Failed to load run");
      setDetails(j);
    } catch (e) {
      setErr(e.message || "Error");
      setDetails(null);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selected) loadDetails(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const filtered = runs.filter((r) => {
    const s = `${r.id} ${r.repo || ""} ${r.status || ""}`.toLowerCase();
    return s.includes(q.toLowerCase());
  });

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5">
            <FileClock className="w-4 h-4 text-indigo-200" />
            <span className="text-sm text-white/75">Logs</span>
          </div>
          <h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">
            Run History
          </h2>
          <p className="mt-2 text-white/65 max-w-2xl">
            View previous runs and step-by-step log entries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-white/45 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-xl border border-white/10 bg-black/20 text-white/85 outline-none focus:border-indigo-400/40"
              placeholder="Search runs…"
            />
          </div>

          <button
            onClick={loadRuns}
            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 transition inline-flex items-center gap-2"
            disabled={busy}
          >
            <RefreshCcw className={cx("w-4 h-4", busy && "animate-spin")} />
            Refresh
          </button>
        </div>
      </motion.div>

      {err && (
        <div className="mt-6 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100">
          {err}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut", delay: 0.08 }}
        className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        <div className="glass rounded-2xl p-3 ring-soft">
          <div className="px-2 py-2 text-xs text-white/55">
            Runs ({filtered.length})
          </div>
          <div className="max-h-[520px] overflow-auto">
            {filtered.length ? (
              <ul className="space-y-2 p-2">
                {filtered.map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => setSelected(r.id)}
                      className={cx(
                        "w-full text-left rounded-xl border px-3 py-3 transition",
                        selected === r.id
                          ? "border-indigo-400/30 bg-indigo-500/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      )}
                    >
                      <div className="text-sm text-white/90 font-medium truncate">
                        {r.repo || "—"}
                      </div>
                      <div className="mt-1 text-xs text-white/55">
                        {r.status || "—"} • {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
                      </div>
                      <div className="mt-1 text-xs text-white/40 truncate">{r.id}</div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-sm text-white/60">No runs yet.</div>
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-5 ring-soft lg:col-span-2">
          <div className="text-sm text-white/75 font-semibold">Details</div>

          {!details ? (
            <div className="mt-3 text-sm text-white/60">
              Select a run to view logs.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Mini label="Run ID" value={details.run?.id} />
                <Mini label="Repo" value={details.run?.repo || "—"} />
                <Mini label="Status" value={details.run?.status || "—"} />
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
                <div className="px-3 py-2 text-xs text-white/55 border-b border-white/10">
                  Step logs ({details.logs?.length || 0})
                </div>
                <div className="max-h-[420px] overflow-auto">
                  {details.logs?.length ? (
                    <ul className="divide-y divide-white/10">
                      {details.logs.map((l) => (
                        <li key={l.id} className="p-3">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="text-sm text-white/85">
                              {l.message}
                            </div>

                            <div className="mt-2 flex items-center gap-2 flex-wrap">
                              <TypeBadge type={l.type} />
                              <span className="text-xs text-white/45">
                                {l.createdAt ? new Date(l.createdAt).toLocaleString() : ""}
                              </span>
                            </div>


                            </div>
                          </div>
                          {l.meta ? (
                          <pre className="mt-2 text-xs text-white/55 whitespace-pre-wrap break-words bg-white/5 border border-white/10 rounded-xl p-2">
                            {typeof l.meta === "string" ? l.meta : JSON.stringify(l.meta, null, 2)}
                          </pre>
                        ) 
                        : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-sm text-white/60">No logs for this run.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-white/55">{label}</div>
      <div className="mt-1 font-semibold text-white/90 break-all">{value || "—"}</div>
    </div>
  );
}
function TypeBadge({ type }) {
  const t = String(type || "").toLowerCase();

  const tone =
    t.includes("failed") || t.includes("error")
      ? "danger"
      : t.includes("completed") || t.includes("done") || t.includes("created")
      ? "success"
      : t.includes("connect") || t.includes("plan")
      ? "info"
      : "neutral";

  const cls =
    tone === "danger"
      ? "bg-rose-500/15 text-rose-100 border-rose-400/20"
      : tone === "success"
      ? "bg-emerald-500/15 text-emerald-100 border-emerald-400/20"
      : tone === "info"
      ? "bg-indigo-500/15 text-indigo-100 border-indigo-400/20"
      : "bg-white/10 text-white/70 border-white/10";

  return (
    <span className={cx("inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium", cls)}>
      {type || "unknown"}
    </span>
  );
}
