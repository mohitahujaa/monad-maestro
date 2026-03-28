"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export function Navigation() {
  const [chainConnected, setChainConnected] = useState<boolean | null>(null);
  const [blockNumber, setBlockNumber] = useState<number | null>(null);

  useEffect(() => {
    const check = () => {
      fetch("/api/chain/status")
        .then((r) => r.json())
        .then((d) => {
          setChainConnected(d.connected);
          setBlockNumber(d.blockNumber);
        })
        .catch(() => setChainConnected(false));
    };
    check();
    const iv = setInterval(check, 15000);
    return () => clearInterval(iv);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold text-xl tracking-tight">AgentMesh</span>
        </Link>

        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link
            href="/agents"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Agents
          </Link>
          <Link
            href="/tasks"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Tasks
          </Link>
          <Link href="/tasks/new">
            <Button size="sm">Create Task</Button>
          </Link>

          {/* Chain Status Indicator */}
          {chainConnected !== null && (
            <div
              className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border ${
                chainConnected
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-gray-50 border-gray-200 text-gray-500"
              }`}
              title={
                chainConnected
                  ? `Monad connected · block #${blockNumber}`
                  : "Chain not connected — off-chain mode"
              }
            >
              <Zap
                className={`w-3 h-3 ${
                  chainConnected ? "text-yellow-500" : "text-gray-400"
                }`}
              />
              <span>
                {chainConnected
                  ? `#${blockNumber?.toLocaleString()}`
                  : "off-chain"}
              </span>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
