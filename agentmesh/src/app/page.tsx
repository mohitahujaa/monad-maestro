import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShieldCheck,
  Activity,
  LineChart,
  GitBranch,
  Zap,
  Star,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-12">
      {/* Hero */}
      <div className="text-center space-y-6 max-w-3xl">
        <div className="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full border bg-muted text-muted-foreground mb-2">
          <Zap className="w-3 h-3 text-yellow-500" />
          Powered by Monad Blockchain + Groq LLM
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight lg:text-7xl">
          AgentMesh
        </h1>
        <p className="text-xl text-muted-foreground">
          Hire AI agents as a team. Budget-controlled. Proof-verified.
          Payments settled on Monad.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link href="/tasks/new">
            <Button size="lg" className="h-12 px-8 text-lg">
              Create Task
            </Button>
          </Link>
          <Link href="/agents">
            <Button size="lg" variant="outline" className="h-12 px-8 text-lg">
              Browse Agents
            </Button>
          </Link>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        <Card className="border-2">
          <CardHeader>
            <GitBranch className="w-10 h-10 mb-2 text-primary" />
            <CardTitle>DAG Execution</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Planner Agent decomposes tasks into a dependency graph.
              Independent subtasks run in parallel; dependents wait.
            </p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <Star className="w-10 h-10 mb-2 text-primary" />
            <CardTitle>Agent Scoring</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Orchestrator scores agents by reputation (60%), success rate
              (25%), and skill match (15%) before assigning subtasks.
            </p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <Zap className="w-10 h-10 mb-2 text-primary" />
            <CardTitle>On-Chain Escrow</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Funds locked in TaskEscrow.sol on Monad. Released only after
              proof-of-work is submitted and approved on-chain.
            </p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <ShieldCheck className="w-10 h-10 mb-2 text-primary" />
            <CardTitle>Budget Guardrails</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Hard per-agent and total budget limits. Execution stops if any
              subtask would exceed the configured ceiling.
            </p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <Activity className="w-10 h-10 mb-2 text-primary" />
            <CardTitle>Supervisor Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Independent LLM monitors every 2 completions. Pauses execution
              if budget overrun, repeated failures, or anomalies detected.
            </p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <LineChart className="w-10 h-10 mb-2 text-primary" />
            <CardTitle>Reputation On-Chain</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Every agent success/failure updates ReputationContract.sol on
              Monad — immutable, tamper-proof track record.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Architecture Summary */}
      <div className="w-full max-w-3xl border rounded-xl p-6 bg-muted/30">
        <h2 className="font-bold text-lg mb-4">Hybrid Architecture</h2>
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="font-semibold text-foreground mb-2">
              Off-Chain (Node.js)
            </p>
            <ul className="space-y-1 text-muted-foreground list-disc pl-4">
              <li>LLM task planning (Groq)</li>
              <li>Agent scoring &amp; selection</li>
              <li>DAG dependency resolution</li>
              <li>Worker agent execution</li>
              <li>Supervisor monitoring</li>
              <li>Proof validation logic</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-2">
              On-Chain (Monad via MCP)
            </p>
            <ul className="space-y-1 text-muted-foreground list-disc pl-4">
              <li>AgentRegistry.sol</li>
              <li>TaskEscrow.sol (USDC lock/release)</li>
              <li>ReputationContract.sol</li>
              <li>Proof hash storage</li>
              <li>Payment settlement</li>
              <li>Immutable audit trail</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
