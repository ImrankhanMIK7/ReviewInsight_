"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Star, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal 
} from "lucide-react";
import { getRunReviews, ReviewItem } from "@/lib/api";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Filter State
  const [search, setSearch] = useState("");
  const [sentiment, setSentiment] = useState("All");
  const [rating, setRating] = useState("All");
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchReviewsList = () => {
    const runId = localStorage.getItem("selectedRunId");
    if (!runId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getRunReviews(runId, search, sentiment, rating, page, 8)
      .then((res) => {
        setReviews(res.reviews);
        setTotalPages(res.total_pages);
        setTotalCount(res.total);
        setError(null);
      })
      .catch((err) => {
        console.error("Reviews load error:", err);
        setError("Failed to query reviews catalog.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReviewsList();
  }, [search, sentiment, rating, page]);

  // Reset page when filters change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSentimentChange = (val: string) => {
    setSentiment(val);
    setPage(1);
  };

  const handleRatingChange = (val: string) => {
    setRating(val);
    setPage(1);
  };

  const renderStars = (count: number) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`h-3 w-3 ${i < count ? "fill-amber-500" : "text-zinc-700"}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Heading */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">WORKSPACE / DATA VIEWER</span>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
          Review Explorer
          <span className="text-xs font-normal text-zinc-400 bg-[#27272a]/40 border border-zinc-800 px-2 py-0.5 rounded-full">
            {totalCount} total entries
          </span>
        </h1>
      </div>

      {/* Filter / Search Bar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search reviews or reviewer names..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2 bg-black/20 hover:bg-black/35 border border-zinc-800/80 focus:border-violet-500/50 rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none transition-all"
          />
        </div>

        {/* Filters Dropdown Group */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters:
          </div>

          {/* Sentiment Filter */}
          <select
            value={sentiment}
            onChange={(e) => handleSentimentChange(e.target.value)}
            className="px-3 py-1.5 bg-black/20 border border-zinc-800 text-xs text-zinc-350 rounded-xl focus:outline-none cursor-pointer hover:border-zinc-700 transition-all"
          >
            <option value="All" className="bg-[#18181b]">All Sentiments</option>
            <option value="Positive" className="bg-[#18181b]">Positive</option>
            <option value="Neutral" className="bg-[#18181b]">Neutral</option>
            <option value="Negative" className="bg-[#18181b]">Negative</option>
          </select>

          {/* Rating Filter */}
          <select
            value={rating}
            onChange={(e) => handleRatingChange(e.target.value)}
            className="px-3 py-1.5 bg-black/20 border border-zinc-800 text-xs text-zinc-350 rounded-xl focus:outline-none cursor-pointer hover:border-zinc-700 transition-all"
          >
            <option value="All" className="bg-[#18181b]">All Ratings</option>
            <option value="5" className="bg-[#18181b]">5 Stars</option>
            <option value="4" className="bg-[#18181b]">4 Stars</option>
            <option value="3" className="bg-[#18181b]">3 Stars</option>
            <option value="2" className="bg-[#18181b]">2 Stars</option>
            <option value="1" className="bg-[#18181b]">1 Star</option>
          </select>
        </div>

      </div>

      {/* Table Section */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-zinc-800/40">
        
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="h-6 w-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin"></div>
            <span className="text-xs text-zinc-400">Filtering catalog...</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-xs text-red-400">{error}</div>
        ) : reviews.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
            <MessageSquare className="h-8 w-8 text-zinc-600" />
            <span className="text-sm font-semibold text-zinc-400">No matches found</span>
            <span className="text-xs text-zinc-500">Try adjusting search tags or filters</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/60 bg-white/[0.01] text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4.5">Reviewer</th>
                  <th className="py-3.5 px-4.5">Rating</th>
                  <th className="py-3.5 px-4.5">Sentiment</th>
                  <th className="py-3.5 px-4.5 w-1/2">Review Description</th>
                  <th className="py-3.5 px-4.5">Date</th>
                  <th className="py-3.5 px-4.5">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40 text-xs">
                {reviews.map((r) => (
                  <tr 
                    key={r.id}
                    className="hover:bg-white/[0.01] transition-colors group"
                  >
                    <td className="py-4 px-4.5 font-medium text-zinc-200">
                      {r.reviewer}
                    </td>
                    <td className="py-4 px-4.5">
                      <div className="flex flex-col gap-1">
                        {renderStars(r.rating)}
                        {r.is_estimated && (
                          <span className="text-[9px] text-violet-400 font-medium">Inferred</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border ${
                        r.sentiment === "Positive" 
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : r.sentiment === "Negative"
                          ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                          : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                      }`}>
                        {r.sentiment}
                      </span>
                    </td>
                    <td className="py-4 px-4.5 text-zinc-300 leading-relaxed max-w-sm truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all">
                      {r.text}
                    </td>
                    <td className="py-4 px-4.5 text-zinc-400 text-[11px] whitespace-nowrap">
                      {r.date}
                    </td>
                    <td className="py-4 px-4.5 text-zinc-400 text-[11px] whitespace-nowrap">
                      {r.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginated Footer */}
        {!loading && reviews.length > 0 && (
          <div className="px-5 py-3.5 bg-white/[0.01] border-t border-zinc-800/40 flex items-center justify-between text-xs text-zinc-400">
            <span>
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} reviews)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-zinc-850 hover:bg-white/5 disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-zinc-850 hover:bg-white/5 disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
