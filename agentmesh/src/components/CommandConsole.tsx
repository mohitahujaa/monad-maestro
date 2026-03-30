"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Cpu } from "lucide-react";

const KNOWN_SKILLS = ["React", "Rust", "Solidity", "Design", "DevOps", "3D", "WebGL", "Copywriting"];

const PILL_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  React:       { bg: "rgba(14,165,233,0.12)",  border: "rgba(14,165,233,0.40)",  text: "#38bdf8" },
  Rust:        { bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.40)",  text: "#fb923c" },
  Solidity:    { bg: "rgba(168,85,247,0.12)",  border: "rgba(168,85,247,0.40)",  text: "#c084fc" },
  Design:      { bg: "rgba(236,72,153,0.12)",  border: "rgba(236,72,153,0.40)",  text: "#f472b6" },
  DevOps:      { bg: "rgba(163,230,53,0.12)",  border: "rgba(163,230,53,0.40)",  text: "#a3e635" },
  "3D":        { bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.40)",  text: "#fbbf24" },
  WebGL:       { bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.40)",  text: "#34d399" },
  Copywriting: { bg: "rgba(255,255,255,0.07)", border: "rgba(255,255,255,0.20)", text: "rgba(255,255,255,0.7)" },
};

export function CommandConsole() {
  const [input, setInput]           = useState("");
  const [activeSkills, setSkills]   = useState<string[]>([]);
  const [complexity, setComplexity] = useState(0);

  useEffect(() => {
    const words = input.toLowerCase().split(/\W+/);
    const detected = KNOWN_SKILLS.filter((s) => words.includes(s.toLowerCase()));
    setSkills(detected);
    const base  = Math.min(input.length / 100, 1) * 30;
    const extra = detected.length * 20;
    setComplexity(Math.min(base + extra, 100));
  }, [input]);

  const agentCount = activeSkills.length || 1;

  return (
    <div className="w-full max-w-4xl mx-auto relative">
      {/* Ambient glow */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-[#0ea5e9]/20 via-[#a855f7]/15 to-[#f59e0b]/10 blur-2xl pointer-events-none" />

      <div className="relative bg-[#0d0d10] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">

        {/* Terminal top bar */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3 bg-[#030303]/60">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <span className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            <div className="flex items-center gap-2 ml-2">
              <Terminal className="w-3 h-3 text-[#a3e635]" />
              <span className="font-mono text-[11px] text-[#a3e635] tracking-widest">ORCHESTRAL_CMD_V1.9</span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-white/25 uppercase tracking-[0.2em]">
            Awaiting input…
          </span>
        </div>

        <div className="p-6 flex flex-col gap-5">

          {/* Input area */}
          <div className="relative">
            <div className="absolute top-4 left-4 pointer-events-none flex items-center">
              <span className="text-[#a855f7] font-mono font-bold text-base leading-none animate-pulse">▸</span>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full bg-[#030303]/70 border border-white/[0.06] rounded-xl py-4 pl-10 pr-4 text-white/90 placeholder-white/[0.18] font-mono text-sm focus:outline-none focus:border-[#a855f7]/40 focus:ring-1 focus:ring-[#a855f7]/30 transition-all resize-none h-32 leading-relaxed"
              placeholder="Describe the task… (e.g., 'Build a WebGL dashboard with React front-end, deploy a Solidity contract with DevOps CI')"
              spellCheck={false}
            />
          </div>

          {/* Analysis row */}
          <div className="flex flex-col md:flex-row gap-4">

            {/* Extracted skills */}
            <div className="flex-1 bg-[#030303]/40 border border-white/[0.05] rounded-xl p-4 min-h-[100px]">
              <span className="section-label">Extracted Skills</span>
              <div className="flex flex-wrap gap-2 mt-1">
                <AnimatePresence>
                  {activeSkills.length === 0 && (
                    <motion.span
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-[11px] text-white/20 font-mono italic"
                    >
                      No skills detected yet…
                    </motion.span>
                  )}
                  {activeSkills.map((skill) => {
                    const c = PILL_COLORS[skill] ?? PILL_COLORS["Copywriting"];
                    return (
                      <motion.div
                        key={skill}
                        initial={{ opacity: 0, scale: 0.8, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -8 }}
                        transition={{ type: "spring", stiffness: 300, damping: 22 }}
                        className="px-3 py-1 rounded-full text-[11px] font-mono border"
                        style={{ background: c.bg, borderColor: c.border, color: c.text }}
                      >
                        {skill}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* Complexity meter */}
            <div className="w-full md:w-60 bg-[#030303]/40 border border-white/[0.05] rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="section-label mb-0">Task Complexity</span>
                  <span className="text-[11px] font-mono font-bold text-[#a3e635]">
                    {Math.round(complexity)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden border border-white/[0.04]">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#0ea5e9] via-[#a855f7] to-[#a3e635]"
                    initial={{ width: 0 }}
                    animate={{ width: `${complexity}%` }}
                    transition={{ type: "spring", stiffness: 80, damping: 18 }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-1.5 text-white/30">
                  <Cpu className="w-3 h-3" />
                  <span className="text-[10px] font-mono">Agents required</span>
                </div>
                <span className="text-base font-mono font-bold text-white tracking-widest">
                  {agentCount}
                </span>
              </div>
            </div>

            {/* Desktop deploy button */}
            <div className="hidden md:flex items-stretch">
              <button className="py-4 px-7 rounded-xl bg-[#a855f7] hover:bg-[#9333ea] text-white text-[11px] font-mono font-bold uppercase tracking-[0.2em] transition-all duration-200 hover:shadow-[0_0_24px_rgba(168,85,247,0.45)] border border-[#a855f7]/60 whitespace-nowrap flex items-center justify-center">
                Deploy Task
              </button>
            </div>
          </div>

          {/* Mobile deploy button */}
          <button className="w-full py-3.5 rounded-xl bg-[#a855f7] hover:bg-[#9333ea] text-white text-[11px] font-mono font-bold uppercase tracking-[0.2em] transition-all duration-200 hover:shadow-[0_0_24px_rgba(168,85,247,0.45)] md:hidden">
            Deploy Task
          </button>
        </div>
      </div>
    </div>
  );
}
