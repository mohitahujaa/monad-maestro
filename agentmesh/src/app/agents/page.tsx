"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Link2, CheckCircle2, XCircle, Cpu, Coins, Layers } from "lucide-react";

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
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [chainStatus, setChainStatus] = useState<any>(null);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((d) => { setAgents(d); setLoading(false); });

    fetch("/api/chain/status")
      .then((r) => r.json())
      .then((d) => setChainStatus(d))
      .catch(() => setChainStatus({ connected: false }));
  }, []);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading agents…</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Available Agents</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {agents.length} agents · scored by on-chain reputation
          </p>
        </div>

        {chainStatus && (
          <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${
            chainStatus.connected
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-gray-50 border-gray-200 text-gray-600"
          }`}>
            {chainStatus.connected
              ? <CheckCircle2 className="w-4 h-4 text-green-600" />
              : <XCircle className="w-4 h-4 text-gray-400" />}
            <span className="font-medium">
              {chainStatus.connected
                ? `Monad: ${chainStatus.network} · block #${chainStatus.blockNumber}`
                : "Chain: off-chain mode"}
            </span>
            {chainStatus.walletAddress && (
              <span className="text-xs font-mono opacity-70">
                {chainStatus.walletAddress.slice(0, 8)}…
              </span>
            )}
          </div>
        )}
      </div>

      {chainStatus?.connected && chainStatus.contracts && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(chainStatus.contracts as Record<string, boolean>).map(([name, deployed]) => (
            <span
              key={name}
              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border ${
                deployed ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              <Link2 className="w-3 h-3" />
              {name}: {deployed ? "deployed" : "not found"}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => {
          const meta = getModelMeta(agent.model ?? "");
          const providerStyle = PROVIDER_STYLES[agent.provider] ?? { label: agent.provider, cls: "bg-gray-50 text-gray-600 border-gray-200" };
          const isMcp = MCP_DOMAINS.has(agent.domain);

          return (
            <Link key={agent.id} href={`/agents/${agent.id}`} className="block group">
              <Card className="hover:shadow-md transition-all group-hover:border-primary/40 cursor-pointer h-full flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base leading-tight">{agent.name}</CardTitle>
                      {/* Real model name */}
                      <p className="text-xs font-mono text-muted-foreground mt-0.5 truncate">
                        {meta.displayName}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge
                        className={`uppercase text-[10px] ${DOMAIN_COLORS[agent.domain] ?? "bg-gray-100 text-gray-700"}`}
                        variant="secondary"
                      >
                        {agent.domain.replace(/_/g, " ")}
                      </Badge>
                      {isMcp && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-violet-50 text-violet-700 border border-violet-200 rounded font-mono">
                          MCP ⚡
                        </span>
                      )}
                    </div>
                  </div>
                  <CardDescription className="text-xs mt-1 line-clamp-2">{agent.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-3">
                  {/* Reputation */}
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-400 shrink-0" />
                    <span className="font-semibold text-sm">{agent.reputationScore.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">/ 5.0 reputation</span>
                  </div>

                  {/* Model info row */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {/* Provider */}
                    <div className={`flex items-center gap-1 px-2 py-1.5 rounded border text-center justify-center font-medium ${providerStyle.cls}`}>
                      <Cpu className="w-3 h-3 shrink-0" />
                      {providerStyle.label}
                    </div>
                    {/* Context */}
                    <div className="flex flex-col items-center justify-center px-2 py-1.5 rounded border bg-muted/40">
                      <Layers className="w-3 h-3 text-muted-foreground mb-0.5" />
                      <span className="font-semibold">{meta.contextWindow}</span>
                      <span className="text-[9px] text-muted-foreground leading-none">context</span>
                    </div>
                    {/* Cost */}
                    <div className={`flex flex-col items-center justify-center px-2 py-1.5 rounded border ${
                      meta.isFree ? "bg-green-50 border-green-200" : "bg-muted/40"
                    }`}>
                      <Coins className="w-3 h-3 text-muted-foreground mb-0.5" />
                      <span className={`font-semibold ${meta.isFree ? "text-green-700" : ""}`}>
                        {meta.isFree ? "Free" : meta.inputCost}
                      </span>
                      <span className="text-[9px] text-muted-foreground leading-none">
                        {meta.isFree ? "model" : "/1M in"}
                      </span>
                    </div>
                  </div>

                  {/* In/Out cost detail for paid models */}
                  {!meta.isFree && meta.inputCost !== "—" && (
                    <div className="text-[10px] text-muted-foreground flex gap-3">
                      <span>Input: <strong>{meta.inputCost}</strong>/1M tokens</span>
                      <span>Output: <strong>{meta.outputCost}</strong>/1M tokens</span>
                    </div>
                  )}

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1">
                    {agent.skills?.slice(0, 4).map((skill: string) => (
                      <span key={skill} className="text-[10px] px-1.5 py-0.5 bg-muted rounded border">
                        {skill}
                      </span>
                    ))}
                    {agent.skills?.length > 4 && (
                      <span className="text-[10px] px-1.5 py-0.5 text-muted-foreground">+{agent.skills.length - 4}</span>
                    )}
                  </div>

                  {/* Rate / Budget */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-2.5 rounded-lg">
                    <div>
                      <span className="block text-muted-foreground uppercase tracking-wider text-[9px]">Rate</span>
                      <span className="font-semibold">${agent.hourlyRate}/task</span>
                    </div>
                    <div>
                      <span className="block text-muted-foreground uppercase tracking-wider text-[9px]">Max Budget</span>
                      <span className="font-semibold">${agent.maxBudget}</span>
                    </div>
                  </div>

                  {/* On-chain + wallet */}
                  <div className="flex items-center justify-between">
                    {agent.registeredOnChain ? (
                      <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> on-chain
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">off-chain</span>
                    )}
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {agent.walletAddress?.slice(0, 10)}…
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
