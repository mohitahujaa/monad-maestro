"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitFork, X, Link as LinkIcon } from "lucide-react";

interface ForkTaskModalProps {
  task: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  isOpen: boolean;
  onClose: () => void;
  onForked: (newTask: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export default function ForkTaskModal({ task, isOpen, onClose, onForked }: ForkTaskModalProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [budget, setBudget] = useState(String(task?.totalBudget ?? ""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parentVersion = task?.version ?? 1;
  const nextVersion = parentVersion + 1;
  const subtaskCount = task?.subtasks?.length ?? 0;
  const agentCount = task?.selectedAgents?.length ?? 0;

  const handleFork = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${task.id}/fork`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          totalBudget: Number(budget),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Fork failed");
      }
      const newTask = await res.json();
      onForked(newTask);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="fork-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="fork-modal"
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-lg bg-[#030303] border border-white/10 rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#a855f7]/20 border border-[#a855f7]/30 flex items-center justify-center">
                    <GitFork className="w-4 h-4 text-[#a855f7]" />
                  </div>
                  <div>
                    <h2 className="text-[13px] font-semibold text-white">Fork Task</h2>
                    <p className="text-[10px] text-white/35 font-mono">
                      Deploy a new on-chain program from this task
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/30 hover:text-white/70 transition-colors p-1 rounded-lg hover:bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Parent task summary */}
              <div className="px-6 py-4 border-b border-white/[0.05] bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-3">
                  <LinkIcon className="w-3.5 h-3.5 text-[#a855f7]" />
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.15em]">
                    Parent task
                  </span>
                </div>
                <p className="text-[12px] text-white/80 font-medium mb-2 truncate">{task?.title}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] font-mono text-white/30 bg-white/[0.04] border border-white/[0.06] rounded-lg px-2 py-1">
                    {subtaskCount} subtask{subtaskCount !== 1 ? "s" : ""}
                  </span>
                  <span className="text-[10px] font-mono text-white/30 bg-white/[0.04] border border-white/[0.06] rounded-lg px-2 py-1">
                    {agentCount} agent{agentCount !== 1 ? "s" : ""}
                  </span>
                  {task?.dagHash && (
                    <span className="text-[10px] font-mono text-[#a855f7]/60 bg-[#a855f7]/[0.05] border border-[#a855f7]/10 rounded-lg px-2 py-1 truncate max-w-[180px]">
                      {task.dagHash.slice(0, 20)}…
                    </span>
                  )}
                </div>

                {/* Fork lineage */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] font-mono text-white/25 uppercase tracking-[0.12em]">
                    Fork lineage:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#a855f7]/10 border border-[#a855f7]/20 text-[#a855f7]">
                      v{parentVersion}
                    </span>
                    <span className="text-white/20 text-[10px]">→</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.12] text-white/60">
                      v{nextVersion}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="px-6 py-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono text-white/40 uppercase tracking-[0.15em]">
                    Title
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.14] focus:border-[#a855f7]/50 focus:outline-none rounded-xl px-3.5 py-2.5 text-[12px] text-white placeholder-white/20 transition-colors font-mono"
                    placeholder="Task title…"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono text-white/40 uppercase tracking-[0.15em]">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.14] focus:border-[#a855f7]/50 focus:outline-none rounded-xl px-3.5 py-2.5 text-[12px] text-white placeholder-white/20 transition-colors font-mono resize-none"
                    placeholder="Task description…"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono text-white/40 uppercase tracking-[0.15em]">
                    Budget (USDC)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.14] focus:border-[#a855f7]/50 focus:outline-none rounded-xl px-3.5 py-2.5 text-[12px] text-white placeholder-white/20 transition-colors font-mono"
                    placeholder="0.00"
                  />
                </div>

                {error && (
                  <p className="text-[11px] text-red-400 font-mono bg-red-950/30 border border-red-800/30 rounded-xl px-3 py-2">
                    {error}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 pb-5 flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 text-[11px] font-mono font-bold uppercase tracking-[0.15em] text-white/40 hover:text-white/70 border border-white/[0.07] hover:border-white/[0.14] rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFork}
                  disabled={loading || !title.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-[11px] font-mono font-bold uppercase tracking-[0.15em] bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl border border-[#a855f7]/50 transition-all duration-200 hover:shadow-[0_0_16px_rgba(168,85,247,0.4)]"
                >
                  {loading ? (
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <GitFork className="w-3.5 h-3.5" />
                  )}
                  {loading ? "Forking…" : "Fork & Deploy"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
