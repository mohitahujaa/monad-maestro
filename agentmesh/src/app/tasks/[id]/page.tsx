"use client";

import { useEffect, useState, use } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Info,
  XCircle,
  ExternalLink,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";

const MONAD_EXPLORER = "https://testnet.monadexplorer.com/tx/";
const HARDHAT_EXPLORER = null; // local, no explorer

function TxLink({ txHash }: { txHash: string | null | undefined }) {
  if (!txHash) return <span className="text-xs text-muted-foreground">—</span>;
  const short = txHash.slice(0, 10) + "..." + txHash.slice(-6);
  const href = MONAD_EXPLORER + txHash;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-xs font-mono text-blue-600 hover:underline"
    >
      {short}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    completed: "bg-green-100 text-green-800 border-green-300",
    failed: "bg-red-100 text-red-800 border-red-300",
    running: "bg-blue-100 text-blue-800 border-blue-300 animate-pulse",
    paused: "bg-yellow-100 text-yellow-800 border-yellow-300",
    pending: "bg-gray-100 text-gray-600 border-gray-300",
    planning: "bg-purple-100 text-purple-800 border-purple-300",
    approved: "bg-cyan-100 text-cyan-800 border-cyan-300",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-semibold ${
        variants[status] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {status.toUpperCase()}
    </span>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DAGVisualization({ task }: { task: any }) {
  if (!task.dagLevels?.length || !task.subtasks?.length) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subtaskMap: Record<string, any> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const st of task.subtasks as any[]) subtaskMap[st.id] = st;

  const domainColors: Record<string, string> = {
    research: "bg-blue-50 border-blue-300 text-blue-800",
    coding: "bg-green-50 border-green-300 text-green-800",
    design: "bg-pink-50 border-pink-300 text-pink-800",
    writing: "bg-yellow-50 border-yellow-300 text-yellow-800",
    testing: "bg-orange-50 border-orange-300 text-orange-800",
    data: "bg-purple-50 border-purple-300 text-purple-800",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Execution DAG</CardTitle>
        <CardDescription>
          Task dependency graph — left to right, level by level
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {(task.dagLevels as string[][]).map((level, levelIdx) => (
            <div key={levelIdx} className="flex flex-col gap-3 min-w-[160px]">
              <div className="text-xs text-center text-muted-foreground font-mono mb-1">
                Level {levelIdx + 1}
                {levelIdx === 0 && (
                  <span className="ml-1 text-green-600">(start)</span>
                )}
              </div>
              {level.map((stId) => {
                const st = subtaskMap[stId];
                if (!st) return null;
                const colorClass =
                  domainColors[st.agentId?.includes("research") ? "research" : "data"] ??
                  "bg-gray-50 border-gray-300 text-gray-800";
                return (
                  <div
                    key={stId}
                    className={`relative border rounded-md p-2 text-xs ${colorClass}`}
                  >
                    <div className="font-semibold truncate">{st.title}</div>
                    <div className="flex items-center justify-between mt-1">
                      <StatusBadge status={st.status} />
                      <span className="text-xs opacity-70">${st.estimatedCost}</span>
                    </div>
                    {st.agentScore && (
                      <div className="text-xs opacity-60 mt-0.5">
                        score={st.agentScore.toFixed(2)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t">
          {Object.entries(domainColors).map(([domain, cls]) => (
            <span
              key={domain}
              className={`text-xs px-2 py-0.5 border rounded ${cls}`}
            >
              {domain}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const taskId = unwrappedParams.id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [task, setTask] = useState<any>(null);

  useEffect(() => {
    const fetchTask = () => {
      fetch(`/api/tasks/${taskId}`)
        .then((res) => res.json())
        .then((data) => setTask(data))
        .catch(console.error);
    };
    fetchTask();
    const interval = setInterval(fetchTask, 3000);
    return () => clearInterval(interval);
  }, [taskId]);

  if (!task) {
    return <div className="p-8 text-center text-muted-foreground">Loading task...</div>;
  }

  const handleApprove = async () => {
    try {
      await fetch(`/api/tasks/${taskId}/approve`, { method: "POST" });
      await fetch(`/api/tasks/${taskId}/execute`, { method: "POST" });
      setTask({ ...task, status: "running" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleResume = async () => {
    try {
      await fetch(`/api/tasks/${taskId}/resume`, { method: "POST" });
      setTask({ ...task, status: "running" });
    } catch (err) {
      console.error(err);
    }
  };

  const spentPercent = Math.min(
    (task.spentBudget / task.totalBudget) * 100,
    100
  );
  const progressColorClass =
    spentPercent > 85
      ? "[&_[data-slot='progress-indicator']]:bg-red-500"
      : spentPercent > 60
      ? "[&_[data-slot='progress-indicator']]:bg-yellow-500"
      : "[&_[data-slot='progress-indicator']]:bg-green-500";

  const completedSubtasks =
    task.subtasks?.filter((s: { status: string }) => s.status === "completed")
      .length ?? 0;
  const totalSubtasks = task.subtasks?.length ?? 0;

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex justify-between items-start border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold">{task.title}</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            {task.description}
          </p>
          <div className="flex items-center gap-3 mt-3">
            <StatusBadge status={task.status} />
            {task.escrowTxHash && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-500" />
                Escrow: <TxLink txHash={task.escrowTxHash} />
              </span>
            )}
          </div>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <p>Created {new Date(task.createdAt).toLocaleString()}</p>
          <p className="mt-1">
            {completedSubtasks}/{totalSubtasks} subtasks
          </p>
        </div>
      </div>

      {/* ── Budget Meter ──────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-end">
            <CardTitle>Budget Meter</CardTitle>
            <span className="text-xs text-muted-foreground">
              ${(task.totalBudget - task.spentBudget).toFixed(2)} remaining
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress
            value={spentPercent}
            className={`h-3 mb-2 ${progressColorClass}`}
          />
          <div className="flex justify-between text-sm">
            <span className="font-medium">
              ${task.spentBudget.toFixed(2)} spent
            </span>
            <span className="text-muted-foreground">
              of ${task.totalBudget.toFixed(2)} total
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── Pause Alert ────────────────────────────────────────────── */}
      {task.status === "paused" && (
        <Alert variant="destructive" className="border-red-600 bg-red-50">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-800 font-bold">
            Task Paused by Supervisor
          </AlertTitle>
          <AlertDescription className="text-red-700 flex justify-between items-center">
            <span>
              The supervisor detected an issue requiring human review.
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResume}
              className="mt-2 text-foreground"
            >
              Acknowledge &amp; Resume
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ── Plan Approval ──────────────────────────────────────────── */}
      {task.status === "planning" && task.planJson && (
        <Card className="border-blue-200 shadow-sm">
          <CardHeader className="bg-blue-50/50">
            <CardTitle className="text-blue-900">Plan Review</CardTitle>
            <CardDescription>
              Planner Agent decomposed your task. Review the DAG and approve to start execution.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-muted p-3 rounded-md">
                <span className="block text-muted-foreground mb-1 text-xs">
                  Est. Total Cost
                </span>
                <span className="font-semibold text-lg">
                  ${task.planJson.total_estimated_cost}
                </span>
              </div>
              <div className="bg-muted p-3 rounded-md">
                <span className="block text-muted-foreground mb-1 text-xs">
                  Confidence
                </span>
                <span className="font-semibold text-lg text-green-600">
                  {task.planJson.confidence_score}%
                </span>
              </div>
              <div className="bg-muted p-3 rounded-md">
                <span className="block text-muted-foreground mb-1 text-xs">
                  Subtasks
                </span>
                <span className="font-semibold text-lg">
                  {task.planJson.subtasks.length}
                </span>
              </div>
              <div className="bg-muted p-3 rounded-md">
                <span className="block text-muted-foreground mb-1 text-xs">
                  DAG Levels
                </span>
                <span className="font-semibold text-lg">
                  {task.dagLevels?.length ?? "—"}
                </span>
              </div>
            </div>

            {task.planJson.risks?.length > 0 && (
              <div className="text-sm border-l-4 border-yellow-500 pl-4 py-1">
                <span className="font-bold text-yellow-700">
                  Identified Risks:
                </span>
                <ul className="list-disc pl-5 text-muted-foreground mt-1">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {task.planJson.risks.map((risk: any, i: number) => (
                    <li key={i}>{risk}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Agent Assignments */}
            {task.selectedAgents?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-sm">
                  Agent Assignments (scored by Orchestrator)
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subtask</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Est. Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {task.selectedAgents.map((sa: any) => (
                      <TableRow key={sa.subtaskId}>
                        <TableCell className="font-mono text-xs">
                          {sa.subtaskId}
                        </TableCell>
                        <TableCell className="font-medium">
                          {sa.agentName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{sa.domain}</Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              sa.score > 0.7
                                ? "text-green-600 font-semibold"
                                : sa.score > 0.4
                                ? "text-yellow-600 font-semibold"
                                : "text-red-600 font-semibold"
                            }
                          >
                            {(sa.score * 100).toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell>${sa.estimatedCost}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <Button onClick={handleApprove} className="w-full h-12 text-base">
              Approve Plan &amp; Start Execution on Monad
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── DAG Visualization ──────────────────────────────────────── */}
      <DAGVisualization task={task} />

      {/* ── Tabs: Subtasks | Logs | Transactions | Alerts ─────────── */}
      <Tabs defaultValue="subtasks">
        <TabsList className="w-full">
          <TabsTrigger value="subtasks" className="flex-1">
            Subtasks ({completedSubtasks}/{totalSubtasks})
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex-1">
            Execution Logs ({task.logs?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex-1">
            Transactions ({task.txRecords?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex-1">
            Supervisor ({task.alerts?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        {/* Subtasks Tab */}
        <TabsContent value="subtasks" className="space-y-4 mt-4">
          {task.subtasks?.map((st: { id: string; status: string; title: string; description: string; estimatedCost: number; actualCost: number; retries: number; proof: string; proofType: string; output: string; agentScore: number; proofHash: string }, index: number) => (
            <Card
              key={st.id}
              className={
                st.status === "running"
                  ? "border-blue-500 shadow-md ring-1 ring-blue-400"
                  : st.status === "completed"
                  ? "border-green-300"
                  : st.status === "failed"
                  ? "border-red-300"
                  : ""
              }
            >
              <CardHeader className="py-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-muted-foreground font-mono text-sm">
                        #{index + 1}
                      </span>
                      <CardTitle className="text-base">{st.title}</CardTitle>
                      <StatusBadge status={st.status} />
                      {st.agentScore && (
                        <span className="text-xs text-muted-foreground">
                          score={st.agentScore.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <CardDescription>{st.description}</CardDescription>
                  </div>
                  <div className="text-right text-sm ml-4 shrink-0">
                    <div className="text-muted-foreground text-xs">
                      Est: ${st.estimatedCost}
                    </div>
                    <div
                      className={`font-semibold ${
                        st.actualCost > st.estimatedCost
                          ? "text-red-500"
                          : "text-green-600"
                      }`}
                    >
                      Actual: ${st.actualCost}
                    </div>
                    {st.retries > 0 && (
                      <div className="text-xs text-orange-500">
                        {st.retries} retries
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              {st.status === "completed" && (
                <CardContent className="py-0 pb-4 space-y-2">
                  <div className="bg-muted rounded-md p-3 text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="font-semibold">
                        Proof ({st.proofType})
                      </span>
                      {st.proofHash && (
                        <span className="text-xs font-mono text-muted-foreground ml-auto">
                          hash: {st.proofHash.slice(0, 14)}…
                        </span>
                      )}
                    </div>
                    <a
                      href={
                        st.proof?.startsWith("http") ? st.proof : undefined
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline break-all text-xs"
                    >
                      {st.proof}
                    </a>
                    {st.output && (
                      <div className="mt-2 border-t pt-2">
                        <p className="font-semibold text-xs text-muted-foreground mb-1">
                          Output Snippet:
                        </p>
                        <p className="line-clamp-3 text-muted-foreground bg-background rounded p-2 text-xs font-mono">
                          {st.output}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-1 max-h-[400px] overflow-y-auto font-mono text-xs pr-2">
                {task.logs?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No logs yet.
                  </p>
                ) : (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  [...(task.logs ?? [])].reverse().map((log: any) => (
                    <div
                      key={log.id}
                      className={`flex gap-2 items-start py-1 px-2 rounded ${
                        log.level === "error"
                          ? "bg-red-50 text-red-800"
                          : log.level === "warn"
                          ? "bg-yellow-50 text-yellow-800"
                          : log.level === "chain"
                          ? "bg-purple-50 text-purple-800"
                          : "bg-muted/50 text-foreground"
                      }`}
                    >
                      <span className="shrink-0 text-muted-foreground">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                      <span
                        className={`shrink-0 uppercase font-bold text-[10px] px-1 rounded ${
                          log.level === "error"
                            ? "bg-red-200"
                            : log.level === "warn"
                            ? "bg-yellow-200"
                            : log.level === "chain"
                            ? "bg-purple-200"
                            : "bg-gray-200"
                        }`}
                      >
                        {log.level}
                      </span>
                      <span className="flex-1 break-all">{log.message}</span>
                      {log.txHash && (
                        <TxLink txHash={log.txHash} />
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>On-Chain Transactions</CardTitle>
              <CardDescription>
                All Monad blockchain interactions for this task
              </CardDescription>
            </CardHeader>
            <CardContent>
              {task.txRecords?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 text-sm">
                  No on-chain transactions yet.
                  {task.status === "planning" && " Approve the plan to start."}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Tx Hash</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {task.txRecords?.map((tx: any) => (
                      <TableRow key={tx.txHash ?? tx.timestamp}>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              tx.type === "createEscrow"
                                ? "border-blue-400 text-blue-700"
                                : tx.type === "approveWork"
                                ? "border-green-400 text-green-700"
                                : tx.type === "submitProof"
                                ? "border-purple-400 text-purple-700"
                                : tx.type === "updateReputation"
                                ? "border-orange-400 text-orange-700"
                                : "border-gray-300"
                            }
                          >
                            {tx.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <TxLink txHash={tx.txHash} />
                        </TableCell>
                        <TableCell>
                          {tx.amount ? `$${tx.amount}` : "—"}
                        </TableCell>
                        <TableCell>
                          {tx.status === "confirmed" ? (
                            <span className="flex items-center gap-1 text-green-600 text-xs">
                              <CheckCircle2 className="w-3 h-3" />
                              confirmed
                            </span>
                          ) : tx.status === "pending" ? (
                            <span className="flex items-center gap-1 text-yellow-600 text-xs">
                              <Clock className="w-3 h-3" />
                              pending
                            </span>
                          ) : (
                            <span className="text-red-600 text-xs">failed</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(tx.timestamp).toLocaleTimeString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Escrow Summary */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Total Locked
                </div>
                <div className="text-xl font-bold">
                  ${task.totalBudget.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">USDC</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Released
                </div>
                <div className="text-xl font-bold text-green-600">
                  ${task.spentBudget.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">to agents</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Remaining
                </div>
                <div className="text-xl font-bold text-blue-600">
                  ${(task.totalBudget - task.spentBudget).toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">in escrow</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Supervisor Alerts Tab */}
        <TabsContent value="alerts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Supervisor Log</CardTitle>
              <CardDescription>
                Real-time execution monitoring by the Supervisor Agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {task.alerts?.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No alerts yet.
                  </p>
                ) : (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  task.alerts?.map((alert: any) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-md border text-sm flex gap-3 items-start ${
                        alert.severity === "critical"
                          ? "border-red-200 bg-red-50 text-red-800"
                          : alert.severity === "warning"
                          ? "border-yellow-200 bg-yellow-50 text-yellow-800"
                          : "border-green-200 bg-green-50 text-green-800"
                      }`}
                    >
                      {alert.severity === "critical" ? (
                        <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      ) : alert.severity === "warning" ? (
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      ) : (
                        <Info className="w-4 h-4 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <p className="font-medium mb-1">{alert.message}</p>
                        <p className="text-xs opacity-70">
                          {new Date(alert.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
