"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, Star, ArrowRight } from "lucide-react";

interface AgentProps {
  name: string;
  level: string;
  reputation: number;
  tasks?: number;
  costPerTask?: string;
  skills: { name: string; icon: React.ComponentType<{ className?: string }> }[];
  aura: string;
}

const LEVEL_COLORS: Record<string, string> = {
  Grandmaster: "#a855f7",
  Elite:       "#0ea5e9",
  Master:      "#f59e0b",
  Veteran:     "#a3e635",
};

export function AgentCard({
  name,
  level,
  reputation,
  tasks = 0,
  costPerTask = "0.50",
  skills,
  aura,
}: AgentProps) {
  const levelColor = LEVEL_COLORS[level] ?? "#a855f7";

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={`relative w-full max-w-[320px] rounded-2xl p-[1px] bg-gradient-to-b ${aura} overflow-hidden group cursor-pointer mx-auto`}
    >
      {/* Background ambient glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${aura} opacity-0 group-hover:opacity-25 blur-2xl transition-opacity duration-500 pointer-events-none`}
      />

      <div className="relative h-full w-full bg-[#0d0d10] rounded-2xl overflow-hidden z-10">
        {/* Top accent stripe */}
        <div className={`h-[2px] w-full bg-gradient-to-r ${aura}`} />

        <div className="p-6">
          {/* Avatar ring */}
          <div className="w-20 h-20 mx-auto mb-5 relative flex items-center justify-center">
            <div className="absolute inset-0 border border-white/[0.08] rounded-full animate-[spin_9s_linear_infinite]" />
            <div className="absolute inset-2 border border-white/[0.04] rounded-full animate-[spin_6s_linear_infinite_reverse]" />
            <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${aura} opacity-25`} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-[#111115] border border-white/[0.08] shadow-inner" />
            </div>
          </div>

          {/* Identity */}
          <div className="text-center mb-5">
            <h3 className="text-lg font-bold text-white tracking-wide group-hover:text-[#a855f7] transition-colors duration-200">
              {name}
            </h3>
            <p
              className="text-[10px] uppercase tracking-[0.25em] font-mono mt-1.5"
              style={{ color: levelColor }}
            >
              {level}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              {
                label: "Rep",
                value: (
                  <span className="flex items-center justify-center gap-1 font-mono font-bold text-white text-sm">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    {reputation.toFixed(1)}
                  </span>
                ),
              },
              { label: "Tasks",  value: <span className="font-mono font-bold text-white text-sm">{tasks}</span> },
              { label: "$/task", value: <span className="font-mono font-bold text-white text-sm">{costPerTask}</span> },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-2 py-2.5 text-center"
              >
                <span className="block text-[9px] text-white/35 uppercase tracking-widest font-mono mb-1">
                  {stat.label}
                </span>
                {stat.value}
              </div>
            ))}
          </div>

          {/* Skills */}
          <div className="mb-5">
            <span className="block text-[9px] text-white/25 uppercase tracking-[0.2em] font-mono mb-2">
              Core Directives
            </span>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.04] border border-white/[0.06] rounded-lg text-[10px] font-mono text-white/50 hover:text-white hover:border-white/20 transition-all duration-150"
                >
                  <skill.icon className="w-3 h-3" />
                  {skill.name}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            className={`w-full py-2.5 rounded-xl bg-gradient-to-r ${aura} opacity-75 hover:opacity-100 text-white text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-200 flex items-center justify-center gap-2 group/btn`}
          >
            Hire Agent
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform duration-150" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default AgentCard;
