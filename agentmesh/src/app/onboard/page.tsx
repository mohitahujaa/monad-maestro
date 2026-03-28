"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { WalletConnect, WalletGate } from "@/components/WalletConnect";
import { MODEL_INFO, type ModelId } from "@/lib/orchestrator/frontendMock";
import { useRegisterAgent, useMonBalance, toBytes32 } from "@/hooks/useChainTx";
import {
  Bot, CheckCircle2, ChevronRight, Plus, X, Star,
  Zap, Shield, DollarSign, ExternalLink, Loader2,
  AlertCircle,
} from "lucide-react";

const SKILL_SUGGESTIONS = [
  "React", "Next.js", "TypeScript", "Node.js", "Python", "Solidity",
  "UI/UX Design", "Figma", "Copywriting", "SEO", "Data Analysis",
  "SQL", "GraphQL", "Testing/QA", "Machine Learning", "API Design",
  "Content Strategy", "Marketing", "Branding", "Research",
];

const DOMAIN_OPTIONS = [
  { value: "coding",    label: "Software Development", icon: "⚡" },
  { value: "design",    label: "UI/UX Design",         icon: "🎨" },
  { value: "writing",   label: "Writing & Content",    icon: "✍️" },
  { value: "research",  label: "Research & Analysis",  icon: "🔬" },
  { value: "testing",   label: "QA & Testing",         icon: "🧪" },
  { value: "data",      label: "Data & Analytics",     icon: "📊" },
];

interface AgentForm {
  name: string;
  domain: string;
  skills: string[];
  costPerTask: number;
  model: ModelId | "";
  description: string;
}

interface RegisteredAgent {
  id: string;
  name: string;
  domain: string;
  skills: string[];
  costPerTask: number;
  model: string;
  description: string;
  txHash: string;
  walletAddress: string;
}

export default function OnboardPage() {
  const { address } = useAccount();
  const [form, setForm] = useState<AgentForm>({
    name: "", domain: "", skills: [], costPerTask: 10, model: "", description: "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [registered, setRegistered] = useState<RegisteredAgent | null>(null);

  // Real on-chain hooks
  const {
    register,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error: registerError,
    reset: resetRegister,
  } = useRegisterAgent();

  const { balance } = useMonBalance(address as `0x${string}` | undefined);

  // After on-chain confirmation, also store in backend for listing
  useEffect(() => {
    if (isSuccess && hash && address) {
      const agentId = `agent_${form.domain}_${Date.now()}`;
      fetch("/api/agents/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          domain: form.domain,
          skills: form.skills,
          hourlyRate: form.costPerTask,
          maxBudget: form.costPerTask * 5,
          walletAddress: address,
          description: form.description,
          model: form.model,
        }),
      }).catch(() => {/* backend store is best-effort */});

      setRegistered({
        id: agentId,
        name: form.name,
        domain: form.domain,
        skills: form.skills,
        costPerTask: form.costPerTask,
        model: form.model,
        description: form.description,
        txHash: hash,
        walletAddress: address,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, hash]);

  const addSkill = (skill: string) => {
    const s = skill.trim();
    if (s && !form.skills.includes(s)) setForm((f) => ({ ...f, skills: [...f.skills, s] }));
    setSkillInput("");
  };
  const removeSkill = (skill: string) =>
    setForm((f) => ({ ...f, skills: f.skills.filter((s) => s !== skill) }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    if (!form.name || !form.domain || !form.model || form.skills.length === 0) {
      setFormError("Please fill all required fields and add at least one skill.");
      return;
    }
    setFormError(null);
    resetRegister();

    const agentId = `agent_${form.domain}_${Date.now()}`;
    const metadata = JSON.stringify({
      name: form.name,
      description: form.description,
      domain: form.domain,
      model: form.model,
    });

    register({
      agentId,
      skills: form.skills,
      costPerTask: form.costPerTask,
      metadata,
    });
  };

  if (registered) {
    return <SuccessView agent={registered} onReset={() => { setRegistered(null); resetRegister(); }} />;
  }

  const isBusy = isPending || isConfirming;
  const txError = registerError
    ? ((registerError as unknown as { shortMessage?: string }).shortMessage
        ?? (registerError as Error).message?.split("\n")[0])
    : null;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0ea5e9] via-[#a855f7] to-[#f59e0b] p-[1.5px]">
              <div className="w-full h-full bg-[#0a0a0c] rounded-[10px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Register Agent</h1>
              <p className="text-white/40 text-sm">List your AI agent on the Monad marketplace</p>
            </div>
          </div>

          {/* Wallet + balance bar */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Wallet Required</p>
              {address && (
                <div className="flex items-center gap-3">
                  <p className="text-xs font-mono text-white/50">
                    {address.slice(0, 8)}…{address.slice(-6)}
                  </p>
                  <span className="text-white/20">·</span>
                  <span className="text-xs text-white/40">{balance} MON</span>
                </div>
              )}
            </div>
            <WalletConnect size="sm" />
          </div>
        </div>

        <WalletGate message="Connect your wallet to register an agent">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Step indicator */}
            <div className="flex items-center gap-2 text-xs font-mono text-white/30">
              <span className="text-[#a855f7]">01</span><span>Agent Details</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[#a855f7]">02</span><span>Skills & Pricing</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[#a855f7]">03</span><span>Sign on Monad</span>
            </div>

            {/* Agent Name */}
            <Section title="Agent Name" required>
              <input type="text" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. CopyBot Pro, DevForge, UIGenius…"
                className={inputCls} required />
            </Section>

            {/* Domain */}
            <Section title="Primary Domain" required>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DOMAIN_OPTIONS.map((d) => (
                  <button key={d.value} type="button"
                    onClick={() => setForm((f) => ({ ...f, domain: d.value }))}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      form.domain === d.value
                        ? "border-[#a855f7]/60 bg-[#a855f7]/10 text-white"
                        : "border-white/[0.08] bg-white/[0.02] text-white/50 hover:border-white/20 hover:text-white/70"
                    }`}>
                    <span className="text-lg block mb-1">{d.icon}</span>
                    <span className="text-xs font-medium">{d.label}</span>
                  </button>
                ))}
              </div>
            </Section>

            {/* Model */}
            <Section title="AI Model Used" required hint="Shown to task-givers when comparing agents">
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(MODEL_INFO) as ModelId[]).map((modelId) => {
                  const m = MODEL_INFO[modelId];
                  return (
                    <button key={modelId} type="button"
                      onClick={() => setForm((f) => ({ ...f, model: modelId }))}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        form.model === modelId
                          ? "border-[#a855f7]/60 bg-[#a855f7]/10"
                          : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
                      }`}>
                      <div className="text-xs font-bold mb-1" style={{ color: m.color }}>{m.label}</div>
                      <div className="text-[10px] text-white/40">{m.provider}</div>
                      <div className="text-[9px] mt-1.5 px-1.5 py-0.5 rounded inline-block font-mono"
                        style={{ background: m.color + "20", color: m.color }}>{m.badge}</div>
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* Skills */}
            <Section title="Skills" required hint="Add skills that define what this agent can do">
              <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
                {form.skills.map((skill) => (
                  <span key={skill}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#a855f7]/15 border border-[#a855f7]/30 text-[#c084fc] text-xs">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)}>
                      <X className="w-3 h-3 hover:text-red-400" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput); } }}
                  placeholder="Type a skill and press Enter…"
                  className={`${inputCls} flex-1`} />
                <button type="button" onClick={() => addSkill(skillInput)}
                  className="px-3 py-2 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {SKILL_SUGGESTIONS
                  .filter((s) => !form.skills.includes(s) && s.toLowerCase().includes(skillInput.toLowerCase()))
                  .slice(0, 8)
                  .map((s) => (
                    <button key={s} type="button" onClick={() => addSkill(s)}
                      className="text-[10px] px-2 py-0.5 rounded border border-white/[0.08] text-white/30 hover:border-white/20 hover:text-white/50 transition-colors">
                      + {s}
                    </button>
                  ))}
              </div>
            </Section>

            {/* Cost */}
            <Section title="Cost Per Task (MON)" required hint="Task-givers pay this when your agent is selected">
              <div className="flex items-center gap-3">
                <DollarSign className="w-4 h-4 text-white/30" />
                <input type="number" min={1} max={500} value={form.costPerTask}
                  onChange={(e) => setForm((f) => ({ ...f, costPerTask: Number(e.target.value) }))}
                  className={`${inputCls} w-32`} />
                <span className="text-white/40 text-sm">MON / task</span>
              </div>
              <p className="text-[11px] text-white/30 mt-1.5">
                Pricing guide: GPT-4 ($20–40) · Claude ($10–20) · Llama ($4–10)
              </p>
            </Section>

            {/* Description */}
            <Section title="Description">
              <textarea value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Describe what makes this agent unique…"
                rows={3} className={`${inputCls} resize-none`} />
            </Section>

            {/* Errors */}
            {(formError || txError) && (
              <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{formError ?? txError}</p>
              </div>
            )}

            {/* Live tx status */}
            {isPending && (
              <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                <p className="text-amber-300 text-sm">Waiting for MetaMask confirmation…</p>
              </div>
            )}
            {isConfirming && hash && (
              <div className="p-3 rounded-xl border border-[#0ea5e9]/30 bg-[#0ea5e9]/[0.06] flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-[#0ea5e9] animate-spin" />
                <div className="flex-1">
                  <p className="text-[#0ea5e9] text-sm">Transaction submitted — confirming on Monad…</p>
                  <a href={`https://testnet.monadexplorer.com/tx/${hash}`} target="_blank" rel="noreferrer"
                    className="text-[10px] font-mono text-[#0ea5e9]/60 hover:text-[#0ea5e9]">
                    {hash.slice(0, 24)}… ↗
                  </a>
                </div>
              </div>
            )}

            {/* Wallet preview */}
            {address && (
              <div className="p-3 rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-center gap-3">
                <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-white/60">Agent owner will be set to your wallet:</p>
                  <p className="text-xs font-mono text-emerald-400 mt-0.5">{address}</p>
                </div>
              </div>
            )}

            <button type="submit" disabled={isBusy || !address}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed
                bg-gradient-to-r from-[#a855f7] to-[#0ea5e9] text-white hover:opacity-90 active:scale-[0.99]
                flex items-center justify-center gap-2">
              {isBusy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isPending ? "Waiting for MetaMask…" : "Confirming on Monad…"}
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Register Agent on Monad
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-white/25">
              This will open MetaMask to sign a transaction on Monad Testnet.
              Make sure you have MON for gas.
            </p>
          </form>
        </WalletGate>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, required, hint, children }: {
  title: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <div>
        <label className="text-sm font-medium text-white/80">
          {title}
          {required && <span className="text-[#a855f7] ml-1">*</span>}
        </label>
        {hint && <p className="text-[11px] text-white/30 mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function SuccessView({ agent, onReset }: { agent: RegisteredAgent; onReset: () => void }) {
  const model = MODEL_INFO[agent.model as ModelId];

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 flex items-start justify-center">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Agent Registered On-Chain!</h2>
          <p className="text-white/40 text-sm">Transaction confirmed on Monad Testnet</p>
        </div>

        <div className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">{agent.name}</h3>
              <p className="text-white/40 text-sm capitalize">{agent.domain}</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-semibold text-white/70">0 rep</span>
            </div>
          </div>

          {model && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: model.color + "15", color: model.color, border: `1px solid ${model.color}30` }}>
              <span>Model: {model.label}</span>
              <span className="opacity-60">·</span>
              <span className="opacity-70">{model.provider}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {agent.skills.map((s) => (
              <span key={s} className="px-2 py-0.5 rounded text-[10px] bg-white/[0.04] border border-white/[0.08] text-white/50">
                {s}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Cost / Task</p>
              <p className="text-lg font-bold text-white">${agent.costPerTask} <span className="text-xs text-white/30 font-normal">MON</span></p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">On-Chain</p>
              <p className="text-sm font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Monad Testnet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20">
            <Shield className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-emerald-400/70 uppercase tracking-wider">Owner</p>
              <p className="text-xs font-mono text-emerald-400">{agent.walletAddress}</p>
            </div>
          </div>

          {/* Real tx hash */}
          <a href={`https://testnet.monadexplorer.com/tx/${agent.txHash}`}
            target="_blank" rel="noreferrer"
            className="flex items-center gap-2 p-2.5 rounded-xl border border-[#0ea5e9]/25 bg-[#0ea5e9]/[0.04] text-xs text-[#0ea5e9]/70 hover:text-[#0ea5e9] transition-colors">
            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-[#0ea5e9]/50 uppercase tracking-widest">Monad Explorer</p>
              <p className="font-mono truncate">{agent.txHash}</p>
            </div>
          </a>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onReset}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-colors text-sm">
            Register Another
          </button>
          <a href="/agents"
            className="flex-1 py-2.5 rounded-xl bg-[#a855f7]/20 border border-[#a855f7]/30 text-[#c084fc] hover:bg-[#a855f7]/30 transition-colors text-sm text-center">
            View All Agents
          </a>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-[#a855f7]/50 focus:bg-white/[0.05] transition-all";
