"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { WalletConnect, WalletGate } from "@/components/WalletConnect";
import {
  orchestratePlan,
  simulateExecution,
  MODEL_INFO,
  type OrchestrationPlan,
  type SubtaskPlan,
  type ScoredOption,
  type ExecutionState,
  type ModelId,
} from "@/lib/orchestrator/frontendMock";
import { useTaskEscrow, useMonBalance } from "@/hooks/useChainTx";
import {
  Brain, ChevronRight, Zap, DollarSign, BarChart3,
  CheckCircle2, Clock, AlertCircle, Download, Loader2,
  ArrowRight, Shield, Sparkles, TrendingUp, Info,
  ExternalLink,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step =
  | "input"
  | "orchestrating"
  | "team"
  | "dag"
  | "escrow"
  | "executing"
  | "done";

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewTaskPage() {
  const { address } = useAccount();
  const router = useRouter();

  // Form state
  const [prompt, setPrompt] = useState("");
  const [budget, setBudget] = useState<number>(0.1);

  // Orchestration state
  const [step, setStep] = useState<Step>("input");
  const [plan, setPlan] = useState<OrchestrationPlan | null>(null);

  // Real backend task ID (created during orchestration)
  const [realTaskId, setRealTaskId] = useState<string | null>(null);

  // Per-subtask overrides (user can swap agents)
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  // Execution state (fallback if no backend task)
  const [execStates, setExecStates] = useState<ExecutionState[]>([]);
  const stopExecRef = useRef<(() => void) | null>(null);
  const [taskId] = useState(() => `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);

  // Real on-chain escrow hooks
  const escrow = useTaskEscrow();
  const { balance } = useMonBalance(address as `0x${string}` | undefined);

  // When escrow confirms → save hash, approve, execute, redirect to real task detail
  useEffect(() => {
    if (escrow.isDone && escrow.step === "done" && step === "escrow" && plan) {
      if (realTaskId) {
        (async () => {
          try {
            // Save escrow tx hash on backend task
            if (escrow.hash) {
              await fetch(`/api/tasks/${realTaskId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ escrowTxHash: escrow.hash }),
              });
            }
            // Approve plan
            await fetch(`/api/tasks/${realTaskId}/approve`, { method: "POST" });
            // Fire execution (non-blocking)
            fetch(`/api/tasks/${realTaskId}/execute`, { method: "POST" }).catch(console.error);
            // Redirect to live task detail page
            router.push(`/tasks/${realTaskId}`);
          } catch (err) {
            console.error("[escrow→execute]", err);
            // Fallback to simulation
            setStep("executing");
            const stop = simulateExecution(plan.subtasks, plan.dagLevels, (states) => {
              setExecStates(states);
              if (states.every((s) => s.status === "completed" || s.status === "failed")) {
                setTimeout(() => setStep("done"), 800);
              }
            });
            stopExecRef.current = stop;
          }
        })();
      } else {
        // No backend task — fall back to frontend simulation
        setStep("executing");
        const stop = simulateExecution(plan.subtasks, plan.dagLevels, (states) => {
          setExecStates(states);
          if (states.every((s) => s.status === "completed" || s.status === "failed")) {
            setTimeout(() => setStep("done"), 800);
          }
        });
        stopExecRef.current = stop;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escrow.isDone]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || budget <= 0) return;
    setStep("orchestrating");

    // Create real backend task (LLM planning runs server-side)
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: prompt.length > 80 ? prompt.slice(0, 80) + "…" : prompt,
          description: prompt,
          totalBudget: budget,
        }),
      });
      if (res.ok) {
        const backendTask = await res.json();
        setRealTaskId(backendTask.id);
      }
    } catch (e) {
      console.warn("[handleGenerate] Backend task creation failed, will fall back to simulation", e);
    }

    // Mock plan for wizard UI display
    const p = orchestratePlan(prompt, budget);
    setPlan(p);
    setOverrides({});
    setStep("team");
  }, [prompt, budget]);

  const handleOverride = (subtaskId: string, agentId: string) => {
    setOverrides((prev) => ({ ...prev, [subtaskId]: agentId }));
  };

  const getEffectiveOption = (st: SubtaskPlan): ScoredOption => {
    const overrideId = overrides[st.id];
    if (overrideId) {
      return st.options.find((o) => o.agent.id === overrideId) ?? st.selectedOption;
    }
    return st.selectedOption;
  };

  const effectiveCost = plan
    ? plan.subtasks.reduce((s, st) => s + getEffectiveOption(st).agent.costPerTask, 0)
    : 0;

  const handleEscrow = () => {
    setStep("escrow");
    // Use realTaskId from backend if available, otherwise use client-generated id
    escrow.lockFunds(realTaskId ?? taskId, effectiveCost);
  };

  const handleDownloadPDF = () => {
    if (!plan) return;
    generatePDF(prompt, budget, plan, execStates, escrow.hash ?? null, address ?? "");
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Deploy AI Team</h1>
            <p className="text-white/40 text-sm">
              Describe your task → set budget → let AgentMesh build the optimal team
            </p>
          </div>
          <WalletConnect size="md" />
        </div>

        {/* Step progress */}
        <StepProgress current={step} />

        <WalletGate message="Connect wallet to deploy an AI task">
          <div className="mt-8 space-y-6">

            {/* MON balance display */}
            {address && step === "input" && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-xs text-white/40">
                <Shield className="w-3.5 h-3.5" />
                <span>Wallet balance: <span className="text-white/70 font-mono">{balance} MON</span></span>
                <span className="text-white/20">·</span>
                <span>Budget will be sent as native MON to escrow</span>
              </div>
            )}

            {/* ── STEP: INPUT ─────────────────────────────────────────── */}
            {step === "input" && (
              <InputStep
                prompt={prompt}
                budget={budget}
                onPromptChange={setPrompt}
                onBudgetChange={setBudget}
                onGenerate={handleGenerate}
              />
            )}

            {/* ── STEP: ORCHESTRATING ────────────────────────────────── */}
            {step === "orchestrating" && (
              <OrchestrationLoader prompt={prompt} budget={budget} />
            )}

            {/* ── STEP: TEAM ─────────────────────────────────────────── */}
            {(step === "team" || step === "dag") && plan && (
              <>
                <TeamSummaryBar
                  plan={plan}
                  budget={budget}
                  effectiveCost={effectiveCost}
                />

                <div className="grid grid-cols-1 gap-4">
                  {plan.subtasks.map((st) => (
                    <SubtaskComparisonCard
                      key={st.id}
                      subtask={st}
                      effectiveOption={getEffectiveOption(st)}
                      onOverride={(agentId) => handleOverride(st.id, agentId)}
                    />
                  ))}
                </div>

                {step === "dag" && (
                  <DAGView subtasks={plan.subtasks} dagLevels={plan.dagLevels} />
                )}

                <div className="flex gap-3 pt-2">
                  {step === "team" && (
                    <button
                      onClick={() => setStep("dag")}
                      className={secondaryBtn}
                    >
                      <BarChart3 className="w-4 h-4" />
                      View Task Graph
                    </button>
                  )}
                  <button
                    onClick={handleEscrow}
                    className={primaryBtn}
                  >
                    <Shield className="w-4 h-4" />
                    Approve & Lock {effectiveCost} MON in Escrow
                  </button>
                </div>
              </>
            )}

            {/* ── STEP: ESCROW ────────────────────────────────────────── */}
            {step === "escrow" && (
              <EscrowLoader
                budget={effectiveCost}
                escrowStep={escrow.step}
                approveHash={null}
                escrowHash={escrow.hash ?? null}
                errorMsg={escrow.errorMsg}
                onRetry={() => { escrow.reset(); setStep("team"); }}
              />
            )}

            {/* ── STEP: EXECUTING ─────────────────────────────────────── */}
            {step === "executing" && plan && (
              <ExecutionView
                plan={plan}
                execStates={execStates}
                effectiveCostFn={getEffectiveOption}
                escrowTx={escrow.hash ?? null}
              />
            )}

            {/* ── STEP: DONE ──────────────────────────────────────────── */}
            {step === "done" && plan && (
              <FinalOutputView
                plan={plan}
                execStates={execStates}
                prompt={prompt}
                budget={budget}
                effectiveCost={effectiveCost}
                escrowTx={escrow.hash ?? null}
                onDownload={handleDownloadPDF}
                onReset={() => {
                  setStep("input");
                  setPlan(null);
                  setPrompt("");
                  setBudget(0.1);
                  setExecStates([]);
                  escrow.reset();
                }}
              />
            )}
          </div>
        </WalletGate>
      </div>
    </div>
  );
}

// ─── Step Progress ─────────────────────────────────────────────────────────────

const STEPS: Array<{ id: Step; label: string }> = [
  { id: "input", label: "Task Input" },
  { id: "team", label: "Agent Team" },
  { id: "dag", label: "Task Graph" },
  { id: "escrow", label: "Escrow" },
  { id: "executing", label: "Execution" },
  { id: "done", label: "Output" },
];

function StepProgress({ current }: { current: Step }) {
  const order = ["input", "orchestrating", "team", "dag", "escrow", "executing", "done"];
  const currentIdx = order.indexOf(current);
  const displaySteps = STEPS;
  return (
    <div className="flex items-center gap-1">
      {displaySteps.map((s, i) => {
        const sIdx = order.indexOf(s.id);
        const done = sIdx < currentIdx;
        const active = sIdx === currentIdx || (s.id === "team" && current === "orchestrating");
        return (
          <div key={s.id} className="flex items-center gap-1">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono transition-all ${
                done
                  ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                  : active
                  ? "bg-[#a855f7]/15 border border-[#a855f7]/40 text-[#c084fc]"
                  : "bg-white/[0.03] border border-white/[0.08] text-white/20"
              }`}
            >
              {done && <CheckCircle2 className="w-3 h-3" />}
              {s.label}
            </div>
            {i < displaySteps.length - 1 && (
              <ChevronRight className="w-3 h-3 text-white/10" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Input Step ────────────────────────────────────────────────────────────────

function InputStep({
  prompt, budget, onPromptChange, onBudgetChange, onGenerate,
}: {
  prompt: string;
  budget: number;
  onPromptChange: (v: string) => void;
  onBudgetChange: (v: number) => void;
  onGenerate: () => void;
}) {
  const examples = [
    "Build a landing page with marketing copy, UI design, and React frontend",
    "Create a data analytics dashboard with Python backend and visualization",
    "Write SEO blog content and design matching social media assets",
  ];

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-5">
        {/* Prompt */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            What do you want to build?
            <span className="text-[#a855f7] ml-1">*</span>
          </label>
          <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Describe your task in plain English…"
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-[#a855f7]/50 focus:bg-white/[0.05] transition-all resize-none"
          />
          {/* Examples */}
          <div className="mt-2.5 space-y-1">
            <p className="text-[10px] text-white/25 uppercase tracking-widest">Try an example:</p>
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => onPromptChange(ex)}
                className="block w-full text-left text-xs text-white/30 hover:text-white/60 transition-colors py-0.5"
              >
                → {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Budget (MON)
            <span className="text-[#a855f7] ml-1">*</span>
            <span className="text-white/30 text-xs font-normal ml-2">
              — drives agent & model selection
            </span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0.001}
              max={100}
              step={0.001}
              value={budget}
              onChange={(e) => onBudgetChange(Number(e.target.value))}
              className="w-36 px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-[#a855f7]/50 transition-all"
            />
            <span className="text-white/30 text-sm">MON</span>
            <div className="flex gap-2 ml-2">
              {[0.05, 0.1, 0.2, 0.5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onBudgetChange(v)}
                  className={`px-2.5 py-1 rounded-lg text-xs border transition-all ${
                    budget === v
                      ? "border-[#a855f7]/50 bg-[#a855f7]/10 text-[#c084fc]"
                      : "border-white/[0.08] text-white/30 hover:text-white/50 hover:border-white/20"
                  }`}
                >
                  {v} MON
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-white/25 mt-1.5">
            Higher MON budget → GPT-4 agents preferred. Lower → Claude/Llama selected.
          </p>
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={!prompt.trim() || budget <= 0}
        className={`${primaryBtn} w-full text-base py-4`}
      >
        <Brain className="w-5 h-5" />
        Generate Optimal Agent Team
        <ArrowRight className="w-4 h-4 ml-auto" />
      </button>
    </div>
  );
}

// ─── Orchestration Loader ────────────────────────────────────────────────────

function OrchestrationLoader({ prompt, budget }: { prompt: string; budget: number }) {
  const steps = [
    "Parsing task into subtasks…",
    "Fetching agents from Monad blockchain…",
    "Scoring agents: reputation × 0.6 + success_rate × 0.25 + domain_match × 0.15",
    "Optimizing team within $" + budget + " budget…",
    "Building dependency graph…",
  ];
  const [visibleCount] = useState(steps.length); // show all with stagger via CSS

  return (
    <div className="p-8 rounded-2xl border border-[#a855f7]/20 bg-[#a855f7]/[0.04]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#a855f7]/15 flex items-center justify-center">
          <Brain className="w-5 h-5 text-[#a855f7] animate-pulse" />
        </div>
        <div>
          <p className="font-semibold text-white">Orchestral Agent Working…</p>
          <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{prompt}</p>
        </div>
      </div>

      <div className="space-y-3">
        {steps.slice(0, visibleCount).map((s, i) => (
          <div
            key={i}
            className="flex items-center gap-3 text-sm"
            style={{ animationDelay: `${i * 0.3}s`, animation: "fadeIn 0.4s ease forwards" }}
          >
            <Loader2 className="w-3.5 h-3.5 text-[#a855f7] animate-spin flex-shrink-0" />
            <span className="text-white/60">{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Team Summary Bar ─────────────────────────────────────────────────────────

function TeamSummaryBar({
  plan, budget, effectiveCost,
}: {
  plan: OrchestrationPlan;
  budget: number;
  effectiveCost: number;
}) {
  const utilization = Math.min(Math.round((effectiveCost / budget) * 100), 100);
  const savings = Math.max(budget - effectiveCost, 0);

  return (
    <div className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#a855f7]" />
            Optimal Team Selected
          </h3>
          <p className="text-xs text-white/40 mt-0.5">{plan.summary}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/30 uppercase tracking-widest">Total Cost</p>
          <p className="text-2xl font-bold text-white">${effectiveCost} <span className="text-xs text-white/30 font-normal">MON</span></p>
          {savings > 0 && (
            <p className="text-[10px] text-emerald-400">saving ${savings} MON</p>
          )}
        </div>
      </div>

      {/* Budget utilization */}
      <div>
        <div className="flex justify-between text-xs text-white/40 mb-1.5">
          <span>Budget Utilization</span>
          <span className="font-semibold text-white/70">{utilization}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              utilization > 90
                ? "bg-gradient-to-r from-amber-500 to-red-500"
                : "bg-gradient-to-r from-[#a855f7] to-[#0ea5e9]"
            }`}
            style={{ width: `${utilization}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-white/25 mt-1">
          <span>$0</span>
          <span>${budget} budget</span>
        </div>
      </div>
    </div>
  );
}

// ─── Subtask Comparison Card ──────────────────────────────────────────────────

function SubtaskComparisonCard({
  subtask, effectiveOption, onOverride,
}: {
  subtask: SubtaskPlan;
  effectiveOption: ScoredOption;
  onOverride: (agentId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.06]">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                {subtask.domain}
              </span>
              <span className="text-white/20">·</span>
              <span className="text-[10px] text-white/30">{subtask.estimatedDuration}</span>
              {subtask.dependencies.length > 0 && (
                <>
                  <span className="text-white/20">·</span>
                  <span className="text-[10px] text-white/25">
                    depends on {subtask.dependencies.length} task{subtask.dependencies.length > 1 ? "s" : ""}
                  </span>
                </>
              )}
            </div>
            <h4 className="font-semibold text-white text-sm">{subtask.title}</h4>
            <p className="text-xs text-white/40 mt-0.5">{subtask.description}</p>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <p className="text-[10px] text-white/30">Budget allocation</p>
            <p className="text-sm font-semibold text-white/70">${subtask.budgetAllocation}</p>
          </div>
        </div>
      </div>

      {/* Selected agent */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-mono">
            Selected Agent
          </span>
        </div>

        <AgentOptionRow option={effectiveOption} isSelected highlighted />

        {/* Why selected */}
        <div className="mt-2 flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/[0.15]">
          <Info className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-300/70">{effectiveOption.selectionReason}</p>
        </div>

        {/* Alternatives */}
        {subtask.options.length > 1 && (
          <div className="mt-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[10px] text-white/30 hover:text-white/50 transition-colors font-mono uppercase tracking-widest flex items-center gap-1"
            >
              {expanded ? "Hide" : "Show"} {subtask.options.length - 1} alternative{subtask.options.length > 2 ? "s" : ""}
              <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
            </button>

            {expanded && (
              <div className="mt-2 space-y-2 pt-2 border-t border-white/[0.06]">
                <p className="text-[10px] text-white/25 uppercase tracking-widest">Compare & Override</p>
                {subtask.options
                  .filter((o) => o.agent.id !== effectiveOption.agent.id)
                  .map((option) => (
                    <div key={option.agent.id} className="relative">
                      <AgentOptionRow option={option} isSelected={false} highlighted={false} />
                      {/* Why not selected */}
                      <div className="mt-1 flex items-start gap-2 px-2 py-1.5 rounded bg-white/[0.02] border border-white/[0.05]">
                        <AlertCircle className="w-3 h-3 text-white/25 flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] text-white/30">{option.selectionReason}</p>
                      </div>
                      <button
                        onClick={() => onOverride(option.agent.id)}
                        className="mt-1.5 text-[10px] text-[#a855f7]/60 hover:text-[#a855f7] transition-colors font-mono"
                      >
                        → Use this agent instead
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AgentOptionRow({
  option, isSelected, highlighted,
}: {
  option: ScoredOption;
  isSelected: boolean;
  highlighted: boolean;
}) {
  const model = MODEL_INFO[option.agent.model as ModelId];
  const scorePercent = Math.round(option.score * 100);

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
        highlighted
          ? "border-emerald-500/25 bg-emerald-500/[0.06]"
          : "border-white/[0.06] bg-white/[0.02]"
      }`}
    >
      {/* Agent info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-white">{option.agent.name}</span>
          {model && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-mono"
              style={{ background: model.color + "15", color: model.color, border: `1px solid ${model.color}25` }}
            >
              {model.label}
            </span>
          )}
          {!option.isWithinBudget && (
            <span className="text-[10px] text-red-400 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20">
              Over budget
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[10px] text-white/30">
            Rep: {option.agent.reputation}/100
          </span>
          <span className="text-[10px] text-white/30">
            Success: {Math.round(option.agent.successRate * 100)}%
          </span>
          <span className="text-[10px] text-white/30">
            {option.agent.taskCount} tasks
          </span>
        </div>
      </div>

      {/* Score */}
      <div className="flex-shrink-0 text-right">
        <div className="flex items-center gap-1.5 justify-end mb-1">
          <div className="w-16 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#a855f7] to-[#0ea5e9]"
              style={{ width: `${scorePercent}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-white/50">{scorePercent}</span>
        </div>
        <span className="text-sm font-bold text-white">${option.agent.costPerTask}</span>
        <span className="text-[10px] text-white/30 ml-1">MON</span>
      </div>
    </div>
  );
}

// ─── DAG View ─────────────────────────────────────────────────────────────────

function DAGView({
  subtasks, dagLevels,
}: {
  subtasks: SubtaskPlan[];
  dagLevels: string[][];
}) {
  const stMap = Object.fromEntries(subtasks.map((st) => [st.id, st]));
  const domainColors: Record<string, string> = {
    research: "#3b82f6",
    writing: "#f59e0b",
    design: "#ec4899",
    coding: "#10b981",
    testing: "#f97316",
    data: "#a855f7",
  };

  return (
    <div className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 className="w-4 h-4 text-[#a855f7]" />
        <h3 className="font-semibold text-white text-sm">Task Dependency Graph (DAG)</h3>
      </div>

      <div className="flex items-start gap-4 overflow-x-auto pb-2">
        {dagLevels.map((level, levelIdx) => (
          <div key={levelIdx} className="flex flex-col gap-3 min-w-[180px]">
            <p className="text-[9px] font-mono text-white/25 uppercase tracking-widest text-center">
              Level {levelIdx + 1}
            </p>
            {level.map((stId) => {
              const st = stMap[stId];
              if (!st) return null;
              const color = domainColors[st.domain] ?? "#6b7280";
              return (
                <div
                  key={stId}
                  className="p-3 rounded-xl border text-center"
                  style={{
                    borderColor: color + "40",
                    background: color + "08",
                  }}
                >
                  <p className="text-xs font-medium text-white/80">{st.title}</p>
                  <p className="text-[10px] mt-1" style={{ color: color + "cc" }}>
                    {st.selectedOption.agent.name}
                  </p>
                  <p className="text-[9px] text-white/25 mt-0.5">
                    ${st.selectedOption.agent.costPerTask} MON
                  </p>
                </div>
              );
            })}
          </div>
        ))}

        {/* Arrows between levels */}
        {dagLevels.length > 1 && (
          <div className="absolute pointer-events-none" aria-hidden />
        )}
      </div>

      {/* Edge legend */}
      <div className="mt-4 pt-3 border-t border-white/[0.06]">
        <div className="flex flex-wrap gap-3">
          {Object.entries(domainColors).map(([domain, color]) => {
            if (!subtasks.some((s) => s.domain === domain)) return null;
            return (
              <div key={domain} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                <span className="text-[10px] text-white/30 capitalize">{domain}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Escrow Loader ────────────────────────────────────────────────────────────

import type { EscrowStep } from "@/hooks/useChainTx";

function EscrowLoader({
  budget, escrowStep, escrowHash, errorMsg, onRetry,
}: {
  budget: number;
  escrowStep: EscrowStep;
  approveHash: string | null;
  escrowHash: string | null;
  errorMsg: string | null;
  onRetry: () => void;
}) {
  if (escrowStep === "error") {
    return (
      <div className="p-6 rounded-2xl border border-red-500/25 bg-red-500/[0.05]">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-red-400" />
          <h3 className="font-semibold text-white">Transaction Failed</h3>
        </div>
        <p className="text-red-300/70 text-sm mb-4">{errorMsg}</p>
        <button onClick={onRetry}
          className="px-4 py-2 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-colors text-sm">
          ← Go Back and Retry
        </button>
      </div>
    );
  }

  const isDone = escrowStep === "done";
  const isConfirming = escrowStep === "confirming";
  const isWaiting = escrowStep === "waiting_wallet";
  const isSwitching = escrowStep === "switching_network";

  return (
    <div className="p-6 rounded-2xl border border-[#0ea5e9]/20 bg-[#0ea5e9]/[0.04] space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-[#0ea5e9]/15 flex items-center justify-center">
          {isDone
            ? <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            : <Shield className="w-6 h-6 text-[#0ea5e9] animate-pulse" />}
        </div>
        <div>
          <h3 className="font-semibold text-white">
            {isDone ? "Funds Locked in Escrow!" : "Locking MON in Escrow"}
          </h3>
          <p className="text-white/40 text-xs mt-0.5">
            TaskEscrow.createTask() — native MON · single signature
          </p>
        </div>
      </div>

      <div className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
        isDone ? "border-emerald-500/25 bg-emerald-500/[0.05]"
        : isConfirming ? "border-[#0ea5e9]/30 bg-[#0ea5e9]/[0.05]"
        : "border-amber-500/25 bg-amber-500/[0.05]"
      }`}>
        <div className="mt-0.5">
          {isDone
            ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            : isConfirming
            ? <Loader2 className="w-4 h-4 text-[#0ea5e9] animate-spin" />
            : <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white/80">
            {isDone
              ? `${budget} MON locked successfully`
              : isConfirming
              ? `Confirming on Monad Testnet…`
              : isSwitching
              ? `Switching network to Monad Testnet…`
              : `Waiting for MetaMask — check your browser extension`}
          </p>
          {escrowHash && (
            <a href={`https://testnet.monadexplorer.com/tx/${escrowHash}`}
              target="_blank" rel="noreferrer"
              className="mt-1.5 flex items-center gap-1 text-[10px] font-mono text-[#0ea5e9]/70 hover:text-[#0ea5e9] transition-colors">
              <ExternalLink className="w-3 h-3" />
              {escrowHash.slice(0, 30)}… ↗ Monad Explorer
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Execution View ───────────────────────────────────────────────────────────

function ExecutionView({
  plan, execStates, effectiveCostFn, escrowTx,
}: {
  plan: OrchestrationPlan;
  execStates: ExecutionState[];
  effectiveCostFn: (st: SubtaskPlan) => ScoredOption;
  escrowTx: string | null;
}) {
  const stateMap = Object.fromEntries(execStates.map((s) => [s.subtaskId, s]));
  const completed = execStates.filter((s) => s.status === "completed").length;
  const progress = plan.subtasks.length > 0 ? (completed / plan.subtasks.length) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#a855f7] animate-pulse" />
            <span className="font-semibold text-white">Executing Task…</span>
          </div>
          <span className="text-sm text-white/50">
            {completed}/{plan.subtasks.length} subtasks
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#a855f7] to-[#0ea5e9] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {escrowTx && (
          <a
            href={`https://testnet.monadexplorer.com/tx/${escrowTx}`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-[#0ea5e9]/60 hover:text-[#0ea5e9] transition-colors"
          >
            <Shield className="w-3 h-3" />
            Escrow: {escrowTx.slice(0, 18)}…
          </a>
        )}
      </div>

      {/* Per-agent status */}
      <div className="grid grid-cols-1 gap-3">
        {plan.subtasks.map((st) => {
          const state = stateMap[st.id] ?? { subtaskId: st.id, status: "pending" };
          const option = effectiveCostFn(st);
          const model = MODEL_INFO[option.agent.model as ModelId];

          return (
            <div
              key={st.id}
              className={`p-4 rounded-xl border transition-all ${
                state.status === "completed"
                  ? "border-emerald-500/25 bg-emerald-500/[0.04]"
                  : state.status === "running"
                  ? "border-[#a855f7]/30 bg-[#a855f7]/[0.04]"
                  : state.status === "failed"
                  ? "border-red-500/25 bg-red-500/[0.04]"
                  : "border-white/[0.06] bg-white/[0.01]"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Status icon */}
                <div className="mt-0.5">
                  {state.status === "completed" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {state.status === "running" && <Loader2 className="w-4 h-4 text-[#a855f7] animate-spin" />}
                  {state.status === "failed" && <AlertCircle className="w-4 h-4 text-red-400" />}
                  {state.status === "pending" && <Clock className="w-4 h-4 text-white/20" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-white">{st.title}</span>
                    <span className="text-[10px] text-white/30">→</span>
                    <span className="text-[10px] text-white/50">{option.agent.name}</span>
                    {model && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                        style={{ background: model.color + "15", color: model.color }}
                      >
                        {model.label}
                      </span>
                    )}
                  </div>

                  {state.status === "running" && (
                    <p className="text-xs text-[#a855f7]/60 mt-1 animate-pulse">
                      Agent working…
                    </p>
                  )}
                  {state.output && (
                    <p className="text-xs text-white/40 mt-1">{state.output}</p>
                  )}
                  {state.proofHash && (
                    <p className="text-[10px] font-mono text-white/20 mt-1">
                      Proof: {state.proofHash}
                    </p>
                  )}
                </div>

                <span
                  className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full border font-mono ${
                    state.status === "completed"
                      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                      : state.status === "running"
                      ? "text-[#c084fc] border-[#a855f7]/30 bg-[#a855f7]/10"
                      : state.status === "failed"
                      ? "text-red-400 border-red-500/30 bg-red-500/10"
                      : "text-white/20 border-white/[0.06]"
                  }`}
                >
                  {state.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Final Output ─────────────────────────────────────────────────────────────

function FinalOutputView({
  plan, execStates, prompt, budget, effectiveCost, escrowTx, onDownload, onReset,
}: {
  plan: OrchestrationPlan;
  execStates: ExecutionState[];
  prompt: string;
  budget: number;
  effectiveCost: number;
  escrowTx: string | null;
  onDownload: () => void;
  onReset: () => void;
}) {
  const stateMap = Object.fromEntries(execStates.map((s) => [s.subtaskId, s]));
  const models = [...new Set(plan.subtasks.map((st) => st.selectedOption.agent.model))];

  return (
    <div className="space-y-5">
      {/* Success banner */}
      <div className="p-6 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.05]">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white text-lg mb-1">Task Completed!</h3>
            <p className="text-white/50 text-sm mb-3 line-clamp-2">{prompt}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">Total Spent</p>
                <p className="font-bold text-white">${effectiveCost} MON</p>
              </div>
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">Budget Used</p>
                <p className="font-bold text-white">{Math.round((effectiveCost / budget) * 100)}%</p>
              </div>
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">Agents</p>
                <p className="font-bold text-white">{plan.subtasks.length}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">Models Used</p>
                <p className="font-bold text-white">{models.join(", ")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Outputs per subtask */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-white/70 uppercase tracking-widest">Agent Outputs</h4>
        {plan.subtasks.map((st) => {
          const state = stateMap[st.id];
          const model = MODEL_INFO[st.selectedOption.agent.model as ModelId];
          return (
            <div key={st.id} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className="text-sm font-medium text-white">{st.title}</span>
                  <span className="text-white/30 mx-2">·</span>
                  <span className="text-xs text-white/40">{st.selectedOption.agent.name}</span>
                  {model && (
                    <span
                      className="ml-2 text-[9px] px-1.5 py-0.5 rounded"
                      style={{ background: model.color + "15", color: model.color }}
                    >
                      {model.label}
                    </span>
                  )}
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              </div>
              {state?.output && (
                <p className="text-xs text-white/50">{state.output}</p>
              )}
              {state?.proofHash && (
                <p className="text-[10px] font-mono text-white/20 mt-1.5">
                  IPFS / Proof: {state.proofHash}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Cost breakdown */}
      <div className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-white/40" />
          <h4 className="text-sm font-semibold text-white/70">Cost Breakdown</h4>
        </div>
        <div className="space-y-2">
          {plan.subtasks.map((st) => (
            <div key={st.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-white/50">{st.title}</span>
                <span className="text-[10px] text-white/25">({st.selectedOption.agent.name})</span>
              </div>
              <span className="font-mono text-white/60">${st.selectedOption.agent.costPerTask}</span>
            </div>
          ))}
          <div className="pt-2 mt-2 border-t border-white/[0.06] flex justify-between font-semibold">
            <span className="text-white/70">Total</span>
            <span className="text-white">${effectiveCost} MON</span>
          </div>
          <div className="flex justify-between text-xs text-emerald-400/70">
            <span>Saved from budget</span>
            <span>${Math.max(budget - effectiveCost, 0)} MON</span>
          </div>
        </div>
      </div>

      {/* Escrow tx */}
      {escrowTx && (
        <a
          href={`https://testnet.monadexplorer.com/tx/${escrowTx}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 p-3 rounded-xl border border-[#0ea5e9]/20 bg-[#0ea5e9]/[0.04] text-xs text-[#0ea5e9]/70 hover:text-[#0ea5e9] transition-colors"
        >
          <Shield className="w-4 h-4" />
          <span className="flex-1">Escrow Transaction on Monad</span>
          <span className="font-mono">{escrowTx.slice(0, 20)}…</span>
        </a>
      )}

      {/* CTA buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onDownload}
          className={`${primaryBtn} flex-1`}
        >
          <Download className="w-4 h-4" />
          Download PDF Report
        </button>
        <button
          onClick={onReset}
          className={`${secondaryBtn} flex-1`}
        >
          New Task
        </button>
      </div>
    </div>
  );
}

// ─── PDF Generation ───────────────────────────────────────────────────────────

async function generatePDF(
  prompt: string,
  budget: number,
  plan: OrchestrationPlan,
  execStates: ExecutionState[],
  escrowTx: string | null,
  walletAddress: string
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const stateMap = Object.fromEntries(execStates.map((s) => [s.subtaskId, s]));
  const totalCost = plan.subtasks.reduce((s, st) => s + st.selectedOption.agent.costPerTask, 0);

  let y = 15;
  const W = 210;
  const margin = 15;
  const lineH = 6;

  const addLine = (text: string, size = 10, bold = false, color: [number, number, number] = [255, 255, 255]) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...color);
    doc.text(text, margin, y);
    y += lineH;
  };

  const addGap = (h = 4) => { y += h; };

  // Black background
  doc.setFillColor(10, 10, 12);
  doc.rect(0, 0, W, 297, "F");

  // Header
  addLine("AGENTMESH", 20, true, [168, 85, 247]);
  addLine("AI Agent Task Report · Monad Testnet", 10, false, [150, 150, 170]);
  addGap(4);

  // Separator
  doc.setDrawColor(60, 60, 80);
  doc.line(margin, y, W - margin, y);
  addGap(5);

  // Prompt
  addLine("TASK PROMPT", 8, true, [100, 100, 130]);
  addGap(1);
  const promptLines = doc.splitTextToSize(prompt, W - margin * 2);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(220, 220, 240);
  doc.text(promptLines, margin, y);
  y += promptLines.length * lineH;
  addGap(5);

  // Summary
  doc.line(margin, y, W - margin, y); addGap(5);
  addLine("SUMMARY", 8, true, [100, 100, 130]);
  addGap(1);
  addLine(`Budget: $${budget} MON`, 10, false, [200, 200, 220]);
  addLine(`Total Cost: $${totalCost} MON`, 10, false, [200, 200, 220]);
  addLine(`Budget Utilization: ${Math.round((totalCost / budget) * 100)}%`, 10, false, [200, 200, 220]);
  addLine(`Wallet: ${walletAddress}`, 10, false, [200, 200, 220]);
  if (escrowTx) addLine(`Escrow Tx: ${escrowTx.slice(0, 40)}…`, 9, false, [14, 165, 233]);
  addGap(5);

  // Agents
  doc.line(margin, y, W - margin, y); addGap(5);
  addLine("SELECTED AGENTS & OUTPUTS", 8, true, [100, 100, 130]);
  addGap(2);

  for (const st of plan.subtasks) {
    const state = stateMap[st.id];
    const model = MODEL_INFO[st.selectedOption.agent.model as ModelId];
    addLine(`${st.title}`, 11, true, [240, 240, 255]);
    addLine(`Agent: ${st.selectedOption.agent.name}  ·  Model: ${model?.label ?? st.selectedOption.agent.model}  ·  Cost: $${st.selectedOption.agent.costPerTask} MON`, 9, false, [140, 140, 180]);
    addLine(`Reputation: ${st.selectedOption.agent.reputation}/100  ·  Score: ${Math.round(st.selectedOption.score * 100)}/100`, 9, false, [140, 140, 180]);
    if (state?.output) {
      const outLines = doc.splitTextToSize(state.output, W - margin * 2 - 4);
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 180, 120);
      doc.text(outLines, margin + 2, y);
      y += outLines.length * 5.5;
    }
    if (state?.proofHash) {
      addLine(`Proof: ${state.proofHash}`, 8, false, [80, 80, 100]);
    }
    addGap(3);
    if (y > 270) { doc.addPage(); doc.setFillColor(10, 10, 12); doc.rect(0, 0, W, 297, "F"); y = 15; }
  }

  // Footer
  doc.setDrawColor(60, 60, 80);
  doc.line(margin, 285, W - margin, 285);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 100);
  doc.text(`Generated by AgentMesh on Monad  ·  ${new Date().toISOString().split("T")[0]}`, margin, 291);

  doc.save("agentmesh-report.pdf");
}

// ─── Style helpers ────────────────────────────────────────────────────────────

const primaryBtn =
  "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm " +
  "bg-gradient-to-r from-[#a855f7] to-[#0ea5e9] text-white hover:opacity-90 active:scale-[0.99] transition-all " +
  "disabled:opacity-40 disabled:cursor-not-allowed";

const secondaryBtn =
  "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm " +
  "border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all";
