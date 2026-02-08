import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, GitBranch, Logs, Rocket, Server, Waves } from "lucide-react";

const API_BASE = "http://localhost:8080";

function cx(...arr) {
  return arr.filter(Boolean).join(" ");
}

function Chip({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 ring-soft">
      <div className="flex items-center gap-2 text-xs text-white/55">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold text-white/90 truncate">{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const [health, setHealth] = useState({ ok: false, loading: true });
  const [twin, setTwin] = useState(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const h = await fetch(`${API_BASE}/api/health`);
        const hj = await h.json();
        if (!alive) return;
        setHealth({ ok: h.ok, loading: false, data: hj });

        const t = await fetch(`${API_BASE}/api/twin/state`);
        const tj = await t.json();
        if (!alive) return;
        setTwin(t.ok ? tj.twin : null);
      } catch {
        if (!alive) return;
        setHealth({ ok: false, loading: false, data: null });
        setTwin(null);
      }
    }
    load();
    const id = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const status = useMemo(() => {
    if (health.loading) return "Checking…";
    return health.ok ? "Online" : "Offline";
  }, [health.loading, health.ok]);

  const codeTwin = twin?.codeTwin;
  const last = twin?.timeline?.length ? twin.timeline[twin.timeline.length - 1] : null;

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5">
          <Rocket className="w-4 h-4 text-indigo-200" />
          <span className="text-sm text-white/75">Dashboard</span>
        </div>

        <h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">
          Control Center
        </h2>
        <p className="mt-2 text-white/65 max-w-2xl">
          Monitor backend health, current twin status, and latest activity at a glance.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut", delay: 0.08 }}
        className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Chip icon={Server} label="Backend" value={status} />
        <Chip icon={Waves} label="Twin status" value={codeTwin?.status || "IDLE"} />
        <Chip icon={GitBranch} label="Repo" value={codeTwin?.repo || "—"} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut", delay: 0.14 }}
        className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        <div className="glass rounded-2xl p-5 ring-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white/60">Latest activity</div>
              <div className="mt-1 text-lg font-semibold text-white/90">
                {last?.msg || "No events yet"}
              </div>
              <div className="mt-1 text-xs text-white/45">
                {last?.type ? `${last.type} • ${new Date(last.t).toLocaleString()}` : "Trigger an automation run to generate events."}
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-400/15 flex items-center justify-center">
              <Activity className="w-5 h-5 text-indigo-100/90" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <Mini label="Base branch" value={codeTwin?.baseBranch || "main"} />
            <Mini label="Alt branch" value={codeTwin?.altBranch || "—"} />
            <Mini label="PR" value={codeTwin?.prUrl ? "Created" : "—"} />
          </div>
        </div>

        <div className="glass rounded-2xl p-5 ring-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white/60">Quick shortcuts</div>
              <div className="mt-1 text-white/80 text-sm">Pages available:</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-white/6 border border-white/10 flex items-center justify-center">
              <Logs className="w-5 h-5 text-white/75" />
            </div>
          </div>

          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li className="flex items-center justify-between">
              <span>Run Automation</span>
              <span className="text-xs text-white/40">/run</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Digital Twin</span>
              <span className="text-xs text-white/40">/twin</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Logs</span>
              <span className="text-xs text-white/40">/logs</span>
            </li>
          </ul>

          <div className="mt-4 text-xs text-white/45">
            We’ll add routing next so these open properly.
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-white/55">{label}</div>
      <div className="mt-1 font-semibold text-white/90 truncate">{value}</div>
    </div>
  );
}
