"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Zap, Plus, Clock, CheckCircle2, XCircle, Loader2, ArrowRight, GitFork } from "lucide-react";
import ForkTaskModal from "@/components/ForkTaskModal";

const MONAD_EXPLORER = "https://testnet.monadexplorer.com/tx/";

const STATUS_META: Record<string, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  completed: { color: "#a3e635", bg: "rgba(163,230,53,0.10)",  border: "rgba(163,230,53,0.35)",  icon: CheckCircle2 },
  running:   { color: "#fbbf24", bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.35)",  icon: Loader2      },
  paused:    { color: "#f87171", bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.35)", icon: XCircle      },
  pending:   { color: "#94a3b8", bg: "rgba(148,163,184,0.10)", border: "rgba(148,163,184,0.35)", icon: Clock        },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.06 } },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TaskRow({ task, onFork }: { task: any; onFork: (task: any) => void }) {
  const meta = STATUS_META[task.status] ?? STATUS_META.pending;
  const StatusIcon = meta.icon as React.ComponentType<{ className?: string }>;
  const completed = task.subtasks?.filter((s: { status: string }) => s.status === "completed").length ?? 0;
  const total     = task.subtasks?.length ?? 0;
  const progress  = total > 0 ? (completed / total) * 100 : 0;
  const overBudget = task.spentBudget > task.totalBudget * 0.9;
  const canFork = ["completed", "planning", "approved"].includes(task.status);

  return (
    <motion.div variants={fadeUp}>
      <div className="relative group">
        <Link href={`/tasks/${task.id}`} className="block">
          <div className="relative bg-[#0d0d10] border border-white/[0.07] rounded-2xl overflow-hidden transition-all duration-200 hover:border-white/[0.16] hover:bg-[#111115] hover:-translate-y-0.5">
            {/* Left accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: meta.color }} />

          <div className="pl-6 pr-5 py-5 flex flex-col gap-4">
            {/* Row 1: title + status + arrow */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-[14px] font-semibold text-white group-hover:text-[#a855f7] transition-colors duration-200 truncate">
                    {task.title}
                  </h3>
                  {task.parentTaskId && (
                    <span className="text-[8px] font-mono uppercase tracking-[0.15em] px-1.5 py-0.5 rounded bg-[#a855f7]/10 border border-[#a855f7]/20 text-[#a855f7] flex-shrink-0">
                      FORK
                    </span>
                  )}
                  {task.forkCount > 0 && (
                    <span className="text-[9px] font-mono text-white/35 flex-shrink-0 flex items-center gap-1">
                      <GitFork className="w-2.5 h-2.5" />
                      {task.forkCount}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-white/35 font-mono">
                  Created {new Date(task.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Status badge */}
                <span
                  className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-[0.15em] px-2.5 py-1 rounded-full border"
                  style={{ color: meta.color, background: meta.bg, borderColor: meta.border }}
                >
                  <StatusIcon className={`w-3 h-3 ${task.status === "running" ? "animate-spin" : ""}`} />
                  {task.status}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-[#a855f7] group-hover:translate-x-1 transition-all duration-200" />
              </div>
            </div>

            {/* Row 2: stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Budget */}
              <div className="bg-transparent/60 border border-white/[0.04] rounded-xl px-3 py-2.5">
                <span className="block text-[8px] font-mono text-white/25 uppercase tracking-[0.18em] mb-1">Budget</span>
                <span className="text-[13px] font-bold font-mono text-white">${task.totalBudget}</span>
              </div>
              {/* Spent */}
              <div className="bg-transparent/60 border border-white/[0.04] rounded-xl px-3 py-2.5">
                <span className="block text-[8px] font-mono text-white/25 uppercase tracking-[0.18em] mb-1">Spent</span>
                <span className={`text-[13px] font-bold font-mono ${overBudget ? "text-red-400" : "text-white"}`}>
                  ${task.spentBudget.toFixed(2)}
                </span>
              </div>
              {/* Subtasks */}
              <div className="bg-transparent/60 border border-white/[0.04] rounded-xl px-3 py-2.5">
                <span className="block text-[8px] font-mono text-white/25 uppercase tracking-[0.18em] mb-1">Subtasks</span>
                <span className={`text-[13px] font-bold font-mono ${completed === total && total > 0 ? "text-[#a3e635]" : "text-white"}`}>
                  {total > 0 ? `${completed}/${total}` : "—"}
                </span>
              </div>
              {/* Escrow TX */}
              <div className="bg-transparent/60 border border-white/[0.04] rounded-xl px-3 py-2.5">
                <span className="block text-[8px] font-mono text-white/25 uppercase tracking-[0.18em] mb-1">Escrow TX</span>
                {task.escrowTxHash ? (
                  <a
                    href={MONAD_EXPLORER + task.escrowTxHash}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-[11px] font-mono text-[#0ea5e9] hover:text-[#38bdf8] transition-colors"
                  >
                    <Zap className="w-2.5 h-2.5 text-[#fbbf24] flex-shrink-0" />
                    {task.escrowTxHash.slice(0, 7)}…
                    <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                  </a>
                ) : (
                  <span className="text-[11px] font-mono text-white/20">—</span>
                )}
              </div>
            </div>

            {/* Subtask progress bar */}
            {total > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] font-mono text-white/25">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-1 bg-white/[0.05] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: meta.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  />
                </div>
              </div>
            )}
          </div>
          </div>
        </Link>

        {/* Fork button — rendered outside the Link to avoid nested <a> */}
        {canFork && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFork(task); }}
            className="absolute top-4 right-12 z-10 flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] font-mono uppercase tracking-[0.12em] text-[#a855f7] bg-[#a855f7]/10 hover:bg-[#a855f7]/20 border border-[#a855f7]/20 hover:border-[#a855f7]/40 rounded-lg transition-all duration-150 opacity-0 group-hover:opacity-100"
            title="Fork this task"
          >
            <GitFork className="w-3 h-3" />
            Fork
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function TasksPage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tasks, setTasks]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [chainStatus, setChainStatus] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [forkTarget, setForkTarget] = useState<any>(null);

  useEffect(() => {
    const fetchTasks = () =>
      fetch("/api/tasks")
        .then((r) => r.json())
        .then((d) => { setTasks(d); setLoading(false); });

    fetchTasks();
    const iv = setInterval(fetchTasks, 5000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    fetch("/api/chain/status")
      .then((r) => r.json())
      .then(setChainStatus)
      .catch(console.error);
    const iv = setInterval(() =>
      fetch("/api/chain/status").then((r) => r.json()).then(setChainStatus).catch(console.error),
    30000);
    return () => clearInterval(iv);
  }, []);

  const byStatus = {
    running:   tasks.filter((t) => t.status === "running"),
    completed: tasks.filter((t) => t.status === "completed"),
    pending:   tasks.filter((t) => !["running", "completed", "paused"].includes(t.status)),
    paused:    tasks.filter((t) => t.status === "paused"),
  };

  const stats = [
    { label: "Total Tasks",     value: tasks.length,                                     color: "#a855f7" },
    { label: "Running",         value: byStatus.running.length,                          color: "#fbbf24" },
    { label: "Completed",       value: byStatus.completed.length,                        color: "#a3e635" },
    { label: "Total Spent",     value: `$${tasks.reduce((s, t) => s + (t.spentBudget ?? 0), 0).toFixed(2)}`, color: "#0ea5e9" },
  ];

  return (
    <div className="relative min-h-screen bg-transparent text-white">
      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 flex">
          <div className="flex-1" />
          <div className="flex-1 border-l border-white/[0.035]" />
          <div className="flex-1 border-l border-white/[0.035]" />
          <div className="flex-1 border-l border-white/[0.035]" />
        </div>
      </div>

      {/* Page header */}
      <div className="relative z-10 border-b border-white/[0.05] bg-transparent/80 backdrop-blur-xl pt-24 pb-10 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-5"
          >
            <div>
              <span className="section-label">Orchestration Layer</span>
              <h1 className="section-heading">Task Dashboard</h1>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-[12px] text-white/40 font-mono">
                  All tasks — orchestrated off-chain, settled on Monad
                </p>
                {chainStatus && (
                  <a
                    href="https://testnet.monadexplorer.com"
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-full border transition-colors ${
                      chainStatus.connected
                        ? "text-green-400 border-green-800/50 bg-green-950/30 hover:bg-green-900/30"
                        : "text-red-400 border-red-800/50 bg-red-950/30"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${chainStatus.connected ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
                    {chainStatus.connected
                      ? `Monad Testnet · #${chainStatus.blockNumber?.toLocaleString()}`
                      : "Chain offline"}
                  </a>
                )}
              </div>
            </div>
            <Link
              href="/tasks/new"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#a855f7] hover:bg-[#9333ea] text-white text-[11px] font-mono font-bold uppercase tracking-[0.18em] rounded-xl border border-[#a855f7]/50 transition-all duration-200 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" /> New Task
            </Link>
          </motion.div>

          {/* Stats row */}
          {!loading && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8"
            >
              {stats.map((s) => (
                <div key={s.label} className="bg-[#0d0d10] border border-white/[0.07] rounded-xl px-4 py-3.5">
                  <span className="block text-[9px] font-mono text-white/30 uppercase tracking-[0.18em] mb-1.5">{s.label}</span>
                  <span className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.value}</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Tasks list */}
      <div className="relative z-10 px-6 py-10 max-w-6xl mx-auto">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-[#0d0d10] border border-white/[0.06] rounded-2xl h-36 animate-pulse" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-5 py-28 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#0d0d10] border border-white/[0.08] flex items-center justify-center">
              <Plus className="w-7 h-7 text-white/20" />
            </div>
            <div>
              <p className="text-white/50 font-mono text-sm">No tasks yet.</p>
              <p className="text-white/25 font-mono text-xs mt-1">Deploy your first task to get started.</p>
            </div>
            <Link
              href="/tasks/new"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#a855f7]/20 hover:bg-[#a855f7]/30 text-[#a855f7] text-[11px] font-mono font-bold uppercase tracking-[0.18em] rounded-xl border border-[#a855f7]/30 transition-all duration-200"
            >
              <Plus className="w-3.5 h-3.5" /> Create Task
            </Link>
          </motion.div>
        ) : (
          <AnimatePresence>
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {tasks.map((task) => (
                <TaskRow key={task.id} task={task} onFork={setForkTarget} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Fork modal */}
      {forkTarget && (
        <ForkTaskModal
          task={forkTarget}
          isOpen={!!forkTarget}
          onClose={() => setForkTarget(null)}
          onForked={(newTask) => {
            setForkTarget(null);
            router.push(`/tasks/${newTask.id}`);
          }}
        />
      )}
    </div>
  );
}
