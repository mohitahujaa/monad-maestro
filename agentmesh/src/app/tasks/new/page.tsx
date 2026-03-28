"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import {
  Plus, ArrowLeft, Zap, Shield, Clock, Code, Layout,
  Database, Globe, Search, PenLine, CheckCircle2,
} from "lucide-react";

const DOMAIN_COLORS: Record<string, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  research: { color: "#38bdf8", bg: "rgba(56,189,248,0.10)",  border: "rgba(56,189,248,0.35)",  icon: Search  },
  coding:   { color: "#a3e635", bg: "rgba(163,230,53,0.10)",  border: "rgba(163,230,53,0.35)",  icon: Code    },
  design:   { color: "#f472b6", bg: "rgba(244,114,182,0.10)", border: "rgba(244,114,182,0.35)", icon: Layout  },
  writing:  { color: "#fbbf24", bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.35)",  icon: PenLine },
  testing:  { color: "#fb923c", bg: "rgba(251,146,60,0.10)",  border: "rgba(251,146,60,0.35)",  icon: CheckCircle2 },
  data:     { color: "#c084fc", bg: "rgba(192,132,252,0.10)", border: "rgba(192,132,252,0.35)", icon: Database },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};
const stagger: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08 } },
};

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[13px] font-mono text-white placeholder-white/20 focus:outline-none focus:border-[#a855f7]/50 focus:bg-white/[0.06] transition-all duration-200";

export default function NewTaskPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    totalBudget: 100,
    deadline: "",
    maxRetries: 3,
    maxToolCalls: 10,
    limits: {
      research: 10,
      coding: 20,
      design: 15,
      writing: 10,
      testing: 15,
      data: 15,
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ["totalBudget", "maxRetries", "maxToolCalls"].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const handleLimitChange = (domain: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      limits: { ...prev.limits, [domain]: Number(value) },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          totalBudget: formData.totalBudget,
          perAgentLimits: formData.limits,
          maxRetries: formData.maxRetries,
          maxToolCalls: formData.maxToolCalls,
        }),
      });

      if (!res.ok) throw new Error("Failed to create task");

      const task = await res.json();
      setSubmitted(true);
      setTimeout(() => router.push(`/tasks/${task.id}`), 800);
    } catch (err) {
      console.error(err);
      alert("Error creating task. Check console.");
      setLoading(false);
    }
  };

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

      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none z-0"
        style={{ background: "radial-gradient(ellipse at center top, rgba(168,85,247,0.06) 0%, transparent 70%)" }}
      />

      {/* Page header */}
      <div className="relative z-10 border-b border-white/[0.05] bg-[#030303]/80 backdrop-blur-xl pt-24 pb-10 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-white/30 hover:text-white/70 transition-colors duration-200 mb-6"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>

            <span className="section-label">Orchestration Layer</span>
            <h1 className="section-heading">Deploy New Task</h1>
            <p className="text-[12px] text-white/40 font-mono mt-2">
              Define your task · set budget guardrails · agents execute autonomously on Monad
            </p>
          </motion.div>
        </div>
      </div>

      {/* Form */}
      <div className="relative z-10 px-6 py-10 max-w-3xl mx-auto">
        <form onSubmit={handleSubmit}>
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="space-y-5"
          >

            {/* ── Task Details card ── */}
            <motion.div variants={fadeUp} className="bg-[#0d0d10] border border-white/[0.07] rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-white/[0.05]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#a855f7]/10 border border-[#a855f7]/25 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-[#a855f7]" />
                  </div>
                  <div>
                    <h2 className="text-[13px] font-semibold text-white">Task Details</h2>
                    <p className="text-[10px] text-white/30 font-mono">What do you want the agent workforce to accomplish?</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <FieldGroup label="Title">
                  <input
                    id="title"
                    name="title"
                    type="text"
                    placeholder="e.g., Build a modern landing page"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </FieldGroup>

                <FieldGroup label="Description">
                  <textarea
                    id="description"
                    name="description"
                    placeholder="Provide detailed instructions for the agent swarm…"
                    rows={5}
                    value={formData.description}
                    onChange={handleChange}
                    required
                    className={`${inputClass} resize-none leading-relaxed`}
                  />
                </FieldGroup>

                <div className="grid grid-cols-2 gap-4">
                  <FieldGroup label="Total Budget (USDC)">
                    <input
                      id="totalBudget"
                      name="totalBudget"
                      type="number"
                      min="1"
                      value={formData.totalBudget}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    />
                  </FieldGroup>
                  <FieldGroup label="Deadline (optional)">
                    <input
                      id="deadline"
                      name="deadline"
                      type="date"
                      value={formData.deadline}
                      onChange={handleChange}
                      className={inputClass + " [color-scheme:dark]"}
                    />
                  </FieldGroup>
                </div>
              </div>
            </motion.div>

            {/* ── Budget Guardrails card ── */}
            <motion.div variants={fadeUp} className="bg-[#0d0d10] border border-white/[0.07] rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-white/[0.05]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#0ea5e9]/10 border border-[#0ea5e9]/25 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-[#0ea5e9]" />
                  </div>
                  <div>
                    <h2 className="text-[13px] font-semibold text-white">Budget Guardrails</h2>
                    <p className="text-[10px] text-white/30 font-mono">Prevent overspending loops — hard limits per agent type</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FieldGroup label="Max Retries / Subtask">
                    <input
                      id="maxRetries"
                      name="maxRetries"
                      type="number"
                      min="0"
                      max="10"
                      value={formData.maxRetries}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </FieldGroup>
                  <FieldGroup label="Max Tool Calls / Spin">
                    <input
                      id="maxToolCalls"
                      name="maxToolCalls"
                      type="number"
                      min="1"
                      max="50"
                      value={formData.maxToolCalls}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </FieldGroup>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">
                    Per-Agent Limits (USDC)
                  </label>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(formData.limits).map(([domain, limit]) => {
                      const meta = DOMAIN_COLORS[domain];
                      const Icon = (meta?.icon ?? Globe) as React.ElementType;
                      return (
                        <div
                          key={domain}
                          className="bg-[#030303]/60 border border-white/[0.05] rounded-xl p-3 space-y-2.5 group"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: meta?.bg, border: `1px solid ${meta?.border}` }}
                            >
                              <div style={{ color: meta?.color }} className="w-3 h-3 flex items-center justify-center">
                                <Icon className="w-3 h-3" />
                              </div>
                            </div>
                            <span
                              className="text-[9px] font-mono uppercase tracking-[0.15em]"
                              style={{ color: meta?.color }}
                            >
                              {domain}
                            </span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            value={limit}
                            onChange={(e) => handleLimitChange(domain, e.target.value)}
                            className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-1.5 text-[13px] font-mono text-white focus:outline-none focus:border-white/20 transition-colors"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── Execution summary strip ── */}
            <motion.div variants={fadeUp} className="bg-[#030303]/60 border border-white/[0.05] rounded-2xl px-6 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-3.5 h-3.5 text-white/30" />
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">Execution Preview</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Max Budget",   value: `$${formData.totalBudget}`,       color: "#a855f7" },
                  { label: "Max Retries",  value: `${formData.maxRetries}×`,        color: "#0ea5e9" },
                  { label: "Tool Ceiling", value: `${formData.maxToolCalls} calls`, color: "#f59e0b" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <span className="block text-[9px] font-mono text-white/25 uppercase tracking-[0.15em] mb-1">{s.label}</span>
                    <span className="text-[15px] font-bold font-mono" style={{ color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── Submit row ── */}
            <motion.div variants={fadeUp} className="flex items-center justify-between gap-4 pb-12">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.04] hover:bg-white/[0.07] text-white/60 hover:text-white text-[11px] font-mono uppercase tracking-[0.18em] rounded-xl border border-white/[0.08] hover:border-white/[0.15] transition-all duration-200"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Cancel
              </button>

              <button
                type="submit"
                disabled={loading || submitted}
                className="flex items-center gap-2 px-8 py-2.5 text-white text-[11px] font-mono font-bold uppercase tracking-[0.18em] rounded-xl border border-[#a855f7]/50 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: submitted
                    ? "rgba(163,230,53,0.2)"
                    : loading
                      ? "rgba(168,85,247,0.25)"
                      : "rgba(168,85,247,0.2)",
                  borderColor: submitted ? "rgba(163,230,53,0.5)" : undefined,
                  boxShadow: loading || submitted ? "0 0 24px rgba(168,85,247,0.3)" : undefined,
                }}
              >
                {submitted ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#a3e635]" /> Deployed!
                  </>
                ) : loading ? (
                  <>
                    <Zap className="w-3.5 h-3.5 animate-pulse text-[#a855f7]" /> Planning…
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" /> Deploy Task
                  </>
                )}
              </button>
            </motion.div>

          </motion.div>
        </form>
      </div>
    </div>
  );
}
