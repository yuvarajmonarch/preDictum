// apps/web/src/components/common/Badge.jsx
import React from "react";

function cx(...arr) {
  return arr.filter(Boolean).join(" ");
}

const toneMap = {
  neutral: "bg-white/10 text-white/75 border-white/10",
  success: "bg-emerald-500/15 text-emerald-200 border-emerald-400/20",
  danger: "bg-rose-500/15 text-rose-200 border-rose-400/20",
  info: "bg-indigo-500/15 text-indigo-200 border-indigo-400/20",
  warn: "bg-amber-500/15 text-amber-200 border-amber-400/20"
};

export default function Badge({ children, tone = "neutral", className = "" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs",
        toneMap[tone] || toneMap.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}
