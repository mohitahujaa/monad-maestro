"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Link2, CheckCircle2, XCircle } from "lucide-react";

export default function AgentsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [chainStatus, setChainStatus] = useState<any>(null);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((d) => { setAgents(d); setLoading(false); });

    fetch("/api/chain/status")
      .then((r) => r.json())
      .then((d) => setChainStatus(d))
      .catch(() => setChainStatus({ connected: false }));
  }, []);

  const domainColors: Record<string, string> = {
    research: "bg-blue-100 text-blue-800",
    coding: "bg-green-100 text-green-800",
    design: "bg-pink-100 text-pink-800",
    writing: "bg-yellow-100 text-yellow-800",
    testing: "bg-orange-100 text-orange-800",
    data: "bg-purple-100 text-purple-800",
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading agents...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Available Agents</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Scored by reputation · registered on Monad blockchain
          </p>
        </div>

        {/* Chain Status Badge */}
        {chainStatus && (
          <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${
            chainStatus.connected
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-gray-50 border-gray-200 text-gray-600"
          }`}>
            {chainStatus.connected ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-gray-400" />
            )}
            <span className="font-medium">
              {chainStatus.connected
                ? `Monad: ${chainStatus.network} · block #${chainStatus.blockNumber}`
                : "Chain: off-chain mode"}
            </span>
            {chainStatus.walletAddress && (
              <span className="text-xs font-mono opacity-70">
                {chainStatus.walletAddress.slice(0, 8)}…
              </span>
            )}
          </div>
        )}
      </div>

      {/* Contract Status */}
      {chainStatus?.connected && chainStatus.contracts && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(chainStatus.contracts as Record<string, boolean>).map(([name, deployed]) => (
            <span
              key={name}
              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border ${
                deployed
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              <Link2 className="w-3 h-3" />
              {name}: {deployed ? "deployed" : "not found"}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <Card key={agent.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{agent.name}</CardTitle>
                <div className="flex flex-col items-end gap-1">
                  <Badge
                    className={`uppercase text-xs ${domainColors[agent.domain] ?? "bg-gray-100 text-gray-700"}`}
                    variant="secondary"
                  >
                    {agent.domain}
                  </Badge>
                  {agent.registeredOnChain && (
                    <span className="text-xs text-green-600 flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      on-chain
                    </span>
                  )}
                </div>
              </div>
              <CardDescription className="text-sm">{agent.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Reputation */}
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                  <span className="font-semibold">{agent.reputationScore.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">/ 5.0 reputation</span>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1">
                  {agent.skills?.map((skill: string) => (
                    <span
                      key={skill}
                      className="text-xs px-1.5 py-0.5 bg-muted rounded border"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Rate / Budget */}
                <div className="grid grid-cols-2 gap-3 text-sm bg-muted p-3 rounded-md">
                  <div>
                    <span className="block text-muted-foreground text-xs uppercase tracking-wider">
                      Rate
                    </span>
                    <span className="font-medium">${agent.hourlyRate}/task</span>
                  </div>
                  <div>
                    <span className="block text-muted-foreground text-xs uppercase tracking-wider">
                      Max Budget
                    </span>
                    <span className="font-medium">${agent.maxBudget}</span>
                  </div>
                </div>

                {/* Scoring breakdown preview */}
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Scoring formula: </span>
                  reputation×0.6 + successRate×0.25 + skillMatch×0.15
                </div>

                {/* Wallet address */}
                <div className="text-xs font-mono text-muted-foreground truncate">
                  {agent.walletAddress}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
