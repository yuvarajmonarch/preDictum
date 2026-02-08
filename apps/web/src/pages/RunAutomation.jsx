import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Play, RefreshCcw, GitBranch, ShieldAlert, CheckCircle2 } from "lucide-react";

import Button from "../components/common/Button.jsx";
import Badge from "../components/common/Badge.jsx";
import Loader from "../components/common/Loader.jsx";

import { apiFetch } from "../api/client.js";
import { runAgent } from "../api/agent.api.js";

function cx(...arr) {
  return arr.filter(Boolean).join(" ");
}

export default function RunAutomation() {
  const [repos, setRepos] = useState([]);
  const [branches, setBranches] = useState([]);

  const [repo, setRepo] = useState("");
  const [baseBranch, setBaseBranch] = useState("main");
  const [altPrefix, setAltPrefix] = useState("alternate");
  const [editFile, setEditFile] = useState("README.md");
  const [prompt, setPrompt] = useState("Add a short demo note for the digital twin test");
  const [dryRun, setDryRun] = useState(true);

  const [loadingRepos, setLoadingRepos] = useState(false);
  const [running, setRunning] = useState(false);

  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  const canRun = useMemo(() => {
    return repo && prompt.trim().length >= 3 && !running;
  }, [repo, prompt, running]);

  async function loadRepos() {
    setLoadingRepos(true);
    setErr("");
    try {
      const r = await apiFetch("/api/github/repos");
      setRepos(r?.repos || []);
      // auto-pick first repo if none selected
      if (!repo && r?.repos?.length) setRepo(r.repos[0].full_name);
    } catch (e) {
      setErr(e?.message || "Failed to load repos");
    } finally {
      setLoadingRepos(false);
    }
  }

  async function loadBranches(selectedRepo) {
    if (!selectedRepo) return;
    setErr("");
    try {
      const r = await apiFetch(`/api/github/branches?repo=${encodeURIComponent(selectedRepo)}`);
      const list = r?.branches || [];
      setBranches(list);
      // prefer main if exists
      if (list.find((b) => b.name === "main")) setBaseBranch("main");
      else if (list.find((b) => b.name === "master")) setBaseBranch("master");
      else if (list[0]?.name) setBaseBranch(list[0].name);
    } catch (e) {
      setBranches([]);
      setErr(e?.message || "Failed to load branches");
    }
  }

  useEffect(() => {
    loadRepos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadBranches(repo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo]);

  async function onRun() {
    setRunning(true);
    setErr("");
    setResult(null);

    const payload = {
      repo,
      baseBranch,
      prompt,
      altPrefix,
      editFile,
      dryRun
    };

    console.log("RUN payload =>", payload);

    try {
      const data = await runAgent(payload);
      console.log("RUN result =>", data);
      setResult(data);
    } catch (e) {
      console.error("RUN error =>", e);
      setErr(e?.message || "Run failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5">
            <GitBranch className="w-4 h-4 text-indigo-200" />
            <span className="text-sm text-white/75">Run Automation</span>
          </div>

          <h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">
            Safe Branch Automation
          </h2>
          <p className="mt-2 text-white/65 max-w-2xl">
            Create an alternate branch automatically, apply changes there, then open a draft PR.
            Digital Twin updates live while it runs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            leftIcon={RefreshCcw}
            onClick={loadRepos}
            disabled={loadingRepos || running}
          >
            Refresh
          </Button>
          <Button variant="primary" leftIcon={Play} onClick={onRun} disabled={!canRun}>
            {running ? "Running…" : "Run"}
          </Button>
        </div>
      </motion.div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Inputs */}
        <div className="glass rounded-2xl p-5 ring-soft">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-white/80 font-semibold">Inputs</div>
            <Badge tone="neutral">{dryRun ? "Dry-run" : "Write Mode"}</Badge>
          </div>

          {loadingRepos ? (
            <div className="mt-4">
              <Loader label="Loading repos…" />
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-white/55 mb-2">Repo</div>
              <select
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/20 text-white/85 outline-none focus:border-indigo-400/40"
              >
                <option value="">Select repo</option>
                {repos.map((r) => (
                  <option key={r.id} value={r.full_name}>
                    {r.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-xs text-white/55 mb-2">Base branch</div>
              <select
                value={baseBranch}
                onChange={(e) => setBaseBranch(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/20 text-white/85 outline-none focus:border-indigo-400/40"
              >
                {(branches.length ? branches : [{ name: "main" }]).map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-xs text-white/55 mb-2">Alternate branch prefix</div>
              <input
                value={altPrefix}
                onChange={(e) => setAltPrefix(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/20 text-white/85 outline-none focus:border-indigo-400/40"
                placeholder="alternate"
              />
            </div>

            <div>
              <div className="text-xs text-white/55 mb-2">Edit file</div>
              <input
                value={editFile}
                onChange={(e) => setEditFile(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/20 text-white/85 outline-none focus:border-indigo-400/40"
                placeholder="README.md"
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs text-white/55 mb-2">Prompt</div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              className="w-full px-3 py-3 rounded-xl border border-white/10 bg-black/20 text-white/85 outline-none focus:border-indigo-400/40 resize-none"
              placeholder="Describe what change you want…"
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
            <label className="inline-flex items-center gap-2 text-sm text-white/75">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="accent-indigo-400"
              />
              Dry run (no GitHub writes)
            </label>
            <div className="text-xs text-white/50">
              Safe flow: always creates alternate branch
            </div>
          </div>

          {err ? (
            <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/15 p-3 text-rose-100 text-sm inline-flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              {err}
            </div>
          ) : null}
        </div>

        {/* Result */}
        <div className="glass rounded-2xl p-5 ring-soft">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-white/80 font-semibold">Result</div>
            {result ? (
              <Badge tone="success">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Done
                </span>
              </Badge>
            ) : (
              <Badge tone="neutral">Idle</Badge>
            )}
          </div>

          <div className="mt-4">
            {running ? (
              <Loader label="Running automation…" />
            ) : result ? (
              <pre className="text-xs text-white/70 whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-black/20 p-3">
                {JSON.stringify(result, null, 2)}
              </pre>
            ) : err ? (
              <div className="text-sm text-white/60">
                Fix the error on the left and run again.
              </div>
            ) : (
              <div className="text-white/60">Run automation to see output here.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
