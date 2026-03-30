/**
 * Agent Scoring Engine
 *
 * Scores agents using the formula:
 *   score = (reputation * 0.6) + (successRate * 0.25) + (skillMatch * 0.15)
 *
 * All components normalized to 0-1 range before weighting.
 */

import { Agent } from "@/lib/store/inMemoryStore";

export interface ScoredAgent {
  agent: Agent;
  score: number;         // 0-1
  breakdown: {
    reputation: number;  // 0-1 normalized
    successRate: number; // 0-1
    skillMatch: number;  // 0-1
  };
}

/**
 * Score a single agent against a required domain and optional required skills.
 *
 * @param agent       - Agent to score
 * @param domain      - Required domain (e.g. "coding", "research")
 * @param requiredSkills - Optional specific skills to match
 * @param successRateOverride - If chain reputation available, pass in [0,1]
 */
export function scoreAgent(
  agent: Agent,
  domain: string,
  requiredSkills: string[] = [],
  successRateOverride?: number
): ScoredAgent {
  // ── Reputation component (0-1) ──────────────────────────────────────────
  // Agent reputation is 0-5 stars → normalize to 0-1
  const reputationNorm = Math.min(agent.reputationScore / 5, 1);

  // ── Success rate (0-1) ───────────────────────────────────────────────────
  // Use chain data if available, otherwise estimate from reputation
  const successRate =
    successRateOverride !== undefined
      ? successRateOverride
      : (agent.reputationScore - 1) / 4; // rough estimate: 1-5 → 0-1

  // ── Skill match (0-1) ────────────────────────────────────────────────────
  let skillMatch = 0;

  // Domain match is primary (0.7 weight within skill component)
  const domainMatch = agent.domain === domain ? 1 : 0;

  // Specific skill matches (0.3 weight)
  let specificMatch = 0;
  if (requiredSkills.length > 0) {
    const agentSkillSet = new Set(agent.skills.map((s) => s.toLowerCase()));
    const matched = requiredSkills.filter((s) =>
      agentSkillSet.has(s.toLowerCase())
    ).length;
    specificMatch = matched / requiredSkills.length;
  } else {
    specificMatch = 1; // no specific skills required → full match
  }

  skillMatch = domainMatch * 0.7 + specificMatch * 0.3;

  // ── Weighted final score ─────────────────────────────────────────────────
  const score =
    reputationNorm * 0.6 +
    successRate * 0.25 +
    skillMatch * 0.15;

  return {
    agent,
    score: Math.min(Math.max(score, 0), 1), // clamp 0-1
    breakdown: {
      reputation: reputationNorm,
      successRate,
      skillMatch,
    },
  };
}

/**
 * Score and rank all agents for a given domain.
 * Returns agents sorted by score (highest first), filtered by budget.
 */
export function rankAgentsForDomain(
  agents: Agent[],
  domain: string,
  budgetLimit: number,
  requiredSkills: string[] = [],
  chainReputations: Map<string, number> = new Map()
): ScoredAgent[] {
  return agents
    .map((agent) =>
      scoreAgent(
        agent,
        domain,
        requiredSkills,
        chainReputations.get(agent.id)
      )
    )
    .filter((sa) => sa.agent.hourlyRate <= budgetLimit)
    .sort((a, b) => b.score - a.score);
}

// Fallback map: if planner returns an unlisted domain, route it to the best agent
const DOMAIN_FALLBACK: Record<string, string> = {
  writing:    "research",   // → Grok Oracle
  data:       "research",   // → Grok Oracle
  testing:    "coding",     // → Qwen Architect
  devops:     "filesystem", // → Filesystem Worker
  web_search: "research",   // → Grok Oracle
  blockchain: "crypto_monad",
  web3:       "crypto_monad",
};

/**
 * Select the best agent for each subtask domain within budget constraints.
 * Uses a greedy approach: assign best-scored agent per domain.
 */
export function selectAgentsForPlan(
  agents: Agent[],
  subtaskDomains: Array<{ subtaskId: string; domain: string; budget: number }>,
  chainReputations: Map<string, number> = new Map()
): Map<string, ScoredAgent> {
  const assignments = new Map<string, ScoredAgent>();

  for (const { subtaskId, budget } of subtaskDomains) {
    // Resolve domain alias if needed
    const rawDomain = subtaskDomains.find(s => s.subtaskId === subtaskId)?.domain ?? "research";
    const domain = DOMAIN_FALLBACK[rawDomain] ?? rawDomain;
    const ranked = rankAgentsForDomain(
      agents,
      domain,
      budget,
      [],
      chainReputations
    );
    if (ranked.length > 0) {
      assignments.set(subtaskId, ranked[0]);
    }
  }

  return assignments;
}
