"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Star, CheckCircle2, Zap, Search, SlidersHorizontal, ArrowRight,
} from "lucide-react";

const DOMAIN_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  research:    { label: "Research",    color: "#38bdf8", bg: "rgba(56,189,248,0.10)",  border: "rgba(56,189,248,0.35)"  },
  coding:      { label: "Coding",      color: "#a3e635", bg: "rgba(163,230,53,0.10)",  border: "rgba(163,230,53,0.35)"  },
  design:      { label: "Design",      color: "#f472b6", bg: "rgba(244,114,182,0.10)", border: "rgba(244,114,182,0.35)" },
  writing:     { label: "Writing",     color: "#fbbf24", bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.35)"  },
  testing:     { label: "Testing",     color: "#fb923c", bg: "rgba(251,146,60,0.10)",  border: "rgba(251,146,60,0.35)"  },
  data:        { label: "Data",        color: "#c084fc", bg: "rgba(192,132,252,0.10)", border: "rgba(192,132,252,0.35)" },
  crypto_monad:{ label: "Crypto",      color: "#818cf8", bg: "rgba(129,140,248,0.10)", border: "rgba(129,140,248,0.35)" },
  github:      { label: "GitHub",      color: "#94a3b8", bg: "rgba(148,163,184,0.10)", border: "rgba(148,163,184,0.35)" },
  filesystem:  { label: "Filesystem",  color: "#34d399", bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.35)"  },
  web_search:  { label: "Web Search",  color: "#22d3ee", bg: "rgba(34,211,238,0.10)",  border: "rgba(34,211,238,0.35)"  },
};

const MCP_DOMAINS = new Set(["crypto_monad", "github", "filesystem", "web_search"]);

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
};

function AgentSkeleton() {
  return (
    <div className="bg-[#0d0d10] border border-white/[0.06] rounded-2xl p-6 animate-pulse space-y-4">
      <div className="flex justify-between">
        <div className="h-4 w-32 bg-white/[0.06] rounded" />
        <div className="h-5 w-16 bg-white/[0.06] rounded-full" />
      </div>
      <div className="h-3 w-full bg-white/[0.04] rounded" />
      <div className="h-3 w-3/4 bg-white/[0.04] rounded" />
      <div className="flex gap-2">
        <div className="h-5 w-14 bg-white/[0.04] rounded-lg" />
        <div className="h-5 w-14 bg-white/[0.04] rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-14 bg-white/[0.03] rounded-xl" />
        <div className="h-14 bg-white/[0.03] rounded-xl" />
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AgentCard({ agent }: { agent: any }) {
  const meta = DOMAIN_META[agent.domain] ?? { label: agent.domain, color: "#94a3b8", bg: "rgba(148,163,184,0.10)", border: "rgba(148,163,184,0.35)" };
  const isMcp = MCP_DOMAINS.has(agent.domain);

  return (
    <motion.div variants={fadeUp}>
      <Link href={`/agents/${agent.id}`} className="block h-full group">
        <div className="relative h-full bg-[#0d0d10] border border-white/[0.07] rounded-2xl overflow-hidden transition-all duration-200 hover:border-white/[0.18] hover:bg-[#111115] hover:-translate-y-1">
          {/* Color top bar */}
          <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${meta.color}aa, transparent)` }} />

          <div className="p-6 flex flex-col gap-4 h-full">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[15px] font-semibold text-white group-hover:text-[#a855f7] transition-colors duration-200 leading-tight">
                {agent.name}
              </h3>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                {/* Domain badge */}
                <span
                  className="text-[9px] font-mono uppercase tracking-[0.18em] px-2.5 py-1 rounded-full border"
                  style={{ color: meta.color, background: meta.bg, borderColor: meta.border }}
                >
                  {meta.label}
                </span>
                {/* MCP tag */}
                {isMcp && (
                  <span className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-md bg-[#818cf8]/10 border border-[#818cf8]/30 text-[#818cf8] uppercase tracking-widest">
                    <Zap className="w-2.5 h-2.5" /> MCP
                  </span>
                )}
                {/* On-chain */}
                {agent.registeredOnChain && (
                  <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400">
                    <CheckCircle2 className="w-2.5 h-2.5" /> on-chain
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-[12px] text-white/45 leading-relaxed font-mono line-clamp-2 flex-1">
              {agent.description}
            </p>

            {/* Reputation */}
            <div className="flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />
              <span className="text-sm font-bold text-white font-mono">{agent.reputationScore?.toFixed(1)}</span>
              <span className="text-[10px] text-white/30 font-mono">/ 5.0 reputation</span>
            </div>

            {/* Skills */}
            {agent.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {agent.skills.slice(0, 4).map((skill: string) => (
                  <span
                    key={skill}
                    className="text-[10px] px-2 py-0.5 bg-white/[0.04] border border-white/[0.07] rounded-md font-mono text-white/50"
                  >
                    {skill}
                  </span>
                ))}
                {agent.skills.length > 4 && (
                  <span className="text-[10px] px-2 py-0.5 text-white/25 font-mono">+{agent.skills.length - 4}</span>
                )}
              </div>
            )}

            {/* Rate / Budget */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { label: "Rate",       value: `$${agent.hourlyRate}/task` },
                { label: "Max Budget", value: `$${agent.maxBudget}`       },
              ].map((s) => (
                <div key={s.label} className="bg-transparent/70 border border-white/[0.05] rounded-xl px-3 py-2.5">
                  <span className="block text-[9px] font-mono text-white/25 uppercase tracking-[0.18em] mb-1">
                    {s.label}
                  </span>
                  <span className="text-sm font-bold font-mono text-white">{s.value}</span>
                </div>
              ))}
            </div>

            {/* Wallet */}
            <p className="text-[9px] font-mono text-white/20 truncate">
              {agent.walletAddress}
            </p>

            {/* CTA arrow */}
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.15em] text-white/25 group-hover:text-[#a855f7] transition-colors duration-200 mt-auto pt-1">
              View Details <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Real Model Metadata ──────────────────────────────────────────────────────
// Source: Groq pricing + OpenRouter model cards (as of March 2026)
const MODEL_META: Record<string, {
  displayName: string;
  contextWindow: string;   // e.g. "128K"
  inputCost: string;       // $ per 1M tokens, or "Free"
  outputCost: string;
  isFree: boolean;
}> = {
  // Groq
  "llama-3.3-70b-versatile": {
    displayName: "Llama 3.3 70B",
    contextWindow: "128K",
    inputCost: "$0.59",
    outputCost: "$0.79",
    isFree: false,
  },
  "llama-3.1-8b-instant": {
    displayName: "Llama 3.1 8B Instant",
    contextWindow: "128K",
    inputCost: "$0.05",
    outputCost: "$0.08",
    isFree: false,
  },
  "mixtral-8x7b-32768": {
    displayName: "Mixtral 8x7B",
    contextWindow: "32K",
    inputCost: "$0.24",
    outputCost: "$0.24",
    isFree: false,
  },
  // OpenRouter free models
  "x-ai/grok-3-mini": {
    displayName: "Grok 3 Mini",
    contextWindow: "131K",
    inputCost: "$0.30",
    outputCost: "$0.50",
    isFree: false,
  },
  "qwen/qwen3-4b:free": {
    displayName: "Qwen 3 4B",
    contextWindow: "40K",
    inputCost: "Free",
    outputCost: "Free",
    isFree: true,
  },
  "qwen/qwen3-coder:free": {
    displayName: "Qwen 3 Coder",
    contextWindow: "32K",
    inputCost: "Free",
    outputCost: "Free",
    isFree: true,
  },
  "qwen/qwen3-next-80b-a3b-instruct:free": {
    displayName: "Qwen 3 80B",
    contextWindow: "40K",
    inputCost: "Free",
    outputCost: "Free",
    isFree: true,
  },
  // Stability AI
  "stability-sd3": {
    displayName: "Stable Diffusion 3",
    contextWindow: "—",
    inputCost: "$0.065/img",
    outputCost: "—",
    isFree: false,
  },
};

const DEFAULT_FREE_META = {
  displayName: "Unknown Model",
  contextWindow: "—",
  inputCost: "Free",
  outputCost: "Free",
  isFree: true,
};
const DEFAULT_PAID_META = {
  displayName: "Custom Model",
  contextWindow: "—",
  inputCost: "$1.00",
  outputCost: "$1.00",
  isFree: false,
};

function getModelMeta(model: string) {
  if (MODEL_META[model]) return MODEL_META[model];
  if (model.endsWith(":free")) return { ...DEFAULT_FREE_META, displayName: model.split("/").pop()?.replace(":free", "") ?? model };
  return { ...DEFAULT_PAID_META, displayName: model.split("/").pop() ?? model };
}

// ─── Domain config ─────────────────────────────────────────────────────────────
const DOMAIN_COLORS: Record<string, string> = {
  research:    "bg-blue-100 text-blue-800",
  coding:      "bg-green-100 text-green-800",
  design:      "bg-pink-100 text-pink-800",
  writing:     "bg-yellow-100 text-yellow-800",
  testing:     "bg-orange-100 text-orange-800",
  data:        "bg-purple-100 text-purple-800",
  crypto_monad:"bg-violet-100 text-violet-800",
  github:      "bg-gray-100 text-gray-800",
  filesystem:  "bg-teal-100 text-teal-800",
  web_search:  "bg-cyan-100 text-cyan-800",
  image_gen:   "bg-rose-100 text-rose-800",
};

const PROVIDER_STYLES: Record<string, { label: string; cls: string }> = {
  groq:        { label: "Groq",       cls: "bg-orange-50 text-orange-700 border-orange-200" },
  openrouter:  { label: "OpenRouter", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  stability:   { label: "Stability",  cls: "bg-rose-50 text-rose-700 border-rose-200" },
};

const MCP_DOMAINS = new Set(["crypto_monad", "github", "filesystem", "web_search"]);

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function AgentsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [agents, setAgents]       = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [chainStatus, setChain]   = useState<any>(null);
  const [search, setSearch]       = useState("");
  const [domainFilter, setDomain] = useState<string>("all");

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((d) => { setAgents(d); setLoading(false); });

    fetch("/api/chain/status")
      .then((r) => r.json())
      .then((d) => setChain(d))
      .catch(() => setChain({ connected: false }));
  }, []);

  const allDomains = Array.from(new Set(agents.map((a) => a.domain)));

  const filtered = agents.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.description?.toLowerCase().includes(search.toLowerCase());
    const matchDomain = domainFilter === "all" || a.domain === domainFilter;
    return matchSearch && matchDomain;
  });

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
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6"
          >
            <div>
              <span className="section-label">Agent Registry</span>
              <h1 className="section-heading">Available Agents</h1>
              <p className="text-[12px] text-white/40 font-mono mt-2">
                Scored by reputation · registered on Monad blockchain
              </p>
            </div>

            {/* Chain status */}
            {chainStatus && (
              <div className={`flex items-center gap-2 text-[10px] font-mono px-3 py-2 rounded-xl border ${
                chainStatus.connected
                  ? "bg-emerald-500/8 border-emerald-500/25 text-emerald-400"
                  : "bg-white/[0.03] border-white/[0.08] text-white/30"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${chainStatus.connected ? "bg-emerald-400 animate-pulse" : "bg-white/30"}`} />
                <span className="uppercase tracking-widest">
                  {chainStatus.connected
                    ? `${chainStatus.network} · #${chainStatus.blockNumber}`
                    : "Chain: off-chain mode"}
                </span>
                {chainStatus.walletAddress && (
                  <span className="text-white/30 border-l border-white/10 pl-2 ml-1">
                    {chainStatus.walletAddress.slice(0, 6)}…
                  </span>
                )}
              </div>
            )}
          </motion.div>

          {/* Contract status pills */}
          {chainStatus?.connected && chainStatus.contracts && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-wrap gap-2 mt-5"
            >
              {Object.entries(chainStatus.contracts as Record<string, boolean>).map(([name, deployed]) => (
                <span
                  key={name}
                  className={`tag-pill ${deployed ? "text-emerald-400 border-emerald-500/25 bg-emerald-500/8" : "text-red-400 border-red-500/25 bg-red-500/8"}`}
                >
                  <span className={`w-1 h-1 rounded-full ${deployed ? "bg-emerald-400" : "bg-red-400"}`} />
                  {name}: {deployed ? "deployed" : "not found"}
                </span>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="relative z-10 border-b border-white/[0.05] bg-transparent/60 backdrop-blur-xl px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              type="text"
              placeholder="Search agents…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-[12px] font-mono text-white placeholder-white/25 focus:outline-none focus:border-[#a855f7]/40 transition-colors"
            />
          </div>

          {/* Domain filter */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setDomain("all")}
                className={`text-[9px] font-mono uppercase tracking-[0.15em] px-3 py-1.5 rounded-lg border transition-all duration-150 ${
                  domainFilter === "all"
                    ? "bg-[#a855f7]/20 border-[#a855f7]/50 text-[#a855f7]"
                    : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white hover:border-white/20"
                }`}
              >
                All
              </button>
              {allDomains.map((d) => {
                const m = DOMAIN_META[d];
                return (
                  <button
                    key={d}
                    onClick={() => setDomain(d)}
                    className="text-[9px] font-mono uppercase tracking-[0.15em] px-3 py-1.5 rounded-lg border transition-all duration-150"
                    style={
                      domainFilter === d
                        ? { background: m?.bg ?? "rgba(255,255,255,0.06)", borderColor: m?.border ?? "rgba(255,255,255,0.2)", color: m?.color ?? "#fff" }
                        : { background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }
                    }
                  >
                    {m?.label ?? d}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Count */}
          <span className="text-[10px] font-mono text-white/25 ml-auto flex-shrink-0">
            {filtered.length} agents
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="relative z-10 px-6 py-10 max-w-7xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <AgentSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-4 py-24 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
              <Search className="w-6 h-6 text-white/20" />
            </div>
            <p className="text-white/40 font-mono text-sm">No agents match your filters.</p>
            <button onClick={() => { setSearch(""); setDomain("all"); }} className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#a855f7] hover:text-[#c084fc] transition-colors">
              Clear filters
            </button>
          </motion.div>
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filtered.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
