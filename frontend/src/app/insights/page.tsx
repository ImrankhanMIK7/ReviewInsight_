"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquareWarning, 
  HelpCircle,
  Lightbulb,
  Search,
  Tag
} from "lucide-react";
import { getRunInsights, RunInsightsResponse } from "@/lib/api";

export default function InsightsPage() {
  const [data, setData] = useState<RunInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const runId = localStorage.getItem("selectedRunId");
    if (!runId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getRunInsights(runId)
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => {
        console.error("Insights load error:", err);
        setError("Unable to load NLP insights.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin"></div>
        <span className="text-sm text-zinc-400">Compiling local NLP summaries & key phrases...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-md mx-auto text-center py-20 flex flex-col items-center gap-4">
        <div className="p-4 rounded-full bg-zinc-900 text-zinc-500">
          <Sparkles className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-bold text-zinc-200">No Dataset Uploaded</h2>
        <p className="text-sm text-zinc-400">Please upload a review file first to view AI-powered summaries.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      
      {/* Page Heading */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">WORKSPACE / AI SUMMARIES</span>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
          Customer Insights
          <span className="text-xs font-normal text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Local NLP Active
          </span>
        </h1>
      </div>

      {/* Executive Summary Callout */}
      <div className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-violet-500/20">
        <div className="absolute top-0 right-0 h-40 w-40 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex gap-4">
          <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 shrink-0 h-fit">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-zinc-200">Executive Summary</h2>
            <p className="text-zinc-350 text-sm leading-relaxed max-w-4xl">{data.summary}</p>
          </div>
        </div>
      </div>

      {/* Likes and Dislikes side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Likes */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2.5 text-emerald-400">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <ThumbsUp className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-semibold text-sm text-zinc-200">What Customers Like</h3>
          </div>
          <ul className="flex flex-col gap-3">
            {data.likes.map((like, i) => (
              <li key={i} className="text-zinc-300 text-xs flex gap-2.5 items-start">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5"></span>
                <span className="leading-relaxed">{like}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Dislikes */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2.5 text-rose-400">
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <ThumbsDown className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-semibold text-sm text-zinc-200">What Customers Dislike</h3>
          </div>
          <ul className="flex flex-col gap-3">
            {data.dislikes.map((dislike, i) => (
              <li key={i} className="text-zinc-300 text-xs flex gap-2.5 items-start">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5"></span>
                <span className="leading-relaxed">{dislike}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Complaints and Suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Common Complaints */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4 md:col-span-2">
          <div className="flex items-center gap-2.5 text-amber-400">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <MessageSquareWarning className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-semibold text-sm text-zinc-200">Common Complaints</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-1">
            {data.complaints.map((comp, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-white/[0.01] border border-zinc-800/80 flex flex-col gap-1.5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase">Issue Case #{i+1}</span>
                <p className="text-zinc-300 text-xs leading-relaxed">{comp}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Suggestions */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2.5 text-violet-400">
            <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <Lightbulb className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-semibold text-sm text-zinc-200">Improvement Suggestions</h3>
          </div>
          <ul className="flex flex-col gap-3">
            {data.suggestions.map((sug, i) => (
              <li key={i} className="text-zinc-300 text-xs flex gap-2.5 items-start">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shrink-0 mt-1.5"></span>
                <span className="leading-relaxed">{sug}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Keywords Badge Section */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-zinc-400" />
          <h3 className="font-semibold text-sm text-zinc-200">Most Discussed Keywords</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.keywords.map((kw, i) => (
            <div 
              key={i} 
              className="px-3 py-1.5 rounded-xl bg-white/[0.02] border border-zinc-800 text-xs text-zinc-300 font-medium flex items-center gap-2 hover:border-violet-500/35 transition-all"
            >
              <span>{kw.keyword}</span>
              <span className="text-[9px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 font-bold">
                {kw.score.toFixed(3)}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
