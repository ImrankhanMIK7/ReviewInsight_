from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import pandas as pd
import json
import uuid
import io
from typing import Optional, List, Dict, Any

from utils.detector import detect_columns
from utils.cleaner import clean_data
from utils.analyzer import run_analysis_pipeline
from utils.summarizer import summarize_reviews
import database

app = FastAPI(title="ReviewInsight AI API", version="1.0.0")

# Enable CORS for localhost frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    database.init_db()

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    filename = file.filename
    content = await file.read()
    
    # Try reading file based on extension
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content))
        elif filename.endswith(".json"):
            df = pd.read_json(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload CSV, XLSX, or JSON.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")
        
    if df.empty:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
        
    # Auto-detect column maps
    mapping = detect_columns(df)
    
    # Clean data
    cleaned_df = clean_data(df, mapping)
    if cleaned_df.empty:
        raise HTTPException(status_code=400, detail="No valid review entries found in dataset after cleaning.")
        
    # Sentiment & rating inference
    analyzed_df = run_analysis_pipeline(cleaned_df)
    
    # Generate NLP local summaries
    summary_data = summarize_reviews(analyzed_df)
    
    # Compute metrics
    total_reviews = len(analyzed_df)
    avg_rating = float(analyzed_df["rating"].mean()) if total_reviews > 0 else 0.0
    
    sentiment_counts = analyzed_df["sentiment"].value_counts().to_dict()
    pos_count = int(sentiment_counts.get("Positive", 0))
    neu_count = int(sentiment_counts.get("Neutral", 0))
    neg_count = int(sentiment_counts.get("Negative", 0))
    
    # Generate unique run ID
    run_id = str(uuid.uuid4())
    
    # Prepare reviews payload for database
    reviews_list = analyzed_df.to_dict(orient="records")
    
    # Save to Database
    database.save_run(
        run_id=run_id,
        filename=filename,
        total_reviews=total_reviews,
        avg_rating=avg_rating,
        pos_reviews=pos_count,
        neu_reviews=neu_count,
        neg_reviews=neg_count,
        summary_data=summary_data,
        reviews_list=reviews_list
    )
    
    return {
        "run_id": run_id,
        "filename": filename,
        "total_reviews": total_reviews,
        "avg_rating": avg_rating,
        "detected_columns": {k: v for k, v in mapping.items() if v is not None}
    }

@app.get("/api/runs")
def list_runs():
    return database.get_all_runs()

@app.get("/api/runs/{run_id}")
def get_run_details(run_id: str):
    run = database.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Analysis run not found.")
        
    # Get rating distributions
    conn = database.get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT rating, COUNT(*) as count FROM reviews WHERE run_id = ? GROUP BY rating", (run_id,))
    rating_rows = cursor.fetchall()
    
    rating_dist = {i: 0 for i in range(1, 6)}
    for r in rating_rows:
        rating_dist[r["rating"]] = r["count"]
        
    # Get review trends over time (group by date)
    cursor.execute("SELECT date, COUNT(*) as count, AVG(rating) as avg_rating FROM reviews WHERE run_id = ? GROUP BY date ORDER BY date ASC", (run_id,))
    trend_rows = cursor.fetchall()
    conn.close()
    
    trends = [{"date": r["date"], "count": r["count"], "avg_rating": round(r["avg_rating"], 2)} for r in trend_rows]
    
    return {
        "metadata": {
            "id": run["id"],
            "filename": run["filename"],
            "created_at": run["created_at"],
            "total_reviews": run["total_reviews"],
            "avg_rating": round(run["avg_rating"], 2),
            "pos_reviews": run["pos_reviews"],
            "neu_reviews": run["neu_reviews"],
            "neg_reviews": run["neg_reviews"]
        },
        "rating_distribution": [{"rating": k, "count": v} for k, v in rating_dist.items()],
        "trends": trends
    }

@app.get("/api/runs/{run_id}/insights")
def get_run_insights(run_id: str):
    run = database.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Analysis run not found.")
    return run["summary"]

@app.get("/api/runs/{run_id}/reviews")
def get_run_reviews(
    run_id: str,
    search: str = Query("", description="Search term for reviews or reviewer names"),
    sentiment: str = Query("All", description="Filter by sentiment (Positive, Neutral, Negative, All)"),
    rating: str = Query("All", description="Filter by star rating (1-5, All)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page")
):
    reviews, total = database.get_reviews_for_run(run_id, search, sentiment, rating, page, limit)
    return {
        "reviews": reviews,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit
    }

@app.get("/api/runs/{run_id}/export")
def export_run_data(run_id: str, format: str = "csv"):
    conn = database.get_connection()
    query = "SELECT reviewer, rating, text, date, source, sentiment, sentiment_score, subjectivity, is_estimated FROM reviews WHERE run_id = ?"
    df = pd.read_sql_query(query, conn, params=[run_id])
    conn.close()
    
    if df.empty:
        raise HTTPException(status_code=404, detail="No reviews found to export.")
        
    if format == "xlsx":
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name="Analyzed Reviews")
        output.seek(0)
        headers = {
            'Content-Disposition': f'attachment; filename="analyzed_reviews_{run_id}.xlsx"'
        }
        return StreamingResponse(output, headers=headers, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    else:
        # Default to csv
        stream = io.StringIO()
        df.to_csv(stream, index=False)
        response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
        response.headers["Content-Disposition"] = f"attachment; filename=analyzed_reviews_{run_id}.csv"
        return response

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
