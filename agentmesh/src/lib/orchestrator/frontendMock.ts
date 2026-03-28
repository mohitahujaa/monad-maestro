/**
 * Frontend Mock Orchestration Engine
 * Parses prompts, scores agents, optimizes budget allocation.
 * Used by the Task Creation wizard for live UI demonstration.
 */

export const MODEL_INFO = {
  "gpt-4": {
    id: "gpt-4",
    label: "GPT-4",
    provider: "OpenAI",
    color: "#10a37f",
    quality: 0.97,
    badge: "Best Quality",
    description: "Most capable, thorough reasoning",
  },
  claude: {
    id: "claude",
    label: "Claude",
    provider: "Anthropic",
    color: "#a855f7",
    quality: 0.91,
    badge: "Balanced",
    description: "Reliable quality, cost-efficient",
  },
  llama: {
    id: "llama",
    label: "Llama 3 (Open Source)",
    provider: "Meta / Community",
    color: "#f59e0b",
    quality: 0.78,
    badge: "Budget",
    description: "Open weights, fastest, cheapest",
  },
} as const;

export type ModelId = keyof typeof MODEL_INFO;

export interface MockAgentTemplate {
  id: string;
  name: string;
  model: ModelId;
  domain: string;
  skills: string[];
  costPerTask: number;
  reputation: number;   // 0–100
  successRate: number;  // 0–1
  taskCount: number;
}

export interface ScoredOption {
  agent: MockAgentTemplate;
  score: number;       // 0–1
  breakdown: {
    reputation: number;
    successRate: number;
    domainMatch: number;
  };
  costRatio: number;   // cost / budget
  isSelected: boolean;
  isWithinBudget: boolean;
  selectionReason: string;
}

export interface SubtaskPlan {
  id: string;
  title: string;
  description: string;
  domain: string;
  requiredSkills: string[];
  budgetAllocation: number;
  options: ScoredOption[];
  selectedOption: ScoredOption;
  dependencies: string[];
  estimatedDuration: string;
}

export interface OrchestrationPlan {
  subtasks: SubtaskPlan[];
  totalCost: number;
  budgetUtilization: number; // 0–100%
  dagLevels: string[][];     // subtask IDs grouped by level
  summary: string;
}

// ─── Agent Pool (costs in MON) ────────────────────────────────────────────────

const AGENT_POOL: MockAgentTemplate[] = [
  // Copywriting
  { id: "copy-1", name: "CopyBot Pro",    model: "gpt-4",  domain: "writing",  skills: ["copywriting", "marketing", "SEO"],                costPerTask: 0.05,  reputation: 92, successRate: 0.94, taskCount: 287 },
  { id: "copy-2", name: "FastWriter",     model: "claude", domain: "writing",  skills: ["copywriting", "content"],                         costPerTask: 0.02,  reputation: 81, successRate: 0.86, taskCount: 145 },
  { id: "copy-3", name: "LlamaText",      model: "llama",  domain: "writing",  skills: ["copywriting"],                                    costPerTask: 0.008, reputation: 68, successRate: 0.74, taskCount: 63 },
  // UI Design
  { id: "ui-1",   name: "DesignAI Elite", model: "gpt-4",  domain: "design",   skills: ["UI design", "Figma", "prototyping", "branding"],  costPerTask: 0.06,  reputation: 95, successRate: 0.96, taskCount: 312 },
  { id: "ui-2",   name: "UIForge",        model: "claude", domain: "design",   skills: ["UI design", "CSS", "Tailwind"],                   costPerTask: 0.025, reputation: 83, successRate: 0.88, taskCount: 178 },
  { id: "ui-3",   name: "SketchBot",      model: "llama",  domain: "design",   skills: ["UI design"],                                      costPerTask: 0.009, reputation: 70, successRate: 0.76, taskCount: 89 },
  // Frontend Dev
  { id: "fe-1",   name: "CodeCraft GPT",  model: "gpt-4",  domain: "coding",   skills: ["React", "Next.js", "TypeScript", "frontend"],     costPerTask: 0.07,  reputation: 94, successRate: 0.95, taskCount: 441 },
  { id: "fe-2",   name: "DevBot Claude",  model: "claude", domain: "coding",   skills: ["React", "JavaScript", "CSS", "frontend"],         costPerTask: 0.03,  reputation: 86, successRate: 0.89, taskCount: 203 },
  { id: "fe-3",   name: "LlamaCode",      model: "llama",  domain: "coding",   skills: ["JavaScript", "HTML", "CSS"],                      costPerTask: 0.01,  reputation: 72, successRate: 0.77, taskCount: 97 },
  // Research
  { id: "res-1",  name: "ResearchGPT",    model: "gpt-4",  domain: "research", skills: ["research", "analysis", "summarization", "data"], costPerTask: 0.04,  reputation: 90, successRate: 0.93, taskCount: 256 },
  { id: "res-2",  name: "AnalytixBot",    model: "claude", domain: "research", skills: ["research", "analysis", "reporting"],              costPerTask: 0.018, reputation: 80, successRate: 0.85, taskCount: 134 },
  { id: "res-3",  name: "QuickSearch",    model: "llama",  domain: "research", skills: ["research", "summarization"],                      costPerTask: 0.006, reputation: 65, successRate: 0.72, taskCount: 55 },
  // Testing / QA
  { id: "qa-1",   name: "TestBot Pro",    model: "gpt-4",  domain: "testing",  skills: ["testing", "QA", "automation", "Jest"],            costPerTask: 0.05,  reputation: 88, successRate: 0.92, taskCount: 198 },
  { id: "qa-2",   name: "BugHunter",      model: "claude", domain: "testing",  skills: ["testing", "QA", "debugging"],                     costPerTask: 0.022, reputation: 78, successRate: 0.84, taskCount: 121 },
  { id: "qa-3",   name: "LlamaTest",      model: "llama",  domain: "testing",  skills: ["testing"],                                        costPerTask: 0.007, reputation: 63, successRate: 0.70, taskCount: 48 },
  // Data / Analytics
  { id: "data-1", name: "DataWiz GPT",    model: "gpt-4",  domain: "data",     skills: ["data analysis", "Python", "SQL", "visualization"],costPerTask: 0.055, reputation: 91, successRate: 0.94, taskCount: 167 },
  { id: "data-2", name: "PandasBot",      model: "claude", domain: "data",     skills: ["data analysis", "Python", "SQL"],                 costPerTask: 0.024, reputation: 82, successRate: 0.87, taskCount: 99 },
  { id: "data-3", name: "LlamaData",      model: "llama",  domain: "data",     skills: ["data analysis", "SQL"],                           costPerTask: 0.008, reputation: 67, successRate: 0.73, taskCount: 41 },
];

// ─── Prompt Parser ────────────────────────────────────────────────────────────

interface SubtaskSeed {
  title: string;
  description: string;
  domain: string;
  skills: string[];
  budgetWeight: number; // portion of total budget
  dependencies: number[]; // indices of dependent subtasks
  estimatedDuration: string;
}

function parsePromptToSeeds(prompt: string): SubtaskSeed[] {
  const lower = prompt.toLowerCase();

  const seeds: SubtaskSeed[] = [];

  const needsCopy =
    /copy|content|text|write|blog|landing|headline|tagline|market|seo|description/i.test(prompt);
  const needsDesign =
    /design|ui|ux|figma|mockup|wireframe|layout|visual|interface|logo|brand|style/i.test(prompt);
  const needsFrontend =
    /frontend|react|next|component|page|website|web|html|css|typescript|javascript|build/i.test(prompt);
  const needsBackend =
    /backend|api|server|database|endpoint|auth|node|express|rest|graphql/i.test(prompt);
  const needsResearch =
    /research|analyse|analyze|report|competitive|market research|survey|study/i.test(prompt);
  const needsTesting =
    /test|qa|quality|bug|audit|review|check|verify/i.test(prompt);
  const needsData =
    /data|analytics|dashboard|chart|metrics|kpi|statistics|sql|python/i.test(prompt);

  let idx = 0;

  if (needsResearch) {
    seeds.push({
      title: "Research & Analysis",
      description: "Gather requirements, analyze domain, produce structured brief",
      domain: "research",
      skills: ["research", "analysis", "summarization"],
      budgetWeight: 0.15,
      dependencies: [],
      estimatedDuration: "~2 min",
    });
    idx++;
  }

  if (needsCopy) {
    seeds.push({
      title: "Copywriting & Content",
      description: "Write compelling copy, headlines, and marketing content",
      domain: "writing",
      skills: ["copywriting", "marketing", "SEO"],
      budgetWeight: 0.20,
      dependencies: needsResearch ? [0] : [],
      estimatedDuration: "~3 min",
    });
    idx++;
  }

  if (needsDesign) {
    seeds.push({
      title: "UI / UX Design",
      description: "Design responsive layouts, component structure, and visual style",
      domain: "design",
      skills: ["UI design", "Figma", "prototyping"],
      budgetWeight: 0.25,
      dependencies: needsCopy ? [seeds.length - 1] : needsResearch ? [0] : [],
      estimatedDuration: "~4 min",
    });
    idx++;
  }

  if (needsFrontend) {
    const deps = [];
    if (needsDesign) deps.push(seeds.length - 1);
    if (needsCopy && !needsDesign) deps.push(seeds.length - 1);
    seeds.push({
      title: "Frontend Development",
      description: "Implement pixel-perfect React components with full interactivity",
      domain: "coding",
      skills: ["React", "Next.js", "TypeScript", "frontend"],
      budgetWeight: 0.30,
      dependencies: deps,
      estimatedDuration: "~5 min",
    });
    idx++;
  }

  if (needsBackend) {
    seeds.push({
      title: "Backend & API",
      description: "Build API endpoints, database schema, and server logic",
      domain: "coding",
      skills: ["Node.js", "API", "database", "backend"],
      budgetWeight: 0.25,
      dependencies: needsResearch ? [0] : [],
      estimatedDuration: "~5 min",
    });
    idx++;
  }

  if (needsData) {
    const deps = needsFrontend || needsBackend ? [seeds.length - 1] : [];
    seeds.push({
      title: "Data & Analytics",
      description: "Build data pipelines, dashboards, and analytics reporting",
      domain: "data",
      skills: ["data analysis", "Python", "SQL", "visualization"],
      budgetWeight: 0.20,
      dependencies: deps,
      estimatedDuration: "~4 min",
    });
    idx++;
  }

  if (needsTesting) {
    seeds.push({
      title: "QA & Testing",
      description: "Write automated tests, perform end-to-end QA validation",
      domain: "testing",
      skills: ["testing", "QA", "automation"],
      budgetWeight: 0.15,
      dependencies: seeds.map((_, i) => i).slice(-2), // depends on last 2 subtasks
      estimatedDuration: "~3 min",
    });
    idx++;
  }

  // Fallback: generic research + coding
  if (seeds.length === 0) {
    seeds.push(
      {
        title: "Research & Planning",
        description: "Analyse the task and produce a structured execution plan",
        domain: "research",
        skills: ["research", "analysis"],
        budgetWeight: 0.3,
        dependencies: [],
        estimatedDuration: "~2 min",
      },
      {
        title: "Implementation",
        description: "Execute core deliverables based on the plan",
        domain: "coding",
        skills: ["JavaScript", "HTML", "CSS"],
        budgetWeight: 0.7,
        dependencies: [0],
        estimatedDuration: "~5 min",
      }
    );
  }

  return seeds;
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

function scoreAgent(
  agent: MockAgentTemplate,
  domain: string,
  requiredSkills: string[],
  budgetAllocation: number
): ScoredOption {
  const reputationNorm = agent.reputation / 100;
  const domainMatch = agent.domain === domain ? 1 : 0.3;
  const agentSkillSet = new Set(agent.skills.map((s) => s.toLowerCase()));
  const skillMatchCount = requiredSkills.filter((s) =>
    agentSkillSet.has(s.toLowerCase())
  ).length;
  const specificSkillMatch =
    requiredSkills.length > 0 ? skillMatchCount / requiredSkills.length : 1;
  const skillMatchFinal = domainMatch * 0.7 + specificSkillMatch * 0.3;
  const score =
    reputationNorm * 0.6 + agent.successRate * 0.25 + skillMatchFinal * 0.15;
  const isWithinBudget = agent.costPerTask <= budgetAllocation;
  const costRatio = agent.costPerTask / budgetAllocation;

  return {
    agent,
    score: Math.min(Math.max(score, 0), 1),
    breakdown: {
      reputation: reputationNorm,
      successRate: agent.successRate,
      domainMatch: skillMatchFinal,
    },
    costRatio,
    isWithinBudget,
    isSelected: false,
    selectionReason: "",
  };
}

function buildSelectionReason(
  option: ScoredOption,
  allOptions: ScoredOption[],
  isSelected: boolean
): string {
  if (!isSelected) {
    const selected = allOptions.find((o) => o.isSelected);
    if (!selected) return "Not selected";
    const scoreDiff = Math.round((selected.score - option.score) * 100);
    const costDiff = Math.round(((selected.agent.costPerTask - option.agent.costPerTask) / option.agent.costPerTask) * 100);
    if (!option.isWithinBudget)
      return `Exceeds subtask budget by ${Math.round((option.agent.costPerTask - option.agent.costPerTask) * 100) / 100} USDC`;
    return scoreDiff > 0
      ? `${scoreDiff}% lower quality score vs selected`
      : `${Math.abs(costDiff)}% cheaper but lower trust score`;
  }
  const cheaper = allOptions.filter(
    (o) => !o.isSelected && o.isWithinBudget && o.agent.costPerTask < option.agent.costPerTask
  );
  if (cheaper.length > 0) {
    const bestCheaper = cheaper.sort((a, b) => b.score - a.score)[0];
    const scoreDiff = Math.round((option.score - bestCheaper.score) * 100);
    return `Best score within budget — ${scoreDiff}% higher quality than cheaper alternative`;
  }
  return "Best available score within your budget";
}

// ─── Main Orchestration ───────────────────────────────────────────────────────

export function orchestratePlan(prompt: string, totalBudget: number): OrchestrationPlan {
  const seeds = parsePromptToSeeds(prompt);

  // Normalize budget weights
  const totalWeight = seeds.reduce((s, t) => s + t.budgetWeight, 0);

  const subtasks: SubtaskPlan[] = seeds.map((seed, i) => {
    const allocation = (seed.budgetWeight / totalWeight) * totalBudget;

    // Get all agents for this domain (sorted by model quality)
    const candidates = AGENT_POOL.filter((a) => a.domain === seed.domain);

    // Score each candidate
    const scored = candidates
      .map((agent) => scoreAgent(agent, seed.domain, seed.skills, allocation))
      .sort((a, b) => {
        // Primary: within budget; Secondary: score; Tertiary: cost
        if (a.isWithinBudget !== b.isWithinBudget)
          return a.isWithinBudget ? -1 : 1;
        if (Math.abs(b.score - a.score) > 0.02) return b.score - a.score;
        return a.agent.costPerTask - b.agent.costPerTask;
      });

    // Select best within budget
    const selected = scored.find((s) => s.isWithinBudget) ?? scored[0];
    const withSelection = scored.map((o) => ({
      ...o,
      isSelected: o.agent.id === selected.agent.id,
    }));

    // Build reasons after selection info is set
    const withReasons = withSelection.map((o) => ({
      ...o,
      selectionReason: buildSelectionReason(o, withSelection, o.isSelected),
    }));

    const selectedFinal = withReasons.find((o) => o.isSelected)!;

    return {
      id: `st_${i}`,
      title: seed.title,
      description: seed.description,
      domain: seed.domain,
      requiredSkills: seed.skills,
      budgetAllocation: Math.round(allocation * 100) / 100,
      options: withReasons,
      selectedOption: selectedFinal,
      dependencies: seed.dependencies.map((d) => `st_${d}`),
      estimatedDuration: seed.estimatedDuration,
    };
  });

  const totalCost = subtasks.reduce((s, t) => s + t.selectedOption.agent.costPerTask, 0);
  const budgetUtilization = Math.min(Math.round((totalCost / totalBudget) * 100), 100);

  // Build DAG levels (BFS topological sort)
  const dagLevels = buildDAGLevels(subtasks);

  return {
    subtasks,
    totalCost,
    budgetUtilization,
    dagLevels,
    summary: buildSummary(subtasks, totalCost, totalBudget),
  };
}

function buildDAGLevels(subtasks: SubtaskPlan[]): string[][] {
  const levels: string[][] = [];
  const resolved = new Set<string>();

  while (resolved.size < subtasks.length) {
    const level = subtasks
      .filter(
        (st) =>
          !resolved.has(st.id) &&
          st.dependencies.every((dep) => resolved.has(dep))
      )
      .map((st) => st.id);

    if (level.length === 0) break; // prevent infinite loop on cycles
    levels.push(level);
    level.forEach((id) => resolved.add(id));
  }

  return levels;
}

function buildSummary(subtasks: SubtaskPlan[], totalCost: number, budget: number): string {
  const domains = [...new Set(subtasks.map((st) => st.domain))];
  const models = [...new Set(subtasks.map((st) => st.selectedOption.agent.model))];
  const savings = Math.round(budget - totalCost);
  return `${subtasks.length} subtasks across ${domains.length} domains · ${models.length} model${models.length > 1 ? "s" : ""} · ${savings > 0 ? `saving $${savings} USDC` : "fully utilizing budget"}`;
}

// ─── Execution Simulation ─────────────────────────────────────────────────────

export interface ExecutionState {
  subtaskId: string;
  status: "pending" | "running" | "completed" | "failed";
  output?: string;
  proofHash?: string;
  completedAt?: string;
}

export function simulateExecution(
  subtasks: SubtaskPlan[],
  dagLevels: string[][],
  onUpdate: (states: ExecutionState[]) => void
): () => void {
  const states: ExecutionState[] = subtasks.map((st) => ({
    subtaskId: st.id,
    status: "pending",
  }));

  onUpdate([...states]);

  let cancelled = false;
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async function run() {
    for (const level of dagLevels) {
      if (cancelled) return;

      // Start all tasks in this level
      for (const id of level) {
        const idx = states.findIndex((s) => s.subtaskId === id);
        states[idx].status = "running";
      }
      onUpdate([...states]);

      // Simulate each running with random duration
      await Promise.all(
        level.map(async (id) => {
          const duration = 1500 + Math.random() * 2500;
          await delay(duration);
          if (cancelled) return;
          const idx = states.findIndex((s) => s.subtaskId === id);
          const st = subtasks.find((s) => s.id === id)!;
          states[idx].status = "completed";
          states[idx].output = generateMockOutput(st);
          states[idx].proofHash = `0x${Math.random().toString(16).slice(2, 18)}…`;
          states[idx].completedAt = new Date().toISOString();
          onUpdate([...states]);
        })
      );
    }
  }

  run();
  return () => { cancelled = true; };
}

function generateMockOutput(st: SubtaskPlan): string {
  const outputs: Record<string, string> = {
    writing: "✓ Compelling copy with headline, value proposition, and 3-paragraph body text generated. SEO-optimized with target keywords embedded.",
    design: "✓ Responsive layout with 4 sections (hero, features, pricing, CTA). Mobile-first design system with consistent color palette.",
    coding: "✓ React component tree with 8 components. Tailwind CSS styling. TypeScript types defined. 94% Lighthouse score.",
    research: "✓ Competitive analysis complete. 12 key insights. User persona defined. Feature priority matrix ready.",
    testing: "✓ 24 unit tests passing. E2E smoke tests green. 0 critical bugs found. Performance budget met.",
    data: "✓ Data pipeline built. 3 dashboard widgets. Real-time KPI tracking. Export to CSV/PDF enabled.",
  };
  return outputs[st.domain] ?? "✓ Task completed successfully.";
}
