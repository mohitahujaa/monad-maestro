"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { HeroScene }       from "@/components/HeroScene";
import { CommandConsole }  from "@/components/CommandConsole";
import { DAGGraph }        from "@/components/DAGGraph";
import { AgentCard }       from "@/components/AgentCard";
import { ReputationForge } from "@/components/ReputationForge";

import {
  Layout, Code, Zap, Globe, Database,
  ArrowRight, GitBranch, ShieldCheck,
  Cpu, Layers, ExternalLink,
} from "lucide-react";

/* ── Shared animation variants ─────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};
const staggerParent = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.11 } },
};

/* ── Consistent section header sub-component ────────────────── */
function SectionHeader({
  label,
  heading,
  sub,
  center = false,
}: {
  label: string;
  heading: string;
  sub?: string;
  center?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={center ? "text-center" : ""}
    >
      <span className="section-label">{label}</span>
      <h2 className="section-heading">{heading}</h2>
      {sub && <p className="text-sm text-white/40 mt-3 font-mono leading-relaxed max-w-xl">{sub}</p>}
    </motion.div>
  );
}

/* ── "How It Works" step data ──────────────────────────────── */
const HOW_IT_WORKS = [
  {
    step: "01", icon: Layers, title: "Task Decomposition", color: "#0ea5e9",
    desc: "Your task is broken into a directed acyclic graph of subtasks, each assigned to the optimal agent.",
  },
  {
    step: "02", icon: GitBranch, title: "Parallel DAG Execution", color: "#a855f7",
    desc: "Independent subtasks execute simultaneously across specialised agents, eliminating serial bottlenecks.",
  },
  {
    step: "03", icon: ShieldCheck, title: "On-Chain Escrow", color: "#f59e0b",
    desc: "USDC is held in the TaskEscrow contract. Agents are paid only after proof of work is submitted.",
  },
  {
    step: "04", icon: Cpu, title: "Reputation Sync", color: "#a3e635",
    desc: "Every result is scored on-chain. Agents build verifiable track records that can't be faked.",
  },
];

/* ── Contract data ──────────────────────────────────────────── */
const CONTRACTS = [
  { name: "MockUSDC",           addr: "0xDA043d0CCF4d7Fd7aC441a659A7f7894f867CB95" },
  { name: "AgentRegistry",      addr: "0xAd83441c289710001296bdE74f8f243FBAF89323" },
  { name: "TaskEscrow",         addr: "0xcBaDDD5f491616126E9b45c75e9d0B29407aa346" },
  { name: "ReputationContract", addr: "0x2b929B158E9b960cb8c0b7d4feafC11b7B065ADb" },
];

/* ═══════════════════════════════════════════════════════════ */
export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);

  /* GSAP entrance timeline — scoped to hero section only */
  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(".gsap-grid-v",
        { scaleY: 0, transformOrigin: "top" },
        { scaleY: 1, duration: 1.6, stagger: 0.1, ease: "expo.inOut" }
      )
      .fromTo(".gsap-grid-h",
        { scaleX: 0, transformOrigin: "left" },
        { scaleX: 1, duration: 1.4, stagger: 0.12, ease: "expo.inOut" },
        "-=1.3"
      )
      .fromTo(".gsap-model",
        { opacity: 0, scale: 0.85 },
        { opacity: 1, scale: 1, duration: 1.3 },
        "-=0.9"
      )
      .fromTo(".gsap-quote",
        { x: -28, opacity: 0 },
        { x: 0, opacity: 1, duration: 1 },
        "-=0.9"
      )
      .fromTo(".gsap-main-text",
        { y: 36, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.18 },
        "-=0.85"
      )
      .fromTo(".gsap-list-item",
        { x: 28, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, stagger: 0.09 },
        "-=0.85"
      )
      .fromTo(".gsap-fade",
        { opacity: 0 },
        { opacity: 1, duration: 0.9, stagger: 0.18 },
        "-=0.5"
      );
    },
    { scope: heroRef }
  );

  return (
    <div className="relative w-full min-h-screen bg-transparent text-white overflow-x-hidden">

      {/* ── FIXED GRID LINES (persist across full page) ──────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Vertical columns */}
        <div className="absolute inset-0 flex">
          <div className="flex-1" />
          <div className="flex-1 border-l border-white/[0.035] gsap-grid-v" />
          <div className="flex-1 border-l border-white/[0.035] gsap-grid-v" />
          <div className="flex-1 border-l border-white/[0.035] gsap-grid-v" />
        </div>
        {/* Horizontal markers */}
        <div className="absolute top-16 left-0 right-0 border-b border-white/[0.035] gsap-grid-h" />
        <div className="absolute bottom-[20vh] left-0 right-0 border-b border-white/[0.035] gsap-grid-h" />
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* HERO                                                    */}
      {/* ══════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative w-full h-screen min-h-[760px] z-10 flex flex-col justify-center overflow-hidden"
      >
        {/* 3-D scene */}
        <div className="absolute inset-0 z-0 flex justify-center items-center pointer-events-none">
          <div className="w-full max-w-4xl aspect-square relative gsap-model">
            <HeroScene />
          </div>
        </div>

        {/* Content overlay */}
        <div className="relative z-10 flex flex-col justify-between h-full pt-24 pb-8 px-6 max-w-[1600px] mx-auto w-full">

          {/* Top row */}
          <div className="flex justify-between items-start w-full">

            {/* Left quote box */}
            <div className="hidden md:flex flex-col gap-6 max-w-[300px] gsap-quote">
              <div className="relative p-5 pt-7 pr-7 border-l border-t border-white/20">
                <span className="absolute -top-px -left-px w-2 h-2 border-t-2 border-l-2 border-white" />
                <span className="absolute top-full -left-px w-2 h-2 border-b-2 border-l-2 border-white/30 -translate-y-full" />
                <span className="absolute -top-px left-full w-2 h-2 border-t-2 border-r-2 border-white/30 -translate-x-full" />
                <p className="text-white/80 font-mono text-[11px] leading-relaxed uppercase tracking-widest">
                  "Explain what an autonomous<br />AI Agent does in<br />simple terms."
                </p>
              </div>
              <div className="pl-5 border-l border-white/[0.08]">
                <p className="text-white/25 font-mono text-[9px] uppercase tracking-[0.2em] leading-relaxed">
                  How to deploy an orchestrated swarm of smart agents on the Monad blockchain?
                </p>
              </div>
            </div>

            {/* Right category list */}
            <div className="hidden lg:flex flex-col gap-4 text-right font-mono text-[10px] uppercase tracking-[0.25em] text-white/35 md:mr-12">
              {["Development", "Orchestration", "Blockchain AI"].map((item) => (
                <motion.div
                  key={item}
                  whileHover={{ x: -10, color: "rgba(255,255,255,0.9)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="flex items-center justify-end gap-3 cursor-pointer group gsap-list-item"
                >
                  <span className="w-1.5 h-px bg-white/15 group-hover:bg-white/80 transition-colors duration-200" />
                  {item}
                </motion.div>
              ))}
              <div className="flex items-center justify-end gap-3 text-white/15 pt-3 gsap-list-item font-mono text-[9px]">
                And much more
              </div>
            </div>
          </div>

          {/* Bottom: big title + subtitle */}
          <div className="relative flex items-end justify-between w-full mb-10">
            <div className="z-10 bg-transparent/75 backdrop-blur-sm p-4 -ml-4 rounded-xl">

              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 mb-3 ml-1 gsap-main-text">
                Unleash the power of
              </p>

              {/* Neon border title box */}
              <div className="relative inline-flex mb-2 gsap-main-text">
                {/* Gradient border */}
                <div className="absolute -inset-[1.5px] rounded-xl pointer-events-none"
                  style={{
                    background: "linear-gradient(135deg,#0ea5e9,#a855f7,#f59e0b)",
                    mask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                    WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                    maskComposite: "exclude",
                    WebkitMaskComposite: "destination-out",
                  }}
                />
                {/* Corner ornament */}
                <svg className="absolute -top-2.5 -left-2.5 w-5 h-5 text-[#0ea5e9] opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 19V5h14" />
                </svg>

                <div className="relative bg-transparent px-7 py-5 md:px-10 md:py-6 rounded-xl">
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-sans tracking-tight text-white leading-[1.05]">
                    <span className="font-semibold block">AI Agent</span>
                    <span className="font-light block text-white/70">Market</span>
                  </h1>
                </div>
              </div>
            </div>

            {/* Subtitle */}
            <div className="hidden lg:block absolute bottom-4 right-[26%] max-w-[210px] text-right z-10 gsap-main-text">
              <p className="font-sans text-[13px] text-white/50 leading-relaxed font-light">
                Your personal expert in all crypto &amp; blockchain related tasks.
              </p>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute right-6 lg:right-10 bottom-8 flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.2em] text-white/35 cursor-pointer hover:text-white/70 transition-colors duration-200 gsap-fade">
            <motion.span whileHover={{ letterSpacing: "0.35em" }} className="transition-all duration-300">
              Scroll
            </motion.span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="w-7 h-7 rounded-full border border-white/[0.18] flex items-center justify-center"
            >
              <ArrowRight className="w-3 h-3 rotate-90" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* HOW IT WORKS                                           */}
      {/* ══════════════════════════════════════════════════════ */}
      <section className="relative z-20 py-28 px-6 border-t border-white/[0.05] bg-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <SectionHeader
              label="How It Works"
              heading="From prompt to parallel execution"
              center
            />
          </div>

          <motion.div
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-4 gap-px bg-white/[0.04] rounded-2xl overflow-hidden border border-white/[0.06]"
          >
            {HOW_IT_WORKS.map((item) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                className="bg-[#0d0d10] p-8 flex flex-col gap-4 group hover:bg-[#111115] transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${item.color}12`, border: `1px solid ${item.color}28` }}
                  >
                    <item.icon className="w-4.5 h-4.5" style={{ color: item.color }} />
                  </div>
                  <span className="text-[10px] font-mono text-white/15 tracking-[0.2em]">{item.step}</span>
                </div>
                <h3 className="text-[15px] font-semibold text-white tracking-tight leading-snug">
                  {item.title}
                </h3>
                <p className="text-[13px] text-white/38 leading-relaxed font-mono">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* COMMAND CONSOLE                                         */}
      {/* ══════════════════════════════════════════════════════ */}
      <section className="relative z-20 py-24 px-6 border-t border-white/[0.05] bg-[#0a0a0c]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <SectionHeader
              label="Task Console"
              heading="Deploy your first task"
              sub="Describe what you need — the engine parses skills and allocates agents automatically."
            />
          </div>
          <CommandConsole />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* DAG VISUALISER                                          */}
      {/* ══════════════════════════════════════════════════════ */}
      <section className="relative z-20 py-24 px-6 border-t border-white/[0.05] bg-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <SectionHeader
              label="Live Execution"
              heading="DAG Execution Graph"
              sub="Watch agent nodes execute in parallel. Green = complete · Amber = running · Blue = queued."
            />
          </div>
          <DAGGraph />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* AGENTS                                                  */}
      {/* ══════════════════════════════════════════════════════ */}
      <section className="relative z-20 py-24 px-6 border-t border-white/[0.05] bg-[#0a0a0c]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4"
          >
            <div>
              <SectionHeader label="Agent Roster" heading="Featured Agents" />
            </div>
            <Link
              href="/agents"
              className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-white/35 hover:text-white transition-colors duration-200"
            >
              View all agents <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>

          <motion.div
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              { name: "Aria UI",         level: "Grandmaster", reputation: 4.9, tasks: 312, cost: "0.80",
                aura: "from-[#a855f7] to-[#8b5cf6]",
                skills: [{ name: "Layout", icon: Layout }, { name: "Code", icon: Code }] },
              { name: "Rust Forge",      level: "Elite",       reputation: 4.8, tasks: 508, cost: "1.20",
                aura: "from-[#0ea5e9] to-[#0284c7]",
                skills: [{ name: "Code", icon: Code }, { name: "Zap", icon: Zap }, { name: "DB", icon: Database }] },
              { name: "Solidity Vault",  level: "Master",      reputation: 4.7, tasks: 189, cost: "2.00",
                aura: "from-[#f59e0b] to-[#d97706]",
                skills: [{ name: "Code", icon: Code }, { name: "Globe", icon: Globe }] },
            ].map((a) => (
              <motion.div key={a.name} variants={fadeUp}>
                <AgentCard
                  name={a.name} level={a.level} reputation={a.reputation}
                  tasks={a.tasks} costPerTask={a.cost}
                  aura={a.aura} skills={a.skills}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* REPUTATION LEDGER                                       */}
      {/* ══════════════════════════════════════════════════════ */}
      <section className="relative z-20 py-24 px-6 border-t border-white/[0.05] bg-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <SectionHeader
              label="On-Chain Reputation"
              heading="Agent Leaderboard"
              sub="Verifiable performance scores updated with every completed task."
            />
          </div>
          <ReputationForge />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* DEPLOYED CONTRACTS                                      */}
      {/* ══════════════════════════════════════════════════════ */}
      <section className="relative z-20 py-20 px-6 border-t border-white/[0.05] bg-[#0a0a0c]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <SectionHeader label="Monad Testnet" heading="Deployed Contracts" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {CONTRACTS.map((c) => (
              <motion.a
                key={c.name}
                href={`https://testnet.monadexplorer.com/address/${c.addr}`}
                target="_blank"
                rel="noreferrer"
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="card-neon flex flex-col gap-2 p-4 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-mono font-semibold text-white/65 group-hover:text-white transition-colors duration-200">
                    {c.name}
                  </span>
                  <ExternalLink className="w-3 h-3 text-white/20 group-hover:text-[#a855f7] transition-colors duration-200" />
                </div>
                <span className="text-[9px] font-mono text-white/25 break-all leading-relaxed">
                  {c.addr}
                </span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* FOOTER                                                  */}
      {/* ══════════════════════════════════════════════════════ */}
      <footer className="relative z-20 border-t border-white/[0.05] bg-transparent">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-6 h-6 rounded bg-gradient-to-tr from-[#0ea5e9] via-[#a855f7] to-[#f59e0b] p-[1px]">
              <div className="w-full h-full bg-transparent rounded-[3px] flex items-center justify-center">
                <div className="flex gap-[2px]">
                  <span className="w-1 h-1 bg-white rounded-full" />
                  <span className="w-1 h-1 bg-white rounded-full" />
                </div>
              </div>
            </div>
            <span className="font-bold text-[11px] tracking-[0.2em] uppercase text-white/40 group-hover:text-white/70 transition-colors duration-200">
              AgentMesh
            </span>
          </Link>

          <p className="text-[10px] font-mono text-white/20 text-center tracking-[0.15em]">
            Built on Monad · Decentralised AI Agent Orchestration
          </p>

          <div className="flex items-center gap-6 text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">
            <Link href="/agents" className="hover:text-white transition-colors duration-200">Agents</Link>
            <Link href="/tasks"  className="hover:text-white transition-colors duration-200">Tasks</Link>
            <a href="https://monad.xyz" target="_blank" rel="noreferrer" className="hover:text-white transition-colors duration-200">Monad ↗</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
