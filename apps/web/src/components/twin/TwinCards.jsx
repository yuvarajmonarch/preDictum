// apps/web/src/components/twin/TwinCards.jsx
import React from "react";
import { motion } from "framer-motion";

function cx(...arr) {
  return arr.filter(Boolean).join(" ");
}

export default function TwinCards({ codeTwin }) {
  const cards = [
    { title: "Repository", value: codeTwin?.repo || "—" },
    { title: "Base branch", value: codeTwin?.baseBranch || "main" },
    { title: "Alt branch", value: codeTwin?.altBranch || "—" },
    { title: "PR", value: codeTwin?.prUrl ? "Created" : "—", link: codeTwin?.prUrl || "" },
    { title: "Updated", value: codeTwin?.updatedAt ? new Date(codeTwin.updatedAt).toLocaleString() : "—" }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {cards.map((c) => (
        <motion.div
          key={c.title}
          whileHover={{ y: -3 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className={cx("glass rounded-2xl p-5 ring-soft", c.wide && "md:col-span-2")}
        >
          <div className="text-xs text-white/55">{c.title}</div>
          {c.link ? (
            <a
              href={c.link}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block text-sm text-indigo-200 hover:underline break-all"
            >
              {c.value}
            </a>
          ) : (
            <div className="mt-1 text-sm font-semibold text-white/90 break-all">{c.value}</div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
