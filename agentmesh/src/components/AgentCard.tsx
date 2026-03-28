"use client";

import { motion } from "framer-motion";
import { Shield, Star, ArrowRight } from "lucide-react";

interface AgentProps {
  name: string;
  level: string;
  reputation: number;
  tasks?: number;
  costPerTask?: string;
  skills: { name: string; icon: any }[];
  aura: string;
}

export function AgentCard({
  name,
  level,
  reputation,
  tasks = 0,
  costPerTask = "0.50",
  skills,
  aura,
}: AgentProps) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`relative w-full max-w-[320px] rounded-2xl p-[1px] bg-gradient-to-b ${aura} overflow-hidden group cursor-pointer mx-auto`}
    >
      {/* Glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${aura} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`}
      />

      <div className="relative h-full w-full bg-[#0d0d10] rounded-2xl overflow-hidden z-10">
        {/* Top accent bar */}
        <div className={`h-[2px] w-full bg-gradient-to-r ${aura}`} />

        <div className="p-6">
          {/* Avatar */}
          <div className="w-20 h-20 mx-auto mb-5 relative flex items-center justify-center">
            <div className="absolute inset-0 border border-white/10 rounded-full animate-[spin_8s_linear_infinite]" />
            <div className="absolute inset-2 border border-white/5 rounded-full animate-[spin_5s_linear_infinite_reverse]" />
            <div
              className={`w-12 h-12 rounded-full bg-gradient-to-tr ${aura} opacity-30`}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 backdrop-blur-md" />
            </div>
          </div>

          {/* Identity */}
          <div className="text-center mb-5">
            <h3 className="text-xl font-bold text-white tracking-wide group-hover:text-[#a855f7] transition-colors">
              {name}
            </h3>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#a3e635] font-mono mt-1">
              {level}
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-2 py-2.5 text-center">
              <span className="block text-[9px] text-white/40 uppercase tracking-widest font-mono mb-1">Rep</span>
              <span className="flex items-center justify-center gap-1 text-sm font-bold text-white font-mono">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                {reputation.toFixed(1)}
              </span>
            </div>
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-2 py-2.5 text-center">
              <span className="block text-[9px] text-white/40 uppercase tracking-widest font-mono mb-1">Tasks</span>
              <span className="text-sm font-bold text-white font-mono">{tasks}</span>
            </div>
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-2 py-2.5 text-center">
              <span className="block text-[9px] text-white/40 uppercase tracking-widest font-mono mb-1">$/task</span>
              <span className="text-sm font-bold text-white font-mono">{costPerTask}</span>
            </div>
          </div>

          {/* Skills */}
          <div className="mb-5">
            <span className="block text-[9px] text-white/30 uppercase tracking-widest font-mono mb-2">Core Directives</span>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.04] border border-white/[0.07] rounded-md text-[10px] font-mono text-white/60 hover:text-white hover:border-white/20 transition-all"
                >
                  <skill.icon className="w-3 h-3" />
                  {skill.name}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            className={`w-full py-2.5 rounded-xl bg-gradient-to-r ${aura} opacity-80 hover:opacity-100 text-white text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 group/btn`}
          >
            Hire Agent
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default AgentCard;
