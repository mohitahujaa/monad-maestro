"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const KNOWN_SKILLS = ["React", "Rust", "Solidity", "Design", "DevOps", "3D", "WebGL", "Copywriting"];

export function CommandConsole() {
  const [input, setInput] = useState("");
  const [activeSkills, setActiveSkills] = useState<string[]>([]);
  const [complexity, setComplexity] = useState(0);

  useEffect(() => {
    // Simple heuristic parser for demo
    const words = input.toLowerCase().split(/\W+/);
    const newSkills = KNOWN_SKILLS.filter(skill => words.includes(skill.toLowerCase()));
    
    setActiveSkills(newSkills);
    
    // Calculate complexity based on length, unique words, and detected skills
    const baseComplexity = Math.min(input.length / 100, 1) * 30; // Up to 30% from length
    const skillComplexity = newSkills.length * 20; // 20% per skill
    
    setComplexity(Math.min(baseComplexity + skillComplexity, 100));
  }, [input]);

  return (
    <div className="w-full max-w-4xl mx-auto backdrop-blur-md bg-black/40 border border-[#a855f7]/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(168,85,247,0.15)] relative overflow-hidden">
      {/* Glow behind */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-[#a855f7]/10 blur-[100px] pointer-events-none rounded-full" />
      
      <div className="relative z-10 flex flex-col gap-6">
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex gap-2 items-center">
            <span className="w-3 h-3 rounded-full bg-red-500/80 animate-pulse" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <span className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="ml-3 font-mono text-xs text-[#a3e635]">ORCHESTRAL_CMD_V1.9</span>
          </div>
          <div className="text-xs font-mono text-white/50 tracking-widest uppercase">
            Awaiting input sequence...
          </div>
        </div>
        
        {/* Input Area */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <span className="text-[#a855f7] font-mono font-bold animate-pulse">{'>'}</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-black/50 border border-white/5 rounded-xl py-4 pl-10 pr-4 text-white placeholder-white/20 font-mono focus:outline-none focus:border-[#a855f7]/50 focus:ring-1 focus:ring-[#a855f7]/50 transition-all resize-none h-32"
            placeholder="Describe the task... (e.g., 'Build a WebGL site with React and deploy a Solidity contract with DevOps')"
            spellCheck={false}
          />
        </div>
        
        {/* Real-time Analysis */}
        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Skills Extracted */}
          <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-xl p-4 min-h-[100px]">
            <h4 className="text-[10px] text-white/40 uppercase font-mono tracking-wider mb-3">Extracted Skills</h4>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {activeSkills.length === 0 && (
                  <motion.span 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="text-xs text-white/20 font-mono italic"
                  >
                    No known skills detected...
                  </motion.span>
                )}
                {activeSkills.map((skill) => (
                  <motion.div
                    key={skill}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -10 }}
                    className="px-3 py-1 bg-[#a855f7]/20 border border-[#a855f7]/50 text-[#a855f7] rounded-full text-xs font-mono shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                  >
                    {skill}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Complexity Meter */}
          <div className="w-full md:w-64 bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col justify-center">
            <div className="flex justify-between items-end mb-2">
              <h4 className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Task Complexity</h4>
              <span className="text-xs font-mono text-[#a3e635]">{Math.round(complexity)}%</span>
            </div>
            
            {/* Progress Bar Container */}
            <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden shrink-0 border border-white/10">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#a855f7] to-[#a3e635] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${complexity}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
              />
            </div>
            
            <div className="mt-3 flex gap-1 items-center justify-between">
               <span className="text-[10px] text-white/30 font-mono tracking-tight">Required Agents:</span>
               <span className="text-sm text-white font-mono font-bold tracking-widest">{activeSkills.length || 1}</span>
            </div>
          </div>
          
          <button className="h-full md:h-auto py-4 px-6 rounded-xl bg-[#a855f7] hover:bg-[#a855f7]/80 text-white font-bold tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] border border-transparent whitespace-nowrap hidden md:flex items-center justify-center">
            Deploy Task
          </button>
        </div>
        <button className="w-full py-4 rounded-xl bg-[#a855f7] hover:bg-[#a855f7]/80 text-white font-bold tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] md:hidden">
          Deploy Task
        </button>
      </div>
    </div>
  );
}
