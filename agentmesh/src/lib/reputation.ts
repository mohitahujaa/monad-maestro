/**
 * Reputation Engine — scores agents 0-100 across 12 parameters.
 * Stored in globalThis so it survives HMR in dev.
 */

export interface ReputationRecord {
  agentId: string;
  // Raw counters
  tasksCompleted: number;
  tasksAttempted: number;
  successfulTasks: number;
  failedTasks: number;
  totalBudgetAllocated: number;
  totalBudgetUsed: number;
  totalDeadlineGivenMs: number;
  totalTimeUsedMs: number;
  proofsSubmitted: number;
  proofsVerified: number;
  userRatingsSum: number;
  userRatingsCount: number;
  disputesRaised: number;
  disputesLost: number;
  collaborationAttempts: number;
  collaborationSuccesses: number;
  retryCount: number;
  validatorApprovals: number;
  validatorTotal: number;
  externalProofs: number; // GitHub commits, file artifacts, etc.
  // Computed
  reputationScore: number; // 0-100
  lastUpdated: string;
}

export interface ReputationUpdate {
  success: boolean;
  budgetAllocated?: number;
  budgetUsed?: number;
  deadlineMs?: number;
  timeUsedMs?: number;
  proofVerified?: boolean;
  userRating?: number; // 1-5
  dispute?: boolean;
  disputeLost?: boolean;
  collaborated?: boolean;
  collaborationSuccess?: boolean;
  retries?: number;
  validatorApproved?: boolean;
  externalProof?: boolean;
}

// ─── Score Calculation ────────────────────────────────────────────────────────

function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, val));
}

export function calculateScore(r: ReputationRecord): number {
  const weights = {
    successRate:          0.20, // Tasks completed successfully / attempted
    deadlinePerformance:  0.10, // Time used vs deadline
    budgetAccuracy:       0.10, // Budget used vs allocated (closer = better)
    proofVerification:    0.12, // Proofs verified / submitted
    userRating:           0.12, // Average user rating (1-5 → 0-100)
    disputes:             0.08, // Penalise disputes lost
    collaborationSuccess: 0.06, // Collaboration wins
    costEfficiency:       0.08, // Under-budget execution
    retryPenalty:         0.06, // Fewer retries = better
    validatorApprovals:   0.05, // On-chain validator approvals
    externalProofs:       0.03, // GitHub/file proof bonus (capped)
  };

  // 1. Success rate (0-100)
  const successRate = r.tasksAttempted > 0
    ? (r.successfulTasks / r.tasksAttempted) * 100 : 50;

  // 2. Deadline performance (0-100) — under deadline = 100, double = 0
  const deadlineRatio = r.totalDeadlineGivenMs > 0
    ? r.totalTimeUsedMs / r.totalDeadlineGivenMs : 1;
  const deadlineScore = clamp((2 - deadlineRatio) * 100);

  // 3. Budget accuracy (0-100) — exact match = 100, over = penalty
  const budgetRatio = r.totalBudgetAllocated > 0
    ? r.totalBudgetUsed / r.totalBudgetAllocated : 1;
  const budgetAccuracy = clamp((1.5 - Math.abs(budgetRatio - 1)) * 100);

  // 4. Proof verification (0-100)
  const proofScore = r.proofsSubmitted > 0
    ? (r.proofsVerified / r.proofsSubmitted) * 100 : 70;

  // 5. User rating (0-100)
  const avgRating = r.userRatingsCount > 0
    ? r.userRatingsSum / r.userRatingsCount : 3.5;
  const userScore = ((avgRating - 1) / 4) * 100;

  // 6. Dispute score (0-100) — disputes lost are heavy penalties
  const disputeScore = clamp(100 - (r.disputesLost * 25) - (r.disputesRaised * 5));

  // 7. Collaboration score (0-100)
  const collabScore = r.collaborationAttempts > 0
    ? (r.collaborationSuccesses / r.collaborationAttempts) * 100 : 70;

  // 8. Cost efficiency — finishing under budget is rewarded
  const costScore = budgetRatio <= 1 ? clamp((1 - budgetRatio + 1) * 50) : clamp((2 - budgetRatio) * 50);

  // 9. Retry penalty (0-100) — more retries = lower score
  const retryScore = clamp(100 - (r.retryCount * 5));

  // 10. Validator approvals (0-100)
  const validatorScore = r.validatorTotal > 0
    ? (r.validatorApprovals / r.validatorTotal) * 100 : 70;

  // 11. External proofs bonus (0-100, capped at 10 proofs for max)
  const externalProofScore = clamp((r.externalProofs / 10) * 100);

  const raw =
    successRate          * weights.successRate +
    deadlineScore        * weights.deadlinePerformance +
    budgetAccuracy       * weights.budgetAccuracy +
    proofScore           * weights.proofVerification +
    userScore            * weights.userRating +
    disputeScore         * weights.disputes +
    collabScore          * weights.collaborationSuccess +
    costScore            * weights.costEfficiency +
    retryScore           * weights.retryPenalty +
    validatorScore       * weights.validatorApprovals +
    externalProofScore   * weights.externalProofs;

  return Math.round(clamp(raw) * 10) / 10; // 1 decimal place
}

// ─── Store ────────────────────────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __agentmesh_reputation: Map<string, ReputationRecord> | undefined;
}

export const reputationStore: Map<string, ReputationRecord> =
  globalThis.__agentmesh_reputation ??
  (globalThis.__agentmesh_reputation = new Map());

if (process.env.NODE_ENV !== "production") {
  globalThis.__agentmesh_reputation = reputationStore;
}

function getOrCreate(agentId: string): ReputationRecord {
  if (!reputationStore.has(agentId)) {
    reputationStore.set(agentId, {
      agentId,
      tasksCompleted: 0,
      tasksAttempted: 0,
      successfulTasks: 0,
      failedTasks: 0,
      totalBudgetAllocated: 0,
      totalBudgetUsed: 0,
      totalDeadlineGivenMs: 0,
      totalTimeUsedMs: 0,
      proofsSubmitted: 0,
      proofsVerified: 0,
      userRatingsSum: 0,
      userRatingsCount: 0,
      disputesRaised: 0,
      disputesLost: 0,
      collaborationAttempts: 0,
      collaborationSuccesses: 0,
      retryCount: 0,
      validatorApprovals: 0,
      validatorTotal: 0,
      externalProofs: 0,
      reputationScore: 70, // default starting score
      lastUpdated: new Date().toISOString(),
    });
  }
  return reputationStore.get(agentId)!;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getReputation(agentId: string): ReputationRecord {
  return getOrCreate(agentId);
}

export function updateReputation(agentId: string, update: ReputationUpdate): ReputationRecord {
  const r = getOrCreate(agentId);

  r.tasksAttempted++;
  if (update.retries) r.retryCount += update.retries;

  if (update.success) {
    r.successfulTasks++;
    r.tasksCompleted++;
  } else {
    r.failedTasks++;
  }

  if (update.budgetAllocated) r.totalBudgetAllocated += update.budgetAllocated;
  if (update.budgetUsed)      r.totalBudgetUsed      += update.budgetUsed;
  if (update.deadlineMs)      r.totalDeadlineGivenMs += update.deadlineMs;
  if (update.timeUsedMs)      r.totalTimeUsedMs      += update.timeUsedMs;

  if (update.proofVerified !== undefined) {
    r.proofsSubmitted++;
    if (update.proofVerified) r.proofsVerified++;
  }

  if (update.userRating) {
    r.userRatingsSum   += update.userRating;
    r.userRatingsCount += 1;
  }

  if (update.dispute)     r.disputesRaised++;
  if (update.disputeLost) r.disputesLost++;

  if (update.collaborated !== undefined) {
    r.collaborationAttempts++;
    if (update.collaborationSuccess) r.collaborationSuccesses++;
  }

  if (update.validatorApproved !== undefined) {
    r.validatorTotal++;
    if (update.validatorApproved) r.validatorApprovals++;
  }

  if (update.externalProof) r.externalProofs++;

  // Recalculate score
  r.reputationScore = calculateScore(r);
  r.lastUpdated = new Date().toISOString();

  reputationStore.set(agentId, r);
  return r;
}
