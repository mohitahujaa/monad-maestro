"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Loader2, Send, ChevronDown, ChevronUp, Shield, Bot, CheckCircle2 } from "lucide-react";

const EXAMPLE_PROMPTS = [
  "What is the latest news about Monad blockchain?",
  "Write a TypeScript function to debounce an API call",
  "Search GitHub for monad-developers repositories",
  "What is the MON balance for 0x000...0001?",
  "Read the file agentmesh/src/lib/worker.ts",
  "Analyze the architecture of a decentralized exchange",
];

const MODE_LABELS: Record<string, { label: string; color: string }> = {
  mcp:          { label: "⚡ MCP Live",     color: "bg-violet-100 text-violet-700 border-violet-200" },
  llm_fallback: { label: "⚠ LLM Fallback", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  llm:          { label: "🤖 LLM",          color: "bg-green-100 text-green-700 border-green-200" },
};

export default function OrchestratePage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCandidates, setShowCandidates] = useState(false);

  async function run() {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setShowCandidates(false);
    try {
      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Orchestration failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const modeStyle = result ? (MODE_LABELS[result.mode] ?? MODE_LABELS.llm) : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/agents"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Agents
        </Link>
      </div>

      <div className="space-y-1">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-violet-500" /> Orchestrator
        </h1>
        <p className="text-muted-foreground text-sm">
          Describe any task. The orchestrator classifies it, selects the highest-reputation agent, and executes.
        </p>
      </div>

      {/* Prompt input */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <textarea
          id="orchestrator-prompt"
          className="w-full min-h-[120px] rounded-lg border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          placeholder="Ask anything… e.g. 'Search for the latest Monad docs on GitHub'"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run(); }}
        />

        {/* Example prompts */}
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((ex) => (
            <button
              key={ex}
              onClick={() => setPrompt(ex)}
              className="text-xs px-2.5 py-1 rounded-full border bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground truncate max-w-[200px]"
            >
              {ex}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">Ctrl+Enter to run</p>
          <button
            id="orchestrate-btn"
            onClick={run}
            disabled={loading || !prompt.trim()}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Orchestrating…</> : <><Send className="w-4 h-4" /> Run</>}
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
        <div className="space-y-4">
          {/* Agent selected card */}
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Bot className="w-4 h-4 text-violet-500" /> Agent Selected
              </h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${modeStyle?.color}`}>
                {modeStyle?.label}
              </span>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-lg bg-violet-50 border border-violet-100">
              <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {result.selectedAgent.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{result.selectedAgent.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {result.selectedAgent.domain.replace("_", " ")} · {result.selectedAgent.provider} / {result.selectedAgent.model}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-violet-700">{result.selectedAgent.reputationScore.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">rep score</p>
              </div>
            </div>

            {/* Classification */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
              <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0 text-violet-500" />
              <span>
                <strong>Domain:</strong> {result.classification.domain} ({Math.round(result.classification.confidence * 100)}% confidence)
                {" · "}{result.classification.reasoning}
              </span>
            </div>

            {/* Show other candidates */}
            {result.allCandidates.length > 1 && (
              <div>
                <button
                  onClick={() => setShowCandidates(!showCandidates)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  {showCandidates ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {showCandidates ? "Hide" : "Show"} {result.allCandidates.length} candidates
                </button>
                {showCandidates && (
                  <div className="mt-2 space-y-1">
                    {result.allCandidates.map((c: any) => (
                      <div key={c.id} className={`flex justify-between items-center text-xs px-3 py-1.5 rounded ${c.id === result.selectedAgent.id ? "bg-violet-100 font-medium" : "bg-muted/30"}`}>
                        <span>{c.name}</span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          {c.id === result.selectedAgent.id && <CheckCircle2 className="w-3 h-3 text-violet-600" />}
                          {c.reputationScore.toFixed(1)} rep · {c.why}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Output */}
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <h2 className="font-semibold text-sm">Output</h2>
            {result.mode === "mcp" ? (
              <div className="space-y-2">
                {result.result?.content?.map((item: any, i: number) => (
                  <div key={i} className="bg-slate-950 rounded-lg p-4 overflow-auto border border-slate-800">
                    <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {(() => { try { return JSON.stringify(JSON.parse(item.text), null, 2); } catch { return item.text; } })()}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm bg-muted/30 rounded-lg p-4 whitespace-pre-wrap leading-relaxed border italic">
                  {result.result?.output}
                </div>
                {result.result?.proof && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    <span className="font-medium">Proof:</span> {result.result.proof}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
