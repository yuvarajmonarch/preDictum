// apps/web/src/pages/DigitalTwin.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  RefreshCcw,
  Radio,
  Waves,
  AlertTriangle,
  Signal,
  WifiOff,
  Link as LinkIcon,
  GitBranch,
  Clock,
  FileText,
  Sparkles
} from "lucide-react";

import Button from "../components/common/Button.jsx";
import Badge from "../components/common/Badge.jsx";
import Loader from "../components/common/Loader.jsx";

import TwinStatus from "../components/twin/TwinStatus.jsx";
import TwinCards from "../components/twin/TwinCards.jsx";
import TwinTimeline from "../components/twin/TwinTimeline.jsx";

import useTwinSocket from "../twin/useTwinSocket.js";
import { resetTwin, getTwinState } from "../api/twin.api.js";

function cx(...arr) {
  return arr.filter(Boolean).join(" ");
}

function formatTime(ts) {
  try {
    return ts ? new Date(ts).toLocaleTimeString() : "—";
  } catch {
    return "—";
  }
}

function formatDate(ts) {
  try {
    return ts ? new Date(ts).toLocaleString() : "—";
  } catch {
    return "—";
  }
}

export default function DigitalTwin() {
  const { twin, mode, error, setTwin } = useTwinSocket();
  const codeTwin = twin?.codeTwin;

  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null); // { tone, text }
  const [autoScroll, setAutoScroll] = useState(true);
  const [compact, setCompact] = useState(false);

  const timelineWrapRef = useRef(null);
  const lastEventRef = useRef(null);

  const modeLabel = useMemo(() => {
    if (mode === "live") return { tone: "success", text: "Live (WebSocket)", icon: Signal };
    if (mode === "polling") return { tone: "warn", text: "Fallback (Polling)", icon: WifiOff };
    return { tone: "neutral", text: "Connecting…", icon: Waves };
  }, [mode]);

  const statusTone = useMemo(() => {
    const s = codeTwin?.status || "IDLE";
    if (s === "ERROR") return "danger";
    if (s === "PR_CREATED") return "success";
    if (s === "IDLE") return "neutral";
    return "info";
  }, [codeTwin?.status]);

  const latest = useMemo(() => {
    if (!twin?.timeline?.length) return null;
    return twin.timeline[twin.timeline.length - 1];
  }, [twin?.timeline]);

  // Auto-scroll to top (newest) inside our timeline wrapper if enabled
  useEffect(() => {
    if (!autoScroll) return;
    if (!timelineWrapRef.current) return;
    // our TwinTimeline renders newest first; just scroll to top
    timelineWrapRef.current.scrollTop = 0;
  }, [latest?.t, autoScroll]);

  // Small toast helper
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(id);
  }, [toast]);

  async function onReset() {
    setBusy(true);
    try {
      const snapshot = await resetTwin(); // returns twin or null
      if (snapshot) {
        setTwin(snapshot);
        setToast({ tone: "success", text: "Twin reset successfully" });
      } else {
        // fallback refresh
        const fresh = await getTwinState();
        if (fresh) setTwin(fresh);
        setToast({ tone: "neutral", text: "Twin reset requested" });
      }
    } catch (e) {
      setToast({ tone: "danger", text: e?.message || "Reset failed" });
    } finally {
      setBusy(false);
    }
  }

  async function onRefresh() {
    setBusy(true);
    try {
      const fresh = await getTwinState();
      if (fresh) setTwin(fresh);
      setToast({ tone: "info", text: "Snapshot refreshed" });
    } catch (e) {
      setToast({ tone: "danger", text: e?.message || "Refresh failed" });
    } finally {
      setBusy(false);
    }
  }

  const ModeIcon = modeLabel.icon;

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      {/* Toast */}
      <AnimatePresence>
        {toast ? (
          <motion.div
            initial={{ opacity: 0, y: -12, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed top-5 right-5 z-50"
          >
            <div
              className={cx(
                "rounded-2xl border px-4 py-3 backdrop-blur-xl shadow-2xl",
                toast.tone === "success"
                  ? "bg-emerald-500/15 border-emerald-400/20 text-emerald-100"
                  : toast.tone === "danger"
                  ? "bg-rose-500/15 border-rose-400/20 text-rose-100"
                  : toast.tone === "info"
                  ? "bg-indigo-500/15 border-indigo-400/20 text-indigo-100"
                  : "bg-white/10 border-white/10 text-white/80"
              )}
            >
              <div className="text-sm font-medium">{toast.text}</div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5">
            <Radio className="w-4 h-4 text-indigo-200" />
            <span className="text-sm text-white/75">Digital Twin</span>
          </div>

          <h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">
            Live System Mirror
          </h2>

          <p className="mt-2 text-white/65 max-w-2xl">
            Real-time view of agent automation state and timeline. This is your system “twin”.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge tone={modeLabel.tone}>
              <span className="inline-flex items-center gap-2">
                <ModeIcon className="w-4 h-4" />
                {modeLabel.text}
              </span>
            </Badge>

            <Badge tone={statusTone}>
              <span className="inline-flex items-center gap-2">
                <Activity className="w-4 h-4" />
                {codeTwin?.status || "IDLE"}
              </span>
            </Badge>

            {error ? (
              <Badge tone="danger">
                <span className="inline-flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </span>
              </Badge>
            ) : null}

            {codeTwin?.repo ? (
              <Badge tone="neutral">
                <span className="inline-flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  {codeTwin.repo}
                </span>
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" leftIcon={RefreshCcw} onClick={onRefresh} disabled={busy}>
            Refresh
          </Button>

          <Button variant="ghost" leftIcon={RefreshCcw} onClick={onReset} disabled={busy}>
            Reset Twin
          </Button>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut", delay: 0.08 }}
        className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        {/* Left column */}
        <div className="lg:col-span-1 space-y-4">
          <TwinStatus codeTwin={codeTwin} />

          {/* Live Snapshot Panel (extra LOC, useful info) */}
          <div className="glass rounded-2xl p-5 ring-soft">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-white/75 font-semibold">Live Snapshot</div>
              <Badge tone="neutral">
                <span className="inline-flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {formatTime(codeTwin?.updatedAt)}
                </span>
              </Badge>
            </div>

            <div className="mt-4 space-y-3">
              <Row
                icon={FileText}
                label="Last action"
                value={codeTwin?.lastAction || "Waiting"}
              />
              <Row
                icon={GitBranch}
                label="Base branch"
                value={codeTwin?.baseBranch || "main"}
              />
              <Row
                icon={GitBranch}
                label="Alt branch"
                value={codeTwin?.altBranch || "—"}
              />
              <Row
                icon={Clock}
                label="Updated"
                value={formatDate(codeTwin?.updatedAt)}
              />

              {codeTwin?.prUrl ? (
                <a
                  href={codeTwin.prUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-2 text-sm text-indigo-200 hover:underline break-all"
                >
                  <LinkIcon className="w-4 h-4" />
                  Open PR
                </a>
              ) : (
                <div className="text-xs text-white/45">
                  PR not created yet (run automation to generate one).
                </div>
              )}
            </div>
          </div>

          {!twin ? (
            <div className="glass rounded-2xl p-5 ring-soft">
              <Loader label={mode === "connecting" ? "Connecting to Twin…" : "Loading twin state…"} />
              <div className="mt-3 text-xs text-white/50">
                Make sure backend is running on{" "}
                <span className="text-white/70">localhost:8080</span>
              </div>
              <div className="mt-2 text-xs text-white/45">
                If WebSocket is blocked, the app will automatically switch to polling.
              </div>
            </div>
          ) : null}

          {!codeTwin?.repo ? (
            <div className="glass rounded-2xl p-5 ring-soft">
              <div className="flex items-center gap-2 text-sm text-white/85 font-semibold">
                <Sparkles className="w-4 h-4 text-indigo-200" />
                Tip
              </div>
              <div className="mt-2 text-sm text-white/65 leading-relaxed">
                Go to <span className="text-white/90">Run Automation</span> and run a{" "}
                <span className="text-white/90">dry-run</span> to generate timeline events here.
              </div>
            </div>
          ) : null}

          {/* View controls (extra LOC) */}
          <div className="glass rounded-2xl p-5 ring-soft">
            <div className="text-sm text-white/75 font-semibold">View Controls</div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setAutoScroll((v) => !v)}
                className={cx(
                  "px-3 py-2 rounded-xl border transition text-sm",
                  autoScroll
                    ? "bg-indigo-500/15 border-indigo-400/20 text-white"
                    : "bg-white/5 border-white/10 text-white/75 hover:bg-white/10"
                )}
              >
                Auto-scroll: {autoScroll ? "ON" : "OFF"}
              </button>

              <button
                onClick={() => setCompact((v) => !v)}
                className={cx(
                  "px-3 py-2 rounded-xl border transition text-sm",
                  compact
                    ? "bg-indigo-500/15 border-indigo-400/20 text-white"
                    : "bg-white/5 border-white/10 text-white/75 hover:bg-white/10"
                )}
              >
                Timeline: {compact ? "Compact" : "Detailed"}
              </button>
            </div>

            <div className="mt-3 text-xs text-white/50">
              Auto-scroll keeps the latest events visible. Compact mode hides metadata blocks.
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          <TwinCards codeTwin={codeTwin} />

          {/* Timeline wrapper so we can control scroll without changing TwinTimeline */}
          <div ref={timelineWrapRef} className="rounded-2xl">
            {/* We render timeline as-is, but add compact toggle by filtering meta at source */}
            <TwinTimeline
              timeline={
                compact
                  ? (twin?.timeline || []).map((e) => ({ ...e, meta: undefined }))
                  : (twin?.timeline || [])
              }
            />
          </div>

          {/* Footer info under timeline (extra LOC) */}
          <div ref={lastEventRef} className="glass rounded-2xl p-5 ring-soft">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="text-sm text-white/75 font-semibold">Latest Event</div>
                <div className="mt-1 text-sm text-white/70">
                  {latest ? (latest.msg || latest.type) : "No events yet"}
                </div>
                <div className="mt-1 text-xs text-white/45">
                  {latest?.type ? `${latest.type} • ${formatDate(latest.t)}` : "Run automation to populate timeline."}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge tone="neutral">
                  <span className="inline-flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {formatTime(latest?.t)}
                  </span>
                </Badge>

                <Badge tone="neutral">
                  <span className="inline-flex items-center gap-2">
                    <Waves className="w-4 h-4" />
                    {mode === "live" ? "WS" : mode === "polling" ? "POLL" : "…"}
                  </span>
                </Badge>
              </div>
            </div>

            <div className="mt-3 text-xs text-white/45">
              WS endpoint: <span className="text-white/65">ws://localhost:8080/ws/twin</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-black/20 border border-white/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-white/70" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-white/55">{label}</div>
        <div className="mt-0.5 text-sm text-white/85 break-all">{value}</div>
      </div>
    </div>
  );
}
