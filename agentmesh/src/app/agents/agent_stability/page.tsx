"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ImageIcon, Loader2, Sparkles, Download, RefreshCw } from "lucide-react";

const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "3:2", "2:3", "4:5", "21:9"] as const;
type AspectRatio = typeof ASPECT_RATIOS[number];

const EXAMPLE_PROMPTS = [
  "A futuristic AI agent marketplace on the Monad blockchain, glowing purple neon, cyberpunk",
  "Minimalist web3 dashboard UI, glassmorphism, dark mode, purple accents",
  "A robot orchestrating many AI agents, digital art, vivid colors",
  "Abstract blockchain network visualization, nodes and edges, deep space background",
  "Pixel art of a crypto trading bot in a neon city at night",
  "Surreal digital landscape with floating Monad logos, photorealistic",
];

const AR_STYLE: Record<AspectRatio, string> = {
  "1:1": "aspect-square",
  "16:9": "aspect-video",
  "9:16": "aspect-[9/16] max-w-xs",
  "3:2": "aspect-[3/2]",
  "2:3": "aspect-[2/3] max-w-sm",
  "4:5": "aspect-[4/5] max-w-sm",
  "21:9": "aspect-[21/9]",
};

export default function StabilityAgentPage() {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<{ base64: string; mimeType: string; seed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setImage(null);
    setError(null);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          negative_prompt: negativePrompt || undefined,
          aspect_ratio: aspectRatio,
          agentId: "agent_stability",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setImage({ base64: data.imageBase64, mimeType: data.mimeType, seed: data.seed });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  function download() {
    if (!image) return;
    const a = document.createElement("a");
    a.href = `data:${image.mimeType};base64,${image.base64}`;
    const ext = image.mimeType.split("/")[1];
    a.download = `agentmesh-${image.seed}.${ext}`;
    a.click();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Back */}
      <Link
        href="/agents"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Agents
      </Link>

      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-rose-500 to-pink-700 p-6 text-white shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest opacity-75 mb-1">image generation</div>
            <h1 className="text-3xl font-bold">VisualAI Agent</h1>
            <p className="text-white/80 mt-1 text-sm max-w-lg">
              Generates stunning images from any text prompt using Stability AI&apos;s Stable Diffusion 3.
            </p>
          </div>
          <div className="flex items-center gap-1 bg-white/20 px-3 py-1.5 rounded-full">
            <ImageIcon className="w-4 h-4" />
            <span className="font-bold text-sm">SD3</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {["image generation", "concept art", "UI mockups", "stable diffusion"].map((s) => (
            <span key={s} className="text-xs px-2 py-1 bg-white/15 rounded-full">{s}</span>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        {/* Prompt */}
        <div className="space-y-2">
          <label className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-500" /> Prompt
          </label>
          <textarea
            id="stability-prompt"
            className="w-full min-h-[100px] rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            placeholder="Describe the image you want to create…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate(); }}
          />
          {/* Example prompts */}
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_PROMPTS.map((ex) => (
              <button
                key={ex}
                onClick={() => setPrompt(ex)}
                className="text-xs px-2 py-0.5 rounded-full border bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors truncate max-w-[240px]"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Negative prompt */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Negative Prompt (optional)</label>
          <input
            id="stability-negative-prompt"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            placeholder="e.g. blurry, low quality, watermark"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
          />
        </div>

        {/* Aspect ratio */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Aspect Ratio</label>
          <div className="flex flex-wrap gap-2">
            {ASPECT_RATIOS.map((ar) => (
              <button
                key={ar}
                onClick={() => setAspectRatio(ar)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-mono transition-colors ${
                  aspectRatio === ar
                    ? "bg-rose-500 text-white border-rose-500"
                    : "bg-muted/30 border-transparent hover:bg-muted"
                }`}
              >
                {ar}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pt-1">
          <p className="text-xs text-muted-foreground">Ctrl+Enter to generate · ~5–10s</p>
          <button
            id="generate-image-btn"
            onClick={generate}
            disabled={loading || !prompt.trim()}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
              : <><ImageIcon className="w-4 h-4" /> Generate</>
            }
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Generated Image */}
      {image && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-rose-500" /> Generated Image
            </h2>
            <div className="flex gap-2">
              <button
                onClick={generate}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border hover:bg-muted transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Regenerate
              </button>
              <button
                onClick={download}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            </div>
          </div>

          <div className={`w-full mx-auto overflow-hidden rounded-xl ${AR_STYLE[aspectRatio]}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:${image.mimeType};base64,${image.base64}`}
              alt={prompt}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span className="italic truncate max-w-sm">"{prompt}"</span>
            <span className="font-mono shrink-0 ml-2">seed: {image.seed}</span>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className={`w-full mx-auto rounded-xl bg-muted animate-pulse ${AR_STYLE[aspectRatio]}`} />
      )}
    </div>
  );
}
