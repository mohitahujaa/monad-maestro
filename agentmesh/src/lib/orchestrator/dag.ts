/**
 * DAG (Directed Acyclic Graph) Builder for Task Execution
 *
 * Builds an execution plan with dependency tracking.
 * Subtasks with no pending dependencies run in parallel.
 * Subtasks with dependencies wait for their predecessors.
 */

import { PlanSubtask } from "@/lib/store/inMemoryStore";

export interface DAGNode {
  id: string;           // subtask id (plan id: st_1, st_2 etc.)
  title: string;
  domain: string;
  estimatedCost: number;
  dependencies: string[];  // ids this node depends on
  dependents: string[];    // ids that depend on this node
  level: number;           // 0 = can run immediately
  status: "pending" | "ready" | "running" | "completed" | "failed";
}

export interface TaskDAG {
  nodes: Map<string, DAGNode>;
  levels: string[][];    // nodes grouped by execution level (level[0] runs first)
  criticalPath: string[];
  estimatedParallelism: number; // max nodes running simultaneously
}

/**
 * Build a DAG from the planner's subtask list.
 * Uses Kahn's algorithm for topological sort + level assignment.
 */
export function buildDAG(subtasks: PlanSubtask[]): TaskDAG {
  const nodes = new Map<string, DAGNode>();

  // Initialize nodes
  for (const st of subtasks) {
    nodes.set(st.id, {
      id: st.id,
      title: st.title,
      domain: st.assigned_agent_domain,
      estimatedCost: st.estimated_cost_usdc,
      dependencies: [...st.dependencies],
      dependents: [],
      level: 0,
      status: "pending",
    });
  }

  // Build reverse edges (dependents)
  for (const node of nodes.values()) {
    for (const depId of node.dependencies) {
      const dep = nodes.get(depId);
      if (dep) {
        dep.dependents.push(node.id);
      }
    }
  }

  // Assign levels (BFS)
  const levels: string[][] = [];
  const visited = new Set<string>();
  const inDegree = new Map<string, number>();

  for (const node of nodes.values()) {
    inDegree.set(node.id, node.dependencies.length);
  }

  // Level 0: nodes with no dependencies
  let currentLevel: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) {
      currentLevel.push(id);
      const node = nodes.get(id)!;
      node.level = 0;
      node.status = "ready";
    }
  }

  let levelIdx = 0;
  while (currentLevel.length > 0) {
    levels.push([...currentLevel]);
    const nextLevel: string[] = [];

    for (const id of currentLevel) {
      visited.add(id);
      const node = nodes.get(id)!;

      for (const dependentId of node.dependents) {
        const newDeg = (inDegree.get(dependentId) ?? 0) - 1;
        inDegree.set(dependentId, newDeg);

        if (newDeg === 0 && !visited.has(dependentId)) {
          nextLevel.push(dependentId);
          const depNode = nodes.get(dependentId)!;
          depNode.level = levelIdx + 1;
        }
      }
    }

    currentLevel = nextLevel;
    levelIdx++;
  }

  // Detect cycles: any node not in levels
  for (const id of nodes.keys()) {
    if (!visited.has(id)) {
      // Cycle detected — add to last level as fallback
      const node = nodes.get(id)!;
      node.level = levelIdx;
      if (levels[levelIdx]) {
        levels[levelIdx].push(id);
      } else {
        levels.push([id]);
      }
    }
  }

  // Critical path: longest chain by cost
  const criticalPath = findCriticalPath(nodes, levels);

  const maxParallelism = Math.max(...levels.map((l) => l.length), 1);

  return { nodes, levels, criticalPath, estimatedParallelism: maxParallelism };
}

/**
 * Find the critical path through the DAG (most expensive sequential chain).
 */
function findCriticalPath(
  nodes: Map<string, DAGNode>,
  levels: string[][]
): string[] {
  // DP: for each node, find max cost path from any source
  const maxCost = new Map<string, number>();
  const predecessor = new Map<string, string | null>();

  for (const level of levels) {
    for (const id of level) {
      const node = nodes.get(id)!;
      let best = 0;
      let bestPred: string | null = null;

      for (const depId of node.dependencies) {
        const depCost = maxCost.get(depId) ?? 0;
        const depNode = nodes.get(depId)!;
        if (depCost + depNode.estimatedCost > best) {
          best = depCost + depNode.estimatedCost;
          bestPred = depId;
        }
      }

      maxCost.set(id, best + node.estimatedCost);
      predecessor.set(id, bestPred);
    }
  }

  // Find end node with highest total cost
  let maxId = "";
  let maxVal = 0;
  for (const [id, cost] of maxCost) {
    if (cost > maxVal) {
      maxVal = cost;
      maxId = id;
    }
  }

  // Trace back
  const path: string[] = [];
  let curr: string | null = maxId;
  while (curr) {
    path.unshift(curr);
    curr = predecessor.get(curr) ?? null;
  }

  return path;
}

/**
 * Get nodes ready to execute (all dependencies completed).
 */
export function getReadyNodes(dag: TaskDAG): DAGNode[] {
  return Array.from(dag.nodes.values()).filter(
    (node) =>
      node.status === "ready" ||
      (node.status === "pending" &&
        node.dependencies.every((depId) => {
          const dep = dag.nodes.get(depId);
          return dep?.status === "completed";
        }))
  );
}

/**
 * Convert levels array to subtask ID groups for frontend visualization.
 * Each inner array represents a parallel execution batch.
 */
export function levelsToGroups(
  levels: string[][],
  nodes: Map<string, DAGNode>
): Array<Array<{ id: string; title: string; domain: string; level: number }>> {
  return levels.map((level) =>
    level.map((id) => {
      const node = nodes.get(id)!;
      return {
        id,
        title: node.title,
        domain: node.domain,
        level: node.level,
      };
    })
  );
}
