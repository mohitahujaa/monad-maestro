"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, AlertTriangle } from "lucide-react";

interface NodeRep {
  id: string;
  name: string;
  score: number;
  slashes: number;
  status: "verified" | "slashed";
}

const INITIAL_NODES: NodeRep[] = [
  { id: "1", name: "Alpha_Node_XR",      score: 98.6, slashes: 0, status: "verified" },
  { id: "2", name: "Nexus_Orchestrator", score: 91.4, slashes: 0, status: "verified" },
  { id: "3", name: "Beta_Executor_99",   score: 87.2, slashes: 1, status: "verified" },
  { id: "4", name: "Rogue_Node_02",      score: 45.1, slashes: 3, status: "slashed"  },
];

function ScoreBar({ score, slashed }: { score: number; slashed: boolean }) {
  return (
    <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden mt-1.5">
      <motion.div
        className={`h-full rounded-full ${slashed ? "bg-red-500" : "bg-gradient-to-r from-[#0ea5e9] to-[#a855f7]"}`}
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}

export function ReputationForge() {
  const [nodes, setNodes] = useState(INITIAL_NODES);

  useEffect(() => {
    const iv = setInterval(() => {
      setNodes((prev) => {
        const next = prev.map((n, i) => {
          if (i >= 3 || n.status !== "verified") return n;
          const delta = Math.random() * 0.6 - 0.2;
          return { ...n, score: Math.min(100, Math.max(0, n.score + delta)) };
        });
        return next.sort((a, b) => b.score - a.score);
      });
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl bg-[#0d0d10] border border-white/[0.08] overflow-hidden">

      {/* Header */}
      <div className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between bg-[#030303]/50">
        <h3 className="font-mono text-[13px] font-semibold text-white/80 uppercase tracking-[0.15em]">
          Reputation Ledger
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-[#a3e635]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#a3e635] animate-pulse" />
            Live Sync
          </div>
          <span className="text-[10px] font-mono text-white/25 uppercase tracking-[0.2em]">
            Monad Testnet
          </span>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/[0.04]">
        {["Rank", "Identity", "Score", "Shield"].map((col, i) => (
          <div
            key={col}
            className={`col-span-${[1,5,3,3][i]} text-[9px] font-mono uppercase tracking-[0.2em] text-white/25 ${i > 1 ? "text-right" : ""}`}
          >
            {col}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div className="px-6 py-4 space-y-3">
        <AnimatePresence>
          {nodes.map((node, index) => {
            const slashed = node.status === "slashed";
            return (
              <motion.div
                key={node.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className={`grid grid-cols-12 gap-4 items-center px-4 py-3.5 rounded-xl border transition-all duration-200 ${
                  slashed
                    ? "bg-red-500/[0.06] border-red-500/[0.20] hover:border-red-500/40"
                    : "bg-white/[0.02] border-white/[0.06] hover:border-[#a855f7]/35 hover:bg-white/[0.03]"
                }`}
              >
                {/* Rank */}
                <div className="col-span-1 font-mono text-[11px] text-white/25 font-bold">
                  {String(index + 1).padStart(2, "0")}
                </div>

                {/* Identity */}
                <div className="col-span-5 flex items-center gap-2.5">
                  <span className="font-mono text-sm text-white/80 truncate">{node.name}</span>
                  {slashed ? (
                    <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25 font-mono uppercase tracking-widest flex-shrink-0">
                      <AlertTriangle className="w-2.5 h-2.5" /> Slashed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-[#a3e635]/12 text-[#a3e635] border border-[#a3e635]/25 font-mono uppercase tracking-widest flex-shrink-0">
                      <ShieldCheck className="w-2.5 h-2.5" /> Verified
                    </span>
                  )}
                </div>

                {/* Score */}
                <div className="col-span-3 text-right">
                  <span className={`font-mono font-bold text-sm ${slashed ? "text-red-400" : "text-white"}`}>
                    {node.score.toFixed(2)}
                  </span>
                  <ScoreBar score={node.score} slashed={slashed} />
                </div>

                {/* Shield segments */}
                <div className="col-span-3 flex justify-end items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 rounded-sm flex-shrink-0 transition-all duration-300 ${
                        i < 5 - node.slashes
                          ? "w-4 bg-gradient-to-t from-[#a855f7] to-[#0ea5e9] shadow-[0_0_6px_rgba(168,85,247,0.4)]"
                          : "w-3 bg-red-500/25 skew-x-[-15deg]"
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
