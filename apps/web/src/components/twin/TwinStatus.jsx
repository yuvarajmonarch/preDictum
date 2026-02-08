// apps/web/src/components/twin/TwinStatus.jsx
import React, { useMemo } from "react";
import { Activity, GitBranch, Link as LinkIcon } from "lucide-react";
import Badge from "../common/Badge.jsx";

export default function TwinStatus({ codeTwin }) {
  const status = codeTwin?.status || "IDLE";

  const tone = useMemo(() => {
    if (status === "ERROR") return "danger";
    if (status === "PR_CREATED") return "success";
    if (status === "IDLE") return "neutral";
    return "info";
  }, [status]);

  return (
    <div className="glass rounded-2xl p-5 ring-soft">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-white/75 font-semibold">Twin Status</div>
        <Badge tone={tone}>
          <span className="inline-flex items-center gap-2">
            <Activity className="w-4 h-4" />
            {status}
          </span>
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Mini label="Repo" value={codeTwin?.repo || "—"} icon={GitBranch} />
        <Mini label="Base" value={codeTwin?.baseBranch || "main"} />
        <Mini label="Alt" value={codeTwin?.altBranch || "—"} />
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="text-xs text-white/55">Last action</div>
        <div className="mt-1 text-sm text-white/85">{codeTwin?.lastAction || "Waiting"}</div>
      </div>

      {codeTwin?.prUrl ? (
        <a
          href={codeTwin.prUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-2 text-sm text-indigo-200 hover:underline break-all"
        >
          <LinkIcon className="w-4 h-4" />
          Open PR
        </a>
      ) : null}
    </div>
  );
}

function Mini({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-white/55 inline-flex items-center gap-2">
        {Icon ? <Icon className="w-4 h-4" /> : null}
        {label}
      </div>
      <div className="mt-1 font-semibold text-white/90 truncate">{value}</div>
    </div>
  );
}
