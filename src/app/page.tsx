"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  MessageSquare, 
  Star, 
  Smile, 
  Frown, 
  Meh, 
  TrendingUp,
  FileSpreadsheet,
  ArrowRight,
  TrendingDown,
  UploadCloud,
  FileDown
} from "lucide-react";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  AreaChart, 
  Area 
} from "recharts";
import { getRunDetails, getExportLink, RunDetailsResponse } from "@/lib/api";

const SENTIMENT_COLORS = {
  Positive: "#10b981", // Emerald
  Neutral: "#6366f1",  // Indigo
  Negative: "#f43f5e",  // Rose
};

export default function DashboardPage() {
  const [data, setData] = useState<RunDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const runId = localStorage.getItem("selectedRunId");
    if (!runId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getRunDetails(runId)
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => {
        console.error("Dashboard error:", err);
        setError("Could not load analytics. The run may have been deleted or the backend is offline.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin"></div>
        <span className="text-sm text-zinc-400">Loading analysis dashboard...</span>
      </div>
    );
  }

  // Empty State
  if (!data) {
    return (
      <div className="max-w-md mx-auto text-center py-20 flex flex-col items-center gap-6">
        <div className="p-4 rounded-full bg-violet-600/10 text-violet-400 border border-violet-500/20">
          <UploadCloud className="h-10 w-10" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold text-zinc-150">Welcome to ReviewInsight AI</h2>
          <p className="text-sm text-zinc-400">
            Upload a CSV, Excel, or JSON customer reviews file to unlock the visual analytics workspace.
          </p>
        </div>
        <button
          onClick={() => router.push("/upload")}
          className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl text-sm flex items-center gap-2 transition-all shadow-[0_0_20px_-3px_rgba(139,92,246,0.25)]"
        >
          Upload Your First File
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const { metadata, rating_distribution, trends } = data;

  // Pie chart data
  const pieData = [
    { name: "Positive", value: metadata.pos_reviews, color: SENTIMENT_COLORS.Positive },
    { name: "Neutral", value: metadata.neu_reviews, color: SENTIMENT_COLORS.Neutral },
    { name: "Negative", value: metadata.neg_reviews, color: SENTIMENT_COLORS.Negative },
  ].filter(item => item.value > 0);

  const kpis = [
    { name: "Total Reviews", value: metadata.total_reviews, icon: MessageSquare, desc: "Aggregated review count", color: "text-zinc-400 bg-zinc-900/40" },
    { name: "Average Rating", value: `${metadata.avg_rating} / 5.0`, icon: Star, desc: "Overall customer score", color: "text-amber-400 bg-amber-500/10" },
    { name: "Positive Sentiment", value: `${((metadata.pos_reviews / metadata.total_reviews) * 100).toFixed(0)}%`, icon: Smile, desc: `${metadata.pos_reviews} reviews`, color: "text-emerald-400 bg-emerald-500/10" },
    { name: "Negative Sentiment", value: `${((metadata.neg_reviews / metadata.total_reviews) * 100).toFixed(0)}%`, icon: Frown, desc: `${metadata.neg_reviews} reviews`, color: "text-rose-400 bg-rose-500/10" },
  ];

  return (
    <div className="flex flex-col gap-8">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">WORKSPACE / ANALYTICS</span>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            Dashboard
            <span className="text-xs font-normal text-zinc-400 bg-[#27272a]/40 border border-zinc-800 px-2 py-0.5 rounded-full">
              {metadata.filename}
            </span>
          </h1>
        </div>

        {/* Exports Buttons */}
        <div className="flex items-center gap-2.5">
          <a
            href={getExportLink(metadata.id, "csv")}
            className="px-3.5 py-2 hover:bg-white/5 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-medium flex items-center gap-2 transition-all"
            download
          >
            <FileDown className="h-3.5 w-3.5" />
            CSV Export
          </a>
          <a
            href={getExportLink(metadata.id, "xlsx")}
            className="px-3.5 py-2 hover:bg-white/5 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-medium flex items-center gap-2 transition-all"
            download
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Excel Export
          </a>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-panel glass-panel-hover rounded-2xl p-5 flex items-center justify-between"
            >
              <div className="flex flex-col gap-1">
                <span className="text-xs text-zinc-500 font-semibold">{kpi.name}</span>
                <span className="text-2xl font-bold text-zinc-100">{kpi.value}</span>
                <span className="text-[10px] text-zinc-400 mt-1">{kpi.desc}</span>
              </div>
              <div className={`p-3 rounded-xl border border-zinc-800/30 ${kpi.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sentiment Distribution Pie Chart */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-zinc-200">Sentiment Distribution</h3>
            <span className="text-[10px] text-zinc-500">Breakdown of positive, neutral, & negative comments</span>
          </div>
          
          <div className="h-60 relative flex items-center justify-center">
            {pieData.length === 0 ? (
              <span className="text-xs text-zinc-500 italic">No sentiment records found</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "rgba(24, 24, 27, 0.95)",
                      border: "1px solid rgba(63, 63, 70, 0.4)",
                      borderRadius: "8px",
                      color: "#f4f4f5",
                      fontSize: "11px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            
            {/* Center Summary */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-zinc-150">{metadata.total_reviews}</span>
              <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Reviews</span>
            </div>
          </div>

          {/* Legends */}
          <div className="flex items-center justify-around text-xs mt-1 border-t border-zinc-850 pt-3">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                <span className="text-zinc-300 font-medium">{d.name} ({((d.value / metadata.total_reviews) * 100).toFixed(0)}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rating Distribution Bar Chart */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4 lg:col-span-2">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-zinc-200">Rating Distribution</h3>
            <span className="text-[10px] text-zinc-500">Frequency mapping of 1-star to 5-star ratings</span>
          </div>

          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={rating_distribution}>
                <XAxis 
                  dataKey="rating" 
                  stroke="#71717a" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val} ★`}
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255, 255, 255, 0.03)" }}
                  contentStyle={{
                    background: "rgba(24, 24, 27, 0.95)",
                    border: "1px solid rgba(63, 63, 70, 0.4)",
                    borderRadius: "8px",
                    color: "#f4f4f5",
                    fontSize: "11px",
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="url(#ratingGrad)" 
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                />
                <defs>
                  <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.85} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Review Volume Trend Timeline Chart */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4 lg:col-span-3">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-zinc-200">Review Timeline Trends</h3>
            <span className="text-[10px] text-zinc-500">Tracking daily feedback volumes & customer sentiment trajectories</span>
          </div>

          <div className="h-64 mt-2">
            {trends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500 italic">
                Timeline trend details not available (insufficient date formatting info)
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <XAxis 
                    dataKey="date" 
                    stroke="#71717a" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#71717a" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(24, 24, 27, 0.95)",
                      border: "1px solid rgba(63, 63, 70, 0.4)",
                      borderRadius: "8px",
                      color: "#f4f4f5",
                      fontSize: "11px",
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#trendGrad)" 
                    name="Reviews Count"
                  />
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
