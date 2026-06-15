import sqlite3
import os
import json
from datetime import datetime
from typing import Dict, List, Any, Tuple, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "reviews.db")

def get_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Create runs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS runs (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        created_at TEXT NOT NULL,
        total_reviews INTEGER NOT NULL,
        avg_rating REAL NOT NULL,
        pos_reviews INTEGER NOT NULL,
        neu_reviews INTEGER NOT NULL,
        neg_reviews INTEGER NOT NULL,
        summary_json TEXT NOT NULL
    )
    """)
    
    # Create reviews table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id TEXT NOT NULL,
        reviewer TEXT,
        rating INTEGER,
        text TEXT,
        date TEXT,
        source TEXT,
        sentiment_score REAL,
        subjectivity REAL,
        sentiment TEXT,
        is_estimated INTEGER,
        FOREIGN KEY (run_id) REFERENCES runs (id) ON DELETE CASCADE
    )
    """)
    
    conn.commit()
    conn.close()

def save_run(
    run_id: str,
    filename: str,
    total_reviews: int,
    avg_rating: float,
    pos_reviews: int,
    neu_reviews: int,
    neg_reviews: int,
    summary_data: Dict[str, Any],
    reviews_list: List[Dict[str, Any]]
):
    conn = get_connection()
    cursor = conn.cursor()
    
    created_at = datetime.now().isoformat()
    summary_json = json.dumps(summary_data)
    
    cursor.execute(
        "INSERT INTO runs (id, filename, created_at, total_reviews, avg_rating, pos_reviews, neu_reviews, neg_reviews, summary_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (run_id, filename, created_at, total_reviews, avg_rating, pos_reviews, neu_reviews, neg_reviews, summary_json)
    )
    
    # Batch insert reviews
    reviews_data = [
        (
            run_id,
            r.get("reviewer", "Anonymous"),
            r.get("rating"),
            r.get("text"),
            r.get("date"),
            r.get("source"),
            r.get("sentiment_score", 0.0),
            r.get("subjectivity", 0.0),
            r.get("sentiment", "Neutral"),
            1 if r.get("is_estimated") else 0
        )
        for r in reviews_list
    ]
    
    cursor.executemany(
        "INSERT INTO reviews (run_id, reviewer, rating, text, date, source, sentiment_score, subjectivity, sentiment, is_estimated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        reviews_data
    )
    
    conn.commit()
    conn.close()

def get_run(run_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM runs WHERE id = ?", (run_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        res = dict(row)
        res["summary"] = json.loads(res["summary_json"])
        del res["summary_json"]
        return res
    return None

def get_all_runs() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, filename, created_at, total_reviews, avg_rating FROM runs ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_reviews_for_run(
    run_id: str, 
    search: str = "", 
    sentiment: str = "All", 
    rating: str = "All", 
    page: int = 1, 
    limit: int = 10
) -> Tuple[List[Dict[str, Any]], int]:
    conn = get_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM reviews WHERE run_id = ?"
    params = [run_id]
    
    if search:
        query += " AND (text LIKE ? OR reviewer LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])
        
    if sentiment != "All":
        query += " AND sentiment = ?"
        params.append(sentiment)
        
    if rating != "All":
        query += " AND rating = ?"
        params.append(int(rating))
        
    # Count total
    count_query = query.replace("SELECT *", "SELECT COUNT(*)")
    cursor.execute(count_query, params)
    total_count = cursor.fetchone()[0]
    
    # Paginated select
    query += " ORDER BY id DESC LIMIT ? OFFSET ?"
    offset = (page - 1) * limit
    params.extend([limit, offset])
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(r) for r in rows], total_count
