// apps/web/src/components/common/Loader.jsx
import React from "react";
import { motion } from "framer-motion";

export default function Loader({ label = "Loading…" }) {
  return (
    <div className="flex items-center gap-3 text-white/70">
      <motion.div
        className="w-4 h-4 rounded-full border border-white/20 border-t-white/70"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
      />
      <div className="text-sm">{label}</div>
    </div>
  );
}
