import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  GitBranch,
  ShieldCheck,
  Radio,
  ArrowRight,
  Server,
  Waves,
  FileClock
} from "lucide-react";

import Dashboard from "./pages/Dashboard.jsx";
import RunAutomation from "./pages/RunAutomation.jsx";
import DigitalTwin from "./pages/DigitalTwin.jsx";
import Logs from "./pages/Logs.jsx";

const API_BASE = "http://localhost:8080";

function cx(...arr) {
  return arr.filter(Boolean).join(" ");
}

function pill(status) {
  const map = {
    up: "bg-emerald-500/15 text-emerald-200 border-emerald-400/20",
    down: "bg-rose-500/15 text-rose-200 border-rose-400/20",
    unknown: "bg-white/10 text-white/70 border-white/10"
  };
  return map[status] || map.unknown;
}

export default function App() {
  const [health, setHealth] = useState({ status: "unknown", data: null });
  const [twin, setTwin] = useState(null);
  const [loading, setLoading] = useState(true);

  // home | dashboard | run | twin | logs
  const [activePage, setActivePage] = useState("home");

  const statusText = useMemo(() => {
    if (health.status === "up") return "Backend Online";
    if (health.status === "down") return "Backend Offline";
    return "Checking Backend...";
  }, [health.status]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const h = await fetch(`${API_BASE}/api/health`);
        const hJson = await h.json();
        if (!mounted) return;
        setHealth({ status: h.ok ? "up" : "down", data: hJson });

        const t = await fetch(`${API_BASE}/api/twin/state`);
        const tJson = await t.json();
        if (!mounted) return;
        setTwin(t.ok ? tJson.twin : null);
      } catch (e) {
        if (!mounted) return;
        setHealth({ status: "down", data: null });
        setTwin(null);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    load();
    const id = setInterval(load, 5000); // keep status fresh
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const codeTwin = twin?.codeTwin;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none" /> */}

      <div className="max-w-6xl mx-auto px-5 py-10">
        {/* Simple "no-router" navigation */}
        {activePage !== "home" && (
          <motion.div
            initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mb-6"
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <button
                onClick={() => setActivePage("home")}
                className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 transition"
              >
                ← Back
              </button>

              <div className="flex flex-wrap gap-2">
                <QuickTab
                  active={activePage === "dashboard"}
                  onClick={() => setActivePage("dashboard")}
                  label="Dashboard"
                  icon={Activity}
                />
                <QuickTab
                  active={activePage === "run"}
                  onClick={() => setActivePage("run")}
                  label="Run"
                  icon={GitBranch}
                />
                <QuickTab
                  active={activePage === "twin"}
                  onClick={() => setActivePage("twin")}
                  label="Twin"
                  icon={Waves}
                />
                <QuickTab
                  active={activePage === "logs"}
                  onClick={() => setActivePage("logs")}
                  label="Logs"
                  icon={FileClock}
                />
              </div>
            </div>

            <div className="mt-4 glass rounded-2xl p-4 ring-soft">
              {activePage === "dashboard" && <Dashboard />}
              {activePage === "run" && <RunAutomation />}
              {activePage === "twin" && <DigitalTwin />}
              {activePage === "logs" && <Logs />}
            </div>
          </motion.div>
        )}

        {/* Landing Home */}
        {activePage === "home" && (
          <>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="flex items-start justify-between gap-6"
            >
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5">
                  <Radio className="w-4 h-4 text-indigo-200" />
                  <span className="text-sm text-white/80">
                    Live Digital Twin + Safe Branch Automation
                  </span>
                </div>

                <h1 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight">
                  Agentic Digital Twin
                </h1>
                <p className="mt-3 text-white/70 max-w-2xl leading-relaxed">
                  A developer-grade interface to run safe automated code changes in an alternate
                  branch, while a real-time digital twin mirrors every action as it happens.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span
                    className={cx("px-3 py-1 rounded-full border text-sm", pill(health.status))}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Server className="w-4 h-4" />
                      {statusText}
                    </span>
                  </span>

                  {codeTwin?.status && (
                    <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-sm text-white/75">
                      <span className="inline-flex items-center gap-2">
                        <Waves className="w-4 h-4 text-emerald-200/90" />
                        Twin Status:{" "}
                        <span className="text-white/90">{codeTwin.status}</span>
                      </span>
                    </span>
                  )}
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
                className="hidden md:block glass rounded-2xl p-4 w-[320px]"
              >
                <div className="text-sm text-white/70">Quick Actions</div>
                <div className="mt-3 grid gap-2">
                  <ActionButton
                    title="Dashboard"
                    desc="Overview + status"
                    icon={Activity}
                    onClick={() => setActivePage("dashboard")}
                  />
                  <ActionButton
                    title="Run Automation"
                    desc="Create alternate branch + PR"
                    icon={GitBranch}
                    onClick={() => setActivePage("run")}
                  />
                  <ActionButton
                    title="Open Digital Twin"
                    desc="Live mirror with timeline"
                    icon={Waves}
                    onClick={() => setActivePage("twin")}
                  />
                  <ActionButton
                    title="View Logs"
                    desc="Run history + steps"
                    icon={FileClock}
                    onClick={() => setActivePage("logs")}
                  />
                </div>
                <div className="mt-3 text-xs text-white/50">
                  (No router used — simple page switch.)
                </div>
              </motion.div>
            </motion.div>

            {/* Cards */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
              className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5"
            >
              <InfoCard
                icon={GitBranch}
                title="Safe Branch Flow"
                value="alternate/*"
                subtitle="Never touch main directly. Changes go to a generated alternate branch."
              />
              <InfoCard
                icon={ShieldCheck}
                title="Human-in-the-loop"
                value="Draft PR"
                subtitle="Agent prepares a draft PR so you review before merging."
              />
              <InfoCard
                icon={Activity}
                title="Digital Twin"
                value="Real-time"
                subtitle="A live system mirror that tracks stage, progress, and a timeline."
              />
            </motion.div>

            {/* Live preview */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.18 }}
              className="mt-6 glass rounded-2xl p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm text-white/60">Live Twin Snapshot</div>
                  <div className="mt-1 text-lg font-semibold">
                    {codeTwin?.repo ? codeTwin.repo : "No active repo yet"}
                  </div>
                  <div className="mt-1 text-sm text-white/60">
                    {codeTwin?.lastAction
                      ? codeTwin.lastAction
                      : "Run an automation to populate state."}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 transition"
                  >
                    Refresh
                  </button>
                  <button
                    onClick={() => setActivePage("twin")}
                    className="px-3 py-2 rounded-xl bg-indigo-500/20 border border-indigo-400/20 text-indigo-100 hover:bg-indigo-500/30 transition inline-flex items-center gap-2"
                  >
                    Open Twin <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <MiniStat label="Base Branch" value={codeTwin?.baseBranch || "main"} />
                <MiniStat label="Alt Branch" value={codeTwin?.altBranch || "—"} />
                <MiniStat label="PR" value={codeTwin?.prUrl ? "Created" : "—"} />
              </div>

              <div className="mt-5">
                <div className="text-sm text-white/60">Timeline</div>
                <div className="mt-2 rounded-xl border border-white/10 bg-black/20 overflow-hidden">
                  <div className="max-h-[220px] overflow-auto">
                    {loading ? (
                      <div className="p-4 text-white/60">Loading…</div>
                    ) : twin?.timeline?.length ? (
                      <ul className="divide-y divide-white/10">
                        {twin.timeline
                          .slice(-12)
                          .reverse()
                          .map((e, idx) => (
                            <li
                              key={idx}
                              className="p-3 flex items-start justify-between gap-4"
                            >
                              <div>
                                <div className="text-sm text-white/85">
                                  {e.msg || e.type}
                                </div>
                                <div className="text-xs text-white/50 mt-0.5">
                                  {e.type}
                                </div>
                              </div>
                              <div className="text-xs text-white/45 whitespace-nowrap">
                                {new Date(e.t).toLocaleTimeString()}
                              </div>
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <div className="p-4 text-white/60">
                        No events yet. Trigger an automation run.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Footer */}
            <div className="mt-10 text-xs text-white/45">
              Backend: <span className="text-white/65">{API_BASE}</span> • WS:{" "}
              <span className="text-white/65">ws://localhost:8080/ws/twin</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function QuickTab({ active, onClick, label, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "px-3 py-2 rounded-xl border transition inline-flex items-center gap-2 text-sm",
        active
          ? "bg-indigo-500/15 border-indigo-400/20 text-white"
          : "bg-white/5 border-white/10 text-white/75 hover:bg-white/10"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function ActionButton({ title, desc, icon: Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition px-3 py-3"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-400/15 flex items-center justify-center">
          <Icon className="w-5 h-5 text-indigo-100/90" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-white/90">{title}</div>
          <div className="text-xs text-white/60 truncate">{desc}</div>
        </div>
        <ArrowRight className="w-4 h-4 text-white/30 ml-auto group-hover:text-white/60 transition" />
      </div>
    </button>
  );
}

function InfoCard({ icon: Icon, title, value, subtitle }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="glass rounded-2xl p-5 ring-soft"
    >
      <div className="flex items-center justify-between">
        <div className="w-11 h-11 rounded-2xl bg-white/6 border border-white/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-white/80" />
        </div>
        <span className="text-sm px-2 py-1 rounded-full border border-white/10 bg-white/5 text-white/70">
          {value}
        </span>
      </div>
      <div className="mt-4 font-semibold text-white/92">{title}</div>
      <div className="mt-1 text-sm text-white/60 leading-relaxed">{subtitle}</div>
    </motion.div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-white/55">{label}</div>
      <div className="mt-1 font-semibold text-white/90 truncate">{value}</div>
    </div>
  );
}
