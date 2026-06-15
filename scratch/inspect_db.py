import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend", "data", "reviews.db")

def main():
    if not os.path.exists(DB_PATH):
        print("Database not found!")
        return
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, filename, total_reviews, avg_rating, pos_reviews, neu_reviews, neg_reviews FROM runs LIMIT 5")
    runs = cursor.fetchall()
    print("--- RUNS IN DATABASE ---")
    for r in runs:
        print(dict(r))
        
    print("\n--- SAMPLE REVIEWS FROM LATEST RUN ---")
    cursor.execute("SELECT reviewer, rating, text, sentiment, is_estimated FROM reviews LIMIT 5")
    reviews = cursor.fetchall()
    for rev in reviews:
        print(dict(rev))
        
    conn.close()

if __name__ == "__main__":
    main()
