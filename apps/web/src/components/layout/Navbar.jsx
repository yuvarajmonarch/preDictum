// apps/web/src/components/layout/Navbar.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Radio, Server } from "lucide-react";
import Badge from "../common/Badge.jsx";

const API_BASE = "http://localhost:8080";

export default function Navbar() {
  const [status, setStatus] = useState("unknown"); // unknown | up | down

  useEffect(() => {
    let alive = true;

    async function ping() {
      try {
        const r = await fetch(`${API_BASE}/api/health`);
        if (!alive) return;
        setStatus(r.ok ? "up" : "down");
      } catch {
        if (!alive) return;
        setStatus("down");
      }
    }

    ping();
    const id = setInterval(ping, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const tone = status === "up" ? "success" : status === "down" ? "danger" : "neutral";
  const label = status === "up" ? "Backend Online" : status === "down" ? "Backend Offline" : "Checking…";

  return (
    <div className="sticky top-0 z-40 backdrop-blur-xl bg-black/10 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex items-center gap-3 min-w-0"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-400/15 flex items-center justify-center">
            <Activity className="w-5 h-5 text-indigo-100/90" />
          </div>

          <div className="min-w-0">
            <div className="text-sm font-semibold text-white/90 truncate">Agentic Digital Twin</div>
            <div className="text-xs text-white/55 truncate">Safe branch automation + live mirror</div>
          </div>
        </motion.div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-sm text-white/70">
            <Radio className="w-4 h-4 text-indigo-200" />
            ws://localhost:8080/ws/twin
          </div>

          <Badge tone={tone}>
            <span className="inline-flex items-center gap-2">
              <Server className="w-4 h-4" />
              {label}
            </span>
          </Badge>
        </div>
      </div>
    </div>
  );
}
