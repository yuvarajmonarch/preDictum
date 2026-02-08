// apps/web/src/components/layout/Sidebar.jsx
import React from "react";
import { motion } from "framer-motion";
import { Activity, GitBranch, FileClock, LayoutDashboard } from "lucide-react";

function cx(...arr) {
  return arr.filter(Boolean).join(" ");
}

const items = [
  { key: "home", label: "Home", icon: LayoutDashboard },
  { key: "dashboard", label: "Dashboard", icon: Activity },
  { key: "run", label: "Run Automation", icon: GitBranch },
  { key: "twin", label: "Digital Twin", icon: Activity },
  { key: "logs", label: "Logs", icon: FileClock }
];

/**
 * No-router sidebar:
 * parent must pass active + onChange
 */
export default function Sidebar({ active = "home", onChange }) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="hidden lg:block w-72 shrink-0"
    >
      <div className="glass rounded-2xl p-3 ring-soft sticky top-[88px]">
        <div className="px-2 py-2 text-xs text-white/55">Navigation</div>

        <nav className="mt-1 space-y-1">
          {items.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => onChange?.(key)}
              className={cx(
                "w-full flex items-center gap-3 px-3 py-2 rounded-xl border transition text-left",
                active === key
                  ? "bg-indigo-500/15 border-indigo-400/20 text-white"
                  : "bg-white/5 border-white/10 text-white/75 hover:bg-white/10"
              )}
            >
              <div className="w-9 h-9 rounded-xl bg-black/20 border border-white/10 flex items-center justify-center">
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-sm font-medium">{label}</div>
            </button>
          ))}
        </nav>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-xs text-white/55">Tip</div>
          <div className="mt-1 text-sm text-white/70 leading-relaxed">
            Start with <span className="text-white/90">Run Automation</span> (dry-run) to populate
            the <span className="text-white/90">Twin Timeline</span>.
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
