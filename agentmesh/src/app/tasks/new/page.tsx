"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NewTaskPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    totalBudget: 100,
    deadline: "",
    maxRetries: 3,
    maxToolCalls: 10,
    limits: {
      research: 10,
      coding: 20,
      design: 15,
      writing: 10,
      testing: 15,
      data: 15,
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ["totalBudget", "maxRetries", "maxToolCalls"].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const handleLimitChange = (domain: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      limits: { ...prev.limits, [domain]: Number(value) },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          totalBudget: formData.totalBudget,
          perAgentLimits: formData.limits,
          maxRetries: formData.maxRetries,
          maxToolCalls: formData.maxToolCalls,
        }),
      });

      if (!res.ok) throw new Error("Failed to create task");

      const task = await res.json();
      router.push(`/tasks/${task.id}`);
    } catch (err) {
      console.error(err);
      alert("Error creating task. Check console.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Create New Task</h1>
        <p className="text-muted-foreground">
          Define the task and set strict budget guardrails for the autonomous agents.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
            <CardDescription>
              What do you want the agent workforce to accomplish?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Build a modern landing page"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Provide detailed instructions..."
                rows={5}
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalBudget">Total Budget ($USDC)</Label>
                <Input
                  id="totalBudget"
                  name="totalBudget"
                  type="number"
                  min="1"
                  value={formData.totalBudget}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  name="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={handleChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Guardrails</CardTitle>
            <CardDescription>
              Set maximum limits per agent type to prevent overspending loops.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxRetries">Max Retries per Subtask</Label>
                <Input
                  id="maxRetries"
                  name="maxRetries"
                  type="number"
                  min="0"
                  max="10"
                  value={formData.maxRetries}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxToolCalls">Max Tool Calls per Spin</Label>
                <Input
                  id="maxToolCalls"
                  name="maxToolCalls"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.maxToolCalls}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Individual Agent Limits ($USDC)</Label>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(formData.limits).map(([domain, limit]) => (
                  <div key={domain} className="space-y-1 bg-muted/50 p-3 rounded-md">
                    <Label className="uppercase text-xs tracking-wider text-muted-foreground">
                      {domain} Agent
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={limit}
                      onChange={(e) => handleLimitChange(domain, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pb-12">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="w-40">
            {loading ? "Planning..." : "Create Task"}
          </Button>
        </div>
      </form>
    </div>
  );
}
