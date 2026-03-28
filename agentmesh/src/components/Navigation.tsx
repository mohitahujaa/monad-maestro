"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Zap, Sparkles } from "lucide-react";

export function Navigation() {
  const [chainConnected, setChainConnected] = useState<boolean | null>(null);
  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const check = () => {
      fetch("/api/chain/status")
        .then((r) => r.json())
        .then((d) => {
          setChainConnected(d.connected);
          setBlockNumber(d.blockNumber);
        })
        .catch(() => setChainConnected(false));
    };
    check();
    const iv = setInterval(check, 15000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0a0a0c]/90 backdrop-blur-md border-b border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded bg-gradient-to-tr from-[#0ea5e9] via-[#a855f7] to-[#f59e0b] p-[1.5px] flex-shrink-0">
            <div className="w-full h-full bg-[#0a0a0c] rounded-[4px] flex items-center justify-center">
              <div className="flex gap-[3px]">
                <span className="w-1.5 h-1.5 bg-white rounded-full" />
                <span className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
            </div>
          </div>
          <span className="font-bold text-base tracking-widest uppercase text-white group-hover:text-white/80 transition-colors">
            AgentMesh
          </span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-[11px] font-mono uppercase tracking-widest text-white/50">
          <Link href="/agents" className="hover:text-white transition-colors">Agents</Link>
          <Link
            href="/orchestrate"
            className="hover:text-white transition-colors flex items-center gap-1 text-violet-400 hover:text-violet-300"
          >
            <Sparkles className="w-3 h-3" /> Orchestrate
          </Link>
          <Link href="/tasks" className="hover:text-white transition-colors">Tasks</Link>
          <Link href="/tasks/new" className="hover:text-white transition-colors">Deploy Task</Link>
          <a
            href="https://monad.xyz"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors"
          >
            Monad ↗
          </a>  
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Chain status */}
          {chainConnected !== null && (
            <div
              className={`hidden sm:flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-full border ${
                chainConnected
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-white/5 border-white/10 text-white/30"
              }`}
              title={
                chainConnected
                  ? `Monad Testnet · block #${blockNumber}`
                  : "Chain not connected"
              }
            >
              <Zap className={`w-3 h-3 ${chainConnected ? "text-emerald-400" : "text-white/30"}`} />
              <span>
                {chainConnected ? `#${blockNumber?.toLocaleString()}` : "offline"}
              </span>
            </div>
          )}

          <Link
            href="/tasks/new"
            className="text-[10px] font-mono uppercase tracking-widest px-4 py-2 rounded-md border border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all"
          >
            Launch Engine
          </Link>
        </div>
      </div>
    </header>
  );
}
