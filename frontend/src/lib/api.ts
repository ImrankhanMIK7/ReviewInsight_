const BASE_URL = ""; // Relative path so rewrites proxy correctly

export interface RunMetadata {
  id: string;
  filename: string;
  created_at: string;
  total_reviews: number;
  avg_rating: number;
  pos_reviews: number;
  neu_reviews: number;
  neg_reviews: number;
}

export interface RunDetailsResponse {
  metadata: RunMetadata;
  rating_distribution: Array<{ rating: number; count: number }>;
  trends: Array<{ date: string; count: number; avg_rating: number }>;
}

export interface KeywordMetric {
  keyword: string;
  score: number;
}

export interface RunInsightsResponse {
  summary: string;
  likes: string[];
  dislikes: string[];
  complaints: string[];
  suggestions: string[];
  keywords: KeywordMetric[];
}

export interface ReviewItem {
  id: number;
  reviewer: string;
  rating: number;
  text: string;
  date: string;
  source: string;
  sentiment: string;
  sentiment_score: number;
  subjectivity: number;
  is_estimated: boolean;
}

export interface RunReviewsResponse {
  reviews: ReviewItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  
  const res = await fetch(`${BASE_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });
  
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || "Failed to upload and analyze file.");
  }
  
  return res.json() as Promise<{
    run_id: string;
    filename: string;
    total_reviews: number;
    avg_rating: number;
    detected_columns: Record<string, string>;
  }>;
}

export async function getRuns() {
  const res = await fetch(`${BASE_URL}/api/runs`);
  if (!res.ok) throw new Error("Failed to fetch analysis history.");
  return res.json() as Promise<Array<{ id: string; filename: string; created_at: string; total_reviews: number; avg_rating: number }>>;
}

export async function getRunDetails(runId: string) {
  const res = await fetch(`${BASE_URL}/api/runs/${runId}`);
  if (!res.ok) throw new Error("Failed to fetch run details.");
  return res.json() as Promise<RunDetailsResponse>;
}

export async function getRunInsights(runId: string) {
  const res = await fetch(`${BASE_URL}/api/runs/${runId}/insights`);
  if (!res.ok) throw new Error("Failed to fetch run insights.");
  return res.json() as Promise<RunInsightsResponse>;
}

export async function getRunReviews(
  runId: string, 
  search = "", 
  sentiment = "All", 
  rating = "All", 
  page = 1, 
  limit = 10
) {
  const query = new URLSearchParams({
    search,
    sentiment,
    rating,
    page: String(page),
    limit: String(limit),
  });
  
  const res = await fetch(`${BASE_URL}/api/runs/${runId}/reviews?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch reviews.");
  return res.json() as Promise<RunReviewsResponse>;
}

export function getExportLink(runId: string, format = "csv"): string {
  return `/api/runs/${runId}/export?format=${format}`;
}
