"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Star, CheckCircle2, Zap, Terminal, Send, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

// MCP domain config for UI hints
const MCP_HINTS: Record<string, { label: string; placeholder: string; description: string }> = {
  web_search: {
    label: "Search Query",
    placeholder: "e.g. latest Monad testnet updates",
    description: "Executes a live Brave Search and returns real web results.",
  },
  filesystem: {
    label: "File Path",
    placeholder: "e.g. agentmesh/src/lib/worker.ts  or  README.md",
    description: "Reads any file in the monad-maestro repo. Paths are relative to the repo root (D:\\monad-maestro).",
  },
  github: {
    label: "Repository Query",
    placeholder: "e.g. monad-developers",
    description: "Searches GitHub repositories matching your query.",
  },
  crypto_monad: {
    label: "Wallet Address",
    placeholder: "e.g. 0xAbCd...1234",
    description: "Fetches the MON token balance for any Monad testnet address.",
  },
};

const DOMAIN_COLORS: Record<string, string> = {
  research: "from-blue-500 to-blue-700",
  coding: "from-green-500 to-green-700",
  design: "from-pink-500 to-pink-700",
  writing: "from-yellow-500 to-yellow-700",
  testing: "from-orange-500 to-orange-700",
  data: "from-purple-500 to-purple-700",
  crypto_monad: "from-violet-500 to-violet-700",
  github: "from-gray-600 to-gray-800",
  filesystem: "from-teal-500 to-teal-700",
  web_search: "from-cyan-500 to-cyan-700",
};

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [agent, setAgent] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tools, setTools] = useState<any[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>("");
  const [toolArgs, setToolArgs] = useState<string>("{}");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch Agent details
    fetch("/api/agents")
      .then((r) => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((agents: any[]) => {
        const foundAgent = agents.find((a) => a.id === id);
        if (foundAgent) {
          setAgent(foundAgent);
          // If the agent is MCP-backed (has one of our markers), fetch tools
          if (foundAgent.id in MCP_HINTS || foundAgent.id.includes("mcp") || foundAgent.domain.includes("crypto") || foundAgent.domain.includes("search")) {
            fetch(`/api/agents/${id}/tools`)
              .then((res) => res.json())
              .then((data) => {
                if (data.tools) setTools(data.tools);
              })
              .catch((err) => console.error("Failed to fetch tools:", err));
          }
        }
      });
  }, [id]);

  // Update JSON template when tool changes
  useEffect(() => {
    if (selectedTool) {
      const tool = tools.find((t) => t.name === selectedTool);
      if (tool && tool.inputSchema) {
        const template: Record<string, any> = {};
        if (tool.inputSchema.properties) {
          Object.keys(tool.inputSchema.properties).forEach((key) => {
            template[key] = "";
          });
        }
        setToolArgs(JSON.stringify(template, null, 2));
      }
    }
  }, [selectedTool, tools]);

  async function runAgent() {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      let body: any = {};
      if (selectedTool) {
        try {
          const parsedArgs = JSON.parse(toolArgs);
          body = { toolName: selectedTool, args: parsedArgs };
        } catch (e) {
          throw new Error("Invalid JSON in tool arguments");
        }
      } else {
        if (!prompt.trim()) throw new Error("Task prompt is required");
        body = { prompt };
      }

      const res = await fetch(`/api/agents/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  if (!agent) {
    return (
      <div className="relative min-h-screen bg-[#030303] text-white flex items-center justify-center">
        <div className="text-white/40 font-mono text-sm animate-pulse">Loading agent…</div>
      </div>
    );
  }

  const isMcp = id in MCP_HINTS || tools.length > 0;
  const hint = MCP_HINTS[id ?? ""] ?? null;
  const gradientClass = DOMAIN_COLORS[agent.domain] ?? "from-gray-500 to-gray-700";

  return (
    <div className="relative min-h-screen bg-[#030303] text-white">
      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 flex">
          <div className="flex-1" />
          <div className="flex-1 border-l border-white/[0.035]" />
          <div className="flex-1 border-l border-white/[0.035]" />
          <div className="flex-1 border-l border-white/[0.035]" />
        </div>
      </div>
      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-24 space-y-6 pb-12">
      {/* Back */}
      <Link
        href="/agents"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Agents
      </Link>

      {/* Header Card */}
      <div className={`rounded-2xl bg-gradient-to-br ${gradientClass} p-6 text-white shadow-lg`}>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-widest opacity-75">
                {agent.domain.replace("_", " ")}
              </span>
              {isMcp && (
                <span className="text-xs px-2 py-0.5 bg-white/20 rounded-full font-semibold">
                  MCP ⚡
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold">{agent.name}</h1>
            <p className="text-white/80 mt-1 text-sm max-w-lg">{agent.description}</p>
          </div>
          <div className="flex items-center gap-1 bg-white/20 px-3 py-1.5 rounded-full">
            <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
            <span className="font-bold">{agent.reputationScore.toFixed(1)}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex gap-6 mt-5 text-sm">
          <div>
            <p className="opacity-60 text-xs uppercase tracking-wider">Rate</p>
            <p className="font-semibold">${agent.hourlyRate}/task</p>
          </div>
          <div>
            <p className="opacity-60 text-xs uppercase tracking-wider">Max Budget</p>
            <p className="font-semibold">${agent.maxBudget}</p>
          </div>
          <div>
            <p className="opacity-60 text-xs uppercase tracking-wider">Status</p>
            <p className="font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Active
            </p>
          </div>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-2 mt-4">
          {agent.skills?.map((s: string) => (
            <span key={s} className="text-xs px-2 py-1 bg-white/15 rounded-full">
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* MCP Description */}
      {isMcp && hint && (
        <div className="flex items-start gap-3 p-4 rounded-xl border bg-violet-50 border-violet-200">
          <Zap className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-violet-800">Live MCP Integration</p>
            <p className="text-sm text-violet-700 mt-0.5">{hint.description}</p>
          </div>
        </div>
      )}

      {/* Run Panel */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        {/* Tool Selection for MCP Agents */}
        {tools.length > 0 && (
          <div className="space-y-2">
            <label htmlFor="tool-select" className="flex items-center gap-2 text-sm font-semibold">
              <Zap className="w-4 h-4 text-violet-600" /> Select MCP Tool
            </label>
            <select
              id="tool-select"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={selectedTool}
              onChange={(e) => setSelectedTool(e.target.value)}
            >
              <option value="">-- Use Task Prompt (Standard LLM Mode) --</option>
              {tools.map((tool) => (
                <option key={tool.name} value={tool.name}>
                  {tool.name}
                </option>
              ))}
            </select>
            {selectedTool && (
              <p className="text-xs text-muted-foreground italic">
                {tools.find((t) => t.name === selectedTool)?.description}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">
            {selectedTool ? "Structured Arguments (JSON)" : (isMcp && hint ? hint.label : "Task Prompt")}
          </h2>
        </div>

        {selectedTool ? (
          <textarea
            id="tool-args-input"
            className="w-full min-h-[150px] rounded-lg border bg-slate-900 text-slate-100 font-mono text-xs px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            value={toolArgs}
            onChange={(e) => setToolArgs(e.target.value)}
          />
        ) : (
          <textarea
            id="agent-prompt-input"
            className="w-full min-h-[100px] rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            placeholder={hint?.placeholder ?? "Describe the task for this agent…"}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runAgent();
            }}
          />
        )}

        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">Ctrl+Enter to run</p>
          <button
            id="run-agent-btn"
            onClick={runAgent}
            disabled={loading || !prompt.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Running…</>
            ) : (
              <><Send className="w-4 h-4" /> Run Agent</>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="rounded-xl border bg-card p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" /> Result
            </h2>
            <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${
              result.mode === "mcp"
                ? "bg-violet-100 text-violet-700 border border-violet-200"
                : result.mode === "llm_fallback"
                ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                : "bg-green-100 text-green-700 border border-green-200"
            }`}>
              {result.mode === "mcp" ? "⚡ MCP Live" : result.mode === "llm_fallback" ? "⚠ LLM Fallback" : "🤖 LLM"}
            </span>
          </div>

          <div className="space-y-3">
            {result.mode === "mcp" ? (
              <div className="space-y-4">
                {result.result?.content?.map((item: any, idx: number) => (
                  <div key={idx} className="bg-slate-950 rounded-lg p-4 overflow-auto border border-slate-800">
                    {item.type === "text" ? (
                      <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {(() => {
                          try {
                            // Try to parse nested JSON for pretty-printing
                            const parsed = JSON.parse(item.text);
                            return JSON.stringify(parsed, null, 2);
                          } catch (e) {
                            return item.text;
                          }
                        })()}
                      </pre>
                    ) : (
                      <pre className="text-xs font-mono text-slate-300">
                        {JSON.stringify(item, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-foreground bg-muted/30 rounded-lg p-4 whitespace-pre-wrap leading-relaxed border italic">
                  {result.result?.output}
                </div>
                {result.result?.proof && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 px-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    <span className="font-medium">Proof:</span> {result.result.proof}
                  </div>
                )}
                {result.mcpError && (
                  <div className="text-xs text-yellow-600 bg-yellow-50 rounded-lg p-3 border border-yellow-200 mt-2">
                    <span className="font-bold">MCP Check Failed:</span> {result.mcpError}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
