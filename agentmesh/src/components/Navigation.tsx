"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

const NAV_LINKS = [
  { label: "Agents", href: "/agents" },
  { label: "Tasks",  href: "/tasks"  },
  { label: "Deploy", href: "/tasks/new" },
  { label: "Monad ↗", href: "https://monad.xyz", external: true },
];

export function Navigation() {
  const pathname = usePathname();
  const [chainConnected, setChainConnected] = useState<boolean | null>(null);
  const [blockNumber, setBlockNumber]       = useState<number | null>(null);
  const [scrolled, setScrolled]             = useState(false);

  useEffect(() => {
    const check = () =>
      fetch("/api/chain/status")
        .then((r) => r.json())
        .then((d) => { setChainConnected(d.connected); setBlockNumber(d.blockNumber); })
        .catch(() => setChainConnected(false));
    check();
    const iv = setInterval(check, 15000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /**
   * Returns true if this nav link should be marked active.
   * - Exact match for "/tasks/new" (Deploy)
   * - Prefix match for "/agents" and "/tasks" (but NOT if we're on /tasks/new)
   */
  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/tasks/new") return pathname === "/tasks/new";
    if (href === "/tasks")    return pathname.startsWith("/tasks") && pathname !== "/tasks/new";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#030303]/90 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_4px_32px_rgba(0,0,0,0.6)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-7 h-7 rounded bg-gradient-to-tr from-[#0ea5e9] via-[#a855f7] to-[#f59e0b] p-[1.5px] flex-shrink-0">
            <div className="w-full h-full bg-[#030303] rounded-[4px] flex items-center justify-center">
              <div className="flex gap-[3px]">
                <span className="w-1.5 h-1.5 bg-white rounded-full" />
                <span className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
            </div>
          </div>
          <span className="font-bold text-[13px] tracking-[0.2em] uppercase text-white/80 group-hover:text-white transition-colors duration-200">
            AgentMesh
          </span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const active = !link.external && isActive(link.href);
            return link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="relative px-4 py-2 text-[11px] font-mono uppercase tracking-[0.2em] text-white/35 hover:text-white/70 transition-colors duration-200"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className={`relative px-4 py-2 text-[11px] font-mono uppercase tracking-[0.2em] transition-colors duration-200 rounded-lg ${
                  active
                    ? "text-white"
                    : "text-white/40 hover:text-white/80 hover:bg-white/[0.04]"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="absolute inset-0 rounded-lg bg-white/[0.06] border border-white/[0.10]"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
                {active && (
                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#a855f7]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: chain status + CTA */}
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {chainConnected !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`hidden sm:flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-full border ${
                  chainConnected
                    ? "bg-emerald-500/8 border-emerald-500/25 text-emerald-400"
                    : "bg-white/[0.04] border-white/[0.08] text-white/30"
                }`}
                title={chainConnected ? `Monad Testnet · block #${blockNumber}` : "Chain offline"}
              >
                <Zap className={`w-2.5 h-2.5 ${chainConnected ? "text-emerald-400" : "text-white/30"}`} />
                <span>{chainConnected ? `#${blockNumber?.toLocaleString()}` : "offline"}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <Link
            href="/tasks/new"
            className={`text-[10px] font-mono uppercase tracking-[0.2em] px-4 py-2 rounded-lg border transition-all duration-200 ${
              isActive("/tasks/new")
                ? "bg-[#a855f7]/20 border-[#a855f7]/50 text-[#a855f7] shadow-[0_0_16px_rgba(168,85,247,0.2)]"
                : "border-white/[0.15] text-white/80 hover:text-white hover:bg-white/[0.06] hover:border-white/30"
            }`}
          >
            Launch Engine
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
