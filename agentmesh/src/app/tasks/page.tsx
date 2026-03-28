"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink, Zap } from "lucide-react";

const MONAD_EXPLORER = "https://testnet.monadexplorer.com/tx/";

export default function TasksPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = () => {
      fetch("/api/tasks")
        .then((r) => r.json())
        .then((d) => { setTasks(d); setLoading(false); });
    };
    fetchTasks();
    const iv = setInterval(fetchTasks, 5000);
    return () => clearInterval(iv);
  }, []);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading tasks...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground text-sm mt-1">
            All tasks — orchestrated off-chain, settled on Monad
          </p>
        </div>
        <Link href="/tasks/new">
          <Button>New Task</Button>
        </Link>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Spent</TableHead>
              <TableHead>Subtasks</TableHead>
              <TableHead>Escrow Tx</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => {
              const completed = task.subtasks?.filter(
                (s: { status: string }) => s.status === "completed"
              ).length ?? 0;
              const total = task.subtasks?.length ?? 0;
              return (
                <TableRow key={task.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Link
                      href={`/tasks/${task.id}`}
                      className="block font-medium hover:text-blue-600"
                    >
                      {task.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        task.status === "completed"
                          ? "default"
                          : task.status === "paused"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>${task.totalBudget}</TableCell>
                  <TableCell className={task.spentBudget > task.totalBudget * 0.9 ? "text-red-600 font-semibold" : ""}>
                    ${task.spentBudget.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {total > 0 ? (
                      <span className={completed === total ? "text-green-600 font-medium" : ""}>
                        {completed}/{total}
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    {task.escrowTxHash ? (
                      <a
                        href={MONAD_EXPLORER + task.escrowTxHash}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-mono text-blue-600 hover:underline"
                      >
                        <Zap className="w-3 h-3 text-yellow-500" />
                        {task.escrowTxHash.slice(0, 8)}…
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              );
            })}
            {tasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No tasks yet.{" "}
                  <Link href="/tasks/new" className="text-blue-600 hover:underline">
                    Create one to get started.
                  </Link>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
