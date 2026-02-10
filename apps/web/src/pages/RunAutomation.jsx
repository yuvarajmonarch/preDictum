// apps/web/src/pages/RunAutomation.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GitBranch, Play, RefreshCcw, ShieldCheck, Terminal, AlertTriangle } from "lucide-react";

import Button from "../components/common/Button.jsx";
import Badge from "../components/common/Badge.jsx";
import Loader from "../components/common/Loader.jsx";

import { listRepos, listBranches } from "../api/agent.api.js";
import { runAutomation } from "../api/agent.api.js";

const API_BASE = "http://localhost:8080";

function cx(...arr) {
  return arr.filter(Boolean).join(" ");
}

export default function RunAutomation() {
  // form
  const [repo, setRepo] = useState("");
  const [baseBranch, setBaseBranch] = useState("main");
  const [altPrefix, setAltPrefix] = useState("alternate");
  const [editFile, setEditFile] = useState("README.md");
  const [prompt, setPrompt] = useState("");

  // mode
  const [dryRun, setDryRun] = useState(true);

  // data
  const [repos, setRepos] = useState([]);
  const [branches, setBranches] = useState([]);

  // ui state
  const [repoBusy, setRepoBusy] = useState(false);
  const [runBusy, setRunBusy] = useState(false);

  // errors (SEPARATED!)
  const [gitErr, setGitErr] = useState("");
  const [runErr, setRunErr] = useState("");

  // result
  const [result, setResult] = useState(null);

  // cancellation token for fetches
  const reqRef = useRef({ repos: 0, branches: 0 });

  const modePill = useMemo(() => {
    return dryRun
      ? { tone: "warn", text: "Dry-run" }
      : { tone: "info", text: "Write Mode" };
  }, [dryRun]);

  // --- Fetch repos only in WRITE MODE ---
  useEffect(() => {
    // invalidate in-flight requests
    reqRef.current.repos += 1;
    reqRef.current.branches += 1;

    // clear UI messages when toggling mode
    setGitErr("");
    setRunErr("");
    setResult(null);

    if (dryRun) {
      // Dry-run: do NOT force GitHub calls; keep UI usable
      setRepoBusy(false);
      return;
    }

    // Write mode: load repos from backend
    (async () => {
      const id = ++reqRef.current.repos;
      setRepoBusy(true);
      setGitErr("");

      try {
        const data = await listRepos();
        if (id !== reqRef.current.repos) return;

        setRepos(Array.isArray(data) ? data : []);
        // auto-select first repo if empty
        if (!repo && Array.isArray(data) && data.length) {
          setRepo(data[0].full_name || data[0].name || "");
        }
      } catch (e) {
        if (id !== reqRef.current.repos) return;
        setRepos([]);
        setGitErr(e?.message || "Failed to load repos");
      } finally {
        if (id !== reqRef.current.repos) return;
        setRepoBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dryRun]);

  // --- Fetch branches when repo changes (WRITE MODE only) ---
  useEffect(() => {
    reqRef.current.branches += 1;
    setGitErr("");
    setBranches([]);

    if (dryRun) return;            // ✅ no GitHub calls
    if (!repo) return;

    (async () => {
      const id = ++reqRef.current.branches;
      setRepoBusy(true);

      try {
        const data = await listBranches(repo);
        if (id !== reqRef.current.branches) return;

        const arr = Array.isArray(data) ? data : [];
        setBranches(arr);

        // if current selected branch not present, fallback
        const exists = arr.some((b) => b.name === baseBranch);
        if (!exists && arr.length) setBaseBranch(arr[0].name);
      } catch (e) {
        if (id !== reqRef.current.branches) return;
        setBranches([]);
        setGitErr(e?.message || "Failed to load branches");
      } finally {
        if (id !== reqRef.current.branches) return;
        setRepoBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo, dryRun]);

  async function onRefresh() {
    setRunErr("");
    setResult(null);
    setGitErr("");

    if (dryRun) {
      // In dry-run we don't need GitHub. Just clear errors.
      return;
    }

    // trigger repo reload by re-running effect: easiest way = flip a counter
    // but we can just call listRepos here.
    const id = ++reqRef.current.repos;
    setRepoBusy(true);

    try {
      const data = await listRepos();
      if (id !== reqRef.current.repos) return;

      setRepos(Array.isArray(data) ? data : []);
    } catch (e) {
      if (id !== reqRef.current.repos) return;
      setRepos([]);
      setGitErr(e?.message || "Refresh failed");
    } finally {
      if (id !== reqRef.current.repos) return;
      setRepoBusy(false);
    }
  }

  async function onRun() {
    setRunErr("");
    setGitErr("");
    setResult(null);

    // validation (dry-run can work with manual repo input too)
    if (!repo || typeof repo !== "string" || !repo.includes("/")) {
      setRunErr("Repo is required in format owner/repo");
      return;
    }
    if (!prompt || prompt.trim().length < 3) {
      setRunErr("Prompt must be at least 3 characters");
      return;
    }

    setRunBusy(true);
    try {
      const res = await runAutomation({
        repo,
        baseBranch,
        altPrefix,
        editFile,
        prompt,
        dryRun
      });
      setResult(res);
    } catch (e) {
      setRunErr(e?.message || "Automation failed");
    } finally {
      setRunBusy(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
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
            Your Digital Twin updates live while it runs.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge tone={modePill.tone}>{modePill.text}</Badge>
            <Badge tone="neutral">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Safe flow: always creates alternate branch
              </span>
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" leftIcon={RefreshCcw} onClick={onRefresh} disabled={repoBusy || runBusy}>
            Refresh
          </Button>
          <Button leftIcon={Play} onClick={onRun} disabled={runBusy}>
            {runBusy ? "Running..." : "Run"}
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut", delay: 0.08 }}
        className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        {/* Inputs */}
        <div className="glass rounded-2xl p-5 ring-soft">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/75 font-semibold">Inputs</div>
            <Badge tone={dryRun ? "warn" : "info"}>{dryRun ? "Dry-run" : "Write Mode"}</Badge>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/55">Repo</label>

              {/* ✅ Write mode: dropdown from GitHub */}
              {!dryRun ? (
                <select
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 text-white/85 px-3 py-2 outline-none focus:border-indigo-400/40"
                >
                  <option value="">{repoBusy ? "Loading…" : "Select repo"}</option>
                  {repos.map((r) => {
                    const val = r.full_name || r.name;
                    return (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    );
                  })}
                </select>
              ) : (
                // ✅ Dry run: manual input, no GitHub required
                <input
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  placeholder="owner/repo"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 text-white/85 px-3 py-2 outline-none focus:border-indigo-400/40"
                />
              )}
            </div>

            <div>
              <label className="text-xs text-white/55">Base branch</label>

              {!dryRun ? (
                <select
                  value={baseBranch}
                  onChange={(e) => setBaseBranch(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 text-white/85 px-3 py-2 outline-none focus:border-indigo-400/40"
                >
                  {branches.length ? (
                    branches.map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))
                  ) : (
                    <option value={baseBranch}>{baseBranch}</option>
                  )}
                </select>
              ) : (
                <input
                  value={baseBranch}
                  onChange={(e) => setBaseBranch(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 text-white/85 px-3 py-2 outline-none focus:border-indigo-400/40"
                />
              )}
            </div>

            <div>
              <label className="text-xs text-white/55">Alternate branch prefix</label>
              <input
                value={altPrefix}
                onChange={(e) => setAltPrefix(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 text-white/85 px-3 py-2 outline-none focus:border-indigo-400/40"
              />
            </div>

            <div>
              <label className="text-xs text-white/55">Edit file</label>
              <input
                value={editFile}
                onChange={(e) => setEditFile(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 text-white/85 px-3 py-2 outline-none focus:border-indigo-400/40"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="text-xs text-white/55">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 text-white/85 px-3 py-2 outline-none focus:border-indigo-400/40 resize-none"
              placeholder="Describe what you want the agent to change…"
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
            <label className="inline-flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
              />
              Dry run (no GitHub writes)
            </label>

            <div className="text-xs text-white/45 inline-flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Safe flow: always creates alternate branch
            </div>
          </div>

          {/* ✅ GitHub fetch errors shown ONLY in write mode */}
          {!dryRun && gitErr ? (
            <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100 inline-flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              <div>
                <div className="font-semibold">GitHub</div>
                <div className="opacity-90">{gitErr}</div>
                <div className="text-xs text-rose-100/70 mt-1">
                  Tip: check <span className="text-rose-100/90">{API_BASE}/api/github/repos</span>
                </div>
              </div>
            </div>
          ) : null}

          {/* ✅ Run errors always shown */}
          {runErr ? (
            <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100 inline-flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              <div>
                <div className="font-semibold">Run</div>
                <div className="opacity-90">{runErr}</div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Result */}
        <div className="glass rounded-2xl p-5 ring-soft">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/75 font-semibold">Result</div>
            <Badge tone="neutral">{runBusy ? "Running" : "Idle"}</Badge>
          </div>

          {!result && !runBusy ? (
            <div className="mt-3 text-sm text-white/60">
              Run automation to see output here.
            </div>
          ) : null}

          {runBusy ? (
            <div className="mt-4">
              <Loader label="Running agent automation…" />
            </div>
          ) : null}

          {result ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-xs text-white/55">Run ID</div>
                <div className="text-sm text-white/85 break-all">{result.runId || "—"}</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-xs text-white/55">Alt branch</div>
                <div className="text-sm text-white/85 break-all">{result.altBranch || "—"}</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-xs text-white/55">PR</div>
                {result.prUrl ? (
                  <a className="text-sm text-indigo-200 hover:underline break-all" href={result.prUrl} target="_blank" rel="noreferrer">
                    {result.prUrl}
                  </a>
                ) : (
                  <div className="text-sm text-white/70">Not created</div>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-xs text-white/55 inline-flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Summary
                </div>
                <pre className="mt-2 text-xs text-white/55 whitespace-pre-wrap break-words bg-white/5 border border-white/10 rounded-xl p-2">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
