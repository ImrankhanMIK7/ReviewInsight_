"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { 
  BarChart3, 
  UploadCloud, 
  Sparkles, 
  ListFilter, 
  Moon, 
  Sun, 
  History,
  TrendingUp,
  Layers
} from "lucide-react";
import { getRuns } from "@/lib/api";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [runs, setRuns] = useState<Array<{ id: string; filename: string; created_at: string; total_reviews: number; avg_rating: number }>>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const pathname = usePathname();
  const router = useRouter();

  // Handle Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    const initialTheme = savedTheme || "dark";
    setTheme(initialTheme);
    document.documentElement.className = initialTheme;
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.className = newTheme;
  };

  // Fetch runs on mount & when pathname updates (e.g. after upload completes)
  const fetchHistory = async () => {
    try {
      const data = await getRuns();
      setRuns(data);
      
      // Auto select latest run if none is set
      const storedRunId = localStorage.getItem("selectedRunId");
      if (storedRunId && data.some(r => r.id === storedRunId)) {
        setSelectedRunId(storedRunId);
      } else if (data.length > 0) {
        setSelectedRunId(data[0].id);
        localStorage.setItem("selectedRunId", data[0].id);
      }
    } catch (err) {
      console.error("Error loading history:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [pathname]);

  const handleRunChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedRunId(id);
    localStorage.setItem("selectedRunId", id);
    // Refresh page or trigger client state updates
    router.refresh();
  };

  const navItems = [
    { name: "Upload File", path: "/upload", icon: UploadCloud, requiresRun: false },
    { name: "Dashboard", path: "/", icon: BarChart3, requiresRun: true },
    { name: "AI Insights", path: "/insights", icon: Sparkles, requiresRun: true },
    { name: "Review Explorer", path: "/reviews", icon: ListFilter, requiresRun: true },
  ];

  return (
    <html lang="en" className={theme}>
      <head>
        <title>ReviewInsight AI - SaaS Review Analysis Platform</title>
        <meta name="description" content="AI-powered local customer review insights dashboard." />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
        
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 glass-panel border-r border-[#27272a]/40 p-5 flex flex-col gap-6 shrink-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-violet-600/30 border border-violet-500/40 text-violet-400">
                <Layers className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-violet-400 to-indigo-200 bg-clip-text text-transparent">
                ReviewInsight AI
              </span>
            </div>
            
            <button 
              onClick={toggleTheme}
              className="p-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-[#27272a] text-zinc-400 hover:text-white transition-all"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          {/* Active Dataset Dropdown Selector */}
          <div className="flex flex-col gap-1.5 bg-white/[0.02] border border-[#27272a]/55 rounded-xl p-3">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <History className="h-3 w-3" />
              Analysis Dataset
            </label>
            {runs.length === 0 ? (
              <span className="text-xs text-zinc-500 italic">No uploads found</span>
            ) : (
              <select
                value={selectedRunId}
                onChange={handleRunChange}
                className="bg-transparent text-xs text-zinc-200 font-medium focus:outline-none w-full cursor-pointer"
              >
                {runs.map((r) => (
                  <option key={r.id} value={r.id} className="bg-[#18181b] text-zinc-200">
                    {r.filename.length > 22 ? r.filename.substring(0, 19) + "..." : r.filename}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Nav Links */}
          <nav className="flex flex-col gap-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              const isDisabled = item.requiresRun && !selectedRunId;
              
              if (isDisabled) return null;

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-violet-600/15 text-violet-400 border border-violet-500/20 shadow-[0_0_15px_-3px_rgba(139,92,246,0.15)]"
                      : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Simple SaaS footer */}
          <div className="text-[10px] text-zinc-600 text-center border-t border-[#27272a]/20 pt-4">
            Platform Engine v1.0.0
            <br />
            Powered by local NLP models
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
