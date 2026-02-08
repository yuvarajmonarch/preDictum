// apps/web/src/components/twin/TwinTimeline.jsx
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Filter, Clock } from "lucide-react";
import Badge from "../common/Badge.jsx";

function cx(...arr) {
  return arr.filter(Boolean).join(" ");
}

export default function TwinTimeline({ timeline = [] }) {
  const [filter, setFilter] = useState("");

  const items = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const list = Array.isArray(timeline) ? timeline.slice().reverse() : [];
    if (!q) return list;
    return list.filter((e) => `${e.type} ${e.msg}`.toLowerCase().includes(q));
  }, [timeline, filter]);

  return (
    <div className="glass rounded-2xl p-5 ring-soft">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm text-white/75 font-semibold">Timeline</div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="w-4 h-4 text-white/45 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-xl border border-white/10 bg-black/20 text-white/85 outline-none focus:border-indigo-400/40 text-sm"
              placeholder="Filter events…"
            />
          </div>
          <Badge tone="neutral">{items.length}</Badge>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-black/20 overflow-hidden">
        <div className="max-h-[420px] overflow-auto">
          {items.length ? (
            <ul className="divide-y divide-white/10">
              {items.map((e, idx) => (
                <motion.li
                  key={`${e.t}-${idx}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="p-3 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="text-sm text-white/85 truncate">{e.msg || e.type}</div>
                    <div className="mt-0.5 text-xs text-white/50">{e.type}</div>
                    {e.meta ? (
                      <pre className="mt-2 text-xs text-white/55 whitespace-pre-wrap break-words bg-white/5 border border-white/10 rounded-xl p-2">
                        {JSON.stringify(e.meta, null, 2)}
                      </pre>
                    ) : null}
                  </div>
                  <div className="text-xs text-white/45 whitespace-nowrap inline-flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    {e.t ? new Date(e.t).toLocaleTimeString() : ""}
                  </div>
                </motion.li>
              ))}
            </ul>
          ) : (
            <div className="p-6 text-sm text-white/60">
              No events yet. Run an automation to populate the timeline.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
