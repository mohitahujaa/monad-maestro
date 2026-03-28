"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NodeRep {
  id: string;
  name: string;
  score: number;
  slashes: number;
  status: "verified" | "slashed";
}

const INITIAL_NODES: NodeRep[] = [
  { id: "1", name: "Alpha_Node_XR", score: 98.6, slashes: 0, status: "verified" },
  { id: "2", name: "Beta_Executor_99", score: 87.2, slashes: 1, status: "verified" },
  { id: "3", name: "Nexus_Orchestrator", score: 91.4, slashes: 0, status: "verified" },
  { id: "4", name: "Rogue_Node_02", score: 45.1, slashes: 3, status: "slashed" },
];

export function ReputationForge() {
  const [nodes, setNodes] = useState(INITIAL_NODES);

  useEffect(() => {
    // Simulate live updates
    const interval = setInterval(() => {
      setNodes((prev) => {
        const newNodes = [...prev];
        const randomIndex = Math.floor(Math.random() * 3); // Update top 3 randomly
        if (newNodes[randomIndex].status === "verified") {
            newNodes[randomIndex].score = Math.min(100, newNodes[randomIndex].score + (Math.random() * 0.5 - 0.2));
        }
        return newNodes.sort((a, b) => b.score - a.score);
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl bg-black/40 border border-white/10 overflow-hidden relative backdrop-blur-md">
      {/* Header */}
      <div className="bg-gradient-to-r from-black/80 to-transparent border-b border-white/10 px-6 py-4 flex items-center justify-between">
         <h3 className="text-white font-sans font-bold tracking-[0.2em] uppercase">Reputation Ledger</h3>
         <div className="flex gap-4">
             <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#a3e635]">
                 <span className="w-1.5 h-1.5 rounded-full bg-[#a3e635] animate-pulse" /> Live Sync
             </div>
             <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                 Monad Mainnet
             </div>
         </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-12 gap-4 pb-4 border-b border-white/5 mb-4 text-[10px] font-mono text-white/50 uppercase tracking-widest">
           <div className="col-span-1">Rank</div>
           <div className="col-span-5">Identity Hash</div>
           <div className="col-span-3 text-right">Reputation Score</div>
           <div className="col-span-3 text-right">Shield Integrity</div>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {nodes.map((node, index) => (
              <motion.div
                key={node.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`grid grid-cols-12 gap-4 items-center p-3 rounded-xl border transition-all ${
                  node.status === "verified"
                    ? "bg-white/[0.02] border-white/10 hover:border-[#a855f7]/50"
                    : "bg-red-500/10 border-red-500/30"
                }`}
              >
                <div className="col-span-1 font-mono text-sm text-white/30 font-bold">
                   0{index + 1}
                </div>
                <div className="col-span-5 font-mono text-sm text-white flex items-center gap-3">
                   {node.name}
                   {node.status === "verified" && (
                       <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#a3e635]/20 text-[#a3e635] border border-[#a3e635]/30">Verified</span>
                   )}
                   {node.status === "slashed" && (
                       <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-400/20 text-red-400 border border-red-400/30">Slashed</span>
                   )}
                </div>
                <div className="col-span-3 text-right font-mono font-bold">
                   <span className={node.status === "verified" ? "text-white" : "text-red-400"}>
                       {node.score.toFixed(2)}
                   </span>
                </div>
                
                {/* Shield Visualizer */}
                <div className="col-span-3 flex justify-end items-center gap-1">
                   {[...Array(5)].map((_, i) => (
                      <div 
                         key={i} 
                         className={`w-4 h-1 rounded flex-shrink-0 transition-all ${
                             i < 5 - node.slashes
                               ? "bg-gradient-to-t from-[#a855f7] to-[#8b5cf6] shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                               : "bg-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.2)] skew-x-[-20deg]"
                         }`}
                      />
                   ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
